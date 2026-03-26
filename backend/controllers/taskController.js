const { Task, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, priority, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { UserId: req.user.id };

    if (priority && priority !== "all") {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause.title = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      order: [
        ["CategoryId", "ASC"],
        ["position", "ASC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ tasks: rows, total: count, pages: Math.ceil(count / limit) });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred on the server.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, CategoryId } = req.body;
    if (!title) {
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
      position: (maxPosition === null ? 0 : maxPosition) + 1
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
      });

      if (!task) {
        // This will cause the transaction to rollback
        throw new Error("Task not found or you do not have permission to edit it");
      }
      
      if (task.version !== version) {
        // Optimistic lock failed
        throw new Error("Conflict: Task has been updated by another user. Please refresh and try again.");
      }

      const wantsToMove = (position !== undefined && position !== task.position) || (CategoryId !== undefined && CategoryId !== task.CategoryId);

      if (wantsToMove) {
        const oldPosition = task.position;
        const oldCategoryId = task.CategoryId;
        const newPosition = position !== undefined ? position : task.position;
        const newCategoryId = CategoryId !== undefined ? CategoryId : task.CategoryId;

        if (oldCategoryId !== newCategoryId) {
          // Decrement positions in old category
          await Task.update({ position: sequelize.literal("position - 1") }, {
            where: { UserId: userId, CategoryId: oldCategoryId, position: { [Op.gt]: oldPosition } },
            transaction: t
          });
          // Increment positions in new category
          await Task.update({ position: sequelize.literal("position + 1") }, {
            where: { UserId: userId, CategoryId: newCategoryId, position: { [Op.gte]: newPosition } },
            transaction: t
          });
        } else {
          // Move within the same category
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

      // Increment version and save changes
      updateData.version = task.version + 1;
      
      const [updatedRows] = await Task.update(updateData, {
          where: { id, UserId: userId, version: version }, // Re-check version
          transaction: t
      });

      if (updatedRows === 0) {
          throw new Error("Conflict: Task has been updated by another user during the transaction. Please refresh and try again.");
      }

      // Re-fetch the task to return the latest state
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

exports.updateTaskPosition = async (req, res) => {
  // This endpoint is now effectively handled by updateTask.
  // We can consider this a redirect of logic.
  return exports.updateTask(req, res);
};

exports.reorderTasks = async (req, res) => {
    const { source, destination, draggableId } = req.body;
    const userId = req.user.id;

    if (!destination) {
        return res.status(400).json({ error: "Invalid destination" });
    }

    try {
        await sequelize.transaction(async (t) => {
            const task = await Task.findOne({ where: { id: draggableId, UserId: userId }, transaction: t });
            if (!task) {
                throw new Error("Task not found");
            }

            const oldCategoryId = source.droppableId;
            const newCategoryId = destination.droppableId;
            const oldPosition = source.index;
            const newPosition = destination.index;

            if (oldCategoryId === newCategoryId) {
                // Moving within the same category
                if (newPosition > oldPosition) {
                    await Task.update({ position: sequelize.literal('position - 1') }, {
                        where: {
                            UserId: userId,
                            CategoryId: oldCategoryId,
                            position: {
                                [Op.gt]: oldPosition,
                                [Op.lte]: newPosition,
                            },
                        },
                        transaction: t
                    });
                } else { // newPosition < oldPosition
                    await Task.update({ position: sequelize.literal('position + 1') }, {
                        where: {
                            UserId: userId,
                            CategoryId: oldCategoryId,
                            position: {
                                [Op.lt]: oldPosition,
                                [Op.gte]: newPosition,
                            },
                        },
                        transaction: t
                    });
                }
            } else {
                // Moving to a different category
                // Decrement positions in old category
                await Task.update({ position: sequelize.literal('position - 1') }, {
                    where: {
                        UserId: userId,
                        CategoryId: oldCategoryId,
                        position: { [Op.gt]: oldPosition },
                    },
                    transaction: t
                });

                // Increment positions in new category
                await Task.update({ position: sequelize.literal('position + 1') }, {
                    where: {
                        UserId: userId,
                        CategoryId: newCategoryId,
                        position: { [Op.gte]: newPosition },
                    },
                    transaction: t
                });
            }

            // Finally, update the moved task
            await task.update({
                CategoryId: newCategoryId,
                position: newPosition
            }, { transaction: t });
        });

        res.status(200).json({ message: "Tasks reordered successfully" });
    } catch (error) {
        console.error('Reorder Tasks Error:', error);
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
        // We throw an error to trigger the transaction rollback
        throw new Error("Task not found or you do not have permission to delete it");
      }

      const { CategoryId, position } = task;

      // Now, destroy the task
      await task.destroy({ transaction: t });

      // And then, update the positions of the remaining tasks
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
