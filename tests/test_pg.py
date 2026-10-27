"""Проверка хранилища PostgreSQL. Запускается, только если задан TEST_DATABASE_URL."""
import os

import pytest
from fastapi.testclient import TestClient

from leadfinder.app import create_app
from leadfinder.storage import PgStorage

URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="TEST_DATABASE_URL не задан")


def test_pg_storage_roundtrip():
    store = PgStorage(URL)
    store._exec("TRUNCATE companies, meta")
    c = TestClient(create_app(store, password=""))
    assert c.post("/api/demo").json()["count"] == 24
    cid = "demo1"
    c.patch(f"/api/companies/{cid}", json={"status": "deal", "note": "ура"})
    c.post("/api/demo")
    d = c.get(f"/api/companies/{cid}").json()
    assert d["status"] == "deal" and d["note"] == "ура" and d["demo"]
    assert c.get("/api/meta").json()["total"] == 24
    store.set_meta("last_scan", "x"); store.set_meta("last_scan", "y")
    assert store.get_meta("last_scan") == "y"
    store.clear_demo()
    assert c.get("/api/meta").json()["total"] == 0
