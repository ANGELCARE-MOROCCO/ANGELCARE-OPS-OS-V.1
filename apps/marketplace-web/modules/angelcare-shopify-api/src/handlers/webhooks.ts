import { createSafeError, sendJson } from '../http/responses';
import { readRequestBody } from '../lib/body';
import { verifyWebhookHmac } from '../lib/security';
import { appendWebhookEvent, getWebhookMetadata, readRecentWebhookEvents } from '../services/webhooks';
import type { AnyRecord, AppEnv, NodeRequest, NodeResponse } from '../types';

export async function handleWebhook(req: NodeRequest, res: NodeResponse, env: AppEnv) {
  try {
    const rawBody = await readRequestBody(req);
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const allowUnsigned =
      env.ALLOW_UNSIGNED_WEBHOOKS === 'true' ||
      (env.NODE_ENV !== 'production' && !hmacHeader);

    if (hmacHeader && !verifyWebhookHmac(rawBody, hmacHeader, env.SHOPIFY_CLIENT_SECRET)) {
      return sendJson(res, 401, { success: false, error: 'Invalid webhook HMAC.' });
    }

    if (!hmacHeader && !allowUnsigned) {
      return sendJson(res, 401, { success: false, error: 'Missing webhook HMAC.' });
    }

    let payload: AnyRecord = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return sendJson(res, 400, { success: false, error: 'Webhook body must be valid JSON.' });
      }
    }

    const metadata = getWebhookMetadata(req, payload);
    const event = {
      receivedAt: new Date().toISOString(),
      ...metadata,
      verified: Boolean(hmacHeader),
      payload,
    };

    await appendWebhookEvent(env, event);
    console.log(`[Webhook] Stored ${event.topic} for ${event.shopDomain}`);

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error(`[Webhook] ${createSafeError(error)}`);
    return sendJson(res, 500, { success: false, error: createSafeError(error) });
  }
}

export async function handleWebhookEvents(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
  return sendJson(res, 200, {
    success: true,
    data: await readRecentWebhookEvents(env, Number(url.searchParams.get('limit')) || 20),
  });
}
