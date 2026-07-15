import http from 'node:http';

import {
  envPath,
  getPublicAppUrl,
  loadEnv,
  validateConfig,
} from './config/env';
import { createSafeError, sendJson } from './http/responses';
import { createRequestHandler } from './router';
import { ensureDataDir } from './services/webhooks';

const env = loadEnv(envPath);
validateConfig(env);
ensureDataDir(env);

const handleRequest = createRequestHandler({ envPath });

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(`[Server] ${error.stack || createSafeError(error)}`);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
  });
});

server.listen(Number(env.PORT), env.HOST || '127.0.0.1', () => {
  const appUrl = getPublicAppUrl(env);
  console.log(`[Server] Listening on ${appUrl}`);
  console.log(`[Server] Shopify callback URL: ${appUrl}/api/auth/callback`);
  console.log(`[Server] Dashboard URL: ${appUrl}/dashboard`);
});
