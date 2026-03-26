const asyncHandler = require("express-async-handler");
const db = require("../models");
const Task = db.tasks;
const Category = db.categories;
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;

const validatePriority = (priority) => {
    const validPriorities = ['low', 'medium', 'high'];
    return validPriorities.includes(priority);
};

const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// Create a Task
exports.create = [
  body('title').trim().notEmpty().withMessage('Title can not be empty!').customSanitizer(value => sanitizeHtml(value)),
  body('description').trim().customSanitizer(value => sanitizeHtml(value)),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.body.priority && !validatePriority(req.body.priority)) {
      return res.status(400).send({ message: "Invalid priority value." });
    }
    
    const t = await sequelize.transaction();

    try {
      if (req.body.categoryId) {
          const category = await Category.findOne({ where: { id: req.body.categoryId, userId: req.user.id }, transaction: t });
          if (!category) {
              await t.rollback();
              return res.status(400).send({ message: "Invalid categoryId." });
          }
      }

      const maxOrder = await Task.max('order', {
        where: { categoryId: req.body.categoryId, userId: req.user.id },
        transaction: t
      });

      const task = {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        deadline: req.body.deadline,
        categoryId: req.body.categoryId,
        userId: req.user.id,
        order: (maxOrder === null) ? 0 : maxOrder + 1
      };
    
      const data = await Task.create(task, { transaction: t });
      await t.commit();
      res.status(201).send(data);
    } catch (err) {
      await t.rollback();
      console.error('Error in create task:', err);
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
        return res.status(400).send({ message: err.message });
      }
      res.status(500).send({
        message: "Some error occurred while creating the Task."
      });
    }
  })
];

const getPagination = (page, size) => {
  const limit = size ? +size : 30;
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
exports.findAll = asyncHandler(async (req, res) => {
  const { page, size, title, priority } = req.query;
  let condition = { userId: req.user.id };

  if (title) {
    condition.title = { [Op.iLike]: `%${title}%` };
  }
  if (priority) {
    // Basic validation for priority
    if (['low', 'medium', 'high'].includes(priority)) {
      condition.priority = priority;
    } else {
      res.status(400);
      throw new Error("Invalid priority value for filtering.");
    }
  }

  const { limit, offset } = getPagination(page, size);

  const data = await Task.findAndCountAll({ where: condition, limit, offset, order: [['order', 'ASC']] });
  const response = getPagingData(data, page, limit);
  res.send(response);
});

// Find a single Task with an id
exports.findOne = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const data = await Task.findOne({ where: { id: id, userId: req.user.id } });
  if (data) {
    res.send(data);
  } else {
    res.status(404);
    throw new Error(`Cannot find Task with id=${id}.`);
  }
});

// Update a Task by the id in the request
exports.update = [
  body('title').optional().trim().customSanitizer(value => sanitizeHtml(value)),
  body('description').optional().trim().customSanitizer(value => sanitizeHtml(value)),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400);
      throw new Error(errors.array());
    }
    
    const id = req.params.id;

    if (req.body.priority && !validatePriority(req.body.priority)) {
      res.status(400);
      throw new Error("Invalid priority value.");
    }

    const t = await sequelize.transaction();

    try {
      const task = await Task.findOne({ where: { id: id, userId: req.user.id }, transaction: t });
      if (!task) {
        await t.rollback();
        res.status(404);
        throw new Error(`Cannot find Task with id=${id}.`);
      }

      const oldCategoryId = task.categoryId;
      const newCategoryId = req.body.categoryId;
      const newPosition = req.body.order;

      if (newCategoryId !== undefined && newPosition !== undefined) {
        // Logic for drag-and-drop reordering
        
        // 1. Decrement order for tasks in the old category
        await Task.update(
          { order: sequelize.literal('"order" - 1') },
          { 
            where: { 
              categoryId: oldCategoryId, 
              userId: req.user.id,
              order: { [Op.gt]: task.order }
            },
            transaction: t
          }
        );

        // 2. Increment order for tasks in the new category
        await Task.update(
          { order: sequelize.literal('"order" + 1') },
          { 
            where: { 
              categoryId: newCategoryId, 
              userId: req.user.id,
              order: { [Op.gte]: newPosition }
            },
            transaction: t
          }
        );
      }
      
      // 3. Update the task itself
      const [num] = await Task.update(req.body, {
        where: { id: id, userId: req.user.id },
        transaction: t
      });

      if (num == 1) {
        await t.commit();
        res.send({ message: "Task was updated successfully." });
      } else {
        await t.rollback();
        res.status(404);
        throw new Error(`Cannot update Task with id=${id}. Maybe Task was not found or req.body is empty!`);
      }
    } catch (err) {
      await t.rollback();
      res.status(500);
      throw new Error("Error updating Task with id=" + id);
    }
  })
];

// Update task order (drag and drop)
exports.updateOrder = asyncHandler(async (req, res) => {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
        res.status(400);
        throw new Error("Invalid request body. 'tasks' array is required.");
    }

    const t = await db.sequelize.transaction({
        isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
        if (tasks.length > 0) {
            const taskIds = tasks.map(task => task.id);

            // It's important to read the tasks within the serializable transaction
            // to establish a dependency on their state.
            const tasksToUpdate = await Task.findAll({
                where: {
                    id: { [Op.in]: taskIds },
                    userId: req.user.id,
                },
                transaction: t,
            });

            if (tasksToUpdate.length !== taskIds.length) {
                await t.rollback();
                res.status(404);
                throw new Error("One or more tasks not found or you do not have permission to update them.");
            }

            const updates = tasks.map(taskData =>
                Task.update(
                    { order: taskData.order, categoryId: taskData.categoryId },
                    { where: { id: taskData.id, userId: req.user.id }, transaction: t }
                )
            );
            
            await Promise.all(updates);
        }

        await t.commit();
        res.send({ message: "Tasks reordered successfully." });
    } catch (error) {
        if (t && !t.finished) { // Ensure rollback happens on any error
            await t.rollback();
        }
        res.status(500);
        throw new Error("Error reordering tasks");
    }
});

// Delete a Task with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const task = await Task.findOne({
    where: { id: id, userId: req.user.id }
  });

  if (!task) {
    res.status(404);
    throw new Error(`Cannot delete Task with id=${id}. Maybe Task was not found!`);
  }

  await task.destroy();
  res.send({ message: "Task was deleted successfully!" });
});