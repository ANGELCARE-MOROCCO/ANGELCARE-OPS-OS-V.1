import { createSafeError } from '../http/responses';
import { getCloudflareKv, getShopScopedKey } from '../services/storage';
import type { AnyRecord, AppEnv } from '../types';

interface CacheEntry {
  payload: AnyRecord;
  cachedAt: string;
  expiresAt: number;
  storage?: 'memory' | 'kv';
}

interface CacheDetails {
  status: 'hit' | 'miss' | 'refresh';
  storage: string;
  ttlSeconds: number;
  cachedAt: string;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_MAX_ENTRIES = 80;

function normalizeCacheUrl(url: URL) {
  const normalized = new URL(url.toString());
  normalized.searchParams.delete('fresh');
  normalized.searchParams.sort();
  const query = normalized.searchParams.toString();
  return query ? `${normalized.pathname}?${query}` : normalized.pathname;
}

function getCacheKey(env: AppEnv, name: string, url: URL) {
  return [
    name,
    String(env.SHOPIFY_SHOP_DOMAIN || '').toLowerCase(),
    String(env.SHOPIFY_API_VERSION || '').toLowerCase(),
    normalizeCacheUrl(url),
  ].join(':');
}

function getKvCacheKey(env: AppEnv, name: string, url: URL) {
  const apiVersion = String(env.SHOPIFY_API_VERSION || '').toLowerCase();
  return getShopScopedKey(env, `cache:${name}:${apiVersion}:${normalizeCacheUrl(url)}`);
}

function shouldBypassCache(url: URL) {
  return ['1', 'true', 'yes'].includes(String(url.searchParams.get('fresh') || '').toLowerCase());
}

function pruneResponseCache(now = Date.now()) {
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt <= now) {
      responseCache.delete(key);
    }
  }

  while (responseCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (!oldestKey) break;
    responseCache.delete(oldestKey);
  }
}

function cacheMetadata(status: 'hit' | 'miss' | 'refresh', entry: CacheEntry, ttlMs: number, storage: string, now = Date.now()): CacheDetails {
  return {
    status,
    storage,
    ttlSeconds: status === 'hit'
      ? Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
      : Math.ceil(ttlMs / 1000),
    cachedAt: entry.cachedAt,
  };
}

async function readKvCacheEntry(env: AppEnv, name: string, url: URL, now: number): Promise<CacheEntry | null> {
  const kv = getCloudflareKv(env);
  if (!kv) return null;

  const key = getKvCacheKey(env, name, url);

  try {
    const raw = await kv.get(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry?.payload || !entry.expiresAt || !entry.cachedAt) return null;

    if (entry.expiresAt <= now) {
      if (typeof kv.delete === 'function') {
        await kv.delete(key);
      }
      return null;
    }

    return entry;
  } catch (error) {
    console.warn(`[Cache] KV read failed: ${createSafeError(error)}`);
    return null;
  }
}

async function writeKvCacheEntry(env: AppEnv, name: string, url: URL, ttlMs: number, entry: CacheEntry) {
  const kv = getCloudflareKv(env);
  if (!kv) return false;

  try {
    await kv.put(getKvCacheKey(env, name, url), JSON.stringify(entry), {
      expirationTtl: Math.max(60, Math.ceil(ttlMs / 1000)),
    });
    return true;
  } catch (error) {
    console.warn(`[Cache] KV write failed: ${createSafeError(error)}`);
    return false;
  }
}

export async function getCachedPayload<T extends AnyRecord>(
  env: AppEnv,
  name: string,
  url: URL,
  ttlMs: number,
  task: () => Promise<T> | T,
): Promise<T & { cache: CacheDetails }> {
  const now = Date.now();
  const bypass = shouldBypassCache(url);
  pruneResponseCache(now);

  const key = getCacheKey(env, name, url);
  const cached = responseCache.get(key);

  if (!bypass && cached && cached.expiresAt > now) {
      return {
        ...cached.payload,
        cache: cacheMetadata('hit', cached, ttlMs, cached.storage || 'memory', now),
      } as T & { cache: CacheDetails };
  }

  if (!bypass) {
    const kvEntry = await readKvCacheEntry(env, name, url, now);
    if (kvEntry) {
      responseCache.set(key, { ...kvEntry, storage: 'kv' });

      return {
        ...kvEntry.payload,
        cache: cacheMetadata('hit', kvEntry, ttlMs, 'kv', now),
      } as T & { cache: CacheDetails };
    }
  }

  const payload = await task();
  const cachedAt = new Date().toISOString();
  const expiresAt = Date.now() + ttlMs;
  const entry = { payload, cachedAt, expiresAt };
  const storedInKv = await writeKvCacheEntry(env, name, url, ttlMs, entry);
  responseCache.set(key, { ...entry, storage: storedInKv ? 'kv' : 'memory' });
  pruneResponseCache();

  return {
    ...payload,
    cache: cacheMetadata(bypass ? 'refresh' : 'miss', entry, ttlMs, storedInKv ? 'kv' : 'memory'),
  } as T & { cache: CacheDetails };
}

function getKvCachePrefix(env: AppEnv) {
  return getShopScopedKey(env, 'cache:');
}

function getCacheNameFromKvKey(env: AppEnv, keyName: string) {
  const prefix = getKvCachePrefix(env);
  if (!keyName.startsWith(prefix)) return '';
  return keyName.slice(prefix.length).split(':')[0] || '';
}

async function clearKvCachedResponses(env: AppEnv, names: string[] = []) {
  const kv = getCloudflareKv(env);
  if (!kv || typeof kv.list !== 'function' || typeof kv.delete !== 'function') return;

  const allowedNames = new Set(names);
  const prefix = getKvCachePrefix(env);
  let cursor;

  try {
    do {
      const listing = await kv.list({ prefix, cursor });
      const keys = Array.isArray(listing.keys) ? listing.keys : [];

      const deleteKey = kv.delete.bind(kv);
      await Promise.all(keys
        .map((key) => key.name)
        .filter((keyName) => !allowedNames.size || allowedNames.has(getCacheNameFromKvKey(env, keyName)))
        .map((keyName) => deleteKey(keyName)));

      cursor = listing.list_complete ? null : listing.cursor;
    } while (cursor);
  } catch (error) {
    console.warn(`[Cache] KV clear failed: ${createSafeError(error)}`);
  }
}

export async function clearCachedResponses(env: AppEnv, names: string[] = []) {
  const shop = String(env.SHOPIFY_SHOP_DOMAIN || '').toLowerCase();
  const allowedNames = new Set(names);

  for (const key of responseCache.keys()) {
    const [name, keyShop] = key.split(':');
    if ((!allowedNames.size || allowedNames.has(name)) && keyShop === shop) {
      responseCache.delete(key);
    }
  }

  await clearKvCachedResponses(env, names);
}
