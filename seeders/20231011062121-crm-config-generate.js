"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "crm_configs",
      [
        {
          ref_type: "extension",
          ref_id: "e3aa892ea45593372eabd48ffee39986",
          name: "HUBSPOT",
          config: JSON.stringify({
            accessToken: "test-key",
            portalId: 43891100,
          }),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
