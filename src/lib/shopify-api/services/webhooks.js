const fs = require('node:fs');
const path = require('node:path');

const { getDataDir } = require('../config/env');

function ensureDataDir(env) {
  const dataDir = getDataDir(env);
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  return dataDir;
}

function getWebhookLogPath(env) {
  return path.join(ensureDataDir(env), 'webhooks.jsonl');
}

function appendWebhookEvent(env, event) {
  const line = `${JSON.stringify(event)}\n`;
  fs.appendFileSync(getWebhookLogPath(env), line, { mode: 0o600 });
}

function readRecentWebhookEvents(env, limit = 20) {
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

function getWebhookMetadata(req, payload) {
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

module.exports = {
  appendWebhookEvent,
  ensureDataDir,
  getWebhookLogPath,
  getWebhookMetadata,
  readRecentWebhookEvents,
};
