"""
Clip Suggestion Models matching public.clip_suggestions and public.clip_feedback tables.
"""
from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

ClipType = Literal[
    "strong_opinion",
    "practical_lesson",
    "story",
    "emotional_moment",
    "contrarian_take",
    "insight",
    "humor"
]

ClipStatus = Literal[
    "suggested",
    "approved",
    "rejected",
    "edited",
    "rendering",
    "rendered",
    "failed"
]

FeedbackType = Literal[
    "approved",
    "rejected",
    "edited",
    "rendered",
    "downloaded"
]


class ClipScores(BaseModel):
    hook_strength: int = Field(default=80, ge=0, le=100)
    clarity: int = Field(default=80, ge=0, le=100)
    audience_fit: int = Field(default=80, ge=0, le=100)
    shareability: int = Field(default=80, ge=0, le=100)
    overall_score: int = Field(default=80, ge=0, le=100)
    confidence: float = Field(default=85.0, ge=0, le=100)


class ClipSuggestionResponse(BaseModel):
    id: str
    project_id: str
    segment_id: Optional[str] = None
    start_time: float
    end_time: float
    duration_seconds: int
    clip_type: ClipType
    hook: str
    title: str
    caption: str
    hashtags: List[str] = Field(default_factory=list)
    target_audience: Optional[str] = None
    reasoning: str
    hook_strength: Optional[int] = 80
    clarity: Optional[int] = 80
    audience_fit: Optional[int] = 80
    shareability: Optional[int] = 80
    overall_score: Optional[int] = 80
    confidence: Optional[float] = 85.0
    status: ClipStatus = "suggested"
    posting_order: Optional[int] = 1
    alternative_hooks: Optional[List[str]] = Field(default_factory=list)
    subtitle_style: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClipUpdateRequest(BaseModel):
    hook: Optional[str] = None
    title: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    clip_type: Optional[ClipType] = None
    target_audience: Optional[str] = None
    subtitle_style: Optional[Dict[str, Any]] = None
    status: Optional[ClipStatus] = None


class RegenerateHookResponse(BaseModel):
    clip_id: str
    primary_hook: str
    alternative_hooks: List[str]


class RegenerateCaptionResponse(BaseModel):
    clip_id: str
    title: str
    caption: str
    hashtags: List[str]


class ClipFeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    notes: Optional[str] = None
