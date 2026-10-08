import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns a successful JSON response with data and pagination', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('pagination');
  });

  test('returns the trips from the starter data', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express',
          region: 'central'
        })
      ])
    );
  });

  test('defaults to 10 items per page', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10
    });
  });

  test('paginates results', async () => {
    const response = await request(app).get('/api/trips?limit=2&page=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      hasPreviousPage: false,
      hasNextPage: true
    });
  });

  test('keeps a stable order across pages when sort values tie', async () => {
    const page1 = await request(app).get('/api/trips?sort=region&limit=2&page=1');
    const page2 = await request(app).get('/api/trips?sort=region&limit=2&page=2');

    const ids = [...page1.body.data, ...page2.body.data].map((trip) => trip.id);

    expect(new Set(ids).size).toBe(4);
  });

  test('rejects an invalid page value', async () => {
    const response = await request(app).get('/api/trips?page=abc');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  test('rejects a limit above the maximum', async () => {
    const response = await request(app).get('/api/trips?limit=1000');

    expect(response.status).toBe(400);
  });

  test('rejects an unsupported sort field', async () => {
    const response = await request(app).get('/api/trips?sort=description');

    expect(response.status).toBe(400);
  });
});
