"""
Transcript API Routes.
Provides full transcript retrieval and timestamped semantic segments.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user, get_supabase
from app.models.transcript_models import TranscriptResponse, TranscriptSegmentItem
from app.models.common_models import APIResponse

router = APIRouter(prefix="/api/projects/{project_id}/transcript", tags=["Transcripts"])


@router.get("", response_model=APIResponse[TranscriptResponse])
async def get_project_transcript(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Returns full transcript and timestamped segments for frontend display.
    """
    # 1. Verify project ownership
    proj_res = supabase.service_client.table("video_projects").select("id, user_id").eq("id", project_id).execute()
    if not proj_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if proj_res.data[0].get("user_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # 2. Fetch transcript record (latest run wins — re-analysis appends rows)
    t_res = supabase.service_client.table("transcripts").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
    if not t_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not yet generated for this project. Check project status."
        )

    transcript = t_res.data[0]

    # 3. Fetch associated semantic segments
    seg_res = supabase.service_client.table("transcript_segments").select("*").eq("project_id", project_id).order("segment_index").execute()
    segments = [TranscriptSegmentItem(**s) for s in seg_res.data]

    response_data = TranscriptResponse(
        id=transcript["id"],
        project_id=project_id,
        provider=transcript.get("provider"),
        language=transcript.get("language", "English"),
        full_text=transcript.get("full_text", ""),
        word_timestamps=transcript.get("word_timestamps"),
        segment_timestamps=transcript.get("segment_timestamps"),
        segments=segments,
        created_at=transcript.get("created_at")
    )

    return APIResponse(data=response_data)
