"""
Input validators for requests, YouTube URLs, platforms, goals, and formats.
"""
import re
from typing import Tuple, List

VALID_PLATFORMS = ["Instagram Reels", "YouTube Shorts", "TikTok", "LinkedIn"]
VALID_AUDIENCES = ["Students", "Founders", "Developers", "Creators", "General audience"]
VALID_GOALS = ["Views", "Followers", "Leads", "Authority", "Education"]
VALID_TONES = ["Professional", "Bold", "Funny", "Educational", "Motivational"]
VALID_LANGUAGES = ["English", "Hindi", "Hinglish"]
VALID_CLIP_TYPES = [
    "strong_opinion",
    "practical_lesson",
    "story",
    "emotional_moment",
    "contrarian_take",
    "insight",
    "humor"
]

YOUTUBE_REGEX = re.compile(
    r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/|embed/)|youtu\.be/)([a-zA-Z0-9_-]{11})"
)

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"}


def is_valid_youtube_url(url: str) -> bool:
    """Checks whether URL is a valid standard YouTube or Shorts URL."""
    if not url:
        return False
    return bool(YOUTUBE_REGEX.match(url.strip()))


def extract_youtube_video_id(url: str) -> str:
    """Extracts the 11-character video ID from a YouTube URL."""
    match = YOUTUBE_REGEX.search(url.strip())
    if match:
        return match.group(5)
    raise ValueError(f"Could not extract video ID from YouTube URL: {url}")


def validate_clip_duration(duration_seconds: float, min_sec: float = 20.0, max_sec: float = 90.0) -> Tuple[bool, str]:
    """Ensures clip duration fits within configured min/max guidelines."""
    if duration_seconds < min_sec:
        return False, f"Clip duration ({duration_seconds:.1f}s) is shorter than minimum allowed ({min_sec}s)."
    if duration_seconds > max_sec:
        return False, f"Clip duration ({duration_seconds:.1f}s) exceeds maximum allowed ({max_sec}s)."
    return True, "Valid duration"
