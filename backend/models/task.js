
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    priority: {
      type: DataTypes.ENUM,
      values: ['low', 'medium', 'high']
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  }, {});
  Task.associate = function(models) {
    Task.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  };
  return Task;
};
