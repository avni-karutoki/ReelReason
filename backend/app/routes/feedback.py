"""
Clip Feedback API Routes.
Records feedback signals from creators to train and improve clip selection algorithms.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user, get_supabase
from app.models.clip_models import ClipFeedbackCreate
from app.models.common_models import APIResponse
from app.services.feedback_service import feedback_service

router = APIRouter(tags=["Feedback"])


@router.post("/api/clips/{clip_id}/feedback", response_model=APIResponse[dict], status_code=status.HTTP_201_CREATED)
async def submit_clip_feedback(
    clip_id: str,
    feedback: ClipFeedbackCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Records creator feedback for an identified clip (approved, rejected, edited, rendered, downloaded).
    """
    # Verify clip exists
    clip_res = supabase.service_client.table("clip_suggestions").select("id").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    record = await feedback_service.record_feedback(
        clip_id=clip_id,
        user_id=current_user["id"],
        feedback_type=feedback.feedback_type,
        notes=feedback.notes
    )

    return APIResponse(
        success=True,
        message="Feedback recorded successfully",
        data=record
    )
