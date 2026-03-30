# Todo App with Kanban Board

Full-stack todo application with drag-and-drop Kanban board functionality.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Material UI (Dark Theme)
- **Drag & Drop**: @hello-pangea/dnd
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

## Features

- 📋 Create, edit, and delete tasks
- 🚀 Drag and drop tasks between columns (Todo, In Progress, Done)
- 🎨 Material UI dark theme with responsive design
- 🏷️ Task priority levels (Low, Medium, High)
- 🌈 Customizable task colors
- 📱 Cross-platform support
- 🔄 Real-time task management

## Quick Start

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/apan98/todo-app.git
cd todo-app

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Manual Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+

#### Backend Setup

```bash
cd server
npm install
npm start
```

The server will run on http://localhost:5000

#### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The app will run on http://localhost:3000

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Architecture

### Frontend Structure
```
client/
├── src/
│   ├── api.ts              # API service layer
│   ├── App.tsx             # Main application component
│   ├── Column.tsx          # Kanban column component
│   ├── TaskCard.tsx        # Task card component
│   ├── TaskModal.tsx       # Task creation/edit modal
│   └── types.ts            # TypeScript type definitions
```

### Backend Structure
```
server/
├── server.js               # Express server with PostgreSQL
└── package.json
```

## Database Schema

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'low',
    color VARCHAR(7) DEFAULT '#e91e63',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## License

MIT
