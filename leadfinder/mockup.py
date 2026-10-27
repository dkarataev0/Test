"""Индивидуальный макет сайта компании из шаблона под нишу."""
import datetime as dt
import re
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .config import ROOT
from .messages import quoted
from .mockup_content import SERVICES_PALETTE, content_for, photo
from .models import Company

env = Environment(loader=FileSystemLoader(ROOT / "templates"),
                  autoescape=select_autoescape(["html"]))

def _pal(bg, surface, ink, muted, accent, accent_ink, soft, line):
    return dict(bg=bg, surface=surface, ink=ink, muted=muted, accent=accent,
                accent_ink=accent_ink, soft=soft, line=line)


# У каждой ниши — свой дизайн (шаблон и шрифты) и три палитры на выбор
PALETTES = {
    "beauty": [
        _pal("#F6F1F3", "#FFFFFF", "#2B1D2A", "#6E5D6B", "#8E3A62", "#FFFFFF", "#EEDFE6", "#E2D3DA"),
        _pal("#F2F4F1", "#FFFFFF", "#1F2A24", "#5C6B62", "#3F6B57", "#FFFFFF", "#E1E9E3", "#D5DED8"),
        _pal("#1D1A24", "#28242F", "#F3EEF4", "#B3A9B8", "#D9A7C0", "#1D1A24", "#2E2936", "#3B3543"),
    ],
    "food": [
        _pal("#FFFFFF", "#FFFFFF", "#1C1A17", "#5E5A52", "#1F3B2D", "#F4F0E6", "#F4E2B0", "#E6E2D8"),
        _pal("#FFFFFF", "#FFFFFF", "#221A16", "#6A5B52", "#B3392A", "#FFF7EE", "#FBE3D6", "#EADBD2"),
        _pal("#17191C", "#22252A", "#F2EFE9", "#A9A49B", "#E8B23A", "#17191C", "#2A2D33", "#33373E"),
    ],
    "auto": [
        _pal("#EEF0F2", "#FFFFFF", "#1B2733", "#5B6672", "#FF6B1A", "#1B2733", "#E1E5E9", "#D3D9DF"),
        _pal("#EEF1F6", "#FFFFFF", "#14213D", "#56617A", "#2F6BFF", "#FFFFFF", "#E0E6F0", "#D0D8E6"),
        _pal("#F2F1EE", "#FFFFFF", "#222222", "#5F5D58", "#FFC21A", "#1B1B1B", "#E6E4DE", "#D8D6CF"),
    ],
    "services": [
        None,  # подставляется палитра категории
        _pal("#F5F7F7", "#FFFFFF", "#132326", "#5A6668", "#0E6E73", "#FFFFFF", "#F6C344", "#E0E6E6"),
        _pal("#15181D", "#1F232A", "#F1F2F4", "#A3A8B1", "#8FB8FF", "#15181D", "#2A2F37", "#30353D"),
    ],
}
THEMES = [{"name": "Вариант 1"}, {"name": "Вариант 2"}, {"name": "Вариант 3"}]

FONTS = {
    "beauty": "family=Prata&family=Manrope:wght@400;500;600;700",
    "food": "family=Dela+Gothic+One&family=Golos+Text:wght@400;500;600;700",
    "auto": "family=Tektur:wght@500;700&family=Golos+Text:wght@400;500;600;700",
    "services": "family=Unbounded:wght@500;600&family=Manrope:wght@400;500;600;700;800",
}
CTA_ANCHOR = {"beauty": "book", "food": "menu", "auto": "calc", "services": "callback"}


def palette(c: Company, variant: int) -> dict:
    pal = PALETTES[c.niche][variant % 3]
    if pal is None:
        main, second = SERVICES_PALETTE.get(c.category, ("#0E6E73", "#F6C344"))
        pal = _pal("#F7F8F6", "#FFFFFF", "#16201C", "#5D6763", main, "#FFFFFF", second, "#E3E6E3")
    return pal


def prepositional(city: str) -> str:
    """Краснодар → Краснодаре (для типичных названий на согласную)."""
    return city + "е" if city and city[-1].lower() in "бвгдзклмнпрстфхцчшщ" else city


DAYS = {"Mo": "Пн", "Tu": "Вт", "We": "Ср", "Th": "Чт", "Fr": "Пт", "Sa": "Сб", "Su": "Вс",
        "PH": "праздники", "off": "выходной", "closed": "выходной"}


def humanize_hours(value: str | None) -> list[str]:
    if not value:
        return ["Пн–Вс: 09:00–20:00"]
    if value.strip() == "24/7":
        return ["Круглосуточно"]
    out = []
    for part in value.split(";"):
        part = part.strip()
        if not part:
            continue
        part = re.sub(r"\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|off|closed)\b", lambda m: DAYS[m.group(1)], part)
        part = part.replace("-", "–").replace(",", ", ")
        part = re.sub(r"^([А-Яа-я–, ]+?)\s+(\d)", r"\1: \2", part)
        out.append(part)
    return out


def phone_digits(phone: str | None) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    return digits


def render_mockup(c: Company, city: str, variant: int = 0) -> str:
    x = content_for(c.niche, c.category)
    map_url = None
    if c.lat and c.lon:
        d = 0.004
        map_url = ("https://www.openstreetmap.org/export/embed.html?bbox="
                   f"{c.lon - d},{c.lat - d},{c.lon + d},{c.lat + d}&layer=mapnik&marker={c.lat},{c.lon}")
    digits = phone_digits(c.phone)
    return env.get_template(f"mockup/{c.niche}.html").render(
        c=c, x=x, city=city, city_in=prepositional(city), year=dt.date.today().year,
        p=palette(c, variant), fonts=FONTS[c.niche], cta_anchor=CTA_ANCHOR[c.niche],
        photos=[photo(k) for k in x["photos"]],
        hours=humanize_hours(c.opening_hours), map_url=map_url,
        phone_digits=digits, qname=quoted(c.name),
        wa_link=(f"https://wa.me/{digits}?text=" + quote(f"Здравствуйте! Пишу с сайта {quoted(c.name)}")) if digits else None,
    )
