# Notes API

REST API для сервиса заметок с JWT авторизацией, тегами, поиском и пагинацией.

## Стек технологий

- **Backend**: FastAPI
- **База данных**: SQLite (async через SQLAlchemy + aiosqlite)
- **Авторизация**: JWT (access + refresh tokens)
- **Миграции**: Alembic
- **Тестирование**: Pytest
- **Контейнеризация**: Docker + docker-compose

## Особенности

- ✅ JWT авторизация с refresh tokens
- ✅ CRUD заметок
- ✅ Заметки привязаны к пользователям (только автор видит свои заметки)
- ✅ Теги для заметок (many-to-many связь)
- ✅ Поиск по тексту и тегам
- ✅ Пагинация (limit/offset)
- ✅ Сортировка по created_at и title
- ✅ Опциональные поля: is_pinned, color

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/apan98/notes-api.git
cd notes-api

# Запустить через Docker Compose
docker-compose up -d

# API будет доступен по адресу: http://localhost:8000
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

## Локальный запуск

```bash
# Установить зависимости
pip install -r requirements.txt

# Скопировать .env.example в .env и настроить переменные
cp .env.example .env

# Применить миграции
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Переменные окружения

```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite+aiosqlite:///./app.db
```

## API Документация

### Base URL

```
http://localhost:8000/api/v1
```

---

## Авторизация (/auth)

### Регистрация

Создаёт нового пользователя.

**Endpoint**: `POST /api/v1/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (201):
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

---

### Логин

Возвращает access и refresh токены.

**Endpoint**: `POST /api/v1/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

---

### Refresh Token

Обновляет access токен используя refresh токен.

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJhbGciOiJIUzI1NiIs..."}'
```

---

## Заметки (/notes)

Все эндпоинты заметок требуют авторизации (Bearer токен в заголовке).

### Создать заметку

Создаёт новую заметку для текущего пользователя.

**Endpoint**: `POST /api/v1/notes`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "title": "Моя первая заметка",
  "content": "Содержимое заметки...",
  "tags": ["работа", "идеи"],
  "is_pinned": false,
  "color": "#FF5733"
}
```

**Поля**:
- `title` (string, до 200 символов) - обязательно
- `content` (string) - содержимое без лимита
- `tags` (array of strings) - массив тегов (до 50 символов каждый, максимум 10 тегов)
- `is_pinned` (boolean) - закрепить заметку
- `color` (string, hex) - цвет заметки (опционально)

**Response** (201):
```json
{
  "id": 1,
  "title": "Моя первая заметка",
  "content": "Содержимое заметки...",
  "is_pinned": false,
  "color": "#FF5733",
  "created_at": "2024-01-15T10:30:00Z",
  "user_id": 1,
  "tags": [
    {"id": 1, "name": "работа"},
    {"id": 2, "name": "идеи"}
  ]
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/v1/notes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Моя первая заметка",
    "content": "Содержимое заметки...",
    "tags": ["работа", "идеи"],
    "is_pinned": false,
    "color": "#FF5733"
  }'
