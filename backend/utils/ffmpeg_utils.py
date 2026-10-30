"""
Forwarding module to support direct `from utils.ffmpeg_utils import ...` imports.
"""
from app.utils.ffmpeg_utils import (
    probe_video_metadata,
    extract_audio_from_video,
    trim_video_clip,
)

__all__ = [
    "probe_video_metadata",
    "extract_audio_from_video",
    "trim_video_clip",
]
