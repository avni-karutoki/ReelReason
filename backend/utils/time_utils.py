"""
Forwarding module to support direct `from utils.time_utils import ...` imports.
"""
from app.utils.time_utils import (
    parse_timestamp_to_seconds,
    format_seconds_to_timestamp,
    calculate_duration_seconds,
)

__all__ = [
    "parse_timestamp_to_seconds",
    "format_seconds_to_timestamp",
    "calculate_duration_seconds",
]
