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
}
