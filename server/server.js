/**
 * Todo App Backend Server
 * REST API with PostgreSQL support
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL Pool
let pool;

try {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'todoapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  console.log('PostgreSQL connection pool created');
} catch (error) {
  console.error('Error creating PostgreSQL pool:', error);
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Todo App API is running' });
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { title, description, status, priority, color } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        description || null,
        status || 'todo',
        priority || 'low',
        color || '#e91e63'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { title, description, status, priority, color } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database schema
async function initDB() {
  if (!pool) {
    console.log('Skipping database initialization (PostgreSQL not configured)');
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        priority VARCHAR(20) DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
        color VARCHAR(7) DEFAULT '#e91e63',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on status for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);

  // Initialize database
  await initDB();
});