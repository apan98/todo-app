"""
Notes and Tags repositories for note operations.

Extends BaseCRUD with Note-specific methods including:
- NotesRepository: CRUD operations for notes with filtering by user, text search, tag filtering
- TagsRepository: CRUD operations for tags with get_or_create pattern
"""
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import Select, select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import BaseCRUD
from app.models.note import Note
from app.models.tag import Tag
from app.schemas.note import NoteCreate, NoteUpdate
from app.schemas.tag import TagCreate


class TagsRepository(BaseCRUD[Tag, TagCreate, Dict[str, Any]]):
    """
    Repository for Tag model operations.
    
    Extends BaseCRUD with tag-specific methods including
    get_by_name for finding or creating tags by name.
    """

    def __init__(self) -> None:
        """Initialize TagsRepository with Tag model."""
        super().__init__(Tag)

    async def get_by_name(
        self,
        db: AsyncSession,
        *,
        name: str,
    ) -> Optional[Tag]:
        """
        Get a tag by name.
        
        Args:
            db: Async database session
            name: Tag name to search for
            
        Returns:
            Tag instance if found, None otherwise
        """
        stmt = select(Tag).where(Tag.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_create(
        self,
        db: AsyncSession,
        *,
        name: str,
    ) -> Tag:
        """
        Get existing tag or create a new one.
        
        Args:
            db: Async database session
            name: Tag name
            
        Returns:
            Tag instance (existing or newly created)
        """
        tag = await self.get_by_name(db, name=name)
        if tag is None:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
            await db.refresh(tag)
        return tag

    async def get_by_names(
        self,
        db: AsyncSession,
        *,
        names: List[str],
    ) -> List[Tag]:
        """
        Get multiple tags by list of names.
        
        Args:
            db: Async database session
            names: List of tag names
            
        Returns:
            List of found Tag instances
        """
        if not names:
            return []
        stmt = select(Tag).where(Tag.name.in_(names))
        result = await db.execute(stmt)
        return list(result.scalars().all())


class NotesRepository(BaseCRUD[Note, NoteCreate, NoteUpdate]):
    """
    Repository for Note model operations.
    
    Extends BaseCRUD with note-specific methods including
    filtering by user, text search, tag filtering, and sorting
    by creation date or title.
    """

    def __init__(self) -> None:
        """Initialize NotesRepository with Note model."""
        super().__init__(Note)

    async def list(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        search_query: Optional[str] = None,
        tag_ids: Optional[List[int]] = None,
        tag_names: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Tuple[List[Note], int]:
        """
        List notes with pagination, user filtering, text search, tag filtering, and sorting.
        
        Args:
            db: Async database session
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            user_id: Filter by user ID (user's own notes only)
            search_query: Text to search in title and content
            tag_ids: Filter by list of tag IDs (notes must have at least one of these tags)
            tag_names: Filter by list of tag names (notes must have at least one of these tags)
            sort_by: Field to sort by ("created_at" or "title")
            sort_order: Sort direction ("asc" or "desc")
            
        Returns:
            Tuple of (list of notes, total count before pagination)
        """
        # Build base query with eager loading of tags
        stmt = select(Note).distinct()

        # Apply user filter - always required for security
        if user_id is not None:
            stmt = stmt.where(Note.user_id == user_id)

        # Apply text search (title and content)
        if search_query:
            search_terms = search_query.split()
            search_conditions = []
            for term in search_terms:
                search_conditions.append(Note.title.ilike(f"%{term}%"))
                search_conditions.append(Note.content.ilike(f"%{term}%"))
            if search_conditions:
                stmt = stmt.where(or_(*search_conditions))

        # Apply tag filtering by IDs
        if tag_ids:
            from app.models.note import note_tags
            stmt = stmt.join(note_tags, Note.id == note_tags.c.note_id)
            stmt = stmt.where(note_tags.c.tag_id.in_(tag_ids))

        # Apply tag filtering by names (look up IDs first)
        if tag_names:
            tags_repo = TagsRepository()
            tags = await tags_repo.get_by_names(db, names=tag_names)
            tag_ids_from_names = [tag.id for tag in tags]
            if tag_ids_from_names:
                from app.models.note import note_tags
                stmt = stmt.join(note_tags, Note.id == note_tags.c.note_id)
                stmt = stmt.where(note_tags.c.tag_id.in_(tag_ids_from_names))

        # Get total count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sorting
        # Default sort by created_at desc (newest first)
        if sort_by == "title":
            order_column = Note.title
        elif sort_by == "created_at":
            order_column = Note.created_at
        else:
            # Default to created_at desc
            order_column = Note.created_at

        if sort_order and sort_order.lower() == "asc":
            stmt = stmt.order_by(order_column.asc())
        else:
            stmt = stmt.order_by(order_column.desc())

        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)

        # Execute query
        result = await db.execute(stmt)
        items = result.scalars().unique().all()

        return list(items), total

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: NoteCreate,
        user_id: int,
    ) -> Note:
        """
        Create a new note with tags.
        
        Args:
            db: Async database session
            obj_in: NoteCreate schema with note data and tag names
            user_id: ID of the user creating the note
            
        Returns:
            Created Note instance with tags
        """
        # Extract tag names from create schema
        tag_names = obj_in.tags if obj_in.tags else []
        
        # Create note data without tags
        note_data = obj_in.model_dump(exclude={"tags"})
        note_data["user_id"] = user_id
        
        # Create note instance
        db_obj = Note(**note_data)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        
        # Handle tags if provided
        if tag_names:
            tags_repo = TagsRepository()
            tags: List[Tag] = []
            for tag_name in tag_names:
                tag = await tags_repo.get_or_create(db, name=tag_name)
                tags.append(tag)
            db_obj.tags = tags
            await db.flush()
            await db.refresh(db_obj)
        
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: Note,
        obj_in: NoteUpdate,
    ) -> Note:
        """
        Update an existing note with tags.
        
        Args:
            db: Async database session
            db_obj: Existing Note instance to update
            obj_in: NoteUpdate schema with update data and tag names
            
        Returns:
            Updated Note instance with tags
        """
        # Extract tag names from update schema (if provided)
        tag_names = obj_in.tags
        
        # Update note fields
        update_data = obj_in.model_dump(exclude_unset=True, exclude={"tags"})
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        # Update tags if provided
        if tag_names is not None:
            tags_repo = TagsRepository()
            tags: List[Tag] = []
            for tag_name in tag_names:
                tag = await tags_repo.get_or_create(db, name=tag_name)
                tags.append(tag)
            db_obj.tags = tags
        
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_id_for_user(
        self,
        db: AsyncSession,
        *,
        id: int,
        user_id: int,
    ) -> Optional[Note]:
        """
        Get a note by ID, ensuring it belongs to the specified user.
        
        Args:
            db: Async database session
            id: Note ID
            user_id: User ID to verify ownership
            
        Returns:
            Note instance if found and belongs to user, None otherwise
        """
        stmt = select(Note).where(and_(Note.id == id, Note.user_id == user_id))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def delete(
        self,
        db: AsyncSession,
        *,
        id: int,
        user_id: Optional[int] = None,
    ) -> Optional[Note]:
        """
        Delete a note by ID, optionally verifying user ownership.
        
        Args:
            db: Async database session
            id: Note ID to delete
            user_id: Optional user ID to verify ownership (security check)
            
        Returns:
            Deleted Note instance if found, None otherwise
        """
        if user_id is not None:
            obj = await self.get_by_id_for_user(db, id=id, user_id=user_id)
        else:
            obj = await self.get_by_id(db, id=id)
        
        if obj is None:
            return None

        await db.delete(obj)
        await db.flush()
        return obj

    async def get_pinned_notes(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Note], int]:
        """
        Get pinned notes for a user with pagination.
        
        Args:
            db: Async database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of pinned notes, total count)
        """
        stmt = select(Note).where(
            and_(Note.user_id == user_id, Note.is_pinned == True)
        ).order_by(Note.created_at.desc())
        
        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        items = result.scalars().all()
        
        return list(items), total