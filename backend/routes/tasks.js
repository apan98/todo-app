const express = require('express');
const router = express.Router();
const { Task } = require('../models');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const tasks = await Task.findAll({ where: { UserId: req.userId } });
  res.json(tasks);
});

router.post('/', async (req, res) => {
  const { title, description, priority, CategoryId } = req.body;
  const task = await Task.create({ title, description, priority, CategoryId, UserId: req.userId });
  res.status(201).json(task);
});

router.put('/:id', async (req, res) => {
  const { title, description, priority, CategoryId } = req.body;
  const task = await Task.findOne({ where: { id: req.params.id, UserId: req.userId } });
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  await task.update({ title, description, priority, CategoryId });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const task = await Task.findOne({ where: { id: req.params.id, UserId: req.userId } });
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  await task.destroy();
  res.status(204).send();
});

module.exports = router;
