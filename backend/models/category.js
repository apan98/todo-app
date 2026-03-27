
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    name: DataTypes.STRING
  }, {});
  Category.associate = function(models) {
    Category.hasMany(models.Task, {
      foreignKey: 'categoryId',
      as: 'tasks',
    });
  };
  return Category;
};
