import { updateAccessToken } from '../lib/security';
import {
  getCloudflareKv,
  getShopScopedKey,
  hasCloudflareKv,
} from './storage';
import type { AnyRecord, AppEnv } from '../types';

type AuthMode = 'static_access_token' | 'client_credentials' | 'stored_access_token' | 'authorization_code_required' | 'not_configured';

interface AdminToken {
  accessToken: string;
  scope: string;
  expiresAt: number | null;
  source?: AuthMode;
  storedAt?: string | null;
}

type ClientCredentialsToken = Omit<AdminToken, 'source'> & { expiresAt: number };

const tokenCache = new Map<string, ClientCredentialsToken>();
const STORED_ACCESS_TOKEN_SUFFIX = 'admin_access_token';

export function canUseClientCredentials(env: AppEnv) {
  return env.SHOPIFY_TOKEN_GRANT === 'client_credentials' &&
    Boolean(env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET && env.SHOPIFY_SHOP_DOMAIN);
}

function getTokenCacheKey(env: AppEnv) {
  return `${env.SHOPIFY_SHOP_DOMAIN}:${env.SHOPIFY_CLIENT_ID}`;
}

function getStaticAccessToken(env: AppEnv) {
  return env.SHOPIFY_ACCESS_TOKEN || '';
}

export function getAuthMode(env: AppEnv): AuthMode {
  if (getStaticAccessToken(env)) return 'static_access_token';
  if (canUseClientCredentials(env)) return 'client_credentials';
  if (hasCloudflareKv(env)) return 'stored_access_token';
  if (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET) return 'authorization_code_required';
  return 'not_configured';
}

const ADMIN_AUTH_MODES = new Set(['static_access_token', 'stored_access_token', 'client_credentials']);

export async function canUseAdminApi(env: AppEnv) {
  return ADMIN_AUTH_MODES.has(await getResolvedAuthMode(env));
}

export async function getResolvedAuthMode(env: AppEnv): Promise<AuthMode> {
  if (getStaticAccessToken(env)) return 'static_access_token';

  const storedToken = await getStoredAccessToken(env);
  if (storedToken) return 'stored_access_token';

  if (canUseClientCredentials(env)) return 'client_credentials';
  if (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET) return 'authorization_code_required';
  return 'not_configured';
}

export async function getStoredAccessToken(env: AppEnv): Promise<AdminToken | null> {
  const kv = getCloudflareKv(env);
  if (!kv) return null;

  const key = getShopScopedKey(env, STORED_ACCESS_TOKEN_SUFFIX);
  let payload: AnyRecord | null;

  try {
    payload = JSON.parse(await kv.get(key) || 'null');
  } catch {
    payload = null;
  }

  if (!payload?.accessToken) return null;

  return {
    accessToken: payload.accessToken,
    scope: payload.scope || env.SHOPIFY_SCOPES || '',
    storedAt: payload.storedAt || null,
    expiresAt: null,
  };
}

export async function storeAdminAccessToken(env: AppEnv, configPath: string, accessToken: string, scope = '') {
  const kv = getCloudflareKv(env);

  if (kv) {
    const key = getShopScopedKey(env, STORED_ACCESS_TOKEN_SUFFIX);
    await kv.put(key, JSON.stringify({
      accessToken,
      scope,
      storedAt: new Date().toISOString(),
    }));
    clearCachedAdminAccessToken(env);
    return 'Cloudflare KV';
  }

  updateAccessToken(configPath, accessToken);
  clearCachedAdminAccessToken(env);
  return configPath;
}

export async function requestClientCredentialsToken(env: AppEnv): Promise<ClientCredentialsToken> {
  if (!canUseClientCredentials(env)) {
    throw new Error('Client credentials are not configured.');
  }

  const response = await fetch(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
    }),
  });

  const bodyText = await response.text();
  let payload: AnyRecord;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = { raw: bodyText };
  }

  if (!response.ok || !payload.access_token) {
    const shopifyError = payload.error_description || payload.error || payload.raw || 'Unknown Shopify token error';
    throw new Error(`Shopify client-credentials token failed (${response.status}): ${shopifyError}`);
  }

  const expiresInSeconds = Number(payload.expires_in || 86399);

  return {
    accessToken: payload.access_token,
    scope: payload.scope || '',
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
  };
}

export async function getAdminAccessToken(env: AppEnv): Promise<AdminToken> {
  const staticToken = getStaticAccessToken(env);
  if (staticToken) {
    return {
      accessToken: staticToken,
      source: 'static_access_token',
      scope: env.SHOPIFY_SCOPES || '',
      expiresAt: null,
    };
  }

  const storedToken = await getStoredAccessToken(env);
  if (storedToken) {
    return {
      ...storedToken,
      source: 'stored_access_token',
      expiresAt: null,
    };
  }

  const cacheKey = getTokenCacheKey(env);
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached,
      source: 'client_credentials',
    };
  }

  if (!canUseClientCredentials(env)) {
    throw new Error('No Shopify Admin API token is available. Install the app through /install first, or provide SHOPIFY_ACCESS_TOKEN.');
  }

  const token = await requestClientCredentialsToken(env);
  tokenCache.set(cacheKey, token);

  return {
    ...token,
    source: 'client_credentials',
  };
}

export function clearCachedAdminAccessToken(env: AppEnv) {
  tokenCache.delete(getTokenCacheKey(env));
}
