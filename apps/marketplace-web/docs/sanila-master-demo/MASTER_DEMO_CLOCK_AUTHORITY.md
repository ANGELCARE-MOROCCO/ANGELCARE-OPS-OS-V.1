# SANILA Master Demo V2 — clock authority

Canonical business instant: **2027-02-17 10:37:00 Africa/Casablanca**, stored as `2027-02-17T10:37:00Z` because Casablanca is UTC+00 on that date.

`getSanilaBusinessClock(context)` accepts only server-resolved access context. Simulation activates only when the trusted Demo grant and exact immutable Master Demo school agree. Query strings, local storage, arbitrary cookies, forms and pathnames cannot activate it. Normal customers receive real time.

## Authorized final 11-file review

| # | File | A. BUSINESS_TIME closed | B. SECURITY_TIME | C. AUDIT/INGESTION_TIME | D. IRRELEVANT_TO_MASTER_DEMO |
|---:|---|---|---|---|---|
| 01 | `lib/angelcare360/server/academic-command-overview.ts` | selected/fallback day, academic window | none | none | date parsing/labels |
| 02 | `lib/angelcare360/server/academic-structure-area.ts` | current period, days remaining, enrollment transition dates | none | created/updated/requested/executed timestamps unchanged | parsing and duration math |
| 03 | `lib/angelcare360/server/academics.ts` | report-card generated date | none | record/audit timestamps unchanged | random code entropy and date parsing |
| 04 | `lib/angelcare360/server/direction-command.ts` | overdue/breach/due-soon/snooze comparisons and dated decision/commitment codes | none | matter/decision/action timestamps unchanged | parsing and stable IDs |
| 05 | `lib/angelcare360/server/finance-authority.ts` | invoice/effective/due defaults, aging and installment anchor | none | execution/approval/payment/audit timestamps unchanged | unique code entropy |
| 06 | `lib/angelcare360/server/inventory-material-command.ts` | 30-day movement window and movement date/code | none | audit timestamps unchanged | record parsing |
| 07 | `lib/angelcare360/server/inventory.ts` | movement business date | none | created/updated timestamps unchanged | date formatting |
| 08 | `lib/angelcare360/server/people.ts` | admission, enrollment and exit dates | none | created/updated timestamps unchanged | parsing and labels |
| 09 | `lib/angelcare360/server/presences-overview.ts` | selected/fallback day and trend window | none | none | date/time labels |
| 10 | `lib/angelcare360/server/transport-mobility-command.ts` | today runs, assignment/run/check/reconciliation defaults | none | run-event ingestion and audit timestamps unchanged | unique stop-code entropy; unused expiry helper |
| 11 | `lib/angelcare360/server/transport.ts` | assignment date | none | created/updated timestamps unchanged | date parsing |

CLOCK_FILES_REVIEWED=11/11
BUSINESS_TIME_CONSUMERS_CLOSED=PASS
SECURITY_TIME_UNCHANGED=PASS
AUDIT_TIME_UNCHANGED=PASS
REAL_CUSTOMER_CLOCK_UNCHANGED=PASS
MASTER_DEMO_TODAY_ALIGNED=PASS_DESIGN

## Cross-artifact certification

The static V2 verifier extracts the TypeScript constant and the SQL `simulation_instant` assignment and requires byte-for-byte equality. Security/session clocks remain outside this contract.

TS_BUSINESS_CLOCK_INSTANT=2027-02-17T10:37:00Z
SQL_SIMULATION_INSTANT=2027-02-17T10:37:00Z
CLOCK_CROSS_ARTIFACT_EQUAL=PASS

Security expiry, lockout, token/PIN/session TTL and cryptographic clocks never import the business-clock helper. Audit and immutable ingestion timestamps continue to use real server/database time.
