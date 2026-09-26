import { PrismaClient, NotificationStatus, NotificationChannel } from '@prisma/client';
import { boss } from '../../lib/pg-boss';
import { WhatsAppSender } from './whatsapp.sender';

const prisma = new PrismaClient();
const whatsappSender = new WhatsAppSender();

export const initNotificationWorker = async () => {
  await boss.work('send-notification', async (job) => {
    const { notificationId } = job.data as { notificationId: string };
    
    // Fetch notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Skip if already in a terminal state or currently being processed elsewhere
    if (
      notification.status === NotificationStatus.SENT ||
      notification.status === NotificationStatus.DELIVERED ||
      notification.status === NotificationStatus.FAILED
    ) {
      console.log(`[NotificationWorker] Skipping ${notificationId}, already in state ${notification.status}`);
      return;
    }

    // Mark as PROCESSING
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.PROCESSING }
    });

    // Select Sender
    const sender = whatsappSender;
    if (!sender.supportsChannel(notification.channel)) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          lastError: `No sender supports channel ${notification.channel}`,
          failedAt: new Date()
        }
      });
      return;
    }

    try {
      const result = await sender.send(notification);

      if (result.success) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.SENT,
            providerMessageId: result.providerMessageId,
            sentAt: new Date(),
            attempts: { increment: 1 }
          }
        });
      } else {
        // Failed
        if (result.isPermanent) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: {
              status: NotificationStatus.FAILED,
              lastError: result.error || 'Permanent sender error',
              failedAt: new Date(),
              attempts: { increment: 1 }
            }
          });
          return; // Do not throw to avoid retries
        }
        throw new Error(result.error || 'Unknown sender error');
      }
    } catch (error: any) {
      const isFinalAttempt = notification.attempts >= 4; // retryLimit is 5
      
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: isFinalAttempt ? NotificationStatus.FAILED : NotificationStatus.QUEUED,
          lastError: error.message || String(error),
          failedAt: isFinalAttempt ? new Date() : null,
          attempts: { increment: 1 }
        }
      });

      // Rethrow to trigger pg-boss retry (if not final)
      throw error;
    }
  });
};
