import TicketClass from './schemas/ticket-classes.js';

export const getAllTicketClasses = async () => {
    return TicketClass.find();
};

export const getTicketClassesForDay = async (day) => {
    return TicketClass.find({ availableDays: day });
};