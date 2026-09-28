import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createUser } from '../src/models/users.js';
import { Role } from '../src/models/schemas/roles.js';
import { User } from '../src/models/schemas/users.js';

describe('PUT /api/users/:id', () => {
  test('applies the requested role and returns 404 for an unknown user', async () => {
    const adminId = await createUser('Admin', 'admin', 'admin@example.com', 'password123');
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.findByIdAndUpdate(adminId, { role: adminRole._id });

    const userId = await createUser('Hector', 'hector', 'hector@example.com', 'password123');
    const agent = request.agent(app);
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' });

    expect(loginResponse.status).toBe(200);

    const updateResponse = await agent
      .put(`/api/users/${userId}`)
      .send({ name: 'Hector', email: 'hector@example.com', role: '  AdMiN  ' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.role.name).toBe('admin');

    const duplicateEmailResponse = await agent
      .put(`/api/users/${userId}`)
      .send({ name: 'Hector', email: 'admin@example.com' });

    expect(duplicateEmailResponse.status).toBe(409);
    expect(duplicateEmailResponse.body).toEqual({ error: 'Email is already in use' });

    const missingUserResponse = await agent
      .put('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa')
      .send({ name: 'Nobody', email: 'nobody@example.com', role: 'customer' });

    expect(missingUserResponse.status).toBe(404);
    expect(missingUserResponse.body).toEqual({ error: 'User not found' });
  });
});