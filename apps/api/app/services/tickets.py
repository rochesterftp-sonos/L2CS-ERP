from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid import new_id
from app.schemas.tickets import TicketCreate, TicketUpdate, TicketMessageCreate
from app.services.activities import create_activity


async def _get_sla_hours(db: AsyncSession, priority: str) -> tuple[int | None, int | None]:
    result = await db.execute(
        text("SELECT metadata FROM lookup_values WHERE type_key = 'ticket_priority' AND value_key = :p"),
        {"p": priority},
    )
    row = result.fetchone()
    if row and row[0]:
        meta = row[0]
        return meta.get("sla_first_response_hours"), meta.get("sla_resolution_hours")
    return None, None


async def list_tickets(
    db: AsyncSession,
    status: str | None = None,
    assigned_to: UUID | None = None,
    customer_id: UUID | None = None,
    unassigned: bool = False,
) -> list[dict]:
    query = """
        SELECT t.*, c.name as customer_name, u.display_name as assigned_to_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE 1=1
    """
    params: dict = {}

    if status:
        query += " AND t.status = :status"
        params["status"] = status
    if assigned_to:
        query += " AND t.assigned_to = :assigned_to"
        params["assigned_to"] = str(assigned_to)
    if customer_id:
        query += " AND t.customer_id = :customer_id"
        params["customer_id"] = str(customer_id)
    if unassigned:
        query += " AND t.assigned_to IS NULL"

    query += " ORDER BY t.created_at DESC"
    result = await db.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


async def get_ticket(db: AsyncSession, ticket_id: UUID) -> dict | None:
    result = await db.execute(
        text("""
            SELECT t.*, c.name as customer_name, u.display_name as assigned_to_name
            FROM tickets t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = :id
        """),
        {"id": str(ticket_id)},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def create_ticket(
    db: AsyncSession, data: TicketCreate, created_by: UUID | None = None
) -> dict:
    tid = new_id()
    now = datetime.now(timezone.utc)

    first_resp_hours, resolution_hours = await _get_sla_hours(db, data.priority)
    sla_first = now + timedelta(hours=first_resp_hours) if first_resp_hours else None
    sla_resolution = now + timedelta(hours=resolution_hours) if resolution_hours else None

    await db.execute(
        text("""
            INSERT INTO tickets (id, customer_id, subject, priority, category, assigned_to,
                sla_first_response_due, sla_resolution_due, created_by)
            VALUES (:id, :customer_id, :subject, :priority, :category, :assigned_to,
                :sla_first, :sla_resolution, :created_by)
        """),
        {
            "id": str(tid),
            "customer_id": str(data.customer_id) if data.customer_id else None,
            "subject": data.subject,
            "priority": data.priority,
            "category": data.category,
            "assigned_to": str(data.assigned_to) if data.assigned_to else None,
            "sla_first": sla_first,
            "sla_resolution": sla_resolution,
            "created_by": str(created_by) if created_by else None,
        },
    )

    await create_activity(
        db,
        customer_id=data.customer_id,
        activity_type="ticket_created",
        source="system",
        reference_table="tickets",
        reference_id=tid,
        title=f"Ticket created: {data.subject}",
        created_by=created_by,
    )

    await db.commit()
    return await get_ticket(db, tid)


async def update_ticket(db: AsyncSession, ticket_id: UUID, data: TicketUpdate, updated_by: UUID | None = None) -> dict | None:
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        return await get_ticket(db, ticket_id)

    set_clauses = []
    params = {"id": str(ticket_id)}
    for key, val in updates.items():
        if key == "assigned_to" and val is not None:
            val = str(val)
        set_clauses.append(f"{key} = :{key}")
        params[key] = val

    set_clauses.append("updated_at = now()")
    query = f"UPDATE tickets SET {', '.join(set_clauses)} WHERE id = :id"
    await db.execute(text(query), params)

    # Get ticket for activity context
    ticket = await get_ticket(db, ticket_id)
    if ticket:
        changes = ", ".join(f"{k}={v}" for k, v in updates.items())
        await create_activity(
            db,
            customer_id=ticket.get("customer_id"),
            activity_type="ticket_updated",
            source="user",
            reference_table="tickets",
            reference_id=ticket_id,
            title=f"Ticket updated: {changes}",
            created_by=updated_by,
        )

    await db.commit()
    return await get_ticket(db, ticket_id)


async def list_ticket_messages(db: AsyncSession, ticket_id: UUID) -> list[dict]:
    result = await db.execute(
        text("""
            SELECT tm.*, u.display_name as created_by_name
            FROM ticket_messages tm
            LEFT JOIN users u ON tm.created_by = u.id
            WHERE tm.ticket_id = :tid
            ORDER BY tm.created_at ASC
        """),
        {"tid": str(ticket_id)},
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def create_ticket_message(
    db: AsyncSession, ticket_id: UUID, data: TicketMessageCreate, created_by: UUID | None = None
) -> dict:
    mid = new_id()
    ticket = await get_ticket(db, ticket_id)

    await db.execute(
        text("""
            INSERT INTO ticket_messages (id, ticket_id, direction, body, created_by)
            VALUES (:id, :ticket_id, :direction, :body, :created_by)
        """),
        {
            "id": str(mid),
            "ticket_id": str(ticket_id),
            "direction": data.direction,
            "body": data.body,
            "created_by": str(created_by) if created_by else None,
        },
    )

    if ticket:
        await create_activity(
            db,
            customer_id=ticket.get("customer_id"),
            activity_type="ticket_message",
            source="user",
            reference_table="ticket_messages",
            reference_id=mid,
            title=f"Ticket message ({data.direction})",
            summary=data.body[:200],
            created_by=created_by,
        )

    await db.commit()
    result = await db.execute(
        text("""
            SELECT tm.*, u.display_name as created_by_name
            FROM ticket_messages tm
            LEFT JOIN users u ON tm.created_by = u.id
            WHERE tm.id = :id
        """),
        {"id": str(mid)},
    )
    return dict(result.fetchone()._mapping)
