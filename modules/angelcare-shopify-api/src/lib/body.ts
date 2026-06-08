const BODY_LIMIT_BYTES = 1024 * 1024;

import type { NodeRequest } from '../types';

export { BODY_LIMIT_BYTES };

export async function readRequestBody(req: NodeRequest, maxBytes = BODY_LIMIT_BYTES) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) {
      throw new Error(`Request body exceeds ${maxBytes} bytes.`);
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
}

export async function readJsonBody<T = Record<string, unknown>>(req: NodeRequest): Promise<T> {
  const rawBody = await readRequestBody(req);
  if (!rawBody.trim()) return {} as T;

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}
