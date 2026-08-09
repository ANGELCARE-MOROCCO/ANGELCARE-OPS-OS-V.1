# Data dictionary

Core tables:
- `revenue_os_signal_sources`: governed source and adapter registry.
- `revenue_os_signal_source_cursors`: incremental scan watermarks.
- `revenue_os_signal_raw_events`: append-only minimized events.
- `revenue_os_signals`: normalized commercial signals.
- `revenue_os_signal_entities` / `revenue_os_signal_evidence`: links and factual support.
- `revenue_os_signal_rules`: explainable classification rules.
- `revenue_os_signal_scheduled_scans` / `revenue_os_signal_scan_runs`: scan control and history.
- `revenue_os_signal_source_health`: latency, freshness and failure diagnostics.
- `revenue_os_signal_deduplication_log`: duplicate trace.
- `revenue_os_signal_context_snapshots` / `context_sources`: minimized decision context.
- `revenue_os_signal_subscriptions` / `subscription_deliveries`: internal routing.
- `revenue_os_signal_access_logs`: visibility and redaction audit.
- `revenue_os_signal_stale_checks`: freshness controls.
- `revenue_os_signal_webhook_receipts`: future signed-webhook receipt ledger.
- `revenue_os_signal_validation_issues` / `snapshots`: readiness validation.
