import pytest
from fastapi.testclient import TestClient

from leadfinder.app import create_app
from leadfinder.storage import Storage


@pytest.fixture
def client(tmp_path):
    return TestClient(create_app(Storage(tmp_path / "t.db")))


def test_empty_then_demo(client):
    assert client.get("/api/meta").json()["total"] == 0
    assert client.post("/api/demo").json()["count"] == 18
    meta = client.get("/api/meta").json()
    assert meta["demo"] and meta["total"] == 18
    leads = client.get("/api/companies", params={"kind": "leads"}).json()
    assert leads and all(c["kind"] != "ok" for c in leads)
    prios = [c["priority"] for c in leads]
    assert prios == sorted(prios, reverse=True)


def test_detail_messages_mockup_status(client):
    client.post("/api/demo")
    cid = client.get("/api/companies").json()[0]["id"]
    d = client.get(f"/api/companies/{cid}").json()
    assert {m["channel"] for m in d["messages"]} == {"whatsapp", "telegram", "vk", "instagram", "after_reply", "email", "call", "followup"}
    assert "[Ваше имя]" in d["messages"][0]["text"]

    for v in range(3):
        html = client.get(f"/mockup/{cid}", params={"variant": v}).text
        assert d["name"] in html and "viewport" in html

    assert client.patch(f"/api/companies/{cid}", json={"status": "contacted", "note": "звонил"}).status_code == 200
    d = client.get(f"/api/companies/{cid}").json()
    assert d["status"] == "contacted" and d["note"] == "звонил"
    # повторная загрузка данных не сбрасывает статус
    client.post("/api/demo")
    assert client.get(f"/api/companies/{cid}").json()["status"] == "contacted"
    assert client.patch(f"/api/companies/{cid}", json={"status": "bogus"}).status_code == 400


def test_filters_and_export(client):
    client.post("/api/demo")
    assert all(c["niche"] == "sauna" for c in client.get("/api/companies", params={"niche": "sauna"}).json())
    found = client.get("/api/companies", params={"q": "борода"}).json()
    assert [c["name"] for c in found] == ["Барбершоп «Борода»"]
    csv = client.get("/api/export.csv")
    assert csv.status_code == 200 and "Барбершоп" in csv.text


def test_mockup_escapes_html(client, tmp_path):
    from leadfinder.models import Company
    store = Storage(tmp_path / "x.db")
    store.upsert([Company(id="n1", name="<script>alert(1)</script>", niche="sauna", category="Сауна", kind="no_site")])
    html = TestClient(create_app(store)).get("/mockup/n1").text
    assert "<script>alert(1)</script>" not in html


def test_scan_reports_unreachable_overpass(client, monkeypatch):
    from leadfinder import osm
    monkeypatch.setattr(osm, "OVERPASS_URLS", ["http://127.0.0.1:9/api"])
    r = client.post("/api/scan/search", json={"niches": ["sauna"]})
    assert r.status_code == 502 and "OpenStreetMap" in r.json()["detail"]


def test_scan_steps_search_then_audit(client, monkeypatch):
    import json
    from pathlib import Path
    from leadfinder import audit, osm
    from leadfinder.models import Audit
    sample = json.loads((Path(__file__).parent / "fixtures" / "overpass_sample.json").read_text())

    async def fake_fetch(niches, city, on_status=None):
        return osm.parse_elements(sample["elements"])

    async def fake_audit(companies, on_progress=None, concurrency=8):
        for c in companies:
            c.audit = Audit(score=30, reachable=True, issues=["Сайт не адаптирован под телефоны"])
            c.kind = "bad_site"

    monkeypatch.setattr(osm, "fetch_companies", fake_fetch)
    monkeypatch.setattr(audit, "audit_companies", fake_audit)
    client.post("/api/demo")
    r = client.post("/api/scan/search", json={"niches": ["sauna"]}).json()
    assert r == {"found": 3, "already": 0, "to_audit": 1}
    meta = client.get("/api/meta").json()
    assert meta["total"] == 3 and not meta["demo"] and meta["pending_audit"] == 1

    r = client.post("/api/scan/audit").json()
    assert r["checked"] == 1 and r["remaining"] == 0
    assert client.post("/api/scan/audit").json()["checked"] == 0
    # повторный поиск не сбрасывает уже сделанную проверку
    assert client.post("/api/scan/search", json={"niches": ["sauna"]}).json()["to_audit"] == 0


