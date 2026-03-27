
const { Task, Category } = require('../models');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.user.id } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTask = async (req, res) => {
  const { title, description, priority, categoryId } = req.body;
  try {
    const task = await Task.create({ title, description, priority, categoryId, userId: req.user.id });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, categoryId } = req.body;
  try {
    const task = await Task.findOne({ where: { id, userId: req.user.id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await task.update({ title, description, priority, categoryId });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOne({ where: { id, userId: req.user.id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await task.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getCategories };
