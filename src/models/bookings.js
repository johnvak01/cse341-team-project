import Booking from './schemas/bookings.js';

export async function getAllBookings() {
    // console.log(Booking);
    // await mongoose.connect(process.env.MONGODB_URI+"/"+process.env.MONGODB_DB_NAME);
    // console.log("Currently connected to DB:", mongoose.connection.name); 
    return Booking.find();
}

export async function getBookingById(id) {
    // await mongoose.connect(process.env.MONGODB_URI+"/"+process.env.MONGODB_DB_NAME);
    return Booking.findOne({ id });
}

export async function createBooking(bookingData) {
    // await mongoose.connect(process.env.MONGODB_URI+"/"+process.env.MONGODB_DB_NAME);
    return Booking.create(bookingData);
}


