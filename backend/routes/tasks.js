const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateTask, handleValidationErrors } = require("../middleware/validationMiddleware");
 
 router.use(authMiddleware);
 
 router.get("/", taskController.getTasks);
 router.post("/", validateTask, handleValidationErrors, taskController.createTask);
 router.put("/order", taskController.updateTasksOrder);
 router.put("/:id", validateTask, handleValidationErrors, taskController.updateTask);
 router.delete("/:id", taskController.deleteTask);

module.exports = router;
