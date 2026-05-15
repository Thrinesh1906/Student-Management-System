import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { User } from '../models/User';
import { hashPassword } from '../services/authService';
import { config } from '../config';

const app = createApp();

async function getAdminToken(): Promise<string> {
  const user = await User.create({
    email: 'admin2@test.com',
    password: await hashPassword('password123'),
    firstName: 'Admin',
    lastName: 'Test',
    role: 'admin',
  });
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: 'admin' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

describe('Students API', () => {
  it('should create a student', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'newstudent@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Student',
        studentId: 'STU001',
        department: 'CS',
        year: 1,
        semester: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.studentId).toBe('STU001');
  });

  it('should reject unauthorized access', async () => {
    const res = await request(app).get('/api/v1/students');
    expect(res.status).toBe(401);
  });
});
