"""
Rendered Reels API Routes.
Manages Remotion rendering requests, status polling, MP4 video streaming/downloading,
and project reel listings.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from app.dependencies import get_current_user, get_supabase
from app.models.reel_models import RenderReelResponse, RenderStatusResponse
from app.models.common_models import APIResponse
from app.services.renderer_service import renderer_service
from app.services.feedback_service import feedback_service

logger = logging.getLogger("reelreason.reels")

router = APIRouter(tags=["Reels"])

ORPHAN_MINUTES = 15


def reap_stuck_render(reel: dict, supabase) -> None:
    """
    Marks renders orphaned in 'processing' as failed so they can be retried.
    The in-process FFmpeg render dies if the API worker restarts (free-tier deploys,
    OOM kills) — without this the reel would spin as 'processing' forever.
    Uses updated_at as the last authoritative lifecycle timestamp.
    """
    if reel.get("render_status") != "processing":
        return
    stamp = reel.get("updated_at") or reel.get("created_at")
    if not stamp:
        return
    try:
        ts = datetime.fromisoformat(str(stamp).replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age_minutes = (datetime.now(timezone.utc) - ts).total_seconds() / 60.0
    except ValueError:
        return
    if age_minutes < ORPHAN_MINUTES:
        return

    message = (
        f"Render was interrupted by a server restart after {int(age_minutes)} minutes and cannot recover."
        " Please trigger the render again."
    )
    logger.warning(f"Reel {reel.get('id')} orphaned in processing for {int(age_minutes)} min — marking failed")
    supabase.service_client.table("rendered_reels").update({
        "render_status": "failed",
        "error_message": message,
    }).eq("id", reel["id"]).execute()
    supabase.service_client.table("clip_suggestions").update({
        "status": "suggested"
    }).eq("id", reel.get("clip_id")).execute()
    reel["render_status"] = "failed"
    reel["error_message"] = message


@router.post("/api/clips/{clip_id}/render", response_model=APIResponse[RenderReelResponse], status_code=status.HTTP_202_ACCEPTED)
async def request_clip_render(
    clip_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Validates ownership, queues a 9:16 vertical render job, and dispatches to Remotion renderer.
    """
    user_id = current_user["id"]

    # 1. Fetch clip
    clip_res = supabase.service_client.table("clip_suggestions").select("*").eq("id", clip_id).execute()
    if not clip_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip not found")

    clip = clip_res.data[0]
    project_id = clip["project_id"]

    # 2. Fetch project and verify ownership
    proj_res = supabase.service_client.table("video_projects").select("*").eq("id", project_id).execute()
    if not proj_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = proj_res.data[0]
    if project.get("user_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")

    # 3. Retrieve word timestamps from latest transcript if available
    t_res = supabase.service_client.table("transcripts").select("word_timestamps").eq("project_id", project_id).order("created_at", desc=True).execute()
    word_timestamps = t_res.data[0].get("word_timestamps", []) if t_res.data else []

    # 4. Dispatch render job
    render_record = await renderer_service.dispatch_render_job(
        clip=clip,
        project=project,
        user_id=user_id,
        word_timestamps=word_timestamps
    )

    # 5. Record feedback event
    await feedback_service.record_feedback(
        clip_id=clip_id,
        user_id=user_id,
        feedback_type="rendered",
        notes=f"Render queued with job_id {render_record.get('renderer_job_id')}"
    )

    return APIResponse(
        success=True,
        message="Render job accepted and queued for 9:16 vertical composition.",
        data=RenderReelResponse(**render_record)
    )


@router.get("/api/reels/{reel_id}", response_model=APIResponse[RenderReelResponse])
async def get_rendered_reel_status(
    reel_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Returns the current render status and final MP4 URL."""
    res = supabase.service_client.table("rendered_reels").select("*").eq("id", reel_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendered reel not found")

    reel = res.data[0]
    if reel.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    reap_stuck_render(reel, supabase)

    # Self-healing: re-kick renders orphaned by a worker restart so status
    # polling eventually reaches a terminal state instead of spinning forever.
    if reel.get("render_status") in ("queued", "processing") and not reel.get("video_url"):
        try:
            await renderer_service.resume_or_redispatch(reel)
        except Exception as e:
            logger.warning(f"Render resume check failed for reel {reel.get('id')}: {e}")
    elif (
        reel.get("render_status") == "failed"
        and "interrupted by a server restart" in str(reel.get("error_message") or "")
    ):
        # The watchdog just reaped an orphan — retry it once automatically so the
        # creator gets their reel without a manual re-click.
        reel["render_status"] = "processing"
        try:
            await renderer_service.resume_or_redispatch(reel)
        except Exception as e:
            logger.warning(f"Auto-retry after reaping failed for reel {reel.get('id')}: {e}")

    return APIResponse(data=RenderReelResponse(**reel))


@router.get("/api/reels/{reel_id}/download")
async def download_rendered_reel(
    reel_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Returns secure redirect or download URL for final vertical MP4 reel.
    """
    res = supabase.service_client.table("rendered_reels").select("*").eq("id", reel_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendered reel not found")

    reel = res.data[0]
    if reel.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if reel.get("render_status") != "completed" or not reel.get("video_url"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reel is not completed yet (current status: {reel.get('render_status')})"
        )

    # Record download event in feedback
    await feedback_service.record_feedback(
        clip_id=reel["clip_id"],
        user_id=current_user["id"],
        feedback_type="downloaded"
    )

    video_url = reel["video_url"]
    return RedirectResponse(url=video_url)


@router.get("/api/projects/{project_id}/reels", response_model=APIResponse[List[RenderReelResponse]])
async def list_project_rendered_reels(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Returns all rendered reels belonging to a specific video project."""
    res = supabase.service_client.table("rendered_reels").select("*").eq("project_id", project_id).eq("user_id", current_user["id"]).execute()
    reels = [RenderReelResponse(**r) for r in res.data or []]
    return APIResponse(data=reels)
