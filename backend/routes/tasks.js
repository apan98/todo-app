const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateTask, handleValidationErrors } = require("../middleware/validationMiddleware");
 
 router.use(authMiddleware);
 
 router.get("/", taskController.getTasks);
 router.post("/", validateTask, handleValidationErrors, taskController.createTask);
 router.put("/:id", validateTask, handleValidationErrors, taskController.updateTask);
 router.put("/:id/position", taskController.updateTaskPosition);
 router.delete("/:id", taskController.deleteTask);
 router.post("/dnd/reorder", taskController.reorderTasks);

module.exports = router;
