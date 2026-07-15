import { sendHtml, sendJson } from '../http/responses';
import { safeEqual } from '../lib/security';
import type { AppEnv, NodeRequest, NodeResponse } from '../types';

function getAdminUsername(env: AppEnv) {
  return env.DASHBOARD_USERNAME || env.ADMIN_USERNAME || 'admin';
}

function getAdminPassword(env: AppEnv) {
  return env.DASHBOARD_PASSWORD || env.ADMIN_PASSWORD || '';
}

function getAdminApiKey(env: AppEnv) {
  return env.DASHBOARD_API_KEY || env.ADMIN_API_KEY || '';
}

export function hasAdminAuthConfigured(env: AppEnv) {
  return Boolean(getAdminPassword(env) || getAdminApiKey(env));
}

function parseBasicAuth(headerValue: unknown) {
  const value = String(headerValue || '');
  if (!value.startsWith('Basic ')) return null;

  try {
    const decoded = Buffer.from(value.slice('Basic '.length), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return null;

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function isLocalDevelopment(env: AppEnv) {
  return env.NODE_ENV !== 'production' && env.CLOUDFLARE_WORKER !== 'true';
}

export function isAdminAuthorized(req: NodeRequest, env: AppEnv) {
  if (!hasAdminAuthConfigured(env)) {
    return isLocalDevelopment(env);
  }

  const apiKey = getAdminApiKey(env);
  const apiKeyHeader = req.headers['x-admin-api-key'];
  const bearerHeader = String(req.headers.authorization || '').startsWith('Bearer ')
    ? String(req.headers.authorization).slice('Bearer '.length)
    : '';

  if (apiKey && (safeEqual(apiKey, apiKeyHeader || '') || safeEqual(apiKey, bearerHeader))) {
    return true;
  }

  const password = getAdminPassword(env);
  const credentials = parseBasicAuth(req.headers.authorization || '');
  if (!password || !credentials) return false;

  return safeEqual(getAdminUsername(env), credentials.username) &&
    safeEqual(password, credentials.password);
}

export function isPublicRoute(method: string, pathname: string) {
  if (method === 'OPTIONS') return true;

  return (
    (method === 'GET' && pathname === '/health') ||
    (method === 'GET' && pathname === '/install') ||
    (method === 'GET' && pathname === '/api/auth/callback') ||
    (method === 'GET' && pathname === '/api/traffic/script.js') ||
    (method === 'POST' && pathname === '/api/traffic/collect') ||
    (method === 'POST' && pathname === '/api/webhooks/shopify')
  );
}

export function sendAdminUnauthorized(req: NodeRequest, res: NodeResponse) {
  const wantsJson = String(req.headers.accept || '').includes('application/json') ||
    String(req.url || '').startsWith('/api/');

  if (wantsJson) {
    return sendJson(res, 401, {
      success: false,
      error: 'Admin authentication required.',
    }, {
      'WWW-Authenticate': 'Basic realm="AngelCare Dashboard", charset="UTF-8"',
    });
  }

  return sendHtml(
    res,
    401,
    '<!doctype html><html><head><meta charset="utf-8"><title>Authentication required</title></head><body><h1>Authentication required</h1></body></html>',
    { 'WWW-Authenticate': 'Basic realm="AngelCare Dashboard", charset="UTF-8"' },
  );
}
