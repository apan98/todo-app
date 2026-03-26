const { Category } = require("../models");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [
        ['position', 'ASC']
      ]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching categories." });
  }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const maxPosition = await Category.max('position');
        const newCategory = await Category.create({
            name,
            position: (maxPosition === null ? -1 : maxPosition) + 1
        });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    await category.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
