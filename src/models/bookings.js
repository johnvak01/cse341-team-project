import Booking from './schemas/bookings.js';
import mongoose from 'mongoose';
// import MONGODB_URI from '../config.js';

export async function getAllBookings() {
    // console.log(Booking);
    // await mongoose.connect(process.env.MONGODB_URI+"/"+process.env.MONGODB_DB_NAME);
    // console.log("Currently connected to DB:", mongoose.connection.name); 
    return Booking.find();
}

export async function getBookingById(_id) {
    // await mongoose.connect(process.env.MONGODB_URI+"/"+process.env.MONGODB_DB_NAME);
    return Booking.findOne({ _id });
}

export async function createBooking(bookingData) {
    // await mongoose.connect(process.env.MONGODB_URI+"/"+process.env.MONGODB_DB_NAME);
    return Booking.create(bookingData);
}


