# Security and governance

- Source tables are code allow-listed; no model-generated SQL exists.
- No credentials, access tokens, cookies, service-role keys or mailbox passwords are stored in signal records.
- Message bodies are minimized; raw MIME content is not centralized.
- Raw events are append-only for deletion protection, hashed and normalized through controlled code.
- RLS is enabled on all MZ04 tables; direct `anon` and `authenticated` access is revoked; protected server repositories use the service role.
- Webhooks require timestamped HMAC-SHA256 signatures, reject replay windows beyond five minutes and persist hash-only receipts.
- Scheduler scans require a bearer secret and support an environment kill switch.
- Context snapshots expire, separate facts from hypotheses and record redacted field families.
- High/critical signals without adequate context are validation blockers.
- External actions remain disabled and Shadow observation remains locked.
- MZ04 invokes no OpenAI model. It prepares factual, permission-filtered context for later phases.
