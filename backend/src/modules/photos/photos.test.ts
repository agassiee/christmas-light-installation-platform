import request from 'supertest';
import { app } from '../../app';
import { PrismaClient, Role, JobType, JobStatus, PhotoType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

const prisma = new PrismaClient();

describe('Photos API', () => {
  let adminToken: string;
  let workerToken: string;
  let unassignedWorkerToken: string;
  let jobId: string;
  let adminId: string;
  let workerId: string;
  let unassignedWorkerId: string;

  beforeAll(async () => {
    // 1. Create Users
    const adminUser = await prisma.user.create({
      data: { email: 'admin-photo@test.com', passwordHash: 'hash', role: Role.ADMIN },
    });
    adminId = adminUser.id;
    adminToken = jwt.sign({ userId: adminId, role: Role.ADMIN }, env.JWT_ACCESS_SECRET);

    const workerUser = await prisma.user.create({
      data: { email: 'worker-photo@test.com', passwordHash: 'hash', role: Role.WORKER },
    });
    workerId = workerUser.id;
    workerToken = jwt.sign({ userId: workerId, role: Role.WORKER }, env.JWT_ACCESS_SECRET);
    
    const unassignedWorkerUser = await prisma.user.create({
      data: { email: 'unassigned-worker-photo@test.com', passwordHash: 'hash', role: Role.WORKER },
    });
    unassignedWorkerId = unassignedWorkerUser.id;
    unassignedWorkerToken = jwt.sign({ userId: unassignedWorkerId, role: Role.WORKER }, env.JWT_ACCESS_SECRET);

    // 2. Create Worker Profiles
    const workerProfile = await prisma.worker.create({
      data: { userId: workerId, fullName: 'Test Worker', phone: '123' },
    });
    await prisma.worker.create({
      data: { userId: unassignedWorkerId, fullName: 'Unassigned Worker', phone: '456' },
    });

    // 3. Create Customer & Property
    const customer = await prisma.customer.create({
      data: { fullName: 'Photo Customer', phone: '123' },
    });
    const property = await prisma.property.create({
      data: { customerId: customer.id, addressLine1: '123 Photo St', city: 'City', state: 'ST', postalCode: '12345', country: 'USA' },
    });
    const season = await prisma.serviceSeason.create({
      data: { propertyId: property.id, seasonLabel: '2026-Photo' },
    });

    // 4. Create Job & Assignment
    const job = await prisma.job.create({
      data: {
        propertyId: property.id,
        serviceSeasonId: season.id,
        type: JobType.INSTALLATION,
        status: JobStatus.SCHEDULED,
        scheduledDate: new Date(),
      },
    });
    jobId = job.id;

    await prisma.jobAssignment.create({
      data: {
        jobId,
        workerId: workerProfile.id,
        isLead: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.jobPhoto.deleteMany();
    await prisma.jobAssignment.deleteMany();
    await prisma.jobStatusHistory.deleteMany();
    await prisma.job.deleteMany();
    await prisma.serviceSeason.deleteMany();
    await prisma.property.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('generates upload signature for assigned worker', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/photos/upload-signature`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ type: PhotoType.BEFORE });

    expect(res.status).toBe(200);
    expect(res.body.signature).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.folder).toBe(`christmas-lights/jobs/${jobId}/before`);
    expect(res.body.api_key).toBeDefined();
    expect(res.body.cloud_name).toBeDefined();
    // NEVER RETURN API SECRET
    expect(res.body.api_secret).toBeUndefined();
  });

  it('rejects signature generation for unassigned worker', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/photos/upload-signature`)
      .set('Authorization', `Bearer ${unassignedWorkerToken}`)
      .send({ type: PhotoType.BEFORE });

    expect(res.status).toBe(403);
  });

  it('allows assigned worker to create photo metadata', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/photos`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        type: PhotoType.BEFORE,
        storageKey: `christmas-lights/jobs/${jobId}/before/test-id-123`,
        url: 'https://res.cloudinary.com/demo/image/upload/v12345/test.jpg'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('rejects mismatched storageKey', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/photos`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        type: PhotoType.BEFORE,
        storageKey: `christmas-lights/jobs/different-job-id/before/test-id-123`,
        url: 'https://res.cloudinary.com/demo/image/upload/v12345/test.jpg'
      });

    expect(res.status).toBe(400);
  });

  it('allows assigned worker to list photos', async () => {
    const res = await request(app)
      .get(`/api/jobs/${jobId}/photos`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
  
  it('rejects unassigned worker listing photos', async () => {
    const res = await request(app)
      .get(`/api/jobs/${jobId}/photos`)
      .set('Authorization', `Bearer ${unassignedWorkerToken}`);

    expect(res.status).toBe(403);
  });

  it('allows worker to delete their own photo', async () => {
    // First, list photos to get an ID
    const listRes = await request(app)
      .get(`/api/jobs/${jobId}/photos`)
      .set('Authorization', `Bearer ${workerToken}`);
      
    const photoId = listRes.body[0].id;

    const delRes = await request(app)
      .delete(`/api/jobs/${jobId}/photos/${photoId}`)
      .set('Authorization', `Bearer ${workerToken}`);

    expect(delRes.status).toBe(204);
  });
});
