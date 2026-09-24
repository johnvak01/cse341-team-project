import { Router } from "express";
import { getAllTrains, getTrainById } from "../controllers/trains.js";
import {
    getAllSchedules,
    getScheduleById,
    getSchedulesByTripId,
    getSchedulesByTripAndMonth,
    validateMonth,
} from "../controllers/schedules.js";
import { getAllStations, getStationById } from "../controllers/stations.js";
import { getAllTrips, getTripById } from "../controllers/trips.js";
import { getAllBookings } from "../controllers/bookings.js";
import { 
    getAllTicketClasses, 
    getTicketClassesForDay 
} from "../controllers/ticket-classes.js";

const router = Router();

/**
 * @openapi
 * /api/trains:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get all trains
 *     description: Returns every train in the trains collection
 *     responses:
 *       '200':
 *         description: Trains retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/api/trains", getAllTrains);

/**
 * @openapi
 * /api/trains/{id}:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get a train by ID
 *     description: Returns one train matching the requested ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the train to retrieve, such as kiha-261
 *         schema:
 *           type: string
 *         example: kiha-261
 *     responses:
 *       '200':
 *         description: Train retrieved successfully.
 *       '404':
 *         description: Train was not found.
 *       '500':
 *         description: Internal server error.
 */
router.get("/api/trains/:id", getTrainById);

/**
 * @openapi
 * /api/schedules:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get all schedules
 *     description: Returns every schedule in the schedule collection
 *     responses:
 *       '200':
 *         description: Schedules retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/api/schedules", getAllSchedules);

/**
 * @openapi
 * /api/schedules/{id}:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get a schedule by ID
 *     description: Returns one schedule matching the requested ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the schedule to retrieve, such as 1
 *         schema:
 *           type: string
 *         example: 1
 *     responses:
 *       '200':
 *         description: Schedule retrieved successfully.
 *       '404':
 *         description: Schedule was not found.
 *       '500':
 *         description: Internal server error.
 */
router.get("/api/schedules/:id", getScheduleById);

/**
 * @openapi
 * /api/trips/{tripId}/schedules:
 *   get:
 *     tags:
 *       - Schedules
 *     summary: Get schedules for a trip
 *     description: Returns schedules for a trip, with optional month filtering.
 *     parameters:
 *       - name: tripId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *       - name: month
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         example: 10
 *     responses:
 *       '200':
 *         description: Schedules were returned successfully.
 *       '400':
 *         description: Invalid month value.
 *       '404':
 *         description: Trip was not found.
 *       '500':
 *         description: Internal server error.
 */
router.get("/api/trips/:tripId/schedules", validateMonth, (req, res, next) => {
    if (req.query.month !== undefined) {
        return getSchedulesByTripAndMonth(req, res, next);
    }
    return getSchedulesByTripId(req, res, next);
});

/**
 * @openapi
 * /api/stations:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get all stations
 *     description: Returns every station in the stations collection
 *     responses:
 *       '200':
 *         description: Stations retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/api/stations", getAllStations);

/**
 * @openapi
 * /api/stations/{id}:
 *   get:
 *     tags:
 *       - Stations
 *     summary: Get a station by ID
 *     description: Returns one station matching the requested ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the station to retrieve, such as nagoya
 *         schema:
 *           type: string
 *         example: nagoya
 *     responses:
 *       '200':
 *         description: Station retrieved successfully.
 *       '404':
 *         description: Station was not found.
 *       '500':
 *         description: Internal server error
 */
router.get("/api/stations/:id", getStationById);

/**
 * @openapi
 * /api/trips:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get all trips
 *     description: Returns every trip in the trips collection
 *     responses:
 *       '200':
 *         description: Trips retrieved successfully
 *       '500':
 *         description: Internal error
 */
router.get("/api/trips", getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get a trip by ID
 *     description: Returns one trip matching the requested ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the trip to retrieve, such as alpine-panorama
 *         schema:
 *           type: string
 *           example: alpine-panorama
 *     responses:
 *       '200':
 *         description: Trip retrieved successfully.
 *       '404':
 *         description: Trip was not found
 *       '500':
 *         description: Internal server error
 */
router.get("/api/trips/:id", getTripById);

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Bookings returned successfully
 *       500:
 *         description: Unable to retrieve bookings
 */
router.get('/api/bookings', getAllBookings);

/**
 * @openapi
 * /api/ticket-classes:
 *   get:
 *     tags:
 *       - Ticket Classes
 *     summary: Get ticket classes
 *     description: Returns all ticket classes or filters them by an available day.
 *     parameters:
 *       - name: day
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: Monday
 *         description: The day of the week to filter ticket availability.
 *     responses:
 *       '200':
 *         description: Ticket classes retrieved successfully.
 *       '400':
 *         description: Day query parameter is missing or invalid.
 *       '500':
 *         description: Internal server error.
 */

router.get("/api/ticket-classes", (req, res, next) => {
    if (req.query.day !== undefined) {
        return getTicketClassesForDay(req, res, next);
    }
    return getAllTicketClasses(req, res, next);
});

// API routes: send JSON errors that fetch() can inspect

router.get('/orders/me', requireApiLogin, getMyOrders);

router.delete('/projects/:id', requireApiRole('admin'), deleteProject);

export default router;
