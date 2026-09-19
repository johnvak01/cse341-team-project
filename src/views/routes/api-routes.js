import express from 'express';

import { getAllBookings } from '../../controllers/bookings.js';
const router = express.Router();

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