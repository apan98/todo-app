const db = require("../models");
const Task = db.tasks;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
  // Validate request
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Task
  const task = {
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    deadline: req.body.deadline,
    categoryId: req.body.categoryId,
    userId: req.userId
  };

  // Save Task in the database
  Task.create(task)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Task."
      });
    });
};

exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.iLike]: `%${title}%` } } : null;

  Task.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tasks."
      });
    });
};

exports.findOne = (req, res) => {
  const id = req.params.id;

  Task.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Task with id=" + id
      });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body.title) {
    return res.status(400).send({
      message: "Title can not be empty!"
    });
  }

  Task.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Task was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Task with id=${id}. Maybe Task was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Task with id=" + id
      });
    });
};

exports.updatePosition = async (req, res) => {
  const { source, destination, draggableId } = req.body;
  const taskId = draggableId;

  try {
    await db.sequelize.transaction(async (t) => {
      const task = await Task.findByPk(taskId, { transaction: t });
      if (!task) {
        throw new Error("Task not found");
      }

      const sourceCategoryId = source.droppableId;
      const destCategoryId = destination.droppableId;
      const sourceIndex = source.index;
      const destIndex = destination.index;

      // Moving within the same category
      if (sourceCategoryId === destCategoryId) {
        const tasksToUpdate = await Task.findAll({
          where: {
            categoryId: sourceCategoryId,
            id: { [Op.ne]: taskId }
          },
          order: [['position', 'ASC']],
          transaction: t
        });

        const tasks = tasksToUpdate;
        tasks.splice(sourceIndex, 0, task);
        
        const [removed] = tasks.splice(sourceIndex, 1);
        tasks.splice(destIndex, 0, removed);


        for (let i = 0; i < tasks.length; i++) {
          await Task.update({ position: i }, { where: { id: tasks[i].id }, transaction: t });
        }

      } else { // Moving to a different category
        // Remove from source category and update positions
        const sourceTasks = await Task.findAll({
          where: {
            categoryId: sourceCategoryId,
          },
          order: [['position', 'ASC']],
          transaction: t
        });

        sourceTasks.splice(sourceIndex, 1);

        for (let i = 0; i < sourceTasks.length; i++) {
          await Task.update({ position: i }, { where: { id: sourceTasks[i].id }, transaction: t });
        }

        // Add to destination category and update positions
        const destTasks = await Task.findAll({
          where: {
            categoryId: destCategoryId,
          },
          order: [['position', 'ASC']],
          transaction: t
        });

        destTasks.splice(destIndex, 0, task);

        for (let i = 0; i < destTasks.length; i++) {
          await Task.update({ categoryId: destCategoryId, position: i }, { where: { id: destTasks[i].id }, transaction: t });
        }
        await task.update({ categoryId: destCategoryId, position: destIndex }, { transaction: t });
      }
    });

    res.send({ message: "Task position updated successfully." });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error updating task position" });
  }
};


exports.delete = (req, res) => {
  const id = req.params.id;

  Task.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Task was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Task with id=${id}. Maybe Task was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Task with id=" + id
      });
    });
};
