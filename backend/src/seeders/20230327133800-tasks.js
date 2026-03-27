'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Tasks', [
      { title: 'Task 1', description: 'Description 1', priority: 'low', categoryId: 1, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 2', description: 'Description 2', priority: 'medium', categoryId: 1, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 3', description: 'Description 3', priority: 'high', categoryId: 1, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 4', description: 'Description 4', priority: 'low', categoryId: 2, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 5', description: 'Description 5', priority: 'medium', categoryId: 2, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 6', description: 'Description 6', priority: 'high', categoryId: 2, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 7', description: 'Description 7', priority: 'low', categoryId: 3, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 8', description: 'Description 8', priority: 'medium', categoryId: 3, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 9', description: 'Description 9', priority: 'high', categoryId: 3, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 10', description: 'Description 10', priority: 'low', categoryId: 1, userId: 1, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tasks', null, {});
  }
};
