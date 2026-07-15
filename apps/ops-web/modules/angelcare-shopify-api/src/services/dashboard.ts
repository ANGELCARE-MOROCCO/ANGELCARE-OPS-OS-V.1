import { getPublicAppUrl } from '../config/env';
import { buildPendingAnalytics, fetchAdminAnalytics } from './analytics';
import {
  calculateProductMetrics,
  calculateRevenueMetrics,
  fetchAdminDashboardData,
  fetchPublicProducts,
} from './shopify';
import { summarizeTraffic } from './traffic';
import { getResolvedAuthMode } from './token';
import { readRecentWebhookEvents } from './webhooks';
import type { AnyRecord, AppEnv } from '../types';

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unavailable');
}

function emptyRevenueMetrics() {
  return {
    scannedOrdersCount: 0,
    paidOrdersCount: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    currencyCode: null,
  };
}

function emptyDashboardData(env: AppEnv) {
  const products: AnyRecord[] = [];

  return {
    shop: {
      name: 'AngelCare',
      myshopifyDomain: env.SHOPIFY_SHOP_DOMAIN,
      currencyCode: null,
      plan: null,
    },
    products,
    orders: [] as AnyRecord[],
    locations: [] as AnyRecord[],
    metrics: {
      ...calculateProductMetrics(products),
      recentOrdersCount: 0,
      locationCount: 0,
    },
    throttleStatus: null,
  };
}

async function optionalDataSection(
  name: string,
  task: () => Promise<unknown>,
  fallback: unknown | ((error: unknown) => unknown),
): Promise<AnyRecord> {
  const startedAt = Date.now();

  try {
    return {
      name,
      ok: true,
      data: await task(),
      durationMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      data: typeof fallback === 'function' ? fallback(error) : fallback,
      durationMs: Date.now() - startedAt,
      error: safeErrorMessage(error),
    };
  }
}

function createAnalyticsFallback(error: unknown) {
  const analytics = buildPendingAnalytics();
  analytics.issues = [{
    section: 'analytics',
    error: safeErrorMessage(error),
  }];
  return analytics;
}

function collectWarnings(sections: AnyRecord[]) {
  return sections
    .filter((section) => !section.ok)
    .map((section) => ({
      section: section.name,
      error: section.error,
    }));
}

function buildDiagnostics(env: AppEnv, options: AnyRecord) {
  return {
    generatedAt: new Date().toISOString(),
    responseTimeMs: Date.now() - options.startedAt,
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    apiVersion: env.SHOPIFY_API_VERSION,
    authMode: options.authMode,
    adminApiAvailable: options.adminApiAvailable,
    appUrl: getPublicAppUrl(env),
    installUrl: `${getPublicAppUrl(env)}/install`,
    warnings: options.warnings,
    sections: options.sections.map((section: AnyRecord) => ({
      name: section.name,
      ok: section.ok,
      durationMs: section.durationMs,
      error: section.error,
    })),
  };
}

function percent(part: unknown, total: unknown) {
  return total ? Number(((Number(part || 0) / Number(total)) * 100).toFixed(1)) : 0;
}

function incrementCount(map: Map<string, number>, label: unknown, amount = 1) {
  const key = String(label || 'Not set').trim() || 'Not set';
  map.set(key, (map.get(key) || 0) + amount);
}

function topMix(map: Map<string, number>, limit = 8) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export function getVariantStockState(variant) {
  if (variant.tracked === false) return 'untracked';

  const quantity = Number(variant.inventoryQuantity);
  if (!Number.isFinite(quantity)) return variant.available ? 'available' : 'unavailable';
  if (quantity === 0) return 'out';
  if (quantity <= 5) return 'low';
  return 'stocked';
}

