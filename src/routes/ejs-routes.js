import { Router } from "express";
import {
    bookingPage,
    processBookingRequest,
    bookingsPage,
} from "../controllers/bookings.js";
import { homePage, aboutPage, testErrorPage } from "../controllers/index.js";
import { trainsPage } from "../controllers/trains.js";
import confirmationPage from "./confirm.js";
import { getTripsList, getTripDetails } from "../controllers/trips.js";

const router = Router();

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Trains page
router.get("/trains", trainsPage);

//bookings page
router.get("/bookings-admin", bookingsPage);

// Test 500 error page
router.get("/500", testErrorPage);

// Trips List Page
router.get("/trips", getTripsList);

// Trips Details Page
router.get("/trips/:tripId", getTripDetails);

// Book ticket
router.get("/trips/booking/:scheduleId", bookingPage);
router.post("/trips/book", processBookingRequest);

// Booking confirmation page
router.get("/trips/confirmation/:bookingId", confirmationPage);

// login and register routes

export default router;
