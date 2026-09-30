import {
    getAllBookings as findAllBookings,
    getBookingById as findBookingById,
    getBookingsByUserId as findBookingsByUserId,
    getBookingsForUser as findBookingsForUser,
    updateBooking as updateBookingRecord,
    deleteBooking as deleteBookingRecord,
    createBooking as createNewBooking,
} from "../models/bookings.js";
import { getScheduleById as findScheduleById } from "../models/schedules.js";
import { getTripById as findTripById } from "../models/trips.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";
import { getUserById as findUserById } from "../models/users.js";
import { generateConfirmationCode } from "../includes/helpers.js";

const getAllBookings = async (req, res) => {
    try {
        const isAdmin = req.user?.role?.name === "admin";
        const bookings = isAdmin
            ? await findAllBookings()
            : await findBookingsForUser(req.user._id, req.user.email);

        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({ error: "Failed to fetch Bookings" });
    }
};

const getBookingsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const bookings = await findBookingsForUser(user._id, user.email);
        if (bookings.length === 0) {
            return res.status(404).json({ error: "User has no bookings" });
        }

        return res.status(200).json(bookings);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        console.error("Error fetching bookings:", error);
        return res.status(500).json({ error: "Failed to fetch bookings" });
    }
};

const isBookingOwner = (booking, user) =>
    booking.userId &&
    String(booking.userId._id ?? booking.userId) === String(user._id);

const canManageBooking = (booking, user) =>
    user?.role?.name === "admin" || isBookingOwner(booking, user);

const createUpgradeQuote = async (booking, targetClassName) => {
    if (typeof targetClassName !== "string" || !targetClassName.trim()) {
        return { error: "A ticket class is required", status: 400 };
    }

    const ticketClasses = await getAllTicketClasses();
    const currentClass = ticketClasses.find(
        (item) => item.class === booking.ticketClass
    );
    const targetClass = ticketClasses.find(
        (item) => item.class === targetClassName.trim()
    );
    if (!currentClass || !targetClass) {
        return { error: "Invalid ticket class", status: 400 };
    }
    if (targetClass.priceMultiplier <= currentClass.priceMultiplier) {
        return {
            error: "Bookings can only be upgraded to a higher ticket class",
            status: 400,
        };
    }

    const availableDays = targetClass.availableDays || [];
    if (
        !availableDays.some(
            (day) => day.toLowerCase() === booking.selectedDay.toLowerCase()
        )
    ) {
        return {
            error: "The selected ticket class is unavailable on this travel day",
            status: 400,
        };
    }

    const trip = await findTripById(booking.tripId);
    if (!trip) {
        return { error: "Trip not found for this booking", status: 404 };
    }

    const seatCount = booking.passengers.length;
    if (seatCount === 0) {
        return { error: "This booking has no seats to upgrade", status: 400 };
    }

    const priceDifferencePerSeat = Math.round(
        trip.distance *
            (targetClass.priceMultiplier - currentClass.priceMultiplier)
    );
    return {
        quote: {
            bookingId: booking.id,
            currentTicketClass: currentClass.class,
            targetTicketClass: targetClass.class,
            seatCount,
            priceDifferencePerSeat,
            totalPriceDifference: priceDifferencePerSeat * seatCount,
            currency: "JPY",
        },
    };
};

const getBookingUpgradeQuote = async (req, res) => {
    try {
        const booking = await findBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        if (!canManageBooking(booking, req.user)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const result = await createUpgradeQuote(booking, req.query.ticketClass);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(200).json(result.quote);
    } catch (error) {
        console.error("Error calculating booking upgrade:", error);
        return res
            .status(500)
            .json({ error: "Failed to calculate upgrade price" });
    }
};

const validatePassengerUpdates = (passengers, expectedCount) => {
    if (!Array.isArray(passengers) || passengers.length !== expectedCount) {
        return { error: "Passenger count cannot be changed here", status: 400 };
    }

    const normalizedPassengers = passengers.map((passenger) => ({
        firstName:
            typeof passenger?.firstName === "string"
                ? passenger.firstName.trim()
                : "",
        lastName:
            typeof passenger?.lastName === "string"
                ? passenger.lastName.trim()
                : "",
        email:
            typeof passenger?.email === "string"
                ? passenger.email.trim().toLowerCase()
                : "",
        phone: typeof passenger?.phone === "string" ? passenger.phone.trim() : "",
    }));

    const hasInvalidPassenger = normalizedPassengers.some(
        (passenger) =>
            !passenger.firstName ||
            !passenger.lastName ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email) ||
            !passenger.phone
    );
    if (hasInvalidPassenger) {
        return { error: "Passenger name, valid email, and phone are required", status: 400 };
    }

    return { passengers: normalizedPassengers };
};

