"""
Common shared Pydantic response models, pagination, error schemas, and base types.
"""
from typing import Any, Generic, Optional, TypeVar, List
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    """Standard unified JSON API response wrapper."""
    success: bool = Field(default=True)
    message: str = Field(default="Operation completed successfully")
    data: Optional[DataT] = None
    error: Optional[str] = None


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = Field(default=False)
    message: str
    error: str
    details: Optional[List[ErrorDetail]] = None


class JobLogModel(BaseModel):
    id: Optional[str] = None
    project_id: Optional[str] = None
    job_type: str
    status: str
    message: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: Optional[str] = None
