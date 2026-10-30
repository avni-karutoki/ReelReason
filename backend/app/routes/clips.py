"""
Clip Suggestions API Routes.
Provides clip browsing, filtering, sorting, metadata editing, approval/rejection,
and specialized hook and caption regeneration.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.dependencies import get_current_user, get_supabase
from app.models.clip_models import (
    ClipSuggestionResponse,
    ClipUpdateRequest,
    RegenerateHookResponse,
    RegenerateCaptionResponse,
    ClipType,
    ClipStatus,
)
from app.models.common_models import APIResponse
from app.services.hook_caption_service import hook_caption_service
from app.services.feedback_service import feedback_service
from app.utils.time_utils import calculate_duration_seconds

router = APIRouter(tags=["Clips"])


@router.get("/api/projects/{project_id}/clips", response_model=APIResponse[List[ClipSuggestionResponse]])
async def get_project_clips(
    project_id: str,
    clip_type: Optional[str] = Query(None, description="Filter by clip type"),
    status: Optional[str] = Query(None, description="Filter by status (suggested, approved, etc.)"),
    sort_by: str = Query("score", description="Sort by 'score', 'timestamp', or 'duration'"),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Returns all clip suggestions for a project with optional filtering and sorting.
    """
    # Verify project ownership
    proj = supabase.service_client.table("video_projects").select("id, user_id").eq("id", project_id).execute()
    if not proj.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if proj.data[0].get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = supabase.service_client.table("clip_suggestions").select("*").eq("project_id", project_id)

    if clip_type:
        query = query.eq("clip_type", clip_type)
    if status:
        query = query.eq("status", status)

    res = query.execute()
    clips = res.data or []

    # Sort in memory for flexible sorting options
    if sort_by == "timestamp":
        clips.sort(key=lambda c: float(c.get("start_time", 0)))
    elif sort_by == "duration":
        clips.sort(key=lambda c: int(c.get("duration_seconds", 0)), reverse=True)
    else:  # score
        clips.sort(key=lambda c: int(c.get("overall_score", 0)), reverse=True)

    formatted = [ClipSuggestionResponse(**c) for c in clips]
    return APIResponse(data=formatted)


@router.get("/api/clips/{clip_id}", response_model=APIResponse[ClipSuggestionResponse])
async def get_single_clip(
    clip_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Returns details, explainability reasoning, and scores for a specific clip."""
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip suggestion not found")

    clip = clip_res.data[0]
    # Check user ownership via project
    proj_res = supabase.service_client.table("video_projects").select("user_id").eq("id", clip["project_id"]).execute()
    if not proj_res.data or proj_res.data[0].get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return APIResponse(data=ClipSuggestionResponse(**clip))


@router.patch("/api/clips/{clip_id}", response_model=APIResponse[ClipSuggestionResponse])
async def update_clip_metadata(
    clip_id: str,
    body: ClipUpdateRequest,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Allows user to edit hook, title, caption, hashtags, timestamps, or styling."""
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_res.data[0]
    proj_res = supabase.service_client.table("video_projects").select("user_id").eq("id", clip["project_id"]).execute()
    if not proj_res.data or proj_res.data[0].get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    update_data = body.model_dump(exclude_unset=True)

    # Recalculate duration if timestamps updated
    if "start_time" in update_data or "end_time" in update_data:
        start = update_data.get("start_time", clip["start_time"])
        end = update_data.get("end_time", clip["end_time"])
        update_data["duration_seconds"] = calculate_duration_seconds(start, end)

    if update_data:
        update_data["status"] = "edited"
        supabase.service_client.table("clip_suggestions").update(update_data).eq("id", clip_id).execute()
        clip.update(update_data)

        # Record feedback event
        await feedback_service.record_feedback(
            clip_id=clip_id,
            user_id=current_user["id"],
            feedback_type="edited",
            notes=f"User edited fields: {list(update_data.keys())}"
        )

    return APIResponse(message="Clip updated successfully", data=ClipSuggestionResponse(**clip))


@router.post("/api/clips/{clip_id}/approve", response_model=APIResponse[ClipSuggestionResponse])
async def approve_clip(
    clip_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Marks a clip suggestion as approved."""
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_res.data[0]
    supabase.service_client.table("clip_suggestions").update({"status": "approved"}).eq("id", clip_id).execute()
    clip["status"] = "approved"

    await feedback_service.record_feedback(
        clip_id=clip_id,
        user_id=current_user["id"],
        feedback_type="approved"
    )

    return APIResponse(message="Clip marked as approved", data=ClipSuggestionResponse(**clip))


@router.post("/api/clips/{clip_id}/reject", response_model=APIResponse[ClipSuggestionResponse])
async def reject_clip(
    clip_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Marks a clip suggestion as rejected."""
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_res.data[0]
    supabase.service_client.table("clip_suggestions").update({"status": "rejected"}).eq("id", clip_id).execute()
    clip["status"] = "rejected"

    await feedback_service.record_feedback(
        clip_id=clip_id,
        user_id=current_user["id"],
        feedback_type="rejected"
    )

    return APIResponse(message="Clip marked as rejected", data=ClipSuggestionResponse(**clip))


@router.post("/api/clips/{clip_id}/regenerate-hook", response_model=APIResponse[RegenerateHookResponse])
async def regenerate_hook(
    clip_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Generates 3 alternative viral hook angles using LLM."""
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_res.data[0]
    proj_res = supabase.service_client.table("video_projects").select("*").eq("id", clip["project_id"]).execute()
    project = proj_res.data[0] if proj_res.data else {}

    result = await hook_caption_service.regenerate_hooks(
        clip_id=clip_id,
        current_hook=clip.get("hook", ""),
        clip_text=clip.get("reasoning", ""),
        platform=project.get("platform", "Instagram Reels"),
        audience=project.get("audience", "Creators"),
        tone=project.get("tone", "Bold")
    )

    return APIResponse(data=RegenerateHookResponse(**result))


@router.post("/api/clips/{clip_id}/regenerate-caption", response_model=APIResponse[RegenerateCaptionResponse])
async def regenerate_caption(
    clip_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Regenerates strategic title, platform-native caption, and hashtags using LLM."""
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_res.data[0]
    proj_res = supabase.service_client.table("video_projects").select("*").eq("id", clip["project_id"]).execute()
    project = proj_res.data[0] if proj_res.data else {}

    result = await hook_caption_service.regenerate_caption(
        clip_id=clip_id,
        title=clip.get("title", ""),
        hook=clip.get("hook", ""),
        clip_text=clip.get("reasoning", ""),
        platform=project.get("platform", "Instagram Reels"),
        audience=project.get("audience", "Creators"),
        tone=project.get("tone", "Bold"),
        goal=project.get("goal", "Views")
    )

    return APIResponse(data=RegenerateCaptionResponse(**result))
