const { Task, Category } = require('../models');
const { Op } = require('sequelize');

exports.getTasks = async (req, res) => {
  try {
    const { priority, search } = req.query;
    const where = {};
    if (priority) {
      where.priority = priority;
    }
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    const tasks = await Task.findAll({ where, include: 'category' });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Task.update(req.body, { where: { id } });
    if (updated) {
      const updatedTask = await Task.findOne({ where: { id } });
      res.json(updatedTask);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.destroy({ where: { id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ include: 'tasks' });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
