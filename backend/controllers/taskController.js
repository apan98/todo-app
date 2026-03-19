const { Task } = require("../models");

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { UserId: req.user.id } });
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, CategoryId } = req.body;
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      CategoryId,
      UserId: req.user.id,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, CategoryId } = req.body;
    const task = await Task.findOne({ where: { id, UserId: req.user.id } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await task.update({ title, description, priority, dueDate, CategoryId });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ where: { id, UserId: req.user.id } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    await task.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
