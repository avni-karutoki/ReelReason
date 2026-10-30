"""
Text processing and cleaning utilities for speech transcripts.
Handles filler word suppression, punctuation cleanup, sanitization, and text splitting.
"""
import re
from typing import List, Dict, Any

# Common speech filler words and patterns to clean
FILLER_PATTERNS = [
    r"\b(um+)\b",
    r"\b(uh+)\b",
    r"\b(er+)\b",
    r"\b(ah+)\b",
    r"\b(like)\b(?=\s+(?:you know|i mean|so))",
    r"\b(you know)\b",
    r"\b(i mean)\b",
    r"\b(sort of)\b",
    r"\b(kind of)\b",
]

COMPILED_FILLERS = [re.compile(p, re.IGNORECASE) for p in FILLER_PATTERNS]
REPEATED_WORDS = re.compile(r"\b(\w+)\s+\1\b", re.IGNORECASE)


def remove_filler_words(text: str) -> str:
    """
    Cleans spoken conversational filler words and immediate duplicate word repeats.
    Preserves grammatical coherence and punctuation.
    """
    if not text:
        return ""

    cleaned = text
    # Remove obvious filler patterns
    for pattern in COMPILED_FILLERS:
        cleaned = pattern.sub("", cleaned)

    # Remove immediate consecutive duplicate words (e.g. "we we decided" -> "we decided")
    cleaned = REPEATED_WORDS.sub(r"\1", cleaned)

    # Normalize whitespace and lingering commas
    cleaned = re.sub(r"\s+,\s*", ", ", cleaned)
    cleaned = re.sub(r",\s*,+", ",", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def sanitize_input_text(text: str, max_chars: int = 100000) -> str:
    """
    Sanitizes user input before sending to LLMs or database to prevent prompt injection or payload bloat.
    """
    if not text:
        return ""
    # Strip null bytes and control chars except newlines and tabs
    sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    return sanitized[:max_chars].strip()


def split_text_into_sentences(text: str) -> List[str]:
    """
    Splits text into coherent sentences using punctuation heuristics.
    """
    if not text:
        return []
    # Match sentences ending with ., !, or ? followed by space or end
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()]


def calculate_word_count(text: str) -> int:
    """Returns total word count of text."""
    return len(re.findall(r"\b\w+\b", text or ""))
