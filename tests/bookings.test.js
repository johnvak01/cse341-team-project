import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { Role } from '../src/models/schemas/roles.js';
import { User } from '../src/models/schemas/users.js';

describe('GET /api/users/:userId/bookings', () => {
  let agent;
  let userId;

  beforeEach(async () => {
    const adminId = await createUser('Admin', 'admin', 'admin@example.com', 'password123');
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.findByIdAndUpdate(adminId, { role: adminRole._id });
    userId = await createUser('Hector', 'hector', 'hector@example.com', 'password123');

    agent = request.agent(app);
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' });

    expect(loginResponse.status).toBe(200);
  });

  test('returns JSON 400 for a malformed user ID', async () => {
    const response = await agent.get('/api/users/not-an-object-id/bookings');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid user ID' });
  });

  test('returns 404 for a user that does not exist', async () => {
    const response = await agent.get('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa/bookings');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

  test('returns 404 when a user has no bookings', async () => {
    const response = await agent.get(`/api/users/${userId}/bookings`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User has no bookings' });
  });
});