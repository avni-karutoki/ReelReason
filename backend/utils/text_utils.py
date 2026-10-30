"""
Forwarding module to support direct `from utils.text_utils import ...` imports.
"""
from app.utils.text_utils import (
    remove_filler_words,
    sanitize_input_text,
    split_text_into_sentences,
    calculate_word_count,
)

__all__ = [
    "remove_filler_words",
    "sanitize_input_text",
    "split_text_into_sentences",
    "calculate_word_count",
]
