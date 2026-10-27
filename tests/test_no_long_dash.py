"""В текстах проекта не должно быть длинного и среднего тире: только обычный дефис."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHECK = ["leadfinder", "tests", "api", "README.md", "CLAUDE.md",
         ".claude/skills/parser-builder", ".claude/skills/parser-ui", ".claude/skills/requirements-interview"]
DASHES = (chr(0x2014), chr(0x2013))  # длинное и среднее тире


def test_no_long_dashes():
    found = []
    for item in CHECK:
        path = ROOT / item
        files = [path] if path.is_file() else [f for f in path.rglob("*") if f.is_file()]
        for f in files:
            if "__pycache__" in f.parts or f.suffix in (".png", ".jpg", ".pyc"):
                continue
            for n, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if any(d in line for d in DASHES):
                    found.append(f"{f.relative_to(ROOT)}:{n}")
    assert not found, "Длинное тире найдено: " + ", ".join(found[:20])
