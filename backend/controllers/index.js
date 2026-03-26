const router = require("express").Router();

const userRoutes = require("./userRoutes");
const taskRoutes = require("./taskRoutes");
const categoryRoutes = require("./categoryRoutes");

router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/categories", categoryRoutes);

module.exports = router;
