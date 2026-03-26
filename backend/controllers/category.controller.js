const db = require("../models");
const Category = db.categories;
const Task = db.tasks;

exports.findAll = (req, res) => {
  Category.findAll({
    include: [{
      model: Task,
      as: 'tasks'
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
