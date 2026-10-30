"""
Application Configuration using Pydantic Settings.
Loads environment variables and provides structured settings for ReelReason backend.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = Field(default="ReelReason API")
    ENVIRONMENT: str = Field(default="development")  # development, demo, production
    DEBUG: bool = Field(default=True)
    PORT: int = Field(default=8000)
    HOST: str = Field(default="0.0.0.0")
    FRONTEND_URL: str = Field(default="http://localhost:5173")
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "*"]
    )

    # Supabase Credentials
    SUPABASE_URL: str = Field(default="https://placeholder.supabase.co")
    SUPABASE_ANON_KEY: str = Field(default="placeholder_anon_key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="placeholder_service_role_key")
    SUPABASE_JWT_SECRET: str = Field(default="placeholder_jwt_secret_key_minimum_32_chars_123456")

    # Supabase Storage Buckets
    SUPABASE_VIDEO_BUCKET: str = Field(default="reelreason-videos")
    SUPABASE_AUDIO_BUCKET: str = Field(default="reelreason-audio")
    SUPABASE_RENDERED_BUCKET: str = Field(default="reelreason-rendered")
    SUPABASE_THUMBNAIL_BUCKET: str = Field(default="reelreason-thumbnails")

    # AI Provider Settings (options: 'mock', 'gemini', 'openai')
    AI_PROVIDER: str = Field(default="mock")
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    AI_MODEL_NAME: str = Field(default="gemini-2.5-flash")

    # Transcription Settings (options: 'mock', 'openai', 'assemblyai')
    TRANSCRIPTION_PROVIDER: str = Field(default="mock")
    OPENAI_WHISPER_MODEL: str = Field(default="whisper-1")
    ASSEMBLYAI_API_KEY: Optional[str] = Field(default=None)

    # Remotion Renderer Service
    RENDERER_BASE_URL: str = Field(default="http://localhost:3000")
    RENDERER_API_KEY: str = Field(default="reelreason_renderer_secret")

    # Processing Guardrails & Limits
    MAX_VIDEO_SIZE_MB: int = Field(default=500)
    MAX_VIDEO_DURATION_MINUTES: int = Field(default=15)
    MIN_CLIP_DURATION_SECONDS: int = Field(default=20)
    MAX_CLIP_DURATION_SECONDS: int = Field(default=90)
    TARGET_IDEAL_MIN_DURATION: int = Field(default=30)
    TARGET_IDEAL_MAX_DURATION: int = Field(default=60)

    # Storage paths
    TEMP_DIR: str = Field(default="/tmp/reelreason")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def is_mock_mode(self) -> bool:
        return self.AI_PROVIDER.lower() == "mock" or self.ENVIRONMENT.lower() == "demo"


settings = Settings()
