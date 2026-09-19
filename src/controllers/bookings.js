import {
    getBookingById as findBookingById,
    getAllBookings as findAllBookings,
    createBooking as createNewBooking
} from "../models/bookings.js";
import Booking from "../models/schemas/bookings.js";
import { generateConfirmationCode } from '../includes/helpers.js';

const getAllBookings = async (req, res) =>{
    try {
        const booking = await findAllBookings();

        return res.status(200).json(booking);
    } catch (error) {
        console.error("Error fetching bookings:", error);

        return res.status(500).json({
            error: "Failed to fetch Bookings",
        });
    }
};

const processBookingRequest = async (req, res) => {
    const confirmation = {
        _id: generateConfirmationCode(),
        createdAt: new Date().toISOString(),
        ...req.body
    };
    createNewBooking(confirmation);

    res.redirect(`/trips/confirmation/${confirmation._id}`);
};

const bookingPage = async (req, res) => {
    const { scheduleId } = req.params;

    const db = getDb();
    const schedule = await db.collection('schedules').findOne({ id: Number(scheduleId) });
    const trip = await db.collection('trips').findOne({ id: schedule.tripId });
    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.pricePerKm,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
};

export { getAllBookings, processBookingRequest, bookingPage };

// export const bookingsPage = (req, res) => {
//     res.render("bookings", { title: "Bookings" });
// };

// export const bookingsApi = async (req, res, next) => {
//     try {
//         const bookings = await findAllBookings();
//         return res.json({ bookings });
//     } catch (error) {
//         return next(error);
//     }
// };

// export async function getBookingById(req, res) {
//     try {
//         const { id } = req.params;

//         const booking = await findBookingById(id);

//         if (!booking) {
//             return res.status(404).json({
//                 error: "Booking not found",
//             });
//         }

//         return res.status(200).json(booking);
//     } catch (error) {
//         console.error("Error fetching booking:", error);

//         return res.status(500).json({
//             error: "Failed to fetch booking",
//         });
//     }
// }


