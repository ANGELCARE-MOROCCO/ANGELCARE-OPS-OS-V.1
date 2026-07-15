import http from 'node:http';
import { httpServerHandler } from 'cloudflare:node';

import { createRequestHandler } from './router';
import { createSafeError, sendJson } from './http/responses';
import type { AppEnv, NodeRequest, NodeResponse } from './types';

type WorkerEnv = AppEnv & Record<string, string | KVNamespace | undefined>;
type FetchHandler = {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Response | Promise<Response>;
};

function buildEnvOverrides(workerEnv: WorkerEnv, request: Request): Partial<AppEnv> {
  const requestUrl = new URL(request.url);

  return {
    ...workerEnv,
    APP_URL: workerEnv.APP_URL || requestUrl.origin,
    CLOUDFLARE_WORKER: 'true',
    DATA_DIR: '/tmp/angelcare-shopify-api',
    HOST: '0.0.0.0',
    PORT: '443',
  };
}

function createServer(workerEnv: WorkerEnv, request: Request) {
  const envOverrides = buildEnvOverrides(workerEnv, request);
  const handleRequest = createRequestHandler({
    envPath: '/tmp/.env',
    envOverrides,
  });

  return http.createServer((req: NodeRequest, res: NodeResponse) => {
    handleRequest(req, res).catch((error) => {
      console.error(`[Worker] ${error.stack || createSafeError(error)}`);
      sendJson(res, 500, { success: false, error: 'Internal server error' });
    });
  });
}

export default {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    const server = createServer(env, request);
    const handler = httpServerHandler(server as never) as FetchHandler;
    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<WorkerEnv>;
