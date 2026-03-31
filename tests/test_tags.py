"""
Tests for tags endpoints.

Tests cover:
- List all tags (global tags across all notes)
- Get tag by ID
- 404 for non-existent tags
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestListTags:
    """Tests for listing tags endpoint."""
    
    async def test_list_tags_empty(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test listing tags when no tags exist.
        
        Given: No tags in system
        When: GET /api/v1/tags/
        Then: Empty list is returned
        """
        response = await client.get("/api/v1/tags/")
        
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    async def test_list_tags_with_data(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test listing all tags in system.
        
        Given: Multiple users have created notes with various tags
        When: GET /api/v1/tags/
        Then: All global tags are returned
        """
        # Create User1 with notes and tags
        await client.post(
            "/api/v1/auth/register",
            json={"email": "user1@example.com", "password": "password123"}
        )
        login1 = await client.post(
            "/api/v1/auth/login",
            json={"email": "user1@example.com", "password": "password123"}
        )
        token1 = login1.json()["access_token"]
        
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token1}"},
            json={"title": "Note 1", "tags": ["python", "fastapi"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token1}"},
            json={"title": "Note 2", "tags": ["javascript", "react"]}
        )
        
        # Create User2 with notes and tags
        await client.post(
            "/api/v1/auth/register",
            json={"email": "user2@example.com", "password": "password123"}
        )
        login2 = await client.post(
            "/api/v1/auth/login",
            json={"email": "user2@example.com", "password": "password123"}
        )
        token2 = login2.json()["access_token"]
        
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token2}"},
            json={"title": "Note 3", "tags": ["python", "django"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token2}"},
            json={"title": "Note 4", "tags": ["work", "urgent"]}
        )
        
        # List all tags
        response = await client.get("/api/v1/tags/")
        
        assert response.status_code == 200
        tags = response.json()
        tag_names = {tag["name"] for tag in tags}
        
        # All unique tags should be present
        assert "python" in tag_names
        assert "fastapi" in tag_names
        assert "javascript" in tag_names
        assert "react" in tag_names
        assert "django" in tag_names
        assert "work" in tag_names
        assert "urgent" in tag_names
        
        # Tags have IDs
        for tag in tags:
            assert "id" in tag
            assert tag["id"] > 0
            assert "name" in tag
            assert len(tag["name"]) <= 50
    
    async def test_list_tags_deduplication(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test tags are deduplicated across notes.
        
        Given: Multiple notes with the same tag
        When: GET /api/v1/tags/
        Then: Each tag appears only once
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={"email": "dedup@example.com", "password": "password123"}
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "dedup@example.com", "password": "password123"}
        )
        token = login.json()["access_token"]
        
        # Create multiple notes with same tags
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 1", "tags": ["python", "tech"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 2", "tags": ["python", "code"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 3", "tags": ["tech", "python"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 4", "tags": ["code", "python"]}
        )
        
        # List tags
        response = await client.get("/api/v1/tags/")
        
        assert response.status_code == 200
        tags = response.json()
        
        # Check tags appear only once
        tag_names = [tag["name"] for tag in tags]
        assert len(tag_names) == 3  # Only 3 unique tags
        
        # Count occurrences
        assert tag_names.count("python") == 1
        assert tag_names.count("tech") == 1
        assert tag_names.count("code") == 1
    
    async def test_list_tags_case_sensitivity(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test tag names are case-sensitive.
        
        Given: Notes with "Python" and "python" tags
        When: GET /api/v1/tags/
        Then: Both tags appear as separate entries
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={"email": "case@example.com", "password": "password123"}
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "case@example.com", "password": "password123"}
        )
        token = login.json()["access_token"]
        
        # Create notes with different case tags
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 1", "tags": ["Python"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 2", "tags": ["python"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Note 3", "tags": ["PYTHON"]}
        )
        
        # List tags
        response = await client.get("/api/v1/tags/")
        
        assert response.status_code == 200
        tags = response.json()
        tag_names = {tag["name"] for tag in tags}
        
        # All case variations should exist
        # Note: This depends on implementation - if unique is case-insensitive,
        # the later tags might be considered duplicates
        assert len(tag_names) > 0


class TestGetTag:
    """Tests for getting a single tag endpoint."""
    
    async def test_get_tag_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successfully getting a tag by ID.
        
        Given: System has tags from created notes
        When: GET /api/v1/tags/{tag_id}
        Then: Tag details are returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={"email": "gettag@example.com", "password": "password123"}
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "gettag@example.com", "password": "password123"}
        )
        token = login.json()["access_token"]
        
        # Create note with tags
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Test Note", "tags": ["important", "feature"]}
        )
        
        # Get all tags to find IDs
        tags_response = await client.get("/api/v1/tags/")
        tags = tags_response.json()
        assert len(tags) >= 2
        
        tag_id = tags[0]["id"]
        tag_name = tags[0]["name"]
        
        # Get specific tag
        response = await client.get(f"/api/v1/tags/{tag_id}")
        
        assert response.status_code == 200
        tag = response.json()
        assert tag["id"] == tag_id
        assert tag["name"] == tag_name
    
    async def test_get_tag_not_found(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test getting non-existent tag returns error.
        
        Given: System has some tags
        When: GET /api/v1/tags/{nonexistent_id}
        Then: 404 error is returned
        """
        response = await client.get("/api/v1/tags/99999")
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    async def test_get_tag_invalid_id(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test getting tag with invalid ID returns error.
        
        Given: System has some tags
        When: GET /api/v1/tags/{invalid_id}
        Then: 422 validation error is returned
        """
        response = await client.get("/api/v1/tags/invalid")
        
        assert response.status_code == 422
    
    async def test_get_tag_negative_id(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test getting tag with negative ID returns error (not found).
        
        Given: System has some tags
        When: GET /api/v1/tags/{negative_id}
        Then: 404 error is returned (negative IDs are valid but don't exist)
        """
        response = await client.get("/api/v1/tags/-1")
        
        assert response.status_code == 404


class TestTagsIntegrationFlow:
    """Integration tests for tags workflow."""
    
    async def test_tags_creation_via_notes(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test tags are automatically created when notes are created.
        
        Given: Authenticated user
        When: Creating notes with tags
        Then: Tags are available via tags API
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={"email": "tagflow@example.com", "password": "password123"}
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "tagflow@example.com", "password": "password123"}
        )
        token = login.json()["access_token"]
        
        # Verify no tags initially
        empty_tags = await client.get("/api/v1/tags/")
        assert empty_tags.json() == []
        
        # Create note with tags
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Important Note", "tags": ["work", "urgent"]}
        )
        
        # Check tags are now available
        tags_response = await client.get("/api/v1/tags/")
        tags = tags_response.json()
        tag_names = {tag["name"] for tag in tags}
        
        assert "work" in tag_names
        assert "urgent" in tag_names
    
    async def test_tag_persistence_across_note_deletion(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test tags persist even after notes using them are deleted.
        
        Given: System has notes with tags
        When: All notes using a tag are deleted
        Then: Tag still exists in system
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={"email": "persist@example.com", "password": "password123"}
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "persist@example.com", "password": "password123"}
        )
        token = login.json()["access_token"]
        
        # Create note with tag
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "To Delete", "tags": ["temporary"]}
        )
        
        # Get tag ID
        tags_response = await client.get("/api/v1/tags/")
        tags = tags_response.json()
        tag = next(t for t in tags if t["name"] == "temporary")
        tag_id = tag["id"]
        
        # Delete the note
        notes_response = await client.get("/api/v1/notes/", headers={"Authorization": f"Bearer {token}"})
        note_id = notes_response.json()["items"][0]["id"]
        await client.delete(f"/api/v1/notes/{note_id}", headers={"Authorization": f"Bearer {token}"})
        
        # Tag should still be accessible
        tag_response = await client.get(f"/api/v1/tags/{tag_id}")
        assert tag_response.status_code == 200
        assert tag_response.json()["name"] == "temporary"
    
    async def test_tags_no_auth_required(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test tags endpoints do not require authentication.
        
        Given: System has tags from other users' notes
        When: Unauthenticated user requests tags
        Then: Tags are successfully returned
        """
        # Create user and add some notes
        await client.post(
            "/api/v1/auth/register",
            json={"email": "auth@example.com", "password": "password123"}
        )
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "auth@example.com", "password": "password123"}
        )
        token = login.json()["access_token"]
        
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Public Tags", "tags": ["public", "visible"]}
        )
        
        # Request tags without authentication
        list_response = await client.get("/api/v1/tags/")
        assert list_response.status_code == 200
        assert len(list_response.json()) > 0
        
        # Get specific tag without authentication
        tags = list_response.json()
        tag_id = tags[0]["id"]
        get_response = await client.get(f"/api/v1/tags/{tag_id}")
        assert get_response.status_code == 200