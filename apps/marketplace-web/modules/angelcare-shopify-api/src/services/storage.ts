import type { AppEnv, KvNamespaceLike } from '../types';

export function getCloudflareKv(env: AppEnv): KvNamespaceLike | null {
  const candidates = [
    env.ANGELCARE_KV,
    env.SHOPIFY_APP_KV,
    env.SHOPIFY_TOKENS,
  ];

  return candidates.find((candidate): candidate is KvNamespaceLike => (
    Boolean(
      candidate &&
      typeof candidate === 'object' &&
      typeof candidate.get === 'function' &&
      typeof candidate.put === 'function',
    )
  )) || null;
}

export function hasCloudflareKv(env: AppEnv) {
  return Boolean(getCloudflareKv(env));
}

export function getShopScopedKey(env: AppEnv, suffix: string) {
  const shop = String(env.SHOPIFY_SHOP_DOMAIN || 'unknown-shop').toLowerCase();
  return `angelcare:${shop}:${suffix}`;
}

export async function appendJsonEvent(env: AppEnv, suffix: string, event: unknown, limit = 1000) {
  const kv = getCloudflareKv(env);
  if (!kv) return false;

  const key = getShopScopedKey(env, suffix);
  let events: unknown[] = [];

  try {
    events = JSON.parse(await kv.get(key) || '[]');
    if (!Array.isArray(events)) events = [];
  } catch {
    events = [];
  }

  events.push(event);
  await kv.put(key, JSON.stringify(events.slice(-limit)));
  return true;
}

export async function readJsonEvents<T = unknown>(env: AppEnv, suffix: string, limit = 1000): Promise<T[] | null> {
  const kv = getCloudflareKv(env);
  if (!kv) return null;

  const key = getShopScopedKey(env, suffix);

  try {
    const events = JSON.parse(await kv.get(key) || '[]') as T[];
    if (!Array.isArray(events)) return [];
    return events.slice(-limit);
  } catch {
    return [];
  }
}

export function canUseFileStorage(env: AppEnv) {
  return env.CLOUDFLARE_WORKER !== 'true';
}
