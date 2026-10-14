import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Trip from '../src/models/schemas/trips.js';

describe('trip and station relationship', () => {
  test('a known trip has the expected origin and destination station ids', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 'alpine-panorama',
      startStation: 'nagoya',
      endStation: 'toyama'
    });
  });

  test('the origin and destination of a known trip resolve to the right station records', async () => {
    const tripResponse = await request(app).get('/api/trips/alpine-panorama');

    const originResponse = await request(app).get(
      `/api/stations/${tripResponse.body.startStation}`
    );
    const destinationResponse = await request(app).get(
      `/api/stations/${tripResponse.body.endStation}`
    );

    expect(originResponse.status).toBe(200);
    expect(originResponse.body).toMatchObject({
      id: 'nagoya',
      name: 'Nagoya Station',
      prefecture: 'Aichi'
    });
    expect(destinationResponse.status).toBe(200);
    expect(destinationResponse.body).toMatchObject({
      id: 'toyama',
      name: 'Toyama Station',
      prefecture: 'Toyama'
    });
  });

  test('a second known trip resolves to its own origin and destination stations', async () => {
    const tripResponse = await request(app).get('/api/trips/sakura-valley');

    const originResponse = await request(app).get(
      `/api/stations/${tripResponse.body.startStation}`
    );
    const destinationResponse = await request(app).get(
      `/api/stations/${tripResponse.body.endStation}`
    );

    expect(tripResponse.status).toBe(200);
    expect(originResponse.status).toBe(200);
    expect(originResponse.body.name).toBe('Osaka Station');
    expect(destinationResponse.status).toBe(200);
    expect(destinationResponse.body.name).toBe('Wakayama Station');
  });

  test('every seeded trip has origin and destination ids that match real stations', async () => {
    const trips = await Trip.find({}).lean();

    expect(trips).toHaveLength(6);

    for (const trip of trips) {
      const originResponse = await request(app).get(`/api/stations/${trip.startStation}`);
      const destinationResponse = await request(app).get(`/api/stations/${trip.endStation}`);

      expect(originResponse.status).toBe(200);
      expect(originResponse.body.id).toBe(trip.startStation);
      expect(destinationResponse.status).toBe(200);
      expect(destinationResponse.body.id).toBe(trip.endStation);
    }
  });

  test('every seeded trip starts and ends at different stations', async () => {
    const trips = await Trip.find({}).lean();

    trips.forEach((trip) => {
      expect(trip.startStation).not.toBe(trip.endStation);
    });
  });

  test('a trip that points to a station that does not exist returns 404 for that station', async () => {
    await Trip.create({
      id: 'ghost-route',
      name: 'Ghost Route',
      description: 'A trip created only for this test.',
      startStation: 'nagoya',
      endStation: 'atlantis',
      trainId: 'series-e353',
      duration: '1 hour',
      distance: 10
    });

    const tripResponse = await request(app).get('/api/trips/ghost-route');
    const destinationResponse = await request(app).get(
      `/api/stations/${tripResponse.body.endStation}`
    );

    expect(tripResponse.status).toBe(200);
    expect(tripResponse.body.endStation).toBe('atlantis');
    expect(destinationResponse.status).toBe(404);
    expect(destinationResponse.body).toEqual({ error: 'Station not found' });
  });

  test('returns 404 for a trip id that does not exist', async () => {
    const response = await request(app).get('/api/trips/not-a-real-trip');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Trip not found' });
  });
});