"""Веб-приложение: API + интерфейс."""
import asyncio
import csv
import datetime as dt
import io
import hashlib
import hmac
import json
import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import (FileResponse, HTMLResponse, JSONResponse, RedirectResponse,
                               StreamingResponse)
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import audit, osm
from .config import CITY, DB_PATH, NICHES, ROOT
from .messages import build_messages
from .mockup import THEMES, render_mockup
from .models import Company
from .storage import Storage, StorageUnavailable, get_storage

log = logging.getLogger(__name__)

COOKIE = "lf_session"

STATUSES = {"new": "Новый", "contacted": "Написал", "replied": "Ответил",
            "deal": "Клиент", "rejected": "Отказ"}
KINDS = {"no_site": "Нет сайта", "social_only": "Только соцсети",
         "bad_site": "Слабый сайт", "ok": "Хороший сайт", "unchecked": "Не проверен"}


class ScanRequest(BaseModel):
    niches: list[str] = list(NICHES)


class UpdateRequest(BaseModel):
    status: str | None = None
    note: str | None = None


class LoginRequest(BaseModel):
    password: str


AUDIT_BATCH = 12  # сайтов за один запрос — укладываемся в лимит времени serverless-функции
PUBLIC_PATHS = ("/login", "/api/login", "/api/health", "/mockup/", "/static/login")


