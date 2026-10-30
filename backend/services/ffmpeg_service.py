"""
Forwarding module to support direct `from services.ffmpeg_service import ffmpeg_service` imports.
"""
from app.services.ffmpeg_service import ffmpeg_service, FFmpegService

__all__ = ["ffmpeg_service", "FFmpegService"]
