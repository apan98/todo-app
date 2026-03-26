'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'UserId', onDelete: 'CASCADE' });
      Task.belongsTo(models.Category, { foreignKey: 'CategoryId' });
    }
  }
  Task.init({
    title: {
        type: DataTypes.STRING,
        validate: {
            len: [1, 255]
        }
    },
    description: {
        type: DataTypes.TEXT,
        validate: {
            len: [0, 5000]
        }
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    },
    dueDate: DataTypes.DATE,
    position: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    CategoryId: DataTypes.INTEGER,
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