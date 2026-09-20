import { Router } from "express";
import { bookingPage, processBookingRequest, bookingsPage } from "../controllers/bookings.js";
import { homePage, aboutPage, testErrorPage } from "../controllers/index.js";
import { trainsPage } from "../controllers/trains.js";
import confirmationPage from "./confirm.js";
import { getTripsList } from "../controllers/trips.js";
import { getTripDetails} from "../controllers/trips.js";


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

// List all trips
router.get("/:id", getTripsList);

// Trip details page
router.get("/:tripId", getTripDetails);

// Book ticket
router.get("/booking/:scheduleId", bookingPage);
router.post("/book", processBookingRequest);

// Booking confirmation page
router.get("/confirmation/:confirmationId", confirmationPage);

export default router;
