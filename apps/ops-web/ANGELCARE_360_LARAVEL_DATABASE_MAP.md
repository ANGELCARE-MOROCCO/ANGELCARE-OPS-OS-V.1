# ANGELCARE 360 Laravel Database Map

## Database Shape

The Laravel reference uses a classic school ERP relational model. The dominant design rule is:

- `school_id` scopes nearly every operational table
- `academic_year_id` scopes most academic records
- `standardLink_id` binds class + section + year
- `user_id` binds identity to student/parent/teacher profiles
- soft deletes are used widely on operational tables

The schema is not yet normalized for a modern Vercel-native product, but it is rich enough to reverse-engineer the business entities.

## Core Identity / RBAC Tables

| Source table | Business meaning | Target AngelCare 360 entity |
|---|---|---|
| `users` | All actors: admin, teacher, student, parent, staff | `angelcare360_users` or mapped identity table |
| `usergroups` | Legacy coarse role buckets | `angelcare360_role_groups` or role seed mapping |
| `roles` | Laratrust roles | `angelcare360_roles` |
| `permissions` | Laratrust permissions | `angelcare360_permissions` |
| `role_user` | User-role assignments | `angelcare360_user_roles` |
| `permission_user` | Direct user permissions | `angelcare360_user_permissions` |
| `permission_role` | Role permission assignments | `angelcare360_role_permissions` |

Observed role-related source roles:

- `leave_applier`
- `leave_checker`
- `principal`
- `student_leave_checker`
- `class_coordinator`
- `transport_coordinator`
- `transport_driver`

## School Structure Tables

| Source table | Meaning | Target entity |
|---|---|---|
| `schools` | School master record | `angelcare360_schools` |
| `school_details` | Branding / metadata / board / logo | `angelcare360_school_settings` or `angelcare360_school_details` |
| `academic_years` | Academic year lifecycle | `angelcare360_academic_years` |
| `sections` | Section master | `angelcare360_sections` |
| `standards` | Grade / class master | `angelcare360_classes` or `angelcare360_grades` |
| `standards_link` | Class-section-year linkage | `angelcare360_class_sections` |
| `subjects` | Subject master | `angelcare360_subjects` |
| `teacherlink` | Teacher-subject-class assignment | `angelcare360_teaching_assignments` |
| `class_teacher_links` | Class teacher assignment | `angelcare360_class_teachers` |

## People / Dossier Tables

| Source table | Meaning | Target entity |
|---|---|---|
| `userprofiles` | Shared user profile data | `angelcare360_user_profiles` |
| `teacherprofile` | Teacher/staff dossier | `angelcare360_staff_profiles` |
| `parent_profiles` | Parent dossier | `angelcare360_parent_profiles` |
| `student_academics` | Enrollment and academic dossier | `angelcare360_student_enrollments` |
| `student_parent_links` | Student-parent linkage | `angelcare360_student_parent_links` |
| `student_history` | Historical academic transitions | `angelcare360_student_histories` |
| `qualifications` | Staff qualifications and credentials | `angelcare360_qualifications` |

## Attendance / Academic Records

| Source table | Meaning | Target entity |
|---|---|---|
| `attendances` | Daily attendance records | `angelcare360_attendance_records` |
| `absent_reasons` | Absence / lateness justifications | `angelcare360_attendance_justifications` |
| `assignments` | Teacher assignments | `angelcare360_assignments` |
| `student_assignments` | Student assignment submissions | `angelcare360_assignment_submissions` |
| `homeworks` | Homework records | `angelcare360_homework_items` |
| `student_homework` | Homework submissions | `angelcare360_homework_submissions` |
| `lesson_plans` | Pedagogical planning | `angelcare360_lesson_plans` |
| `lesson_plan_approvals` | Lesson plan approval trail | `angelcare360_lesson_plan_reviews` |
| `assignment_approvals` | Assignment approval trail | `angelcare360_assignment_reviews` |
| `homework_approvals` | Homework approval trail | `angelcare360_homework_reviews` |
| `marks` | Marks and score entries | `angelcare360_marks` |
| `notes` | Observations / annotations | `angelcare360_notes` |
| `bulletins` | Report-card style publications | `angelcare360_report_cards` |
| `scholastic` / `non_sc_grade` / `sc_grade` | Grading reference data | `angelcare360_grading_rules` |
| `promotions` | Student promotion state | `angelcare360_student_promotions` |
| `disciplines` | Discipline incidents | `angelcare360_discipline_records` |

## Communication / Community

