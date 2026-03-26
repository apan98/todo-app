module.exports = (sequelize, Sequelize) => {
  const Task = sequelize.define("tasks", {
    title: {
      type: Sequelize.STRING
    },
    description: {
      type: Sequelize.STRING
    },
    priority: {
      type: Sequelize.STRING
    },
    deadline: {
      type: Sequelize.DATE
    }
  });

  return Task;
};
