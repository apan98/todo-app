const { Task, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getTasks = async (req, res) => {
  try {
    const { priority, search } = req.query;
    const whereClause = { UserId: req.user.id };

    if (priority && priority !== "all") {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause.title = { [Op.iLike]: `%${search}%` };
    }

    const tasks = await Task.findAll({
      where: whereClause,
      order: [
        ["CategoryId", "ASC"],
        ["position", "ASC"],
      ],
    });
    res.json({ tasks });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred on the server.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, CategoryId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const maxPosition = await Task.max("position", { where: { CategoryId, UserId: req.user.id }});
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      CategoryId,
      UserId: req.user.id,
      position: (maxPosition === null ? -1 : maxPosition) + 1,
      version: 0
    });
    res.status(201).json(task);
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Invalid CategoryId. The specified category does not exist.' });
    }
    console.error('Create Task Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred on the server.' });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { position, CategoryId, version, ...updateData } = req.body;
  const userId = req.user.id;

  if (version === undefined) {
    return res.status(400).json({ error: "Task version is required for updates." });
  }

  try {
    const result = await sequelize.transaction(async (t) => {
      const task = await Task.findOne({
        where: { id, UserId: userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found or you do not have permission to edit it" });
      }
      
      if (task.version !== version) {
        return res.status(409).json({ error: "Conflict: Task has been updated by another user. Please refresh and try again." });
      }

      const wantsToMove = (position !== undefined && position !== task.position) || (CategoryId !== undefined && CategoryId !== task.CategoryId);

      if (wantsToMove) {
        const oldPosition = task.position;
        const oldCategoryId = task.CategoryId;
        const newPosition = position !== undefined ? position : task.position;
        const newCategoryId = CategoryId !== undefined ? CategoryId : task.CategoryId;

        if (oldCategoryId !== newCategoryId) {
          await Task.update({ position: sequelize.literal("position - 1") }, {
            where: { UserId: userId, CategoryId: oldCategoryId, position: { [Op.gt]: oldPosition } },
            transaction: t
          });
          await Task.update({ position: sequelize.literal("position + 1") }, {
            where: { UserId: userId, CategoryId: newCategoryId, position: { [Op.gte]: newPosition } },
            transaction: t
          });
        } else {
          if (newPosition > oldPosition) {
            await Task.update({ position: sequelize.literal("position - 1") }, {
              where: { UserId: userId, CategoryId: oldCategoryId, position: { [Op.gt]: oldPosition, [Op.lte]: newPosition } },
              transaction: t
            });
          } else {
            await Task.update({ position: sequelize.literal("position + 1") }, {
              where: { UserId: userId, CategoryId: oldCategoryId, position: { [Op.lt]: oldPosition, [Op.gte]: newPosition } },
              transaction: t
            });
          }
        }
        updateData.position = newPosition;
        updateData.CategoryId = newCategoryId;
      }

      updateData.version = task.version + 1;
      
      const [updatedRows] = await Task.update(updateData, {
          where: { id, UserId: userId, version: version },
          transaction: t
      });

      if (updatedRows === 0) {
          throw new Error("Conflict: Task has been updated by another user during the transaction. Please refresh and try again.");
      }

      const updatedTask = await Task.findByPk(id, { transaction: t });
      return updatedTask;
    });

    res.json(result);

  } catch (error) {
    if (error.message.startsWith("Conflict")) {
        res.status(409).json({ error: error.message });
    } else if (error.message.startsWith("Task not found")) {
        res.status(404).json({ error: error.message });
    } else if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Invalid CategoryId. The specified category does not exist.' });
    } else {
        console.error('Update Task Error:', error);
        res.status(500).json({ error: 'An unexpected error occurred on the server.' });
    }
  }
};

exports.updateTasksOrder = async (req, res) => {
    const { tasks } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "Invalid request body. Expected an array of tasks." });
    }

    const taskIds = tasks.map(t => t.id);
    const uniqueTaskIds = new Set(taskIds);

    if (taskIds.length !== uniqueTaskIds.size) {
        return res.status(400).json({ error: "Invalid request. Duplicate task IDs found in the request." });
    }

    try {
        await sequelize.transaction(async (t) => {
            for (const task of tasks) {
                await Task.update(
                    { 
                        position: task.position,
                        CategoryId: task.CategoryId,
                        version: sequelize.literal('version + 1')
                    },
                    { 
                        where: { id: task.id, UserId: userId },
                        transaction: t 
                    }
                );
            }
        });
        res.status(200).json({ message: "Tasks order updated successfully" });
    } catch (error) {
        console.error('Update Tasks Order Error:', error);
        res.status(500).json({ error: 'An unexpected error occurred on the server.' });
    }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await sequelize.transaction(async (t) => {
      const task = await Task.findOne({
        where: { id, UserId: userId },
        transaction: t,
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found or you do not have permission to delete it" });
      }

      const { CategoryId, position } = task;

      await task.destroy({ transaction: t });

      await Task.update(
        { position: sequelize.literal("position - 1") },
        {
          where: {
            UserId: userId,
            CategoryId: CategoryId,
            position: { [Op.gt]: position },
          },
          transaction: t,
        }
      );
    });

    res.status(204).send();
  } catch (error) {
    if (error.message.startsWith("Task not found")) {
        return res.status(404).json({ error: error.message });
    }
    console.error('Delete Task Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred on the server.' });
  }
};
