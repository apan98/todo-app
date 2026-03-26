require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

const express = require("express");
const cors = require("cors");
const db = require("./models");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to todo application." });
});

// routes
require('./routes/auth.routes')(app);
require('./routes/task.routes')(app);
require('./routes/category.routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

const Category = db.categories;

db.sequelize.sync({ force: true }).then(() => {
    console.log("Drop and re-sync db.");
    initial();
});

function initial() {
    Category.create({
        id: 1,
        title: "To Do"
    });
    Category.create({
        id: 2,
        title: "In Progress"
    });
    Category.create({
        id: 3,
        title: "Done"
    });

    const Task = db.tasks;
    Task.create({ title: 'Task 1', description: 'Description 1', priority: 'low', categoryId: 1 });
    Task.create({ title: 'Task 2', description: 'Description 2', priority: 'medium', categoryId: 1 });
    Task.create({ title: 'Task 3', description: 'Description 3', priority: 'high', categoryId: 1 });
    Task.create({ title: 'Task 4', description: 'Description 4', priority: 'low', categoryId: 2 });
    Task.create({ title: 'Task 5', description: 'Description 5', priority: 'medium', categoryId: 2 });
    Task.create({ title: 'Task 6', description: 'Description 6', priority: 'high', categoryId: 2 });
    Task.create({ title: 'Task 7', description: 'Description 7', priority: 'low', categoryId: 3 });
    Task.create({ title: 'Task 8', description: 'Description 8', priority: 'medium', categoryId: 3 });
    Task.create({ title: 'Task 9', description: 'Description 9', priority: 'high', categoryId: 3 });
    Task.create({ title: 'Task 10', description: 'Description 10', priority: 'low', categoryId: 3 });
}
