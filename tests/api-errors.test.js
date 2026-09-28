import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('API error responses', () => {
  test('returns JSON for malformed registration JSON', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({ error: 'Invalid JSON request body' });
  });
});