import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { User } from '../src/models/schemas/users.js';
import { Role } from '../src/models/schemas/roles.js';
import Booking from '../src/models/schemas/bookings.js';
import Schedule from '../src/models/schemas/schedules.js';
import TicketClass from '../src/models/schemas/ticket-classes.js';
import e from 'express';

const password = 'Password123!';
const seededTicketClasses = [
    {
        class: "premium",
        name: "Premium Class",
        priceMultiplier: 150,
        amenities: [
            "Panoramic windows",
            "Meal service",
            "Reserved seating",
            "Souvenir photo"
        ],
        description: "Enhanced experience with meal service and panoramic viewing windows",
        availableDays: [
            "Monday",
            "Tuesday",
            "Wednesday"
        ]
    }
];
const seededSchedules = [
    {

        id: 1,
        tripId: "trip-id1",
        departureTime: "14:30",
        arrivalTime: "19:30",
        daysOfWeek: [
            "monday"
        ],
        status: true
    },
    {
        id: 2,
        tripId: "trip-id2",
        departureTime: "13:15",
        arrivalTime: "17:45",
        daysOfWeek: [
            "tuesday"
        ],
        status: true
    },
    {
        id: 3,
        tripId: "trip-id3",
        departureTime: "09:00",
        arrivalTime: "14:00",
        daysOfWeek: [
            "wednesday"
        ],
        status: true
    },
];
const seededBookings = [
    {
        id: "booking1",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName1",
                lastName: "PassengerLName1",
                email: "PassengerLName1@example.com",
                phone: "+1 000 000 001"
            },
            {
                firstName: "customer",
                lastName: "get-bookings-by-id",
                email: "customer-get-bookings-by-id@example.com",
                phone: "+1 000 000 002"
            }
        ]
    },
    {
        id: "booking2",
        scheduleId: 2,
        tripId: "trip-id2",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
            {
                firstName: "PassengerFName2",
                lastName: "PassengerLName2",
                email: "PassengerLName2@example.com",
                phone: "+2 000 000 002"
            }
        ]
    },
    {
        id: "booking3",
        scheduleId: 3,
        tripId: "trip-id3",
        ticketClass: "premium",
        selectedDay: "wednesday",
        passengers: [
            {
                firstName: "PassengerFName3",
                lastName: "PassengerLName3",
                email: "PassengerLName3@example.com",
                phone: "+3 000 000 003"
            }
        ]
    }
]
// Logs a user in through the API and returns an agent that keeps the session cookie
const loginAs = async (role, suffix) => {
    const email = `${role}-${suffix}@example.com`;
    const userId = await createUser(`Test ${role} ${suffix}`, `test-${role}-${suffix}`, email, password);

    if (role === 'admin') {
        const adminRole = await Role.findOne({ name: 'admin' });
        await User.updateOne({ _id: userId }, { role: adminRole._id });
    }

    const agent = request.agent(app);
    const response = await agent.post('/api/auth/login').send({ identifier: email, password });
    expect(response.status).toBe(200);

    return { agent, userId, email };
};

// setup --------------------------------
beforeEach(async () => {
    await Booking.deleteMany({});
    for (const ticketClass of seededTicketClasses) {
        const response = await TicketClass.create(ticketClass);
    }

    await Schedule.deleteMany({});
    for (const schedule of seededSchedules) {
        await Schedule.create(schedule);
    }
    // Ensure test Bookings Exist

    await TicketClass.deleteMany({});
    for (const booking of seededBookings) {
        const response = await Booking.create(booking);
    }
});

afterEach(async () => {
    // Clean up seeded data
    await Booking.deleteMany({});
    await Schedule.deleteMany({});
    await TicketClass.deleteMany({});
});

// tests --------------------------------

describe("test GET /api/bookings", () => {
    test("Test Authenticated Standard Access", async () => {
        //arrange
        const adminLogin = await loginAs("customer", "get-bookings");
        //act
        const response = await adminLogin.agent.get("/api/bookings");
        //assert
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });
    test("Test Authenticated Admin Access", async () => {
        //arrange
        const adminLogin = await loginAs("admin", "get-bookings");
        //act
        const response = await adminLogin.agent.get("/api/bookings");
        //assert
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });
    test("test Un-Authenticated Access", async () => {
        //arrange

        //act
        const response = await request(app).get("/api/bookings");
        //assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication required");
    });
});


describe("test GET /api/bookings/{id}", () => {
    test("Test Admin Access", async () => {
        //arrange
        const adminLogin = await loginAs("admin", "get-bookings-by-id");
        //act
        for (const booking of seededBookings) {
            const response = await adminLogin.agent.get(`/api/bookings/${booking.id}`);
            //assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("id", booking.id.toString());
        }
    });

    test("Test Standard User Access", async () => {
        //arrange
        const standardLogin = await loginAs("customer", "get-bookings-by-id");
        //act
        const testBookingId = seededBookings[0].id;
        const response = await standardLogin.agent.get(`/api/bookings/${testBookingId}`);
        //assert
        expect(response.status).toBe(200);
        // expect(response.body).toBeInstanceOf(Array);

    });

    test("Test Un-Authenticated Access", async () => {
        //arrange
        const testBookingId = seededBookings[0].id;
        //act
        const response = await request(app).get(`/api/bookings/${testBookingId}`);
        //assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication required");
    });
    test("Test Un-Authorized Access", async () => {
        //arrange
        const standardLogin = await loginAs("customer", "get-bookings-by-id-unauthorized");
        const testBookingId = seededBookings[0].id;
        //act
        const response = await request(app).get(`/api/bookings/${testBookingId}`);
        //assert
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", "Forbidden");
    });
});



