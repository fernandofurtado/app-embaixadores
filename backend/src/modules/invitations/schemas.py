"""
═══════════════════════════════════════════════════════════════
  Invitations Module — Schemas
═══════════════════════════════════════════════════════════════
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class InviteCreate(BaseModel):
    """Create a trackable invitation."""
    invitee_email: EmailStr | None = None
    invitee_phone: str | None = Field(None, max_length=20)


class InviteResponse(BaseModel):
    id: uuid.UUID
    inviter_id: uuid.UUID
    invitee_email: str | None = None
    invitee_phone: str | None = None
    invite_code: str
    status: str
    created_at: datetime
    registered_at: datetime | None = None
    verified_at: datetime | None = None

    model_config = {"from_attributes": True}


class InviteTrackingResponse(BaseModel):
    """Tracking summary for the inviter."""
    total_invites: int = 0
    pending: int = 0
    registered: int = 0
    verified: int = 0
    invitations: list[InviteResponse] = []
