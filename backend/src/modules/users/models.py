"""
═══════════════════════════════════════════════════════════════
  Users Module — SQLAlchemy Models
═══════════════════════════════════════════════════════════════
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.shared.models import SoftDeleteMixin, TimestampMixin


class Region(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "regions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("regions.id"), nullable=True)
    coordinator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True
    )
    city: Mapped[str | None] = mapped_column(String(200), nullable=True)
    state: Mapped[str | None] = mapped_column(String(2), nullable=True)

    # Relationships
    profiles: Mapped[list["Profile"]] = relationship("Profile", back_populates="region", foreign_keys="Profile.region_id")


class Profile(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(300), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cpf: Mapped[str | None] = mapped_column(String(14), unique=True, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    birth_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Location
    region_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("regions.id"), nullable=True)
    neighborhood: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str | None] = mapped_column(String(200), nullable=True)
    state: Mapped[str | None] = mapped_column(String(2), default="SP")
    zip_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(11, 8), nullable=True)

    # Gamification
    current_level_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("levels.id"), nullable=True
    )
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    level_pending_approval: Mapped[bool] = mapped_column(Boolean, default=False)

    # Role & status (PRD §7.2 RBAC roles)
    # Valid roles: participant, moderator, regional_coordinator, campaign_manager, super_admin, analyst
    role: Mapped[str] = mapped_column(String(30), default="participant")
    referral_code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    referred_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    region: Mapped[Region | None] = relationship("Region", back_populates="profiles", foreign_keys=[region_id])
    current_level: Mapped["Level | None"] = relationship("Level", foreign_keys=[current_level_id])
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="user")
    user_missions: Mapped[list["UserMission"]] = relationship("UserMission", back_populates="user", foreign_keys="UserMission.user_id")
    user_badges: Mapped[list["UserBadge"]] = relationship("UserBadge", back_populates="user")
    consents: Mapped[list["Consent"]] = relationship("Consent", back_populates="user")


class Level(Base, TimestampMixin):
    """
    Gamification levels with parametrizable thresholds.
    PRD §3.1: Limiares configuráveis pela campanha (não hardcoded).
    """
    __tablename__ = "levels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    min_points: Mapped[int] = mapped_column(Integer, nullable=False)
    max_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    icon_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)

    # PRD §3.1: Extra requirements per level
    min_missions_completed: Mapped[int] = mapped_column(Integer, default=0)
    min_referrals_active: Mapped[int] = mapped_column(Integer, default=0)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)


class Consent(Base):
    """
    LGPD granular consent tracking.
    PRD §8.1: Consentimento granular no cadastro com registro de data/versão do termo.
    consent_type values: 'data_processing', 'communication', 'public_ranking'
    """
    __tablename__ = "consents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    consent_type: Mapped[str] = mapped_column(String(50), nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    granted: Mapped[bool] = mapped_column(Boolean, default=True)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now()
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[Profile] = relationship("Profile", back_populates="consents")
