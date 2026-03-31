"""
API v1 routes package.

Aggregates all API routers for version 1 of the API.
"""
from fastapi import APIRouter

from app.api.v1 import auth, notes, tags


# Create main API v1 router
api_router = APIRouter()

# Include sub-routers (routers already have their own prefixes)
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(notes.router, tags=["Notes"])
api_router.include_router(tags.router, tags=["Tags"])


__all__ = ["api_router", "auth", "notes", "tags"]
