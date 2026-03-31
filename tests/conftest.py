"""
Pytest configuration and fixtures for Notes API tests.

Provides fixtures for:
- Async test client for FastAPI
- In-memory SQLite database for testing
- Database sessions
- Repository instances (auth_repo, notes_repo)
"""
import asyncio
from typing import AsyncGenerator, Generator
import pytest
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import Base, get_db
from app.database.auth_repo import UserRepository
from app.database.notes_repo import NotesRepository, TagsRepository


# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create async engine for testing
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True
)

# Create async session factory for testing
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """
    Create event loop for async tests.
    
    Yields:
        Event loop for async operations
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test.
    
    Yields:
        Async database session with test database
    """
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestSessionLocal() as session:
        yield session
    
    # Cleanup: drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def db(db_session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """
    Fixture that provides database session and handles rollback.
    
    This is used to override the get_db dependency in FastAPI.
    
    Yields:
        Async database session
    """
    yield db_session


@pytest.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create async test client for FastAPI with overridden database dependency.
    
    Args:
        db: Database session fixture
        
    Yields:
        Async client for making HTTP requests
    """
    # Override get_db dependency
    async def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Create async client
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    # Clear overrides after test
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_repo() -> UserRepository:
    """
    Create UserRepository instance for testing.
    
    Returns:
        UserRepository instance
    """
    return UserRepository()


@pytest.fixture(scope="function")
def notes_repo() -> NotesRepository:
    """
    Create NotesRepository instance for testing.
    
    Returns:
        NotesRepository instance
    """
    return NotesRepository()


@pytest.fixture(scope="function")
def tags_repo() -> TagsRepository:
    """
    Create TagsRepository instance for testing.
    
    Returns:
        TagsRepository instance
    """
    return TagsRepository()