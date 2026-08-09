# Security and Governance Report

- Provider credentials stay under the existing encrypted AI Provider Control credential authority.
- Revenue client components receive governance summaries, not secrets.
- Phase 5 tables are service-role only through RLS and grants.
- Direct Revenue environment-key fallback is removed.
- Break-glass cannot activate automatically.
- Force refresh, request cancellation, schedule management and policy management are permission-separated.
- Request cancellation releases the existing runtime reservation and records audit evidence.
- External Revenue actions remain approval-gated and are not enabled by this integration.
- Migration, verification and rollback SQL are manual files; the package never runs SQL.