def test_password_protects_app(tmp_path):
    c = TestClient(create_app(Storage(tmp_path / "p.db"), password="secret"))
    assert c.get("/api/meta").status_code == 401
    r = c.get("/", follow_redirects=False)
    assert r.status_code in (302, 307) and r.headers["location"] == "/login"
    assert "Пароль" in c.get("/login").text
    assert c.post("/api/login", json={"password": "wrong"}).status_code == 401
    assert c.post("/api/login", json={"password": "secret"}).status_code == 200
    assert c.get("/api/meta").json()["auth"] is True
    # макет открывается без входа - ссылку можно отправить клиенту
    c.post("/api/demo")
    anon = TestClient(c.app)
    assert anon.get("/mockup/demo1").status_code == 200
    assert anon.get("/api/companies").status_code == 401


def test_scan_query_and_import(client):
    import json
    from pathlib import Path
    q = client.post("/api/scan/query", json={"niches": ["sauna"]}).json()
    assert "[bbox:" in q["query"] and q["servers"]
    assert client.post("/api/scan/query", json={"niches": []}).status_code == 400
    sample = json.loads((Path(__file__).parent / "fixtures" / "overpass_sample.json").read_text())
    r = client.post("/api/scan/import", json={"elements": sample["elements"]}).json()
    assert r == {"found": 3, "already": 0, "to_audit": 1}
    assert client.get("/api/meta").json()["total"] == 3


def test_import_limit_takes_only_new_and_best(client):
    import json
    from pathlib import Path
    sample = json.loads((Path(__file__).parent / "fixtures" / "overpass_sample.json").read_text())
    r = client.post("/api/scan/import", json={"elements": sample["elements"], "limit": 1}).json()
    assert r["found"] == 1
    first = client.get("/api/companies").json()
    assert [c["name"] for c in first] == ["Зерно"]  # только соцсети - самый перспективный
    r = client.post("/api/scan/import", json={"elements": sample["elements"], "limit": 5}).json()
    assert r == {"found": 2, "already": 1, "to_audit": 1}
    assert client.post("/api/scan/import", json={"elements": [], "region": "moon"}).status_code == 400


def test_city_from_osm_and_messages_use_it(client):
    el = {"type": "node", "id": 7, "lat": 44.9, "lon": 37.3,
          "tags": {"leisure": "sauna", "name": "Роза", "addr:city": "Анапа", "phone": "+79001112233"}}
    client.post("/api/scan/import", json={"elements": [el], "region": "krai"})
    d = client.get("/api/companies/n7").json()
    assert d["city"] == "Анапа"
    assert "в Анапе" in d["messages"][0]["text"] and "Краснодар" not in d["messages"][0]["text"]
    assert "Анап" in client.get("/mockup/n7").text


def test_telegram_sort_and_clear_new(client):
    import json
    from pathlib import Path
    sample = json.loads((Path(__file__).parent / "fixtures" / "overpass_sample.json").read_text())
    client.post("/api/scan/import", json={"elements": sample["elements"]})
    names = [c["name"] for c in client.get("/api/companies", params={"sort": "telegram"}).json()]
    assert names[0] == "Зерно"  # у него Telegram в карточке
    client.patch("/api/companies/n101", json={"status": "contacted"})
    assert client.post("/api/companies/clear-new").json() == {"deleted": 2}
    assert [c["id"] for c in client.get("/api/companies").json()] == ["n101"]


def test_query_per_niche_and_client_log(client):
    q = client.post("/api/scan/query", json={"niches": ["beauty", "sauna"]}).json()
    assert [x["niche"] for x in q["queries"]] == ["beauty", "sauna"]
    assert any("openstreetmap.ru" in s for s in q["servers"])
    client.post("/api/log", json={"event": "overpass_failed", "details": ["Красота: overpass-api.de: занят (429)"]})
    log = client.get("/api/log").json()
    assert log[-1]["event"] == "overpass_failed" and "429" in log[-1]["details"][0]
    html = client.get("/").text
    assert "/static/app.js?v=" in html


