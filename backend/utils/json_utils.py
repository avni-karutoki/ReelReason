"""
Forwarding module to support direct `from utils.json_utils import ...` imports.
"""
from app.utils.json_utils import extract_and_parse_json

__all__ = ["extract_and_parse_json"]
