const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;
const { sequelize } = require("../models");
const csrfProtection = require('../middleware/csrfMiddleware');

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

const corsOptions = {
  origin: 'http://localhost:3000', // Allow only the frontend to connect
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// CSRF token endpoint should be before routes that need protection
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use("/api/auth", require("../routes/auth.routes"));

// Apply CSRF protection to all state-changing routes
app.use("/api/tasks", csrfProtection, require("../routes/task.routes"));
app.use("/api/categories", csrfProtection, require("../routes/category.routes"));


app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Error handling for CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ message: 'Invalid CSRF token' });
  } else {
    next(err);
  }
});


const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    app.listen(port, () => {
      console.log(`Backend listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

start();
