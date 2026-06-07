"""
═══════════════════════════════════════════════════════════════
  Users Module — Router (API Endpoints)
═══════════════════════════════════════════════════════════════
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user
from src.modules.users.models import Profile
from src.modules.users.schemas import (
    ConsentCreate,
    ConsentResponse,
    DeleteAccountRequest,
    LevelResponse,
    ProfileResponse,
    ProfileUpdate,
    RegionResponse,
)
from src.modules.users.service import UserService

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the current user's profile."""
    service = UserService(db)
    return await service.get_profile(current_user.id)


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update the current user's profile."""
    service = UserService(db)
    return await service.update_profile(current_user.id, data)


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_user_profile(
    user_id: uuid.UUID,
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific user's profile."""
    service = UserService(db)
    return await service.get_profile(user_id)


@router.get("/levels/all", response_model=list[LevelResponse])
async def get_levels(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all gamification levels."""
    service = UserService(db)
    return await service.get_levels()


@router.get("/regions/all", response_model=list[RegionResponse])
async def get_regions(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all regions."""
    service = UserService(db)
    return await service.get_regions()


@router.post("/me/referral-code")
async def generate_referral(
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate a referral code for the current user."""
    service = UserService(db)
    code = await service.generate_referral_code(current_user.id)
    return {"referral_code": code}


# ═══ CONSENT MANAGEMENT (LGPD §8.1) ═══

@router.post("/me/consents", response_model=ConsentResponse)
async def record_consent(
    data: ConsentCreate,
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Record a granular LGPD consent.
    Types: data_processing, communication, public_ranking
    """
    service = UserService(db)
    return await service.record_consent(current_user.id, data)


@router.get("/me/consents", response_model=list[ConsentResponse])
async def get_my_consents(
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all consents for the current user."""
    service = UserService(db)
    return await service.get_user_consents(current_user.id)


@router.delete("/me/consents/{consent_type}")
async def revoke_consent(
    consent_type: str,
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Revoke a specific consent type (LGPD right)."""
    service = UserService(db)
    return await service.revoke_consent(current_user.id, consent_type)


@router.delete("/me/account")
async def delete_my_account(
    data: DeleteAccountRequest,
    current_user: Annotated[Profile, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete account and anonymize data (LGPD §8.1).
    User must confirm by typing 'EXCLUIR MINHA CONTA'.
    """
    service = UserService(db)
    return await service.delete_account(current_user.id, data)
