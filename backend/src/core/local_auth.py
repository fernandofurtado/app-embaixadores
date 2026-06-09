"""
═══════════════════════════════════════════════════════════════
  Local Auth — bcrypt + JWT for local development
  Used when AUTH_MODE=local to avoid Supabase dependency.
═══════════════════════════════════════════════════════════════
"""

import uuid
from datetime import datetime, timezone, timedelta

import bcrypt
from jose import jwt

from src.core.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    """Create a JWT access token (HS256)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
        "iss": "embaixadores-local",
        "role": "authenticated",
    }
    return jwt.encode(payload, settings.api_secret_key, algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token (HS256) with longer expiry."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_refresh_token_expire_days),
        "iss": "embaixadores-local",
        "type": "refresh",
    }
    return jwt.encode(payload, settings.api_secret_key, algorithm="HS256")
