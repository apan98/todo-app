'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Seed Categories
      await queryInterface.bulkInsert('Categories', [
        { name: 'To Do', createdAt: new Date(), updatedAt: new Date() },
        { name: 'In Progress', createdAt: new Date(), updatedAt: new Date() },
        { name: 'Done', createdAt: new Date(), updatedAt: new Date() },
      ], { transaction });

      // Get all users and categories
      const users = await queryInterface.sequelize.query('SELECT id from "Users";', { transaction });
      const categories = await queryInterface.sequelize.query('SELECT id from "Categories";', { transaction });

      const userRows = users[0];
      const categoryRows = categories[0];

      // Check if there are any users and categories to seed tasks for
      if (userRows.length > 0 && categoryRows.length > 0) {
        const tasks = [];
        // Create a set of seed tasks for each user
        userRows.forEach(user => {
          tasks.push(
            {
              title: 'Welcome! This is your first task.',
              description: 'You can edit or delete this task.',
              priority: 'high',
              dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
              position: 0,
              UserId: user.id,
              CategoryId: categoryRows[0].id, // To Do
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'Drag and drop me to another column',
              description: 'Organize your workflow easily.',
              priority: 'medium',
              dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
              position: 1,
              UserId: user.id,
              CategoryId: categoryRows[0].id, // To Do
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'This task is in progress',
              description: 'Click me to see details.',
              priority: 'low',
              dueDate: new Date(),
              position: 0,
              UserId: user.id,
              CategoryId: categoryRows[1].id, // In Progress
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'Set a due date',
              description: 'Overdue tasks will be highlighted in red.',
              priority: 'high',
              dueDate: new Date(new Date().setDate(new Date().getDate() - 1)), // Overdue
              position: 2,
              UserId: user.id,
              CategoryId: categoryRows[0].id, // To Do
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'Use filters to find tasks',
              description: 'Filter by priority or search by title.',
              priority: 'medium',
              dueDate: null,
              position: 1,
              UserId: user.id,
              CategoryId: categoryRows[1].id, // In Progress
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'This is a completed task',
              description: 'Good job!',
              priority: 'low',
              dueDate: null,
              position: 0,
              UserId: user.id,
              CategoryId: categoryRows[2].id, // Done
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
             {
              title: 'Create a new task',
              description: 'Click the "+" button in any column.',
              priority: 'high',
              dueDate: null,
              position: 3,
              UserId: user.id,
              CategoryId: categoryRows[0].id, // To Do
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'Check out the priority indicators',
              description: 'Red for high, yellow for medium, green for low.',
              priority: 'medium',
              dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
              position: 4,
              UserId: user.id,
              CategoryId: categoryRows[0].id, // To Do
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
             {
              title: 'Mobile-friendly design',
              description: 'Try this app on your phone!',
              priority: 'low',
              dueDate: null,
              position: 2,
              UserId: user.id,
              CategoryId: categoryRows[1].id, // In Progress
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            },
            {
              title: 'Completed another one!',
              description: 'Keep up the momentum.',
              priority: 'medium',
              dueDate: new Date(new Date().setDate(new Date().getDate() - 10)),
              position: 1,
              UserId: user.id,
              CategoryId: categoryRows[2].id, // Done
              createdAt: new Date(),
              updatedAt: new Date(),
              version: 0
            }
          );
        });
        
        if (tasks.length > 0) {
          await queryInterface.bulkInsert('Tasks', tasks, { transaction });
        }
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('Tasks', null, { transaction });
      await queryInterface.bulkDelete('Categories', null, { transaction });
      // Note: We are not deleting users here to avoid data loss in development.
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};