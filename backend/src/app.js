const express = require("express");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const app = express();
const port = process.env.PORT || 3001;
const { sequelize } = require("../models");

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

const csrfProtection = csrf({ cookie: true });

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", require("../routes/auth.routes"));
app.use("/api/tasks", require("../routes/task.routes"));
app.use("/api/categories", require("../routes/category.routes"));

app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
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
