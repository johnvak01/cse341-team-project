import {
    getAllBookings as findAllBookings,
    createBooking as createNewBooking
} from "../models/bookings.js";
import { getScheduleById as findScheduleById } from "../models/schedules.js";
import { getTripById as findTripById } from "../models/trips.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";
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
    const passengers = Array.isArray(req.body.passengers)
        ? req.body.passengers
        : Object.values(req.body.passengers || {});
    const booking = {
        id: generateConfirmationCode(),
        scheduleId: Number(req.body.scheduleId),
        tripId: req.body.tripId,
        ticketClass: req.body.ticketClass,
        selectedDay: req.body.selectedDay,
        passengers,
    };

    try {
        await createNewBooking(booking);
        return res.redirect(`/trips/confirmation/${booking.id}`);
    } catch (error) {
        console.error("Error creating booking:", error);
        return res.status(500).render("errors/500", {
            title: "Server Error",
            error: error.message,
            stack: error.stack,
        });
    }
};

const bookingPage = async (req, res) => {
    const { scheduleId } = req.params;

    const schedule = await findScheduleById(Number(scheduleId));

    if (!schedule) {
        return res.status(404).render("errors/404", {
            title: "Schedule Not Found",
            error: "The requested schedule could not be found.",
        });
    }

    const trip = await findTripById(schedule.tripId);
    if (!trip) {
        return res.status(404).render("errors/404", {
            title: "Trip Not Found",
            error: "The trip for this schedule could not be found.",
        });
    }

    const ticketClasses = await getAllTicketClasses();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
        class: ticketClass.class,
        name: ticketClass.name,
        price: trip.distance * ticketClass.priceMultiplier,
        amenities: ticketClass.amenities,
        description: ticketClass.description
    }));

    return res.render('trips/book', {
        title: 'Book Trip',
        schedule,
        ticketOptions
    });
};
const bookingsPage = (req, res) => {
    res.render("bookings", { title: "Bookings" });
};

export { getAllBookings, processBookingRequest, bookingPage, bookingsPage };

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


