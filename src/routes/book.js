import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import { getAllTicketClasses } from '../models/ticket-classes.js';

const bookingPage = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const db = getDb();
        
        const schedule = await db.collection('schedules').findOne({ id: Number(scheduleId) });
        if (!schedule) {
            return res.status(404).send('Schedule not found');
        }

        const trip = await db.collection('trips').findOne({ id: schedule.tripId });
        if (!trip) {
            return res.status(404).send('Trip not found');
        }

        const ticketClasses = await getAllTicketClasses();
        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.priceMultiplier,
            amenities: ticketClass.amenities,
            description: ticketClass.description,
            availableDays: ticketClass.availableDays
        }));

        return res.render('trips/book', {
            title: 'Book Trip',
            schedule,
            ticketOptions
        });
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
};

const processBookingRequest = async (req, res) => {
    try {
        const confirmation = {
            id: generateConfirmationCode(),
            createdAt: new Date().toISOString(),
            ...req.body
        };
        await getDb().collection('confirmations').insertOne(confirmation);
        return res.redirect(`/trips/confirmation/${confirmation.id}`);
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
};

export { bookingPage, processBookingRequest };