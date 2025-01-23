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
        try {
            const transaction = await db.sequelize.transaction();

            const flightId = data.flightId;

            const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestURL);

            const flightData = response.data.data;
            let flightOfThePrice = flightData.price;

            if(data.noOfSeats > flightData.totalSeats){
                throw ServiceError('Something went wrong in the booking process', 'Insufficient seats in the flight');
            }

            const totalCost = flightOfThePrice * data.noOfSeats;
            const bookingPayload = {...data, totalCost};
            const booking = await this.bookingRepository.create(bookingPayload, transaction);

            console.log("BOOKING",booking);

            const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            await axios.patch(updateFlightRequestURL, {totalSeats: flightData.totalSeats - booking.noOfSeats });
            const finalBooking = await this.bookingRepository.update(booking.id, {status: "Booked"}, transaction);

            await transaction.commit();
            return finalBooking;
        }
        catch(error){
            await transaction.rollback();
            if(error.name == 'RepositoryError' || error.name == 'ValidationError'){
                
                throw error;
            }
            throw new ServiceError();
        }
    }
}

module.exports = BookingService;