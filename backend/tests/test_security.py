"""
Security, Auth, and RLS behavior tests.
"""
import pytest
from app.services.auth_service import auth_service
from app.config import settings
from app.utils.text_utils import sanitize_input_text


def test_sanitize_input_text():
    dirty = "Hello\x00World! This is a test \x08string."
    clean = sanitize_input_text(dirty)
    assert "\x00" not in clean
    assert "\x08" not in clean
    assert "Hello" in clean


def test_demo_auth_verification(monkeypatch):
    # Keep this test independent from the developer's production .env settings.
    monkeypatch.setattr(settings, "AI_PROVIDER", "mock")
    claims = auth_service.verify_supabase_jwt("demo-token")
    assert claims["sub"] is not None
    assert claims["role"] == "authenticated"


def test_ensure_user_profile():
    user = auth_service.ensure_user_profile(
        user_id="test-user-uuid-1234",
        email="test@reelreason.ai",
        name="Test User"
    )
    assert user["id"] == "test-user-uuid-1234"
    assert user["email"] == "test@reelreason.ai"
