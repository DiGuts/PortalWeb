from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

_DEFAULT_DB = "sqlite+aiosqlite:///" + (Path(__file__).parent / "tavil_portal.db").as_posix()
DATABASE_URL = os.getenv("DB_URL", _DEFAULT_DB)
# Production MariaDB: set env var DB_URL = "mysql+aiomysql://user:pass@host/dbname"

engine = create_async_engine(DATABASE_URL, echo=False)

SCHEMA_FILE = Path(__file__).parent / "schema.sql"


async def init_db() -> None:
    """Create all tables on startup (idempotent — uses IF NOT EXISTS)."""
    ddl = SCHEMA_FILE.read_text(encoding="utf-8")

    is_mysql = DATABASE_URL.startswith("mysql")
    if is_mysql:
        # Adapt SQLite-specific syntax to MariaDB/MySQL
        ddl = ddl.replace("AUTOINCREMENT", "AUTO_INCREMENT")
        ddl = ddl.replace("datetime('now')", "CURRENT_TIMESTAMP")
        # Strip SQL comments (MariaDB rejects em-dash characters in -- comments)
        import re
        ddl = re.sub(r'--[^\n]*', '', ddl)

    # Split on semicolons so each statement runs individually
    statements = [s.strip() for s in ddl.split(";") if s.strip()]
    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))


MIGRATIONS = [
    # Add new columns to existing tables (safe: ignore if column already exists)
    "ALTER TABLE users ADD COLUMN onboarded INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN email_notifs INTEGER NOT NULL DEFAULT 1",
    # email_verified defaults to 1 so existing users are pre-verified
    "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1",
    # is_head: boolean separate from role — backfill from existing "Responsable de departament" role
    "ALTER TABLE users ADD COLUMN is_head INTEGER NOT NULL DEFAULT 0",
    "UPDATE users SET is_head = 1 WHERE role = 'Responsable de departament'",
    "ALTER TABLE courses ADD COLUMN url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE suggestions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE incidencies ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0",
    # Indexes for frequent lookups
    "CREATE INDEX IF NOT EXISTS idx_suggestion_votes_user ON suggestion_votes(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_suggestion_votes_sid ON suggestion_votes(suggestion_id)",
    "CREATE INDEX IF NOT EXISTS idx_suggestions_user ON suggestions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_incidencies_user ON incidencies(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_vacances_user ON vacances(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_enquesta_responses_email ON enquesta_responses(user_email)",
    "ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0",
    # Quiz tables (added 2026-04-29) — CREATE IF NOT EXISTS so safe to re-run
    """CREATE TABLE IF NOT EXISTS quizzes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      description   TEXT    NOT NULL DEFAULT '',
      category      TEXT    NOT NULL DEFAULT '',
      time_limit    INTEGER NOT NULL DEFAULT 0,
      passing_score INTEGER NOT NULL DEFAULT 70,
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )""",
    """CREATE TABLE IF NOT EXISTS quiz_questions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      type        TEXT    NOT NULL DEFAULT 'multiple_choice',
      question    TEXT    NOT NULL DEFAULT '',
      explanation TEXT    NOT NULL DEFAULT '',
      points      INTEGER NOT NULL DEFAULT 1,
      position    INTEGER NOT NULL DEFAULT 0
    )""",
    """CREATE TABLE IF NOT EXISTS quiz_options (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      text        TEXT    NOT NULL DEFAULT '',
      is_correct  INTEGER NOT NULL DEFAULT 0,
      match_pair  TEXT    NOT NULL DEFAULT '',
      position    INTEGER NOT NULL DEFAULT 0
    )""",
    """CREATE TABLE IF NOT EXISTS quiz_attempts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id      INTEGER NOT NULL REFERENCES quizzes(id),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      score        INTEGER NOT NULL DEFAULT 0,
      max_score    INTEGER NOT NULL DEFAULT 0,
      passed       INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT    NOT NULL DEFAULT '{}',
      completed_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(quiz_id, user_id)
    )""",
]


async def run_migrations() -> None:
    """Run idempotent ALTER TABLE migrations. Errors from duplicate columns are ignored."""
    async with engine.begin() as conn:
        for stmt in MIGRATIONS:
            try:
                await conn.execute(text(stmt))
            except (OperationalError, ProgrammingError):
                pass  # Column/index already exists — safe to ignore


async def get_db() -> AsyncConnection:
    """FastAPI dependency — yields an open async connection."""
    async with engine.connect() as conn:
        yield conn
