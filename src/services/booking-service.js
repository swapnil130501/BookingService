const axios = require('axios');
const { BookingRepository } = require('../repository/index');
const { FLIGHT_SERVICE_PATH } = require('../config/serverConfig');
const { ServiceError } = require('../utils/errors');
const db = require('../models/index');

class BookingService {
    constructor() {
        this.bookingRepository = new BookingRepository();
    }

    async createBooking(data) {
        let transaction;
        try {
            // Start a database transaction
            transaction = await db.sequelize.transaction();

            const flightId = data.flightId;

            // Fetch flight details
            const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestURL);

            const flightData = response.data.data;
            const flightPrice = flightData.price;

            // Check seat availability
            if (data.noOfSeats > flightData.totalSeats) {
                throw new ServiceError(
                    'Something went wrong in the booking process',
                    'Insufficient seats in the flight'
                );
            }

            // Calculate total cost
            const totalCost = flightPrice * data.noOfSeats;

            // Build booking payload
            const bookingPayload = {
                ...data,
                totalCost,
            };

            // Attempt to create the booking
            const booking = await this.bookingRepository.create(bookingPayload, transaction);

            console.log('BOOKING CREATED:', booking);

            // Update the available seats in the flight service
            const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            await axios.patch(updateFlightRequestURL, {
                totalSeats: flightData.totalSeats - booking.noOfSeats,
            });

            // Commit the transaction
            await transaction.commit();

            return booking;
        } catch (error) {
            // Roll back the transaction on error
            if (transaction) await transaction.rollback();

            // Handle database-level unique constraint violations
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new ServiceError(
                    'Duplicate Booking Error',
                    'The seat number you selected is already booked. Please choose a different seat.'
                );
            }

            // Re-throw repository or validation errors
            if (error.name === 'RepositoryError' || error.name === 'ValidationError') {
                throw error;
            }

            // Default error handler
            throw new ServiceError(
                'Booking Failed',
                'Something went wrong while processing your booking. Please try again later.'
            );
        }
    }
}

module.exports = BookingService;
