"""
Migration runner — applies raw SQL files in lexical order.

Usage:
    python -m app.migrations.apply
"""

import asyncio
import os
from pathlib import Path

import asyncpg

from app.core.config import settings

SQL_DIR = Path(__file__).parent / "sql"


def _get_dsn() -> str:
    """Convert SQLAlchemy async URL to plain DSN for asyncpg."""
    url = settings.database_url
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url


async def run_migrations():
    conn = await asyncpg.connect(_get_dsn())
    try:
        # Ensure schema_migrations table exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """)

        # Get already-applied migrations
        rows = await conn.fetch("SELECT filename FROM schema_migrations")
        applied = {row["filename"] for row in rows}

        # Gather and sort SQL files
        sql_files = sorted(f for f in os.listdir(SQL_DIR) if f.endswith(".sql"))

        for filename in sql_files:
            if filename in applied:
                continue
            print(f"Applying migration: {filename}")
            sql = (SQL_DIR / filename).read_text()
            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)", filename
                )
            print(f"  done: {filename}")

    finally:
        await conn.close()

    print("Migrations complete.")


if __name__ == "__main__":
    asyncio.run(run_migrations())
