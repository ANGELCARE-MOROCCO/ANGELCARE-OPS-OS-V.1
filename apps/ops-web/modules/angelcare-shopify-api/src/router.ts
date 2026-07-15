import fs from 'node:fs';
import path from 'node:path';

import { envPath as defaultEnvPath, getPublicAppUrl, loadEnv, validateConfig } from './config/env';
import { createSafeError, sendHtml, sendJson, setCorsHeaders } from './http/responses';
import { hasAdminAuthConfigured, isAdminAuthorized, isPublicRoute, sendAdminUnauthorized } from './middleware/auth';
import { handleClientCredentialsToken, handleInstall, handleManualExchange, handleOAuthCallback } from './handlers/oauth';
import { handleCatalogInsights, handleInventoryAdjust, handleInventoryAlerts, handleLocations, handleProducts, handleProductsCsv } from './handlers/catalog';
import { handleAnalytics, handleDashboardSummary, handleOrders, handleRevenueMetrics } from './handlers/analytics';
import { handleTrafficCollect, handleTrafficScript, handleTrafficSummary } from './handlers/traffic';
import { handleWebhook, handleWebhookEvents } from './handlers/webhooks';
import { getResolvedAuthMode } from './services/token';
import { renderDashboard } from './views/dashboard';
import type { AppEnv, EnvOverrides, NodeRequest, NodeResponse, RequestHandlerOptions } from './types';

const ADMIN_AUTH_MODES = new Set(['static_access_token', 'stored_access_token', 'client_credentials']);
const projectRoot = typeof process !== 'undefined' && typeof process.cwd === 'function'
  ? process.cwd()
  : '/tmp';

export function formatEndpointList(env: AppEnv) {
  const appUrl = getPublicAppUrl(env);
  return {
    dashboard: `${appUrl}/dashboard`,
    install: `${appUrl}/install`,
    callback: `${appUrl}/api/auth/callback`,
    summary: `${appUrl}/api/dashboard/summary`,
    products: `${appUrl}/api/products`,
    orders: `${appUrl}/api/orders`,
    customers: `${appUrl}/api/customers`,
    checkouts: `${appUrl}/api/checkouts`,
    payments: `${appUrl}/api/payments`,
    analytics: `${appUrl}/api/analytics`,
    catalogInsights: `${appUrl}/api/catalog/insights`,
    inventoryAlerts: `${appUrl}/api/inventory/alerts`,
    productsCsv: `${appUrl}/api/products/export.csv`,
    trafficSummary: `${appUrl}/api/traffic/summary`,
    trafficCollect: `${appUrl}/api/traffic/collect`,
    trafficScript: `${appUrl}/api/traffic/script.js`,
    revenueMetrics: `${appUrl}/api/metrics/revenue`,
    inventoryAdjust: `${appUrl}/api/inventory/adjust`,
    webhooks: `${appUrl}/api/webhooks/shopify`,
  };
}

