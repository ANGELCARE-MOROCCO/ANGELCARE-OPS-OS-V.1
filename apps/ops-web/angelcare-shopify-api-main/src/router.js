const path = require('node:path');

const {
  envPath: defaultEnvPath,
  getPublicAppUrl,
  loadEnv,
  normalizeShopDomain,
  validateConfig,
} = require('./config/env');
const {
  createSafeError,
  escapeHtml,
  sendHtml,
  sendJson,
  setCorsHeaders,
} = require('./http/responses');
const { readJsonBody, readRequestBody } = require('./lib/body');
const {
  createInstallState,
  updateAccessToken,
  verifyInstallState,
  verifyShopifyHmac,
  verifyWebhookHmac,
} = require('./lib/security');
const {
  adjustInventory,
  calculateRevenueMetrics,
  exchangeCodeForToken,
  fetchAdminDashboardData,
  fetchPublicProducts,
} = require('./services/shopify');
const {
  buildPendingAnalytics,
  fetchAdminAnalytics,
} = require('./services/analytics');
const { buildDashboardSummary } = require('./services/dashboard');
const {
  appendWebhookEvent,
  getWebhookMetadata,
  readRecentWebhookEvents,
} = require('./services/webhooks');
const {
  appendTrafficEvent,
  normalizeTrafficEvent,
  renderTrafficScript,
  summarizeTraffic,
} = require('./services/traffic');
const {
  getAdminAccessToken,
  getAuthMode,
} = require('./services/token');
const { renderDashboard } = require('./views/dashboard');

