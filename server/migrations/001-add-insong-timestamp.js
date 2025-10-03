'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('comments', 'inSongTimestamp', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Timestamp in seconds when user clicked comment button while listening to the song'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('comments', 'inSongTimestamp');
  }
};
