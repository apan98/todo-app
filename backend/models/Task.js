const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Task = sequelize.define(
  "Task",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Title cannot be empty",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium",
    },
    dueDate: {
      type: DataTypes.DATE,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["UserId", "CategoryId", "position"],
        name: "user_category_position_unique_idx",
      },
    ],
  }
);

module.exports = Task;

