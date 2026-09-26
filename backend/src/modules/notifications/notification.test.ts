import { NotificationService } from './notification.service';
import { NotificationChannel, NotificationStatus, PrismaClient } from '@prisma/client';
import { boss, initPgBoss } from '../../lib/pg-boss';

const prisma = new PrismaClient();

describe('Notification Service', () => {
  beforeAll(async () => {
    // We do NOT call initPgBoss() which actually starts pg-boss, because we only need to use it.
    // Wait, pg-boss requires start() before send() will work properly in tests if we want to test queueing.
    // Actually, just sending a job might require start(). Let's start it and stop it.
    await initPgBoss();
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await boss.stop();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
  });

  it('creates and enqueues a new notification', async () => {
    const key = `test-key-${Date.now()}`;
    const notification = await NotificationService.queueNotification({
      channel: NotificationChannel.WHATSAPP,
      idempotencyKey: key,
      payload: { jobId: 'job-123', customerId: 'cust-123', eventType: 'JOB_SCHEDULED' }
    });

    expect(notification.idempotencyKey).toBe(key);
    expect(notification.status).toBe(NotificationStatus.QUEUED);

    const count = await prisma.notification.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });

  it('handles concurrent requests with the same idempotency key (must create EXACTLY one record)', async () => {
    const key = `concurrent-test-key-${Date.now()}`;
    
    // Fire 5 concurrent requests with the same key
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        NotificationService.queueNotification({
          channel: NotificationChannel.WHATSAPP,
          idempotencyKey: key,
          payload: { jobId: 'job-456', customerId: 'cust-456', eventType: 'JOB_SCHEDULED' }
        })
      );
    }

    const results = await Promise.allSettled(promises);

    // Verify all succeeded or at least didn't crash unhandled
    const rejected = results.filter(r => r.status === 'rejected');
    expect(rejected.length).toBe(0);

    // Verify exactly one record in the database
    const count = await prisma.notification.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });
});
