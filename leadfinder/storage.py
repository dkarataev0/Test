"""Хранение найденных компаний (статусы и заметки не теряются при новом поиске).

Локально — SQLite-файл. На хостинге — PostgreSQL (Supabase), если задан DATABASE_URL.
"""
import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .models import Company

SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
"""

PG_SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
"""


def _row(data, status, note) -> Company:
    if isinstance(data, str):
        data = json.loads(data)
    return Company(**data, status=status, note=note)


class Storage:
    """SQLite. Подстановка параметров — «?»."""

    ph = "?"

    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self._conn() as db:
            db.executescript(SQLITE_SCHEMA)

    @contextmanager
    def _conn(self):
        db = sqlite3.connect(self.path)
        try:
            yield db
            db.commit()
        finally:
            db.close()

    def _sql(self, sql: str) -> str:
        return sql.replace("%s", self.ph)

    def _exec(self, sql: str, params=()):
        with self._conn() as db:
            return db.execute(self._sql(sql), params).fetchall()

    def upsert(self, companies: list[Company]) -> None:
        rows = [(c.id, c.model_dump_json(exclude={"status", "note"})) for c in companies]
        with self._conn() as db:
            db.executemany(self._sql(
                "INSERT INTO companies (id, data) VALUES (%s, %s) "
                "ON CONFLICT(id) DO UPDATE SET data = excluded.data"), rows)

    def all(self) -> list[Company]:
        return [_row(*r) for r in self._exec("SELECT data, status, note FROM companies")]

    def get(self, cid: str) -> Company | None:
        rows = self._exec("SELECT data, status, note FROM companies WHERE id = %s", (cid,))
        return _row(*rows[0]) if rows else None

    def update(self, cid: str, status: str | None = None, note: str | None = None) -> None:
        if status is not None:
            self._exec("UPDATE companies SET status = %s WHERE id = %s", (status, cid))
        if note is not None:
            self._exec("UPDATE companies SET note = %s WHERE id = %s", (note, cid))

    def clear_demo(self) -> None:
        self._exec("DELETE FROM companies WHERE id LIKE 'demo%%'")

    def set_meta(self, key: str, value: str) -> None:
        self._exec("INSERT INTO meta (key, value) VALUES (%s, %s) "
                   "ON CONFLICT(key) DO UPDATE SET value = excluded.value", (key, value))

    def get_meta(self, key: str) -> str | None:
        rows = self._exec("SELECT value FROM meta WHERE key = %s", (key,))
        return rows[0][0] if rows else None


class PgStorage(Storage):
    """PostgreSQL (Supabase). Тот же интерфейс, подстановка — «%s»."""

    ph = "%s"

    def __init__(self, url: str):
        import psycopg  # нужен только на хостинге

        self._psycopg = psycopg
        self.url = url
        with self._conn() as db:
            # таблицы могли создать заранее (у пользователя приложения может не быть прав CREATE)
            if db.execute("SELECT to_regclass('companies')").fetchone()[0] is None:
                db.execute(PG_SCHEMA)

    @contextmanager
    def _conn(self):
        # prepare_threshold=None — совместимость с пулером Supabase (transaction mode)
        with self._psycopg.connect(self.url, prepare_threshold=None, connect_timeout=10) as db:
            yield db

    def _exec(self, sql: str, params=()):
        with self._conn() as db:
            cur = db.execute(sql, params)
            return cur.fetchall() if cur.description else []

    def upsert(self, companies: list[Company]) -> None:
        rows = [(c.id, c.model_dump_json(exclude={"status", "note"})) for c in companies]
        with self._conn() as db, db.cursor() as cur:
            cur.executemany(
                "INSERT INTO companies (id, data) VALUES (%s, %s::jsonb) "
                "ON CONFLICT(id) DO UPDATE SET data = excluded.data", rows)


def get_storage(sqlite_path: Path) -> Storage:
    url = os.getenv("DATABASE_URL")
    return PgStorage(url) if url else Storage(sqlite_path)
