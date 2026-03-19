const { Task } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Task.findAndCountAll({
      where: { UserId: req.user.id },
      order: [
        ["CategoryId", "ASC"],
        ["position", "ASC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json({ tasks: rows, total: count, pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, CategoryId, ...updateData } = req.body;
    const userId = req.user.id;

    const task = await Task.findOne({ where: { id, UserId: userId } });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const wantsToMove = (position !== undefined && position !== task.position) || (CategoryId !== undefined && CategoryId !== task.CategoryId);

    if (wantsToMove) {
      await sequelize.transaction(async (t) => {
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
            // moving down
            await Task.update({ position: sequelize.literal("position - 1") }, {
              where: { UserId: userId, CategoryId: oldCategoryId, position: { [Op.gt]: oldPosition, [Op.lte]: newPosition } },
              transaction: t
            });
          } else {
            // moving up
            await Task.update({ position: sequelize.literal("position + 1") }, {
              where: { UserId: userId, CategoryId: oldCategoryId, position: { [Op.lt]: oldPosition, [Op.gte]: newPosition } },
              transaction: t
            });
          }
        }
        updateData.position = newPosition;
        updateData.CategoryId = newCategoryId;
        await task.update(updateData, { transaction: t });
      });
    } else {
      await task.update(updateData);
    }

    const updatedTask = await Task.findByPk(id);
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
        res.status(400).json({ error: error.message });
    }
};
