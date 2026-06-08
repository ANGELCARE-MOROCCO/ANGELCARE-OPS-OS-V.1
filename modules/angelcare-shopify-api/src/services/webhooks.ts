import fs from 'node:fs';
import path from 'node:path';

import { getDataDir } from '../config/env';
import {
  appendJsonEvent,
  canUseFileStorage,
  readJsonEvents,
} from './storage';
import type { AnyRecord, AppEnv, NodeRequest } from '../types';

export function ensureDataDir(env: AppEnv) {
  if (!canUseFileStorage(env)) return null;

  const dataDir = getDataDir(env);
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  return dataDir;
}

export function getWebhookLogPath(env: AppEnv) {
  const dataDir = ensureDataDir(env);
  return dataDir ? path.join(dataDir, 'webhooks.jsonl') : null;
}

export async function appendWebhookEvent(env: AppEnv, event: unknown) {
  const storedInKv = await appendJsonEvent(env, 'webhook_events', event, Number(env.WEBHOOK_EVENT_LIMIT) || 1000);
  if (storedInKv) return;

  const logPath = getWebhookLogPath(env);
  if (!logPath) return;

  const line = `${JSON.stringify(event)}\n`;
  fs.appendFileSync(logPath, line, { mode: 0o600 });
}

export async function readRecentWebhookEvents(env: AppEnv, limit = 20) {
  const kvEvents = await readJsonEvents(env, 'webhook_events', limit);
  if (kvEvents) return kvEvents.reverse();

  const logPath = path.join(getDataDir(env), 'webhooks.jsonl');
  if (!fs.existsSync(logPath)) return [];

  const lines = fs
    .readFileSync(logPath, 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit);

  return lines.flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  }).reverse();
}

export function getWebhookMetadata(req: NodeRequest, payload: AnyRecord) {
  if (payload?.['detail-type'] === 'shopifyWebhook' || payload?.detail?.metadata) {
    const metadata = payload.detail?.metadata || {};
    return {
      deliveryMode: 'eventbridge',
      topic: metadata['X-Shopify-Topic'] || payload.detail?.topic || 'unknown',
      shopDomain: metadata['X-Shopify-Shop-Domain'] || payload.detail?.shop_domain || 'unknown',
      webhookId: metadata['X-Shopify-Webhook-Id'] || payload.id || null,
    };
  }

  return {
    deliveryMode: 'standard-http',
    topic: req.headers['x-shopify-topic'] || 'unknown',
    shopDomain: req.headers['x-shopify-shop-domain'] || 'unknown',
    webhookId: req.headers['x-shopify-webhook-id'] || null,
  };
}
