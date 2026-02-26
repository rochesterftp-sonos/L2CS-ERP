from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid import new_id
from app.schemas.customers import ContactCreate, ContactUpdate


async def list_contacts(db: AsyncSession, customer_id: UUID) -> list[dict]:
    result = await db.execute(
        text("""
            SELECT * FROM contacts
            WHERE customer_id = :cid AND is_active = true
            ORDER BY is_primary DESC, last_name, first_name
        """),
        {"cid": str(customer_id)},
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def get_contact(db: AsyncSession, customer_id: UUID, contact_id: UUID) -> dict | None:
    result = await db.execute(
        text("SELECT * FROM contacts WHERE id = :id AND customer_id = :cid AND is_active = true"),
        {"id": str(contact_id), "cid": str(customer_id)},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def create_contact(db: AsyncSession, customer_id: UUID, data: ContactCreate) -> dict:
    cid = new_id()
    await db.execute(
        text("""
            INSERT INTO contacts (id, customer_id, first_name, last_name, email, phone, title, is_primary)
            VALUES (:id, :customer_id, :first_name, :last_name, :email, :phone, :title, :is_primary)
        """),
        {
            "id": str(cid),
            "customer_id": str(customer_id),
            "first_name": data.first_name,
            "last_name": data.last_name,
            "email": data.email,
            "phone": data.phone,
            "title": data.title,
            "is_primary": data.is_primary,
        },
    )
    await db.commit()
    return await get_contact(db, customer_id, cid)


async def update_contact(
    db: AsyncSession, customer_id: UUID, contact_id: UUID, data: ContactUpdate
) -> dict | None:
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        return await get_contact(db, customer_id, contact_id)

    set_clauses = [f"{k} = :{k}" for k in updates]
    set_clauses.append("updated_at = now()")
    params = {"id": str(contact_id), "cid": str(customer_id), **updates}
    query = f"UPDATE contacts SET {', '.join(set_clauses)} WHERE id = :id AND customer_id = :cid"
    await db.execute(text(query), params)
    await db.commit()
    return await get_contact(db, customer_id, contact_id)


async def delete_contact(db: AsyncSession, customer_id: UUID, contact_id: UUID) -> bool:
    result = await db.execute(
        text("UPDATE contacts SET is_active = false, updated_at = now() WHERE id = :id AND customer_id = :cid"),
        {"id": str(contact_id), "cid": str(customer_id)},
    )
    await db.commit()
    return result.rowcount > 0
