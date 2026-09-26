import request from 'supertest';
import { app } from '../../app';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Clean DB
    await prisma.jobStatusHistory.deleteMany({});
    await prisma.jobPhoto.deleteMany({});
    await prisma.jobAssignment.deleteMany({});
    await prisma.jobNote.deleteMany({});
    await prisma.worker.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let adminToken = '';
  let refreshToken = '';

  it('should create an admin via bootstrap', async () => {
    const res = await request(app).post('/api/auth/bootstrap').send({
      email: 'admin@test.com',
      password: 'password123',
      bootstrapSecret: 'INSECURE_BOOTSTRAP_123'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should login admin and return tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    
    // Extract cookies
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toContain('refreshToken');
    
    adminToken = res.body.data.accessToken;
    refreshToken = setCookie[0].split(';')[0].split('=')[1];
  });

  it('should access admin-only endpoint with admin token', async () => {
    const res = await request(app).get('/api/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should fail to access worker-only endpoint with admin token', async () => {
    const res = await request(app).get('/api/worker-only')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('should refresh token using httpOnly cookie', async () => {
    // Wait 1 second to ensure new JWT iat timestamp
    await new Promise((r) => setTimeout(r, 1000));
    const res = await request(app).post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.accessToken).not.toBe(adminToken);
  });

  it('should logout and invalidate refresh token', async () => {
    const res = await request(app).post('/api/auth/logout')
      .set('Cookie', `refreshToken=${refreshToken}`);
    expect(res.status).toBe(200);
    
    // Attempt refresh again with same token (should fail)
    const refreshRes = await request(app).post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);
    expect(refreshRes.status).toBe(401);
  });
});
