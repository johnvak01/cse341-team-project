import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('trains');
    expect(response.body.trains).toBeInstanceOf(Array);
  });

  test('returns the trains from the starter data', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(4);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric'
        })
      ])
    );
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );
  });
});

describe('GET /api/trains/:id/trips', () => {
  test('returns the trips assigned to that train', async () => {
    const response = await request(app).get('/api/trains/series-e353/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('trips');
    expect(response.body.trips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'alpine-panorama', trainId: 'series-e353' })
      ])
    );
    response.body.trips.forEach((trip) => {
      expect(trip.trainId).toBe('series-e353');
    });
  });

  test('returns an empty array for a train with no trips', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains/test-express/trips');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
  });

  test('returns 404 for an unknown train id', async () => {
    const response = await request(app).get('/api/trains/not-a-real-train/trips');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
