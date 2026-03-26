const db = require("../models");
const Category = db.categories;
const Task = db.tasks;

exports.findAll = (req, res) => {
  Category.findAll({
    where: { userId: req.userId },
    include: [{
      model: Task,
      as: 'tasks',
      required: false
    }],
    order: [
      ['position', 'ASC'],
      [{ model: Task, as: 'tasks' }, 'position', 'ASC']
    ]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving categories."
      });
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;

  Task.count({ where: { CategoryId: id } })
    .then(count => {
      if (count > 0) {
        res.status(409).send({
          message: "Cannot delete category with associated tasks."
        });
      } else {
        Category.destroy({
          where: { id: id }
        })
          .then(num => {
            if (num == 1) {
              res.send({
                message: "Category was deleted successfully!"
              });
            } else {
              res.send({
                message: `Cannot delete Category with id=${id}. Maybe Category was not found!`
              });
            }
          })
          .catch(err => {
            res.status(500).send({
              message: "Could not delete Category with id=" + id
            });
          });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error checking for tasks in category with id=" + id
      });
    });
};
