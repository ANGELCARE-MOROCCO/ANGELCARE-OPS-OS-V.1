import crypto from 'node:crypto';

import { getAdminAccessToken } from './token';
import type { AnyRecord, AppEnv } from '../types';

const DEFAULT_SHOPIFY_TIMEOUT_MS = 30000;

interface ThrottleState {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
  lastRefilledAt: number;
}

const throttleStates = new Map<string, ThrottleState>();

function createThrottleState(): ThrottleState {
  return {
    maximumAvailable: 1000,
    currentlyAvailable: 1000,
    restoreRate: 100,
    lastRefilledAt: Date.now(),
  };
}

function getThrottleState(env: AppEnv) {
  const key = String(env.SHOPIFY_SHOP_DOMAIN || 'default').toLowerCase();
  let throttleState = throttleStates.get(key);

  if (!throttleState) {
    throttleState = createThrottleState();
    throttleStates.set(key, throttleState);
  }

  return throttleState;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function refillThrottleBucket(throttleState: ThrottleState) {
  const elapsedSeconds = (Date.now() - throttleState.lastRefilledAt) / 1000;
  throttleState.currentlyAvailable = Math.min(
    throttleState.maximumAvailable,
    throttleState.currentlyAvailable + elapsedSeconds * throttleState.restoreRate,
  );
  throttleState.lastRefilledAt = Date.now();
}

function updateThrottleFromExtensions(env: AppEnv, extensions: AnyRecord | null | undefined) {
  const status = extensions?.cost?.throttleStatus;
  if (!status) return;

  const throttleState = getThrottleState(env);
  throttleState.maximumAvailable = Number(status.maximumAvailable) || throttleState.maximumAvailable;
  throttleState.currentlyAvailable = Number(status.currentlyAvailable) || throttleState.currentlyAvailable;
  throttleState.restoreRate = Number(status.restoreRate) || throttleState.restoreRate;
  throttleState.lastRefilledAt = Date.now();
}

async function waitForGraphqlCapacity(env: AppEnv, minimumPoints = 75) {
  const throttleState = getThrottleState(env);
  refillThrottleBucket(throttleState);

  if (throttleState.currentlyAvailable >= minimumPoints) return;

  const missing = minimumPoints - throttleState.currentlyAvailable;
  const waitMs = Math.ceil((missing / Math.max(throttleState.restoreRate, 1)) * 1000);
  await sleep(Math.min(Math.max(waitMs, 250), 5000));
}

function getRetryDelayMs(response: Response, fallbackMs: number) {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 10000);
  }

  return fallbackMs;
}

