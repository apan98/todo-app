'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Categories', [
      { name: 'To Do', createdAt: new Date(), updatedAt: new Date() },
      { name: 'In Progress', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Done', createdAt: new Date(), updatedAt: new Date() },
    ]);

    const users = await queryInterface.sequelize.query(
      `SELECT id from "Users";`
    );
    const categories = await queryInterface.sequelize.query(
      `SELECT id from "Categories";`
    );

    const userRows = users[0];
    const categoryRows = categories[0];

    if (userRows.length > 0 && categoryRows.length > 0) {
      await queryInterface.bulkInsert('Tasks', [
        {
          title: 'Task 1',
          description: 'Description 1',
          priority: 'high',
          dueDate: new Date(),
          position: 0,
          userId: userRows[0].id,
          categoryId: categoryRows[0].id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Task 2',
          description: 'Description 2',
          priority: 'medium',
          dueDate: new Date(),
          position: 1,
          userId: userRows[0].id,
          categoryId: categoryRows[0].id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Task 3',
          description: 'Description 3',
          priority: 'low',
          dueDate: new Date(),
          position: 0,
          userId: userRows[0].id,
          categoryId: categoryRows[1].id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
  }
};