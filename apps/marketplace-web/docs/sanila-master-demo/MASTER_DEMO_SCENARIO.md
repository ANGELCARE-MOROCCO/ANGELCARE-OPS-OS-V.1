# SANILA Master Demo Living School V2 — scenario

Status: canonical authored scenario; not executed.

## Narrative clock

The sole canonical Demo moment is **Wednesday, 2027-02-17 at 10:37 Africa/Casablanca**. Term 1 is completed, term 2 is active, and term 3 is planned.

## School portrait

SANILA INTERNATIONAL SCHOOL — DEMO is one fictional Casablanca campus with 600 active students, 450 households, 72 employees, 48 teachers, 36 classes, 36 sections, and 12 subjects. Every class has a homeroom teacher, four subject allocations, a five-day timetable, enrolled students, and mid-year academic evidence.

All people and contact details are synthetic. “Madame Directrice” is the existing internal School Admin identity; the seed does not create or credential any user.

## Demonstration story

1. **Direction opens the Wednesday cockpit.** Population, attendance, cash, payroll, transport, library, inventory, admission, claim, and communication signals resolve from one connected graph.
2. **Administration reviews term 2 readiness.** The active year, three terms, 36 classes/sections, 12 subjects, five operational day rules, 30 calendar events, and 1,260 timetable slots are populated.
3. **People and Family360 investigate a student.** The dossier resolves the student, class, section, guardian, household, emergency contact, enrollment, invoice, attendance, academic, transport, library, and document projections.
4. **Admissions works a 60-application pipeline.** Accepted, review, rejected, and withdrawn examples coexist without creating additional students or identities.
5. **Academic leadership runs the current day.** Completed historical lessons/exams, February 17 delivered lessons, assignments due February 19, and planned February 22 exams coexist with pending grading and retake evidence.
6. **Attendance resolves exceptions.** Ninety representative school days from September through February produce 54,000 records, with exactly 36 sessions and 600 student records on February 17 plus accepted/rejected/pending justifications.
7. **Finance controls six months.** Paid, partial, overdue, sibling-discount, reminder-blocked and expense states coexist.
8. **Payroll reviews September–February.** Six periods include inputs, advances, bonuses, deductions, reimbursements, payments and reconciliation exceptions.
9. **Transport operates today.** Eight routes, 48 stops, 640 runs, 12,000 student events and safety/alert history populate the advanced runtime authority.
10. **Library resolves an overdue loan.** 120 works/copies and 360 loans include current, returned, and overdue/fine examples.
11. **Inventory responds to shortages.** Forty items across four categories include out-of-stock and low-stock examples with auditable initial movements.
12. **Communications stays internal.** Messages, templates, announcements, conversations, recipients, notifications, and claims are visible; provider delivery is never attempted.
13. **Reports/documents demonstrate governance.** Templates, requests, exports, and file/document placeholders show lifecycle states while generation/download remains explicitly unconfigured.
14. **Reset certification restores the twin atomically.** Journal-owned created rows are removed and all canonical rows are reseeded in one transaction; the journal and success status change only after exact postconditions pass. Tenant, school, School Admin, access grants, sessions, and permanent authorities remain intact.

## Exception palette

- Attendance: absent, late, accepted/rejected/pending justification.
- Academics: late submission, student absent for an exam, report card awaiting review.
- Finance: paid, partially paid, issued, overdue, sibling discount, blocked external reminder.
- Payroll: paid and pending records.
- Transport: maintenance vehicle, suspended route, pending assignments.
- Library: overdue loan with a small fine.
- Inventory: zero-stock and below-reorder items.
- Trust: open high-priority and resolved claims.
- External effects: all email/SMS/WhatsApp/push/payment/GPS/file/webhook outcomes are blocked or simulated records, never successes.

## Presenter personas

| Persona | Existing/fixture source | Primary story |
|---|---|---|
| Madame Directrice | existing app user + active school role | executive cockpit, approvals, reset review |
| Administration team | seeded staff 2–6 | structure, admissions, documents |
| Teaching team | seeded staff 7–54 | timetable, classes, lessons, marks, bulletins |
| Services team | seeded staff 55–72 | payroll, transport, inventory, library |
| Families | 450 synthetic guardians/households | student, communication, finance and claims context |
| Students | 600 synthetic students | complete connected school lifecycle |

## Non-goals

The scenario does not create auth credentials, call adapters, generate real files, fabricate GPS positions, charge a payment method, send a message, or claim a workflow/approval happened when its table is intentionally at zero-state.
