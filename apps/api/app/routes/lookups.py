from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db

router = APIRouter(prefix="/lookups", tags=["lookups"])


class CreateLookupValue(BaseModel):
    value_key: str
    label: str
    sort_order: int = 0


class UpdateLookupValue(BaseModel):
    label: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ReorderItem(BaseModel):
    id: str
    sort_order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


@router.get("")
async def list_lookup_types(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    result = await db.execute(text("SELECT * FROM lookup_types ORDER BY type_key"))
    return [dict(row._mapping) for row in result.fetchall()]


@router.get("/{type_key}")
async def get_lookup_values(
    type_key: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    result = await db.execute(
        text("SELECT * FROM lookup_values WHERE type_key = :tk AND is_active = true ORDER BY sort_order"),
        {"tk": type_key},
    )
    return [dict(row._mapping) for row in result.fetchall()]


@router.post("/{type_key}")
async def create_lookup_value(
    type_key: str,
    body: CreateLookupValue,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    # Check type exists
    row = await db.execute(
        text("SELECT 1 FROM lookup_types WHERE type_key = :tk"), {"tk": type_key}
    )
    if not row.scalar():
        raise HTTPException(404, "Lookup type not found")

    # Check for duplicate value_key
    row = await db.execute(
        text("SELECT 1 FROM lookup_values WHERE type_key = :tk AND value_key = :vk"),
        {"tk": type_key, "vk": body.value_key},
    )
    if row.scalar():
        raise HTTPException(409, "Value key already exists")

    await db.execute(
        text("""
            INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system)
            VALUES (gen_random_uuid(), :tk, :vk, :label, :sort, false)
        """),
        {"tk": type_key, "vk": body.value_key, "label": body.label, "sort": body.sort_order},
    )
    await db.commit()
    return {"status": "created"}


@router.put("/{type_key}/reorder")
async def reorder_lookup_values(
    type_key: str,
    body: ReorderRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    for item in body.items:
        await db.execute(
            text("UPDATE lookup_values SET sort_order = :sort WHERE id = :id::uuid AND type_key = :tk"),
            {"sort": item.sort_order, "id": item.id, "tk": type_key},
        )
    await db.commit()
    return {"status": "reordered"}


@router.put("/{type_key}/{value_id}")
async def update_lookup_value(
    type_key: str,
    value_id: str,
    body: UpdateLookupValue,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    sets = []
    params: dict = {"id": value_id, "tk": type_key}
    if body.label is not None:
        sets.append("label = :label")
        params["label"] = body.label
    if body.sort_order is not None:
        sets.append("sort_order = :sort")
        params["sort"] = body.sort_order
    if body.is_active is not None:
        sets.append("is_active = :active")
        params["active"] = body.is_active

    if not sets:
        raise HTTPException(400, "No fields to update")

    result = await db.execute(
        text(f"UPDATE lookup_values SET {', '.join(sets)} WHERE id = :id::uuid AND type_key = :tk"),
        params,
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Lookup value not found")
    await db.commit()
    return {"status": "updated"}


@router.delete("/{type_key}/{value_id}")
async def delete_lookup_value(
    type_key: str,
    value_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    # Check if system value
    row = await db.execute(
        text("SELECT is_system FROM lookup_values WHERE id = :id::uuid AND type_key = :tk"),
        {"id": value_id, "tk": type_key},
    )
    val = row.fetchone()
    if not val:
        raise HTTPException(404, "Lookup value not found")
    if val[0]:
        raise HTTPException(403, "Cannot delete system-defined values. Deactivate instead.")

    await db.execute(
        text("DELETE FROM lookup_values WHERE id = :id::uuid AND type_key = :tk"),
        {"id": value_id, "tk": type_key},
    )
    await db.commit()
    return {"status": "deleted"}
