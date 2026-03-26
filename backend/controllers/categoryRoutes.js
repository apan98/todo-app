const router = require("express").Router();
const { Category } = require("../models");
const withAuth = require("../middleware/auth");

// Get all categories
router.get("/", withAuth, async (req, res) => {
  try {
    const categoryData = await Category.findAll();
    res.json(categoryData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
