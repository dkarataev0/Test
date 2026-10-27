"""Поиск компаний в OpenStreetMap через Overpass API."""
import logging
import time

import httpx

from .config import CITY, NICHES, OVERPASS_BUDGET, OVERPASS_URLS, SOCIAL_DOMAINS
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


def build_query(niches: list[str], city: str = CITY) -> str:
    parts = []
    for niche in niches:
        for (key, value) in NICHES[niche]["tags"]:
            parts.append(f'  nwr["{key}"="{value}"]["name"](area.city);')
    body = "\n".join(parts)
    return (
        "[out:json][timeout:110];\n"
        f'area["name"="{city}"]["boundary"="administrative"]->.city;\n'
        f"(\n{body}\n);\nout center tags;"
    )


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
    query = build_query(niches, city)
    last_error: Exception | None = None
    deadline = time.monotonic() + OVERPASS_BUDGET
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=15),
                                 headers={"User-Agent": "LeadFinder/1.0"}) as client:
        for i, url in enumerate(OVERPASS_URLS, 1):
            if on_status:
                on_status(f"Запрос к OpenStreetMap (сервер {i} из {len(OVERPASS_URLS)})…")
            left = deadline - time.monotonic()
            if left < 10:
                break
            try:
                log.info("Overpass: %s", url)
                r = await client.post(url, data={"data": query},
                                      timeout=httpx.Timeout(min(120, left), connect=15))
                r.raise_for_status()
                return parse_elements(r.json().get("elements", []))
            except (httpx.HTTPError, ValueError) as exc:
                log.warning("Overpass %s недоступен: %s", url, exc)
                last_error = exc
    raise RuntimeError(
        "Не удалось получить данные из OpenStreetMap — все серверы Overpass недоступны. "
        "Проверьте интернет и попробуйте позже."
    ) from last_error
