'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'userId' });
      Task.belongsTo(models.Category, { foreignKey: 'categoryId' });
    }
  }
  Task.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    priority: DataTypes.ENUM('low', 'medium', 'high')
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};
