"""
Transcript and Semantic Transcript Segment Models.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float
    confidence: Optional[float] = None


class TranscriptSegmentItem(BaseModel):
    id: Optional[str] = None
    transcript_id: Optional[str] = None
    project_id: Optional[str] = None
    start_time: float
    end_time: float
    duration_seconds: Optional[int] = None
    text: str
    summary: Optional[str] = None
    speaker: Optional[str] = "Speaker 1"
    segment_index: int = 0
    words: Optional[List[WordTimestamp]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TranscriptResponse(BaseModel):
    id: str
    project_id: str
    provider: Optional[str] = None
    language: Optional[str] = "English"
    full_text: str
    word_timestamps: Optional[List[WordTimestamp]] = None
    segment_timestamps: Optional[List[Dict[str, Any]]] = None
    segments: Optional[List[TranscriptSegmentItem]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
