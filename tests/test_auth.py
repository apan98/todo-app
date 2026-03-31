"""
Tests for authentication endpoints.

Tests cover:
- User registration
- User login with valid credentials
- User login with invalid credentials
- Access token refresh
- Error handling (duplicate email, wrong password, etc.)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestRegister:
    """Tests for user registration endpoint."""
    
    async def test_register_success(
        self,
        client: AsyncClient,
        db: AsyncSession
    ) -> None:
        """
        Test successful user registration.
        
        Given: Valid user registration data
        When: POST /api/v1/auth/register
        Then: User is created and returned with 201 status
        """
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "securepassword123"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["id"] > 0
        assert data["email"] == "test@example.com"
        assert "created_at" in data
        assert "password" not in data
        assert "password_hash" not in data
    
    async def test_register_duplicate_email(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test registration with duplicate email returns error.
        
        Given: A user already exists with email
        When: POST /api/v1/auth/register with same email
        Then: 400 error is returned
        """
        # Create first user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password123"
            }
        )
        
        # Try to register duplicate user
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "differentpassword"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data["detail"].lower()
    
    async def test_register_invalid_email(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test registration with invalid email returns error.
        
        Given: Invalid email format
        When: POST /api/v1/auth/register
        Then: 422 validation error is returned
        """
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123"
            }
        )
        
        assert response.status_code == 422
    
    async def test_register_short_password(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test registration with short password returns error.
        
        Given: Password shorter than 6 characters
        When: POST /api/v1/auth/register
        Then: 422 validation error is returned
        """
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "12345"  # Too short (min 6)
            }
        )
        
        assert response.status_code == 422
    
    async def test_register_missing_fields(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test registration with missing fields returns error.
        
        Given: Missing required fields
        When: POST /api/v1/auth/register without email/password
        Then: 422 validation error is returned
        """
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": "test@example.com"}  # Missing password
        )
        
        assert response.status_code == 422


class TestLogin:
    """Tests for user login endpoint."""
    
    async def test_login_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successful user login.
        
        Given: A registered user
        When: POST /api/v1/auth/login with valid credentials
        Then: Access and refresh tokens are returned
        """
        # Register user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "login@example.com",
                "password": "correctpassword"
            }
        )
        
        # Login
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "login@example.com",
                "password": "correctpassword"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        assert len(data["refresh_token"]) > 0
    
    async def test_login_wrong_password(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test login with wrong password returns error.
        
        Given: A registered user
        When: POST /api/v1/auth/login with wrong password
        Then: 401 error is returned
        """
        # Register user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "correctpass"
            }
        )
        
        # Login with wrong password
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "incorrect" in data["detail"].lower()
    
    async def test_login_nonexistent_user(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test login with non-existent user returns error.
        
        Given: No user exists with email
        When: POST /api/v1/auth/login with fake credentials
        Then: 401 error is returned
        """
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "anypassword"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "incorrect" in data["detail"].lower()
    
    async def test_login_invalid_credentials_format(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test login with invalid request format returns error.
        
        Given: Invalid request body
        When: POST /api/v1/auth/login without required fields
        Then: 422 validation error is returned
        """
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"}  # Missing password
        )
        
        assert response.status_code == 422


class TestRefresh:
    """Tests for token refresh endpoint."""
    
    async def test_refresh_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successful token refresh.
        
        Given: A valid refresh token
        When: POST /api/v1/auth/refresh with refresh token
        Then: New access and refresh tokens are returned
        """
        # Register and login to get tokens
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "refresh@example.com",
                "password": "password123"
            }
        )
        
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "refresh@example.com",
                "password": "password123"
            }
        )
        tokens = login_response.json()
        
        # Refresh tokens
        response = await client.post(
            f"/api/v1/auth/refresh?refresh_token={tokens['refresh_token']}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        # Verify token is valid JWT format
        assert len(data["access_token"]) > 0
        assert data["access_token"].count('.') == 2  # JWT has 3 parts
    
    async def test_refresh_invalid_token(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test refresh with invalid token returns error.
        
        Given: An invalid/ malformed token
        When: POST /api/v1/auth/refresh with bad token
        Then: 401 error is returned
        """
        response = await client.post(
            "/api/v1/auth/refresh?refresh_token=invalid.token.here"
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower() or "expired" in data["detail"].lower()
    
    async def test_refresh_with_access_token(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test refresh using access token instead of refresh returns error.
        
        Given: An access token (not refresh token)
        When: POST /api/v1/auth/refresh with access token
        Then: 401 error about wrong token type is returned
        """
        # Register and login to get tokens
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "tokenmix@example.com",
                "password": "password123"
            }
        )
        
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "tokenmix@example.com",
                "password": "password123"
            }
        )
        tokens = login_response.json()
        access_token = tokens["access_token"]
        
        # Try to use access token as refresh token
        response = await client.post(
            f"/api/v1/auth/refresh?refresh_token={access_token}"
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "token type" in data["detail"].lower()
    
    async def test_refresh_deleted_user(
        self,
        client: AsyncClient,
        db: AsyncSession
    ) -> None:
        """
        Test refresh with deleted user returns error.
        
        Given: A refresh token for a deleted user
        When: POST /api/v1/auth/refresh
        Then: 401 error is returned
        """
        # Register user
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "deleted@example.com",
                "password": "password123"
            }
        )
        user = register_response.json()
        user_id = user["id"]
        
        # Login to get tokens
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "deleted@example.com",
                "password": "password123"
            }
        )
        tokens = login_response.json()
        refresh_token = tokens["refresh_token"]
        
        # Delete user via repo
        from app.database import UserRepository
        user_repo = UserRepository()
        await user_repo.delete(db, id=user_id)
        await db.commit()
        
        # Try to refresh with deleted user's token
        response = await client.post(
            f"/api/v1/auth/refresh?refresh_token={refresh_token}"
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "not found" in data["detail"].lower() or "invalid" in data["detail"].lower()


class TestAuthFlow:
    """Integration tests for full authentication flow."""
    
    async def test_full_auth_flow(
        self,
        client: AsyncClient,
        db: AsyncSession
    ) -> None:
        """
        Test complete authentication flow: register → login → refresh.
        
        Given: Clean database
        When: User registers, logs in, and refreshes token
        Then: All operations succeed and tokens are valid
        """
        # Step 1: Register
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "fullflow@example.com",
                "password": "mypassword123"
            }
        )
        assert register_response.status_code == 201
        user = register_response.json()
        assert user["email"] == "fullflow@example.com"
        
        # Step 2: Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "fullflow@example.com",
                "password": "mypassword123"
            }
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        
        # Step 3: Refresh
        refresh_response = await client.post(
            f"/api/v1/auth/refresh?refresh_token={tokens['refresh_token']}"
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        # Verify token is valid JWT format
        assert len(new_tokens["access_token"]) > 0
        assert new_tokens["access_token"].count('.') == 2  # JWT has 3 parts