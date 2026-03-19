const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.put("/:id/position", taskController.updateTaskPosition);
router.delete("/:id", taskController.deleteTask);
router.post("/dnd/reorder", taskController.reorderTasks);

module.exports = router;
