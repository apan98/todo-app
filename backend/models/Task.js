'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'userId' });
      Task.belongsTo(models.Category, { foreignKey: 'categoryId' });
    }
  }
  Task.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    priority: DataTypes.ENUM('low', 'medium', 'high'),
    dueDate: DataTypes.DATE,
    position: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};