"""
Billing service — QBO mapping CRUD + billing data read-through.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid import new_id


async def get_qbo_mapping(db: AsyncSession, customer_id: UUID) -> dict | None:
    result = await db.execute(
        text("SELECT * FROM customer_qbo_mappings WHERE customer_id = :cid"),
        {"cid": str(customer_id)},
    )
    row = result.first()
    return dict(row._mapping) if row else None


async def create_qbo_mapping(
    db: AsyncSession, customer_id: UUID, qbo_customer_id: str, qbo_display_name: str | None
) -> dict:
    mapping_id = new_id()
    await db.execute(
        text("""
            INSERT INTO customer_qbo_mappings (id, customer_id, qbo_customer_id, qbo_display_name)
            VALUES (:id, :cid, :qbo_id, :name)
        """),
        {
            "id": str(mapping_id),
            "cid": str(customer_id),
            "qbo_id": qbo_customer_id,
            "name": qbo_display_name,
        },
    )
    await db.commit()
    return await get_qbo_mapping(db, customer_id)


async def delete_qbo_mapping(db: AsyncSession, customer_id: UUID) -> bool:
    result = await db.execute(
        text("DELETE FROM customer_qbo_mappings WHERE customer_id = :cid"),
        {"cid": str(customer_id)},
    )
    await db.commit()
    return result.rowcount > 0


async def get_qbo_connection(db: AsyncSession) -> dict | None:
    result = await db.execute(text("SELECT * FROM qbo_connections ORDER BY connected_at DESC LIMIT 1"))
    row = result.first()
    return dict(row._mapping) if row else None


async def save_qbo_connection(
    db: AsyncSession,
    *,
    realm_id: str,
    access_token: str,
    refresh_token: str,
    token_expires_at,
    company_name: str | None,
    connected_by: str,
) -> dict:
    conn = await get_qbo_connection(db)
    if conn:
        await db.execute(
            text("""
                UPDATE qbo_connections
                SET realm_id = :realm, access_token = :at, refresh_token = :rt,
                    token_expires_at = :exp, company_name = :name, updated_at = now()
                WHERE id = :id
            """),
            {
                "id": str(conn["id"]),
                "realm": realm_id,
                "at": access_token,
                "rt": refresh_token,
                "exp": token_expires_at,
                "name": company_name,
            },
        )
    else:
        conn_id = new_id()
        await db.execute(
            text("""
                INSERT INTO qbo_connections (id, realm_id, access_token, refresh_token, token_expires_at, company_name, connected_by)
                VALUES (:id, :realm, :at, :rt, :exp, :name, :by)
            """),
            {
                "id": str(conn_id),
                "realm": realm_id,
                "at": access_token,
                "rt": refresh_token,
                "exp": token_expires_at,
                "name": company_name,
                "by": connected_by,
            },
        )
    await db.commit()
    return await get_qbo_connection(db)


async def delete_qbo_connection(db: AsyncSession) -> bool:
    result = await db.execute(text("DELETE FROM qbo_connections"))
    await db.commit()
    return result.rowcount > 0
