const fs = require('node:fs');
const path = require('node:path');

const envPath = path.resolve(/* turbopackIgnore: true */ process.cwd(), '.env.local');
const fallbackEnvPath = path.resolve(/* turbopackIgnore: true */ process.cwd(), '.env');
const defaultDataDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), 'data/shopify-api');

const DEFAULT_API_VERSION = '2026-04';
const DEFAULT_PORT = '8100';

function loadEnv(filePath = envPath) {
  const env = {};
  const resolvedPath = fs.existsSync(filePath) ? filePath : fallbackEnvPath;
  const contents = fs.existsSync(resolvedPath) ? fs.readFileSync(resolvedPath, 'utf8') : '';

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
    SHOPIFY_SHOP_DOMAIN: 'angelcare4all.myshopify.com',
    SHOPIFY_API_VERSION: DEFAULT_API_VERSION,
    SHOPIFY_SCOPES: 'read_orders,read_products,read_customers,read_inventory,write_inventory,read_locations,read_reports',
    SHOPIFY_TOKEN_GRANT: 'authorization_code',
    SHOPIFY_OMIT_AUTH_SCOPES: 'true',
    APP_URL: '',
    CORS_ORIGIN: '*',
    DATA_DIR: defaultDataDir,
    ALLOW_UNSIGNED_WEBHOOKS: '',
    SHOPIFY_BASE_PATH: '/shopify',
    ...env,
    ...process.env,
  };
}

function getPublicAppUrl(env) {
  return (env.SHOPIFY_PUBLIC_APP_URL || env.APP_URL || `http://localhost:${env.PORT}`).replace(/\/+$/, '');
}

function getShopifyBasePath(env) {
  const raw = String(env.SHOPIFY_BASE_PATH || '/shopify').trim().replace(/\/+$/, '');
  if (!raw || raw === '/') return '';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function getDataDir(env) {
  return path.resolve(env.DATA_DIR || defaultDataDir);
}

function normalizeShopDomain(value) {
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

function validateConfig(env, requiredKeys = []) {
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

module.exports = {
  DEFAULT_API_VERSION,
  DEFAULT_PORT,
  defaultDataDir,
  envPath,
  fallbackEnvPath,
  getDataDir,
  getPublicAppUrl,
  getShopifyBasePath,
  loadEnv,
  normalizeShopDomain,
  validateConfig,
};
