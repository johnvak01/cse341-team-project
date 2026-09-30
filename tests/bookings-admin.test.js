import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { createBooking, getBookingById } from "../src/models/bookings.js";
import { createUser } from "../src/models/users.js";
import { Role } from "../src/models/schemas/roles.js";
import { User } from "../src/models/schemas/users.js";
import { getTripById } from "../src/models/trips.js";

describe("Bookings administration", () => {
    let bookingId;
    let ownerId;
    let passengerId;
    let ownerAgent;
    let passengerAgent;
    let adminAgent;

    beforeEach(async () => {
        const adminId = await createUser(
            "Admin",
            "admin",
            "admin@example.com",
            "password123"
        );
        const ownerUserId = await createUser(
            "Owner",
            "owner",
            "owner@example.com",
            "password123"
        );
        passengerId = await createUser(
            "Passenger",
            "passenger",
            "passenger@example.com",
            "password123"
        );
        const adminRole = await Role.findOne({ name: "admin" });
        await User.findByIdAndUpdate(adminId, { role: adminRole._id });
        ownerId = ownerUserId;

        bookingId = "TESTBOOKING1";
        await createBooking({
            id: bookingId,
            userId: ownerId,
            passengers: [
                {
                    firstName: "Passenger",
                    lastName: "One",
                    email: "Passenger@Example.com",
                    phone: "555-0101",
                },
                {
                    firstName: "Passenger",
                    lastName: "Two",
                    email: "another@example.com",
                    phone: "555-0102",
                },
            ],
            scheduleId: 1,
            tripId: "alpine-panorama",
            ticketClass: "standard",
            selectedDay: "monday",
        });

        ownerAgent = request.agent(app);
        passengerAgent = request.agent(app);
        adminAgent = request.agent(app);
        for (const [agent, username] of [
            [ownerAgent, "owner"],
            [passengerAgent, "passenger"],
            [adminAgent, "admin"],
        ]) {
            const response = await agent
                .post("/api/auth/login")
                .send({ username, password: "password123" });
            expect(response.status).toBe(200);
        }
    });

    test("requires login for the page and allows signed-in users", async () => {
        const anonymousResponse = await request(app).get("/bookings-admin");
        expect(anonymousResponse.status).toBe(302);
        expect(anonymousResponse.headers.location).toBe("/login");

        const ownerResponse = await ownerAgent.get("/bookings-admin");
        expect(ownerResponse.status).toBe(200);
        expect(ownerResponse.text).toContain(
            'class="booking-confirmation-link"'
        );
        expect(ownerResponse.text).toContain('data-field="confirmationId"');
        expect(ownerResponse.text).toContain(
            'class="booking-flow-dialog booking-passenger-dialog"'
        );
        expect(ownerResponse.text).toContain(
            'class="booking-flow-dialog booking-upgrade-dialog"'
        );
        expect(ownerResponse.text).toContain(
            'class="booking-flow-dialog booking-delete-dialog"'
        );

        const confirmationResponse = await ownerAgent.get(
            `/trips/confirmation/${bookingId}`
        );
        expect(confirmationResponse.status).toBe(200);

        const dashboardResponse = await ownerAgent.get("/dashboard");
        expect(dashboardResponse.status).toBe(200);
        expect(dashboardResponse.text).toContain('href="/bookings-admin"');

        const adminResponse = await adminAgent.get("/bookings-admin");
        expect(adminResponse.status).toBe(200);
    });

    test("lists bookings to their creator and admins, not passenger-email matches", async () => {
        const ownerResponse = await ownerAgent.get("/api/bookings");
        expect(ownerResponse.status).toBe(200);
        expect(ownerResponse.body.map((booking) => booking.id)).toContain(
            bookingId
        );

        const passengerResponse = await passengerAgent.get("/api/bookings");
        expect(passengerResponse.status).toBe(200);
        expect(passengerResponse.body.map((booking) => booking.id)).toContain(
            bookingId
        );

        const passengerBookingsResponse = await passengerAgent.get(
            `/api/users/${passengerId}/bookings`
        );
        expect(passengerBookingsResponse.status).toBe(200);
        expect(
            passengerBookingsResponse.body.map((booking) => booking.id)
        ).toContain(bookingId);

        const adminResponse = await adminAgent.get("/api/bookings");
        expect(adminResponse.status).toBe(200);
        expect(adminResponse.body.map((booking) => booking.id)).toContain(
            bookingId
        );
    });

    test("creates an API booking for the authenticated user", async () => {
        const response = await ownerAgent.post("/api/bookings").send({
            scheduleId: 1,
            tripId: "alpine-panorama",
            ticketClass: "standard",
            selectedDay: "monday",
            passengers: [
                {
                    firstName: "Hector",
                    lastName: "Tanaka",
                    email: "hector@example.com",
                    phone: "+81 90-1234-5678",
                },
            ],
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            message: "Booking created successfully",
            confirmationUrl: `/trips/confirmation/${response.body.bookingId}`,
        });
        const createdBooking = await getBookingById(response.body.bookingId);
        expect(String(createdBooking.userId)).toBe(String(ownerId));
        expect(createdBooking.passengers).toHaveLength(1);
    });

    test("rejects a booking request with a non-integer schedule ID", async () => {
        const response = await ownerAgent.post("/api/bookings").send({
            scheduleId: "1",
            tripId: "alpine-panorama",
            ticketClass: "standard",
            selectedDay: "monday",
            passengers: [
                {
                    firstName: "Hector",
                    lastName: "Tanaka",
                    email: "hector@example.com",
                    phone: "+81 90-1234-5678",
                },
            ],
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Invalid booking details" });
    });

    test("quotes and applies a higher class to every seat, rejecting downgrades", async () => {
        const trip = await getTripById("alpine-panorama");
        const quoteResponse = await ownerAgent.get(
            `/api/bookings/${bookingId}/upgrade-quote?ticketClass=premium`
        );

        expect(quoteResponse.status).toBe(200);
        expect(quoteResponse.body).toMatchObject({
            currentTicketClass: "standard",
            targetTicketClass: "premium",
            seatCount: 2,
            priceDifferencePerSeat: trip.distance * 70,
            totalPriceDifference: trip.distance * 70 * 2,
            currency: "JPY",
        });

        const upgradeResponse = await ownerAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ ticketClass: "premium" });
        expect(upgradeResponse.status).toBe(200);
        expect(upgradeResponse.body.ticketClass).toBe("premium");

        const downgradeResponse = await ownerAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ ticketClass: "standard" });
        expect(downgradeResponse.status).toBe(400);
        expect((await getBookingById(bookingId)).ticketClass).toBe("premium");
    });

    test("booking creator can edit passenger details without changing seat count", async () => {
        const booking = await getBookingById(bookingId);
        const passengers = booking.passengers.map((passenger) => ({
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            email: passenger.email,
            phone: passenger.phone,
        }));
        passengers[0] = {
            ...passengers[0],
            firstName: "Updated",
            email: "UPDATED@example.com",
        };

        const updateResponse = await ownerAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ passengers });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.passengers).toHaveLength(2);
        expect(updateResponse.body.passengers[0]).toMatchObject({
            firstName: "Updated",
            email: "updated@example.com",
        });

        const countChangeResponse = await ownerAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ passengers: passengers.slice(0, 1) });
        expect(countChangeResponse.status).toBe(400);
        expect((await getBookingById(bookingId)).passengers).toHaveLength(2);
    });

    test("a passenger cannot quote, edit, or delete someone else’s booking", async () => {
        const quoteResponse = await passengerAgent.get(
            `/api/bookings/${bookingId}/upgrade-quote?ticketClass=premium`
        );
        expect(quoteResponse.status).toBe(403);

        const updateResponse = await passengerAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ ticketClass: "premium" });
        expect(updateResponse.status).toBe(403);

        const passengerEditResponse = await passengerAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ passengers: [] });
        expect(passengerEditResponse.status).toBe(403);

        const deleteResponse = await passengerAgent.delete(
            `/api/bookings/${bookingId}`
        );
        expect(deleteResponse.status).toBe(403);
        expect(await getBookingById(bookingId)).not.toBeNull();
    });

    test("an admin can update and delete another user’s booking", async () => {
        const updateResponse = await adminAgent
            .put(`/api/bookings/${bookingId}`)
            .send({ ticketClass: "premium" });
        expect(updateResponse.status).toBe(200);

        const deleteResponse = await adminAgent.delete(
            `/api/bookings/${bookingId}`
        );
        expect(deleteResponse.status).toBe(200);
        expect(await getBookingById(bookingId)).toBeNull();
    });
});
