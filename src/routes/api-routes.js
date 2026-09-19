import { Router } from 'express';
import { getTrainById, trainsApi } from '../controllers/trains.js';
import { getAllBookings } from '../controllers/bookings.js';

const router = Router();

/**
 * @openapi
 * /trains:
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
router.get('/trains', trainsApi);

/**
 * @openapi
 * /trains/{id}:
 *   get:
 *     tags:
 *       - Trains
 *     summary: Get a train by ID
 *     description: Returns one train matching the requested ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the train to retrieve, such as t1
 *         schema:
 *           type: string
 *         example: t1
 *     responses:
 *       '200':
 *         description: Train retrieved successfully.
 *       '404':
 *         description: Train was not found.
 *       '500':
 *         description: Internal server error.
 */
router.get('/trains/:id', getTrainById);

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

export default router;