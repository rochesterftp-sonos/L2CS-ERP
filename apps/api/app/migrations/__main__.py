from app.migrations.apply import run_migrations
import asyncio

asyncio.run(run_migrations())
