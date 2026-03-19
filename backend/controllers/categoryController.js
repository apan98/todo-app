const { Category } = require("../models");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
