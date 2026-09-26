import { Request, Response } from 'express';
import { env } from '../../config/env';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { NotificationStatus } from '@prisma/client';

export class WebhooksController {
  static verifyWhatsAppWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  static async handleWhatsAppWebhook(req: Request, res: Response) {
    // Note: req.body is a raw buffer here due to express.raw
    
    // 1. Signature validation
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!signature || !env.WHATSAPP_APP_SECRET) {
      return res.status(401).send('Unauthorized');
    }

    const expectedSignature = `sha256=${crypto.createHmac('sha256', env.WHATSAPP_APP_SECRET).update(req.body).digest('hex')}`;
    
    if (signature !== expectedSignature) {
      return res.status(401).send('Invalid signature');
    }

    // 2. Parse body
    let body;
    try {
      body = JSON.parse(req.body.toString());
    } catch (err) {
      return res.status(400).send('Invalid JSON');
    }

    // 3. Process Webhook
    if (body.object !== 'whatsapp_business_account') {
      return res.status(404).send('Not Found');
    }

    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;
      for (const statusObj of statuses) {
        const { id: providerMessageId, status } = statusObj;

        // eventKey ensures idempotency (e.g. wamid-sent)
        const eventKey = `${providerMessageId}-${status}`;

        try {
          await prisma.$transaction(async (tx) => {
            // Check idempotency
            const existingEvent = await tx.notificationDeliveryEvent.findUnique({
              where: { eventKey }
            });

            if (existingEvent) {
              return; // Already processed this status update safely
            }

            // Find notification
            const notification = await tx.notification.findFirst({
              where: { providerMessageId }
            });

            if (!notification) {
              // Message not sent by our system or already deleted
              return;
            }

            // Record event
            await tx.notificationDeliveryEvent.create({
              data: {
                notificationId: notification.id,
                providerMessageId,
                eventType: status,
                eventKey
              }
            });

            // Map Meta status to our NotificationStatus
            let newStatus: NotificationStatus | null = null;
            let dateField: 'sentAt' | 'deliveredAt' | 'failedAt' | null = null;

            if (status === 'sent') {
              newStatus = NotificationStatus.SENT;
              dateField = 'sentAt';
            } else if (status === 'delivered') {
              newStatus = NotificationStatus.DELIVERED;
              dateField = 'deliveredAt';
            } else if (status === 'read') {
              newStatus = NotificationStatus.READ;
            } else if (status === 'failed') {
              newStatus = NotificationStatus.FAILED;
              dateField = 'failedAt';
            }

            if (newStatus && WebhooksController.isMonotonic(notification.status, newStatus)) {
              const dataToUpdate: any = { status: newStatus };
              if (dateField) {
                dataToUpdate[dateField] = new Date();
              }
              await tx.notification.update({
                where: { id: notification.id },
                data: dataToUpdate
              });
            }
          });
        } catch (error) {
          // Unique constraint violation means race condition handled correctly
          if (error instanceof Error && error.message.includes('Unique constraint failed on the fields: (`eventKey`)')) {
            console.log(`[WebhooksController] Duplicate webhook ignored safely: ${eventKey}`);
          } else {
            console.error(`[WebhooksController] Error processing webhook: ${error}`);
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  }

  static isMonotonic(current: NotificationStatus, next: NotificationStatus): boolean {
    const order = {
      [NotificationStatus.PENDING]: 0,
      [NotificationStatus.QUEUED]: 1,
      [NotificationStatus.PROCESSING]: 2,
      [NotificationStatus.SENT]: 3,
      [NotificationStatus.DELIVERED]: 4,
      [NotificationStatus.READ]: 5,
      [NotificationStatus.FAILED]: 99 // Terminal
    };

    if (current === NotificationStatus.FAILED) {
      return false; // Can't progress from failed
    }

    if (next === NotificationStatus.FAILED) {
      return true; // Can always fail if not already failed
    }

    return order[next] > order[current];
  }
}
