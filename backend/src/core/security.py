"""
═══════════════════════════════════════════════════════════════
  Security — JWT Verification & Auth Dependencies
  Verifies Supabase-issued JWTs (ES256 or HS256) and provides current user.
═══════════════════════════════════════════════════════════════
"""

import json
from datetime import datetime, timezone
from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.modules.users.models import Profile

security_scheme = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict:
    """Fetch and cache the JWKS from Supabase Auth."""
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        response = httpx.get(jwks_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"⚠️ Failed to fetch JWKS from {jwks_url}: {e}")
        return {"keys": []}


def _verify_token(token: str) -> dict:
    """
    Verify a JWT token using Supabase JWKS (ES256) or fallback to HS256.
    """
    # Try ES256 with JWKS first
    jwks = _fetch_jwks()
    if jwks.get("keys"):
        # Get the header to find the kid
        try:
            unverified_header = jwt.get_unverified_header(token)
        except JWTError as e:
            raise JWTError(f"Header inválido: {e}") from e

        # Find the matching key
        kid = unverified_header.get("kid")
        alg = unverified_header.get("alg", "ES256")

        for key_data in jwks["keys"]:
            if key_data.get("kid") == kid:
                # Build the public key and verify
                public_key = jwk.construct(key_data, algorithm=alg)
                return jwt.decode(
                    token,
                    public_key,
                    algorithms=[alg],
                    options={"verify_aud": False},
                )

    # Fallback to HS256 with secret
    jwt_secret = settings.supabase_jwt_secret or settings.api_secret_key
    return jwt.decode(
        token,
        jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Profile:
    """
    FastAPI dependency that extracts and verifies the JWT from the
    Authorization header, then returns the corresponding user profile.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = _verify_token(token)

        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: user ID ausente",
            )

        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(tz=timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado",
            )

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {e!s}",
        ) from e

    # Fetch user profile from database
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuário não encontrado",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada",
        )

    return user


async def get_current_admin(
    current_user: Annotated[Profile, Depends(get_current_user)],
) -> Profile:
    """Dependency that ensures the current user has admin privileges."""
    admin_roles = {"admin", "super_admin", "coordinator"}
    if current_user.role not in admin_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores",
        )
    return current_user


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Profile | None:
    """Optional auth — returns None if no token is provided."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
