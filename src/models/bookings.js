import Booking from './schemas/bookings.js';

export async function getAllBookings() {
    return Booking.find().sort({ createdAt: -1 }).toArray();
}

export async function getBookingById(_id) {
    return Booking.findOne({ _id });
}

export async function createBooking(bookingData) {
    return Booking.create(bookingData);
}


