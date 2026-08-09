import path from 'node:path';

import { getPublicAppUrl, normalizeShopDomain, validateConfig } from '../config/env';
import { createSafeError, escapeHtml, sendHtml, sendJson } from '../http/responses';
import { readRequestBody } from '../lib/body';
import { clearCachedResponses } from '../lib/cache';
import { createInstallState, verifyInstallState, verifyShopifyHmac } from '../lib/security';
import { exchangeCodeForToken } from '../services/shopify';
import { getAdminAccessToken, storeAdminAccessToken } from '../services/token';
import type { AppEnv, NodeRequest, NodeResponse } from '../types';

export async function handleOAuthCallback(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv, configPath: string) {
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
    const storageLabel = await storeAdminAccessToken(env, configPath, result.accessToken, result.scope);
    await clearCachedResponses(env);

    console.log(`[OAuth] Stored Shopify access token for ${env.SHOPIFY_SHOP_DOMAIN}. Scope: ${result.scope || 'not provided'}`);

    const relativeLabel = storageLabel === configPath
      ? path.relative(process.cwd(), configPath)
      : storageLabel;

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
        `<p>The offline access token was saved to <code>${escapeHtml(relativeLabel)}</code>.</p>`,
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

export function handleInstall(req: NodeRequest, res: NodeResponse, env: AppEnv) {
  validateConfig(env, ['PORT', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION', 'SHOPIFY_SCOPES']);

  const appUrl = getPublicAppUrl(env);
  const installUrl = new URL(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/authorize`);

  installUrl.searchParams.set('client_id', env.SHOPIFY_CLIENT_ID);
  installUrl.searchParams.set('redirect_uri', `${appUrl}/api/auth/callback`);
  installUrl.searchParams.set('state', createInstallState(env));

  if (env.SHOPIFY_OMIT_AUTH_SCOPES !== 'true') {
    installUrl.searchParams.set('scope', env.SHOPIFY_SCOPES);
  }

  res.writeHead(302, { Location: installUrl.toString(), 'Cache-Control': 'no-store' });
  res.end();
}

export async function handleManualExchange(req: NodeRequest, res: NodeResponse, env: AppEnv, configPath: string) {
  validateConfig(env, ['PORT', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION']);

  try {
    const body = await readRequestBody(req);
    const params = new URLSearchParams(body);
    const code = params.get('code');

    if (!code) {
      return sendJson(res, 400, { success: false, error: 'Missing code form field.' });
    }

    const result = await exchangeCodeForToken(code, env);
    const storageLabel = await storeAdminAccessToken(env, configPath, result.accessToken, result.scope);
    await clearCachedResponses(env);

    console.log(`[OAuth] Manually stored Shopify access token for ${env.SHOPIFY_SHOP_DOMAIN}. Scope: ${result.scope || 'not provided'}`);

    const relativeLabel = storageLabel === configPath
      ? path.relative(process.cwd(), configPath)
      : storageLabel;

    return sendJson(res, 200, {
      success: true,
      message: `Access token saved to ${relativeLabel}.`,
      scope: result.scope,
    });
  } catch (error) {
    console.error(`[OAuth] ${createSafeError(error)}`);
    return sendJson(res, 502, { success: false, error: createSafeError(error) });
  }
}

export async function handleClientCredentialsToken(req: NodeRequest, res: NodeResponse, env: AppEnv) {
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
