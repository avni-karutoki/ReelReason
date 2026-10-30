"""
Pipeline orchestration and semantic segmentation tests.
"""
import pytest
from app.services.transcript_processing_service import transcript_processing_service
from app.utils.text_utils import remove_filler_words, split_text_into_sentences


def test_remove_filler_words():
    raw = "Um, so like, you know, we decided to, uh, test the hook."
    cleaned = remove_filler_words(raw)
    assert "um" not in cleaned.lower()
    assert "uh" not in cleaned.lower()
    assert "we decided to" in cleaned


def test_repeated_words_removal():
    raw = "We we decided that this this approach works."
    cleaned = remove_filler_words(raw)
    assert "we decided that this approach works." in cleaned.lower()


def test_semantic_segmentation_duration_bounds():
    """
    Verifies that semantic segmentation chunks utterances into targets between 20s and 90s.
    """
    raw_segments = [
        {"start": 0.0, "end": 10.0, "text": "Sentence number one about topic A."},
        {"start": 10.0, "end": 22.0, "text": "Sentence number two continuing topic A."},
        {"start": 22.0, "end": 35.0, "text": "Sentence number three concluding topic A."},
        {"start": 40.0, "end": 65.0, "text": "Now topic B starts with a brand new concept."},
        {"start": 65.0, "end": 95.0, "text": "Topic B continues with detailed lessons."},
    ]

    segments = transcript_processing_service.process_raw_transcript(
        raw_segments=raw_segments,
        project_id="test_proj_1",
        transcript_id="test_trans_1",
        min_duration=20.0,
        max_duration=90.0
    )

    assert len(segments) >= 2
    for s in segments:
        duration = s["end_time"] - s["start_time"]
        assert duration >= 20.0
        assert duration <= 90.0
        assert s["summary"] is not None
        assert s["project_id"] == "test_proj_1"
