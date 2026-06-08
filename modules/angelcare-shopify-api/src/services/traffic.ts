import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { getDataDir, getPublicAppUrl } from '../config/env';
import {
  appendJsonEvent,
  canUseFileStorage,
  readJsonEvents,
} from './storage';
import type { AnyRecord, AppEnv, NodeRequest } from '../types';

function ensureTrafficDir(env: AppEnv) {
  if (!canUseFileStorage(env)) return null;

  const dataDir = getDataDir(env);
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  return dataDir;
}

export function getTrafficLogPath(env: AppEnv) {
  const trafficDir = ensureTrafficDir(env);
  return trafficDir ? path.join(trafficDir, 'traffic.jsonl') : null;
}

function hashValue(env: AppEnv, value: unknown) {
  const secret = env.SHOPIFY_CLIENT_SECRET || env.SHOPIFY_CLIENT_ID || 'angelcare-dashboard-dev';
  return crypto
    .createHmac('sha256', secret)
    .update(String(value || 'unknown'))
    .digest('hex')
    .slice(0, 32);
}

function getClientIp(req: NodeRequest) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
}

function truncate(value: unknown, maxLength = 500) {
  return String(value || '').slice(0, maxLength);
}

function safePath(value: unknown) {
  const raw = truncate(value || '/', 500);

  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const url = new URL(raw);
      return `${url.pathname}${url.search}` || '/';
    }
  } catch {
    return '/';
  }

  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function normalizeTrafficEvent(env: AppEnv, req: NodeRequest, payload: AnyRecord = {}) {
  const userAgent = truncate(req.headers['user-agent'], 500);
  const ip = getClientIp(req);
  const visitorSeed = payload.visitorId || `${ip}:${userAgent}`;
  const sessionSeed = payload.sessionId || `${visitorSeed}:${new Date().toISOString().slice(0, 10)}`;

  return {
    receivedAt: new Date().toISOString(),
    eventType: truncate(payload.eventType || 'page_view', 64),
    visitorIdHash: hashValue(env, visitorSeed),
    sessionIdHash: hashValue(env, sessionSeed),
    path: safePath(payload.path || payload.url || '/'),
    url: truncate(payload.url, 1000),
    title: truncate(payload.title, 300),
    referrer: truncate(payload.referrer, 1000),
    language: truncate(payload.language, 64),
    screen: truncate(payload.screen, 64),
    userAgentHash: hashValue(env, userAgent),
    ipHash: hashValue(env, ip),
  };
}

export async function appendTrafficEvent(env: AppEnv, event: AnyRecord) {
  const storedInKv = await appendJsonEvent(env, 'traffic_events', event, Number(env.TRAFFIC_EVENT_LIMIT) || 10000);
  if (storedInKv) return;

  const logPath = getTrafficLogPath(env);
  if (!logPath) return;

  fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, { mode: 0o600 });
}

export async function readTrafficEvents(env: AppEnv, options: AnyRecord = {}) {
  const days = Math.min(Math.max(Number(options.days) || 30, 1), 365);
  const limit = Math.min(Math.max(Number(options.limit) || 10000, 1), 50000);
  const kvEvents = await readJsonEvents<AnyRecord>(env, 'traffic_events', limit);

  if (kvEvents) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return kvEvents.filter((event) => {
      const timestamp = Date.parse(event.receivedAt);
      return Number.isFinite(timestamp) && timestamp >= since;
    });
  }

  const logPath = path.join(getDataDir(env), 'traffic.jsonl');

  if (!fs.existsSync(logPath)) return [];

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const lines = fs
    .readFileSync(logPath, 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit);

  return lines.flatMap((line) => {
    try {
      const event = JSON.parse(line);
      const timestamp = Date.parse(event.receivedAt);

      if (!Number.isFinite(timestamp) || timestamp < since) return [];
      return [event];
    } catch {
      return [];
    }
  });
}

function incrementCount(map: Map<string, number>, key: unknown, amount = 1) {
  const normalizedKey = String(key || 'Direct / unknown');
  map.set(normalizedKey, (map.get(normalizedKey) || 0) + amount);
}

function topEntries(map: Map<string, number>, limit = 10) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export async function summarizeTraffic(env: AppEnv, options: AnyRecord = {}) {
  const events = await readTrafficEvents(env, options);
  const pageViewEvents = events.filter((event) => event.eventType === 'page_view');
  const uniqueVisitors = new Set(pageViewEvents.map((event) => event.visitorIdHash));
  const uniqueSessions = new Set(pageViewEvents.map((event) => event.sessionIdHash));
  const pageCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const dailyCounts = new Map<string, number>();

  for (const event of pageViewEvents) {
    incrementCount(pageCounts, event.path || '/');

    let referrer = 'Direct / unknown';
    try {
      if (event.referrer) {
        const url = new URL(event.referrer);
        referrer = url.hostname;
      }
    } catch {
      referrer = event.referrer || 'Direct / unknown';
    }

    incrementCount(referrerCounts, referrer);
    incrementCount(dailyCounts, String(event.receivedAt || '').slice(0, 10));
  }

  return {
    ok: true,
    source: 'local-traffic-collector',
    days: Math.min(Math.max(Number(options.days) || 30, 1), 365),
    pageViews: pageViewEvents.length,
    uniqueVisitors: uniqueVisitors.size,
    sessions: uniqueSessions.size,
    topPages: topEntries(pageCounts),
    referrers: topEntries(referrerCounts),
    daily: topEntries(dailyCounts, 60).sort((left, right) => left.label.localeCompare(right.label)),
    recentEvents: pageViewEvents.slice(-20).reverse(),
    trackingScriptUrl: `${getPublicAppUrl(env)}/api/traffic/script.js`,
    note: 'Traffic appears after the storefront loads the tracking script and can reach this API URL.',
  };
}

export function renderTrafficScript() {
  return `(() => {
  const script = document.currentScript;
  const baseUrl = script ? new URL(script.src).origin : window.location.origin;
  const endpoint = baseUrl + '/api/traffic/collect';
  const visitorKey = 'angelcare_dashboard_visitor_id';
  const sessionKey = 'angelcare_dashboard_session_id';

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return prefix + '-' + window.crypto.randomUUID();
    }
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function getStoredId(storage, key, prefix) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = makeId(prefix);
        storage.setItem(key, value);
      }
      return value;
    } catch {
      return makeId(prefix);
    }
  }

  const payload = {
    eventType: 'page_view',
    visitorId: getStoredId(window.localStorage, visitorKey, 'visitor'),
    sessionId: getStoredId(window.sessionStorage, sessionKey, 'session'),
    url: window.location.href,
    path: window.location.pathname + window.location.search,
    title: document.title,
    referrer: document.referrer,
    language: navigator.language,
    screen: window.screen ? window.screen.width + 'x' + window.screen.height : ''
  };
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(endpoint, blob)) return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    mode: 'cors'
  }).catch(() => {});
})();`;
}
