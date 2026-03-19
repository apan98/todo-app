const { Task } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

exports.getTasks = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query; // Default limit high to not break UI if it doesn't send params
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
    res.json({ tasks: rows, total: count });
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

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const task = await Task.findOne({ where: { id, UserId: userId } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    await sequelize.transaction(async (t) => {
      const { CategoryId, position } = task;
      await task.destroy({ transaction: t });
      await Task.update({ position: sequelize.literal("position - 1") }, {
        where: {
          UserId: userId,
          CategoryId,
          position: { [Op.gt]: position }
        },
        transaction: t
      });
    });

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
