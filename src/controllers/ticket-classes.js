import {
    getAllTicketClasses as findAllTicketClasses,
    getTicketClassesForDay as findTicketClassesForDay
} from '../models/ticket-classes.js';

export const getAllTicketClasses = async (req, res) => {
    try {
        const ticketClasses = await findAllTicketClasses();
        return res.status(200).json(ticketClasses);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getTicketClassesForDay = async (req, res) => {
    try {
        const { day } = req.query;
        if (!day) {
            return res.status(400).json({ error: 'Day query parameter is required' });
        }
        const ticketClasses = await findTicketClassesForDay(day);
        return res.status(200).json(ticketClasses);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};