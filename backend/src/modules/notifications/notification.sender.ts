import { NotificationChannel, Notification } from '@prisma/client';
import { NotificationPayload, SendResult } from './notification.types';

export interface NotificationSender {
  supportsChannel(channel: NotificationChannel): boolean;
  send(notification: Notification): Promise<SendResult>;
}

export class MockSender implements NotificationSender {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === NotificationChannel.WHATSAPP;
  }

  async send(notification: Notification): Promise<SendResult> {
    const payload = notification.payload as any as NotificationPayload;
    console.log(`[MockSender] Pretending to send via ${notification.channel} to customer ${payload.customerId} for job ${payload.jobId}`);
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));

    // Simulate random failure (10% chance) for testing retry logic later if needed
    // But actually, for deterministic tests, we'll just succeed unless the eventType contains 'FAIL_TEST'
    if (payload.eventType?.includes('FAIL_TEST')) {
      return { success: false, error: 'Simulated failure requested' };
    }

    return {
      success: true,
      providerMessageId: `mock-id-${Date.now()}`
    };
  }
}
