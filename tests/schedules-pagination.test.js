import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/schedules pagination', () => {
  test('returns the plain array when no paging params are sent', async () => {
    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(14);
  });

  test('returns the first page with metadata', async () => {
    const response = await request(app).get('/api/schedules?page=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(10);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 14,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });
  });

  test('page 2 has the rest, with no overlap with page 1', async () => {
    const page1 = await request(app).get('/api/schedules?page=1');
    const page2 = await request(app).get('/api/schedules?page=2');

    expect(page2.body.data).toHaveLength(4);
    expect(page2.body.pagination).toMatchObject({ hasNextPage: false, hasPreviousPage: true });

    const ids = [...page1.body.data, ...page2.body.data].map((schedule) => schedule.id);
    expect(new Set(ids).size).toBe(14);
  });

  test('a page past the end returns an empty list', async () => {
    const response = await request(app).get('/api/schedules?page=3');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test('sorts by the requested field and order', async () => {
    const response = await request(app).get('/api/schedules?sort=arrivalTime&order=desc&limit=50');
    const times = response.body.data.map((schedule) => schedule.arrivalTime);

    expect(response.status).toBe(200);
    expect(times).toEqual([...times].sort().reverse());
  });

  test.each([
    ['page=0', 'page'],
    ['page=abc', 'page'],
    ['limit=0', 'limit'],
    ['limit=51', 'limit'],
    ['sort=status', 'sort'],
    ['order=up', 'order']
  ])('returns 400 for %s', async (query, field) => {
    const response = await request(app).get(`/api/schedules?${query}`);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([expect.objectContaining({ field })]);
  });
});

describe('GET /api/schedules filters', () => {
  test('filters by trip', async () => {
    const response = await request(app).get('/api/schedules?tripId=alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    response.body.data.forEach((schedule) => expect(schedule.tripId).toBe('alpine-panorama'));
  });

  test('filters by train, using the trips that run on it', async () => {
    const trips = await request(app).get('/api/trains/steam-c11/trips');
    const tripIds = trips.body.trips.map((trip) => trip.id);

    const response = await request(app).get('/api/schedules?trainId=steam-c11&limit=50');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    response.body.data.forEach((schedule) => expect(tripIds).toContain(schedule.tripId));
  });

  test('filters by day of the week', async () => {
    const response = await request(app).get('/api/schedules?dayOfWeek=sunday&limit=50');

    expect(response.status).toBe(200);
    response.body.data.forEach((schedule) => expect(schedule.daysOfWeek).toContain('sunday'));
  });

  test('filters by a departure time range, including the ends', async () => {
    const response = await request(app).get('/api/schedules?startTime=09:00&endTime=11:00&limit=50');
    const times = response.body.data.map((schedule) => schedule.departureTime);

    expect(response.status).toBe(200);
    expect(times).toContain('09:00');
    expect(times).toContain('11:00');
    times.forEach((time) => {
      expect(time >= '09:00').toBe(true);
      expect(time <= '11:00').toBe(true);
    });
  });

  test('combines filters, and totalItems counts only the matches', async () => {
    const response = await request(app).get('/api/schedules?tripId=alpine-panorama&dayOfWeek=monday');

    expect(response.status).toBe(200);
    expect(response.body.pagination.totalItems).toBe(response.body.data.length);
    response.body.data.forEach((schedule) => {
      expect(schedule.tripId).toBe('alpine-panorama');
      expect(schedule.daysOfWeek).toContain('monday');
    });
  });

  test('returns the applied filters in the query object', async () => {
    const response = await request(app).get('/api/schedules?trainId=steam-c11&dayOfWeek=Monday&startTime=09:00');

    expect(response.body.query).toEqual({
      tripId: null,
      trainId: 'steam-c11',
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: null
    });
  });

  test('a trip or train that does not exist returns an empty list', async () => {
    const byTrip = await request(app).get('/api/schedules?tripId=not-a-trip');
    const byTrain = await request(app).get('/api/schedules?trainId=not-a-train');

    expect(byTrip.status).toBe(200);
    expect(byTrip.body.data).toEqual([]);
    expect(byTrain.status).toBe(200);
    expect(byTrain.body.data).toEqual([]);
  });

  test.each([
    ['tripId=', 'tripId'],
    ['trainId=', 'trainId'],
    ['dayOfWeek=funday', 'dayOfWeek'],
    ['startTime=25:00', 'startTime'],
    ['endTime=9am', 'endTime'],
    ['startTime=14:00&endTime=09:00', 'startTime']
  ])('returns 400 for %s', async (query, field) => {
    const response = await request(app).get(`/api/schedules?${query}`);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([expect.objectContaining({ field })]);
  });
});

describe('/timetable page', () => {
  test('renders the timetable page', async () => {
    const response = await request(app).get('/timetable');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="timetable-table"');
  });
});
