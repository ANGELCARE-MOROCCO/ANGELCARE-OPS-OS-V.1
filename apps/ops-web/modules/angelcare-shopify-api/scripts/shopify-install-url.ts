#!/usr/bin/env node

import {
  envPath,
  getPublicAppUrl,
  loadEnv,
  validateConfig,
} from '../src/config/env';
import { createInstallState } from '../src/lib/security';
import type { AppEnv } from '../src/types';

function buildInstallUrl(env: AppEnv) {
  validateConfig(env, [
    'SHOPIFY_CLIENT_ID',
    'SHOPIFY_CLIENT_SECRET',
    'SHOPIFY_SHOP_DOMAIN',
    'SHOPIFY_API_VERSION',
    'SHOPIFY_SCOPES',
  ]);

  const appUrl = getPublicAppUrl(env);
  const installUrl = new URL(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/authorize`);

  installUrl.searchParams.set('client_id', env.SHOPIFY_CLIENT_ID);
  installUrl.searchParams.set('redirect_uri', `${appUrl}/api/auth/callback`);
  installUrl.searchParams.set('state', createInstallState(env));

  if (env.SHOPIFY_OMIT_AUTH_SCOPES !== 'true') {
    installUrl.searchParams.set('scope', env.SHOPIFY_SCOPES);
  }

  return installUrl;
}

function main() {
  const env = loadEnv(envPath);
  const installUrl = buildInstallUrl(env);
  const asJson = process.argv.includes('--json');

  if (asJson) {
    console.log(JSON.stringify({
      shop: env.SHOPIFY_SHOP_DOMAIN,
      installUrl: installUrl.toString(),
      callbackUrl: `${getPublicAppUrl(env)}/api/auth/callback`,
      scopes: env.SHOPIFY_SCOPES,
      managedScopes: env.SHOPIFY_OMIT_AUTH_SCOPES === 'true',
    }, null, 2));
    return;
  }

  console.log(`Shop: ${env.SHOPIFY_SHOP_DOMAIN}`);
  console.log(`Callback: ${getPublicAppUrl(env)}/api/auth/callback`);
  console.log(`Scopes: ${env.SHOPIFY_OMIT_AUTH_SCOPES === 'true' ? 'Shopify-managed from shopify.app.toml' : env.SHOPIFY_SCOPES}`);
  console.log('');
  console.log(installUrl.toString());
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