def test_contacts_only_filter(client):
    client.post("/api/demo")
    all_ = client.get("/api/companies").json()
    with_contacts = client.get("/api/companies", params={"contacts": "1"}).json()
    assert all(c["phone"] or c["socials"] or c["email"] for c in with_contacts)
    assert len(with_contacts) <= len(all_)


def test_legacy_niche_gets_neutral_texts(client, tmp_path):
    from leadfinder.models import Company
    store = Storage(tmp_path / "legacy.db")
    store.upsert([Company(id="n9", name="Флора", niche="services", category="Цветы", kind="no_site",
                          phone="+79001112233")])
    c = TestClient(create_app(store, password=""))
    html = c.get("/mockup/n9").text
    assert "Флора" in html and "бассейн" not in html.lower()
    msgs = c.get("/api/companies/n9").json()["messages"]
    assert "бронь" not in msgs[0]["text"]


def test_export_escapes_formulas(client, tmp_path):
    from leadfinder.models import Company
    store = Storage(tmp_path / "csv.db")
    store.upsert([Company(id="n8", name="=HYPERLINK(\"x\")", niche="sauna", category="Сауна", kind="no_site")])
    text = TestClient(create_app(store, password="")).get("/api/export.csv").text
    assert "'=HYPERLINK" in text


def test_limit_must_be_positive(client):
    assert client.post("/api/scan/import", json={"elements": [], "limit": -5}).status_code == 422


def test_followup_after_three_days(tmp_path):
    import datetime as dt
    import json
    from leadfinder.app import now
    store = Storage(tmp_path / "f.db")
    c = TestClient(create_app(store, password=""))
    c.post("/api/demo")
    c.patch("/api/companies/demo1", json={"status": "contacted"})
    d = c.get("/api/companies/demo1").json()
    assert d["status_at"] and d["followup"] is False
    old = (now() - dt.timedelta(days=4)).isoformat(timespec="minutes")
    store.set_meta("status_log", json.dumps({"demo1": old}))
    assert [x["id"] for x in c.get("/api/companies", params={"status": "followup"}).json()] == ["demo1"]
    assert c.get("/api/meta").json()["followup"] == 1
    c.patch("/api/companies/demo1", json={"status": "replied"})
    assert c.get("/api/meta").json()["followup"] == 0


def test_ai_message_without_key_is_clear_error(client, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    client.post("/api/demo")
    assert client.get("/api/meta").json()["ai"] is False
    r = client.post("/api/companies/demo1/ai-message", json={"channel": "telegram"})
    assert r.status_code == 503 and "ANTHROPIC_API_KEY" in r.json()["detail"]
    assert client.post("/api/companies/demo1/ai-message", json={"channel": "email"}).status_code == 400


def test_ai_message_uses_writer(client, monkeypatch):
    from leadfinder import ai
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    seen = {}

    async def fake(c, city, channel, previous=None):
        seen.update(name=c.name, channel=channel, previous=previous)
        return "Здравствуйте! Я [Ваше имя]. Показать макет?"

    monkeypatch.setattr(ai, "write_first_message", fake)
    client.post("/api/demo")
    r = client.post("/api/companies/demo1/ai-message", json={"channel": "vk", "previous": "старый"})
    assert r.json()["text"].endswith("?") and seen["channel"] == "vk" and seen["previous"] == "старый"


def test_seed_changes_chat_messages(client):
    client.post("/api/demo")
    a = client.get("/api/companies/demo1", params={"seed": 0}).json()["messages"]
    texts = {client.get("/api/companies/demo1", params={"seed": s}).json()["messages"][1]["text"] for s in range(5)}
    assert len(texts) > 1 and a[1]["text"] in texts


def test_ai_clean_removes_links_and_long_dashes():
    from leadfinder.ai import _clean
    out = _clean("«Привет " + chr(0x2014) + " смотрите https://spam.example сайт»")
    assert "http" not in out and chr(0x2014) not in out
