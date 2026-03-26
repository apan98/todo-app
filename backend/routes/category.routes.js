const categories = require("../controllers/category.controller.js");
const { authJwt } = require("../middleware");

module.exports = function(app) {
  app.get("/api/categories", [authJwt.verifyToken], categories.findAll);
  app.delete("/api/categories/:id", [authJwt.verifyToken], categories.delete);
};
