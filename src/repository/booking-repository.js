const { StatusCodes } = require('http-status-codes');

const { Booking } = require('../models/index');
const { AppError, ValidationError } = require('../utils/errors/index');

class BookingRepository {
    async create(data, transaction) {
        try {
            const booking = await Booking.create(data, {transaction: transaction});
            return booking;
        } catch (error) {
            if(error.name == 'SequelizeValidationError') {
                throw new ValidationError(error);
            }
            throw new AppError(
                'RepositoryError', 
                'Cannot create Booking', 
                'There was some issue creating the booking, please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async update(bookingId, data, transaction = null) {
        try {
            const options = {};
            if (transaction) {
                options.transaction = transaction; // Attach transaction if provided
            }
    
            const booking = await Booking.findByPk(bookingId, options); // Use transaction in `findByPk`
            if (!booking) {
                throw new AppError(
                    'NotFoundError',
                    'Booking Not Found',
                    `Booking with ID ${bookingId} does not exist.`,
                    StatusCodes.NOT_FOUND
                );
            }
    
            if (data.status) {
                booking.status = data.status; // Update the status
            }
    
            await booking.save({ transaction }); // Save with transaction
            return booking;
        } catch (error) {
            throw new AppError(
                'RepositoryError',
                'Cannot Update Booking',
                'There was some issue updating the booking, please try again later.',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
    
}

module.exports = BookingRepository;