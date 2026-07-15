const BODY_LIMIT_BYTES = 1024 * 1024;

async function readRequestBody(req, maxBytes = BODY_LIMIT_BYTES) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new Error(`Request body exceeds ${maxBytes} bytes.`);
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function readJsonBody(req) {
  const rawBody = await readRequestBody(req);
  if (!rawBody.trim()) return {};

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

module.exports = {
  BODY_LIMIT_BYTES,
  readJsonBody,
  readRequestBody,
};
