#!/usr/bin/env node

import {
  envPath,
  loadEnv,
  validateConfig,
} from '../src/config/env';
import { executeShopifyGraphql } from '../src/services/shopify';
import { getResolvedAuthMode } from '../src/services/token';

const INSTALLATION_QUERY = `
  query CurrentAppInstallationStatus {
    shop {
      name
      myshopifyDomain
    }
    currentAppInstallation {
      id
      launchUrl
      accessScopes {
        handle
      }
    }
  }
`;

function splitScopes(value) {
  return String(value || '')
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function isScopeGranted(requiredScope, grantedScopes) {
  if (grantedScopes.has(requiredScope)) return true;

  if (requiredScope.startsWith('read_')) {
    return grantedScopes.has(`write_${requiredScope.slice('read_'.length)}`);
  }

  return false;
}

async function main() {
  const env = loadEnv(envPath);
  validateConfig(env, ['SHOPIFY_SHOP_DOMAIN', 'SHOPIFY_API_VERSION', 'SHOPIFY_SCOPES']);

  const authMode = await getResolvedAuthMode(env);
  if (authMode === 'authorization_code_required' || authMode === 'not_configured') {
    throw new Error('No Admin API token is available yet. Run npm run shopify:install-url, approve the app, then try again.');
  }

  const result = await executeShopifyGraphql(env, INSTALLATION_QUERY, {}, { minimumCost: 10 });
  const granted = new Set((result.data.currentAppInstallation?.accessScopes || []).map((scope) => scope.handle));
  const required = splitScopes(env.SHOPIFY_SCOPES);
  const missing = required.filter((scope) => !isScopeGranted(scope, granted));

  console.log(`Shop: ${result.data.shop.name} (${result.data.shop.myshopifyDomain})`);
  console.log(`Installation: ${result.data.currentAppInstallation?.id || 'unknown'}`);
  console.log(`Launch URL: ${result.data.currentAppInstallation?.launchUrl || 'unknown'}`);
  console.log(`Auth mode: ${authMode}`);
  console.log(`Granted scopes: ${[...granted].sort().join(', ') || 'none'}`);

  if (missing.length) {
    console.log(`Missing scopes: ${missing.join(', ')}`);
    process.exitCode = 2;
    return;
  }

  console.log('All configured scopes are granted.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
