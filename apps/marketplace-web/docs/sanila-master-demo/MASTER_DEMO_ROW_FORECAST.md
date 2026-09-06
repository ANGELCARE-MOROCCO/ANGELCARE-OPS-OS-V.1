# SANILA Master Demo Living School V2 — deterministic row forecast

Status: authored forecast; no database execution.

- ROW_FORECAST_TOTAL: **127,177**
- TABLE_FORECAST_TOTAL: **111** fixture tables
- DOMAIN_FORECAST_TOTAL: **17** domains
- FORECAST_TABLE_SUM_MATCHES_TOTAL: **PASS** (`scripts/sanila-master-demo-v2-forecast.mjs`)
- Estimated seed size: 90–150 MB before indexes/WAL
- Estimated reset volume: about 120k canonical upserts plus Demo-created row deletion
- Execution complexity: high; isolated-clone and DBA review required

| Domain | Rows | Commercial depth |
|---|---:|---|
| Attendance | 64,280 | 90 weekdays, 54,000 student plus 6,480 staff records and 360 staff events |
| Academics | 24,084 | repeated lessons/assignments/exams, 9,600 marks, 4,800 report lines |
| People/family/staff | 3,525 | V1 graph plus 3 leave policies and 18 coherent requests |
| Finance | 13,721 | six invoice months, paid/partial/overdue, receipts and expenses |
| Transport | 14,792 | planning, 640 runs, 12,080 events, safety and alerts |
| Payroll | 2,407 | six periods, results, inputs, advances, payments and reconciliation |
| Administration/timetable/calendar | 1,413 | 1,260 slots and 30 events |
| Admissions | 360 | applications, leads and stage history |
| Library | 675 | catalogue/copies and 360 loans |
| Inventory | 404 | stock and 360 movements |
| Communications/notifications | 226 | internal history and blocked delivery |
| Trust/complaints | 20 | open and resolved cases |
| Reports/exports/documents/audit | 87 | governed projections |
| Other connected baseline fixtures | 720 | organization/relationship/support rows |
| Operations/tasks | 227 | 48 assigned tasks, boards, recurring rules, checklists, transitions and comments |
| General health/safety | 236 | 24 incidents with events, acknowledgements, alerts, snapshots and safety checks |
| **Total** | **127,177** | Exact 111-table registry contract |

## Largest 20 fixture tables

| Table | Rows |
|---|---:|
| `angelcare360_attendance_records` | 54,000 |
| `ac360_school_transport_run_events` | 12,080 |
| `angelcare360_marks` | 9,600 |
| `ac360_school_attendance_records` | 6,480 |
| `angelcare360_report_card_lines` | 4,800 |
| `angelcare360_invoices` | 3,600 |
| `angelcare360_invoice_lines` | 3,600 |
| `angelcare360_lessons` | 3,492 |
| `angelcare360_attendance_sessions` | 3,240 |
| `angelcare360_payments` | 3,095 |
| `angelcare360_receipts` | 3,095 |
| `angelcare360_assignment_submissions` | 2,400 |
| `angelcare360_timetable_slots` | 1,260 |
| `angelcare360_payroll_items` | 1,224 |
| `angelcare360_assignments` | 1,188 |
| `ac360_school_transport_route_runs` | 640 |
| `ac360_school_transport_safety_checks` | 640 |
| `angelcare360_exams` | 612 |
| `angelcare360_exam_sessions` | 612 |
| `angelcare360_students` | 600 |
