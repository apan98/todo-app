
const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, getCategories } = require('../controllers/taskController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/tasks', auth, getTasks);
router.post('/tasks', auth, createTask);
router.put('/tasks/:id', auth, updateTask);
router.delete('/tasks/:id', auth, deleteTask);
router.get('/categories', auth, getCategories);

module.exports = router;
