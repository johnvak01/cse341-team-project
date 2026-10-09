import { Router } from "express";
import { getAllTrains, getTrainById, getTrainFilterOptions } from "../controllers/trains.js";
import {
    getAllSchedules,
    getScheduleById,
    getSchedulesByTripId,
    getSchedulesByTripAndMonth,
    validateMonth,
} from "../controllers/schedules.js";
import { getAllStations, getStationById } from "../controllers/stations.js";
import { getAllTrips, getTripById, updateTrip, deleteTrip } from "../controllers/trips.js";
import { getAllBookings, getMyBookings, updateBookingById, deleteBookingById } from "../controllers/bookings.js";
import { 
    getAllTicketClasses, 
    getTicketClassesForDay 
} from "../controllers/ticket-classes.js";

import { requireApiLogin, requireApiRole } from "../middleware/authentication.js";

const router = Router();

/**
 * @openapi
 * /api/trains:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get a paginated, searchable list of trains
 *     description: Returns trains from the trains collection, paginated, sorted, and optionally filtered by search text, type, or power source.
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           default: name
 *           enum: [name, operator, maxSpeedKmh, capacity]
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           default: asc
 *           enum: [asc, desc]
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *         description: Case-insensitive substring search across name, operator, description, and bestFor.
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *         description: Case-insensitive exact match against the train's type. See GET /api/trains/filters for current values.
 *       - name: powerSource
 *         in: query
 *         schema:
 *           type: string
 *         description: Case-insensitive exact match against the train's power source. See GET /api/trains/filters for current values.
 *     responses:
 *       '200':
 *         description: Trains retrieved successfully
 *       '400':
 *         description: Invalid pagination, sort, or filter parameter
 *       '500':
 *         description: Internal server error
 */
router.get("/api/trains", getAllTrains);

/**
 * @openapi
 * /api/trains/filters:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get the current train filter options
 *     description: Returns the distinct type and powerSource values currently present in the trains collection, for building filter dropdowns.
 *     responses:
 *       '200':
 *         description: Filter options retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/api/trains/filters", getTrainFilterOptions);

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
 * /api/trips/{id}:
 *   put:
 *     tags:
 *       - Trips
 *     summary: Update an existing trip (Admin Only)
 *     description: Updates trip details. Validates that incoming start/end stations and schedule IDs already exist before saving.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The custom unique string identifier of the trip to update
 *         schema:
 *           type: string
 *           example: alpine-panorama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Scenic Alpine Express"
 *               description:
 *                 type: string
 *                 example: "A beautiful train route through the mountain ranges."
 *               startStation:
 *                 type: string
 *                 example: "Zermatt"
 *               endStation:
 *                 type: string
 *                 example: "St. Moritz"
 *               distance:
 *                 type: number
 *                 minimum: 0
 *                 example: 291
 *               scheduleIds:
 *                 type: array
 *                 description: Array of existing schedule custom IDs to link to this trip
 *                 items:
 *                   type: string
 *                 example: ["SCHED-01", "SCHED-02"]
 *     responses:
 *       '200':
 *         description: Trip and schedule associations updated successfully.
 *       '400':
 *         description: Bad Request. Selected stations or schedules do not exist in the database.
 *       '401':
 *         description: Unauthorized. User is not logged into the session.
 *       '403':
 *         description: Forbidden. Authenticated user does not have the admin role.
 *       '404':
 *         description: Trip was not found matching the custom ID.
 *       '500':
 *         description: Internal server error
 */
router.put("/api/trips/:id", requireApiLogin, requireApiRole('admin'), updateTrip);

/**
 * @openapi
 * /api/trips/{id}:
 *   delete:
 *     tags:
 *       - Trips
 *     summary: Delete a trip (Admin Only)
 *     description: Deletes a trip record by its custom ID. Automatically triggers a cascading deletion to remove all associated schedules.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The custom unique string identifier of the trip to delete
 *         schema:
 *           type: string
 *           example: alpine-panorama
 *     responses:
 *       '200':
 *         description: Trip and all of its cascading schedule dependencies deleted successfully.
 *       '401':
 *         description: Unauthorized. User is not logged into the session.
 *       '403':
 *         description: Forbidden. Authenticated user does not have the admin role.
 *       '404':
 *         description: Trip was not found matching the custom ID.
 *       '500':
 *         description: Internal server error
 */
router.delete("/api/trips/:id", requireApiLogin,requireApiRole('admin'), deleteTrip);

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
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Unable to retrieve bookings
 */
router.get('/api/bookings', requireApiLogin, getAllBookings);

/**
 * @openapi
 * /api/bookings/me:
 *   get:
 *     summary: Get the logged-in user's bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: Bookings returned successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Unable to retrieve bookings
 */
router.get('/api/bookings/me', requireApiLogin, getMyBookings);

/**
 * @openapi
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedDay: { type: string }
 *               ticketClass: { type: string }
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to edit this booking
 *       404:
 *         description: Booking not found
 *   delete:
 *     summary: Delete a booking
 *     tags:
 *       - Bookings
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not authorized to delete this booking
 *       404:
 *         description: Booking not found
 */
router.put('/api/bookings/:id', requireApiLogin, updateBookingById);
router.delete('/api/bookings/:id', requireApiLogin, deleteBookingById);

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


// router.get('/orders/me', requireApiLogin, getMyOrders);

// router.delete('/projects/:id', requireApiRole('admin'), deleteProject);

export default router;
