import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { User } from '../src/models/schemas/users.js';
import { Role } from '../src/models/schemas/roles.js';

const password = 'Password123!';

// Logs a user in through the API and returns an agent that keeps the session cookie
const loginAs = async (role, suffix) => {
  const email = `${role}-${suffix}@example.com`;
  const userId = await createUser(`Test ${role} ${suffix}`, `test-${role}-${suffix}`, email, password);

  if (role === 'admin') {
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.updateOne({ _id: userId }, { role: adminRole._id });
  }

  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ identifier: email, password });
  expect(response.status).toBe(200);

  return { agent, userId, email };
};

describe('GET /api/users', () => {
  test('requires authentication', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
  });

  test('is forbidden for a signed-in customer', async () => {
    const { agent } = await loginAs('customer', 'read-forbidden');

    const response = await agent.get('/api/users');

    expect(response.status).toBe(403);
  });

  test('returns a list to an admin, with password hashes stripped out', async () => {
    const { agent } = await loginAs('admin', 'read-list');
    await loginAs('customer', 'read-list-other');

    const response = await agent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.length).toBeGreaterThan(0);
    response.body.data.forEach((user) => {
      expect(user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(user)).not.toContain('passwordHash');
    });
  });
});

describe('GET /api/users/:id', () => {
  test('requires authentication', async () => {
    const { userId } = await loginAs('customer', 'read-one-target');

    const response = await request(app).get(`/api/users/${userId}`);

    expect(response.status).toBe(401);
  });

  test('a user may retrieve their own record without a password hash', async () => {
    const { agent, userId } = await loginAs('customer', 'read-one-self');

    const response = await agent.get(`/api/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  test('a customer cannot retrieve another user\'s record', async () => {
    const { agent } = await loginAs('customer', 'read-one-other-caller');
    const { userId: otherUserId } = await loginAs('customer', 'read-one-other-target');

    const response = await agent.get(`/api/users/${otherUserId}`);

    expect(response.status).toBe(403);
  });

  test('an admin may retrieve any user\'s record without a password hash', async () => {
    const { agent } = await loginAs('admin', 'read-one-admin-caller');
    const { userId: targetUserId } = await loginAs('customer', 'read-one-admin-target');

    const response = await agent.get(`/api/users/${targetUserId}`);

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  test('returns 400 for an invalid user ID', async () => {
    const { agent } = await loginAs('admin', 'read-one-bad-id');

    const response = await agent.get('/api/users/not-a-valid-id');

    expect(response.status).toBe(400);
  });

  test('returns 404 for a well-formed but unknown user ID', async () => {
    const { agent } = await loginAs('admin', 'read-one-missing');

    const response = await agent.get('/api/users/64b8f0c2e1b2a3d4f5678901');

    expect(response.status).toBe(404);
  });
});
