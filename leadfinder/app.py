"""Веб-приложение: API + интерфейс."""
import asyncio
import csv
import datetime as dt
import io
import json
import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import audit, osm
from .config import CITY, DB_PATH, NICHES, ROOT
from .messages import build_messages
from .mockup import THEMES, render_mockup
from .models import Company
from .storage import Storage

log = logging.getLogger(__name__)

STATUSES = {"new": "Новый", "contacted": "Написал", "replied": "Ответил",
            "deal": "Клиент", "rejected": "Отказ"}
KINDS = {"no_site": "Нет сайта", "social_only": "Только соцсети",
         "bad_site": "Слабый сайт", "ok": "Хороший сайт", "unchecked": "Не проверен"}


class ScanRequest(BaseModel):
    niches: list[str] = list(NICHES)
    audit: bool = True


class UpdateRequest(BaseModel):
    status: str | None = None
    note: str | None = None


def create_app(storage: Storage | None = None) -> FastAPI:
    app = FastAPI(title="LeadFinder")
    store = storage or Storage(DB_PATH)
    job = {"running": False, "stage": "idle", "done": 0, "total": 0, "message": "", "error": None}

    def card(c: Company) -> dict:
        return {**c.model_dump(exclude={"audit"}), "priority": c.priority,
                "score": c.audit.score if c.audit else None,
                "issues_count": len(c.audit.issues) if c.audit else 0}

    async def run_scan(req: ScanRequest):
        job.update(running=True, stage="search", done=0, total=0, error=None,
                   message=f"Ищу компании в {CITY}е в OpenStreetMap…")
        try:
            companies = await osm.fetch_companies(req.niches, CITY, lambda m: job.update(message=m))
            job.update(message=f"Найдено компаний: {len(companies)}")
            if req.audit:
                with_site = [c for c in companies if c.website]
                job.update(stage="audit", total=len(with_site), message="Проверяю сайты…")

                def progress(done, total, name):
                    job.update(done=done, total=total, message=f"Проверен сайт: {name}")

                await audit.audit_companies(companies, progress)
            store.clear_demo()
            store.upsert(companies)
            store.set_meta("last_scan", dt.datetime.now().isoformat(timespec="minutes"))
            leads = sum(c.kind in ("no_site", "social_only", "bad_site") for c in companies)
            job.update(stage="done", message=f"Готово: {len(companies)} компаний, из них потенциальных клиентов — {leads}")
        except Exception as exc:  # показываем пользователю понятную ошибку
            log.exception("Поиск не удался")
            job.update(stage="error", error=str(exc), message=str(exc))
        finally:
            job["running"] = False

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
        }

    @app.post("/api/scan")
    async def scan(req: ScanRequest):
        if job["running"]:
            raise HTTPException(409, "Поиск уже идёт")
        bad = [n for n in req.niches if n not in NICHES]
        if bad or not req.niches:
            raise HTTPException(400, "Выберите хотя бы одну нишу")
        app.state.scan_task = asyncio.create_task(run_scan(req))  # держим ссылку, чтобы задачу не собрал GC
        return {"ok": True}

    @app.get("/api/scan/status")
    def scan_status():
        return job

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