async function fetchWithTimeout(url: string | URL, options: RequestInit = {}, timeoutMs = DEFAULT_SHOPIFY_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Shopify request timed out after ${timeoutMs} ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeShopifyGraphql(env: AppEnv, query: string, variables: AnyRecord = {}, options: AnyRecord = {}) {
  const token = await getAdminAccessToken(env);

  const retries = options.retries ?? 2;
  await waitForGraphqlCapacity(env, options.minimumCost || 75);

  const response = await fetchWithTimeout(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Shopify-Access-Token': token.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  }, Number(options.timeoutMs) || DEFAULT_SHOPIFY_TIMEOUT_MS);

  const bodyText = await response.text();
  let payload: AnyRecord;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = { raw: bodyText };
  }

  updateThrottleFromExtensions(env, payload.extensions);

  if (response.status === 429 && retries > 0) {
    await sleep(getRetryDelayMs(response, 3000));
    return executeShopifyGraphql(env, query, variables, { ...options, retries: retries - 1 });
  }

  if (response.status >= 500 && retries > 0) {
    await sleep(1000 * (3 - retries));
    return executeShopifyGraphql(env, query, variables, { ...options, retries: retries - 1 });
  }

  if (!response.ok) {
    throw new Error(`Shopify Admin GraphQL failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  if (payload.errors) {
    const throttled = payload.errors.some((error) => String(error.message || '').toLowerCase().includes('throttled'));
    if (throttled && retries > 0) {
      await sleep(2500);
      return executeShopifyGraphql(env, query, variables, { ...options, retries: retries - 1 });
    }

    throw new Error(`Shopify Admin GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }

  return {
    data: payload.data,
    extensions: payload.extensions || null,
  };
}

export async function executeShopifyRest(env: AppEnv, endpointPath: string, params: AnyRecord = {}, options: AnyRecord = {}) {
  const token = await getAdminAccessToken(env);
  const retries = options.retries ?? 2;

  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const url = new URL(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      'X-Shopify-Access-Token': token.accessToken,
    },
  }, Number(options.timeoutMs) || DEFAULT_SHOPIFY_TIMEOUT_MS);

  const bodyText = await response.text();
  let payload: AnyRecord;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = { raw: bodyText };
  }

  if (response.status === 429 && retries > 0) {
    await sleep(getRetryDelayMs(response, 2500));
    return executeShopifyRest(env, endpointPath, params, { ...options, retries: retries - 1 });
  }

  if (response.status >= 500 && retries > 0) {
    await sleep(1000 * (3 - retries));
    return executeShopifyRest(env, endpointPath, params, { ...options, retries: retries - 1 });
  }

  if (!response.ok) {
    throw new Error(`Shopify Admin REST failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  return payload;
}

export async function exchangeCodeForToken(code: string, env: AppEnv) {
  const response = await fetchWithTimeout(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      code,
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
    const shopifyError = payload.error_description || payload.error || payload.raw || 'Unknown Shopify OAuth error';
    throw new Error(`Shopify token exchange failed (${response.status}): ${shopifyError}`);
  }

  return {
    accessToken: payload.access_token,
    scope: payload.scope || '',
  };
}

export async function fetchPublicProducts(env: AppEnv, limit: string | number = 12) {
  const response = await fetchWithTimeout(`https://${env.SHOPIFY_SHOP_DOMAIN}/products.json?limit=${limit}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Public products fetch failed (${response.status}).`);
  }

  const payload = await response.json() as AnyRecord;

  return (payload.products || []).map((product) => ({
    id: String(product.id),
    title: product.title,
    handle: product.handle,
    vendor: product.vendor,
    productType: product.product_type,
    status: 'PUBLIC',
    totalInventory: null,
    updatedAt: product.updated_at || null,
    imageUrl: product.image?.src || product.images?.[0]?.src || null,
    imageAlt: product.image?.alt || product.title,
    variants: (product.variants || []).map((variant) => ({
      id: String(variant.id),
      title: variant.title,
      price: variant.price,
      available: Boolean(variant.available),
      sku: variant.sku || null,
      inventoryQuantity: null,
      inventoryItemId: null,
      inventoryLevels: [],
    })),
  }));
}

function getQuantity(level, name: string) {
  return level?.quantities?.find((quantity) => quantity.name === name)?.quantity ?? null;
}

function normalizeVariantNode(variant) {
  const inventoryLevels = (variant.inventoryItem?.inventoryLevels?.edges || []).map(({ node }) => ({
    id: node.id,
    locationId: node.location?.id || null,
    locationName: node.location?.name || 'Unknown location',
    available: getQuantity(node, 'available'),
    onHand: getQuantity(node, 'on_hand'),
    committed: getQuantity(node, 'committed'),
  }));

  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku || null,
    price: variant.price,
    available: variant.availableForSale,
    inventoryQuantity: variant.inventoryQuantity,
    inventoryItemId: variant.inventoryItem?.id || null,
    tracked: variant.inventoryItem?.tracked ?? null,
    inventoryLevels,
  };
}

function normalizeProductNode(product) {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    vendor: product.vendor,
    status: product.status,
    totalInventory: product.totalInventory,
    updatedAt: product.updatedAt,
    imageUrl: product.featuredMedia?.preview?.image?.url || null,
    imageAlt: product.featuredMedia?.preview?.image?.altText || product.title,
    variants: (product.variants?.edges || []).map(({ node }) => normalizeVariantNode(node)),
  };
}

