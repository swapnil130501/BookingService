'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        // Step 1: Add the `seatNo` column with allowNull: true initially
        await queryInterface.addColumn('Bookings', 'seatNo', {
            type: Sequelize.INTEGER,
            allowNull: true, // Temporarily allow null values
        });

        // Step 2: If needed, populate `seatNo` for existing rows (skip if not required)
        // Example: await queryInterface.sequelize.query('UPDATE "Bookings" SET "seatNo" = 1 WHERE "seatNo" IS NULL');

        // Step 3: Add unique constraint for `seatNo` and `flightId`
        await queryInterface.addConstraint('Bookings', {
            fields: ['seatNo', 'flightId'],
            type: 'unique',
            name: 'unique_seat_per_flight',
        });

        // Step 4: Change `seatNo` to `allowNull: false` after constraint is applied
        await queryInterface.changeColumn('Bookings', 'seatNo', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },

    async down (queryInterface, Sequelize) {    
        await queryInterface.removeConstraint('Bookings', 'unique_seat_per_flight');
        await queryInterface.removeColumn('Bookings', 'seatNo');
    }
};
