import { describe, expect, test } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { Role } from '../src/models/schemas/roles.js';
import { User } from '../src/models/schemas/users.js';
import Booking from '../src/models/schemas/bookings.js';

const registerData = {
  name: 'Test User',
  email: 'test.user@example.com',
  password: 'test-password',
};

const createCustomer = async (email = 'customer@example.com', password = 'test-password') => {
  const role = await Role.findOne({ name: 'customer' });
  return User.create({
    name: 'Customer',
    email,
    passwordHash: await bcrypt.hash(password, 4),
    role: role._id,
  });
};

const createAdmin = async (email = 'admin@example.com', password = 'test-password') => {
  const role = await Role.findOne({ name: 'admin' });
  return User.create({
    name: 'Admin',
    email,
    passwordHash: await bcrypt.hash(password, 4),
    role: role._id,
  });
};

describe('website authentication', () => {
  test('only guests and admins can access registration pages or submit forms', async () => {
    await createCustomer();
    const customer = request.agent(app);
    await customer.post('/login').type('form').send({
      email: 'customer@example.com',
      password: 'test-password',
    }).expect(302);

    await customer.get('/login').expect(403);
    await customer.post('/login').type('form').send({
      email: 'customer@example.com',
      password: 'test-password',
    }).expect(403);
    await customer.get('/register').expect(403);
    await customer.post('/register').type('form').send({
      ...registerData,
      'confirm-password': registerData.password,
    }).expect(403);
    expect(await User.findOne({ email: registerData.email })).toBeNull();

    await createAdmin();
    const admin = request.agent(app);
    await admin.post('/login').type('form').send({
      email: 'admin@example.com',
      password: 'test-password',
    }).expect(302);
    await admin.get('/register').expect(200);
    await admin.post('/register').type('form').send({
      ...registerData,
      'confirm-password': registerData.password,
    }).expect(302).expect('Location', '/login');
    expect(await User.findOne({ email: registerData.email })).toBeTruthy();
  });

  test('registration requires matching confirmation and redirects after success', async () => {
    const agent = request.agent(app);

    const registerPage = await agent.get('/register').expect(200);
    expect(registerPage.text).toContain('<script src="/js/register.js" defer></script>');
    expect(registerPage.text).toContain('Passwords must match.');
    expect(registerPage.text).toContain('<button type="submit" disabled>Register</button>');
    expect(registerPage.text.match(/class="auth-password-toggle"/g)).toHaveLength(2);
    await agent.post('/register').type('form').send({
      ...registerData,
      'confirm-password': 'different-password',
    }).expect(302).expect('Location', '/register');
    expect(await User.findOne({ email: registerData.email })).toBeNull();

    await agent.post('/register').type('form').send({
      ...registerData,
      'confirm-password': registerData.password,
    }).expect(302).expect('Location', '/login');
    expect(await User.findOne({ email: registerData.email })).toBeTruthy();

    const duplicate = await agent.post('/register').type('form').send({
      ...registerData,
      'confirm-password': registerData.password,
    }).expect(409);
    expect(duplicate.text).toContain('id="registration-feedback-dialog"');
    expect(duplicate.text).toContain('Email is already in use. Try another email address.');
    expect(duplicate.text).toContain(`value="${registerData.name}"`);
    expect(duplicate.text).toContain(`value="${registerData.email}"`);
  });

  test('login establishes a session and logout clears it', async () => {
    await createCustomer();
    const agent = request.agent(app);

    await agent.post('/login').type('form').send({
      email: 'customer@example.com',
      password: 'test-password',
    }).expect(302).expect('Location', '/dashboard');
    await agent.get('/account').expect(200);

    await agent.post('/logout').expect(302).expect('Location', '/login');
    await agent.get('/account').expect(302).expect('Location', '/login');
  });

  test('login uses the shared stacked auth form and password visibility control', async () => {
    const page = await request(app).get('/login').expect(200);
    expect(page.text).toContain('class="auth-form"');
    expect(page.text).toContain('<script src="/js/password-toggle.js" defer></script>');
    expect(page.text).toContain('class="auth-password-toggle"');
  });

  test('invalid website credentials return to the login page', async () => {
    await createCustomer();
    await request(app).post('/login').type('form').send({
      email: 'customer@example.com',
      password: 'wrong-password',
    }).expect(302).expect('Location', '/login');
  });

  test('website login explains when another account already owns the session', async () => {
    await createAdmin('first@example.com');
    await createCustomer('second@example.com');
    const agent = request.agent(app);

    await agent.post('/login').type('form').send({
      email: 'first@example.com',
      password: 'test-password',
    }).expect(302);
    await agent.get('/login').expect(200);

    const response = await agent.post('/login').type('form').send({
      email: 'second@example.com',
      password: 'test-password',
    }).expect(409);
    expect(response.text).toContain('You are already logged in. Log out before trying to log in again.');
    expect(response.text).toContain('class="auth-feedback-dialog"');
    await agent.get('/admin').expect(200);
  });
});

