"""User schemas."""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr = Field(..., description="User email address")


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=6, max_length=100, description="User password")


class UserRead(UserBase):
    """Schema for user response."""
    id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="User registration timestamp")

    model_config = {"from_attributes": True}