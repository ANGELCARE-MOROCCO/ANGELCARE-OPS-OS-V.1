# MZ06 release audit

## Scope
Golden 300 Revenue Commands, cumulative over the MZ05 command kernel.

## Verified in the release workspace
- Exact commands: 300
- Families: 12
- Commands per family: 25
- Versions: 300
- Triggers: 300
- Schedules: 85
- Graphs: 24
- Functional fingerprints: 300 unique
- Contract evaluations: 3,600
- Routing benchmarks: 30,000
- Total MZ06 evaluations: 33,600
- MZ06 static checks: 5,143 passed, 0 failed
- MZ05 evaluation regression: 70,000 passed, 0 failed
- MZ04 static acceptance: passed
- Strict command-asset TypeScript: passed
- MZ06 UI/API syntax transpile: passed
- Migration structural review: passed
- ZIP preliminary integrity: passed
- Surgical installer simulation: passed
- Application rollback simulation: passed with exact MZ05 hash restoration
- External actions performed: 0
- External tools permitted: 0

## Focused-handoff boundary
The cumulative MZ05 archive does not contain the complete live monorepo dependency file `apps/ops-web/lib/auth/permissions.ts`, which the original MZ01–MZ03 verification scripts read. Those three scripts therefore cannot be honestly re-executed inside the focused release workspace. Their migrations, scripts and documents are present, and the MZ06 installer runs the original MZ01–MZ06 regression scripts against the user's full monorepo before declaring live installation success.

No prior verification script was weakened or altered to hide this boundary.

## Prohibited work not performed
- No `npm run build`
- No database migration
- No Git stage or commit
- No external email or WhatsApp
- No price, discount, capacity, contract or payment commitment
