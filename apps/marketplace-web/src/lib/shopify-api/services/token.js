const tokenCache = new Map();

function canUseClientCredentials(env) {
  return env.SHOPIFY_TOKEN_GRANT === 'client_credentials' &&
    Boolean(env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET && env.SHOPIFY_SHOP_DOMAIN);
}

function getTokenCacheKey(env) {
  return `${env.SHOPIFY_SHOP_DOMAIN}:${env.SHOPIFY_CLIENT_ID}`;
}

function getStaticAccessToken(env) {
  return env.SHOPIFY_ACCESS_TOKEN || '';
}

function getAuthMode(env) {
  if (getStaticAccessToken(env)) return 'static_access_token';
  if (canUseClientCredentials(env)) return 'client_credentials';
  if (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET) return 'authorization_code_required';
  return 'not_configured';
}

async function requestClientCredentialsToken(env) {
  if (!canUseClientCredentials(env)) {
    throw new Error('Client credentials are not configured.');
  }

  const response = await fetch(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
    }),
  });

  const bodyText = await response.text();
  let payload;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    payload = { raw: bodyText };
  }

  if (!response.ok || !payload.access_token) {
    const shopifyError = payload.error_description || payload.error || payload.raw || 'Unknown Shopify token error';
    throw new Error(`Shopify client-credentials token failed (${response.status}): ${shopifyError}`);
  }

  const expiresInSeconds = Number(payload.expires_in || 86399);

  return {
    accessToken: payload.access_token,
    scope: payload.scope || '',
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
  };
}

async function getAdminAccessToken(env) {
  const staticToken = getStaticAccessToken(env);
  if (staticToken) {
    return {
      accessToken: staticToken,
      source: 'static_access_token',
      scope: env.SHOPIFY_SCOPES || '',
      expiresAt: null,
    };
  }

  const cacheKey = getTokenCacheKey(env);
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached,
      source: 'client_credentials',
    };
  }

  const token = await requestClientCredentialsToken(env);
  tokenCache.set(cacheKey, token);

  return {
    ...token,
    source: 'client_credentials',
  };
}

function clearCachedAdminAccessToken(env) {
  tokenCache.delete(getTokenCacheKey(env));
}

module.exports = {
  canUseClientCredentials,
  clearCachedAdminAccessToken,
  getAdminAccessToken,
  getAuthMode,
  requestClientCredentialsToken,
};
