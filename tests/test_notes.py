"""
Tests for notes endpoints.

Tests cover:
- Create notes with optional tags
- List notes with pagination, search, tag filtering, and sorting
- Get note by ID
- Update notes (partial updates)
- Delete notes
- Search notes by text and tags
- Pagination (limit/offset)
- Sorting (default by created_at DESC, optional by title)
- Note ownership verification (users can only access their own notes)
- Validation (title required, tags max 10, each tag max 50 chars)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestCreateNote:
    """Tests for note creation endpoint."""
    
    async def test_create_note_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successful note creation.
        
        Given: Authenticated user with valid token
        When: POST /api/v1/notes with valid note data
        Then: Note is created and returned with 201 status
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "notes@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "notes@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Test Note",
                "content": "This is a test note",
                "tags": ["test", "important"]
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["id"] > 0
        assert data["title"] == "Test Note"
        assert data["content"] == "This is a test note"
        assert data["is_pinned"] is False
        assert "created_at" in data
        assert len(data["tags"]) == 2
        assert data["tags"][0]["name"] == "test"
        assert data["tags"][1]["name"] == "important"
    
    async def test_create_note_with_optional_fields(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note with all optional fields.
        
        Given: Authenticated user
        When: POST /api/v1/notes with is_pinned, color, and tags
        Then: Note is created with all fields preserved
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "full@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "full@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note with all fields
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Full Note",
                "content": "Content with optional fields",
                "is_pinned": True,
                "color": "#FF5733",
                "tags": ["work", "urgent"]
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data[" title"] == "Full Note"
        assert data["is_pinned"] is True
        assert data["color"] == "#FF5733"
    
    async def test_create_note_without_auth(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note without authentication returns error.
        
        Given: No authentication token
        When: POST /api/v1/notes without Authorization header
        Then: 401 error is returned
        """
        response = await client.post(
            "/api/v1/notes/",
            json={
                "title": "Test Note",
                "content": "This is a test"
            }
        )
        
        assert response.status_code == 401
    
    async def test_create_note_missing_title(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note without title returns error.
        
        Given: Authenticated user
        When: POST /api/v1/notes without required title field
        Then: 422 validation error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "notitle@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "notitle@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note without title
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "content": "Note without title"
            }
        )
        
        assert response.status_code == 422
    
    async def test_create_note_title_too_long(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note with title exceeding max length returns error.
        
        Given: Authenticated user
        When: POST /api/v1/notes with title longer than 200 characters
        Then: 422 validation error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "long@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "long@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note with too long title
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "a" * 201,
                "content": "Note with long title"
            }
        )
        
        assert response.status_code == 422
    
    async def test_create_note_tags_too_many(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note with more than 10 tags returns error.
        
        Given: Authenticated user
        When: POST /api/v1/notes with 11 tags
        Then: 422 validation error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "tags@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "tags@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note with too many tags
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Too Many Tags",
                "content": "Note with too many tags",
                "tags": [f"tag{i}" for i in range(11)]
            }
        )
        
        assert response.status_code == 422
    
    async def test_create_note_tag_name_too_long(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note with tag name exceeding 50 characters returns error.
        
        Given: Authenticated user
        When: POST /api/v1/notes with tag longer than 50 characters
        Then: 422 validation error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "taglong@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "taglong@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note with long tag name
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Long Tag",
                "content": "Note with long tag name",
                "tags": ["x" * 51]
            }
        )
        
        assert response.status_code == 422
    
    async def test_create_note_invalid_color_format(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test creating note with invalid color format returns error.
        
        Given: Authenticated user
        When: POST /api/v1/notes with invalid hex color
        Then: 422 validation error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "color@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "color@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note with invalid color
        response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Bad Color",
                "content": "Note with invalid color",
                "color": "not-a-color"
            }
        )
        
        assert response.status_code == 422


