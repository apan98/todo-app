const User = require("./User");
const Task = require("./Task");
const Category = require("./Category");

User.hasMany(Task, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

Task.belongsTo(User, {
  foreignKey: "user_id",
});

Category.hasMany(Task, {
  foreignKey: "category_id",
  onDelete: "CASCADE",
});

Task.belongsTo(Category, {
  foreignKey: "category_id",
});

module.exports = { User, Task, Category };
