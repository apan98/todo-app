const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middleware/authMiddleware");
const csrfProtection = require("../middleware/csrfMiddleware");
const { validateCategory, handleValidationErrors } = require("../middleware/validationMiddleware");

router.use(authMiddleware);

router.get("/", categoryController.getCategories);

router.use(csrfProtection);
router.post("/", validateCategory, handleValidationErrors, categoryController.createCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
