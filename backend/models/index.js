const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model.js")(sequelize, Sequelize);
db.tasks = require("./task.model.js")(sequelize, Sequelize);
db.categories = require("./category.model.js")(sequelize, Sequelize);

db.users.hasMany(db.tasks);
db.tasks.belongsTo(db.users);

db.categories.hasMany(db.tasks);
db.tasks.belongsTo(db.categories);

module.exports = db;
