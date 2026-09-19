import { Router } from "express";
import { bookingPage, processBookingRequest } from "../controllers/bookings.js";
import { homePage, aboutPage, testErrorPage } from "../controllers/index.js";
import { trainsPage } from "../controllers/trains.js";
import  railTripsRouter from "./trips.js";

const router = Router();

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Trains page
router.get("/trains", trainsPage);

// Rail trips
router.use("/trips", railTripsRouter);

// Test 500 error page
router.get("/500", testErrorPage);

export default router;
