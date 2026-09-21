import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/stations', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
  });

  test('returns the stations from the starter data', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'nagoya',
          name: 'Nagoya Station',
          prefecture: 'Aichi'
        })
      ])
    );
  });

  test('returns a station added to the test database', async () => {
    await getDb().collection('stations').insertOne({
      id: 'test-station',
      name: 'Test Station',
      prefecture: 'Test Prefecture',
      region: 'central',
      facilities: ['restroom']
    });

    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
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

  test('returns 404 for an unknown station id', async () => {
    const response = await request(app).get('/api/stations/not-a-real-station');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
