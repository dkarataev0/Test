"""Хранение найденных компаний в SQLite (статусы и заметки не теряются при новом поиске)."""
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .models import Company

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    note TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
"""


class Storage:
    def __init__(self, path: Path):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self._conn() as db:
            db.executescript(SCHEMA)

    @contextmanager
    def _conn(self):
        db = sqlite3.connect(self.path)
        try:
            yield db
            db.commit()
        finally:
            db.close()

    def upsert(self, companies: list[Company]) -> None:
        with self._conn() as db:
            db.executemany(
                "INSERT INTO companies (id, data) VALUES (?, ?) "
                "ON CONFLICT(id) DO UPDATE SET data = excluded.data",
                [(c.id, c.model_dump_json(exclude={"status", "note"})) for c in companies],
            )

    def all(self) -> list[Company]:
        with self._conn() as db:
            rows = db.execute("SELECT data, status, note FROM companies").fetchall()
        return [Company(**json.loads(d), status=s, note=n) for d, s, n in rows]

    def get(self, cid: str) -> Company | None:
        with self._conn() as db:
            row = db.execute("SELECT data, status, note FROM companies WHERE id = ?", (cid,)).fetchone()
        return Company(**json.loads(row[0]), status=row[1], note=row[2]) if row else None

    def update(self, cid: str, status: str | None = None, note: str | None = None) -> None:
        with self._conn() as db:
            if status is not None:
                db.execute("UPDATE companies SET status = ? WHERE id = ?", (status, cid))
            if note is not None:
                db.execute("UPDATE companies SET note = ? WHERE id = ?", (note, cid))

    def clear_demo(self) -> None:
        with self._conn() as db:
            db.execute("DELETE FROM companies WHERE json_extract(data, '$.demo') = 1")

    def set_meta(self, key: str, value: str) -> None:
        with self._conn() as db:
            db.execute("INSERT OR REPLACE INTO meta VALUES (?, ?)", (key, value))

    def get_meta(self, key: str) -> str | None:
        with self._conn() as db:
            row = db.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
        return row[0] if row else None
