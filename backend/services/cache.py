import hashlib
import json
import logging
import re
import sqlite3
import threading
from pathlib import Path

log = logging.getLogger(__name__)

CACHE_VERSION = "v3_rag_overlap_hybrid"

# Create a path for the SQLite database in the root of the backend directory
DB_PATH = Path(__file__).parent.parent / "cache.db"

# Thread-local storage for SQLite connections, since SQLite connection objects
# cannot be shared across threads by default.
_local = threading.local()


def _get_connection() -> sqlite3.Connection:
    """Returns a thread-local SQLite connection, initializing the DB if needed."""
    if not hasattr(_local, "conn"):
        # Connect to SQLite, setting check_same_thread=False just in case,
        # but using thread-local storage anyway.
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cache (
                doc_hash TEXT PRIMARY KEY,
                result_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
        _local.conn = conn
        
        # Optionally perform cleanup periodically (or randomly)
        # Prevent unlimited growth (e.g. keep last 30 days)
        try:
            conn.execute("DELETE FROM cache WHERE created_at < datetime('now', '-30 days')")
            conn.commit()
        except Exception as exc:
            log.warning("Cache cleanup failed: %s", exc)

    return _local.conn


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def stable_key(text: str) -> str:
    normalized = normalize_text(text)
    return hashlib.sha256((normalized + CACHE_VERSION).encode()).hexdigest()


def get_cached_result(doc_hash: str) -> dict | None:
    try:
        conn = _get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT result_json FROM cache WHERE doc_hash = ?", (doc_hash,))
        row = cursor.fetchone()
        if row:
            log.info("Cache hit for hash %s", doc_hash)
            return json.loads(row[0])
        log.info("Cache miss for hash %s", doc_hash)
        return None
    except Exception as exc:
        log.warning("Error reading from cache: %s", exc)
        return None


def store_result(doc_hash: str, result: dict) -> None:
    try:
        conn = _get_connection()
        # Insert or replace in case of hash collision or update
        conn.execute(
            """
            INSERT OR REPLACE INTO cache (doc_hash, result_json)
            VALUES (?, ?)
            """,
            (doc_hash, json.dumps(result)),
        )
        conn.commit()
        log.info("Successfully stored result in cache for hash %s", doc_hash)
    except Exception as exc:
        log.warning("Error storing to cache: %s", exc)


def clear_all_cache() -> int:
    """Delete ALL rows from the cache table. Returns number of rows deleted."""
    try:
        conn = _get_connection()
        cursor = conn.execute("DELETE FROM cache")
        conn.commit()
        deleted = cursor.rowcount
        log.info("Cache cleared: %d rows removed.", deleted)
        return deleted
    except Exception as exc:
        log.warning("Error clearing cache: %s", exc)
        return 0
