"""
Unit and integration tests for Clip Selection, Scoring, Penalties, and Time Parsing.
"""
import pytest
from app.utils.time_utils import (
    parse_timestamp_to_seconds,
    format_seconds_to_timestamp,
    calculate_duration_seconds
)
from app.services.clip_selection_service import clip_selection_service


def test_timestamp_parsing_mm_ss():
    """Tests Crucial Constraint 4: Parsing MM:SS and HH:MM:SS to float seconds."""
    assert parse_timestamp_to_seconds("02:14") == 134.0
    assert parse_timestamp_to_seconds("00:30") == 30.0
    assert parse_timestamp_to_seconds("01:00") == 60.0
    assert parse_timestamp_to_seconds("01:02:14") == 3734.0
    assert parse_timestamp_to_seconds("02:14.50") == 134.5
    assert parse_timestamp_to_seconds(120) == 120.0
    assert parse_timestamp_to_seconds(45.5) == 45.5


def test_invalid_timestamp_parsing():
    with pytest.raises(ValueError):
        parse_timestamp_to_seconds("invalid:time:format:extra")


def test_format_seconds_to_timestamp():
    assert format_seconds_to_timestamp(134.0) == "02:14"
    assert format_seconds_to_timestamp(45) == "00:45"
    assert format_seconds_to_timestamp(3734.0) == "01:02:14"


def test_calculate_duration_seconds():
    duration = calculate_duration_seconds("01:10", "02:15")
    assert duration == 65


def test_clip_scoring_formula():
    """
    Verifies ReelReason's official weighted scoring formula:
    overall_score = 0.30*hook + 0.25*clarity + 0.20*fit + 0.15*share + 0.10*confidence
    """
    # 0.30*100 + 0.25*100 + 0.20*100 + 0.15*100 + 0.10*100 = 100
    assert clip_selection_service.calculate_overall_score(100, 100, 100, 100, 100) == 100
    
    # 0.30*80 (24) + 0.25*80 (20) + 0.20*80 (16) + 0.15*80 (12) + 0.10*80 (8) = 80
    assert clip_selection_service.calculate_overall_score(80, 80, 80, 80, 80) == 80

    # Custom weights:
    # 0.30*90 (27) + 0.25*80 (20) + 0.20*70 (14) + 0.15*60 (9) + 0.10*100 (10) = 80
    assert clip_selection_service.calculate_overall_score(90, 80, 70, 60, 100) == 80


def test_clip_penalties_slow_hook_and_duration():
    clip = {
        "hook": "So basically welcome back to my channel guys",
        "start": "00:00",
        "end": "02:00",  # 120s > 90s max
        "clip_type": "random_type",
        "hook_strength": 80,
        "clarity": 80,
        "audience_fit": 80,
        "shareability": 80,
        "confidence": 80.0
    }
    preferred = ["strong_opinion", "practical_lesson"]
    penalized = clip_selection_service.apply_penalties(clip, preferred)
    # Starts slowly (-15), duration > 90s (-15), preferred type mismatch (-10) -> -40
    assert penalized["overall_score"] < 50


def test_duplicate_idea_detection():
    clips = [
        {
            "title": "Why consistency without quality kills accounts",
            "hook": "Consistency of mediocre content is just consistently annoying your audience.",
            "reason": "Quality is what earns permission to be consistent.",
            "overall_score": 92
        },
        {
            "title": "Consistency without quality is bad",
            "hook": "Posting mediocre content consistently will annoy your audience.",
            "reason": "You need high quality to earn permission for consistent posts.",
            "overall_score": 85  # duplicate idea, lower score
        },
        {
            "title": "We had 14 days of payroll left",
            "hook": "I sat in my car shaking with 14 days of runway.",
            "reason": "High-stakes startup survival story.",
            "overall_score": 90  # unique idea
        }
    ]

    deduped = clip_selection_service.detect_and_remove_duplicate_ideas(clips)
    assert len(deduped) == 2
    titles = [c["title"] for c in deduped]
    assert "Why consistency without quality kills accounts" in titles
    assert "We had 14 days of payroll left" in titles
    assert "Consistency without quality is bad" not in titles


def test_diversity_balancing():
    clips = [
        {"clip_type": "strong_opinion", "hook": "Opinion 1", "overall_score": 95, "start": "00:10", "end": "00:40"},
        {"clip_type": "strong_opinion", "hook": "Opinion 2", "overall_score": 94, "start": "00:50", "end": "01:20"},
        {"clip_type": "practical_lesson", "hook": "Lesson 1", "overall_score": 90, "start": "01:30", "end": "02:00"},
        {"clip_type": "story", "hook": "Story 1", "overall_score": 88, "start": "02:10", "end": "02:45"},
        {"clip_type": "humor", "hook": "Joke 1", "overall_score": 85, "start": "03:00", "end": "03:30"},
    ]
    balanced_3 = clip_selection_service.balance_diversity(clips, target_count=3, preferred_types=["strong_opinion", "practical_lesson", "story"])
    assert len(balanced_3) == 3
    types = [c["clip_type"] for c in balanced_3]
    # For 3 clips: 1 opinion, 1 lesson, 1 story
    assert "strong_opinion" in types
    assert "practical_lesson" in types
    assert "story" in types
    assert balanced_3[0]["posting_order"] == 1
