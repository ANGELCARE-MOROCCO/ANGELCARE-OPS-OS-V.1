# Architecture

MZ06 uses the existing MZ05 command schema, registry, router, eligibility engine, graph engine, scheduler, permission evaluator, Shadow runtime and validation harness.

The library is stored in:
- `lib/revenue-command-os/command-kernel/golden-300/`
- `evaluations/revenue-command-os/phase-06/`
- `supabase/migrations/20260720_revenue_command_os_phase6_golden_300.sql`

Each command has an immutable version, exact contexts, exact schemas, tool boundaries, validators, approval class, cooldown, retries, failure policy, prohibited cases, expected outcomes and performance fields.
