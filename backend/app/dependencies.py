"""
FastAPI Dependencies for Authentication, Database Access, and Configuration.
"""
from typing import Dict, Any, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import Settings, settings
from app.services.auth_service import auth_service
from app.services.supabase_service import supabase_service, SupabaseService

security = HTTPBearer(auto_error=False)


async def get_settings() -> Settings:
    return settings


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Extracts Bearer token from Authorization header and verifies Supabase JWT.
    In development/demo mode, provides a graceful fallback to demo user when token is omitted.
    """
    token = credentials.credentials if credentials else None

    if not token and settings.is_mock_mode:
        # Default mock demo user during hackathon development
        user_id = "00000000-0000-0000-0000-000000000001"
        return auth_service.ensure_user_profile(
            user_id=user_id,
            email="creator@reelreason.ai",
            name="Demo Creator"
        )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = auth_service.verify_supabase_jwt(token)
    user_id = claims.get("sub") or claims.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' subject claim"
        )

    email = claims.get("email")
    meta = claims.get("user_metadata", {})
    name = meta.get("full_name") or meta.get("name") or (email.split("@")[0] if email else "Creator")

    # Constraint 2 check: Ensure public.users record exists to avoid FK error
    user_record = auth_service.ensure_user_profile(user_id=user_id, email=email, name=name)
    return user_record


async def get_supabase() -> SupabaseService:
    return supabase_service
