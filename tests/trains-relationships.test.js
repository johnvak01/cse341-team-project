import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { User } from '../src/models/schemas/users.js';
import { Role } from '../src/models/schemas/roles.js';
import Trip from '../src/models/schemas/trips.js';

const seededTrainIds = ['series-e353', 'kiha-261', 'series-287', 'steam-c11'];

// Logs in an admin through the API. The email is unique to this file so it can't clash with shared test users.
const loginAsAdmin = async () => {
  const email = 'relationships-admin@example.com';
  const password = 'Password123!';
  const userId = await createUser('Relationships Admin', 'relationships-admin', email, password);
  const adminRole = await Role.findOne({ name: 'admin' });
  await User.updateOne({ _id: userId }, { role: adminRole._id });

  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ identifier: email, password });
  expect(response.status).toBe(200);

  return agent;
};

describe('train and trip relationships', () => {
  test('every seeded trip references a real train', async () => {
    // /api/trips is paginated, so ask for up to 50 to get every seeded trip
    const trips = await request(app).get('/api/trips?limit=50');

    expect(trips.status).toBe(200);
    expect(trips.body.data.length).toBeGreaterThan(0);

    for (const trip of trips.body.data) {
      const train = await request(app).get(`/api/trains/${trip.trainId}`);
      expect(train.status).toBe(200);
      expect(train.body.id).toBe(trip.trainId);
    }
  });

  test("a known trip's train lists that trip", async () => {
    const trip = await request(app).get('/api/trips/alpine-panorama');
    expect(trip.body.trainId).toBe('series-e353');

    const trainTrips = await request(app).get('/api/trains/series-e353/trips');
    const tripIds = trainTrips.body.trips.map((t) => t.id);

    expect(trainTrips.status).toBe(200);
    expect(tripIds).toContain('alpine-panorama');
  });

  test('the trips-by-train endpoint only returns that train\'s trips', async () => {
    const response = await request(app).get('/api/trains/steam-c11/trips');

    expect(response.status).toBe(200);
    expect(response.body.trips.length).toBeGreaterThan(0);
    response.body.trips.forEach((trip) => expect(trip.trainId).toBe('steam-c11'));
  });

  test('every trip appears under exactly one train', async () => {
    const trips = await request(app).get('/api/trips?limit=50');
    const allTripIds = trips.body.data.map((trip) => trip.id).sort();

    const listedTripIds = [];
    for (const trainId of seededTrainIds) {
      const response = await request(app).get(`/api/trains/${trainId}/trips`);
      listedTripIds.push(...response.body.trips.map((trip) => trip.id));
    }

    expect(listedTripIds.sort()).toEqual(allTripIds);
  });

  test('moving a trip to another train updates both sides of the relationship', async () => {
    const admin = await loginAsAdmin();

    const move = await admin.put('/api/trips/alpine-panorama/train').send({ trainId: 'kiha-261' });
    expect(move.status).toBe(200);

    const newTrainTrips = await request(app).get('/api/trains/kiha-261/trips');
    const oldTrainTrips = await request(app).get('/api/trains/series-e353/trips');
    expect(newTrainTrips.body.trips.map((trip) => trip.id)).toContain('alpine-panorama');
    expect(oldTrainTrips.body.trips.map((trip) => trip.id)).not.toContain('alpine-panorama');

    // Check the temporary database directly to prove the change was saved
    const savedTrip = await Trip.findOne({ id: 'alpine-panorama' }).lean();
    expect(savedTrip.trainId).toBe('kiha-261');
  });
});