async function handleOAuthCallback(req, res, url, env, configPath) {
  validateConfig(env, ['PORT', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION']);

  const code = url.searchParams.get('code');
  const shop = normalizeShopDomain(url.searchParams.get('shop'));
  const state = url.searchParams.get('state');

  if (!code) {
    return sendHtml(res, 400, '<h1>Missing OAuth code</h1><p>The Shopify callback did not include a code.</p>');
  }

  if (shop && shop !== env.SHOPIFY_SHOP_DOMAIN) {
    return sendHtml(
      res,
      400,
      `<h1>Unexpected shop</h1><p>Expected ${escapeHtml(env.SHOPIFY_SHOP_DOMAIN)} but received ${escapeHtml(shop)}.</p>`,
    );
  }

  if (url.searchParams.has('hmac') && !verifyShopifyHmac(url.searchParams, env.SHOPIFY_CLIENT_SECRET)) {
    return sendHtml(res, 401, '<h1>Invalid Shopify signature</h1><p>The callback HMAC could not be verified.</p>');
  }

  if (state && !verifyInstallState(state, env)) {
    return sendHtml(res, 401, '<h1>Invalid install state</h1><p>The callback state value is missing or expired.</p>');
  }

  try {
    const result = await exchangeCodeForToken(code, env);
    updateAccessToken(configPath, result.accessToken);

    console.log(`[OAuth] Stored Shopify access token for ${env.SHOPIFY_SHOP_DOMAIN}. Scope: ${result.scope || 'not provided'}`);

    return sendHtml(
      res,
      200,
      [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Shopify Connected</title>',
        '<style>body{font-family:ui-sans-serif,system-ui;margin:40px;line-height:1.5;color:#17211c}a{color:#195b45}</style></head>',
        '<body>',
        '<h1>Shopify connected</h1>',
        `<p>The offline access token was saved to <code>${escapeHtml(path.relative(process.cwd(), configPath))}</code>.</p>`,
        `<p><a href="${escapeHtml(getPublicAppUrl(env))}/dashboard">Open the dashboard</a></p>`,
        '</body>',
        '</html>',
      ].join(''),
    );
  } catch (error) {
    console.error(`[OAuth] ${createSafeError(error)}`);
    return sendHtml(res, 502, `<h1>Token exchange failed</h1><p>${escapeHtml(createSafeError(error))}</p>`);
  }
}

function handleInstall(req, res, env) {
  validateConfig(env, ['PORT', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION', 'SHOPIFY_SCOPES']);

  const appUrl = getPublicAppUrl(env);
  const installUrl = new URL(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/authorize`);

  installUrl.searchParams.set('client_id', env.SHOPIFY_CLIENT_ID);
  installUrl.searchParams.set('redirect_uri', `${appUrl}/api/auth/callback`);
  installUrl.searchParams.set('state', createInstallState(env));

  if (env.SHOPIFY_OMIT_AUTH_SCOPES !== 'true') {
    installUrl.searchParams.set('scope', env.SHOPIFY_SCOPES);
  }

  res.writeHead(302, {
    Location: installUrl.toString(),
    'Cache-Control': 'no-store',
  });
  res.end();
}

async function handleManualExchange(req, res, env, configPath) {
  validateConfig(env, ['PORT', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION']);

  try {
    const body = await readRequestBody(req);
    const params = new URLSearchParams(body);
    const code = params.get('code');

    if (!code) {
      return sendJson(res, 400, { success: false, error: 'Missing code form field.' });
    }

    const result = await exchangeCodeForToken(code, env);
    updateAccessToken(configPath, result.accessToken);

    console.log(`[OAuth] Manually stored Shopify access token for ${env.SHOPIFY_SHOP_DOMAIN}. Scope: ${result.scope || 'not provided'}`);

    return sendJson(res, 200, {
      success: true,
      message: 'Access token saved to apps/api/.env.',
      scope: result.scope,
    });
  } catch (error) {
    console.error(`[OAuth] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleDashboardSummary(req, res, url, env) {
  try {
    const summary = await buildDashboardSummary(env, url);
    return sendJson(res, 200, summary);
  } catch (error) {
    console.error(`[Dashboard] ${createSafeError(error)}`);
    return sendJson(res, 502, {
      success: false,
      error: createSafeError(error),
      installUrl: `${getPublicAppUrl(env)}/install`,
    });
  }
}

async function handleProducts(req, res, env) {
  try {
    if (!env.SHOPIFY_ACCESS_TOKEN) {
      const products = await fetchPublicProducts(env, 50);
      return sendJson(res, 200, {
        success: true,
        source: 'shopify-public-products-json',
        auth: 'pending',
        data: products,
      });
    }

    const dashboard = await fetchAdminDashboardData(env, { productsFirst: 50, ordersFirst: 1 });
    return sendJson(res, 200, {
      success: true,
      source: 'shopify-admin-graphql',
      auth: 'connected',
      data: dashboard.products,
    });
  } catch (error) {
    console.error(`[Products] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleOrders(req, res, env) {
  try {
    const dashboard = await fetchAdminDashboardData(env, { productsFirst: 1, ordersFirst: 50 });
    return sendJson(res, 200, {
      success: true,
      source: 'shopify-admin-graphql',
      auth: 'connected',
      data: dashboard.orders,
    });
  } catch (error) {
    console.error(`[Orders] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleLocations(req, res, env) {
  try {
    const dashboard = await fetchAdminDashboardData(env, { productsFirst: 1, ordersFirst: 1, locationsFirst: 50 });
    return sendJson(res, 200, {
      success: true,
      source: 'shopify-admin-graphql',
      auth: 'connected',
      data: dashboard.locations,
    });
  } catch (error) {
    console.error(`[Locations] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleRevenueMetrics(req, res, url, env) {
  try {
    const metrics = await calculateRevenueMetrics(env, url.searchParams.get('max') || 250);
    return sendJson(res, 200, {
      success: true,
      source: 'shopify-admin-graphql',
      auth: 'connected',
      data: metrics,
    });
  } catch (error) {
    console.error(`[Metrics] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleAnalytics(req, res, url, env, sectionName = null) {
  try {
    if (getAuthMode(env) !== 'static_access_token' && getAuthMode(env) !== 'client_credentials') {
      const pending = buildPendingAnalytics();
      return sendJson(res, 200, {
        success: true,
        source: 'shopify-admin-unavailable',
        auth: 'pending',
        data: sectionName ? pending[sectionName] : pending,
      });
    }

    const revenueMetrics = await calculateRevenueMetrics(env, url.searchParams.get('maxOrders') || 250);
    const analytics = await fetchAdminAnalytics(env, {
      revenueMetrics,
      customersFirst: url.searchParams.get('customers') || 25,
      checkoutsFirst: url.searchParams.get('checkouts') || 25,
      paymentsFirst: url.searchParams.get('payments') || 10,
    });

    return sendJson(res, 200, {
      success: true,
      source: 'shopify-admin-graphql-and-rest',
      auth: 'connected',
      data: sectionName ? analytics[sectionName] : analytics,
    });
  } catch (error) {
    console.error(`[Analytics] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleClientCredentialsToken(req, res, env) {
  try {
    const token = await getAdminAccessToken(env);

    return sendJson(res, 200, {
      success: true,
      source: token.source,
      accessToken: 'set',
      scope: token.scope,
      expiresAt: token.expiresAt ? new Date(token.expiresAt).toISOString() : null,
    });
  } catch (error) {
    console.error(`[Auth] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

async function handleInventoryAdjust(req, res, env) {
  try {
    const body = await readJsonBody(req);
    const result = await adjustInventory(env, body);

    return sendJson(res, 200, {
      success: true,
      source: 'shopify-admin-graphql',
      data: result,
    });
  } catch (error) {
    const message = createSafeError(error);
    const statusCode = message.includes('IDEMPOTENCY_CONCURRENT_REQUEST') ? 409 : 400;
    console.error(`[Inventory] ${message}`);
    return sendJson(res, statusCode, {
      success: false,
      error: message,
      userErrors: error.userErrors || undefined,
    });
  }
}

async function handleWebhook(req, res, env) {
  try {
    const rawBody = await readRequestBody(req);
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const allowUnsigned =
      env.ALLOW_UNSIGNED_WEBHOOKS === 'true' ||
      (env.NODE_ENV !== 'production' && !hmacHeader);

    if (hmacHeader && !verifyWebhookHmac(rawBody, hmacHeader, env.SHOPIFY_CLIENT_SECRET)) {
      return sendJson(res, 401, { success: false, error: 'Invalid webhook HMAC.' });
    }

    if (!hmacHeader && !allowUnsigned) {
      return sendJson(res, 401, { success: false, error: 'Missing webhook HMAC.' });
    }

    let payload = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return sendJson(res, 400, { success: false, error: 'Webhook body must be valid JSON.' });
      }
    }

    const metadata = getWebhookMetadata(req, payload);
    const event = {
      receivedAt: new Date().toISOString(),
      ...metadata,
      verified: Boolean(hmacHeader),
      payload,
    };

    appendWebhookEvent(env, event);
    console.log(`[Webhook] Stored ${event.topic} for ${event.shopDomain}`);

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error(`[Webhook] ${createSafeError(error)}`);
    return sendJson(res, 500, { success: false, error: createSafeError(error) });
  }
}

async function handleTrafficCollect(req, res, env) {
  try {
    const body = await readJsonBody(req);
    const event = normalizeTrafficEvent(env, req, body);
    appendTrafficEvent(env, event);

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error(`[Traffic] ${createSafeError(error)}`);
    return sendJson(res, 400, { success: false, error: createSafeError(error) });
  }
}

function handleTrafficScript(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(renderTrafficScript());
}

function formatEndpointList(env) {
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
    trafficSummary: `${appUrl}/api/traffic/summary`,
    trafficCollect: `${appUrl}/api/traffic/collect`,
    trafficScript: `${appUrl}/api/traffic/script.js`,
    revenueMetrics: `${appUrl}/api/metrics/revenue`,
    inventoryAdjust: `${appUrl}/api/inventory/adjust`,
    webhooks: `${appUrl}/api/webhooks/shopify`,
  };
}

function handleDashboardPage(req, res, env) {
  return sendHtml(res, 200, renderDashboard(env));
}

async function handleRequest(req, res, configPath = defaultEnvPath) {
  let env;

  try {
    env = loadEnv(configPath);
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

  const url = new URL(req.url, req.headers.host ? `http://${req.headers.host}` : getPublicAppUrl(env));

  if (req.method === 'GET' && url.pathname === '/') {
    return sendJson(res, 200, {
      success: true,
      service: 'AngelCare Shopify dashboard integration',
      shop: env.SHOPIFY_SHOP_DOMAIN,
      apiVersion: env.SHOPIFY_API_VERSION,
      authMode: getAuthMode(env),
      accessToken: env.SHOPIFY_ACCESS_TOKEN ? 'set' : 'dynamic',
      endpoints: formatEndpointList(env),
    });
  }

  if (req.method === 'GET' && url.pathname === '/dashboard') {
    return handleDashboardPage(req, res, env);
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, {
      success: true,
      shop: env.SHOPIFY_SHOP_DOMAIN,
      authMode: getAuthMode(env),
      accessToken: env.SHOPIFY_ACCESS_TOKEN ? 'set' : 'dynamic',
    });
  }

  if (req.method === 'GET' && url.pathname === '/install') {
    return handleInstall(req, res, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/callback') {
    return handleOAuthCallback(req, res, url, env, configPath);
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/exchange') {
    return handleManualExchange(req, res, env, configPath);
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/client-credentials') {
    return handleClientCredentialsToken(req, res, env);
  }

  if (req.method === 'GET' && (url.pathname === '/api/dashboard/summary' || url.pathname === '/api/shopify/smoke')) {
    return handleDashboardSummary(req, res, url, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/products') {
    return handleProducts(req, res, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    return handleOrders(req, res, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/locations') {
    return handleLocations(req, res, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/metrics/revenue') {
    return handleRevenueMetrics(req, res, url, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/analytics') {
    return handleAnalytics(req, res, url, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/customers') {
    return handleAnalytics(req, res, url, env, 'customers');
  }

  if (req.method === 'GET' && url.pathname === '/api/checkouts') {
    return handleAnalytics(req, res, url, env, 'checkouts');
  }

  if (req.method === 'GET' && url.pathname === '/api/payments') {
    return handleAnalytics(req, res, url, env, 'payments');
  }

  if (req.method === 'GET' && url.pathname === '/api/traffic/summary') {
    return sendJson(res, 200, {
      success: true,
      data: summarizeTraffic(env, {
        days: url.searchParams.get('days') || 30,
      }),
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/traffic/script.js') {
    return handleTrafficScript(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/traffic/collect') {
    return handleTrafficCollect(req, res, env);
  }

  if (req.method === 'POST' && url.pathname === '/api/inventory/adjust') {
    return handleInventoryAdjust(req, res, env);
  }

  if (req.method === 'POST' && url.pathname === '/api/webhooks/shopify') {
    return handleWebhook(req, res, env);
  }

  if (req.method === 'GET' && url.pathname === '/api/webhooks/events') {
    return sendJson(res, 200, {
      success: true,
      data: readRecentWebhookEvents(env, Number(url.searchParams.get('limit')) || 20),
    });
  }

  return sendJson(res, 404, { success: false, error: 'Not found' });
}

function createRequestHandler(options = {}) {
  const configPath = options.envPath || defaultEnvPath;
  return (req, res) => handleRequest(req, res, configPath);
}

module.exports = {
  createRequestHandler,
  formatEndpointList,
  handleRequest,
};
