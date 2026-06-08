import { createSafeError, sendJson } from '../http/responses';
import { readJsonBody } from '../lib/body';
import { clearCachedResponses, getCachedPayload } from '../lib/cache';
import { buildCatalogInsights, getVariantStockState } from '../services/dashboard';
import { adjustInventory, fetchAdminDashboardData, fetchPublicProducts } from '../services/shopify';
import { canUseAdminApi } from '../services/token';
import type { AnyRecord, AppEnv, NodeRequest, NodeResponse } from '../types';

const CACHE_TTL_MS = {
  catalogInsights: 120000,
  inventoryAlerts: 60000,
  productsCsv: 60000,
};

async function fetchCatalogProducts(env: AppEnv, url: URL, options: AnyRecord = {}) {
  const productsFirst = url.searchParams.get('products') || options.productsFirst || 50;

  if (!(await canUseAdminApi(env))) {
    return {
      auth: 'pending',
      source: 'shopify-public-products-json',
      products: await fetchPublicProducts(env, productsFirst),
    };
  }

  const dashboard = await fetchAdminDashboardData(env, {
    productsFirst,
    ordersFirst: 1,
    locationsFirst: options.locationsFirst || 10,
  });

  return {
    auth: 'connected',
    source: 'shopify-admin-graphql',
    products: dashboard.products,
    throttleStatus: dashboard.throttleStatus,
  };
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function csvRowsForProducts(products) {
  const header = [
    'Product', 'Handle', 'Vendor', 'Product Type', 'Status', 'Updated At',
    'Variant', 'SKU', 'Price', 'Available', 'Tracked', 'Stock State',
    'Inventory Quantity', 'Inventory Item ID', 'Inventory Locations',
  ];
  const rows = [header];

  for (const product of products) {
    const variants = product.variants?.length ? product.variants : [{ title: 'Default' }];

    for (const variant of variants) {
      rows.push([
        product.title, product.handle, product.vendor, product.productType,
        product.status, product.updatedAt, variant.title, variant.sku, variant.price,
        variant.available, variant.tracked, getVariantStockState(variant),
        variant.inventoryQuantity, variant.inventoryItemId,
        (variant.inventoryLevels || []).map((level) => `${level.locationName}:${level.available ?? '?'}`).join('; '),
      ]);
    }
  }

  return `${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}\n`;
}

export async function handleCatalogInsights(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
  try {
    const payload = await getCachedPayload(
      env,
      'catalogInsights',
      url,
      CACHE_TTL_MS.catalogInsights,
      async () => {
        const catalog = await fetchCatalogProducts(env, url);
        const data = buildCatalogInsights(catalog.products, {
          limit: url.searchParams.get('limit') || 12,
        });

        return { success: true, auth: catalog.auth, source: catalog.source, data };
      },
    );

    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(`[Catalog] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

export async function handleInventoryAlerts(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
  try {
    const payload = await getCachedPayload(
      env,
      'inventoryAlerts',
      url,
      CACHE_TTL_MS.inventoryAlerts,
      async () => {
        const catalog = await fetchCatalogProducts(env, url);
        const insights = buildCatalogInsights(catalog.products, {
          limit: Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100),
        });
        const state = url.searchParams.get('state');
        const severity = url.searchParams.get('severity');
        const alerts = insights.alerts.filter((alert) => (
          (!state || alert.state === state) && (!severity || alert.severity === severity)
        ));

        return { success: true, auth: catalog.auth, source: catalog.source, count: alerts.length, data: alerts };
      },
    );

    return sendJson(res, 200, payload);
  } catch (error) {
    console.error(`[Inventory] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

export async function handleProductsCsv(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
  try {
    const cached = await getCachedPayload(
      env,
      'productsCsv',
      url,
      CACHE_TTL_MS.productsCsv,
      async () => {
        const catalog = await fetchCatalogProducts(env, url);
        return { success: true, source: catalog.source, csv: csvRowsForProducts(catalog.products) };
      },
    );
    const filename = `angelcare-products-${new Date().toISOString().slice(0, 10)}.csv`;

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Cache-Status': cached.cache.status,
      'X-Data-Source': cached.source,
    });
    res.end(cached.csv);
  } catch (error) {
    console.error(`[Products] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

export async function handleProducts(req: NodeRequest, res: NodeResponse, env: AppEnv) {
  try {
    if (!(await canUseAdminApi(env))) {
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

export async function handleLocations(req: NodeRequest, res: NodeResponse, env: AppEnv) {
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

export async function handleInventoryAdjust(req: NodeRequest, res: NodeResponse, env: AppEnv) {
  try {
    const body = await readJsonBody(req);
    const result = await adjustInventory(env, body);
    await clearCachedResponses(env, ['dashboardSummary', 'catalogInsights', 'inventoryAlerts', 'productsCsv']);

    return sendJson(res, 200, { success: true, source: 'shopify-admin-graphql', data: result });
  } catch (error) {
    const message = createSafeError(error);
    const statusCode = message.includes('IDEMPOTENCY_CONCURRENT_REQUEST') ? 409 : 400;
    console.error(`[Inventory] ${message}`);
    return sendJson(res, statusCode, {
      success: false,
      error: message,
      userErrors: error && typeof error === 'object' && 'userErrors' in error ? error.userErrors : undefined,
    });
  }
}
