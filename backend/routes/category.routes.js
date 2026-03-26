const categories = require("../controllers/category.controller.js");

module.exports = function(app) {
  app.get("/api/categories", categories.findAll);
};
