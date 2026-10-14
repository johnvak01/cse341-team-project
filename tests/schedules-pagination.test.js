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

describe('/timetable page', () => {
  test('renders the timetable page', async () => {
    const response = await request(app).get('/timetable');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="timetable-table"');
  });
});
