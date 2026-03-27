'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password', 10);
    await queryInterface.bulkInsert('Users', [{
      username: 'testuser',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    const users = await queryInterface.sequelize.query(
      `SELECT id from "Users";`
    );
    const userId = users[0][0].id;

    const categories = await queryInterface.sequelize.query(
      `SELECT id from "Categories";`
    );
    const todoId = categories[0][0].id;
    const inProgressId = categories[0][1].id;
    const doneId = categories[0][2].id;

    await queryInterface.bulkInsert('Tasks', [
      { title: 'Task 1', description: 'Description 1', priority: 'high', categoryId: todoId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 2', description: 'Description 2', priority: 'medium', categoryId: todoId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 3', description: 'Description 3', priority: 'low', categoryId: inProgressId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 4', description: 'Description 4', priority: 'high', categoryId: inProgressId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 5', description: 'Description 5', priority: 'medium', categoryId: doneId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 6', description: 'Description 6', priority: 'low', categoryId: doneId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 7', description: 'Description 7', priority: 'high', categoryId: todoId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 8', description: 'Description 8', priority: 'medium', categoryId: inProgressId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 9', description: 'Description 9', priority: 'low', categoryId: doneId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 10', description: 'Description 10', priority: 'high', categoryId: todoId, userId: userId, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