| Source table | Meaning | Target entity |
|---|---|---|
| `notice_board` | Announcements / notices | `angelcare360_announcements` |
| `notifications` | In-app notification rows | `angelcare360_notifications` |
| `messages` | Direct/internal messages | `angelcare360_messages` |
| `conversations` | Conversation thread headers | `angelcare360_conversations` |
| `conversation_messages` | Thread messages | `angelcare360_conversation_messages` |
| `conversation_users` | Conversation membership | `angelcare360_conversation_members` |
| `feedbacks` | Complaints / requests / feedback | `angelcare360_requests` or `angelcare360_complaints` |
| `feedback_messages` | Feedback thread replies | `angelcare360_request_messages` |
| `posts` / `post_details` / `post_comments` / `post_comment_details` | Class wall / feed | `angelcare360_posts` and related sub-entities |
| `class_room_page*` | Classroom content pages and attachments | `angelcare360_pedagogical_pages` |
| `mailtemplates` / `sms_templates` | Notification templates | `angelcare360_message_templates` |

## Finance / Billing / Payroll

| Source table | Meaning | Target entity |
|---|---|---|
| `plans` | Subscription / billing plans | `angelcare360_subscription_plans` |
| `subscriptions` | School subscriptions | `angelcare360_subscriptions` |
| `pay_categories` | Payroll categories | `angelcare360_salary_categories` |
| `payroll_templates` | Payroll templates | `angelcare360_payroll_templates` |
| `template_items` | Payroll template line items | `angelcare360_payroll_template_items` |
| `salaries` | Salary records | `angelcare360_payroll_records` |
| `salary_items` | Salary line items | `angelcare360_payroll_lines` |
| `payrolls` | Payslip / payroll batch | `angelcare360_payroll_batches` |
| `payslip_items` | Payslip line items | `angelcare360_payslip_items` |
| `payroll_transactions` | Payroll payments/adjustments | `angelcare360_payroll_transactions` |
| `transaction_types` | Transaction classification | `angelcare360_transaction_types` |
| `transaction_accounts` | Ledger / account mapping | `angelcare360_accounts` |

The source does not present a clean modern invoice model. The target rebuild should normalize it into:

- fee structures
- invoices
- payments
- receipts
- remittances / reminders
- discounts / concessions
- accounting entries

## Library / Inventory / Logistics

| Source table | Meaning | Target entity |
|---|---|---|
| `books_category` | Library categories | `angelcare360_library_categories` |
| `books` | Library books | `angelcare360_library_books` |
| `book_lending` / `books_lending` | Loans / returns | `angelcare360_library_loans` |
| `library_card` | Reader/library membership | `angelcare360_library_cards` |
| `transportations` | Transport routing records | `angelcare360_transport_routes` |
| `telephone_directory` | Contact directory | `angelcare360_contact_directory` |
| `visitor_log` | Front-desk visitor log | `angelcare360_visitor_logs` |
| `call_log` | Call tracking | `angelcare360_call_logs` |
| `postal_record` | Mail / postal tracking | `angelcare360_postal_records` |

## Supporting / Governance Tables

| Source table | Meaning | Target entity |
|---|---|---|
| `settings` | Application settings | `angelcare360_settings` |
| `reminders` | Reminder records | `angelcare360_reminders` |
| `tasks` / `task_assignees` | Task engine | `angelcare360_tasks` / `angelcare360_task_assignees` |
| `activity_log` | Audit trail | `angelcare360_audit_logs` |
| `documents` | Uploaded documents | `angelcare360_documents` |
| `media` | Media library | `angelcare360_media_assets` |
| `events` / `event_galleries` | Calendar / media events | `angelcare360_calendar_events` |
| `subscriptions` | External billing status | `angelcare360_subscription_statuses` |

## Relationship Patterns

### 1. School scoping

Most records are linked by `school_id`. This is the de facto tenant boundary.

### 2. Academic-year scoping

Academic operations almost always include `academic_year_id`.

### 3. Class linkage

The real class boundary is `standardLink_id`, not just `standard_id` or `section_id`.

### 4. Identity binding

`users` is the root identity table. Specialized profiles fan out from it:

- teacher profile
- parent profile
- student academic record

### 5. Approval trails

Teacher content modules are not simple CRUD:

- assignments can be approved/rejected
- homework can be approved/rejected
- lesson plans can be approved/rejected

### 6. Historical and soft-delete behavior

Many source tables use soft deletes and preserve lifecycle state rather than hard deletion.

## Multi-Tenant Readiness Observations

- The schema is school-scoped but not strongly isolated by tenant schema.
- `schools` can be promoted to the tenant root in the rebuild.
- A modern rebuild should preserve `school_id` on every operational row and apply row-level security.

