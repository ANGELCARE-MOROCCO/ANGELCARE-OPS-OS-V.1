const { getPublicAppUrl } = require('../config/env');
const { buildPendingAnalytics, fetchAdminAnalytics } = require('./analytics');
const {
  calculateProductMetrics,
  calculateRevenueMetrics,
  fetchAdminDashboardData,
  fetchPublicProducts,
} = require('./shopify');
const { summarizeTraffic } = require('./traffic');
const { getAuthMode } = require('./token');
const { readRecentWebhookEvents } = require('./webhooks');

async function buildDashboardSummary(env, url) {
  const productsFirst = url.searchParams.get('products');
  const ordersFirst = url.searchParams.get('orders');
  const metricsMax = url.searchParams.get('maxOrders') || 250;

  if (getAuthMode(env) !== 'static_access_token' && getAuthMode(env) !== 'client_credentials') {
    const products = await fetchPublicProducts(env);

    return {
      success: true,
      source: 'shopify-public-products-json',
      auth: 'pending',
      apiVersion: env.SHOPIFY_API_VERSION,
      message: 'Public storefront data is available. Complete the OAuth authorization callback, or add an Admin API access token, to unlock Admin API orders, inventory, customers, checkouts, payments, and analytics.',
      installUrl: `${getPublicAppUrl(env)}/install`,
      data: {
        shop: {
          name: 'AngelCare',
          myshopifyDomain: env.SHOPIFY_SHOP_DOMAIN,
          currencyCode: null,
          plan: null,
        },
        metrics: {
          ...calculateProductMetrics(products),
          scannedOrdersCount: 0,
          paidOrdersCount: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          recentOrdersCount: 0,
          locationCount: 0,
        },
        analytics: buildPendingAnalytics(),
        traffic: summarizeTraffic(env),
        products,
        orders: [],
        locations: [],
        webhookEvents: readRecentWebhookEvents(env, 10),
      },
    };
  }

  const [dashboard, revenueMetrics] = await Promise.all([
    fetchAdminDashboardData(env, { productsFirst, ordersFirst }),
    calculateRevenueMetrics(env, metricsMax),
  ]);
  const analytics = await fetchAdminAnalytics(env, { revenueMetrics });

  return {
    success: true,
    source: 'shopify-admin-graphql',
    auth: 'connected',
    apiVersion: env.SHOPIFY_API_VERSION,
    data: {
      shop: dashboard.shop,
      metrics: {
        ...dashboard.metrics,
        ...revenueMetrics,
        locationCount: dashboard.locations.length,
      },
      analytics,
      traffic: summarizeTraffic(env),
      products: dashboard.products,
      orders: dashboard.orders,
      locations: dashboard.locations,
      throttleStatus: dashboard.throttleStatus,
      webhookEvents: readRecentWebhookEvents(env, 10),
    },
  };
}

module.exports = {
  buildDashboardSummary,
};
