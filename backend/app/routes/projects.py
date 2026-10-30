"""
Project API Routes.
Crucial Constraint 3: Uses FastAPI BackgroundTasks in route handlers for non-blocking background pipeline execution.
"""
import os
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from datetime import datetime

from app.config import settings
from app.dependencies import get_current_user, get_supabase
from app.models.project_models import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectStatusResponse,
)
from app.models.common_models import APIResponse
from app.services.pipeline_service import pipeline_service
from app.services.storage_service import storage_service
from app.utils.validators import is_valid_youtube_url

logger = logging.getLogger("reelreason.projects_router")

router = APIRouter(prefix="/api/projects", tags=["Projects"])


STATUS_PROGRESS_MAP = {
    "uploaded": (10, "Video uploaded and ready", 1),
    "extracting_audio": (25, "Extracting speech audio track with FFmpeg", 2),
    "transcribing": (45, "Transcribing speech and extracting timestamps", 3),
    "analyzing": (65, "Analyzing transcript and generating explainable reasoning", 4),
    "ranking_clips": (80, "Scoring viral hooks and curating clip diversity", 5),
    "generating_reels": (90, "Preparing structured rendering configurations", 6),
    "completed": (100, "Processing complete! Strategic reels ready.", 7),
    "failed": (0, "Pipeline encountered an error", 0),
}


@router.post("", response_model=APIResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(
    background_tasks: BackgroundTasks,
    # Support both JSON payload and multipart form data
    source_type: str = Form(default="youtube"),
    source_url: Optional[str] = Form(default=None),
    title: Optional[str] = Form(default=None),
    platform: str = Form(default="Instagram Reels"),
    audience: str = Form(default="Creators"),
    goal: str = Form(default="Views"),
    tone: str = Form(default="Bold"),
    number_of_clips: int = Form(default=3),
    language: str = Form(default="English"),
    auto_analyze: bool = Form(default=True),
    file: Optional[UploadFile] = File(default=None),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Creates a new video project and initiates non-blocking background processing via BackgroundTasks.
    Accepts direct video upload or YouTube URL.
    """
    user_id = current_user["id"]
    project_id = str(uuid.uuid4())

    local_video_path = None
    stored_video_url = None

    # Validate inputs
    if source_type == "youtube":
        if not source_url or not is_valid_youtube_url(source_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A valid YouTube URL is required when source_type is 'youtube'"
            )
        project_title = title or f"YouTube Video ({source_url[-11:]})"
    elif source_type == "upload":
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A video file must be uploaded when source_type is 'upload'"
            )
        project_title = title or file.filename or "Uploaded Video"
        
        # Save uploaded file to temp directory
        temp_file_path = os.path.join(settings.TEMP_DIR, f"{project_id}_{file.filename}")
        with open(temp_file_path, "wb") as buffer:
            contents = await file.read()
            buffer.write(contents)
        
        local_video_path = temp_file_path
        stored_video_url = storage_service.upload_file(
            bucket_name=settings.SUPABASE_VIDEO_BUCKET,
            destination_path=f"{user_id}/{project_id}.mp4",
            local_file_path=temp_file_path,
            content_type=file.content_type or "video/mp4"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source_type '{source_type}'. Must be 'upload' or 'youtube'."
        )

    # Insert video_project record
    project_record = {
        "id": project_id,
        "user_id": user_id,
        "title": project_title,
        "source_type": source_type,
        "source_url": source_url,
        "video_path": stored_video_url or local_video_path,
        "audio_path": None,
        "duration_seconds": None,
        "language": language,
        "platform": platform,
        "audience": audience,
        "goal": goal,
        "tone": tone,
        "preferred_clip_types": ["strong_opinion", "practical_lesson", "story"],
        "number_of_clips": number_of_clips,
        "status": "uploaded",
        "error_message": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    supabase.service_client.table("video_projects").insert(project_record).execute()

    # Constraint 3: Trigger non-blocking async pipeline via FastAPI BackgroundTasks
    if auto_analyze:
        background_tasks.add_task(pipeline_service.run_pipeline, project_id, user_id)

    return APIResponse(
        success=True,
        message="Video project created successfully and processing queued.",
        data=ProjectResponse(**project_record)
    )


@router.get("", response_model=APIResponse[List[ProjectResponse]])
async def list_user_projects(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Returns all projects belonging to the authenticated user."""
    res = supabase.service_client.table("video_projects").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    projects = [ProjectResponse(**p) for p in res.data]
    return APIResponse(data=projects)


@router.get("/{project_id}", response_model=APIResponse[ProjectResponse])
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Returns a specific project if owned by authenticated user."""
    res = supabase.service_client.table("video_projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = res.data[0]
    if project.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")

    return APIResponse(data=ProjectResponse(**project))


@router.delete("/{project_id}", response_model=APIResponse[dict])
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """Deletes project and cascades deletions across transcripts, clips, and storage files."""
    res = supabase.service_client.table("video_projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = res.data[0]
    if project.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    supabase.service_client.table("video_projects").delete().eq("id", project_id).execute()

    return APIResponse(message=f"Project {project_id} deleted successfully.")


@router.post("/{project_id}/analyze", response_model=APIResponse[ProjectStatusResponse])
async def trigger_analysis(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Manually triggers or retries the complete analysis pipeline in the background.
    """
    res = supabase.service_client.table("video_projects").select("*").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = res.data[0]
    if project.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Reset project status to uploaded before triggering
    supabase.service_client.table("video_projects").update({
        "status": "uploaded",
        "error_message": None
    }).eq("id", project_id).execute()

    # Constraint 3: BackgroundTasks non-blocking execution
    background_tasks.add_task(pipeline_service.run_pipeline, project_id, current_user["id"])

    return APIResponse(
        message="Analysis pipeline restarted in background.",
        data=ProjectStatusResponse(
            project_id=project_id,
            status="uploaded",
            progress_percentage=10,
            current_step="Pipeline queued",
            step_index=1,
            total_steps=7,
            estimated_time_remaining_seconds=45
        )
    )


@router.get("/{project_id}/status", response_model=APIResponse[ProjectStatusResponse])
async def get_project_status(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Returns pipeline progress percentage, current step, and estimated time remaining.
    """
    res = supabase.service_client.table("video_projects").select("id, user_id, status, error_message").eq("id", project_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = res.data[0]
    if project.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    current_status = project.get("status", "uploaded")
    progress, step_msg, step_idx = STATUS_PROGRESS_MAP.get(current_status, (0, "Unknown", 0))

    est_remaining = max(0, int((100 - progress) * 0.6)) if progress < 100 and current_status != "failed" else 0

    return APIResponse(
        data=ProjectStatusResponse(
            project_id=project_id,
            status=current_status,
            progress_percentage=progress,
            current_step=step_msg,
            step_index=step_idx,
            total_steps=7,
            error_message=project.get("error_message"),
            estimated_time_remaining_seconds=est_remaining
        )
    )
