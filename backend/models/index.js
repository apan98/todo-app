const User = require("./User");
const Task = require("./Task");
const Category = require("./Category");

User.hasMany(Task);
Task.belongsTo(User);

Category.hasMany(Task, { onDelete: "SET NULL", hooks: true });
Task.belongsTo(Category);

module.exports = { User, Task, Category };
