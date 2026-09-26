import { NotificationChannel, Notification, PrismaClient } from '@prisma/client';
import { NotificationSender } from './notification.sender';
import { NotificationPayload, SendResult } from './notification.types';
import { env } from '../../config/env';
import prisma from '../../lib/prisma';

export class WhatsAppSender implements NotificationSender {
  supportsChannel(channel: NotificationChannel): boolean {
    return channel === NotificationChannel.WHATSAPP;
  }

  async send(notification: Notification): Promise<SendResult> {
    const payload = notification.payload as any as NotificationPayload;

    // 1. Fetch Job, Property, Customer
    const job = await prisma.job.findUnique({
      where: { id: payload.jobId },
      include: {
        property: {
          include: { customer: true }
        }
      }
    });

    if (!job) {
      return { success: false, error: `Job not found: ${payload.jobId}`, isPermanent: true };
    }

    const customer = job.property.customer;

    // 2. Opt-in check immediately before sending
    if (!customer.whatsappOptIn) {
      return { success: false, error: 'WHATSAPP_OPT_IN_REQUIRED', isPermanent: true };
    }

    if (!customer.phone) {
      return { success: false, error: 'INVALID_RECIPIENT', isPermanent: true };
    }

    // 3. Resolve template from trusted event data
    let templateName = '';
    switch (payload.eventType) {
      case 'JOB_SCHEDULED': templateName = env.WHATSAPP_TEMPLATE_JOB_SCHEDULED || ''; break;
      case 'JOB_RESCHEDULED': templateName = env.WHATSAPP_TEMPLATE_JOB_RESCHEDULED || ''; break;
      case 'JOB_CANCELLED': templateName = env.WHATSAPP_TEMPLATE_JOB_CANCELLED || ''; break;
      case 'JOB_COMPLETED': templateName = env.WHATSAPP_TEMPLATE_JOB_COMPLETED || ''; break;
      default: return { success: false, error: `INVALID_TEMPLATE for event: ${payload.eventType}`, isPermanent: true };
    }

    if (!templateName) {
      return { success: false, error: `INVALID_TEMPLATE (not configured for ${payload.eventType})`, isPermanent: true };
    }

    // Configuration checks
    if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_API_VERSION) {
      return { success: false, error: 'AUTHENTICATION_ERROR (Missing WhatsApp config)', isPermanent: true };
    }

    // Build Payload
    const requestBody = {
      messaging_product: 'whatsapp',
      to: customer.phone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US'
        }
      }
    };

    // 4. Send to Meta Graph API
    const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json() as any;

      if (!response.ok) {
        // Error Classification
        const isPermanent = this.isPermanentError(response.status, data);
        
        return { 
          success: false, 
          error: `Provider error: ${response.status} - ${JSON.stringify(data.error || data)}`, 
          isPermanent 
        };
      }

      const providerMessageId = data?.messages?.[0]?.id;

      if (!providerMessageId) {
        return { success: false, error: 'UNKNOWN_PROVIDER_ERROR (No message ID returned)', isPermanent: false };
      }

      return {
        success: true,
        providerMessageId
      };
    } catch (err: any) {
      // Network errors, timeouts, etc
      return { success: false, error: `NETWORK_ERROR: ${err.message}`, isPermanent: false };
    }
  }

  private isPermanentError(status: number, data: any): boolean {
    if (status === 429) return false; // Rate limited -> retryable
    if (status >= 500) return false; // Server error -> retryable
    
    // Known permanent 4xx (e.g., auth, invalid recipient)
    return true; 
  }
}