describe('authentication API', () => {
  test('booking APIs use IDs and restrict user booking lists to owner or admin', async () => {
    const customer = await createCustomer('booking-owner@example.com');
    const otherCustomer = await createCustomer('other-owner@example.com');
    const admin = await createAdmin('booking-admin@example.com');
    const ownerBooking = await Booking.create({
      id: 'owner-booking-id',
      userId: customer._id,
      passengers: [{ firstName: 'Owner', lastName: 'Rider', email: 'owner@example.com', phone: '555-1000' }],
      scheduleId: 1,
      tripId: 'test-trip',
      ticketClass: 'standard',
      selectedDay: 'Monday',
    });
    const otherBooking = await Booking.create({
      id: 'other-booking-id',
      userId: otherCustomer._id,
      passengers: [{ firstName: 'Other', lastName: 'Rider', email: 'other@example.com', phone: '555-2000' }],
      scheduleId: 2,
      tripId: 'test-trip',
      ticketClass: 'standard',
      selectedDay: 'Tuesday',
    });

    const customerAgent = request.agent(app);
    await customerAgent.post('/api/auth/login').send({
      email: 'booking-owner@example.com',
      password: 'test-password',
    }).expect(200);

    const ownBookings = await customerAgent.get(`/api/users/${customer._id}/bookings`).expect(200);
    expect(ownBookings.body.map((booking) => booking.id)).toEqual(['owner-booking-id']);
    await customerAgent.get(`/api/users/${otherCustomer._id}/bookings`).expect(403);
    expect((await customerAgent.get(`/api/bookings/${ownerBooking.id}`).expect(200)).body.id)
      .toBe(ownerBooking.id);
    await customerAgent.get(`/api/bookings/${otherBooking.id}`).expect(403);
    await customerAgent.get('/api/bookings/me').expect(404);

    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({
      email: 'booking-admin@example.com',
      password: 'test-password',
    }).expect(200);
    const adminBookings = await adminAgent.get(`/api/users/${customer._id}/bookings`).expect(200);
    expect(adminBookings.body.map((booking) => booking.id)).toEqual(['owner-booking-id']);
    const otherUserBookings = await adminAgent.get(`/api/users/${otherCustomer._id}/bookings`).expect(200);
    expect(otherUserBookings.body.map((booking) => booking.id)).toEqual(['other-booking-id']);
    expect((await adminAgent.get(`/api/bookings/${otherBooking.id}`).expect(200)).body.id)
      .toBe(otherBooking.id);
  });

  test('only guests and admins can use registration API routes', async () => {
    await createCustomer();
    const customer = request.agent(app);
    await customer.post('/api/auth/login').send({
      email: 'customer@example.com',
      password: 'test-password',
    }).expect(200);

    await customer.post('/api/auth/register').send(registerData).expect(403).expect({
      error: 'Only signed-out users and admins can register accounts',
    });
    await customer.post('/api/users').send(registerData).expect(403);
    expect(await User.findOne({ email: registerData.email })).toBeNull();

    await createAdmin();
    const admin = request.agent(app);
    await admin.post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'test-password',
    }).expect(200);
    await admin.post('/api/auth/register').send(registerData).expect(201);
  });

  test('register, login, and logout use JSON and session authorization', async () => {
    const agent = request.agent(app);

    const registration = await agent.post('/api/auth/register').send(registerData).expect(201);
    expect(registration.body).toMatchObject({ message: 'User registered successfully' });
    expect(registration.body.userId).toBeTruthy();

    const duplicate = await agent.post('/api/auth/register').send(registerData).expect(409);
    expect(duplicate.body.error).toBe('Email is already in use');

    const login = await agent.post('/api/auth/login').send(registerData).expect(200);
    expect(login.body.user).toMatchObject({ email: registerData.email, role: { name: 'customer' } });
    expect(login.body.user).not.toHaveProperty('passwordHash');

    await agent.get(`/api/users/${registration.body.userId}`).expect(200);
    await agent.post('/api/auth/logout').expect(200).expect({ message: 'Logout successful' });
    await agent.get(`/api/users/${registration.body.userId}`).expect(401);
  });

  test('invalid login credentials return JSON errors without creating a session', async () => {
    await createCustomer();
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({
      email: 'customer@example.com',
      password: 'wrong-password',
    }).expect(401).expect({ error: 'Invalid email or password' });
    await agent.post('/api/auth/login').send({ email: 'customer@example.com' })
      .expect(400).expect({ error: 'Email and password are required' });
    await agent.post('/api/auth/logout').expect(401);
  });

  test('API login returns a JSON conflict without replacing the existing session', async () => {
    const firstUser = await createCustomer('first@example.com');
    await createCustomer('second@example.com');
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({
      email: 'first@example.com',
      password: 'test-password',
    }).expect(200);

    await agent.post('/api/auth/login').send({
      email: 'second@example.com',
      password: 'test-password',
    }).expect(409).expect({
      error: 'You are already logged in. Log out before trying to log in again.',
    });

    await agent.get(`/api/users/${firstUser._id}`).expect(200);
    await agent.get(`/api/users/${(await User.findOne({ email: 'second@example.com' }))._id}`).expect(403);
  });
});
