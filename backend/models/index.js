const User = require("./User");
const Task = require("./Task");
const Category = require("./Category");

User.hasMany(Task);
Task.belongsTo(User);

Category.hasMany(Task);
Task.belongsTo(Category);

module.exports = { User, Task, Category };
