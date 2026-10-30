"""
JSON utilities for safe extraction and repair of structured LLM outputs.
Handles markdown code blocks, escaped characters, trailing commas, and malformed strings.
"""
import json
import re
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("reelreason.json_utils")


def extract_and_parse_json(text: str) -> Dict[str, Any]:
    """
    Extracts and parses JSON object or array from LLM completion text.
    Handles ```json ``` blocks, markdown fences, and common formatting quirks.
    """
    if not text:
        raise ValueError("Received empty response string to parse as JSON")

    cleaned = text.strip()

    # 1. Try stripping standard markdown ```json ... ``` blocks
    markdown_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(markdown_pattern, cleaned, re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()

    # 2. Try direct parsing
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as err1:
        logger.warning(f"Initial JSON parse failed: {err1}. Attempting repair heuristic.")

    # 3. Find outermost brackets { ... } or [ ... ]
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = cleaned[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # 4. Attempt to fix common LLM JSON syntax errors: trailing commas before } or ]
            repaired = re.sub(r",\s*([}\]])", r"\1", candidate)
            try:
                return json.loads(repaired)
            except json.JSONDecodeError as err2:
                logger.error(f"Failed to parse repaired JSON block: {err2}")
                raise ValueError(f"Could not parse valid JSON from LLM output: {err2}") from err2

    raise ValueError(f"No JSON object found in LLM response: {cleaned[:200]}")
