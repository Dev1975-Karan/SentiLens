import os
import asyncio
import json
from pathlib import Path
import aiosqlite

from ..config import settings

# On Vercel / serverless, use /tmp which is writable
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_PATH = Path("/tmp/sentinellens.db")
else:
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
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            await db.executescript(CREATE_TABLE_SQL)
            await db.commit()
    except Exception:
        pass

async def get_scan_by_hash(sha256: str):
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            async with db.execute("SELECT result_json FROM scans WHERE sha256 = ?", (sha256,)) as cur:
                row = await cur.fetchone()
                return json.loads(row[0]) if row else None
    except Exception:
        return None

async def insert_scan(sha256: str, result_json: dict, timestamp: str):
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            await db.execute(
                "INSERT OR REPLACE INTO scans (sha256, result_json, timestamp) VALUES (?, ?, ?)",
                (sha256, json.dumps(result_json), timestamp),
            )
            await db.commit()
    except Exception:
        pass

async def list_recent_scans(limit: int = 20):
    try:
        async with aiosqlite.connect(str(DB_PATH)) as db:
            async with db.execute(
                "SELECT sha256, result_json, timestamp FROM scans ORDER BY id DESC LIMIT ?", (limit,)
            ) as cur:
                rows = await cur.fetchall()
                return [
                    {"sha256": r[0], "result": json.loads(r[1]), "timestamp": r[2]}
                    for r in rows
                ]
    except Exception:
        return []
