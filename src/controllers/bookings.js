import {
    getBookingById as findBookingById,
    getAllBookings as findAllBookings,
    createBooking as createNewBooking
} from "../models/bookings.js";
import Booking from "../models/schemas/bookings.js";


export async function getAllBookings(req, res) {
    try {
        const booking = await findAllBookings();

        return res.status(200).json(booking);
    } catch (error) {
        console.error("Error fetching bookings:", error);

        return res.status(500).json({
            error: "Failed to fetch Bookings",
        });
    }
}


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


