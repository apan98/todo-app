"""
Database configuration repositories package.

This package contains:
- Database configuration (engine, session factory, get_db)
- Repository classes for CRUD operations
"""

# Database configuration
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)

from app.config import settings
from app.base import Base


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set True for SQL query logging in development
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncSession:
    """
    Dependency for getting async DB sessions.
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database (create tables)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()


# Repository exports
from app.database.auth_repo import UserRepository
from app.database.notes_repo import NotesRepository, TagsRepository

__all__ = [
    # Database configuration
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "init_db",
    "close_db",
    "Base",
    # Repositories
    "UserRepository",
    "NotesRepository",
    "TagsRepository",
]