function normalizeOrderNode(order) {
  return {
    id: order.id,
    name: order.name,
    createdAt: order.createdAt,
    displayFinancialStatus: order.displayFinancialStatus,
    displayFulfillmentStatus: order.displayFulfillmentStatus,
    total: Number(order.currentTotalPriceSet?.shopMoney?.amount || 0),
    currencyCode: order.currentTotalPriceSet?.shopMoney?.currencyCode || null,
    customerName: order.customer?.displayName || 'Guest',
    customerEmail: order.customer?.email || null,
  };
}

function normalizeLocationNode(location) {
  return {
    id: location.id,
    name: location.name,
    isActive: location.isActive,
    fulfillsOnlineOrders: location.fulfillsOnlineOrders,
  };
}

export function calculateProductMetrics(products) {
  const variants = products.flatMap((product) => product.variants || []);
  const trackedVariants = variants.filter((variant) => variant.tracked);
  const availableVariants = variants.filter((variant) => variant.available).length;
  const inventoryUnits = trackedVariants.reduce((sum, variant) => {
    if (Number.isFinite(Number(variant.inventoryQuantity))) {
      return sum + Number(variant.inventoryQuantity);
    }
    return sum;
  }, 0);

  const lowStockVariants = trackedVariants.filter((variant) => {
    if (variant.inventoryQuantity == null) return false;

    const quantity = Number(variant.inventoryQuantity);
    return Number.isFinite(quantity) && quantity >= 0 && quantity <= 5;
  }).length;
  const outOfStockVariants = trackedVariants.filter((variant) => {
    const quantity = Number(variant.inventoryQuantity);
    return Number.isFinite(quantity) && quantity === 0;
  }).length;

  return {
    productCount: products.length,
    variantCount: variants.length,
    trackedVariantCount: trackedVariants.length,
    untrackedVariantCount: variants.length - trackedVariants.length,
    availableVariants,
    inventoryUnits,
    lowStockVariants,
    outOfStockVariants,
  };
}

export async function fetchAdminDashboardData(env: AppEnv, options: AnyRecord = {}) {
  const productsFirst = Math.min(Math.max(Number(options.productsFirst) || 20, 1), 50);
  const ordersFirst = Math.min(Math.max(Number(options.ordersFirst) || 10, 1), 50);
  const locationsFirst = Math.min(Math.max(Number(options.locationsFirst) || 10, 1), 50);

  const query = `
    query DashboardOverview($productsFirst: Int!, $ordersFirst: Int!, $locationsFirst: Int!) {
      shop {
        name
        myshopifyDomain
        currencyCode
        plan {
          displayName
        }
      }
      locations(first: $locationsFirst) {
        edges {
          node {
            id
            name
            isActive
            fulfillsOnlineOrders
          }
        }
      }
      products(first: $productsFirst, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            vendor
            status
            totalInventory
            updatedAt
            featuredMedia {
              preview {
                image {
                  url
                  altText
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  availableForSale
                  inventoryQuantity
                  inventoryItem {
                    id
                    tracked
                    inventoryLevels(first: $locationsFirst) {
                      edges {
                        node {
                          id
                          location {
                            id
                            name
                          }
                          quantities(names: ["available", "on_hand", "committed"]) {
                            name
                            quantity
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      orders(first: $ordersFirst, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              displayName
              email
            }
          }
        }
      }
    }
  `;

  const { data, extensions } = await executeShopifyGraphql(
    env,
    query,
    { productsFirst, ordersFirst, locationsFirst },
    { minimumCost: 120 },
  );

  const products = (data.products?.edges || []).map(({ node }) => normalizeProductNode(node));
  const orders = (data.orders?.edges || []).map(({ node }) => normalizeOrderNode(node));
  const locations = (data.locations?.edges || []).map(({ node }) => normalizeLocationNode(node));
  const productMetrics = calculateProductMetrics(products);

  return {
    shop: data.shop,
    products,
    orders,
    locations,
    metrics: {
      ...productMetrics,
      recentOrdersCount: orders.length,
    },
    throttleStatus: extensions?.cost?.throttleStatus || null,
  };
}

