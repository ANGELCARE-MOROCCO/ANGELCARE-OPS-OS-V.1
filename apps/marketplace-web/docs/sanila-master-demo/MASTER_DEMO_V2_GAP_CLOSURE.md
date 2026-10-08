# SANILA Master Demo V2 — blocker closure

| Blocker | Source disposition | Runtime disposition |
|---|---|---|
| Demo clock | Trusted-principal clock; all authorized residual files classified and business consumers integrated | PASS_STATIC_DESIGN |
| Timetable | 1,260 slots, 36 × 5 × 7 | PASS_DESIGN |
| Academics | Historical, Feb-17 current, and Feb-19/Feb-22 upcoming states; no planned event stranded in the past | PASS_DESIGN |
| Attendance | Shared 90-day authority / 54,000 records / Feb-17 36 sessions and 600 records | PASS_DESIGN |
| Staff attendance | Shared 90-day authority / 6,480 records / Feb-17 72 rows / six months | PASS_DESIGN |
| Payroll | Six periods and governed payment/reconciliation history | PASS_DESIGN |
| Transport | 640 runs retained; Feb-17 has 8 completed morning pickups with 300 manifest outcomes and 8 unstarted scheduled afternoon dropoffs; no future event/post-route fact | PASS_DESIGN |
| Route proof | 195 source-derived rows; literal dependencies recorded and unresolved dynamic authorities explicitly withheld from PASS | PASS_STATIC_TRUTHFUL |
| Reset ownership | One cleanup+reseed transaction; content-aware canonical state; 110 classified mutable tables × event-valid INSERT/UPDATE/DELETE capture (330 triggers) | PASS_DESIGN |
| Tasks/operations | 48 tasks plus boards, recurring rules, checklists, transitions and comments | PASS_DESIGN |
| General health/safety | 24 normal incidents plus 90 representative checks across September-February including Feb-17 | PASS_DESIGN |
| Schema governance | 111 parsed table definitions, payload columns, required columns, FK targets and insertion order; zero fabricated fields | PASS_STATIC |
| Baseline | Static source SHA plus installed pg_proc body/signature/security/search-path contract | PASS_DESIGN |
| Seed gate | Exact 127,177 rows, 111 tables, per-family/content equality, and exact 110-table three-event mutation coverage before health/success and COMMIT | PASS_DESIGN |
| Validation | Detailed read-only report plus psql nonzero hard gate; standalone and outer-transaction modes | PASS_DESIGN |
| Installation dry run | Real seed/schema/FK path, legacy/missing report, validation, unconditional rollback | AUTHORED_NOT_EXECUTED |

No runtime PASS is asserted because database execution is prohibited.
