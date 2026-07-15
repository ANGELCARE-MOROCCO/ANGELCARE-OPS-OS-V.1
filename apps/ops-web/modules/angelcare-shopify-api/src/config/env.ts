import fs from 'node:fs';
import path from 'node:path';
import type { AppEnv } from '../types';

const projectRoot = typeof process !== 'undefined' && typeof process.cwd === 'function'
  ? process.cwd()
  : '/tmp';
export const envPath = path.resolve(projectRoot, '.env');
export const defaultDataDir = path.resolve(projectRoot, 'data');

export const DEFAULT_API_VERSION = '2026-04';
export const DEFAULT_PORT = '8100';

export function loadEnv(filePath = envPath, overrides: Partial<AppEnv> = {}): AppEnv {
  const env: Record<string, string> = {};
  let contents = '';

  try {
    contents = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  } catch {
    contents = '';
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return {
    PORT: DEFAULT_PORT,
    HOST: '127.0.0.1',
    NODE_ENV: 'development',
    SHOPIFY_APP_NAME: 'AngelCare Dashboard',
    SHOPIFY_APP_HANDLE: 'angelcare-dashboard',
    SHOPIFY_API_VERSION: DEFAULT_API_VERSION,
    SHOPIFY_SCOPES: 'read_orders,read_products,read_customers,read_inventory,write_inventory,read_locations,read_reports',
    SHOPIFY_TOKEN_GRANT: 'authorization_code',
    SHOPIFY_OMIT_AUTH_SCOPES: 'true',
    SHOPIFY_EMBEDDED: 'false',
    SHOPIFY_APP_CONFIG: 'shopify.app.toml',
    SHOPIFY_AUTOMATICALLY_UPDATE_URLS_ON_DEV: 'false',
    SHOPIFY_WEBHOOK_PATH: '/api/webhooks/shopify',
    SHOPIFY_WEBHOOK_TOPICS: 'app/uninstalled',
    SHOPIFY_WEBHOOK_COMPLIANCE_TOPICS: 'customers/redact,customers/data_request,shop/redact',
    DASHBOARD_USERNAME: 'admin',
    DASHBOARD_PASSWORD: '',
    DASHBOARD_API_KEY: '',
    APP_URL: '',
    CORS_ORIGIN: '*',
    DATA_DIR: defaultDataDir,
    ALLOW_UNSIGNED_WEBHOOKS: '',
    ...env,
    ...(process.env as Record<string, string>),
    ...overrides,
  } as AppEnv;
}

export function getPublicAppUrl(env: AppEnv) {
  return (env.APP_URL || `http://localhost:${env.PORT}`).replace(/\/+$/, '');
}

export function getDataDir(env: AppEnv) {
  return path.resolve(env.DATA_DIR || defaultDataDir);
}

export function normalizeShopDomain(value: unknown) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      return new URL(raw).hostname;
    } catch {
      return raw.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  return raw.split('/')[0];
}

export function validateConfig(env: AppEnv, requiredKeys: string[] = []) {
  const required = requiredKeys.length
    ? requiredKeys
    : ['PORT', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION'];

  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required env values: ${missing.join(', ')}`);
  }

  const normalizedShop = normalizeShopDomain(env.SHOPIFY_SHOP_DOMAIN);
  if (!normalizedShop.endsWith('.myshopify.com')) {
    throw new Error('SHOPIFY_SHOP_DOMAIN must be a .myshopify.com domain.');
  }

  env.SHOPIFY_SHOP_DOMAIN = normalizedShop;
}
