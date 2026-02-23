from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid import new_id


async def create_activity(
    db: AsyncSession,
    *,
    customer_id: UUID | None = None,
    activity_type: str,
    source: str | None = None,
    reference_table: str | None = None,
    reference_id: UUID | None = None,
    title: str,
    summary: str | None = None,
    occurred_at: datetime | None = None,
    created_by: UUID | None = None,
) -> dict:
    aid = new_id()
    await db.execute(
        text("""
            INSERT INTO activities (id, customer_id, activity_type, source, reference_table, reference_id, title, summary, occurred_at, created_by)
            VALUES (:id, :customer_id, :activity_type, :source, :reference_table, :reference_id, :title, :summary, COALESCE(:occurred_at, now()), :created_by)
        """),
        {
            "id": str(aid),
            "customer_id": str(customer_id) if customer_id else None,
            "activity_type": activity_type,
            "source": source,
            "reference_table": reference_table,
            "reference_id": str(reference_id) if reference_id else None,
            "title": title,
            "summary": summary,
            "occurred_at": occurred_at,
            "created_by": str(created_by) if created_by else None,
        },
    )
    return {"id": str(aid)}


async def list_activities(
    db: AsyncSession,
    customer_id: UUID,
    activity_type: str | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
) -> list[dict]:
    query = """
        SELECT a.*, u.display_name as created_by_name
        FROM activities a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.customer_id = :cid
    """
    params: dict = {"cid": str(customer_id)}

    if activity_type:
        query += " AND a.activity_type = :atype"
        params["atype"] = activity_type
    if from_date:
        query += " AND a.occurred_at >= :from_date"
        params["from_date"] = from_date
    if to_date:
        query += " AND a.occurred_at <= :to_date"
        params["to_date"] = to_date

    query += " ORDER BY a.occurred_at DESC LIMIT 100"
    result = await db.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]
