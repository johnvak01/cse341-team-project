import { getBookingById } from "../models/bookings.js";

export default async (req, res) => {
    const { bookingId } = req.params;

    const confirmation = await getBookingById(bookingId);

    if (!confirmation) {
        return res.status(404).render("errors/404", {
            title: "Booking Not Found",
            error: "The requested booking could not be found.",
        });
    }

    return res.render("trips/confirm", {
        title: "Trip Confirmation",
        confirmation,
    });
};