```

---

### Получить список заметок

Возвращает заметки текущего пользователя с пагинацией, фильтрацией и сортировкой.

**Endpoint**: `GET /api/v1/notes`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `limit` (integer, default: 10) - количество заметок на странице
- `offset` (integer, default: 0) - с какого элемента начать
- `search` (string) - поиск по тексту заметки (title + content)
- `tags` (string) - поиск по тегам (через запятую: "работа,идеи")
- `sort_by` (string: "created_at" | "title", default: "created_at") - поле сортировки
- `sort_order` (string: "asc" | "desc", default: "desc") - направление сортировки

**Response** (200):
```json
{
  "items": [
    {
      "id": 1,
      "title": "Моя первая заметка",
      "content": "Содержимое заметки...",
      "is_pinned": false,
      "color": "#FF5733",
      "created_at": "2024-01-15T10:30:00Z",
      "user_id": 1,
      "tags": [
        {"id": 1, "name": "работа"},
        {"id": 2, "name": "идеи"}
      ]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**cURL Examples**:

```bash
# Получить все заметки (по умолчанию)
curl -X GET "http://localhost:8000/api/v1/notes" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# С пагинацией
curl -X GET "http://localhost:8000/api/v1/notes?limit=5&offset=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Поиск по тексту
curl -X GET "http://localhost:8000/api/v1/notes?search=заметка" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Фильтрация по тегам
curl -X GET "http://localhost:8000/api/v1/notes?tags=работа,идеи" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Сортировка по title ASC
curl -X GET "http://localhost:8000/api/v1/notes?sort_by=title&sort_order=asc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Получить заметку по ID

Возвращает заметку по ID, если она принадлежит текущему пользователю.

**Endpoint**: `GET /api/v1/notes/{id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```json
{
  "id": 1,
  "title": "Моя первая заметка",
  "content": "Содержимое заметки...",
  "is_pinned": false,
  "color": "#FF5733",
  "created_at": "2024-01-15T10:30:00Z",
  "user_id": 1,
  "tags": [
    {"id": 1, "name": "работа"},
    {"id": 2, "name": "идеи"}
  ]
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:8000/api/v1/notes/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Обновить заметку

Обновляет заметку по ID, если она принадлежит текущему пользователю.

**Endpoint**: `PATCH /api/v1/notes/{id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (все поля опциональны):
```json
{
  "title": "Обновлённый заголовок",
  "content": "Обновлённое содержимое",
  "tags": ["работа"],
  "is_pinned": true,
  "color": "#00FF00"
}
```

**Response** (200):
```json
{
  "id": 1,
  "title": "Обновлённый заголовок",
  "content": "Обновлённое содержимое",
  "is_pinned": true,
  "color": "#00FF00",
  "created_at": "2024-01-15T10:30:00Z",
  "user_id": 1,
  "tags": [
    {"id": 1, "name": "работа"}
  ]
}
```

**cURL Example**:
```bash
curl -X PATCH http://localhost:8000/api/v1/notes/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Обновлённый заголовок",
    "is_pinned": true,
    "tags": ["работа"]
  }'
```

---

### Удалить заметку

Удаляет заметку по ID, если она принадлежит текущему пользователю.

**Endpoint**: `DELETE /api/v1/notes/{id}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (204):
*(пустой ответ)*

**cURL Example**:
```bash
curl -X DELETE http://localhost:8000/api/v1/notes/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Теги (/tags)

Все эндпоинты тегов доступны без авторизации (только чтение).

### Получить все теги

Возвращает список всех уникальных тегов.

**Endpoint**: `GET /api/v1/tags`

**Response** (200):
```json
{
  "items": [
    {"id": 1, "name": "работа"},
    {"id": 2, "name": "идеи"},
    {"id": 3, "name": "личное"}
  ],
  "total": 3
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:8000/api/v1/tags
```

---

### Получить тег по ID

Возвращает тег по ID.

**Endpoint**: `GET /api/v1/tags/{id}`

**Response** (200):
```json
{
  "id": 1,
  "name": "работа"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:8000/api/v1/tags/1
```

---

## Полный пример работы с API

```bash
# 1. Регистрация пользователя
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 2. Логин и получение токенов
RESPONSE=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refresh_token')

# 3. Создание заметки
curl -X POST http://localhost:8000/api/v1/notes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Купить продукты",
    "content": "Молоко, хлеб, яйца, сыр",
    "tags": ["дом", "покупки"],
    "is_pinned": true,
    "color": "#FF6B6B"
  }'

# 4. Создание ещё одной заметки
curl -X POST http://localhost:8000/api/v1/notes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Встреча с командой",
    "content": "Обсудить план на квартал",
    "tags": ["работа"],
    "is_pinned": false
  }'

# 5. Получить все заметки
curl -X GET "http://localhost:8000/api/v1/notes" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 6. Поиск по тексту
curl -X GET "http://localhost:8000/api/v1/notes?search=продукты" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 7. Фильтрация по тегу
curl -X GET "http://localhost:8000/api/v1/notes?tags=работа" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 8. Обновить заметку
curl -X PATCH http://localhost:8000/api/v1/notes/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Молоко, хлеб, яйца, сыр, овощи",
    "is_pinned": false
  }'

# 9. Получить все теги
curl -X GET http://localhost:8000/api/v1/tags

# 10. Удалить заметку
curl -X DELETE http://localhost:8000/api/v1/notes/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 11. Обновить access токен через refresh
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

---

## Тестирование

### Запуск тестов

```bash
# Запустить все тесты
pytest

# Запустить с выводом
pytest -v

# Запустить с покрытием
pytest --cov=app --cov-report=html

# Запустить конкретный файл тестов
pytest tests/test_auth.py
pytest tests/test_notes.py
pytest tests/test_tags.py
```

### Покрытие тестами

- ✅ Авторизация: регистрация, логин, refresh token
- ✅ Заметки: создание, чтение, обновление, удаление
- ✅ Поиск: по тексту, по тегам, комбинированный
- ✅ Пагинация: limit/offset
- ✅ Сортировка: по created_at, по title
- ✅ Владение: пользователи видят только свои заметки
- ✅ Валидация: title обязателен, теги ограничены по длине и количеству
- ✅ Теги: листинг, получение по ID

---

## Миграции базы данных

### Создать новую миграцию

```bash
alembic revision --autogenerate -m "<description>"
```

### Применить миграции

```bash
alembic upgrade head
```

### Откатить миграцию

```bash
alembic downgrade -1
```

### Посмотреть историю миграций

```bash
alembic history
```

---

## Структура проекта

```
notes-api/
├── app/
│   ├── alembic/              # Миграции Alembic
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py       # Эндпоинты авторизации
│   │       ├── notes.py      # Эндпоинты заметок
│   │       └── tags.py       # Эндпоинты тегов
│   ├── core/
│   │   ├── crud.py           # Базовый CRUD класс
│   │   ├── deps.py           # FastAPI зависимости
│   │   └── security.py       # JWT функции
│   ├── database/
│   │   ├── auth_repo.py      # Репозиторий пользователей
│   │   └── notes_repo.py     # Репозиторий заметок и тегов
│   ├── models/               # SQLAlchemy модели
│   │   ├── user.py
│   │   ├── tag.py
│   │   └── note.py
│   ├── schemas/              # Pydantic схемы
│   │   ├── user.py
│   │   ├── token.py
│   │   ├── note.py
│   │   └── tag.py
│   ├── config.py             # Конфигурация
│   ├── database.py           # Async engine
│   └── main.py               # FastAPI приложение
├── tests/
│   ├── conftest.py           # Фикстуры для тестов
│   ├── test_auth.py          # Тесты авторизации
│   ├── test_notes.py         # Тесты заметок
│   └── test_tags.py          # Тесты тегов
├── .env.example              # Пример переменных окружения
├── .gitignore
├── alembic.ini               # Конфигурация Alembic
├── docker-compose.yml        # Docker Compose конфигурация
├── Dockerfile                # Docker образ приложения
├── pyproject.toml            # Python конфигурация
├── pytest.ini                # Pytest конфигурация
├── requirements.txt          # Зависимости
└── README.md                 # Этот файл
```

---

## Лицензия

MIT License

---

## Автор

Создано командой PanDev
