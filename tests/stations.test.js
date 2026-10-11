import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Station from '../src/models/schemas/stations.js';

describe('GET /api/stations', () => {
  test('returns a successful JSON response with an array', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
  });

  test('returns all 12 stations from the starter data', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(12);
  });

  test('includes known seeded stations with their expected fields', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'nagoya',
          name: 'Nagoya Station',
          prefecture: 'Aichi',
          region: 'central'
        }),
        expect.objectContaining({
          id: 'osaka',
          name: 'Osaka Station',
          prefecture: 'Osaka',
          region: 'kansai'
        })
      ])
    );
  });

  test('gives every station the required fields with the right types', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    response.body.forEach((station) => {
      expect(typeof station.id).toBe('string');
      expect(typeof station.name).toBe('string');
      expect(Array.isArray(station.facilities)).toBe(true);
    });
  });

  test('returns stations sorted by id in ascending order', async () => {
    const response = await request(app).get('/api/stations');
    const ids = response.body.map((station) => station.id);

    expect(response.status).toBe(200);
    expect(ids).toEqual([...ids].sort());
  });

  test('returns a station added to the test database through Mongoose', async () => {
    await Station.create({
      id: 'test-station',
      name: 'Test Station',
      prefecture: 'Test Prefecture',
      region: 'central',
      facilities: ['restroom']
    });

    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(13);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-station',
          name: 'Test Station'
        })
      ])
    );
  });
});

describe('GET /api/stations/:id', () => {
  test('returns a single station by id', async () => {
    const response = await request(app).get('/api/stations/osaka');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toMatchObject({
      id: 'osaka',
      name: 'Osaka Station',
      prefecture: 'Osaka'
    });
    expect(response.body.facilities).toEqual(
      expect.arrayContaining(['restaurant', 'shop', 'restroom'])
    );
  });

  test('returns the station that matches the requested id', async () => {
    const response = await request(app).get('/api/stations/nagoya');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 'nagoya',
      name: 'Nagoya Station',
      prefecture: 'Aichi',
      region: 'central'
    });
  });

  test('returns 404 for an unknown station id', async () => {
    const response = await request(app).get('/api/stations/not-a-real-station');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Station not found' });
  });
});