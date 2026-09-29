"""
database.py — SQLite database setup using raw sqlite3 (no ORM required).

Stores:
  - users
  - conversations
  - messages
  - incidents
  - feedback
"""

import sqlite3
import threading
from pathlib import Path

# ── Thread-local connection pool ──────────────────────────────────────────────

_local = threading.local()
_DB_PATH: str = "hindsight_agent.db"


def _get_conn() -> sqlite3.Connection:
    """Return a thread-local SQLite connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def get_db() -> sqlite3.Connection:
    return _get_conn()


# ── Schema ────────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    incident_id TEXT,
    title       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role            TEXT NOT NULL,   -- 'user' | 'assistant'
    content         TEXT NOT NULL,
    memories_used   TEXT,            -- JSON list of recalled memory snippets
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS incidents (
    id          TEXT PRIMARY KEY,
    service     TEXT NOT NULL,
    title       TEXT NOT NULL,
    error       TEXT NOT NULL,
    severity    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'investigating',
    description TEXT,
    deployment  TEXT,
    detected_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
    id              TEXT PRIMARY KEY,
    incident_id     TEXT NOT NULL,
    user_id         TEXT,
    decision        TEXT NOT NULL,   -- accepted | modified | rejected
    outcome         TEXT NOT NULL,   -- resolved | partial | failed
    comment         TEXT,
    recommendation  TEXT,
    service         TEXT,
    hindsight_retained INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (incident_id) REFERENCES incidents(id)
);
"""


def init_db(db_path: str = "hindsight_agent.db") -> None:
    """Create tables and seed demo data if the DB is new."""
    global _DB_PATH
    _DB_PATH = db_path

    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()

    _seed_demo_data(conn)


# ── Demo seed data ────────────────────────────────────────────────────────────

_INCIDENTS = [
    {
        "id": "INC-104",
        "service": "Payment API",
        "title": "Database connection timeouts",
        "error": "MongoServerSelectionTimeoutError",
        "severity": "P1",
        "status": "investigating",
        "description": "Payment requests are failing because the service cannot establish a connection with MongoDB.",
        "deployment": "v2.4.1",
        "detected_at": "2026-09-29 10:42:00",
    },
    {
        "id": "INC-103",
        "service": "Auth Service",
        "title": "Elevated authentication failures",
        "error": "AuthenticationFailureRateExceeded",
        "severity": "P2",
        "status": "investigating",
        "description": "Authentication failures have increased significantly across the service.",
        "deployment": "v3.1.0",
        "detected_at": "2026-09-29 09:18:00",
    },
    {
        "id": "INC-102",
        "service": "Cache Service",
        "title": "High memory usage",
        "error": "RedisMemoryLimitExceeded",
        "severity": "P2",
        "status": "monitoring",
        "description": "Redis memory usage has exceeded the configured limit, causing cache failures.",
        "deployment": "v1.8.2",
        "detected_at": "2026-09-29 08:51:00",
    },
    {
        "id": "INC-101",
        "service": "Orders API",
        "title": "HTTP 502 Bad Gateway",
        "error": "HTTP 502 Bad Gateway",
        "severity": "P2",
        "status": "resolved",
        "description": "Orders API returning 502 errors due to upstream service failure.",
        "deployment": "v4.2.0",
        "detected_at": "2026-09-28 14:30:00",
    },
    {
        "id": "INC-087",
        "service": "Payment API",
        "title": "Database timeout",
        "error": "MongoConnectionTimeout",
        "severity": "P1",
        "status": "resolved",
        "description": "MongoDB connection failures after network configuration change.",
        "deployment": "v2.3.0",
        "detected_at": "2026-09-15 11:00:00",
    },
    {
        "id": "INC-076",
        "service": "Auth Service",
        "title": "Authentication failures",
        "error": "AuthenticationFailureRateExceeded",
        "severity": "P2",
        "status": "resolved",
        "description": "Authentication failures after identity provider configuration changes.",
        "deployment": "v3.0.0",
        "detected_at": "2026-09-11 09:00:00",
    },
    {
        "id": "INC-064",
        "service": "Orders API",
        "title": "Connection failures",
        "error": "ConnectionPoolExhausted",
        "severity": "P2",
        "status": "resolved",
        "description": "Database connection failures caused by connection pool exhaustion.",
        "deployment": "v4.0.0",
        "detected_at": "2026-08-29 08:00:00",
    },
    {
        "id": "INC-052",
        "service": "Identity Service",
        "title": "Login failures",
        "error": "AuthPolicyViolation",
        "severity": "P1",
        "status": "resolved",
        "description": "Login failures caused by an authentication policy update.",
        "deployment": "v1.5.0",
        "detected_at": "2026-08-18 10:00:00",
    },
    {
        "id": "INC-041",
        "service": "Payment API",
        "title": "MongoDB connectivity degradation",
        "error": "MongoConnectionLimitReached",
        "severity": "P2",
        "status": "resolved",
        "description": "MongoDB connectivity degradation after connection limit changes.",
        "deployment": "v2.2.0",
        "detected_at": "2026-07-23 13:00:00",
    },
]


def _seed_demo_data(conn: sqlite3.Connection) -> None:
    """Insert demo incidents if table is empty."""
    count = conn.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
    if count > 0:
        return  # Already seeded

    for inc in _INCIDENTS:
        conn.execute(
            """
            INSERT OR IGNORE INTO incidents
                (id, service, title, error, severity, status, description, deployment, detected_at)
            VALUES
                (:id, :service, :title, :error, :severity, :status, :description, :deployment, :detected_at)
            """,
            inc,
        )

    # Default user
    conn.execute(
        "INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)",
        ("user-default", "engineer"),
    )
    conn.commit()
