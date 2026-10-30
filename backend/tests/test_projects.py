"""
Unit and integration tests for Projects API endpoints and lifecycle.
"""
import pytest
from app.utils.validators import is_valid_youtube_url, extract_youtube_video_id


def test_youtube_url_validator():
    valid_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "http://youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]
    for url in valid_urls:
        assert is_valid_youtube_url(url) is True
        assert extract_youtube_video_id(url) == "dQw4w9WgXcQ"

    invalid_urls = [
        "https://vimeo.com/12345678",
        "not_a_url",
        "https://youtube.com/invalid",
    ]
    for url in invalid_urls:
        assert is_valid_youtube_url(url) is False


def test_project_model_creation():
    from app.models.project_models import ProjectCreateRequest
    req = ProjectCreateRequest(
        source_type="youtube",
        source_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        platform="Instagram Reels",
        audience="Founders",
        goal="Authority",
        tone="Educational",
        number_of_clips=5
    )
    assert req.source_type == "youtube"
    assert req.number_of_clips == 5
    assert req.platform == "Instagram Reels"