class TestListNotes:
    """Tests for listing notes endpoint."""
    
    async def test_list_notes_empty(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test listing notes when user has none.
        
        Given: Authenticated user with no notes
        When: GET /api/v1/notes/
        Then: Empty list is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "empty@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "empty@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # List notes
        response = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["limit"] == 20
        assert data["offset"] == 0
        assert data["has_more"] is False
    
    async def test_list_notes_with_data(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test listing user's notes.
        
        Given: Authenticated user with 3 notes
        When: GET /api/v1/notes/
        Then: All user's notes are returned sorted by created_at DESC
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "list@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "list@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create 3 notes
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "First Note", "content": "First content"}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Second Note", "content": "Second content"}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Third Note", "content": "Third content"}
        )
        
        # List notes
        response = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == 3
        # Default sort is created_at DESC, so last created is first
        assert data["items"][0]["title"] == "Third Note"
        assert data["items"][1]["title"] == "Second Note"
        assert data["items"][2]["title"] == "First Note"
    
    async def test_list_notes_pagination(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test pagination with skip and limit.
        
        Given: Authenticated user with 5 notes
        When: GET /api/v1/notes/?skip=2&limit=2
        Then: 2 notes are returned (3rd and 4th)
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "pag@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "pag@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create 5 notes
        for i in range(1, 6):
            await client.post(
                "/api/v1/notes/",
                headers={"Authorization": f"Bearer {token}"},
                json={"title": f"Note {i}", "content": f"Content {i}"}
            )
        
        # Get page with skip=2, limit=2
        response = await client.get(
            "/api/v1/notes/?skip=2&limit=2",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["offset"] == 2
        assert data["limit"] == 2
        assert data["has_more"] is True
        # Default sort is created_at DESC
        assert data["items"][0]["title"] == "Note 3"
        assert data["items"][1]["title"] == "Note 2"
    
    async def test_list_notes_search_by_text(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test searching notes by text.
        
        Given: User with notes titled "Python Tutorial", "JavaScript Guide", "Python Tips"
        When: GET /api/v1/notes/?search=python
        Then: Only notes containing "Python" are returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "search@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "search@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create notes
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Python Tutorial", "content": "Learn Python", "tags": ["python"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "JavaScript Guide", "content": "Learn JavaScript", "tags": ["js"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Python Tips", "content": "Python advanced", "tags": ["python"]}
        )
        
        # Search for "Python"
        response = await client.get(
            "/api/v1/notes/?search=Python",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2
        titles = [n["title"] for n in data["items"]]
        assert "Python Tutorial" in titles
        assert "Python Tips" in titles
    
    async def test_list_notes_filter_by_tags(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test filtering notes by tags.
        
        Given: User with notes tagged "work" and "personal"
        When: GET /api/v1/notes/?tags=work
        Then: Only notes with "work" tag are returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "filter@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "filter@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create notes with different tags
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Work Task 1", "content": "Complete project", "tags": ["work", "urgent"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Personal Note", "content": "Shopping list", "tags": ["personal"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Work Task 2", "content": "Meeting notes", "tags": ["work"]}
        )
        
        # Filter by "work" tag
        response = await client.get(
            "/api/v1/notes/?tags=work",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2
        titles = [n["title"] for n in data["items"]]
        assert "Work Task 1" in titles
        assert "Work Task 2" in titles
    
    async def test_list_notes_filter_by_multiple_tags(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test filtering notes by multiple tags (AND logic).
        
        Given: User with notes with different tag combinations
        When: GET /api/v1/notes/?tags=work,urgent
        Then: Only notes with BOTH tags are returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "multifilter@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "multifilter@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create notes
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Urgent Work", "content": "ASAP", "tags": ["work", "urgent"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Regular Work", "content": "Normal", "tags": ["work"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Urgent Personal", "content": "Emergency", "tags": ["personal", "urgent"]}
        )
        
        # Filter by both "work" and "urgent" tags
        response = await client.get(
            "/api/v1/notes/?tags=work,urgent",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Urgent Work"
    
    async def test_list_notes_sort_by_title_asc(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test sorting notes by title in ascending order.
        
        Given: User with notes "Zebra", "Apple", "Mango"
        When: GET /api/v1/notes/?sort_by=title&sort_order=asc
        Then: Notes are returned in alphabetical order
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "sort@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "sort@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create notes
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Zebra", "content": "Last alphabetically"}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Apple", "content": "First alphabetically"}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Mango", "content": "Middle alphabetically"}
        )
        
        # Sort by title ascending
        response = await client.get(
            "/api/v1/notes/?sort_by=title&sort_order=asc",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["title"] == "Apple"
        assert data["items"][1]["title"] == "Mango"
        assert data["items"][2]["title"] == "Zebra"
    
    async def test_list_notes_sort_by_created_at(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test default sorting by created_at.
        
        Given: User with 3 notes created at different times
        When: GET /api/v1/notes/ (no sort params)
        Then: Notes are returned with newest first (created_at DESC)
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "sorttime@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "sorttime@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create notes
        note1 = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "First", "content": "Old"}
        )
        note2 = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Second", "content": "Middle"}
        )
        note3 = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Third", "content": "New"}
        )
        
        # List notes (default sort by created_at DESC)
        response = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Newest first
        assert data["items"][0]["title"] == "Third"
        assert data["items"][1]["title"] == "Second"
        assert data["items"][2]["title"] == "First"
    
    async def test_list_notes_without_auth(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test listing notes without authentication returns error.
        
        Given: No authentication token
        When: GET /api/v1/notes/ without Authorization header
        Then: 401 error is returned
        """
        response = await client.get("/api/v1/notes/")
        assert response.status_code == 401


class TestGetNote:
    """Tests for getting a single note endpoint."""
    
    async def test_get_note_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successfully getting a note by ID.
        
        Given: Authenticated user with a note
        When: GET /api/v1/notes/{id}
        Then: Note is returned with all fields
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "get@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "get@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Get Me",
                "content": "This note should be retrieved",
                "is_pinned": True,
                "color": "#FF0000",
                "tags": ["test", "retrieve"]
            }
        )
        note_id = create_response.json()["id"]
        
        # Get note
        response = await client.get(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == note_id
        assert data["title"] == "Get Me"
        assert data["content"] == "This note should be retrieved"
        assert data["is_pinned"] is True
        assert data["color"] == "#FF0000"
        assert len(data["tags"]) == 2
    
    async def test_get_note_not_found(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test getting non-existent note returns error.
        
        Given: Authenticated user
        When: GET /api/v1/notes/{nonexistent_id}
        Then: 404 error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "notfound@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "notfound@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to get non-existent note
        response = await client.get(
            "/api/v1/notes/99999",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    async def test_get_note_without_auth(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test getting note without authentication returns error.
        
        Given: Note exists
        When: GET /api/v1/notes/{id} without Authorization header
        Then: 401 error is returned
        """
        response = await client.get("/api/v1/notes/1")
        assert response.status_code == 401


class TestUpdateNote:
    """Tests for updating notes endpoint."""
    
    async def test_update_note_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successfully updating a note.
        
        Given: Authenticated user with a note
        When: PATCH /api/v1/notes/{id} with updated fields
        Then: Note is updated and returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "update@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "update@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Original Title",
                "content": "Original content",
                "is_pinned": False
            }
        )
        note_id = create_response.json()["id"]
        
        # Update note
        response = await client.patch(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated Title",
                "content": "Updated content",
                "is_pinned": True,
                "color": "#00FF00",
                "tags": ["updated", "modified"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == note_id
        assert data["title"] == "Updated Title"
        assert data["content"] == "Updated content"
        assert data["is_pinned"] is True
        assert data["color"] == "#00FF00"
        assert len(data["tags"]) == 2
    
    async def test_update_note_partial(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test partial update of a note.
        
        Given: Authenticated user with a note
        When: PATCH /api/v1/notes/{id} with only title field
        Then: Only title is updated, other fields remain unchanged
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "partial@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "partial@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Original",
                "content": "Content stays",
                "is_pinned": True,
                "color": "#0000FF"
            }
        )
        note_id = create_response.json()["id"]
        
        # Update only title
        response = await client.patch(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "New Title"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title"
        assert data["content"] == "Content stays"
        assert data["is_pinned"] is True
        assert data["color"] == "#0000FF"
    
    async def test_update_note_not_found(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test updating non-existent note returns error.
        
        Given: Authenticated user
        When: PATCH /api/v1/notes/{nonexistent_id}
        Then: 404 error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "upnotfound@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "upnotfound@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to update non-existent note
        response = await client.patch(
            "/api/v1/notes/99999",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Updated"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    async def test_update_note_without_auth(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test updating note without authentication returns error.
        
        Given: Note exists
        When: PATCH /api/v1/notes/{id} without Authorization header
        Then: 401 error is returned
        """
        response = await client.patch(
            "/api/v1/notes/1",
            json={"title": "Updated"}
        )
        assert response.status_code == 401
    
    async def test_update_note_invalid_title_length(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test updating note with invalid title length returns error.
        
        Given: Authenticated user with a note
        When: PATCH /api/v1/notes/{id} with title longer than 200 chars
        Then: 422 validation error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "badtitle@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "badtitle@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Valid Title"}
        )
        note_id = create_response.json()["id"]
        
        # Try to update with invalid title
        response = await client.patch(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "x" * 201}
        )
        
        assert response.status_code == 422


class TestDeleteNote:
    """Tests for deleting notes endpoint."""
    
    async def test_delete_note_success(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test successfully deleting a note.
        
        Given: Authenticated user with a note
        When: DELETE /api/v1/notes/{id}
        Then: Note is deleted and 204 No Content is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "delete@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "delete@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "To Delete", "content": "Will be deleted"}
        )
        note_id = create_response.json()["id"]
        
        # Delete note
        response = await client.delete(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 204
        assert response.content == b""
        
        # Verify note is deleted
        get_response = await client.get(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_response.status_code == 404
    
    async def test_delete_note_not_found(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test deleting non-existent note returns error.
        
        Given: Authenticated user
        When: DELETE /api/v1/notes/{nonexistent_id}
        Then: 404 error is returned
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "delnotfound@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "delnotfound@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to delete non-existent note
        response = await client.delete(
            "/api/v1/notes/99999",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    async def test_delete_note_without_auth(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test deleting note without authentication returns error.
        
        Given: Note exists
        When: DELETE /api/v1/notes/{id} without Authorization header
        Then: 401 error is returned
        """
        response = await client.delete("/api/v1/notes/1")
        assert response.status_code == 401


class TestNoteOwnership:
    """Tests for note ownership verification."""
    
    async def test_user_cannot_access_other_user_note(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test user cannot access another user's notes.
        
        Given: Two users, UserA with a note
        When: UserB tries to GET UserA's note
        Then: 404 error is returned (note not found for this user)
        """
        # Register UserA
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "usera@example.com",
                "password": "password123"
            }
        )
        login_a = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "usera@example.com",
                "password": "password123"
            }
        )
        token_a = login_a.json()["access_token"]
        
        # UserA creates a note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "UserA's Secret Note", "content": "Secret content"}
        )
        note_id = create_response.json()["id"]
        
        # Register UserB
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "userb@example.com",
                "password": "password123"
            }
        )
        login_b = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "userb@example.com",
                "password": "password123"
            }
        )
        token_b = login_b.json()["access_token"]
        
        # UserB tries to get UserA's note
        response = await client.get(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        
        assert response.status_code == 404
    
    async def test_user_cannot_update_other_user_note(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test user cannot update another user's notes.
        
        Given: Two users, UserA with a note
        When: UserB tries to PATCH UserA's note
        Then: 404 error is returned
        """
        # Register UserA
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "useraup@example.com",
                "password": "password123"
            }
        )
        login_a = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "useraup@example.com",
                "password": "password123"
            }
        )
        token_a = login_a.json()["access_token"]
        
        # UserA creates a note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "UserA's Note", "content": "Original content"}
        )
        note_id = create_response.json()["id"]
        
        # Register UserB
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "userbup@example.com",
                "password": "password123"
            }
        )
        login_b = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "userbup@example.com",
                "password": "password123"
            }
        )
        token_b = login_b.json()["access_token"]
        
        # UserB tries to update UserA's note
        response = await client.patch(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"title": "Hacked!", "content": "Malicious content"}
        )
        
        assert response.status_code == 404
        
        # Verify original note is unchanged
        get_response = await client.get(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert get_response.status_code == 200
        note = get_response.json()
        assert note["title"] == "UserA's Note"
        assert note["content"] == "Original content"
    
    async def test_user_cannot_delete_other_user_note(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test user cannot delete another user's notes.
        
        Given: Two users, UserA with a note
        When: UserB tries to DELETE UserA's note
        Then: 404 error is returned
        """
        # Register UserA
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "useradel@example.com",
                "password": "password123"
            }
        )
        login_a = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "useradel@example.com",
                "password": "password123"
            }
        )
        token_a = login_a.json()["access_token"]
        
        # UserA creates a note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "UserA's Note", "content": "Content"}
        )
        note_id = create_response.json()["id"]
        
        # Register UserB
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "userbdel@example.com",
                "password": "password123"
            }
        )
        login_b = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "userbdel@example.com",
                "password": "password123"
            }
        )
        token_b = login_b.json()["access_token"]
        
        # UserB tries to delete UserA's note
        response = await client.delete(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        
        assert response.status_code == 404
        
        # Verify original note still exists
        get_response = await client.get(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert get_response.status_code == 200
    
    async def test_users_see_only_their_notes_in_list(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test users only see their own notes in list.
        
        Given: Two users, each with notes
        When: Both users GET /api/v1/notes/
        Then: Each user sees only their own notes
        """
        # Register UserA and create notes
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "useralist@example.com",
                "password": "password123"
            }
        )
        login_a = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "useralist@example.com",
                "password": "password123"
            }
        )
        token_a = login_a.json()["access_token"]
        
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "UserA Note 1", "tags": ["ua"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "UserA Note 2", "tags": ["ua"]}
        )
        
        # Register UserB and create notes
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "userblist@example.com",
                "password": "password123"
            }
        )
        login_b = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "userblist@example.com",
                "password": "password123"
            }
        )
        token_b = login_b.json()["access_token"]
        
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"title": "UserB Note 1", "tags": ["ub"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"title": "UserB Note 2", "tags": ["ub"]}
        )
        await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"title": "UserB Note 3", "tags": ["ub"]}
        )
        
        # UserA lists notes
        response_a = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert response_a.status_code == 200
        data_a = response_a.json()
        assert len(data_a["items"]) == 2
        assert data_a["total"] == 2
        titles_a = [n["title"] for n in data_a["items"]]
        assert "UserA Note 1" in titles_a
        assert "UserA Note 2" in titles_a
        assert "UserB Note 1" not in titles_a
        
        # UserB lists notes
        response_b = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert response_b.status_code == 200
        data_b = response_b.json()
        assert len(data_b["items"]) == 3
        assert data_b["total"] == 3
        titles_b = [n["title"] for n in data_b["items"]]
        assert "UserB Note 1" in titles_b
        assert "UserB Note 2" in titles_b
        assert "UserB Note 3" in titles_b
        assert "UserA Note 1" not in titles_b


