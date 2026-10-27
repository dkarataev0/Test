import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# На Vercel файловая система только для чтения, кроме /tmp (там нужен DATABASE_URL)
_default_data = Path("/tmp/leadfinder") if os.getenv("VERCEL") else ROOT.parent / "data"
DATA_DIR = Path(os.getenv("LEADFINDER_DATA", _default_data))
DB_PATH = DATA_DIR / "leads.db"

CITY = os.getenv("LEADFINDER_CITY", "Краснодар")
# Границы поиска: юг,запад,север,восток. Поиск по прямоугольнику в разы быстрее поиска по названию города.
CITY_BBOX = os.getenv("LEADFINDER_BBOX", "44.97,38.82,45.19,39.22")

# Где искать: город (быстро, по прямоугольнику) или весь край (по границе региона в OSM)
REGIONS = {
    "city": {"label": CITY, "bbox": CITY_BBOX},
    "krai": {"label": "Краснодарский край", "area": 'area["ISO3166-2"="RU-KDA"]'},
}

OVERPASS_URLS = os.getenv("LEADFINDER_OVERPASS", ",".join([
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
])).split(",")
# Общий бюджет времени на поиск (лимит функции Vercel - 300 с)
OVERPASS_BUDGET = 120

# Порог: сайт с оценкой ниже считается «требует обновления»
BAD_SITE_SCORE = 60

# Ниши: метки OSM -> человеческое название категории
NICHES = {
    "beauty": {
        "label": "Красота и здоровье",
        "tags": {
            ("shop", "hairdresser"): "Парикмахерская",
            ("shop", "beauty"): "Салон красоты",
            ("shop", "massage"): "Массаж",
            ("shop", "tattoo"): "Тату-студия",
            ("amenity", "dentist"): "Стоматология",
            ("leisure", "fitness_centre"): "Фитнес",
        },
    },
    "services": {
        "label": "Магазины и услуги",
        "tags": {
            ("shop", "florist"): "Цветы",
            ("shop", "tailor"): "Ателье",
            ("craft", "tailor"): "Ателье",
            ("amenity", "veterinary"): "Ветклиника",
            ("shop", "pet"): "Зоомагазин",
            ("office", "lawyer"): "Юрист",
            ("shop", "photo"): "Фотостудия",
        },
    },
}

# Домены, которые не считаются полноценным сайтом
SOCIAL_DOMAINS = (
    "vk.com", "vk.ru", "instagram.com", "t.me", "telegram.me", "facebook.com",
    "ok.ru", "wa.me", "taplink.cc", "taplink.ws", "linktr.ee", "2gis.ru",
    "yandex.ru/maps", "dikidi.net", "youtube.com",
)
FREE_BUILDERS = (
    "tilda.ws", "wixsite.com", "ucoz.", "narod.ru", "nethouse.ru", "ukit.me",
    "jimdo", "blogspot.", "wordpress.com", "tb.ru", "mya5.ru", "uid.me",
)


def niche_of(niche: str) -> str:
    """Ниша для текстов и макетов. Записи из удалённых ниш показываем как «услуги»."""
    return niche if niche in NICHES else "services"
