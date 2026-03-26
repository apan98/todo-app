'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Task, { foreignKey: 'categoryId', as: 'tasks' });
      Category.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Category.init({
    name: DataTypes.STRING,
    position: DataTypes.INTEGER,
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Category',
  });
  return Category;
};