function buildInventoryAlert(product, variant) {
  const state = getVariantStockState(variant);

  if (!['out', 'low', 'untracked', 'unavailable'].includes(state)) {
    return null;
  }

  const severity = state === 'out' || state === 'unavailable'
    ? 'high'
    : (state === 'low' ? 'medium' : 'info');

  return {
    severity,
    state,
    productId: product.id,
    productTitle: product.title,
    handle: product.handle,
    variantId: variant.id,
    variantTitle: variant.title,
    sku: variant.sku || null,
    tracked: variant.tracked,
    available: variant.available,
    inventoryQuantity: variant.inventoryQuantity,
    inventoryItemId: variant.inventoryItemId || null,
    locationCount: (variant.inventoryLevels || []).length,
  };
}

export function buildCatalogInsights(products: AnyRecord[], options: AnyRecord = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 12, 1), 100);
  const variants = products.flatMap((product) => (
    (product.variants?.length ? product.variants : []).map((variant) => ({ product, variant }))
  ));
  const metrics = calculateProductMetrics(products);
  const statusMix = new Map<string, number>();
  const vendorMix = new Map<string, number>();
  const typeMix = new Map<string, number>();
  const stockMix = new Map<string, number>();
  const alerts: AnyRecord[] = [];
  const topInventoryVariants: AnyRecord[] = [];

  for (const product of products) {
    incrementCount(statusMix, product.status);
    incrementCount(vendorMix, product.vendor);
    incrementCount(typeMix, product.productType);
  }

  for (const { product, variant } of variants) {
    const state = getVariantStockState(variant);
    incrementCount(stockMix, state);

    const alert = buildInventoryAlert(product, variant);
    if (alert) alerts.push(alert);

    const quantity = Number(variant.inventoryQuantity);
    if (Number.isFinite(quantity) && variant.tracked) {
      topInventoryVariants.push({
        productTitle: product.title,
        variantTitle: variant.title,
        sku: variant.sku || null,
        inventoryQuantity: quantity,
      });
    }
  }

  const alertRank: Record<string, number> = { high: 0, medium: 1, info: 2 };
  alerts.sort((left, right) => {
    const severity = alertRank[left.severity] - alertRank[right.severity];
    if (severity) return severity;
    return String(left.productTitle).localeCompare(String(right.productTitle));
  });
  topInventoryVariants.sort((left, right) => right.inventoryQuantity - left.inventoryQuantity);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      productCount: metrics.productCount,
      variantCount: metrics.variantCount,
      trackedVariantCount: metrics.trackedVariantCount,
      untrackedVariantCount: metrics.untrackedVariantCount,
      availableVariants: metrics.availableVariants,
      unavailableVariants: Math.max(metrics.variantCount - metrics.availableVariants, 0),
      inventoryUnits: metrics.inventoryUnits,
      lowStockVariants: metrics.lowStockVariants,
      outOfStockVariants: metrics.outOfStockVariants,
    },
    coverage: {
      trackingCoveragePct: percent(metrics.trackedVariantCount, metrics.variantCount),
      availabilityPct: percent(metrics.availableVariants, metrics.variantCount),
      untrackedPct: percent(metrics.untrackedVariantCount, metrics.variantCount),
    },
    mix: {
      status: topMix(statusMix, limit),
      vendors: topMix(vendorMix, limit),
      productTypes: topMix(typeMix, limit),
      stock: topMix(stockMix, limit),
    },
    alerts: alerts.slice(0, limit),
    alertCounts: alerts.reduce((counts, alert) => {
      counts[alert.state] = (counts[alert.state] || 0) + 1;
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
      return counts;
    }, {}),
    topInventoryVariants: topInventoryVariants.slice(0, limit),
  };
}