def create_app(storage: Storage | None = None, password: str | None = None) -> FastAPI:
    app = FastAPI(title="LeadFinder")
    store = storage or get_storage(DB_PATH)
    password = password if password is not None else os.getenv("LEADFINDER_PASSWORD", "")
    token = hmac.new(password.encode(), b"leadfinder-session", hashlib.sha256).hexdigest()

    @app.middleware("http")
    async def require_login(request: Request, call_next):
        path = request.url.path
        if not password or path.startswith(PUBLIC_PATHS) or \
                hmac.compare_digest(request.cookies.get(COOKIE, ""), token):
            return await call_next(request)
        if path.startswith("/api/"):
            return JSONResponse({"detail": "Нужно войти"}, status_code=401)
        return RedirectResponse("/login")

    @app.exception_handler(StorageUnavailable)
    async def storage_error(request: Request, exc: StorageUnavailable):
        log.error("База данных недоступна: %s", exc)
        return JSONResponse({"detail": f"База данных недоступна: {exc}"}, status_code=503)

    @app.get("/api/health")
    def health():
        try:
            store.get_meta("last_scan")
            return {"ok": True}
        except StorageUnavailable as exc:
            return JSONResponse({"ok": False, "error": str(exc)}, status_code=503)

    @app.get("/api/diag/overpass")
    async def diag_overpass():
        """Временная диагностика доступности зеркал Overpass с сервера."""
        import time
        import httpx
        urls = osm.OVERPASS_URLS + ["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
                                    "https://overpass.osm.ch/api/interpreter"]
        out = {}
        async with httpx.AsyncClient(timeout=20, headers={"User-Agent": osm.USER_AGENT}) as c:
            async def one(u):
                t = time.monotonic()
                try:
                    r = await c.post(u, data={"data": "[out:json];node(1);out;"})
                    out[u] = f"{r.status_code} {time.monotonic() - t:.1f}s {r.text[:80]!r}"
                except Exception as e:
                    out[u] = f"{type(e).__name__} {time.monotonic() - t:.1f}s"
            await asyncio.gather(*(one(u) for u in urls))
        return out

    @app.get("/login", response_class=HTMLResponse)
    def login_page():
        return (ROOT / "static" / "login.html").read_text(encoding="utf-8")

    @app.post("/api/login")
    async def login(req: LoginRequest):
        if not password or not hmac.compare_digest(req.password.encode(), password.encode()):
            await asyncio.sleep(1)  # замедляем перебор
            raise HTTPException(401, "Неверный пароль")
        resp = JSONResponse({"ok": True})
        resp.set_cookie(COOKIE, token, max_age=60 * 60 * 24 * 90, httponly=True,
                        samesite="lax", secure=os.getenv("VERCEL") == "1")
        return resp

    @app.post("/api/logout")
    def logout():
        resp = JSONResponse({"ok": True})
        resp.delete_cookie(COOKIE)
        return resp

    def card(c: Company) -> dict:
        return {**c.model_dump(exclude={"audit"}), "priority": c.priority,
                "score": c.audit.score if c.audit else None,
                "issues_count": len(c.audit.issues) if c.audit else 0}

    def pending_audit() -> list[Company]:
        return [c for c in store.all() if c.website and c.kind == "unchecked"]

    # Поиск идёт шагами по запросу из браузера: так он работает и локально,
    # и на хостинге, где фоновые задачи не живут дольше одного запроса.
    @app.post("/api/scan/search")
    async def scan_search(req: ScanRequest):
        if not req.niches or any(n not in NICHES for n in req.niches):
            raise HTTPException(400, "Выберите хотя бы одну нишу")
        try:
            companies = await osm.fetch_companies(req.niches, CITY)
        except RuntimeError as exc:
            raise HTTPException(502, str(exc))
        # уже проверенные сайты не проверяем повторно
        known = {c.id: c for c in store.all()}
        for c in companies:
            old = known.get(c.id)
            if old and old.audit and old.website == c.website:
                c.audit, c.kind = old.audit, old.kind
        store.clear_demo()
        store.upsert(companies)
        store.set_meta("last_scan", dt.datetime.now().isoformat(timespec="minutes"))
        return {"found": len(companies), "to_audit": sum(1 for c in companies if c.website and c.kind == "unchecked")}

    @app.post("/api/scan/audit")
    async def scan_audit():
        batch = pending_audit()[:AUDIT_BATCH]
        await audit.audit_companies(batch)
        store.upsert(batch)
        return {"checked": len(batch), "remaining": len(pending_audit()),
                "last": batch[-1].name if batch else None}

    @app.get("/api/meta")
    def meta():
        items = store.all()
        counts = {k: sum(c.kind == k for c in items) for k in KINDS}
        return {
            "city": CITY,
            "niches": {k: v["label"] for k, v in NICHES.items()},
            "statuses": STATUSES, "kinds": KINDS,
            "themes": [t["name"] for t in THEMES],
            "total": len(items), "counts": counts,
            "in_work": sum(c.status in ("contacted", "replied") for c in items),
            "deals": sum(c.status == "deal" for c in items),
            "last_scan": store.get_meta("last_scan"),
            "demo": any(c.demo for c in items),
            "pending_audit": sum(1 for c in items if c.website and c.kind == "unchecked"),
            "auth": bool(password),
        }

    @app.post("/api/demo")
    def load_demo():
        data = json.loads((ROOT / "demo_data.json").read_text(encoding="utf-8"))
        store.upsert([Company(**d, demo=True) for d in data])
        return {"ok": True, "count": len(data)}

    @app.get("/api/companies")
    def companies(niche: str = "", kind: str = "", status: str = "", q: str = ""):
        items = store.all()
        if niche:
            items = [c for c in items if c.niche == niche]
        if kind == "leads":
            items = [c for c in items if c.kind in ("no_site", "social_only", "bad_site")]
        elif kind:
            items = [c for c in items if c.kind == kind]
        if status:
            items = [c for c in items if c.status == status]
        if q:
            ql = q.lower()
            items = [c for c in items if ql in c.name.lower() or ql in (c.address or "").lower()
                     or ql in c.category.lower()]
        items.sort(key=lambda c: (-c.priority, c.name))
        return [card(c) for c in items]

    @app.get("/api/companies/{cid}")
    def company(cid: str):
        c = store.get(cid)
        if not c:
            raise HTTPException(404, "Компания не найдена")
        return {**c.model_dump(), "priority": c.priority, "messages": build_messages(c, CITY)}

    @app.patch("/api/companies/{cid}")
    def update(cid: str, req: UpdateRequest):
        if not store.get(cid):
            raise HTTPException(404, "Компания не найдена")
        if req.status and req.status not in STATUSES:
            raise HTTPException(400, "Неизвестный статус")
        store.update(cid, req.status, req.note)
        return {"ok": True}

    @app.get("/mockup/{cid}", response_class=HTMLResponse)
    def mockup(cid: str, variant: int = 0, download: bool = False):
        c = store.get(cid)
        if not c:
            raise HTTPException(404, "Компания не найдена")
        headers = {}
        if download:
            headers["Content-Disposition"] = f'attachment; filename="mockup-{cid}.html"'
        return HTMLResponse(render_mockup(c, CITY, variant), headers=headers)

    @app.get("/api/export.csv")
    def export():
        buf = io.StringIO()
        w = csv.writer(buf, delimiter=";")
        w.writerow(["Название", "Категория", "Адрес", "Телефон", "Email", "Сайт", "Соцсети",
                    "Тип", "Оценка сайта", "Проблемы", "Статус", "Заметка"])
        for c in sorted(store.all(), key=lambda c: -c.priority):
            w.writerow([c.name, c.category, c.address or "", c.phone or "", c.email or "",
                        c.website or "", " ".join(c.socials.values()), KINDS[c.kind],
                        c.audit.score if c.audit else "", "; ".join(c.audit.issues) if c.audit else "",
                        STATUSES.get(c.status, c.status), c.note])
        data = "﻿" + buf.getvalue()  # BOM, чтобы Excel понял кириллицу
        return StreamingResponse(iter([data]), media_type="text/csv; charset=utf-8",
                                 headers={"Content-Disposition": 'attachment; filename="leads.csv"'})

    app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")

    @app.get("/")
    def index():
        return FileResponse(ROOT / "static" / "index.html")

    return app


app = create_app()
