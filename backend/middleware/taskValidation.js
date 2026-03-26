const { body, validationResult } = require('express-validator');

exports.createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Title cannot be empty.'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority value.'),
  body('categoryId').notEmpty().withMessage('categoryId cannot be empty.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.updateTaskValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority value.'),
  body('categoryId').optional().notEmpty().withMessage('categoryId cannot be empty.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
