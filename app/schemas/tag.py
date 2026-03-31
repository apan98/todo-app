"""Tag schemas."""
from pydantic import BaseModel, Field


class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., max_length=50, description="Tag name")


class TagCreate(TagBase):
    """Schema for tag creation."""
    pass


class TagRead(TagBase):
    """Schema for tag response."""
    id: int = Field(..., description="Tag ID")

    model_config = {"from_attributes": True}