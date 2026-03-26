'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Task, { foreignKey: 'CategoryId', onDelete: 'CASCADE' });
    }
  }
  Category.init({
    name: DataTypes.STRING,
    position: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Category',
  });
  return Category;
};
