'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Categories', [
      { name: 'Сделать', createdAt: new Date(), updatedAt: new Date() },
      { name: 'В процессе', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Готово', createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
