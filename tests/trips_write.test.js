import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { Role } from '../src/models/schemas/roles.js';
import { User } from '../src/models/schemas/users.js';
import Trip from '../src/models/schemas/trips.js';

const password = "Password123!";

const loginAs = async (role, suffix) => {
    const email = `${role}-${suffix}@example.com`;
    const userId = await createUser(
        `Test ${role}`,
        `test-${role}-${suffix}`,
        email,
        password
    );

    if (role === "admin") {
        const adminRole = await Role.findOne({ name: "admin" });
        await User.updateOne({ _id: userId }, { role: adminRole._id });
    }

    const agent = request.agent(app);
    const response = await agent
        .post("/api/auth/login")
        .send({ identifier: email, password });
    expect(response.status).toBe(200);

    return {
        agent,
        user: await User.findById(userId),
    };
};

describe( 'PUT /api/trips/:id', () => {

    test('Allow admin to update a trip', async () => {
        
        const {agent} = await loginAs('admin', 'update-trip');

        const before = await Trip.findOne({ id: 'alpine-panorama'}).lean();
        expect(before.name).toBe('Alpine Panorama Express');

        const response = await agent.put('/api/trips/alpine-panorama').send({
            name: 'Alpine Panorama 211',
            description: 'japan trip',
            startStation: 'Kameoka Station',
            endStation: 'Osaka Station',
            distance: 800
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Trip and schedule associations updated successfully');
        expect(response.body.wasModified).toBe(true);

        
        const saved = await Trip.findOne({ id: 'alpine-panorama'}).lean();
        expect(saved).toMatchObject({
            name: 'Alpine Panorama 211',
            description: 'japan trip',
            startStation: 'Kameoka Station',
            endStation: 'Osaka Station',
            distance: 800
        })
        expect(saved.region).toBe('central');
    });

    test('Prevent non-admin from updating a trip', async () => {
        const {agent} = await loginAs('customer', 'update-trip');

        const response = await agent.put('/api/trips/alpine-panorama').send({
            name: 'Alpine Panorama 211',
            description: 'japan trip',
            startStation: 'Kameoka Station',
            endStation: 'Osaka Station',
            distance: 800
        });


        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden');

        const unchanged = await Trip.findOne({ id: 'alpine-panorama'}).lean();
        expect(unchanged.name).toBe('Alpine Panorama Express');
        expect(unchanged.distance).toBe(180);
    });


});

describe('DELETE /api/trips/:id', () => {

    test('Allow admin to delete a trip', async () => {
        const {agent} = await loginAs('admin', 'delete-trip');

        const before = await Trip.findOne({ id: 'alpine-panorama'}).lean();
        expect(before).not.toBeNull();

        const response = await agent.delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Trip and associated schedule were successfuly deleted');

        const after = await Trip.findOne({ id: 'alpine-panorama'}).lean();
        expect(after).toBeNull();
    });

    test('Prevent non-admin from deleting a trip', async () => {
        const {agent} = await loginAs('customer', 'delete-trip');

        const response = await agent.delete('/api/trips/alpine-panorama');

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden');

        const unchanged = await Trip.findOne({ id: 'alpine-panorama'}).lean();
        expect(unchanged).not.toBeNull();
    });
});