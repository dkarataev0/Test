"""Шаблоны первого сообщения клиенту.

Плейсхолдеры [Ваше имя], [Ваш телефон], [Портфолио] подставляет интерфейс
из настроек пользователя.
"""
from .config import niche_of
from .models import Company
from .outreach import after_reply, first_message


def quoted(name: str) -> str:
    """«Ромашка», но без двойных кавычек, если они уже есть в названии."""
    return name if "«" in name or '"' in name else f"«{name}»"

BENEFITS = {
    "beauty": "онлайн-запись 24/7, прайс и примеры работ - клиенты записываются сами, даже ночью",
    "sauna": "онлайн-бронь свободных часов, цены и фото залов - гости бронируют сами, без звонков",
    "leisure": "фото, цены и онлайн-бронь без комиссий агрегаторов - гости бронируют напрямую",
    "education": "расписание, цены и запись на пробное занятие - родители записываются сами, даже вечером",
    "other": "понятный прайс, отзывы и заявка в WhatsApp прямо с сайта",
}
SEARCH_HINT = {
    "beauty": "«салон красоты {city}»",
    "sauna": "«сауна {city}» или «баня с бассейном {city}»",
    "leisure": "«{category_low} {city}»",
    "education": "«{category_low} {city}»",
    "other": "«{category_low} {city}»",
}


def _situation(c: Company) -> tuple[str, str]:
    """Возвращает (короткая формулировка проблемы, подробная)."""
    if c.kind == "no_site":
        return ("у вас пока нет сайта",
                "Нашёл вас на карте, но сайта у вас пока нет - значит, тех, кто ищет в Яндексе "
                "и Google, забирают конкуренты с сайтами.")
    if c.kind == "social_only":
        return ("вас можно найти только в соцсетях",
                "Сейчас вас можно найти только через соцсети. В поиске Яндекса и Google вас почти "
                "не видно, а соцсети не дают нормальный прайс, запись и доверие, как свой сайт.")
    issues = (c.audit.issues if c.audit else [])[:3]
    if c.audit and not c.audit.reachable:
        return ("у меня не открылся ваш сайт",
                f"Попробовал зайти на ваш сайт {c.website} - у меня он не открылся. Если так видят "
                "и клиенты, которые переходят с карт, они уходят к конкурентам.")
    lines = "\n".join(f"- {i}" for i in issues) or "- сайт выглядит устаревшим"
    return ("ваш сайт можно заметно улучшить",
            f"Посмотрел ваш сайт {c.website} и заметил несколько вещей, которые отпугивают клиентов:\n{lines}")


def prepositional(city: str) -> str:
    """Форма для «в ...»: Краснодар → Краснодаре, Анапа → Анапе, Сочи → Сочи,
    Горячий Ключ → г. Горячий Ключ (составные названия не склоняем)."""
    if not city:
        return city
    if " " in city or "-" in city:
        return f"г. {city}"
    last = city[-1].lower()
    if last in "бвгдзклмнпрстфхцчшщ":
        return city + "е"
    if last in "ая":
        return city[:-1] + "е"
    if last == "ь":
        return city[:-1] + "и"
    return city


def build_messages(c: Company, city: str, seed: int = 0) -> list[dict]:
    city = c.city or city
    where = prepositional(city)
    short, long = _situation(c)
    q = quoted(c.name)
    niche = niche_of(c.niche)
    benefit = BENEFITS[niche]
    hint = SEARCH_HINT[niche].format(city=city, category_low=c.category.lower())

    email_subject = f"Макет сайта для {q} - бесплатно"
    email = (
        "Здравствуйте!\n\n"
        f"Меня зовут [Ваше имя], я занимаюсь созданием сайтов для малого бизнеса в {where}.\n\n"
        f"{long}\n\n"
        f"Я подготовил для {q} индивидуальный макет: {benefit}. "
        f"Такой сайт помогает появиться в поиске по запросам вроде {hint}.\n\n"
        "Что входит:\n"
        "- адаптивный дизайн под телефоны\n"
        "- прайс и описание услуг\n"
        "- кнопки звонка, WhatsApp и Telegram\n"
        "- карта и график работы\n"
        "- базовая настройка под Яндекс и Google\n\n"
        "Макет во вложении. Стоимость от [Цена], срок обычно 1-2 недели. "
        "Если интересно - созвонимся и обсудим детали.\n\n"
        "Мои работы: [Портфолио]\n\n"
        "С уважением,\n[Ваше имя]\n[Ваш телефон]"
    )
    call = (
        f"1. Приветствие: «Добрый день! Это {q}? Меня зовут [Ваше имя], я делаю сайты "
        f"для бизнеса в {where}. Удобно 1 минуту?»\n\n"
        f"2. Повод: «Искал вас в интернете и заметил, что {short}.»\n\n"
        f"3. Ценность: «Я уже набросал для вас макет: {benefit}. "
        "Могу бесплатно прислать в WhatsApp - посмотрите, когда будет время.»\n\n"
        "4. Вопрос: «На какой номер удобнее отправить?»\n\n"
        "Если «не нужно»: «Понимаю. Можно всё-таки пришлю макет - вдруг пригодится? "
        "Это бесплатно и ни к чему не обязывает.»\n\n"
        "Если «дорого»: «Сайт-визитка стоит от [Цена], это меньше, чем одна реклама в соцсетях, "
        "а работает годами. Пришлю макет и цены, а вы решите.»"
    )
    follow_up = (
        f"Здравствуйте! Напоминаю о себе - [Ваше имя], писал про сайт для {q}. "
        "Удалось посмотреть макет? Если есть пожелания - поправлю под вас бесплатно."
    )
    # Мессенджеры: короткие уникальные сообщения без ссылок (см. outreach.py)
    chat = {ch: first_message(c, city, where, seed, ch) for ch in ("whatsapp", "telegram", "vk", "instagram")}
    return [
        {"channel": "whatsapp", "title": "WhatsApp", "text": chat["whatsapp"]},
        {"channel": "telegram", "title": "Telegram", "text": chat["telegram"]},
        {"channel": "vk", "title": "ВКонтакте", "text": chat["vk"]},
        {"channel": "instagram", "title": "Instagram", "text": chat["instagram"]},
        {"channel": "after_reply", "title": "После ответа: макет", "text": after_reply(c, seed)},
        {"channel": "email", "title": "Письмо", "subject": email_subject, "text": email},
        {"channel": "call", "title": "Скрипт звонка", "text": call},
        {"channel": "followup", "title": "Напоминание через 3 дня", "text": follow_up},
    ]
