const Task = require('../models/task');

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, assignedTo } = req.body;
    const task = new Task({ title, description, status, assignedTo, createdBy: req.userId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.userId }).populate('assignedTo', 'username');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.userId }).populate('assignedTo', 'username');
    if (!task) {
      return res.status(404).send('Task not found');
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, assignedTo } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { title, description, status, assignedTo },
      { new: true }
    ).populate('assignedTo', 'username');
    if (!task) {
      return res.status(404).send('Task not found');
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!task) {
      return res.status(404).send('Task not found');
    }
    res.status(200).send('Task deleted successfully');
  } catch (error) {
    res.status(400).send(error.message);
  }
};