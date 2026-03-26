const { User, Category, Task } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    // Clear existing data
    await Task.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create a user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      username: 'testuser',
      password: hashedPassword,
    });

    // Create categories
    const categories = await Category.bulkCreate([
      { title: 'To Do', userId: user.id },
      { title: 'In Progress', userId: user.id },
      { title: 'Done', userId: user.id },
    ]);

    const todoCategory = categories.find(c => c.title === 'To Do');
    const inProgressCategory = categories.find(c => c.title === 'In Progress');
    const doneCategory = categories.find(c => c.title === 'Done');

    // Create tasks
    await Task.bulkCreate([
      // To Do
      { title: 'Set up project structure', categoryId: todoCategory.id, priority: 'high', position: 0 },
      { title: 'Design database schema', categoryId: todoCategory.id, priority: 'high', position: 1 },
      { title: 'Implement user authentication', categoryId: todoCategory.id, priority: 'medium', position: 2 },
      { title: 'Develop frontend components', categoryId: todoCategory.id, priority: 'low', position: 3 },

      // In Progress
      { title: 'Build REST API for tasks', categoryId: inProgressCategory.id, priority: 'high', position: 0 },
      { title: 'Integrate frontend with backend', categoryId: inProgressCategory.id, priority: 'medium', position: 1 },
      { title: 'Set up drag-and-drop functionality', categoryId: inProgressCategory.id, priority: 'high', position: 2 },

      // Done
      { title: 'Initialize project repository', categoryId: doneCategory.id, priority: 'low', position: 0 },
      { title: 'Configure Docker environment', categoryId: doneCategory.id, priority: 'medium', position: 1 },
      { title: 'Write project README', categoryId: doneCategory.id, priority: 'low', position: 2 },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
};

seed();
