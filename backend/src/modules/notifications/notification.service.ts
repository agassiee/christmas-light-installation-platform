import { PrismaClient, NotificationStatus, Prisma } from '@prisma/client';
import { CreateNotificationDTO } from './notification.types';
import { boss } from '../../lib/pg-boss';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Creates a notification idempotently and enqueues it.
   */
  static async queueNotification(data: CreateNotificationDTO) {
    let notification;
    
    try {
      // Try to create the notification as PENDING
      notification = await prisma.notification.create({
        data: {
          channel: data.channel,
          payload: data.payload as any,
          idempotencyKey: data.idempotencyKey,
          status: NotificationStatus.PENDING,
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Idempotency key collision
        notification = await prisma.notification.findUnique({
          where: { idempotencyKey: data.idempotencyKey }
        });
        if (!notification) {
          throw new Error('Idempotency collision but record not found');
        }
      } else {
        throw error;
      }
    }

    // If it's PENDING, we enqueue it. If it's already QUEUED/SENT/etc due to idempotency, skip.
    if (notification.status === NotificationStatus.PENDING) {
      // Enqueue job via pg-boss
      const jobId = await boss.send('send-notification', { notificationId: notification.id }, {
        retryLimit: 5,
        retryBackoff: true,
      });

      if (jobId) {
        notification = await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.QUEUED,
            queuedAt: new Date()
          }
        });
      }
    }

    return notification;
  }
}