const createBookingApi = async (req, res) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const scheduleId = body.scheduleId;
    const tripId = typeof body.tripId === "string" ? body.tripId.trim() : "";
    const selectedDay =
        typeof body.selectedDay === "string"
            ? body.selectedDay.trim().toLowerCase()
            : "";
    const ticketClass =
        typeof body.ticketClass === "string"
            ? body.ticketClass.trim().toLowerCase()
            : "";
    const passengers = body.passengers;

    if (
        !Number.isSafeInteger(scheduleId) ||
        !tripId ||
        !selectedDay ||
        !ticketClass ||
        !Array.isArray(passengers) ||
        passengers.length < 1 ||
        passengers.length > 8
    ) {
        return res.status(400).json({ error: "Invalid booking details" });
    }

    const normalizedPassengers = validatePassengerUpdates(
        passengers,
        passengers.length
    );
    if (normalizedPassengers.error) {
        return res
            .status(normalizedPassengers.status)
            .json({ error: normalizedPassengers.error });
    }

    try {
        const schedule = await findScheduleById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        if (schedule.tripId !== tripId) {
            return res.status(400).json({ error: "Trip does not match the schedule" });
        }
        if (
            !schedule.daysOfWeek.some(
                (day) => day.toLowerCase() === selectedDay
            )
        ) {
            return res.status(400).json({ error: "Schedule is unavailable on the selected day" });
        }

        const ticketClasses = await getAllTicketClasses();
        const selectedClass = ticketClasses.find(
            (item) => item.class === ticketClass
        );
        if (!selectedClass) {
            return res.status(400).json({ error: "Invalid ticket class" });
        }
        if (
            !(selectedClass.availableDays || []).some(
                (day) => day.toLowerCase() === selectedDay
            )
        ) {
            return res.status(400).json({ error: "Ticket class is unavailable on the selected day" });
        }

        const bookingId = generateConfirmationCode();
        await createNewBooking({
            id: bookingId,
            userId: req.user._id,
            scheduleId,
            tripId,
            ticketClass,
            selectedDay,
            passengers: normalizedPassengers.passengers,
        });

        return res.status(201).json({
            message: "Booking created successfully",
            bookingId,
            confirmationUrl: `/trips/confirmation/${bookingId}`,
        });
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ error: "Invalid booking details" });
        }
        if (error.code === 11000) {
            return res.status(409).json({ error: "Booking confirmation ID already exists" });
        }
        console.error("Error creating booking:", error);
        return res.status(500).json({ error: "Failed to create booking" });
    }
};

const updateBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await findBookingById(id);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (!canManageBooking(booking, req.user)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const hasPassengerUpdate = req.body.passengers !== undefined;
        const hasUpgradeUpdate =
            req.body.ticketClass !== undefined || req.body.selectedDay !== undefined;
        if (hasPassengerUpdate && hasUpgradeUpdate) {
            return res.status(400).json({ error: "Update passenger details or upgrade the booking separately" });
        }

        if (hasPassengerUpdate) {
            const result = validatePassengerUpdates(
                req.body.passengers,
                booking.passengers.length
            );
            if (result.error) {
                return res.status(result.status).json({ error: result.error });
            }

            const updated = await updateBookingRecord(id, {
                passengers: result.passengers,
            });
            return res.status(200).json(updated);
        }

        if (req.body.selectedDay !== undefined) {
            return res
                .status(400)
                .json({ error: "Only ticket upgrades are supported" });
        }

        const result = await createUpgradeQuote(booking, req.body.ticketClass);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const updated = await updateBookingRecord(id, {
            ticketClass: result.quote.targetTicketClass,
        });
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating booking:", error);
        return res.status(500).json({ error: "Failed to update booking" });
    }
};

const deleteBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await findBookingById(id);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (!canManageBooking(booking, req.user)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await deleteBookingRecord(id);
        return res.status(200).json({ message: "Booking deleted" });
    } catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json({ error: "Failed to delete booking" });
    }
};

const getBookingById = async (req, res) => {
    try {
        const booking = await findBookingById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (!canManageBooking(booking, req.user)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        return res.status(200).json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);
        return res.status(500).json({ error: "Failed to fetch booking" });
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
        ...(req.user ? { userId: req.user._id } : {}),
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
        description: ticketClass.description,
    }));

    return res.render("trips/book", {
        title: "Book Trip",
        schedule,
        ticketOptions,
    });
};

const bookingsPage = (req, res) => {
    res.render("bookings", {
        title: "Bookings",
        isAdmin: res.locals.isAdmin,
        currentUserId: String(req.user._id),
        currentUserEmail: req.user.email,
    });
};

const confirmationPage = async (req, res) => {
    const { bookingId } = req.params;

    const confirmation = await findBookingById(bookingId);

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

export {
    getAllBookings,
    createBookingApi,
    getBookingsByUserId,
    getBookingById,
    getBookingUpgradeQuote,
    updateBookingById,
    deleteBookingById,
    processBookingRequest,
    bookingPage,
    bookingsPage,
    confirmationPage,
};