export async function calculateRevenueMetrics(env: AppEnv, maxRecords: string | number = 250) {
  const safeMax = Math.min(Math.max(Number(maxRecords) || 250, 1), 1000);
  const query = `
    query RecentOrdersForMetrics($first: Int!, $after: String) {
      orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
        edges {
          cursor
          node {
            id
            displayFinancialStatus
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  let cursor = null;
  let hasNextPage = true;
  let scannedOrdersCount = 0;
  let paidOrdersCount = 0;
  let totalRevenue = 0;
  let currencyCode = null;

  while (hasNextPage && scannedOrdersCount < safeMax) {
    const first = Math.min(50, safeMax - scannedOrdersCount);
    const { data } = await executeShopifyGraphql(env, query, { first, after: cursor });
    const edges = data.orders?.edges || [];

    for (const edge of edges) {
      const order = edge.node;
      const status = order.displayFinancialStatus;
      const amount = Number(order.currentTotalPriceSet?.shopMoney?.amount || 0);
      currencyCode ||= order.currentTotalPriceSet?.shopMoney?.currencyCode || null;

      if (['PAID', 'PARTIALLY_PAID', 'PARTIALLY_REFUNDED'].includes(status)) {
        totalRevenue += amount;
        paidOrdersCount += 1;
      }
    }

    scannedOrdersCount += edges.length;
    hasNextPage = Boolean(data.orders?.pageInfo?.hasNextPage) && edges.length > 0;
    cursor = data.orders?.pageInfo?.endCursor || null;
  }

  const averageOrderValue = paidOrdersCount ? totalRevenue / paidOrdersCount : 0;

  return {
    scannedOrdersCount,
    paidOrdersCount,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    currencyCode,
  };
}

export function deriveIdempotencyKey(body: AnyRecord) {
  if (typeof body.clientRequestId === 'string' && body.clientRequestId.trim()) {
    return body.clientRequestId.trim().slice(0, 255);
  }

  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      inventoryItemId: body.inventoryItemId,
      locationId: body.locationId,
      delta: body.delta,
      reason: body.reason || 'correction',
    }))
    .digest('hex');
}

export function normalizeGraphqlId(value: unknown, type: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.startsWith(`gid://shopify/${type}/`)) return raw;
  if (/^\d+$/.test(raw)) return `gid://shopify/${type}/${raw}`;

  return raw;
}

export async function adjustInventory(env: AppEnv, body: AnyRecord) {
  const inventoryItemId = normalizeGraphqlId(body.inventoryItemId, 'InventoryItem');
  const locationId = normalizeGraphqlId(body.locationId, 'Location');
  const delta = Number(body.delta);
  const reason = String(body.reason || 'correction').trim();
  const idempotencyKey = deriveIdempotencyKey(body);

  if (!inventoryItemId) throw new Error('inventoryItemId is required.');
  if (!locationId) throw new Error('locationId is required.');
  if (!Number.isInteger(delta) || delta === 0) throw new Error('delta must be a non-zero integer.');
  if (!reason) throw new Error('reason is required.');

  const mutation = `
    mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!, $idempotencyKey: String!) {
      inventoryAdjustQuantities(input: $input) @idempotent(key: $idempotencyKey) {
        inventoryAdjustmentGroup {
          id
          createdAt
          reason
          referenceDocumentUri
          changes {
            name
            delta
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    input: {
      reason,
      name: 'available',
      referenceDocumentUri: `angelcare-dashboard://inventory-adjust/${encodeURIComponent(idempotencyKey)}`,
      changes: [
        {
          inventoryItemId,
          locationId,
          delta,
        },
      ],
    },
    idempotencyKey,
  };

  const { data } = await executeShopifyGraphql(env, mutation, variables, { minimumCost: 100 });
  const payload = data.inventoryAdjustQuantities;
  const userErrors = payload?.userErrors || [];

  if (userErrors.length) {
    const message = userErrors.map((error) => error.message).join('; ');
    const error = new Error(message || 'Shopify rejected the inventory adjustment.') as Error & { userErrors?: unknown };
    error.userErrors = userErrors;
    throw error;
  }

  return {
    idempotencyKey,
    inventoryAdjustmentGroup: payload.inventoryAdjustmentGroup,
  };
}
