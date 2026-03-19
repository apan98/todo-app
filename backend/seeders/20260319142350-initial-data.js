'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      { name: 'Сделать', createdAt: new Date(), updatedAt: new Date() },
      { name: 'В процессе', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Готово', createdAt: new Date(), updatedAt: new Date() },
    ], {});

    const categories = await queryInterface.sequelize.query(
      `SELECT id from "Categories";`
    );
    const categoryRows = categories[0];

    await queryInterface.bulkInsert('Tasks', [
      { title: 'Task 1', categoryId: categoryRows[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 2', categoryId: categoryRows[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 3', categoryId: categoryRows[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 4', categoryId: categoryRows[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 5', categoryId: categoryRows[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 6', categoryId: categoryRows[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 7', categoryId: categoryRows[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 8', categoryId: categoryRows[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 9', categoryId: categoryRows[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Task 10', categoryId: categoryRows[0].id, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
  }
};