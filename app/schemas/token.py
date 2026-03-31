"""Token schemas for JWT authentication."""
from pydantic import BaseModel, Field


class Token(BaseModel):
    """Schema for token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")


class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: int | None = Field(default=None, description="User ID from token")
    email: str | None = Field(default=None, description="User email from token")