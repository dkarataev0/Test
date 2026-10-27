"""Поиск компаний в OpenStreetMap через Overpass API."""
import asyncio
import logging

import httpx

from .config import CITY, CITY_BBOX, NICHES, OVERPASS_BUDGET, OVERPASS_URLS, SOCIAL_DOMAINS

USER_AGENT = "LeadFinder/1.0 (+https://github.com/dkarataev0/Test)"
from .models import Company

log = logging.getLogger(__name__)

SOCIAL_KEYS = {
    "contact:vk": "vk", "vk": "vk",
    "contact:instagram": "instagram", "instagram": "instagram",
    "contact:telegram": "telegram", "telegram": "telegram",
    "contact:whatsapp": "whatsapp", "whatsapp": "whatsapp",
    "contact:facebook": "facebook", "facebook": "facebook",
    "contact:ok": "ok",
}


def build_query(niches: list[str], bbox: str = CITY_BBOX) -> str:
    parts = []
    for niche in niches:
        for (key, value) in NICHES[niche]["tags"]:
            parts.append(f'  nwr["{key}"="{value}"]["name"];')
    body = "\n".join(parts)
    return f"[out:json][timeout:90][bbox:{bbox}];\n(\n{body}\n);\nout center tags;"


def _clean_url(url: str) -> str:
    url = url.strip().split(";")[0].strip()
    if url and not url.startswith(("http://", "https://")):
        url = "http://" + url
    return url


def _social_link(kind: str, value: str) -> str:
    value = value.strip()
    if value.startswith("http"):
        return value
    handle = value.lstrip("@")
    return {
        "vk": f"https://vk.com/{handle}",
        "instagram": f"https://instagram.com/{handle}",
        "telegram": f"https://t.me/{handle}",
        "whatsapp": "https://wa.me/" + "".join(c for c in handle if c.isdigit()),
        "facebook": f"https://facebook.com/{handle}",
        "ok": f"https://ok.ru/{handle}",
    }.get(kind, value)


def is_social(url: str) -> bool:
    low = url.lower()
    return any(d in low for d in SOCIAL_DOMAINS)


def classify(tags: dict[str, str]) -> tuple[str, str] | None:
    for niche, conf in NICHES.items():
        for (key, value), label in conf["tags"].items():
            if tags.get(key) == value:
                return niche, label
    return None


def parse_elements(elements: list[dict]) -> list[Company]:
    companies: dict[str, Company] = {}
    for el in elements:
        tags = el.get("tags") or {}
        name = tags.get("name", "").strip()
        found = classify(tags)
        if not name or not found:
            continue
        # Сетевые бренды (есть brand/brand:wikidata) — не наш клиент
        if tags.get("brand") or tags.get("brand:wikidata"):
            continue
        niche, category = found

        street = tags.get("addr:street")
        house = tags.get("addr:housenumber")
        address = ", ".join(p for p in (street, house) if p) or tags.get("addr:full")

        socials = {}
        for key, kind in SOCIAL_KEYS.items():
            if tags.get(key):
                socials.setdefault(kind, _social_link(kind, tags[key]))

        website = tags.get("website") or tags.get("contact:website") or tags.get("url")
        website = _clean_url(website) if website else None
        if website and is_social(website):
            socials.setdefault("link", website)
            website = None

        center = el.get("center") or el
        company = Company(
            id=f'{el["type"][0]}{el["id"]}',
            name=name,
            niche=niche,
            category=category,
            address=address,
            phone=(tags.get("phone") or tags.get("contact:phone") or "").split(";")[0].strip() or None,
            email=(tags.get("email") or tags.get("contact:email") or "").split(";")[0].strip() or None,
            website=website,
            socials=socials,
            opening_hours=tags.get("opening_hours"),
            lat=center.get("lat"),
            lon=center.get("lon"),
        )
        if not website:
            company.kind = "social_only" if socials else "no_site"
        companies[company.id] = company
    return list(companies.values())


async def fetch_companies(niches: list[str], city: str = CITY, on_status=None) -> list[Company]:
    """Опрашивает все зеркала Overpass параллельно и берёт первый успешный ответ."""
    query = build_query(niches)
    timeout = httpx.Timeout(OVERPASS_BUDGET, connect=15)
    errors: list[str] = []
    if on_status:
        on_status("Запрос к OpenStreetMap…")

    async with httpx.AsyncClient(timeout=timeout, headers={"User-Agent": USER_AGENT}) as client:
        async def ask(url: str) -> list[dict]:
            r = await client.post(url, data={"data": query})
            r.raise_for_status()
            data = r.json()
            remark = data.get("remark") or ""
            if "elements" not in data or (not data["elements"] and "error" in remark.lower()):
                raise ValueError(remark or "пустой ответ")
            return data["elements"]

        tasks = {asyncio.create_task(ask(u)): u for u in OVERPASS_URLS}
        try:
            for fut in asyncio.as_completed(tasks):
                try:
                    return parse_elements(await fut)
                except (httpx.HTTPError, ValueError) as exc:
                    reason = (f"HTTP {exc.response.status_code}" if isinstance(exc, httpx.HTTPStatusError)
                              else type(exc).__name__ if not str(exc) else str(exc)[:120])
                    errors.append(reason)
                    log.warning("Overpass недоступен: %s", reason)
        finally:
            for t in tasks:
                t.cancel()
    raise RuntimeError(
        "Не удалось получить данные из OpenStreetMap — серверы Overpass не ответили "
        f"({'; '.join(errors)}). Попробуйте ещё раз через пару минут."
    )
