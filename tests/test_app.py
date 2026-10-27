import pytest
from fastapi.testclient import TestClient

from leadfinder.app import create_app
from leadfinder.storage import Storage


@pytest.fixture
def client(tmp_path):
    return TestClient(create_app(Storage(tmp_path / "t.db")))


def test_empty_then_demo(client):
    assert client.get("/api/meta").json()["total"] == 0
    assert client.post("/api/demo").json()["count"] == 24
    meta = client.get("/api/meta").json()
    assert meta["demo"] and meta["total"] == 24
    leads = client.get("/api/companies", params={"kind": "leads"}).json()
    assert leads and all(c["kind"] != "ok" for c in leads)
    prios = [c["priority"] for c in leads]
    assert prios == sorted(prios, reverse=True)


def test_detail_messages_mockup_status(client):
    client.post("/api/demo")
    cid = client.get("/api/companies").json()[0]["id"]
    d = client.get(f"/api/companies/{cid}").json()
    assert {m["channel"] for m in d["messages"]} == {"whatsapp", "email", "call", "followup"}
    assert d["name"] in d["messages"][0]["text"]

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
    assert all(c["niche"] == "auto" for c in client.get("/api/companies", params={"niche": "auto"}).json())
    found = client.get("/api/companies", params={"q": "борода"}).json()
    assert [c["name"] for c in found] == ["Барбершоп «Борода»"]
    csv = client.get("/api/export.csv")
    assert csv.status_code == 200 and "Барбершоп" in csv.text


def test_mockup_escapes_html(client, tmp_path):
    from leadfinder.models import Company
    store = Storage(tmp_path / "x.db")
    store.upsert([Company(id="n1", name="<script>alert(1)</script>", niche="food", category="Кафе", kind="no_site")])
    html = TestClient(create_app(store)).get("/mockup/n1").text
    assert "<script>alert(1)</script>" not in html


def test_scan_reports_unreachable_overpass(client, monkeypatch):
    from leadfinder import osm
    monkeypatch.setattr(osm, "OVERPASS_URLS", ["http://127.0.0.1:9/api"])
    r = client.post("/api/scan/search", json={"niches": ["food"]})
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
    r = client.post("/api/scan/search", json={"niches": ["food"]}).json()
    assert r == {"found": 3, "to_audit": 1}
    meta = client.get("/api/meta").json()
    assert meta["total"] == 3 and not meta["demo"] and meta["pending_audit"] == 1

    r = client.post("/api/scan/audit").json()
    assert r["checked"] == 1 and r["remaining"] == 0
    assert client.post("/api/scan/audit").json()["checked"] == 0
    # повторный поиск не сбрасывает уже сделанную проверку
    assert client.post("/api/scan/search", json={"niches": ["food"]}).json()["to_audit"] == 0


def test_password_protects_app(tmp_path):
    c = TestClient(create_app(Storage(tmp_path / "p.db"), password="secret"))
    assert c.get("/api/meta").status_code == 401
    r = c.get("/", follow_redirects=False)
    assert r.status_code in (302, 307) and r.headers["location"] == "/login"
    assert "Пароль" in c.get("/login").text
    assert c.post("/api/login", json={"password": "wrong"}).status_code == 401
    assert c.post("/api/login", json={"password": "secret"}).status_code == 200
    assert c.get("/api/meta").json()["auth"] is True
    # макет открывается без входа — ссылку можно отправить клиенту
    c.post("/api/demo")
    anon = TestClient(c.app)
    assert anon.get("/mockup/demo1").status_code == 200
    assert anon.get("/api/companies").status_code == 401
