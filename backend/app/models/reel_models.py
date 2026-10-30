"""
Rendered Reel and Remotion Renderer Dispatch Models.
"""
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.transcript_models import WordTimestamp

RenderStatus = Literal["queued", "processing", "completed", "failed"]


class SubtitleStyle(BaseModel):
    font: str = "Inter"
    font_size: int = 42
    color: str = "#FFFFFF"
    highlight_color: str = "#7C3AED"
    position: str = "bottom"


class RemotionRenderJobPayload(BaseModel):
    """Structured JSON sent to the Remotion Node.js rendering microservice."""
    render_job_id: str
    clip_id: str
    project_id: str
    video_url: str
    start_time: str = Field(description="MM:SS formatted start timestamp")
    end_time: str = Field(description="MM:SS formatted end timestamp")
    aspect_ratio: str = "9:16"
    hook: str
    title: str
    caption: str
    hashtags: List[str] = Field(default_factory=list)
    creator_handle: str = "@reelreason"
    subtitle_style: SubtitleStyle = Field(default_factory=SubtitleStyle)
    word_timestamps: List[WordTimestamp] = Field(default_factory=list)


class RenderReelResponse(BaseModel):
    id: str
    clip_id: str
    project_id: str
    user_id: str
    render_status: RenderStatus = "queued"
    renderer_job_id: Optional[str] = None
    video_path: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_path: Optional[str] = None
    thumbnail_url: Optional[str] = None
    subtitle_path: Optional[str] = None
    subtitle_url: Optional[str] = None
    aspect_ratio: str = "9:16"
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RenderStatusResponse(BaseModel):
    reel_id: str
    clip_id: str
    status: RenderStatus
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error_message: Optional[str] = None
