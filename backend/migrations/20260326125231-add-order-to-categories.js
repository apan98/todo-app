'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Categories', 'order', {
      type: Sequelize.INTEGER
    });

    // Set initial positions for existing categories
    const categories = await queryInterface.sequelize.query(
      `SELECT id FROM "Categories" ORDER BY "createdAt" ASC;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (let i = 0; i < categories.length; i++) {
      await queryInterface.sequelize.query(
        `UPDATE "Categories" SET "order" = ${i} WHERE id = ${categories[i].id};`
      );
    }

    // Now, make the column NOT NULL
    await queryInterface.changeColumn('Categories', 'order', {
        type: Sequelize.INTEGER,
        allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Categories', 'order');
  }
};
