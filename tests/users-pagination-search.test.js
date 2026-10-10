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

describe('GET /api/users pagination', () => {
  test('defaults to page 1 with a limit of 10, sorted by username', async () => {
    const { agent } = await loginAs('admin', 'page-defaults');

    const response = await agent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 10 });
  });

  test('paginates results', async () => {
    const { agent } = await loginAs('admin', 'page-paginate');
    for (let i = 0; i < 3; i += 1) {
      await loginAs('customer', `page-paginate-${i}`);
    }

    const response = await agent.get('/api/users?limit=2&page=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      hasPreviousPage: false,
      hasNextPage: true
    });
  });

  test('rejects an invalid page value', async () => {
    const { agent } = await loginAs('admin', 'page-bad-page');

    const response = await agent.get('/api/users?page=abc');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  test('rejects a limit above the maximum', async () => {
    const { agent } = await loginAs('admin', 'page-bad-limit');

    const response = await agent.get('/api/users?limit=1000');

    expect(response.status).toBe(400);
  });

  test('rejects an unsupported sort field', async () => {
    const { agent } = await loginAs('admin', 'page-bad-sort');

    const response = await agent.get('/api/users?sort=passwordHash');

    expect(response.status).toBe(400);
  });
});

describe('GET /api/users role filtering', () => {
  test('filters by role', async () => {
    const { agent } = await loginAs('admin', 'role-filter');
    await loginAs('customer', 'role-filter-customer');

    const response = await agent.get('/api/users?role=admin&limit=50');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    response.body.data.forEach((user) => {
      expect(user.role.name).toBe('admin');
    });
  });

  test('rejects an unsupported role filter', async () => {
    const { agent } = await loginAs('admin', 'role-bad-filter');

    const response = await agent.get('/api/users?role=superuser');

    expect(response.status).toBe(400);
  });
});

describe('GET /api/users keyword search', () => {
  test('searches by keyword across name, username, and email', async () => {
    const { agent } = await loginAs('admin', 'search-keyword');
    await createUser('Keyword Match', 'findable-user', 'findable@example.com', password);

    const response = await agent.get('/api/users?q=findable');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: 'findable-user' })
      ])
    );
    expect(response.body.query).toMatchObject({ q: 'findable' });
  });

  test('returns an empty data array when the search has no matches', async () => {
    const { agent } = await loginAs('admin', 'search-empty');

    const response = await agent.get('/api/users?q=nonexistent-keyword-xyz');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.pagination.totalUsers).toBe(0);
  });

  test('rejects a search term over the max length', async () => {
    const { agent } = await loginAs('admin', 'search-too-long');

    const response = await agent.get('/api/users?q=' + 'a'.repeat(101));

    expect(response.status).toBe(400);
  });
});
