import { NotificationChannel } from '@prisma/client';

export interface NotificationPayload {
  jobId: string;
  customerId: string;
  eventType: string;
}

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  isPermanent?: boolean;
}

export interface CreateNotificationDTO {
  channel: NotificationChannel;
  payload: NotificationPayload;
  idempotencyKey: string;
}
