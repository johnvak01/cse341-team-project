import { describe, expect, test } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { Role } from '../src/models/schemas/roles.js';
import { User } from '../src/models/schemas/users.js';
import Booking from '../src/models/schemas/bookings.js';

const makeUser = async (roleName, email) => {
  const role = await Role.findOne({ name: roleName });
  const user = await User.create({
    name: roleName,
    email,
    passwordHash: await bcrypt.hash('test-password', 4),
    role: role._id
  });
  const agent = request.agent(app);
  await agent.post('/login').type('form').send({ email, password: 'test-password' }).expect(302);
  return { agent, user };
};

describe('protected user administration', () => {
  test('redirects unauthenticated page requests and protects the users API', async () => {
    await request(app).get('/admin/users').expect(302).expect('Location', '/login');
    await request(app).get('/account').expect(302).expect('Location', '/login');
    await request(app).get('/api/users').expect(401);
    await request(app).get('/api/users/507f1f77bcf86cd799439011').expect(401);
    await request(app).put('/api/users/unknown').send({ name: 'Changed', email: 'changed@example.com' }).expect(401);
  });

  test('customers see and manage only their own account', async () => {
    const { agent, user } = await makeUser('customer', 'customer@example.com');
    const other = await makeUser('admin', 'admin@example.com');

    await agent.get('/admin').expect(403);
    await agent.get('/admin/users').expect(403);
    await agent.get('/bookings-admin').expect(403);
    await agent.get('/api/bookings').expect(403);
    const page = await agent.get('/account').expect(200);
    expect(page.text).toContain('<link rel="stylesheet" href="/css/main.css">');
    expect(page.text).toContain('<script src="/js/users.js" defer></script>');
    expect(page.text).toContain(`data-users-endpoint="/api/users/${user._id}"`);
    expect(page.text).not.toContain('<select name="role">');
    const ownAccount = await agent.get(`/api/users/${user._id}`).expect(200);
    expect(ownAccount.body._id).toBe(String(user._id));
    expect(ownAccount.body).not.toHaveProperty('passwordHash');
    await agent.get('/api/users').expect(403);
    await agent.get(`/api/users/${other.user._id}`).expect(403);

    await agent.put(`/api/users/${other.user._id}`)
      .send({ name: 'No access', email: 'changed@example.com' }).expect(403);
    await agent.delete(`/api/users/${other.user._id}`).expect(403);
    await agent.put(`/api/users/${user._id}`).expect(400);

    await agent.put(`/api/users/${user._id}`)
      .send({ name: 'Updated Customer', email: 'updated@example.com', role: 'admin' }).expect(403);
    const updated = await agent.put(`/api/users/${user._id}`)
      .send({ name: 'Updated Customer', email: 'updated@example.com' }).expect(200);
    expect(updated.body).toMatchObject({ name: 'Updated Customer', email: 'updated@example.com' });
    expect(updated.body.role.name).toBe('customer');
    expect(updated.body).not.toHaveProperty('passwordHash');

    await Booking.create({
      id: 'customer-booking',
      userId: user._id,
      passengers: [{ firstName: 'Test', lastName: 'Rider', email: 'rider@example.com', phone: '555-0100' }],
      scheduleId: 1,
      tripId: 'test-trip',
      ticketClass: 'standard',
      selectedDay: 'Monday'
    });
    const deletion = await agent.delete(`/api/users/${user._id}`).expect(200);
    expect(deletion.body.deletedSelf).toBe(true);
    expect(await Booking.countDocuments({ userId: user._id })).toBe(0);
    await agent.get('/api/users').expect(401);
  });

  test('admins can list, update, and delete other users', async () => {
    const { agent, user: adminUser } = await makeUser('admin', 'admin@example.com');
    const { user } = await makeUser('customer', 'customer@example.com');

    const adminUsersPage = await agent.get('/admin/users').expect(200);
    expect(adminUsersPage.text).toContain('<select name="role">');

    const ownAccount = await agent.get(`/api/users/${adminUser._id}`).expect(200);
    expect(ownAccount.body._id).toBe(String(adminUser._id));

    const list = await agent.get('/api/users').expect(200);
    expect(list.body).toHaveLength(2);

    const roleUpdated = await agent.put(`/api/users/${user._id}`)
      .send({ name: 'Admin Updated', email: 'customer-updated@example.com', role: 'admin' })
      .expect(200);
    expect(roleUpdated.body.role.name).toBe('admin');
    await Booking.create({
      id: 'admin-deleted-customer-booking',
      userId: user._id,
      passengers: [{ firstName: 'Test', lastName: 'Rider', email: 'rider@example.com', phone: '555-0100' }],
      scheduleId: 1,
      tripId: 'test-trip',
      ticketClass: 'standard',
      selectedDay: 'Monday'
    });
    const deletion = await agent.delete(`/api/users/${user._id}`).expect(200);
    expect(deletion.body.deletedSelf).toBe(false);
    expect(await Booking.countDocuments({ userId: user._id })).toBe(0);
    await agent.get('/api/users').expect(200).expect((response) => {
      expect(response.body).toHaveLength(1);
    });

    const customerRole = await Role.findOne({ name: 'customer' });
    await User.updateOne({ _id: adminUser._id }, { role: customerRole._id });
    await agent.get('/admin').expect(403);
    await agent.get('/admin/users').expect(403);
    await agent.put(`/api/users/${adminUser._id}`)
      .send({ name: 'Demoted Admin', email: 'admin@example.com', role: 'admin' }).expect(403);
    const demotedAccountPage = await agent.get('/account').expect(200);
    expect(demotedAccountPage.text).not.toContain('<select name="role">');
  });
});