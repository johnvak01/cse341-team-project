import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/schedules/:id', () => {
  test('returns JSON 400 when the schedule ID is not an integer', async () => {
    const response = await request(app).get('/api/schedules/afda');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({ error: 'Schedule ID must be an integer' });
  });

  test('looks up schedules by integer ID', async () => {
    const response = await request(app).get('/api/schedules/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  test('returns 404 for an integer ID that does not exist', async () => {
    const response = await request(app).get('/api/schedules/9999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Schedule not found' });
  });
});