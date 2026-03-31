from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection
from sqlalchemy import text

import os

_DEFAULT_DB = "sqlite+aiosqlite:///" + (Path(__file__).parent / "tavil_portal.db").as_posix()
DATABASE_URL = os.getenv("DB_URL", _DEFAULT_DB)
# Production MariaDB: set env var DB_URL = "mysql+aiomysql://user:pass@host/dbname"

engine = create_async_engine(DATABASE_URL, echo=False)

SCHEMA_FILE = Path(__file__).parent / "schema.sql"


async def init_db() -> None:
    """Create all tables on startup (idempotent — uses IF NOT EXISTS)."""
    ddl = SCHEMA_FILE.read_text(encoding="utf-8")
    # Split on semicolons so each statement runs individually
    statements = [s.strip() for s in ddl.split(";") if s.strip()]
    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))


async def get_db() -> AsyncConnection:
    """FastAPI dependency — yields an open async connection."""
    async with engine.connect() as conn:
        yield conn
