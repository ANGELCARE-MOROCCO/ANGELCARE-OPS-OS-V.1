import crypto from 'node:crypto';
import fs from 'node:fs';
import type { AppEnv } from '../types';

export function verifyShopifyHmac(searchParams: URLSearchParams, clientSecret: string) {
  const hmac = searchParams.get('hmac');
  if (!hmac) return false;

  const message = [...searchParams.entries()]
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const digest = crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex');

  return safeEqual(digest, hmac);
}

export function verifyWebhookHmac(rawBody: string, hmacHeader: unknown, clientSecret: string) {
  if (!hmacHeader || !clientSecret) return false;

  const digest = crypto
    .createHmac('sha256', clientSecret)
    .update(rawBody, 'utf8')
    .digest('base64');

  return safeEqual(digest, hmacHeader);
}

export function safeEqual(expected: unknown, actual: unknown) {
  const expectedBuffer = Buffer.from(String(expected), 'utf8');
  const actualBuffer = Buffer.from(String(actual), 'utf8');

  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createInstallState(env: AppEnv) {
  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac('sha256', env.SHOPIFY_CLIENT_SECRET)
    .update(`${env.SHOPIFY_SHOP_DOMAIN}:${timestamp}`)
    .digest('hex');

  return `${timestamp}.${signature}`;
}

export function verifyInstallState(state: string | null, env: AppEnv) {
  if (!state) return false;

  const [timestamp, signature] = state.split('.');
  if (!timestamp || !signature) return false;

  const ageMs = Date.now() - Number(timestamp);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 15 * 60 * 1000) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.SHOPIFY_CLIENT_SECRET)
    .update(`${env.SHOPIFY_SHOP_DOMAIN}:${timestamp}`)
    .digest('hex');

  return safeEqual(expectedSignature, signature);
}

export function updateAccessToken(filePath: string, accessToken: string) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const tokenLine = `SHOPIFY_ACCESS_TOKEN=${accessToken}`;
  let updated;

  if (/^SHOPIFY_ACCESS_TOKEN=.*$/m.test(contents)) {
    updated = contents.replace(/^SHOPIFY_ACCESS_TOKEN=.*$/m, tokenLine);
  } else {
    updated = `${contents.replace(/\s*$/, '')}\n${tokenLine}\n`;
  }

  fs.writeFileSync(filePath, updated, { mode: 0o600 });
  fs.chmodSync(filePath, 0o600);
}
