# MZ17 API Contract

Successful responses use a stable `{ ok: true, data, traceId }` envelope. Failures use `{ ok: false, error: { code, message, recoverable, traceId, context? } }` with HTTP 401/403/404/409/422/429/500 classification.

PostgREST error objects retain safe `code`, `message`, `details` and `hint` diagnostics. Secrets and credentials are never returned.

Human routes use the canonical Revenue OS actor. Machine routes use explicitly signed system contracts. Tenant identity is never accepted from the client as authority.
