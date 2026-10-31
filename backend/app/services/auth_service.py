"""
Authentication and JWT verification service for Supabase Auth.
Validates JWT tokens, extracts authenticated user claims, and guarantees user record existence.
"""
import jwt
import logging
import threading
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.config import settings
from app.services.supabase_service import supabase_service

logger = logging.getLogger("reelreason.auth")

DEFAULT_DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_DEMO_EMAIL = "creator@reelreason.ai"

_jwk_client: Optional[jwt.PyJWKClient] = None
_jwk_client_lock = threading.Lock()


def _get_jwk_client() -> jwt.PyJWKClient:
    """
    Lazily creates a JWKS client for asymmetric Supabase JWT signing keys
    (newer projects issue ES256/RS256 tokens signed via the JWT signing keys,
    not the legacy HS256 shared secret). Keys are fetched, cached, and rotated
    automatically by PyJWKClient.
    """
    global _jwk_client
    if _jwk_client is None:
        with _jwk_client_lock:
            if _jwk_client is None:
                jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
                _jwk_client = jwt.PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client


class AuthService:
    def verify_supabase_jwt(self, token: str) -> Dict[str, Any]:
        """
        Validates Supabase JWT signature.
        Supports both asymmetric (JWKS / ES256 / RS256) tokens issued by newer
        Supabase projects and legacy HS256 tokens signed with SUPABASE_JWT_SECRET.
        Falls back to demo user if running in mock/demo mode.
        """
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization bearer token is missing",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Allow simple demo tokens during development/demo
        if settings.is_mock_mode and (token == "demo-token" or token.startswith("mock_") or token == "Bearer demo-token"):
            return {
                "sub": DEFAULT_DEMO_USER_ID,
                "email": DEFAULT_DEMO_EMAIL,
                "role": "authenticated",
                "user_metadata": {"full_name": "Demo Creator"}
            }

        try:
            header = jwt.get_unverified_header(token)

            # New-style asymmetric token (kid present, non-HS256): verify via JWKS
            if header.get("kid") and header.get("alg") != "HS256" and settings.SUPABASE_URL:
                signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=[header["alg"]],
                    audience="authenticated",
                )
                return payload

            # Legacy symmetric token: verify with the shared JWT secret
            if settings.SUPABASE_JWT_SECRET and not settings.SUPABASE_JWT_SECRET.startswith("placeholder"):
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated"
                )
                return payload

            # No credentials configured — accept unverified only in mock mode
            if settings.is_mock_mode:
                return jwt.decode(token, options={"verify_signature": False})

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication is not configured on the server",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.PyJWTError as e:
            logger.warning(f"JWT Verification failed: {e}")
            if settings.is_mock_mode:
                # In mock/demo mode gracefully return demo user
                return {
                    "sub": DEFAULT_DEMO_USER_ID,
                    "email": DEFAULT_DEMO_EMAIL,
                    "role": "authenticated",
                    "user_metadata": {"full_name": "Demo Creator"}
                }
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def ensure_user_profile(self, user_id: str, email: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Ensures a record exists in public.users for foreign key integrity.
        (Mirrors the database AFTER INSERT trigger on auth.users for application-level safety).
        """
        try:
            res = supabase_service.service_client.table("users").select("*").eq("id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]

            # Create if not exists
            new_user = {
                "id": user_id,
                "email": email or f"user_{user_id[:8]}@reelreason.ai",
                "name": name or "Content Creator",
                "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id[:8]}",
                "default_platform": "Instagram Reels",
                "default_audience": "Creators",
                "default_tone": "Bold",
                "preferred_clip_types": ["strong_opinion", "practical_lesson", "story"],
                "clips_per_video": 3,
            }
            insert_res = supabase_service.service_client.table("users").insert(new_user).execute()
            return insert_res.data[0] if insert_res.data else new_user
        except Exception as e:
            logger.error(f"Error ensuring user profile: {e}")
            return {
                "id": user_id,
                "email": email or DEFAULT_DEMO_EMAIL,
                "name": name or "Content Creator"
            }


auth_service = AuthService()
