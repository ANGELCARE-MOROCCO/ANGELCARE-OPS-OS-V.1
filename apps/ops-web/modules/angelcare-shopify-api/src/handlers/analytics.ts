import { getPublicAppUrl } from '../config/env';
import { createSafeError, sendJson } from '../http/responses';
import { getCachedPayload } from '../lib/cache';
import { buildPendingAnalytics, fetchAdminAnalytics } from '../services/analytics';
import { buildDashboardSummary } from '../services/dashboard';
import { calculateRevenueMetrics, fetchAdminDashboardData } from '../services/shopify';
import { canUseAdminApi } from '../services/token';
import type { AppEnv, NodeRequest, NodeResponse } from '../types';

const CACHE_TTL_DASHBOARD_MS = 60000;

export async function handleDashboardSummary(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
  try {
    const summary = await getCachedPayload(
      env,
      'dashboardSummary',
      url,
      CACHE_TTL_DASHBOARD_MS,
      () => buildDashboardSummary(env, url),
    );
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

export async function handleOrders(req: NodeRequest, res: NodeResponse, env: AppEnv) {
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

export async function handleRevenueMetrics(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
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

export async function handleAnalytics(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv, sectionName: string | null = null) {
  try {
    if (!(await canUseAdminApi(env))) {
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
