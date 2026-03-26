const router = require("express").Router();
const { Task } = require("../models");
const withAuth = require("../middleware/auth");

// Get all tasks
router.get("/", withAuth, async (req, res) => {
  try {
    const taskData = await Task.findAll({
      where: {
        userId: req.session.userId,
      },
    });
    res.json(taskData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Create a task
router.post("/", withAuth, async (req, res) => {
  try {
    const newTask = await Task.create({
      ...req.body,
      userId: req.session.userId,
    });
    res.json(newTask);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update a task
router.put("/:id", withAuth, async (req, res) => {
  try {
    const updatedTask = await Task.update(req.body, {
      where: {
        id: req.params.id,
        userId: req.session.userId,
      },
    });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete a task
router.delete("/:id", withAuth, async (req, res) => {
  try {
    const deletedTask = await Task.destroy({
      where: {
        id: req.params.id,
        userId: req.session.userId,
      },
    });
    res.json(deletedTask);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
