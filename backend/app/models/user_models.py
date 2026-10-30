"""
User profile and preferences models matching public.users table schema.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    default_platform: Optional[str] = "Instagram Reels"
    default_audience: Optional[str] = "Creators"
    default_tone: Optional[str] = "Bold"
    preferred_clip_types: Optional[List[str]] = Field(
        default=["strong_opinion", "practical_lesson", "story"]
    )
    clips_per_video: Optional[int] = 3


class UserCreate(UserBase):
    id: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    default_platform: Optional[str] = None
    default_audience: Optional[str] = None
    default_tone: Optional[str] = None
    preferred_clip_types: Optional[List[str]] = None
    clips_per_video: Optional[int] = None


class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
