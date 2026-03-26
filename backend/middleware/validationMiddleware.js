const { body, validationResult } = require("express-validator");

const validateTask = [
  body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority"),
  body("dueDate").optional().isISO8601().toDate().withMessage("Invalid due date"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateTask };
