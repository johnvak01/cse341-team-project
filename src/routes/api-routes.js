import { Router } from "express";
import { getAllTrains, getTrainById } from "../controllers/trains.js";
import {
    getAllSchedules,
    getScheduleById,
    getSchedulesByTripId,
    getSchedulesByTripAndMonth,
    validateMonth,
} from "../controllers/schedules.js";
import { getAllTrips, getTripById } from "../controllers/trips.js"

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
 * /bookings:
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

export default router;
