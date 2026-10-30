"""
User Preferences and Profile API Routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user, get_supabase
from app.models.user_models import UserResponse, UserUpdate
from app.models.common_models import APIResponse

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user)
):
    """Returns the authenticated creator's profile and default settings."""
    return APIResponse(data=UserResponse(**current_user))


@router.patch("/me", response_model=APIResponse[UserResponse])
async def update_user_preferences(
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Updates user creator preferences (default platform, tone, audience, clip types)."""
    update_data = body.model_dump(exclude_unset=True)
    if update_data:
        supabase.service_client.table("users").update(update_data).eq("id", current_user["id"]).execute()
        current_user.update(update_data)

    return APIResponse(
        message="User preferences updated successfully",
        data=UserResponse(**current_user)
    )