export async function handleRequest(
  req: NodeRequest,
  res: NodeResponse,
  configPath = defaultEnvPath,
  envOverrides: EnvOverrides = {},
) {
  let env;

  try {
    env = loadEnv(configPath, typeof envOverrides === 'function' ? envOverrides(req) : envOverrides);
    validateConfig(env);
  } catch (error) {
    console.error(`[Config] ${createSafeError(error)}`);
    return sendJson(res, 500, { success: false, error: createSafeError(error) });
  }

  setCorsHeaders(res, env);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', req.headers.host ? `http://${req.headers.host}` : getPublicAppUrl(env));
  const method = req.method || 'GET';
  const { pathname } = url;
  const adminAuthorized = isAdminAuthorized(req, env);

  if (!isPublicRoute(method, pathname) && !adminAuthorized) {
    return sendAdminUnauthorized(req, res);
  }

  // --- Root and status ---

  if (method === 'GET' && pathname === '/') {
    const authMode = await getResolvedAuthMode(env);
    return sendJson(res, 200, {
      success: true,
      service: 'AngelCare Shopify dashboard integration',
      shop: env.SHOPIFY_SHOP_DOMAIN,
      apiVersion: env.SHOPIFY_API_VERSION,
      authMode,
      accessToken: ADMIN_AUTH_MODES.has(authMode) ? 'set' : 'missing',
      endpoints: formatEndpointList(env),
    });
  }

  if (method === 'GET' && pathname === '/health') {
    const health: Record<string, unknown> = {
      success: true,
      service: 'AngelCare Shopify dashboard integration',
      adminRoutesProtected: true,
      adminAuthConfigured: hasAdminAuthConfigured(env),
    };

    if (adminAuthorized) {
      const authMode = await getResolvedAuthMode(env);
      health.shop = env.SHOPIFY_SHOP_DOMAIN;
      health.authMode = authMode;
      health.accessToken = ADMIN_AUTH_MODES.has(authMode) ? 'set' : 'missing';
    }

    return sendJson(res, 200, health);
  }

  if (method === 'GET' && pathname === '/dashboard') {
    return sendHtml(res, 200, renderDashboard(env));
  }

  // Serve Vite-built static assets (hashed filenames → safe to cache forever)
  if (method === 'GET' && pathname.startsWith('/assets/')) {
    const assetPath = path.join(projectRoot, 'dist', pathname.replace(/^\/+/, ''));
    if (!fs.existsSync(assetPath)) return sendJson(res, 404, { success: false, error: 'Asset not found' });
    const ext  = path.extname(assetPath);
    const mime = ({ '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' } as Record<string, string>)[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
    fs.createReadStream(assetPath).pipe(res);
    return;
  }

  // --- OAuth and auth ---

  if (method === 'GET' && pathname === '/install') return handleInstall(req, res, env);
  if (method === 'GET' && pathname === '/api/auth/callback') return handleOAuthCallback(req, res, url, env, configPath);
  if (method === 'POST' && pathname === '/api/auth/exchange') return handleManualExchange(req, res, env, configPath);
  if (method === 'GET' && pathname === '/api/auth/client-credentials') return handleClientCredentialsToken(req, res, env);

  // --- Dashboard and analytics ---

  if (method === 'GET' && (pathname === '/api/dashboard/summary' || pathname === '/api/shopify/smoke')) {
    return handleDashboardSummary(req, res, url, env);
  }

  if (method === 'GET' && pathname === '/api/analytics') return handleAnalytics(req, res, url, env);
  if (method === 'GET' && pathname === '/api/customers') return handleAnalytics(req, res, url, env, 'customers');
  if (method === 'GET' && pathname === '/api/checkouts') return handleAnalytics(req, res, url, env, 'checkouts');
  if (method === 'GET' && pathname === '/api/payments') return handleAnalytics(req, res, url, env, 'payments');
  if (method === 'GET' && pathname === '/api/metrics/revenue') return handleRevenueMetrics(req, res, url, env);
  if (method === 'GET' && pathname === '/api/orders') return handleOrders(req, res, env);

  // --- Catalog and inventory ---

  if (method === 'GET' && pathname === '/api/products') return handleProducts(req, res, env);
  if (method === 'GET' && pathname === '/api/products/export.csv') return handleProductsCsv(req, res, url, env);
  if (method === 'GET' && pathname === '/api/catalog/insights') return handleCatalogInsights(req, res, url, env);
  if (method === 'GET' && pathname === '/api/inventory/alerts') return handleInventoryAlerts(req, res, url, env);
  if (method === 'GET' && pathname === '/api/locations') return handleLocations(req, res, env);
  if (method === 'POST' && pathname === '/api/inventory/adjust') return handleInventoryAdjust(req, res, env);

  // --- Traffic ---

  if (method === 'GET' && pathname === '/api/traffic/summary') return handleTrafficSummary(req, res, url, env);
  if (method === 'GET' && pathname === '/api/traffic/script.js') return handleTrafficScript(req, res);
  if (method === 'POST' && pathname === '/api/traffic/collect') return handleTrafficCollect(req, res, env);

  // --- Webhooks ---

  if (method === 'POST' && pathname === '/api/webhooks/shopify') return handleWebhook(req, res, env);
  if (method === 'GET' && pathname === '/api/webhooks/events') return handleWebhookEvents(req, res, url, env);

  return sendJson(res, 404, { success: false, error: 'Not found' });
}

export function createRequestHandler(options: RequestHandlerOptions = {}) {
  const configPath = options.envPath || defaultEnvPath;
  const envOverrides = options.envOverrides || {};
  return (req, res) => handleRequest(req, res, configPath, envOverrides);
}
