# Phase 1 Architecture

```text
Protected Next.js route
        │
        ▼
Revenue OS Layout + permission gate
        │
        ▼
Server bootstrap repository
        ├── Supabase revenue_os_* tables
        └── Safe foundation fallback
        │
        ▼
RevenueOsProvider
        │
        ├── Premium shell
        ├── Workspace registry
        ├── Objective Command
        ├── Global search
        └── Audit / settings surfaces
```

## Server-side boundary

The browser never receives a Supabase service-role key. APIs call `createClient()` on the server and return sanitized Revenue OS contracts.

## Persistence posture

Before the migration is applied, the UI remains inspectable in `foundation-fallback` mode. Mutating actions correctly fail with a recoverable storage error. After migration, objective creation and audit writes persist in Supabase.

## Future compatibility

The event and outbox tables are intentionally created now so later signal and worker phases can extend the contract without replacing the foundation.