class TestNotesIntegrationFlow:
    """Integration tests for complete notes workflow."""
    
    async def test_full_notes_crud_flow(
        self,
        client: AsyncClient
    ) -> None:
        """
        Test complete notes CRUD flow: create → read → update → delete.
        
        Given: Authenticated user
        When: User creates, reads, updates, and deletes a note
        Then: All operations succeed correctly
        """
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "integration@example.com",
                "password": "password123"
            }
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "integration@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Step 1: Create note
        create_response = await client.post(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Integration Test Note",
                "content": "This is an integration test",
                "tags": ["integration", "test"]
            }
        )
        assert create_response.status_code == 201
        note = create_response.json()
        note_id = note["id"]
        assert note["title"] == "Integration Test Note"
        
        # Step 2: Read note
        get_response = await client.get(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_response.status_code == 200
        assert get_response.json()["title"] == "Integration Test Note"
        
        # Step 3: Update note
        update_response = await client.patch(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Updated Integration Test Note",
                "is_pinned": True
            }
        )
        assert update_response.status_code == 200
        updated_note = update_response.json()
        assert updated_note["title"] == "Updated Integration Test Note"
        assert updated_note["is_pinned"] is True
        
        # Step 4: List notes to verify update
        list_response = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_response.status_code == 200
        assert len(list_response.json()["items"]) == 1
        assert list_response.json()["items"][0]["title"] == "Updated Integration Test Note"
        
        # Step 5: Delete note
        delete_response = await client.delete(
            f"/api/v1/notes/{note_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_response.status_code == 204
        
        # Step 6: Verify deletion
        list_after = await client.get(
            "/api/v1/notes/",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert len(list_after.json()["items"]) == 0