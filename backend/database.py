from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection
from sqlalchemy import text

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
]


async def run_migrations() -> None:
    """Run idempotent ALTER TABLE migrations. Errors from duplicate columns are ignored."""
    async with engine.begin() as conn:
        for stmt in MIGRATIONS:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass  # Column already exists — safe to ignore


async def get_db() -> AsyncConnection:
    """FastAPI dependency — yields an open async connection."""
    async with engine.connect() as conn:
        yield conn
