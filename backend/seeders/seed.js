const sequelize = require("../config/config");
const { User, Task, Category } = require("../models");

const userData = require("./userData.json");
const categoryData = require("./categoryData.json");
const taskData = require("./taskData.json");

const seedDatabase = async () => {
  await sequelize.sync({ force: true });

  await User.bulkCreate(userData, {
    individualHooks: true,
    returning: true,
  });

  await Category.bulkCreate(categoryData);

  await Task.bulkCreate(taskData);

  process.exit(0);
};

seedDatabase();
