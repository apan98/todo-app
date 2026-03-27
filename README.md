# Todo App

This is a full-stack TODO application (Kanban board) with a Node.js backend, React frontend, and PostgreSQL database, all running in Docker containers.

## Features

- User authentication (JWT)
- CRUD operations for tasks
- Drag-and-drop tasks between categories
- Task priorities (low, medium, high)
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

1. Clone the repository:
   ```bash
   git clone https://github.com/apan98/todo-app.git
   ```
2. Navigate to the project directory:
   ```bash
   cd todo-app
   ```
3. Create a `.env` file in the `backend` directory by copying the `.env.example` file:
   ```bash
   cp backend/.env.example backend/.env
   ```
4. Build and run the containers:
   ```bash
   docker-compose up --build
   ```

The application will be available at `http://localhost:3000`.

### Seeding the Database

To seed the database with initial data, run the following command:

```bash
docker-compose exec backend npx sequelize-cli db:seed:all
```
