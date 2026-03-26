const db = require("../models");
const Task = db.tasks;
const Op = db.Sequelize.Op;

// Create a Task
exports.create = (req, res) => {
  if (!req.body.title) {
    return res.status(400).send({ message: "Title can not be empty!" });
  }

  const task = {
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    // Ensure deadline is in UTC
    deadline: req.body.deadline ? new Date(req.body.deadline) : null,
    categoryId: req.body.categoryId,
    userId: req.userId,
    position: req.body.position || 0,
  };

  Task.create(task)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      if (err instanceof db.Sequelize.ValidationError) {
        return res.status(400).send({ message: err.errors.map(e => e.message).join(', ') });
      }
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Task."
      });
    });
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

  Task.findAndCountAll({ where: condition, limit, offset, order: [['position', 'ASC']] })
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
  const { version } = req.body;

  if (version === undefined) {
      return res.status(400).send({ message: "Task version is required for update." });
  }

  try {
    const num = await db.sequelize.transaction(async (t) => {
      const task = await Task.findOne({
        where: { id: id, userId: req.userId },
        transaction: t
      });

      if (!task) {
        // We throw an error to be caught by the outer catch block
        throw new Error('TaskNotFound');
      }

      if (task.version !== version) {
        // Throw a specific error for optimistic lock failure
        throw new Error('Conflict');
      }
      
      // Increment version manually in the body
      const updateBody = { ...req.body, version: version + 1 };
      
      const [affectedRows] = await Task.update(updateBody, {
        where: { id: id, userId: req.userId, version: version },
        transaction: t
      });
      return affectedRows;
    });

    if (num == 1) {
      res.send({ message: "Task was updated successfully." });
    } else {
      // This case is unlikely if the transaction logic is correct
      res.status(404).send({
        message: `Cannot update Task with id=${id}. Maybe Task was not found or version is incorrect.`
      });
    }
  } catch (err) {
    if (err.message === 'TaskNotFound') {
        return res.status(404).send({ message: `Task with id=${id} not found.` });
    }
    if (err.message === 'Conflict') {
        return res.status(409).send({ message: "Update failed. The task has been modified by someone else. Please refresh and try again." });
    }
    if (err instanceof db.Sequelize.ValidationError) {
      return res.status(400).send({ message: err.errors.map(e => e.message).join(', ') });
    }
    res.status(500).send({
      message: "Error updating Task with id=" + id
    });
  }
};

// Update task position (drag and drop)
exports.updatePosition = async (req, res) => {
    const { draggableId, source, destination, version } = req.body;
    const taskId = draggableId;

    if (version === undefined) {
        return res.status(400).send({ message: "Task version is required for update." });
    }

    try {
        await db.sequelize.transaction(async (t) => {
            const task = await Task.findByPk(taskId, { transaction: t });

            if (!task) {
                throw new Error("Task not found");
            }

            if (task.userId !== req.userId) {
                throw new Error("Unauthorized");
            }
            
            if (task.version !== version) {
                throw new Error("Conflict: Task has been modified by another user. Please refresh.");
            }

            const sourceCategoryId = parseInt(source.droppableId, 10);
            const destCategoryId = parseInt(destination.droppableId, 10);
            const sourceIndex = source.index;
            const destIndex = destination.index;

            // Remove task from old position
            await Task.increment(
                { position: -1 },
                { where: { categoryId: sourceCategoryId, position: { [Op.gt]: sourceIndex } }, transaction: t }
            );

            // Add task to new position
            await Task.increment(
                { position: 1 },
                { where: { categoryId: destCategoryId, position: { [Op.gte]: destIndex } }, transaction: t }
            );

            // Update the task itself
            await task.update({
                categoryId: destCategoryId,
                position: destIndex,
                version: task.version + 1
            }, { transaction: t });
        });

        res.send({ message: "Task position updated successfully." });
    } catch (error) {
        if (error.message.startsWith("Conflict")) {
            return res.status(409).send({ message: error.message });
        }
        if (error.message === "Task not found") {
            return res.status(404).send({ message: error.message });
        }
        if (error.message === "Unauthorized") {
            return res.status(403).send({ message: "You are not authorized to modify this task." });
        }
        res.status(500).send({ message: error.message || "Error updating task position" });
    }
};

// Delete a Task with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Task.destroy({
    where: { id: id, userId: req.userId }
  })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Task was deleted successfully!" });
      } else {
        res.status(404).send({
          message: `Cannot delete Task with id=${id}. Maybe Task was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete Task with id=" + id });
    });
};