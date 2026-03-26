'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
      Task.belongsTo(models.Category, { foreignKey: 'categoryId' });
    }
  }
  Task.init({
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
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
    deadline: DataTypes.DATE,
    order: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Task',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'categoryId', 'order']
      }
    ]
  });
  return Task;
};