"""
Tags routes.

Provides endpoints for retrieving tags (read-only).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.database.notes_repo import TagsRepository
from app.models.tag import Tag
from app.schemas.tag import TagRead


router = APIRouter(prefix="/tags", tags=["tags"])


GetDB = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/",
    response_model=list[TagRead],
    summary="List all tags",
    description="Get a list of all tags available in the system."
)
async def list_tags(
    db: GetDB
) -> list[Tag]:
    """
    List all tags.
    
    Args:
        db: Async database session
        
    Returns:
        List of all tags
    """
    tags_repo = TagsRepository()
    
    # Use base class list method with default parameters
    tags, total = await tags_repo.list(db, skip=0, limit=1000)
    
    return tags


@router.get(
    "/{tag_id}",
    response_model=TagRead,
    summary="Get tag by ID",
    description="Get a specific tag by its ID."
)
async def get_tag(
    tag_id: int,
    db: GetDB
) -> Tag:
    """
    Get a tag by ID.
    
    Args:
        tag_id: Tag ID to retrieve
        db: Async database session
        
    Returns:
        Tag instance
        
    Raises:
        HTTPException: If tag with specified ID is not found
    """
    tags_repo = TagsRepository()
    
    tag = await tags_repo.get_by_id(db, id=tag_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )
    
    return tag