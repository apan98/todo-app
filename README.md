# Todo App

Full-stack TODO application (Kanban board) with Node.js backend, React frontend, and PostgreSQL database.

## Features

- User authentication (JWT)
- CRUD operations for tasks
- Drag-and-drop tasks between categories
- Task priorities
- Filtering and searching tasks

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, Sequelize
- **Frontend:** React, react-beautiful-dnd
- **Containerization:** Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository
2. Create a `.env` file in the `backend` directory with the following content:
   ```
   DB_USER=user
   DB_PASSWORD=password
   DB_NAME=todo_app
   DB_HOST=db
   PORT=3001
   JWT_SECRET=your_jwt_secret
   ```
3. Run `docker-compose up --build`
4. Open your browser and navigate to `http://localhost:3000`
