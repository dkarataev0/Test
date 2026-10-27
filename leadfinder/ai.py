"""Первое сообщение, написанное ИИ (Claude) под конкретную компанию.

Работает, только если задан ANTHROPIC_API_KEY. Сообщение никогда не отправляется само:
ИИ пишет текст, человек читает и отправляет.
"""
import os
import re

import anthropic

from .messages import prepositional
from .models import Company

MODEL = "claude-opus-5-5"

SYSTEM = """Ты пишешь первое сообщение от веб-разработчика владельцу малого бизнеса в мессенджере.
Цель - чтобы человек ответил, а не пожаловался на спам.

Правила:
- 2-3 коротких предложения, не больше 350 символов.
- Без ссылок, без слов «бесплатно», «акция», «скидка», без восклицательных призывов купить.
- Максимум один эмодзи, лучше без них.
- Начни с приветствия, коротко представься как [Ваше имя] (именно так, в квадратных скобках).
- Одно конкретное наблюдение именно об этой компании (из фактов ниже), без выдумок.
- Закончи простым вопросом, на который легко ответить «да», например предложить показать макет.
- Пиши живым разговорным русским языком, на «вы», без канцелярита.
- Не используй длинное и среднее тире, только обычный дефис.
- Ответь только текстом сообщения, без пояснений и кавычек."""

CHANNEL = {"whatsapp": "WhatsApp", "telegram": "Telegram", "vk": "личные сообщения ВКонтакте",
           "instagram": "директ Instagram"}
KIND = {"no_site": "сайта нет, есть только карточка на картах",
        "social_only": "сайта нет, есть только страница в соцсетях",
        "bad_site": "сайт есть, но слабый", "unchecked": "сайт не проверялся", "ok": "сайт в порядке"}


class AIUnavailable(RuntimeError):
    pass


def enabled() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def _facts(c: Company, city: str, channel: str, previous: str | None) -> str:
    lines = [
        f"Канал: {CHANNEL.get(channel, channel)}",
        f"Компания: {c.name}",
        f"Категория: {c.category}",
        f"Город: {city} (в предложном падеже: в {prepositional(city)})",
        f"Ситуация с сайтом: {KIND.get(c.kind, c.kind)}",
    ]
    if c.socials:
        lines.append("Соцсети: " + ", ".join(c.socials))
    if c.audit and c.audit.issues:
        lines.append("Проблемы сайта: " + "; ".join(c.audit.issues[:3]))
    if c.opening_hours:
        lines.append(f"Часы работы: {c.opening_hours}")
    if previous:
        lines.append(f"Предыдущий вариант (напиши заметно другой): {previous}")
    return "\n".join(lines)


def _clean(text: str) -> str:
    text = text.strip().strip("«»\"")
    text = text.replace(chr(0x2014), "-").replace(chr(0x2013), "-")
    return re.sub(r"https?://\S+", "", text).strip()


async def write_first_message(c: Company, city: str, channel: str, previous: str | None = None) -> str:
    if not enabled():
        raise AIUnavailable("ИИ не подключён: добавьте ANTHROPIC_API_KEY в настройках Vercel")
    client = anthropic.AsyncAnthropic()
    try:
        resp = await client.beta.messages.create(
            model=MODEL,
            max_tokens=8000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",  # если модель откажет, запрос выполнит запасная модель
            output_config={"effort": "medium"},
            system=SYSTEM,
            messages=[{"role": "user", "content": _facts(c, city, channel, previous)}],
        )
    except anthropic.AuthenticationError as exc:
        raise AIUnavailable("Ключ ANTHROPIC_API_KEY не подходит") from exc
    except anthropic.RateLimitError as exc:
        raise AIUnavailable("Слишком много запросов к ИИ, попробуйте через минуту") from exc
    except anthropic.APIStatusError as exc:
        raise AIUnavailable(f"ИИ временно недоступен ({exc.status_code})") from exc
    except anthropic.APIConnectionError as exc:
        raise AIUnavailable("Нет связи с ИИ, попробуйте ещё раз") from exc
    if resp.stop_reason == "refusal":
        raise AIUnavailable("ИИ не смог написать сообщение для этой компании, используйте шаблон")
    text = "".join(b.text for b in resp.content if b.type == "text")
    if not text.strip():
        raise AIUnavailable("ИИ вернул пустой ответ, попробуйте ещё раз")
    return _clean(text)
