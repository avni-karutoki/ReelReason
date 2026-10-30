"""
Video Project Models matching public.video_projects table.
"""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime

SourceType = Literal["upload", "youtube"]

ProjectStatus = Literal[
    "uploaded",
    "extracting_audio",
    "transcribing",
    "analyzing",
    "ranking_clips",
    "generating_reels",
    "completed",
    "failed"
]


class ProjectCreateRequest(BaseModel):
    """Payload for creating a project via YouTube URL or video upload metadata."""
    title: Optional[str] = None
    source_type: SourceType = Field(default="youtube")
    source_url: Optional[str] = Field(default=None, description="YouTube URL if source_type == 'youtube'")
    language: str = Field(default="English", description="English, Hindi, or Hinglish")
    platform: str = Field(default="Instagram Reels", description="Instagram Reels, YouTube Shorts, TikTok, or LinkedIn")
    audience: str = Field(default="Creators", description="Students, Founders, Developers, Creators, General audience")
    goal: str = Field(default="Views", description="Views, Followers, Leads, Authority, Education")
    tone: str = Field(default="Bold", description="Professional, Bold, Funny, Educational, Motivational")
    preferred_clip_types: List[str] = Field(
        default=["strong_opinion", "practical_lesson", "story"]
    )
    number_of_clips: int = Field(default=3, ge=1, le=10)


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    source_type: str
    source_url: Optional[str] = None
    video_path: Optional[str] = None
    audio_path: Optional[str] = None
    duration_seconds: Optional[int] = None
    language: Optional[str] = "English"
    platform: Optional[str] = None
    audience: Optional[str] = None
    goal: Optional[str] = None
    tone: Optional[str] = None
    preferred_clip_types: Optional[List[str]] = None
    number_of_clips: int = 3
    status: ProjectStatus = "uploaded"
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectStatusResponse(BaseModel):
    project_id: str
    status: ProjectStatus
    progress_percentage: int = Field(ge=0, le=100)
    current_step: str
    step_index: int
    total_steps: int = 7
    error_message: Optional[str] = None
    estimated_time_remaining_seconds: Optional[int] = None
