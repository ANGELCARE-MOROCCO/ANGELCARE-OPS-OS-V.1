# SANILA Master Demo Living School V2 — dependency-order manifest

Frozen baseline: `supabase/migrations/20260903_sanila_master_demo_foundation.sql`, function `public.sanila_seed_master_demo(uuid)`, SHA-256 `3a76db0f0e5e2fdb4f0ee6f18263fe0eb58f90aafbcf99c12e3ab79b796fbc9a`.

Order: reviewed V2 migration → data-only seed → read-only validation. Reset removes journal-owned rows then includes the same seed. Advanced transport fails closed if the existing canonical `ac360_organizations` projection cannot resolve; no organization/school/tenant is created.

Status: final authored ordering; no SQL executed.

The seed runs parent-first. Reset uses the registry and retries table-scoped deletes until every child is gone; if a full pass makes no progress it aborts and rolls the deletion subtransaction back.

| Order | Phase | Tables / authority |
|---:|---|---|
| 0 | Immutable identity guard | `app_users`, `angelcare360_schools`, `angelcare360_operator_tenants`, `angelcare360_user_roles`, `angelcare360_roles`, `sanila_demo_configs` — inspect only, never create/delete |
| 10 | Fixture ownership | `sanila_demo_fixture_registry`, deterministic UUID/upsert helpers |
| 20 | School structure roots | school settings, governance site, academic year, terms, subjects |
| 30 | People roots | staff, parents, students, Family360 families |
| 40 | People children | staff contracts, student-parent links, emergency contacts, family memberships, placeholder documents |
| 50 | Class structure | classes, sections, class subjects, teacher assignments, class enrollments |
| 60 | Calendar/timetable | school day rules, calendar events, timetable slots |
| 70 | Academic work | lessons, assignments, exams, exam sessions |
| 80 | Academic evidence | submissions, marks, teacher comments, report cards, report-card lines |
| 90 | Admissions | admission applications |
| 100 | Attendance | sessions, records, justifications |
| 110 | Finance policy | fee structures, fee items, student fee assignments |
| 120 | Finance ledger | invoices, invoice lines, payments, receipts, discounts, reminders, expenses |
| 130 | Payroll | periods, records, items |
| 140 | Transport | vehicles, routes, stops, assignments |
| 150 | Library | books, copies, loans |
| 160 | Inventory | categories, items, movements |
| 170 | Communications | templates, messages, recipients, announcements, conversations, participants, notifications |
| 180 | Trust resolution | reclamations |
| 190 | Reports/documents | reports, report templates, report requests, report exports, export files, document templates |
| 200 | Audit/verification | audit logs, core relationship/count validation, registry count, 195-route static certification |

## Reset preservation manifest

Always preserved: the exact school, tenant, client, Admin user, roles/role links, demo configuration, grants, PIN attempts, sessions, access events, reset runs, side-effect events, public inquiries, and every row absent from `sanila_demo_fixture_registry`.

Reset refusal is mandatory when identity linkage, classification, active state, non-billable mode, safety state, tenant slug, or the pre-reset registry count differs from the reviewed contract.
