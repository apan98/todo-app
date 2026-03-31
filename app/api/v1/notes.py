"""
Notes routes.

Provides endpoints for CRUD operations on notes with tag support.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.database.notes_repo import NotesRepository
from app.models.user import User
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate, NoteListResponse


router = APIRouter(prefix="/notes", tags=["notes"])


GetDB = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "/",
    response_model=NoteRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new note",
    description="Create a new note with optional tags."
)
async def create_note(
    note_in: NoteCreate,
    current_user: CurrentUser,
    db: GetDB
) -> NoteRead:
    """
    Create a new note for the authenticated user.
    
    Args:
        note_in: Note creation data with title, content, and optional tags
        current_user: Authenticated user (injected via dependency)
        db: Async database session
        
    Returns:
        Created note with ID and tags
        
    Raises:
        HTTPException: If validation fails
    """
    notes_repo = NotesRepository()
    
    # Create note with user ownership
    note = await notes_repo.create(db, obj_in=note_in, user_id=current_user.id)
    
    return note


@router.get(
    "/",
    response_model=NoteListResponse,
    summary="List notes",
    description="Get paginated list of user's notes with optional search and tag filtering."
)
async def list_notes(
    current_user: CurrentUser,
    db: GetDB,
    skip: int = Query(0, ge=0, description="Number of items to skip (offset)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    search: Optional[str] = Query(None, description="Search query for title and content"),
    tags: Optional[str] = Query(None, description="Comma-separated tag names to filter by"),
    sort_by: Optional[str] = Query(None, pattern=r'^(created_at|title)$', description="Sort field: created_at (default) or title"),
    sort_order: Optional[str] = Query("desc", pattern=r'^(asc|desc)$', description="Sort order: asc or desc (default)")
) -> NoteListResponse:
    """
    List user's notes with pagination, search, tag filtering, and sorting.
    
    Args:
        current_user: Authenticated user (injected via dependency)
        db: Async database session
        skip: Number of records to skip (offset)
        limit: Maximum number of records to return
        search: Text to search in title and content
        tags: Comma-separated tag names to filter by
        sort_by: Field to sort by ("created_at" or "title")
        sort_order: Sort direction ("asc" or "desc")
        
    Returns:
        Paginated list of notes with metadata
    """
    notes_repo = NotesRepository()
    
    # Parse tag names if provided
    tag_names = None
    if tags:
        tag_names = [t.strip() for t in tags.split(",") if t.strip()]
    
    # Get notes with filtering, sorting, and pagination
    notes, total = await notes_repo.list(
        db,
        skip=skip,
        limit=limit,
        user_id=current_user.id,
        search_query=search,
        tag_names=tag_names,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Calculate has_more for pagination
    has_more = skip + limit < total
    
    return NoteListResponse(
        items=notes,
        total=total,
        limit=limit,
        offset=skip,
        has_more=has_more
    )


@router.get(
    "/{note_id}",
    response_model=NoteRead,
    summary="Get note by ID",
    description="Get a specific note by its ID (only user's own notes)."
)
async def get_note(
    note_id: int,
    current_user: CurrentUser,
    db: GetDB
) -> NoteRead:
    """
    Get a specific note by ID.
    
    Args:
        note_id: Note ID to retrieve
        current_user: Authenticated user (injected via dependency)
        db: Async database session
        
    Returns:
        Note instance
        
    Raises:
        HTTPException: If note not found or doesn't belong to user
    """
    notes_repo = NotesRepository()
    
    # Get note ensuring it belongs to current user
    note = await notes_repo.get_by_id_for_user(db, id=note_id, user_id=current_user.id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with id {note_id} not found"
        )
    
    return note


@router.patch(
    "/{note_id}",
    response_model=NoteRead,
    summary="Update note",
    description="Update an existing note (only user's own notes)."
)
async def update_note(
    note_id: int,
    note_in: NoteUpdate,
    current_user: CurrentUser,
    db: GetDB
) -> NoteRead:
    """
    Update an existing note.
    
    Args:
        note_id: Note ID to update
        note_in: Note update data (partial updates supported)
        current_user: Authenticated user (injected via dependency)
        db: Async database session
        
    Returns:
        Updated note instance
        
    Raises:
        HTTPException: If note not found or doesn't belong to user
    """
    notes_repo = NotesRepository()
    
    # Get note ensuring it belongs to current user
    note = await notes_repo.get_by_id_for_user(db, id=note_id, user_id=current_user.id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with id {note_id} not found"
        )
    
    # Update note
    updated_note = await notes_repo.update(db, db_obj=note, obj_in=note_in)
    
    return updated_note


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete note",
    description="Delete an existing note (only user's own notes)."
)
async def delete_note(
    note_id: int,
    current_user: CurrentUser,
    db: GetDB
) -> None:
    """
    Delete an existing note.
    
    Args:
        note_id: Note ID to delete
        current_user: Authenticated user (injected via dependency)
        db: Async database session
        
    Raises:
        HTTPException: If note not found or doesn't belong to user
    """
    notes_repo = NotesRepository()
    
    # Delete note ensuring it belongs to current user
    deleted_note = await notes_repo.delete(db, id=note_id, user_id=current_user.id)
    
    if not deleted_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Note with id {note_id} not found"
        )
    
    # Return 204 No Content (implicitly)