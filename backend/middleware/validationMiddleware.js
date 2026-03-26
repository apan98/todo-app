import { body, validationResult } = require('express-validator');

exports.validateTask = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('DueDate must be a valid date'),
  body('CategoryId')
    .notEmpty()
    .withMessage('CategoryId is required')
    .isInt()
    .withMessage('CategoryId must be an integer'),
  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isInt()
    .withMessage('Position must be an integer'),
];

exports.validateCategory = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be between 1 and 50 characters'),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
