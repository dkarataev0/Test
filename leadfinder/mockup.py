"""Индивидуальный макет сайта компании из шаблона под нишу."""
import datetime as dt
import re
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .config import ROOT, niche_of
from .messages import prepositional, quoted
from .mockup_content import CATEGORY_PALETTE, content_for, photo
from .models import Company

env = Environment(loader=FileSystemLoader(ROOT / "templates"),
                  autoescape=select_autoescape(["html"]))

def _pal(bg, surface, ink, muted, accent, accent_ink, soft, line):
    return dict(bg=bg, surface=surface, ink=ink, muted=muted, accent=accent,
                accent_ink=accent_ink, soft=soft, line=line)


# У каждой ниши - свой дизайн (шаблон и шрифты) и три палитры на выбор
PALETTES = {
    "beauty": [
        _pal("#F6F1F3", "#FFFFFF", "#2B1D2A", "#6E5D6B", "#8E3A62", "#FFFFFF", "#EEDFE6", "#E2D3DA"),
        _pal("#F2F4F1", "#FFFFFF", "#1F2A24", "#5C6B62", "#3F6B57", "#FFFFFF", "#E1E9E3", "#D5DED8"),
        _pal("#1D1A24", "#28242F", "#F3EEF4", "#B3A9B8", "#D9A7C0", "#1D1A24", "#2E2936", "#3B3543"),
    ],
    "sauna": [
        _pal("#F4F1EB", "#FFFFFF", "#22201C", "#6B655C", "#8A5A2B", "#FFFFFF", "#E8DCCB", "#E2D9CC"),
        _pal("#EEF2F3", "#FFFFFF", "#1B2A30", "#5A6B71", "#2F6F7E", "#FFFFFF", "#D7E5E8", "#D3DEE1"),
        _pal("#1A1715", "#24201D", "#F2ECE4", "#B4A99C", "#E07A3F", "#1A1715", "#2C2724", "#3A332E"),
    ],
    "leisure": [
        None,  # палитра категории
        _pal("#F4F8F7", "#FFFFFF", "#12302B", "#55706A", "#0F7A6C", "#FFFFFF", "#FFD27A", "#DCE8E5"),
        _pal("#121722", "#1B2130", "#F1F3F8", "#A5ADC0", "#FFB547", "#121722", "#262E40", "#2E3649"),
    ],
    "education": [
        None,
        _pal("#F6F7FF", "#FFFFFF", "#1A1B3A", "#5B5E80", "#4F46E5", "#FFFFFF", "#FFD166", "#E2E4F6"),
        _pal("#151426", "#1F1D36", "#F3F2FA", "#ABA8C8", "#7DD3FC", "#151426", "#2A2846", "#34315A"),
    ],
}
THEMES = [{"name": "Вариант 1"}, {"name": "Вариант 2"}, {"name": "Вариант 3"}]

FONTS = {
    "beauty": "family=Prata&family=Manrope:wght@400;500;600;700",
    "sauna": "family=Forum&family=Manrope:wght@400;500;600;700",
    "leisure": "family=Unbounded:wght@500;600&family=Manrope:wght@400;500;600;700;800",
    "education": "family=Unbounded:wght@500;600&family=Manrope:wght@400;500;600;700;800",
}
DISPLAY_FONT = {"beauty": "Prata", "sauna": "Forum", "leisure": "Unbounded", "education": "Unbounded"}
# Шаблон страницы: с онлайн-записью по времени или с формой обратного звонка
TEMPLATE = {"beauty": "beauty", "sauna": "beauty", "leisure": "services", "education": "services"}
CTA_ANCHOR = {"beauty": "book", "sauna": "book", "leisure": "callback", "education": "callback"}


def palette(c: Company, variant: int) -> dict:
    pal = PALETTES[niche_of(c.niche)][variant % 3]
    if pal is None:
        main, second = CATEGORY_PALETTE.get(c.category, ("#0E6E73", "#F6C344"))
        pal = _pal("#F7F8F6", "#FFFFFF", "#16201C", "#5D6763", main, "#FFFFFF", second, "#E3E6E3")
    return pal


DAYS = {"Mo": "Пн", "Tu": "Вт", "We": "Ср", "Th": "Чт", "Fr": "Пт", "Sa": "Сб", "Su": "Вс",
        "PH": "праздники", "off": "выходной", "closed": "выходной"}


def humanize_hours(value: str | None) -> list[str]:
    if not value:
        return ["Пн-Вс: 09:00-20:00"]
    if value.strip() == "24/7":
        return ["Круглосуточно"]
    out = []
    for part in value.split(";"):
        part = part.strip()
        if not part:
            continue
        part = re.sub(r"\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|off|closed)\b", lambda m: DAYS[m.group(1)], part)
        part = part.replace(",", ", ")
        part = re.sub(r"^([А-Яа-я, -]+?)\s+(\d)", r"\1: \2", part)
        out.append(part)
    return out


def phone_digits(phone: str | None) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    return digits


def render_mockup(c: Company, city: str, variant: int = 0) -> str:
    city = c.city or city
    niche = niche_of(c.niche)
    variant = variant % 3
    x = content_for(niche, c.category)
    map_url = None
    if c.lat and c.lon:
        d = 0.004
        map_url = ("https://www.openstreetmap.org/export/embed.html?bbox="
                   f"{c.lon - d},{c.lat - d},{c.lon + d},{c.lat + d}&layer=mapnik&marker={c.lat},{c.lon}")
    digits = phone_digits(c.phone)
    return env.get_template(f"mockup/{TEMPLATE[niche]}.html").render(
        c=c, x=x, city=city, city_in=prepositional(city), year=dt.date.today().year,
        variant=variant, p=palette(c, variant), fonts=FONTS[niche], display_font=DISPLAY_FONT[niche], cta_anchor=CTA_ANCHOR[niche],
        photos=[photo(k) for k in x["photos"]],
        hours=humanize_hours(c.opening_hours), map_url=map_url,
        phone_digits=digits, qname=quoted(c.name),
        wa_link=(f"https://wa.me/{digits}?text=" + quote(f"Здравствуйте! Пишу с сайта {quoted(c.name)}")) if digits else None,
    )
