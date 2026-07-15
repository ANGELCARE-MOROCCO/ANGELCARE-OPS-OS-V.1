# ANGELCARE 360 Database Rebuild Plan

## Rebuild Goal

Translate the Laravel school ERP into a Vercel-native Supabase/Postgres schema without copying the PHP migration structure directly.

## Translation Rules

1. Keep the data model school-scoped.
2. Add explicit tenant-aware row boundaries.
3. Normalize finance, audit, and document flows more cleanly than the Laravel source.
4. Keep technical table names namespaced with `angelcare360_` where new tables are introduced.
5. Reuse existing platform auth only if it does not leak unrelated product concerns.

## Recommended Entity Families

### Tenancy / school core

- `angelcare360_schools`
- `angelcare360_academic_years`
- `angelcare360_school_settings`

### Identity / RBAC

- `angelcare360_roles`
- `angelcare360_permissions`
- `angelcare360_role_permissions`
- `angelcare360_user_roles`
- `angelcare360_user_permissions`

### People

- `angelcare360_students`
- `angelcare360_parents`
- `angelcare360_staff`
- `angelcare360_student_parent_links`
- `angelcare360_student_enrollments`
- `angelcare360_student_histories`
- `angelcare360_staff_profiles`
- `angelcare360_parent_profiles`

### Academics

- `angelcare360_classes`
- `angelcare360_sections`
- `angelcare360_class_sections`
- `angelcare360_subjects`
- `angelcare360_teaching_assignments`
- `angelcare360_attendance_records`
- `angelcare360_attendance_justifications`
- `angelcare360_timetables`
- `angelcare360_assignments`
- `angelcare360_homework`
- `angelcare360_exams`
- `angelcare360_marks`
- `angelcare360_report_cards`
- `angelcare360_appreciations`

### Admissions

- `angelcare360_admissions`
- `angelcare360_admission_documents`
- `angelcare360_admission_pipeline_events`

### Finance

- `angelcare360_fee_structures`
- `angelcare360_invoices`
- `angelcare360_payments`
- `angelcare360_receipts`
- `angelcare360_relances`
- `angelcare360_remises`
- `angelcare360_accounting_entries`
- `angelcare360_expenses`
- `angelcare360_payroll_records`
- `angelcare360_payroll_lines`
- `angelcare360_salary_items`

### Transport

- `angelcare360_transport_routes`
- `angelcare360_transport_vehicles`
- `angelcare360_transport_assignments`

### Library / inventory

- `angelcare360_library_books`
- `angelcare360_library_categories`
- `angelcare360_library_loans`
- `angelcare360_library_cards`
- `angelcare360_inventory_items`
- `angelcare360_inventory_movements`

### Messaging / content / ops

- `angelcare360_messages`
- `angelcare360_conversations`
- `angelcare360_notifications`
- `angelcare360_annonces`
- `angelcare360_reclamations`
- `angelcare360_documents`
- `angelcare360_exports`
- `angelcare360_reports`
- `angelcare360_audit_logs`
- `angelcare360_settings`

## Source-to-Target Mapping

### Identity and school structure

- `users` -> existing user identity or `angelcare360_users`
- `schools` -> `angelcare360_schools`
- `academic_years` -> `angelcare360_academic_years`
- `sections` -> `angelcare360_sections`
- `standards` -> `angelcare360_classes`
- `standards_link` -> `angelcare360_class_sections`
- `subjects` -> `angelcare360_subjects`

### People

- `student_academics` -> `angelcare360_student_enrollments`
- `student_parent_links` -> `angelcare360_student_parent_links`
- `teacherprofile` -> `angelcare360_staff_profiles`
- `parent_profiles` -> `angelcare360_parent_profiles`

### Academic operations

- `attendances` -> `angelcare360_attendance_records`
- `absent_reasons` -> `angelcare360_attendance_justifications`
- `assignments` -> `angelcare360_assignments`
- `homeworks` -> `angelcare360_homework`
- `lesson_plans` -> `angelcare360_pedagogical_plans`
- `marks` -> `angelcare360_marks`
- `bulletins` -> `angelcare360_report_cards`

### Finance

- `plans` / `subscriptions` are not enough for real school billing
- rebuild invoices, receipts, discounts, and reminders as first-class tables
- use explicit accounting entries for auditability

### Communication

- `notice_board` -> `angelcare360_annonces`
- `messages` / `conversations` -> `angelcare360_messages` / `angelcare360_conversations`
- `notifications` -> `angelcare360_notifications`
- `feedbacks` -> `angelcare360_reclamations`

### Audit

- `activity_log`, visitor logs, call logs, postal logs, and exports should converge into `angelcare360_audit_logs` plus module-specific operational logs if needed

## Relationship Model

### Required foreign keys

- every school-owned table should carry `school_id`
- almost every academic table should carry `academic_year_id`
- class assignment tables should use a dedicated `class_section_id` or equivalent
- people tables should use normalized `student_id`, `parent_id`, `staff_id`, and `user_id` relationships
- invoice/payment/payroll rows must keep owner, amount, status, and audit timestamps

### Suggested constraints

- soft delete where lifecycle matters
- unique school-scoped codes for classes, employees, books, and invoices
- audit rows for every critical mutation
- RLS policies keyed by school and role

## Multi-Etablissement Readiness

If the existing app stack supports it, the rebuild should reserve the path for:

- multiple schools in one deployment
- separate school-scoped data access
- per-school branding and settings
- cross-school super admin visibility only

## Practical Migration Strategy

1. Add namespaced AngelCare 360 tables.
2. Seed core school, year, RBAC, and status data.
3. Add document and audit structures early.
4. Add academic/person tables next.
5. Add finance, transport, library, and inventory later.
6. Keep old source naming available only as a translation reference, not as a direct schema target.

