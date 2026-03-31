"""
Authentication routes.

Provides endpoints for user registration, login, and token refresh.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.database import get_db
from app.database.auth_repo import UserRepository
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])


GetDB = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password."
)
async def register(
    user_in: UserCreate,
    db: GetDB
) -> User:
    """
    Register a new user.
    
    Args:
        user_in: User registration data (email and password)
        db: Async database session
        
    Returns:
        Created user data (excluding password)
        
    Raises:
        HTTPException: If user with this email already exists
    """
    user_repo = UserRepository()
    
    # Check if user already exists
    existing_user = await user_repo.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    user = await user_repo.create(db, obj_in=user_in)
    
    return user


@router.post(
    "/login",
    response_model=Token,
    summary="Login user",
    description="Authenticate user and return access and refresh tokens."
)
async def login(
    user_in: UserCreate,
    db: GetDB
) -> Token:
    """
    Login user and return JWT tokens.
    
    Args:
        user_in: User credentials (email and password)
        db: Async database session
        
    Returns:
        Token response with access_token and refresh_token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    user_repo = UserRepository()
    
    # Find user by email
    user = await user_repo.get_by_email(db, email=user_in.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not user_repo.verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post(
    "/refresh",
    response_model=Token,
    summary="Refresh access token",
    description="Get new access token using refresh token."
)
async def refresh(
    refresh_token: str,
    db: GetDB
) -> Token:
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_token: Valid JWT refresh token
        db: Async database session (for future revocation support)
        
    Returns:
        Token response with new access_token and refresh_token
        
    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    # Decode and validate refresh token
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check token type
    token_type = payload.get("type")
    if token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract user ID from token
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user still exists
    user_repo = UserRepository()
    user = await user_repo.get_by_id(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new tokens
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )