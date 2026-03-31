"""
Auth repository for user operations.

Extends BaseCRUD with User-specific methods including:
- get_by_email: Find a user by email address
- create: Create a new user with password hashing
- verify_password: Verify a user's password against hash
"""
from typing import Optional
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import BaseCRUD
from app.models.user import User
from app.schemas.user import UserCreate


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRepository(BaseCRUD[User, UserCreate, dict]):
    """
    Repository for User model operations.
    
    Extends BaseCRUD with authentication-specific methods
    for user lookup, creation, and password verification.
    """

    def __init__(self) -> None:
        """Initialize UserRepository with User model."""
        super().__init__(User)

    async def get_by_email(
        self,
        db: AsyncSession,
        *,
        email: str,
    ) -> Optional[User]:
        """
        Get a user by email address.
        
        Args:
            db: Async database session
            email: User email address to search for
            
        Returns:
            User instance if found, None otherwise
        """
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: UserCreate,
    ) -> User:
        """
        Create a new user with hashed password.
        
        Args:
            db: Async database session
            obj_in: UserCreate schema with email and password
            
        Returns:
            Created User instance with hashed password
        """
        # Extract password and hash it
        password = obj_in.password
        hashed_password = self._hash_password(password)
        
        # Create user data without plain password
        user_data = obj_in.model_dump(exclude={"password"})
        user_data["password_hash"] = hashed_password
        
        # Create user instance
        db_obj = User(**user_data)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    def verify_password(
        self,
        plain_password: str,
        hashed_password: str,
    ) -> bool:
        """
        Verify a plain password against a hashed password.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Hashed password from database
            
        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)

    def _hash_password(self, password: str) -> str:
        """
        Hash a plain password.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password string
        """
        return pwd_context.hash(password)