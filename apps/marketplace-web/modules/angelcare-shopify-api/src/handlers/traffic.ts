import { createSafeError, sendJson } from '../http/responses';
import { readJsonBody } from '../lib/body';
import {
  appendTrafficEvent,
  normalizeTrafficEvent,
  renderTrafficScript,
  summarizeTraffic,
} from '../services/traffic';
import type { AppEnv, NodeRequest, NodeResponse } from '../types';

export async function handleTrafficCollect(req: NodeRequest, res: NodeResponse, env: AppEnv) {
  try {
    const body = await readJsonBody(req);
    const event = normalizeTrafficEvent(env, req, body);
    await appendTrafficEvent(env, event);

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error(`[Traffic] ${createSafeError(error)}`);
    return sendJson(res, 400, { success: false, error: createSafeError(error) });
  }
}

export function handleTrafficScript(req: NodeRequest, res: NodeResponse) {
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(renderTrafficScript());
}

export async function handleTrafficSummary(req: NodeRequest, res: NodeResponse, url: URL, env: AppEnv) {
  return sendJson(res, 200, {
    success: true,
    data: await summarizeTraffic(env, { days: url.searchParams.get('days') || 30 }),
  });
}
