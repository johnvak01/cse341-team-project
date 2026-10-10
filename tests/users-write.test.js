import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { User } from '../src/models/schemas/users.js';
import { Role } from '../src/models/schemas/roles.js';
import Booking from '../src/models/schemas/bookings.js';

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

describe('POST /api/users (registration)', () => {
  test('creates a user with a hashed password and the default customer role', async () => {
    const response = await request(app).post('/api/users').send({
      name: 'New Person',
      username: 'new-person',
      email: 'new-person@example.com',
      password
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');

    const stored = await User.findById(response.body.userId).populate('role');
    expect(stored).not.toBeNull();
    expect(stored.role.name).toBe('customer');
    expect(stored.passwordHash).not.toBe(password);
    expect(stored.passwordHash.length).toBeGreaterThan(0);
  });

  test('rejects a request missing required fields', async () => {
    const response = await request(app).post('/api/users').send({ name: 'No Email' });

    expect(response.status).toBe(400);
  });

  test('rejects a duplicate email', async () => {
    await request(app).post('/api/users').send({
      name: 'First',
      username: 'first-user',
      email: 'duplicate@example.com',
      password
    });

    const response = await request(app).post('/api/users').send({
      name: 'Second',
      username: 'second-user',
      email: 'duplicate@example.com',
      password
    });

    expect(response.status).toBe(409);
  });

  test('rejects a duplicate username', async () => {
    await request(app).post('/api/users').send({
      name: 'First',
      username: 'shared-username',
      email: 'first-username@example.com',
      password
    });

    const response = await request(app).post('/api/users').send({
      name: 'Second',
      username: 'shared-username',
      email: 'second-username@example.com',
      password
    });

    expect(response.status).toBe(409);
  });

  test('a signed-in customer may not register another account', async () => {
    const { agent } = await loginAs('customer', 'write-register-forbidden');

    const response = await agent.post('/api/users').send({
      name: 'Blocked',
      username: 'blocked-user',
      email: 'blocked@example.com',
      password
    });

    expect(response.status).toBe(403);
  });

  test('an admin may register a new account while signed in', async () => {
    const { agent } = await loginAs('admin', 'write-register-admin');

    const response = await agent.post('/api/users').send({
      name: 'Admin Created',
      username: 'admin-created-user',
      email: 'admin-created@example.com',
      password
    });

    expect(response.status).toBe(201);
  });
});

describe('PUT /api/users/:id', () => {
  test('a user may update their own name, username, and email', async () => {
    const { agent, userId } = await loginAs('customer', 'write-update-self');

    const response = await agent.put(`/api/users/${userId}`).send({
      name: 'Updated Name',
      username: 'updated-username',
      email: 'updated-self@example.com'
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Updated Name', username: 'updated-username' });

    const stored = await User.findById(userId);
    expect(stored.email).toBe('updated-self@example.com');
  });

  test('a customer may not update another user\'s record', async () => {
    const { agent } = await loginAs('customer', 'write-update-caller');
    const { userId: targetUserId } = await loginAs('customer', 'write-update-target');

    const response = await agent.put(`/api/users/${targetUserId}`).send({
      name: 'Hijacked',
      email: 'hijacked@example.com'
    });

    expect(response.status).toBe(403);
  });

  test('a customer may not change their own role', async () => {
    const { agent, userId } = await loginAs('customer', 'write-update-role-forbidden');

    const response = await agent.put(`/api/users/${userId}`).send({
      name: 'Still Customer',
      email: 'still-customer@example.com',
      role: 'admin'
    });

    expect(response.status).toBe(403);

    const stored = await User.findById(userId).populate('role');
    expect(stored.role.name).toBe('customer');
  });

  test('an admin may change another user\'s role', async () => {
    const { agent } = await loginAs('admin', 'write-update-role-caller');
    const { userId: targetUserId } = await loginAs('customer', 'write-update-role-target');

    const response = await agent.put(`/api/users/${targetUserId}`).send({
      name: 'Promoted User',
      email: 'promoted@example.com',
      role: 'admin'
    });

    expect(response.status).toBe(200);

    const stored = await User.findById(targetUserId).populate('role');
    expect(stored.role.name).toBe('admin');
  });

  test('returns 409 when the new email is already in use', async () => {
    const { userId: firstUserId } = await loginAs('customer', 'write-update-conflict-first');
    const { email: secondEmail } = await loginAs('customer', 'write-update-conflict-second');
    const { agent: adminAgent } = await loginAs('admin', 'write-update-conflict-admin');

    const response = await adminAgent
      .put(`/api/users/${firstUserId}`)
      .send({ name: 'Conflict', email: secondEmail });

    expect(response.status).toBe(409);
  });

  test('returns 404 for a well-formed but unknown user ID', async () => {
    const { agent } = await loginAs('admin', 'write-update-missing');

    const response = await agent.put('/api/users/64b8f0c2e1b2a3d4f5678901').send({
      name: 'Nobody',
      email: 'nobody@example.com'
    });

    expect(response.status).toBe(404);
  });

  test('requires authentication', async () => {
    const { userId } = await loginAs('customer', 'write-update-unauth');

    const response = await request(app).put(`/api/users/${userId}`).send({
      name: 'No Auth',
      email: 'no-auth@example.com'
    });

    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/users/:id', () => {
  const createBookingFor = (userId, id) =>
    Booking.create({
      id,
      userId,
      scheduleId: 1,
      tripId: 'alpine-panorama',
      ticketClass: 'standard',
      selectedDay: 'monday',
      passengers: [{
        firstName: 'Test',
        lastName: 'Passenger',
        email: 'passenger@example.com',
        phone: '555-0100'
      }]
    });

  test('a user may delete their own account, which also removes their bookings', async () => {
    const { agent, userId } = await loginAs('customer', 'write-delete-self');
    await createBookingFor(userId, 'self-delete-booking');

    const response = await agent.delete(`/api/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ deletedSelf: true });
    expect(await User.findById(userId)).toBeNull();
    expect(await Booking.exists({ userId })).toBeFalsy();
  });

  test('a customer may not delete another user\'s account', async () => {
    const { agent } = await loginAs('customer', 'write-delete-caller');
    const { userId: targetUserId } = await loginAs('customer', 'write-delete-target');

    const response = await agent.delete(`/api/users/${targetUserId}`);

    expect(response.status).toBe(403);
    expect(await User.findById(targetUserId)).not.toBeNull();
  });

  test('an admin may delete another user\'s account', async () => {
    const { agent } = await loginAs('admin', 'write-delete-admin-caller');
    const { userId: targetUserId } = await loginAs('customer', 'write-delete-admin-target');

    const response = await agent.delete(`/api/users/${targetUserId}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ deletedSelf: false });
    expect(await User.findById(targetUserId)).toBeNull();
  });

  test('requires authentication', async () => {
    const { userId } = await loginAs('customer', 'write-delete-unauth');

    const response = await request(app).delete(`/api/users/${userId}`);

    expect(response.status).toBe(401);
  });

  test('returns 400 for an invalid user ID', async () => {
    const { agent } = await loginAs('admin', 'write-delete-bad-id');

    const response = await agent.delete('/api/users/not-a-valid-id');

    expect(response.status).toBe(400);
  });

  test('returns 404 for a well-formed but unknown user ID', async () => {
    const { agent } = await loginAs('admin', 'write-delete-missing');

    const response = await agent.delete('/api/users/64b8f0c2e1b2a3d4f5678901');

    expect(response.status).toBe(404);
  });
});