export async function buildDashboardSummary(env: AppEnv, url: URL) {
  const startedAt = Date.now();
  const productsFirst = url.searchParams.get('products') || 50;
  const ordersFirst = url.searchParams.get('orders') || 25;
  const metricsMax = url.searchParams.get('maxOrders') || 250;
  const trafficDays = url.searchParams.get('days') || 30;
  const authMode = await getResolvedAuthMode(env);
  const [traffic, webhookEvents] = await Promise.all([
    optionalDataSection('traffic', () => summarizeTraffic(env, { days: trafficDays }), {
      ok: false,
      source: 'local-traffic-collector',
      days: Math.min(Math.max(Number(trafficDays) || 30, 1), 365),
      pageViews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      topPages: [],
      referrers: [],
      daily: [],
      recentEvents: [],
      trackingScriptUrl: `${getPublicAppUrl(env)}/api/traffic/script.js`,
      note: 'Traffic storage is unavailable.',
    }),
    optionalDataSection('webhooks', () => readRecentWebhookEvents(env, 10), []),
  ]);
  const baseSections = [traffic, webhookEvents];
  const adminApiAvailable = ['static_access_token', 'stored_access_token', 'client_credentials'].includes(authMode);

  if (!adminApiAvailable) {
    const publicProducts = await optionalDataSection('publicProducts', () => fetchPublicProducts(env), []);
    const sections = [...baseSections, publicProducts];
    const warnings = collectWarnings(sections);
    const products = publicProducts.data;

    return {
      success: true,
      source: 'shopify-public-products-json',
      auth: 'pending',
      apiVersion: env.SHOPIFY_API_VERSION,
      message: 'Public storefront data is available. Complete the OAuth authorization callback, or add an Admin API access token, to unlock Admin API orders, inventory, customers, checkouts, payments, and analytics.',
      warning: warnings[0]?.error || null,
      warnings,
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
          ...emptyRevenueMetrics(),
          scannedOrdersCount: 0,
          paidOrdersCount: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          recentOrdersCount: 0,
          locationCount: 0,
        },
        analytics: buildPendingAnalytics(),
        catalogInsights: buildCatalogInsights(products),
        traffic: traffic.data,
        products,
        orders: [],
        locations: [],
        throttleStatus: null,
        webhookEvents: webhookEvents.data,
        diagnostics: buildDiagnostics(env, {
          startedAt,
          authMode,
          adminApiAvailable,
          sections,
          warnings,
        }),
      },
    };
  }

  const [dashboard, revenueMetrics] = await Promise.all([
    optionalDataSection('dashboardData', () => fetchAdminDashboardData(env, { productsFirst, ordersFirst }), emptyDashboardData(env)),
    optionalDataSection('revenueMetrics', () => calculateRevenueMetrics(env, metricsMax), emptyRevenueMetrics()),
  ]);
  const analytics = await optionalDataSection(
    'analytics',
    () => fetchAdminAnalytics(env, { revenueMetrics: revenueMetrics.data }),
    createAnalyticsFallback,
  );
  const sections = [...baseSections, dashboard, revenueMetrics, analytics];
  const warnings = collectWarnings(sections);
  const dashboardData = dashboard.data;
  const mergedMetrics = {
    ...dashboardData.metrics,
    ...revenueMetrics.data,
    locationCount: dashboardData.locations.length,
  };

  return {
    success: true,
    source: warnings.length ? 'shopify-admin-graphql-partial' : 'shopify-admin-graphql',
    auth: 'connected',
    apiVersion: env.SHOPIFY_API_VERSION,
    warning: warnings[0]?.error || null,
    warnings,
    data: {
      shop: dashboardData.shop,
      metrics: mergedMetrics,
      analytics: analytics.data,
      catalogInsights: buildCatalogInsights(dashboardData.products),
      traffic: traffic.data,
      products: dashboardData.products,
      orders: dashboardData.orders,
      locations: dashboardData.locations,
      throttleStatus: dashboardData.throttleStatus,
      webhookEvents: webhookEvents.data,
      diagnostics: buildDiagnostics(env, {
        startedAt,
        authMode,
        adminApiAvailable,
        sections,
        warnings,
      }),
    },
  };
}
