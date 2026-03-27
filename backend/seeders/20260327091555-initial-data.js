'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Categories
    const categories = await queryInterface.bulkInsert('Categories', [
      { name: 'Сделать', createdAt: new Date(), updatedAt: new Date() },
      { name: 'В процессе', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Готово', createdAt: new Date(), updatedAt: new Date() },
    ], { returning: true });

    // Create a User
    const users = await queryInterface.bulkInsert('Users', [
      { username: 'testuser', password: 'password', createdAt: new Date(), updatedAt: new Date() },
    ], { returning: true });

    // Create Tasks
    await queryInterface.bulkInsert('Tasks', [
      { title: 'Task 1', description: 'Description 1', priority: 'low', UserId: users[0].id, CategoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 2', description: 'Description 2', priority: 'medium', UserId: users[0].id, CategoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 3', description: 'Description 3', priority: 'high', UserId: users[0].id, CategoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 4', description: 'Description 4', priority: 'low', UserId: users[0].id, CategoryId: categories[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 5', description: 'Description 5', priority: 'medium', UserId: users[0].id, CategoryId: categories[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 6', description: 'Description 6', priority: 'high', UserId: users[0].id, CategoryId: categories[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 7', description: 'Description 7', priority: 'low', UserId: users[0].id, CategoryId: categories[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 8', description: 'Description 8', priority: 'medium', UserId: users[0].id, CategoryId: categories[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 9', description: 'Description 9', priority: 'high', UserId: users[0].id, CategoryId: categories[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 10', description: 'Description 10', priority: 'low', UserId: users[0].id, CategoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
