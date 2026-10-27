import datetime as dt
from pathlib import Path

from leadfinder.audit import analyze_html, kind_from_audit

FIX = Path(__file__).parent / "fixtures"
TODAY = dt.date(2026, 10, 27)


def test_old_site_scores_low():
    a = analyze_html((FIX / "site_old.html").read_text(), "http://romashka.ru/", 4.2, 20_000, TODAY)
    assert a.score < 60
    assert kind_from_audit(a) == "bad_site"
    text = " ".join(a.issues)
    assert "HTTPS" in text and "телефоны" in text and "2014" in text and "Устаревшие" in text


def test_good_site_scores_high():
    a = analyze_html((FIX / "site_good.html").read_text(), "https://motor.ru/", 0.8, 50_000, TODAY)
    assert a.score >= 90, a.issues
    assert kind_from_audit(a) == "ok"


def test_free_builder_penalized():
    a = analyze_html((FIX / "site_good.html").read_text(), "https://motor.tilda.ws/", 0.8, 50_000, TODAY)
    assert any("конструкторе" in i for i in a.issues)
