"""
Time and Timestamp Parsing Utilities.
Crucial Constraint: Helper to convert "MM:SS" or "HH:MM:SS" strings from LLM output into float seconds before DB insertion.
"""
import re
from typing import Union


def parse_timestamp_to_seconds(timestamp: Union[str, int, float]) -> float:
    """
    Converts various timestamp formats into total seconds as float.
    Supported formats:
    - 'MM:SS' (e.g. '02:14' -> 134.0)
    - 'HH:MM:SS' (e.g. '01:02:14' -> 3734.0)
    - 'MM:SS.mmm' or 'HH:MM:SS.mmm' (e.g. '02:14.500' -> 134.5)
    - Numeric seconds as string, int or float (e.g. 134.5 -> 134.5, '134.5' -> 134.5)
    
    Raises ValueError if format is invalid.
    """
    if timestamp is None:
        raise ValueError("Timestamp cannot be None")

    if isinstance(timestamp, (int, float)):
        return float(timestamp)

    ts_str = str(timestamp).strip()
    
    # Try direct numeric conversion
    try:
        return float(ts_str)
    except ValueError:
        pass

    # Match time format HH:MM:SS(.mmm) or MM:SS(.mmm)
    time_pattern = r"^(?:(?:(\d+):)?(\d+):)?(\d+(?:\.\d+)?)$"
    match = re.match(time_pattern, ts_str)
    if not match:
        raise ValueError(f"Invalid timestamp format '{timestamp}'. Expected 'MM:SS', 'HH:MM:SS', or seconds numeric.")

    hours_part, minutes_part, seconds_part = match.groups()

    seconds = float(seconds_part)
    minutes = float(minutes_part) if minutes_part is not None else 0.0
    hours = float(hours_part) if hours_part is not None else 0.0

    return (hours * 3600.0) + (minutes * 60.0) + seconds


def format_seconds_to_timestamp(seconds: Union[int, float], include_hours: bool = False) -> str:
    """
    Converts float or int seconds into formatted 'MM:SS' or 'HH:MM:SS' string.
    """
    total_seconds = max(0.0, float(seconds))
    hours = int(total_seconds // 3600)
    remaining = total_seconds % 3600
    minutes = int(remaining // 60)
    secs = int(remaining % 60)

    if hours > 0 or include_hours:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def calculate_duration_seconds(start: Union[str, float], end: Union[str, float]) -> int:
    """
    Calculates duration in rounded integer seconds between start and end.
    """
    start_sec = parse_timestamp_to_seconds(start)
    end_sec = parse_timestamp_to_seconds(end)
    return max(0, int(round(end_sec - start_sec)))
