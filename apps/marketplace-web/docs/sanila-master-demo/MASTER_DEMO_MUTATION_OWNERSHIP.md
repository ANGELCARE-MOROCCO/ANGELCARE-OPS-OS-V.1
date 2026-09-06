# SANILA Master Demo V2 — mutation ownership

The 111-table forecast ledger is the classification universe. Classification was checked against literal repository writes, dynamic AC360 School Ops resources, action/RPC-produced child rows, and the explicitly reviewed V2 commercial surfaces. It is not a blanket trigger over every AC360 table.

## Complete fixture classification

- `READ_ONLY_REFERENCE` (4): `angelcare360_school_day_rules`, `angelcare360_area11_families`, `angelcare360_area11_family_memberships`, `angelcare360_reports`.
- `DERIVED` (2): `angelcare360_report_exports`, `angelcare360_export_files`. These are still captured because an interactive export action creates them.
- `SYSTEM_ONLY` (1): `angelcare360_audit_logs`. It is captured because interactive commands create audit children that reset must remove.
- `INTERACTIVE_CREATE` (104): every other table in the exact 111-table forecast ledger. This includes direct inserts/upserts, dynamically selected AC360 School Ops resources, and action/RPC child tables. Canonical rows in this set also support `INTERACTIVE_UPDATE_DELETE`; deterministic reseeding restores their before-state.

Three interactive-create tables outside the forecast ledger are also captured because prospects can create them even though they are not part of the 127,177 canonical fixture forecast: `angelcare360_admission_interviews`, `angelcare360_admission_document_submissions`, and `angelcare360_attendance_status_history`.

The resulting `sanila_master_demo_v2_mutable_tables()` authority contains 110 distinct tables: 107 fixture tables plus those 3 non-fixture interactive tables. Four read-only fixture references remain deliberately untriggered.

## Runtime ownership and cost

The trigger records inserts and first before-images for updates/deletes. It never accepts a client `is_demo` claim. Seed/reset transaction settings suppress self-registration.

- `school_id` tables use event-specific `WHEN` predicates: INSERT reads `NEW`, UPDATE reads `OLD OR NEW`, and DELETE reads `OLD`.
- `org_id` tables use the equivalent event-specific predicates through the exact AC360 organization-to-Master-Demo proof.
- The journal function repeats exact active/non-billable/safety-enforced config verification before insert.
- Demo-created rows are deleted in FK retry order. Canonical updates/deletes are restored by the exact seed ledger.
- Tenant, school, config, auth, access, subscription and entitlement authorities remain outside reset ownership.

MUTABLE_TABLES_TOTAL=110
MUTATION_INSERT_CAPTURE_TABLES=110
MUTATION_UPDATE_CAPTURE_TABLES=110
MUTATION_DELETE_CAPTURE_TABLES=110
PHYSICAL_MUTATION_TRIGGERS=330
INSERT_TRIGGER_REFERENCES_OLD=0
DELETE_TRIGGER_REFERENCES_NEW=0
INTERACTIVE_CREATE_TABLES_UNTRACKED=0
INTERACTIVE_UPDATE_TABLES_UNRESTORABLE=0
REAL_CUSTOMER_TRIGGER_OVERHEAD_MINIMIZED=PASS_DESIGN
REAL_CUSTOMER_MUTATIONS_NEVER_JOURNALED=PASS_DESIGN
