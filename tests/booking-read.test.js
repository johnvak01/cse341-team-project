import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { User } from '../src/models/schemas/users.js';
import { Role } from '../src/models/schemas/roles.js';
import  Booking  from '../src/models/schemas/bookings.js';
import  Schedule  from '../src/models/schemas/schedules.js';
import  TicketClass  from '../src/models/schemas/ticket-classes.js';
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
    for (const ticketClass of seededTicketClasses) {
        const response = await TicketClass.create(ticketClass);
    }

    for (const schedule of seededSchedules) {
        await Schedule.create(schedule);
    }
    // Ensure test Bookings Exist

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
    test("Test Authenticated Access", async () => {
        //arrange
        const adminLogin = await loginAs("admin", "get-bookings");
        //act
        const response = await adminLogin.agent.get("/api/bookings");
        //assert
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });
    test("test unauthenticated access", async () => {
        //arrange

        //act
        const response = await request(app).get("/api/bookings");
        //assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication required");
    });
    test("", async () => {
        //arrange

        //act

        //assert

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
        expect(response.status).toBe(403);
        // expect(response.body).toBeInstanceOf(Array);


    });

    test("Test Un-Authenticated Access", async () => {
        //arrange

        //act
        const response = await request(app).get("/api/bookings");
        //assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication required");
    });
    test("Test Un-Authorized Access", async () => {
        //arrange

        //act
        const response = await request(app).get("/api/bookings");
        //assert
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message", "Authentication required");
    });
    // test("test Booking not found", async () => {
    //     //arrange

    //     //act

    //     //assert

    // });
});



describe("GET /bookings", () => {

    test("redirects to login if not authenticated", async () => {
        //arrange
        //act
        const response = await request(app).get("/bookings");
        //assert
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/login");
    });
    test("", async () => {
        //arrange

        //act

        //assert

    });
    test("", async () => {
        //arrange

        //act

        //assert

    });
    test("", async () => {
        //arrange

        //act

        //assert

    });
    test("", async () => {
        //arrange

        //act

        //assert

    });
    test("", async () => {
        //arrange

        //act

        //assert

    });


});

// const createBooking = async ({ id, userId, passengerEmail }) =>
//     Booking.create({
//         id,
//         userId,
//         scheduleId: 1,
//         tripId: "alpine-panorama",
//         ticketClass: "standard",
//         selectedDay: "monday",
//         passengers: [{
//             firstName: "Test",
//             lastName: "Passenger",
//             email: passengerEmail,
//             phone: "555-0100",
//         }],
//     });
// describe("personal and admin bookings views", () => {
//     test("an admin's View Your Bookings page lists only bookings associated with that admin", async () => {
//         const { agent, user } = await loginAs("admin", "personal-bookings");
//         const otherUserId = await createUser(
//             "Other User",
//             "other-user",
//             "other@example.com",
//             password
//         );
//         await createBooking({
//             id: "admin-created",
//             userId: user._id,
//             passengerEmail: "traveler@example.com",
//         });
//         await createBooking({
//             id: "admin-passenger",
//             userId: otherUserId,
//             passengerEmail: user.email,
//         });
//         await createBooking({
//             id: "other-booking",
//             userId: otherUserId,
//             passengerEmail: "someone-else@example.com",
//         });

//         const dashboard = await agent.get("/dashboard");
//         expect(dashboard.text).toContain('href="/bookings">View Your Bookings</a>');

//         const page = await agent.get("/bookings");
//         expect(page.status).toBe(200);
//         expect(page.text).toContain("Your Bookings");
//         expect(page.text).toContain('data-bookings-scope="mine"');

//         const response = await agent.get("/api/bookings_paginated?scope=mine");
//         expect(response.status).toBe(200);
//         expect(response.body.bookings.map((booking) => booking.id)).toEqual(
//             expect.arrayContaining(["admin-created", "admin-passenger"])
//         );
//         expect(response.body.bookings.map((booking) => booking.id)).not.toContain(
//             "other-booking"
//         );
//     });

//     test("the admin bookings page can still request all bookings", async () => {
//         const { agent, user } = await loginAs("admin", "all-bookings");
//         const otherUserId = await createUser(
//             "Other User",
//             "other-user-all",
//             "other-all@example.com",
//             password
//         );
//         await createBooking({
//             id: "admin-booking",
//             userId: user._id,
//             passengerEmail: "traveler@example.com",
//         });
//         await createBooking({
//             id: "other-booking",
//             userId: otherUserId,
//             passengerEmail: "someone-else@example.com",
//         });

//         const page = await agent.get("/bookings-admin");
//         expect(page.status).toBe(200);
//         expect(page.text).toContain("Manage Bookings");
//         expect(page.text).toContain('data-bookings-scope="all"');

//         const response = await agent.get("/api/bookings_paginated");
//         expect(response.status).toBe(200);
//         expect(response.body.bookings.map((booking) => booking.id)).toEqual(
//             expect.arrayContaining(["admin-booking", "other-booking"])
//         );
//     });

//     test("non-admin users stay scoped to their own bookings even if they request all", async () => {
//         const { agent, user } = await loginAs("customer", "scope-enforcement");
//         const otherUserId = await createUser(
//             "Other User",
//             "other-user-scope",
//             "other-scope@example.com",
//             password
//         );
//         await createBooking({
//             id: "customer-booking",
//             userId: user._id,
//             passengerEmail: "traveler@example.com",
//         });
//         await createBooking({
//             id: "other-booking-scope",
//             userId: otherUserId,
//             passengerEmail: "someone-else@example.com",
//         });

//         const personalPage = await agent.get("/bookings");
//         expect(personalPage.status).toBe(200);
//         expect(personalPage.text).toContain("Your Bookings");
//         expect(personalPage.text).toContain('data-bookings-scope="mine"');
//         expect((await agent.get("/bookings-admin")).status).toBe(403);

//         const response = await agent.get("/api/bookings_paginated?scope=all");
//         expect(response.status).toBe(200);
//         expect(response.body.bookings.map((booking) => booking.id)).toEqual([
//             "customer-booking",
//         ]);
//     });
// });
