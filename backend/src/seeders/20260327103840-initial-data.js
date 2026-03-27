'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = await queryInterface.bulkInsert('Categories', [
      { name: 'Сделать', createdAt: new Date(), updatedAt: new Date() },
      { name: 'В процессе', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Готово', createdAt: new Date(), updatedAt: new Date() },
    ], { returning: true });

    await queryInterface.bulkInsert('Tasks', [
      { title: 'Задача 1', description: 'Описание 1', priority: 'low', categoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 2', description: 'Описание 2', priority: 'medium', categoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 3', description: 'Описание 3', priority: 'high', categoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 4', description: 'Описание 4', priority: 'low', categoryId: categories[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 5', description: 'Описание 5', priority: 'medium', categoryId: categories[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 6', description: 'Описание 6', priority: 'high', categoryId: categories[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 7', description: 'Описание 7', priority: 'low', categoryId: categories[2].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 8', description: 'Описание 8', priority: 'medium', categoryId: categories[0].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 9', description: 'Описание 9', priority: 'high', categoryId: categories[1].id, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Задача 10', description: 'Описание 10', priority: 'low', categoryId: categories[2].id, createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
