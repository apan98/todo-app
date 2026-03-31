"""
Base CRUD operations with generic methods.

Provides reusable CRUD logic for all models including:
- get_by_id: Get a single record by ID
- list: List records with pagination, filtering, and sorting
- create: Create a new record
- update: Update an existing record
- delete: Delete a record
"""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy import Select, select, func, update as sql_update, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

# Generic type for models
ModelType = TypeVar("ModelType", bound=DeclarativeBase)
# Generic type for create/update schemas
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseCRUD(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base CRUD class with generic methods for database operations.
    
    Provides reusable CRUD logic that can be extended for specific models.
    All methods are async and work with SQLAlchemy async sessions.
    """

    def __init__(self, model: Type[ModelType]) -> None:
        """
        Initialize CRUD with a model class.
        
        Args:
            model: SQLAlchemy model class
        """
        self.model = model

    async def get_by_id(
        self,
        db: AsyncSession,
        id: int,
    ) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            db: Async database session
            id: Record ID
            
        Returns:
            Model instance if found, None otherwise
        """
        stmt = select(self.model).where(self.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        search_fields: Optional[List[str]] = None,
        search_query: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> tuple[List[ModelType], int]:
        """
        List records with pagination, filtering, search, and sorting.
        
        Args:
            db: Async database session
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            filters: Dictionary of field->value for exact filtering
            search_fields: List of fields to search in for search_query
            search_query: Text to search for in search_fields
            sort_by: Field name to sort by
            sort_order: Sort direction ("asc" or "desc")
            
        Returns:
            Tuple of (list of records, total count before pagination)
        """
        # Build base query
        stmt = select(self.model)

        # Apply exact filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    stmt = stmt.where(getattr(self.model, field) == value)

        # Apply search query (LIKE on multiple fields)
        if search_query and search_fields:
            search_conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_conditions.append(
                        getattr(self.model, field).ilike(f"%{search_query}%")
                    )
            if search_conditions:
                from sqlalchemy import or_
                stmt = stmt.where(or_(*search_conditions))

        # Get total count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Apply sorting
        if sort_by and hasattr(self.model, sort_by):
            order_column = getattr(self.model, sort_by)
            if sort_order and sort_order.lower() == "asc":
                stmt = stmt.order_by(order_column.asc())
            else:
                stmt = stmt.order_by(order_column.desc())
        else:
            # Default sort by id desc
            stmt = stmt.order_by(self.model.id.desc())

        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)

        # Execute query
        result = await db.execute(stmt)
        items = result.scalars().all()

        return list(items), total

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
    ) -> ModelType:
        """
        Create a new record.
        
        Args:
            db: Async database session
            obj_in: Pydantic schema with creation data
            
        Returns:
            Created model instance
        """
        obj_in_data = obj_in.model_dump(exclude_unset=True)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
    ) -> ModelType:
        """
        Update an existing record.
        
        Args:
            db: Async database session
            db_obj: Existing model instance to update
            obj_in: Pydantic schema or dict with update data
            
        Returns:
            Updated model instance
        """
        if isinstance(obj_in, BaseModel):
            update_data = obj_in.model_dump(exclude_unset=True)
        else:
            update_data = obj_in

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(
        self,
        db: AsyncSession,
        *,
        id: int,
    ) -> Optional[ModelType]:
        """
        Delete a record by ID.
        
        Args:
            db: Async database session
            id: Record ID to delete
            
        Returns:
            Deleted model instance if found, None otherwise
        """
        obj = await self.get_by_id(db, id=id)
        if obj is None:
            return None

        await db.delete(obj)
        await db.flush()
        return obj

    def apply_filters(
        self,
        stmt: Select,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Select:
        """
        Apply exact filters to a query.
        
        Args:
            stmt: SQLAlchemy Select statement
            filters: Dictionary of field->value for filtering
            
        Returns:
            Modified Select statement with filters applied
        """
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    stmt = stmt.where(getattr(self.model, field) == value)
        return stmt

    def apply_search(
        self,
        stmt: Select,
        search_fields: Optional[List[str]] = None,
        search_query: Optional[str] = None,
    ) -> Select:
        """
        Apply search query to a query using ILIKE on multiple fields.
        
        Args:
            stmt: SQLAlchemy Select statement
            search_fields: List of fields to search in
            search_query: Text to search for
            
        Returns:
            Modified Select statement with search applied
        """
        if search_query and search_fields:
            from sqlalchemy import or_
            search_conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_conditions.append(
                        getattr(self.model, field).ilike(f"%{search_query}%")
                    )
            if search_conditions:
                stmt = stmt.where(or_(*search_conditions))
        return stmt

    def apply_sorting(
        self,
        stmt: Select,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Select:
        """
        Apply sorting to a query.
        
        Args:
            stmt: SQLAlchemy Select statement
            sort_by: Field name to sort by
            sort_order: Sort direction ("asc" or "desc")
            
        Returns:
            Modified Select statement with sorting applied
        """
        if sort_by and hasattr(self.model, sort_by):
            order_column = getattr(self.model, sort_by)
            if sort_order and sort_order.lower() == "asc":
                stmt = stmt.order_by(order_column.asc())
            else:
                stmt = stmt.order_by(order_column.desc())
        else:
            # Default sort by id desc
            stmt = stmt.order_by(self.model.id.desc())
        return stmt

    def apply_pagination(
        self,
        stmt: Select,
        skip: int = 0,
        limit: int = 100,
    ) -> Select:
        """
        Apply pagination to a query.
        
        Args:
            stmt: SQLAlchemy Select statement
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            
        Returns:
            Modified Select statement with pagination applied
        """
        return stmt.offset(skip).limit(limit)