const db = require("../models");
const Task = db.tasks;
const Category = db.categories;
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;

const validatePriority = (priority) => {
    const validPriorities = ['low', 'medium', 'high'];
    return validPriorities.includes(priority);
};

// Create a Task
exports.create = async (req, res) => {
  if (!req.body.title || req.body.title.trim() === '') {
    return res.status(400).send({ message: "Title can not be empty!" });
  }

  if (req.body.priority && !validatePriority(req.body.priority)) {
    return res.status(400).send({ message: "Invalid priority value." });
  }
  
  const t = await sequelize.transaction();

  try {
    if (req.body.categoryId) {
        const category = await Category.findOne({ where: { id: req.body.categoryId, userId: req.userId }, transaction: t });
        if (!category) {
            await t.rollback();
            return res.status(400).send({ message: "Invalid categoryId." });
        }
    }

    const maxOrder = await Task.max('order', {
      where: { categoryId: req.body.categoryId, userId: req.userId },
      transaction: t
    });

    const task = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      deadline: req.body.deadline,
      categoryId: req.body.categoryId,
      userId: req.userId,
      order: (maxOrder === null) ? 0 : maxOrder + 1
    };
  
    const data = await Task.create(task, { transaction: t });
    await t.commit();
    res.status(201).send(data);
  } catch (err) {
    await t.rollback();
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Task."
    });
  }
};

const getPagination = (page, size) => {
  const limit = size ? +size : 100; // Return up to 100 tasks by default
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: tasks } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, tasks, totalPages, currentPage };
};

// Retrieve all Tasks from the database with pagination and filtering
exports.findAll = (req, res) => {
  const { page, size, title, priority } = req.query;
  let condition = { userId: req.userId };

  if (title) {
    condition.title = { [Op.iLike]: `%${title}%` };
  }
  if (priority) {
    // Basic validation for priority
    if (['low', 'medium', 'high'].includes(priority)) {
      condition.priority = priority;
    } else {
      return res.status(400).send({ message: "Invalid priority value for filtering." });
    }
  }

  const { limit, offset } = getPagination(page, size);

  Task.findAndCountAll({ where: condition, limit, offset, order: [['order', 'ASC']] })
    .then(data => {
      const response = getPagingData(data, page, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving tasks."
      });
    });
};

// Find a single Task with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Task.findOne({ where: { id: id, userId: req.userId } })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: `Cannot find Task with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving Task with id=" + id });
    });
};

// Update a Task by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  if (req.body.priority && !validatePriority(req.body.priority)) {
    return res.status(400).send({ message: "Invalid priority value." });
  }

  try {
    if (req.body.categoryId) {
        const category = await Category.findOne({ where: { id: req.body.categoryId, userId: req.userId } });
        if (!category) {
            return res.status(400).send({ message: "Invalid categoryId." });
        }
    }

    const [num] = await Task.update(req.body, {
      where: { id: id, userId: req.userId }
    });

    if (num == 1) {
      res.send({ message: "Task was updated successfully." });
    } else {
      res.status(404).send({
        message: `Cannot update Task with id=${id}. Maybe Task was not found or req.body is empty!`
      });
    }
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send({
      message: "Error updating Task with id=" + id
    });
  }
};

// Update task position (drag and drop)
exports.reorder = async (req, res) => {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).send({ message: "Invalid request body. 'tasks' array is required." });
    }

    const t = await db.sequelize.transaction();

    try {
        const taskIds = tasks.map(task => task.id);

        // Lock the tasks to be updated to prevent race conditions
        const tasksToUpdate = await Task.findAll({
            where: {
                id: { [Op.in]: taskIds },
                userId: req.userId,
            },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });

        if (tasksToUpdate.length !== taskIds.length) {
            await t.rollback();
            return res.status(404).send({ message: "One or more tasks not found or you do not have permission to update them." });
        }

        const updates = tasks.map(taskData =>
            Task.update(
                { order: taskData.order, categoryId: taskData.categoryId },
                { where: { id: taskData.id, userId: req.userId }, transaction: t }
            )
        );
        
        await Promise.all(updates);

        await t.commit();
        res.send({ message: "Tasks reordered successfully." });
    } catch (error) {
        await t.rollback();
        res.status(500).send({ message: error.message || "Error reordering tasks" });
    }
};

// Delete a Task with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const task = await Task.findOne({
      where: { id: id, userId: req.userId }
    });

    if (!task) {
      return res.status(404).send({
        message: `Cannot delete Task with id=${id}. Maybe Task was not found!`
      });
    }

    await task.destroy();
    res.send({ message: "Task was deleted successfully!" });

  } catch (err) {
    res.status(500).send({ message: "Could not delete Task with id=" + id });
  }
};