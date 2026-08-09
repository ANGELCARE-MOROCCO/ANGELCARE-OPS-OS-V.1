# Mega ZIP 2 Installation

## Prerequisites

- Mega ZIP 1 already installed and its migration applied.
- Revenue OS environment values remain configured.
- `REVENUE_OS_EXECUTION_MODE=shadow`.
- `REVENUE_OS_ALLOW_EXTERNAL_ACTIONS=false`.

## Apply application files

Use the supplied `apply_revenue_os_mz02.sh` installer from the monorepo root or pass the absolute root and ZIP paths.

## Apply database migration

Run after Phase 1:

```text
apps/ops-web/supabase/migrations/20260720_revenue_command_os_phase2_digital_twin.sql
```

The migration is cumulative and idempotent.

## Verification

```bash
npm run revenue-os:phase1:verify
npm run revenue-os:phase2:verify
npm run revenue-os:phase2:typecheck
```

## Runtime check

Open:

```text
/revenue-command-os/digital-twin
```

Inspect every internal section and run the model validation. Seeded gaps are expected until authoritative pricing, stock and capacity sources are connected.
