import { Router } from 'express';
import express from 'express';
import { WebhooksController } from './webhooks.controller';

const router = Router();

// GET request for Meta verification challenge
router.get('/whatsapp', WebhooksController.verifyWhatsAppWebhook);

// POST request for webhook events (requires raw body for signature validation)
router.post(
  '/whatsapp',
  express.raw({ type: 'application/json' }),
  WebhooksController.handleWhatsAppWebhook
);

export default router;
