import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";

/* Tests for the GET /api/schedules endpoint */
describe("GET /api/schedules", () => {
    // 1. Test that the endpoint returns all schedules as JSON
    test("returns all schedules successfully", async () => {
        // Arrange
        // The shared test setup seeds the temporary database with schedules.

        // Act
        const response = await request(app).get("/api/schedules");

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
    });

    // 2. Test that the response includes known seeded schedule data
    test("returns schedules with the expected fields and seeded values", async () => {
        // Arrange
        // Schedule 1 is included in the shared schedule seed data.

        // Act
        const response = await request(app).get("/api/schedules");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 1,
                    tripId: "alpine-panorama",
                    departureTime: "08:30",
                    arrivalTime: "13:00",
                    daysOfWeek: [
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                    ],
                    status: true,
                }),
            ])
        );
    });

    // 3. Test that schedules are returned in a stable order without duplicates
    test("returns schedules sorted by id with unique schedule ids", async () => {
        // Arrange
        // The endpoint returns all seeded schedules.

        // Act
        const response = await request(app).get("/api/schedules");
        const scheduleIds = response.body.map((schedule) => schedule.id);

        // Assert
        expect(response.status).toBe(200);
        expect(scheduleIds).toEqual([...scheduleIds].sort((a, b) => a - b));
        expect(new Set(scheduleIds).size).toBe(scheduleIds.length);
    });
});

/* Tests for the GET /api/schedules/:id endpoint */
describe("GET /api/schedules/:id", () => {
    // 1. Test that the endpoint returns one seeded schedule by id
    test("returns the requested schedule with its expected fields", async () => {
        // Arrange
        const scheduleId = 1;

        // Act
        const response = await request(app).get(`/api/schedules/${scheduleId}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.body).toMatchObject({
            id: scheduleId,
            tripId: "alpine-panorama",
            departureTime: "08:30",
            arrivalTime: "13:00",
            daysOfWeek: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
            ],
            status: true,
        });
    });

    // 2. Test that schedule detail matches its record in the schedule list
    test("returns the same schedule data as the schedule list", async () => {
        // Arrange
        const scheduleId = 2;

        // Act
        const listResponse = await request(app).get("/api/schedules");
        const detailResponse = await request(app).get(
            `/api/schedules/${scheduleId}`
        );
        const listedSchedule = listResponse.body.find(
            (schedule) => schedule.id === scheduleId
        );

        // Assert
        expect(listResponse.status).toBe(200);
        expect(detailResponse.status).toBe(200);
        expect(listedSchedule).toBeDefined();
        expect(detailResponse.body).toMatchObject(listedSchedule);
    });

    // 3. Test that an unknown schedule id returns a not-found response
    test("returns 404 when the schedule does not exist", async () => {
        // Arrange
        const scheduleId = 9999;

        // Act
        const response = await request(app).get(`/api/schedules/${scheduleId}`);

        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toContain("not found");
        expect(response.body).not.toHaveProperty("id");
    });

    // 4. Test that a non-integer schedule id is rejected
    test("returns 400 when the schedule id is not an integer", async () => {
        // Arrange
        const scheduleId = "not-a-number";

        // Act
        const response = await request(app).get(`/api/schedules/${scheduleId}`);

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toContain("integer");
    });
});

/* Tests for the relationship between schedules and trips */
describe("GET /api/trips/:tripId/schedules schedule relationships", () => {
    // 1. Test that a known schedule references its expected trip
    test("returns the trip referenced by a known schedule", async () => {
        // Arrange
        const scheduleId = 1;

        // Act
        const scheduleResponse = await request(app).get(
            `/api/schedules/${scheduleId}`
        );
        const tripResponse = await request(app).get(
            `/api/trips/${scheduleResponse.body.tripId}`
        );

        // Assert
        expect(scheduleResponse.status).toBe(200);
        expect(scheduleResponse.body.tripId).toBe("alpine-panorama");
        expect(tripResponse.status).toBe(200);
        expect(tripResponse.body).toMatchObject({
            id: "alpine-panorama",
            name: "Alpine Panorama Express",
        });
    });

    // 2. Test that a trip's schedules contain only schedules connected to it
    test("returns only schedules connected to the selected trip", async () => {
        // Arrange
        const tripId = "alpine-panorama";

        // Act
        const response = await request(app).get(
            `/api/trips/${tripId}/schedules`
        );

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/json");
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.map((schedule) => schedule.id)).toEqual([1, 2]);
        expect(
            response.body.every((schedule) => schedule.tripId === tripId)
        ).toBe(true);
    });

    // 3. Test that an unknown trip returns a not-found response
    test("returns 404 when the selected trip does not exist", async () => {
        // Arrange
        const tripId = "not-a-real-trip";

        // Act
        const response = await request(app).get(
            `/api/trips/${tripId}/schedules`
        );

        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toContain("not found");
        expect(response.body).not.toBeInstanceOf(Array);
    });

    // 4. Test that the trip schedule endpoint rejects an invalid month
    test("returns 400 when the requested month is invalid", async () => {
        // Arrange
        const tripId = "alpine-panorama";

        // Act
        const response = await request(app).get(
            `/api/trips/${tripId}/schedules?month=13`
        );

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toContain("month");
    });
});
