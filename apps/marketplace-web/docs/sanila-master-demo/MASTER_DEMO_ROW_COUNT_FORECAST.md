# SANILA Master Demo Living School V1 — exact row-count forecast

Status: design forecast before human execution. Counts are deterministic fixture rows, not claims about all rows currently present for the school.

The existing live configuration reports the legacy verified core counts: 600 students, 450 parents, 36 classes, 72 employees/48 teachers, 60 admissions, 6,000 attendance records, 600 invoices, 480 payments, 300 transport assignments, 120 library books, 45 loans, 40 inventory items, and 8 claims. Living School V1 retains those counts and expands the registered graph.

| Domain | Forecast rows |
|---|---:|
| Administration and timetable | 271 |
| People, relationships and Family360 | 3,504 |
| Admissions | 60 |
| Academics and report cards | 3,444 |
| Attendance | 6,380 |
| Finance | 2,911 |
| Payroll | 217 |
| Transport | 356 |
| Library | 285 |
| Inventory | 84 |
| Communications | 108 |
| Notifications | 20 |
| Trust resolution | 8 |
| Reports and exports | 24 |
| Documents | 30 |
| School audit fixtures | 12 |
| **Total registered deterministic fixtures** | **17,714** |

## Exact table forecast

| Table suffix | Rows | Table suffix | Rows |
|---|---:|---|---:|
| `school_settings` | 1 | `academic_years` | 1 |
| `terms` | 3 | `governance_sites` | 1 |
| `classes` | 36 | `sections` | 36 |
| `school_day_rules` | 5 | `school_calendar_events` | 8 |
| `timetable_slots` | 180 | `subjects` | 12 |
| `staff` | 72 | `staff_contracts` | 72 |
| `parents` | 450 | `students` | 600 |
| `student_parent_links` | 600 | `class_enrollments` | 600 |
| `emergency_contacts` | 60 | `area11_families` | 450 |
| `area11_family_memberships` | 600 | `admission_applications` | 60 |
| `class_subjects` | 144 | `teacher_assignments` | 144 |
| `lessons` | 36 | `assignments` | 36 |
| `assignment_submissions` | 600 | `exams` | 36 |
| `exam_sessions` | 36 | `marks` | 600 |
| `teacher_comments` | 600 | `report_cards` | 600 |
| `report_card_lines` | 600 | `attendance_sessions` | 360 |
| `attendance_records` | 6,000 | `attendance_justifications` | 20 |
| `fee_structures` | 3 | `fee_items` | 4 |
| `student_fee_assignments` | 600 | `invoices` | 600 |
| `invoice_lines` | 600 | `payments` | 480 |
| `receipts` | 480 | `discounts` | 60 |
| `payment_reminders` | 60 | `expenses` | 24 |
| `payroll_periods` | 1 | `payroll_records` | 72 |
| `payroll_items` | 144 | `transport_vehicles` | 8 |
| `transport_routes` | 8 | `transport_stops` | 40 |
| `transport_assignments` | 300 | `library_books` | 120 |
| `library_copies` | 120 | `library_loans` | 45 |
| `inventory_categories` | 4 | `inventory_items` | 40 |
| `inventory_movements` | 40 | `messages` | 12 |
| `message_recipients` | 40 | `message_templates` | 8 |
| `announcements` | 12 | `conversations` | 12 |
| `conversation_participants` | 24 | `notifications` | 20 |
| `reclamations` | 8 | `reports` | 4 |
| `report_templates` | 4 | `report_requests` | 8 |
| `report_exports` | 4 | `export_files` | 4 |
| `documents` | 24 | `document_templates` | 6 |
| `audit_logs` | 12 |  |  |

Control/history tables are excluded from the fixture total because access events and reset runs append by operation. The school, tenant, client, Admin, role, role link, and demo config are pre-existing preserved identities, not seed rows.
