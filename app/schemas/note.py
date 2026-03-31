"""Note schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.schemas.tag import TagRead


class NoteBase(BaseModel):
    """Base note schema."""
    title: str = Field(..., min_length=1, max_length=200, description="Note title")
    content: Optional[str] = Field(default=None, description="Note content")
    is_pinned: bool = Field(default=False, description="Whether note is pinned")
    color: Optional[str] = Field(default=None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Note color in hex format (#RRGGBB)")


class NoteCreate(NoteBase):
    """Schema for note creation."""
    tags: list[str] = Field(default_factory=list, description="List of tag names")

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        """Validate tags: max 10 tags, each max 50 chars."""
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed per note")
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Each tag name must be at most 50 characters")
        return v


class NoteUpdate(NoteBase):
    """Schema for note update."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Note title")
    tags: Optional[list[str]] = Field(default=None, description="List of tag names")

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        """Validate tags: max 10 tags, each max 50 chars."""
        if v is None:
            return None
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed per note")
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Each tag name must be at most 50 characters")
        return v


class NoteRead(NoteBase):
    """Schema for note response."""
    id: int = Field(..., description="Note ID")
    created_at: datetime = Field(..., description="Note creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Note last update timestamp")
    tags: list[TagRead] = Field(default_factory=list, description="Note tags")

    model_config = {"from_attributes": True}


class NoteListResponse(BaseModel):
    """Schema for paginated notes list response."""
    items: list[NoteRead] = Field(default_factory=list, description="List of notes")
    total: int = Field(..., description="Total number of notes")
    limit: int = Field(..., description="Items per page")
    offset: int = Field(..., description="Number of items skipped")
    has_more: bool = Field(..., description="Whether there are more items")