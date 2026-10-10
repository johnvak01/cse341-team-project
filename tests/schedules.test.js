import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Schedule from '../src/models/schemas/schedules.js';

describe('GET /api/schedules', () => {
  test('returns a successful JSON response with an array', async () => {
    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
  });

  test('returns all 14 schedules from the starter data', async () => {
    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(14);
  });

  test('includes a known seeded schedule with its expected fields', async () => {
    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tripId: 'alpine-panorama',
          departureTime: '08:30',
          arrivalTime: '13:00',
          daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          status: true
        })
      ])
    );
  });

  test('gives every schedule the required fields with the right types', async () => {
    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(200);
    response.body.forEach((schedule) => {
      expect(typeof schedule.id).toBe('number');
      expect(typeof schedule.tripId).toBe('string');
      expect(typeof schedule.departureTime).toBe('string');
      expect(typeof schedule.arrivalTime).toBe('string');
      expect(Array.isArray(schedule.daysOfWeek)).toBe(true);
      expect(typeof schedule.status).toBe('boolean');
    });
  });

  test('returns schedules sorted by id in ascending order', async () => {
    const response = await request(app).get('/api/schedules');
    const ids = response.body.map((schedule) => schedule.id);

    expect(response.status).toBe(200);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  test('returns a schedule added to the test database through Mongoose', async () => {
    await Schedule.create({
      id: 9001,
      tripId: 'alpine-panorama',
      departureTime: '06:00',
      arrivalTime: '10:30',
      daysOfWeek: ['sunday'],
      status: true
    });

    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(15);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 9001, departureTime: '06:00' })
      ])
    );
  });
});

describe('GET /api/schedules/:id', () => {
  test('returns a single schedule by id', async () => {
    const response = await request(app).get('/api/schedules/1');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toMatchObject({
      id: 1,
      tripId: 'alpine-panorama',
      departureTime: '08:30',
      arrivalTime: '13:00',
      status: true
    });
  });

  test('returns an inactive schedule with status false', async () => {
    const response = await request(app).get('/api/schedules/4');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 4,
      tripId: 'coastal-breeze',
      status: false
    });
  });

  test('returns 404 for a schedule id that does not exist', async () => {
    const response = await request(app).get('/api/schedules/9999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Schedule not found' });
  });

  test('returns 400 when the schedule id is not an integer', async () => {
    const response = await request(app).get('/api/schedules/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Schedule ID must be an integer' });
  });
});