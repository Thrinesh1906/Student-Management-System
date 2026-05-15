import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { hashPassword } from '../services/authService';

const app = createApp();

describe('Auth API', () => {
  beforeEach(async () => {
    await User.create({
      email: 'admin@test.com',
      password: await hashPassword('password123'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });
  });

  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('should return health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
