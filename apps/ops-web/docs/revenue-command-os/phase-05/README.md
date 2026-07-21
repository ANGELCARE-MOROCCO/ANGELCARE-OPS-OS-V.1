# MZ05 — Revenue Command OS Kernel

Production implementation of the governed runtime for the future 3,000 Revenue Command Objects. The release is cumulative over MZ01–MZ04 and remains in Shadow mode with external actions disabled.

## Delivered
- formal command object schema and registry model;
- 12-family taxonomy;
- immutable command versions and rollback records;
- eligibility and required-context evaluation;
- tool permission and approval classification;
- manual, scheduled, event, condition, chained, fallback, approval-gated, rejected and simulation seeds;
- deterministic router and idempotency key;
- graph compiler and cycle validation;
- schedule validation and missed-run policy;
- retry/failure/fallback controls;
- Shadow runtime with zero external actions;
- output schema validation;
- Supabase migration, RLS, service-only access and rollback SQL;
- premium French workspaces at `/revenue-command-os/command-kernel`;
- extensive deterministic routing corpus and static acceptance.

- 70 000 cas d’évaluation déterministes et adversariaux sont inclus.
