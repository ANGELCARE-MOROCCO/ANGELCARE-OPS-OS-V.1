# ANGELCARE Marketplace — Security and Isolation Assurance

## Source-level accepted controls

- 319 Marketplace tables created across 29 migrations have RLS enabled.
- Cumulative direct DML access for `anon` and `authenticated` is revoked on the created Marketplace table estate.
- Cumulative service-role authority is explicitly granted.
- 330 protected pages are guarded directly or inherit a guarded administrative layout.
- 116 mutation APIs are guarded directly or delegate to validation/error-bounded handlers.
- No client component contains a service-role secret marker.
- Final Authority permissions exist in SQL and TypeScript.
- Post-MZ20 module sequence compatibility is preserved.
- Release and launch evidence schemas are cumulative rather than competing.

## Runtime tests still mandatory

The following identities must be exercised with both allowed and denied cases:

- Marketplace Super Admin;
- executive reviewer;
- finance/revenue operator;
- catalog operator;
- operations operator;
- Academy operator;
- family user;
- organization member;
- Partner OS tenant administrator;
- provider;
- vendor;
- unauthenticated visitor.

## Isolation cases

- family A must not access family B;
- tenant A must not access tenant B;
- organization A must not access organization B;
- provider A must not access provider B operational or payable details;
- vendor A must not access vendor B orders or settlement data;
- territory-scoped roles must not cross assigned territory;
- customers must not see internal investigations, margin or payable details;
- documents must enforce origin-system visibility and sensitivity;
- refund, settlement, price, Trust, security and launch approvals must satisfy separation of duties.

## Evidence boundary

Static inspection proves control presence, not runtime effectiveness. Final security acceptance requires real authenticated identities, denied-path evidence, database-policy tests and audit-event confirmation.
