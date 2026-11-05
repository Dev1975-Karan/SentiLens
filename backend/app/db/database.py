import asyncio
import json
from pathlib import Path
import aiosqlite

from ..config import settings

DB_PATH = Path(settings.sqlite_path)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sha256 TEXT NOT NULL UNIQUE,
    result_json TEXT NOT NULL,
    timestamp TEXT NOT NULL
);
"""

async def init_db() -> None:
    async with aiosqlite.connect(str(DB_PATH)) as db:
        await db.executescript(CREATE_TABLE_SQL)
        await db.commit()

async def get_scan_by_hash(sha256: str):
    async with aiosqlite.connect(str(DB_PATH)) as db:
        async with db.execute("SELECT result_json FROM scans WHERE sha256 = ?", (sha256,)) as cur:
            row = await cur.fetchone()
            return json.loads(row[0]) if row else None

async def insert_scan(sha256: str, result_json: dict, timestamp: str):
    async with aiosqlite.connect(str(DB_PATH)) as db:
        await db.execute(
            "INSERT OR REPLACE INTO scans (sha256, result_json, timestamp) VALUES (?, ?, ?)",
            (sha256, json.dumps(result_json), timestamp),
        )
        await db.commit()

async def list_recent_scans(limit: int = 20):
    async with aiosqlite.connect(str(DB_PATH)) as db:
        async with db.execute(
            "SELECT sha256, result_json, timestamp FROM scans ORDER BY id DESC LIMIT ?", (limit,)
        ) as cur:
            rows = await cur.fetchall()
            return [
                {"sha256": r[0], "result": json.loads(r[1]), "timestamp": r[2]}
                for r in rows
            ]
