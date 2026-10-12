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
    }
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
    },
    {
        id: "booking4",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName4",
                lastName: "PassengerLName4",
                email: "PassengerLName4@example.com",
                phone: "+4 000 000 004"
            }
        ]
    },
    {
        id: "booking5",
        scheduleId: 2,
        tripId: "trip-id2",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
            {
                firstName: "PassengerFName5",
                lastName: "PassengerLName5",
                email: "PassengerLName5@example.com",
                phone: "+5 000 000 005"
            }
        ]
    },
    {
        id: "booking6",
        scheduleId: 3,
        tripId: "trip-id3",
        ticketClass: "premium",
        selectedDay: "wednesday",
        passengers: [
            {
                firstName: "PassengerFName6",
                lastName: "PassengerLName6",
                email: "PassengerLName6@example.com",
                phone: "+6 000 000 006"
            }
        ]
    },
    {
        id: "booking7",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName7",
                lastName: "PassengerLName7",
                email: "PassengerLName7@example.com",
                phone: "+7 000 000 007"
            }
        ]
    },
    {
        id: "booking8",
        scheduleId: 2,
        tripId: "trip-id2",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
            {
                firstName: "PassengerFName8",
                lastName: "PassengerLName8",
                email: "PassengerLName8@example.com",
                phone: "+8 000 000 008"
            }
        ]
    },
    {
        id: "booking9",
        scheduleId: 3,
        tripId: "trip-id3",
        ticketClass: "premium",
        selectedDay: "wednesday",
        passengers: [
            {
                firstName: "PassengerFName9",
                lastName: "PassengerLName9",
                email: "PassengerLName9@example.com",
                phone: "+9 000 000 009"
            }
        ]
    },
    {
        id: "booking10",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName10",
                lastName: "PassengerLName10",
                email: "PassengerLName10@example.com",
                phone: "+10 000 000 010"
            }
        ]
    },
    {
        id: "booking11",
        scheduleId: 2,
        tripId: "trip-id2",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
            {
                firstName: "PassengerFName11",
                lastName: "PassengerLName11",
                email: "PassengerLName11@example.com",
                phone: "+11 000 000 011"
            }
        ]
    },
    {
        id: "booking12",
        scheduleId: 3,
        tripId: "trip-id3",
        ticketClass: "premium",
        selectedDay: "wednesday",
        passengers: [
            {
                firstName: "PassengerFName12",
                lastName: "PassengerLName12",
                email: "PassengerLName12@example.com",
                phone: "+12 000 000 012"
            }
        ]
    },
    {
        id: "booking13",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName13",
                lastName: "PassengerLName13",
                email: "PassengerLName13@example.com",
                phone: "+13 000 000 013"
            }
        ]
    },
    {
        id: "booking14",
        scheduleId: 2,
        tripId: "trip-id2",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
            {
                firstName: "PassengerFName14",
                lastName: "PassengerLName14",
                email: "PassengerLName14@example.com",
                phone: "+14 000 000 014"
            }
        ]
    },
    {
        id: "booking15",
        scheduleId: 3,
        tripId: "trip-id3",
        ticketClass: "premium",
        selectedDay: "wednesday",
        passengers: [
            {
                firstName: "PassengerFName15",
                lastName: "PassengerLName15",
                email: "PassengerLName15@example.com",
                phone: "+15 000 000 015"
            }
        ]
    },
    {
        id: "booking16",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName16",
                lastName: "PassengerLName16",
                email: "PassengerLName16@example.com",
                phone: "+16 000 000 016"
            }
        ]
    },
    {
        id: "booking17",
        scheduleId: 2,
        tripId: "trip-id2",
        ticketClass: "premium",
        selectedDay: "tuesday",
        passengers: [
            {
                firstName: "PassengerFName17",
                lastName: "PassengerLName17",
                email: "PassengerLName17@example.com",
                phone: "+17 000 000 017"
            }
        ]
    },
    {
        id: "booking18",
        scheduleId: 3,
        tripId: "trip-id3",
        ticketClass: "premium",
        selectedDay: "wednesday",
        passengers: [
            {
                firstName: "PassengerFName18",
                lastName: "PassengerLName18",
                email: "PassengerLName18@example.com",
                phone: "+18 000 000 018"
            }
        ]
    },
    {
        id: "booking19",
        scheduleId: 1,
        tripId: "trip-id1",
        ticketClass: "premium",
        selectedDay: "monday",
        passengers: [
            {
                firstName: "PassengerFName19",
                lastName: "PassengerLName19",
                email: "PassengerLName19@example.com",
                phone: "+19 000 000 019"
            }
        ]
    }
];
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

describe("test GET /api/bookings_paginated, standard responses", () => {
    test("should return paginated bookings with default settings", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.bookings.length).toBe(10);
        expect(response.body.totalPages).toBe(2);
        expect(response.body.page).toBe(1);
        expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    test("should return paginated bookings with custom page and limit", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-custom');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?page=2&limit=5');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.bookings.length).toBe(5);
        expect(response.body.totalPages).toBe(4);
        expect(response.body.page).toBe(2);
        expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    test("should return paginated bookings with ticket-class filtering", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-filter');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?ticketClass=premium');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.bookings.length).toBe(10);
        expect(response.body.totalPages).toBe(2);
        expect(response.body.page).toBe(1);
        expect(Array.isArray(response.body.bookings)).toBe(true);
        expect(response.body.bookings.every(b => b.ticketClass.toLowerCase() === 'premium')).toBe(true);
    });

    test("should return paginated bookings with startDate filtering", async () => {
        // Arrange
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        const adminLogin = await loginAs('admin', 'pagination-filter-startDate');

        // Act
        const response = await adminLogin.agent.get(`/api/bookings_paginated?startDate=${tomorrowString}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.bookings.length).toBe(0);
        expect(response.body.totalPages).toBe(0);
        expect(response.body.page).toBe(1);
        expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    test("should return paginated bookings with endDate filtering", async () => {
        // Arrange
        let yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        let yesterdayString = new Date(yesterday).toISOString().split('T')[0];

        const adminLogin = await loginAs('admin', 'pagination-filter-endDate');

        // Act
        const response = await adminLogin.agent.get(`/api/bookings_paginated?endDate=${yesterdayString}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.bookings.length).toBe(0);
        expect(response.body.totalPages).toBe(0);
        expect(response.body.page).toBe(1);
        expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    // test invalid parameters
    test("should return 400 with invalid parameters", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-invalid');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?page=abc&limit=xyz');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
            })
        ]));
    });

    test("should return 400 with negative page or limit", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-negative');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?page=-1&limit=-5');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
            })
        ]));
    });

    test("should return 400 with unsupported sort field", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-sort');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?sort=unsupportedField');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
            })
        ]));
    });

    test("should return 401 when not authorized", async () => {
        // Act
        const response = await request(app).get('/api/bookings_paginated');

        // Assert
        expect(response.status).toBe(401);
    });
    test("should return error when dates are in invalid format", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-invalid-dates');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?startDate=invalid-date&endDate=invalid-date');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
            })
        ]));
    });
    test("should return 400 when startDate is after endDate", async () => {
        // Arrange
        const adminLogin = await loginAs('admin', 'pagination-start-after-end');

        // Act
        const response = await adminLogin.agent.get('/api/bookings_paginated?startDate=2024-01-01&endDate=2023-01-01');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
            })
        ]));
    });
});
