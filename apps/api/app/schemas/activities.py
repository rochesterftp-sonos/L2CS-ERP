from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: UUID
    customer_id: UUID | None
    activity_type: str
    source: str | None
    reference_table: str | None
    reference_id: UUID | None
    title: str
    summary: str | None
    occurred_at: datetime
    created_by: UUID | None
    created_at: datetime
    created_by_name: str | None = None
