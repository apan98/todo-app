'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'UserId' }); // Corrected foreignKey
      Task.belongsTo(models.Category, { foreignKey: 'CategoryId' }); // Corrected foreignKey
    }
  }
  Task.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    },
    dueDate: DataTypes.DATE,
    position: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER, // Explicitly define foreign key
    CategoryId: DataTypes.INTEGER, // Explicitly define foreign key
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};