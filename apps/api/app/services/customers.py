from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid import new_id
from app.schemas.customers import (
    CustomerCreate,
    CustomerUpdate,
    DomainCreate,
    MailboxMappingCreate,
    MailboxMappingUpdate,
)


async def list_customers(
    db: AsyncSession,
    search: str | None = None,
    engagement_manager_id: UUID | None = None,
    risk_status: str | None = None,
    cmmc_status: str | None = None,
) -> list[dict]:
    query = "SELECT * FROM customers WHERE is_active = true"
    params: dict = {}

    if search:
        query += " AND (name ILIKE :search OR primary_domain ILIKE :search)"
        params["search"] = f"%{search}%"
    if engagement_manager_id:
        query += " AND engagement_manager_id = :em_id"
        params["em_id"] = str(engagement_manager_id)
    if risk_status:
        query += " AND risk_status = :risk"
        params["risk"] = risk_status
    if cmmc_status:
        query += " AND cmmc_status = :cmmc"
        params["cmmc"] = cmmc_status

    query += " ORDER BY name"
    result = await db.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


async def get_customer(db: AsyncSession, customer_id: UUID) -> dict | None:
    result = await db.execute(
        text("SELECT * FROM customers WHERE id = :id AND is_active = true"),
        {"id": str(customer_id)},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def create_customer(db: AsyncSession, data: CustomerCreate) -> dict:
    cid = new_id()
    await db.execute(
        text("""
            INSERT INTO customers (id, name, primary_domain, engagement_manager_id,
                risk_status, cmmc_status, contract_start, contract_end,
                sharepoint_url, grc_url, vault_url, notes)
            VALUES (:id, :name, :primary_domain, :engagement_manager_id,
                :risk_status, :cmmc_status, :contract_start, :contract_end,
                :sharepoint_url, :grc_url, :vault_url, :notes)
        """),
        {
            "id": str(cid),
            "name": data.name,
            "primary_domain": data.primary_domain,
            "engagement_manager_id": str(data.engagement_manager_id) if data.engagement_manager_id else None,
            "risk_status": data.risk_status,
            "cmmc_status": data.cmmc_status,
            "contract_start": data.contract_start,
            "contract_end": data.contract_end,
            "sharepoint_url": data.sharepoint_url,
            "grc_url": data.grc_url,
            "vault_url": data.vault_url,
            "notes": data.notes,
        },
    )
    # Auto-create primary domain if provided
    if data.primary_domain:
        await db.execute(
            text("""
                INSERT INTO customer_domains (id, customer_id, domain, is_primary)
                VALUES (:id, :cid, :domain, true)
                ON CONFLICT (domain) DO NOTHING
            """),
            {"id": str(new_id()), "cid": str(cid), "domain": data.primary_domain},
        )
    await db.commit()
    return await get_customer(db, cid)


async def update_customer(db: AsyncSession, customer_id: UUID, data: CustomerUpdate) -> dict | None:
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        return await get_customer(db, customer_id)

    set_clauses = []
    params = {"id": str(customer_id)}
    for key, val in updates.items():
        if key == "engagement_manager_id" and val is not None:
            val = str(val)
        set_clauses.append(f"{key} = :{key}")
        params[key] = val

    set_clauses.append("updated_at = now()")
    query = f"UPDATE customers SET {', '.join(set_clauses)} WHERE id = :id AND is_active = true"
    await db.execute(text(query), params)
    await db.commit()
    return await get_customer(db, customer_id)


# --- Domains ---

async def list_domains(db: AsyncSession, customer_id: UUID) -> list[dict]:
    result = await db.execute(
        text("SELECT * FROM customer_domains WHERE customer_id = :cid ORDER BY is_primary DESC, domain"),
        {"cid": str(customer_id)},
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def add_domain(db: AsyncSession, customer_id: UUID, data: DomainCreate) -> dict:
    did = new_id()
    await db.execute(
        text("""
            INSERT INTO customer_domains (id, customer_id, domain, is_primary)
            VALUES (:id, :cid, :domain, :is_primary)
        """),
        {"id": str(did), "cid": str(customer_id), "domain": data.domain, "is_primary": data.is_primary},
    )
    await db.commit()
    result = await db.execute(text("SELECT * FROM customer_domains WHERE id = :id"), {"id": str(did)})
    return dict(result.fetchone()._mapping)


async def delete_domain(db: AsyncSession, customer_id: UUID, domain_id: UUID) -> bool:
    result = await db.execute(
        text("DELETE FROM customer_domains WHERE id = :id AND customer_id = :cid"),
        {"id": str(domain_id), "cid": str(customer_id)},
    )
    await db.commit()
    return result.rowcount > 0


# --- Mailbox Mappings ---

async def list_mailbox_mappings(db: AsyncSession, customer_id: UUID) -> list[dict]:
    result = await db.execute(
        text("SELECT * FROM customer_mailbox_mappings WHERE customer_id = :cid ORDER BY is_primary DESC, mailbox_email"),
        {"cid": str(customer_id)},
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def create_mailbox_mapping(db: AsyncSession, customer_id: UUID, data: MailboxMappingCreate) -> dict:
    mid = new_id()
    await db.execute(
        text("""
            INSERT INTO customer_mailbox_mappings (id, customer_id, mailbox_email, folder_id, folder_path, include_subfolders, is_primary)
            VALUES (:id, :cid, :mailbox_email, :folder_id, :folder_path, :include_subfolders, :is_primary)
        """),
        {
            "id": str(mid),
            "cid": str(customer_id),
            "mailbox_email": data.mailbox_email,
            "folder_id": data.folder_id,
            "folder_path": data.folder_path,
            "include_subfolders": data.include_subfolders,
            "is_primary": data.is_primary,
        },
    )
    await db.commit()
    result = await db.execute(text("SELECT * FROM customer_mailbox_mappings WHERE id = :id"), {"id": str(mid)})
    return dict(result.fetchone()._mapping)


async def update_mailbox_mapping(
    db: AsyncSession, customer_id: UUID, mapping_id: UUID, data: MailboxMappingUpdate
) -> dict | None:
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        result = await db.execute(
            text("SELECT * FROM customer_mailbox_mappings WHERE id = :id AND customer_id = :cid"),
            {"id": str(mapping_id), "cid": str(customer_id)},
        )
        row = result.fetchone()
        return dict(row._mapping) if row else None

    set_clauses = [f"{k} = :{k}" for k in updates]
    set_clauses.append("updated_at = now()")
    params = {"id": str(mapping_id), "cid": str(customer_id), **updates}
    query = f"UPDATE customer_mailbox_mappings SET {', '.join(set_clauses)} WHERE id = :id AND customer_id = :cid"
    await db.execute(text(query), params)
    await db.commit()
    result = await db.execute(
        text("SELECT * FROM customer_mailbox_mappings WHERE id = :id"),
        {"id": str(mapping_id)},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def delete_mailbox_mapping(db: AsyncSession, customer_id: UUID, mapping_id: UUID) -> bool:
    result = await db.execute(
        text("DELETE FROM customer_mailbox_mappings WHERE id = :id AND customer_id = :cid"),
        {"id": str(mapping_id), "cid": str(customer_id)},
    )
    await db.commit()
    return result.rowcount > 0
