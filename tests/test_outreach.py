"""Первые сообщения: уникальные, короткие, без ссылок и слов-триггеров."""
import re

from leadfinder.messages import build_messages
from leadfinder.models import Audit, Company

TRIGGERS = ("бесплатн", "акци", "скидк", "http", "www.", ".ru", "[Ссылка")


def companies():
    out = []
    for i in range(30):
        kind = ["social_only", "no_site", "bad_site"][i % 3]
        audit = Audit(score=40, reachable=True, checks={"mobile": False, "https": False}) if kind == "bad_site" else None
        out.append(Company(id=f"n{i}", name=f"Сауна «Пар {i}»", niche=["sauna", "beauty", "leisure", "education"][i % 4],
                           category="Сауна", kind=kind, socials={"vk": "x"} if kind == "social_only" else {},
                           website="http://x.example" if kind == "bad_site" else None, audit=audit))
    return out


def chat_texts(seed=0):
    return [m["text"] for c in companies() for m in build_messages(c, "Краснодар", seed)
            if m["channel"] in ("whatsapp", "telegram", "vk", "instagram")]


def test_first_messages_are_short_clean_and_end_with_question():
    for t in chat_texts():
        low = t.lower()
        assert not any(w in low for w in TRIGGERS), t
        assert len(t) < 420, t
        assert t.rstrip().endswith("?"), t
        assert len(re.findall(r"[\U0001F300-\U0001FAFF]", t)) <= 1


def test_messages_mostly_unique():
    texts = chat_texts()
    assert len(set(texts)) / len(texts) > 0.95


def test_seed_gives_another_variant_and_is_stable():
    c = companies()[0]
    a = build_messages(c, "Краснодар", 0)[1]["text"]
    assert a == build_messages(c, "Краснодар", 0)[1]["text"]
    assert any(build_messages(c, "Краснодар", s)[1]["text"] != a for s in range(1, 4))


def test_after_reply_has_mockup_link_placeholder():
    m = {x["channel"]: x for x in build_messages(companies()[0], "Краснодар")}
    assert "[Ссылка на макет]" in m["after_reply"]["text"]
