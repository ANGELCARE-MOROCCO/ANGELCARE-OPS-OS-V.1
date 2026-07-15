import type { OutgoingHttpHeaders } from 'node:http';
import type { AppEnv, NodeResponse } from '../types';

export function sendJson(
  res: NodeResponse,
  statusCode: number,
  body: unknown,
  headers: OutgoingHttpHeaders = {},
) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(body, null, 2));
}

export function sendHtml(
  res: NodeResponse,
  statusCode: number,
  body: string,
  headers: OutgoingHttpHeaders = {},
) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function setCorsHeaders(res: NodeResponse, env: AppEnv) {
  res.setHeader('Access-Control-Allow-Origin', env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Admin-Api-Key, X-Shopify-Hmac-Sha256, X-Shopify-Topic, X-Shopify-Shop-Domain');
}

export function createSafeError(error: unknown, fallback = 'Request failed') {
  return error instanceof Error ? error.message : fallback;
}
