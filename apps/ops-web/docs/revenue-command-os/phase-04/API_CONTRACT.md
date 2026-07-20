# API contract — Mega ZIP 4

## Authenticated control API

Endpoint: `GET|POST /api/revenue-command-os/signals`

GET returns the permission-filtered Signal Fabric bootstrap.

POST allow-list:
- `ingest_event`
- `run_source_scan`
- `run_all_scans`
- `update_signal_status`
- `build_context`
- `run_validation`
- `update_validation_status`
- `update_source_status`

Permissions:
- `revenue_os.signals.manage`
- `revenue_os.signals.ingest`
- `revenue_os.signals.audit`

## Signed webhook ingestion

Endpoint: `POST /api/revenue-command-os/signals/webhook/[sourceCode]`

Required headers:
- `x-revenue-signal-timestamp`: Unix seconds, maximum five-minute drift.
- `x-revenue-signal-signature`: lowercase hexadecimal HMAC-SHA256 of `<timestamp>.<raw-body>` using `REVENUE_OS_SIGNAL_WEBHOOK_SECRET`.

Every request receives an immutable receipt entry containing only signature status, body hash, source code, outcome and safe metadata. The raw secret is never persisted.

## Scheduler endpoint

Endpoint: `GET /api/revenue-command-os/signals/cron`

Authorization: `Bearer ${CRON_SECRET}` or `Bearer ${REVENUE_OS_SIGNAL_CRON_SECRET}`.

The endpoint runs bounded allow-listed source scans in `shadow-observation`. Set `REVENUE_OS_SIGNAL_SCAN_ENABLED=false` for an immediate operational stop without removing the module.

There is no send-message, pricing, strategy execution, contract mutation or capacity commitment action in MZ04.
