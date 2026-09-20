import { Router } from "express";
import { bookingPage, processBookingRequest } from "./book.js";
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

// Test 500 error page
router.get("/500", testErrorPage);

// Trips list and detail pages
router.get("/trips", getTripsList);
router.get("/trips/:tripId", getTripDetails);

// Booking and confirmation pages
router.get("/trips/booking/:scheduleId", bookingPage);
router.post("/trips/book", processBookingRequest);
router.get("/trips/confirmation/:confirmationId", confirmationPage);

export default router;
