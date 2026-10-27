"""Быстрая оценка качества сайта: доступность, мобильность, HTTPS, свежесть."""
import asyncio
import ipaddress
import socket
import datetime as dt
import re
import time

import httpx
from selectolax.lexbor import LexborHTMLParser as HTMLParser

from .config import BAD_SITE_SCORE, FREE_BUILDERS
from .models import Audit, Company

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
}

# (ключ, штраф, текст проблемы для клиента)
PENALTIES = {
    "https": (15, "Нет защищённого соединения (HTTPS) - браузер пишет «Не защищено»"),
    "mobile": (20, "Сайт не адаптирован под телефоны"),
    "fast": (10, "Сайт долго загружается"),
    "title": (5, "Нет заголовка страницы для поисковиков"),
    "description": (5, "Нет описания для Яндекса и Google"),
    "fresh": (15, "Сайт давно не обновлялся"),
    "modern": (10, "Устаревшие технологии вёрстки"),
    "own_domain": (10, "Сайт на бесплатном конструкторе, без своего домена"),
    "favicon": (3, "Нет иконки сайта во вкладке браузера"),
    "light": (5, "Страница слишком тяжёлая"),
}

YEAR_RE = re.compile(r"(?:©|&copy;|copyright|\(c\))\s*(?:\d{4}\s*[-\u2013\u2014]\s*)?((?:19|20)\d{2})", re.I)


def analyze_html(html: str, final_url: str, load_time: float, size: int,
                 today: dt.date | None = None) -> Audit:
    today = today or dt.date.today()
    tree = HTMLParser(html)
    low = html.lower()

    years = [int(y) for y in YEAR_RE.findall(html)]
    head_text = (tree.css_first("title").text(strip=True) if tree.css_first("title") else "")
    desc = tree.css_first('meta[name="description"]')
    old_markup = (
        len(tree.css("table table")) > 0
        or bool(tree.css("font, marquee, center, frameset"))
        or ".swf" in low
        or bool(re.search(r"jquery[-.]?1\.[0-7]", low))
    )

    checks = {
        "https": final_url.startswith("https://"),
        "mobile": tree.css_first('meta[name="viewport"]') is not None,
        "fast": load_time < 3.0,
        "title": len(head_text) > 3,
        "description": bool(desc and (desc.attributes.get("content") or "").strip()),
        "fresh": not years or max(years) >= today.year - 2,
        "modern": not old_markup,
        "own_domain": not any(b in final_url.lower() for b in FREE_BUILDERS),
        "favicon": bool(tree.css_first('link[rel*="icon"]')) or "favicon" in low,
        "light": size < 3_000_000,
    }
    issues, score = [], 100
    for key, ok in checks.items():
        if not ok:
            penalty, text = PENALTIES[key]
            score -= penalty
            if key == "fresh":
                text += f" (последний год на сайте - {max(years)})"
            if key == "fast":
                text += f" ({load_time:.1f} с)"
            issues.append(text)
    return Audit(score=max(score, 0), reachable=True, final_url=final_url,
                 load_time=round(load_time, 2), issues=issues, checks=checks)


class BlockedHost(httpx.HTTPError):
    """Адрес из внутренней сети: такие сайты не проверяем."""


async def _only_public(request: httpx.Request) -> None:
    """Не даём проверке сайтов ходить во внутреннюю сеть (в том числе через редиректы)."""
    host = request.url.host
    try:
        infos = await asyncio.to_thread(socket.getaddrinfo, host, None)
    except OSError:
        return  # не резолвится - запрос сам упадёт с понятной ошибкой
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise BlockedHost(f"внутренний адрес {host}")


async def _get(client: httpx.AsyncClient, url: str) -> httpx.Response | None:
    try:
        return await client.get(url)
    except httpx.HTTPError:
        return None


async def audit_site(client: httpx.AsyncClient, insecure: httpx.AsyncClient, url: str) -> Audit:
    """client проверяет сертификат; insecure - запасной, для сайтов с битым SSL."""
    start = time.monotonic()
    r = await _get(client, url)
    bad_cert = False
    if r is None and url.startswith("http://"):
        r = await _get(client, "https://" + url[7:])
    if r is None:
        r = await _get(insecure, url)
        bad_cert = r is not None and str(r.url).startswith("https://")
    if r is None:
        return Audit(score=0, issues=["Сайт не открылся при проверке - откройте его сами, чтобы убедиться"])
    elapsed = time.monotonic() - start
    if r.status_code >= 400:
        return Audit(score=0, final_url=str(r.url),
                     issues=[f"Сайт отвечает ошибкой {r.status_code}"])
    audit = analyze_html(r.text, str(r.url), elapsed, len(r.content))
    if bad_cert:
        audit.score = max(audit.score - 40, 0)  # критично: браузер пугает посетителей
        audit.checks["https"] = False
        audit.issues.insert(0, "Недействительный сертификат безопасности - браузер показывает предупреждение")
    return audit


def kind_from_audit(audit: Audit) -> str:
    return "ok" if audit.reachable and audit.score >= BAD_SITE_SCORE else "bad_site"


async def audit_companies(companies: list[Company], on_progress=None, concurrency: int = 8) -> None:
    targets = [c for c in companies if c.website]
    sem = asyncio.Semaphore(concurrency)
    done = 0
    opts = dict(headers=HEADERS, follow_redirects=True, timeout=httpx.Timeout(15, connect=8),
                event_hooks={"request": [_only_public]})
    async with httpx.AsyncClient(**opts) as client, \
            httpx.AsyncClient(verify=False, **opts) as insecure:
        async def one(c: Company):
            nonlocal done
            async with sem:
                c.audit = await audit_site(client, insecure, c.website)
                c.kind = kind_from_audit(c.audit)
            done += 1
            if on_progress:
                on_progress(done, len(targets), c.name)

        await asyncio.gather(*(one(c) for c in targets))
