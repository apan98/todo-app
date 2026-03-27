const { Task, Category } = require("../models");

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, as: "category" }],
    });
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, categoryId } = req.body;
    const task = await Task.create({
      title,
      description,
      priority,
      categoryId,
      userId: req.user.id,
    });
    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, categoryId } = req.body;
    const task = await Task.findOne({
      where: { id, userId: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await task.update({ title, description, priority, categoryId });
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({
      where: { id, userId: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await task.destroy();
    res.status(204).json();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
