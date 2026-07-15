# ANGELCARE 360 Source Audit

## Provenance

- Source zip found at: `~/Desktop/gegok12-main.zip`
- Extracted reference root: `.angelcare360_source_analysis/extracted/gegok12-main`
- Reference product name observed from source metadata and code comments: `GegoK12` / school-management suite

## Laravel Stack Summary

- Framework: Laravel 12
- PHP requirement: `^8.4`
- Front-end stack: Laravel Mix + Vue 3 + Blade + Bootstrap 4 + Tailwind 3
- Auth stack: `web` session auth, `api` Passport, `sanctum` for first-party API flows
- RBAC stack: Laratrust
- Media/files: Spatie Media Library, local/public/S3 disks, upload-to-public support
- Queue/broadcasting: sync/database/redis/sqs queues, Pusher/Redis/log/null broadcasting
- Notifications: mail, SMS, Firebase, FCM, websockets, reminders, push events

## Source Size

- Route files discovered: 17
- Controllers discovered: 247
- Models discovered: 107
- Migrations discovered: 108
- Blade view files discovered: 576
- Seeders discovered: 38

## Top-Level Functional Coverage

The source app is not a thin school portal. It is a broad school-management ERP with:

- Admissions and student lifecycle
- School structure and academic years
- Standards/classes/sections/teacher assignment
- Attendance and absence reasons
- Homework, assignments, approvals, marks, reports
- Events, notices, bulletins, feeds, messages, conversations
- Parent/student/teacher portals
- Library and lending
- Payroll and transactions
- Transport and logistics
- Visitor/call/postal records
- Task and reminder management
- Settings, plans, subscriptions, localization assets
- API/mobile surfaces for parents and teachers

## Route Architecture Summary

Primary route files:

- `routes/admin.php` for the main school admin surface
- `routes/teacher.php` for teacher workflow and approvals
- `routes/student.php` for student portal workflows
- `routes/receptionist.php` for reception/front-desk workflows
- `routes/accountant.php` for accounting workflows
- `routes/librarian.php` for library workflows
- `routes/payroll.php` for payroll workflows
- `routes/setting.php` for academic/setup configuration
- `routes/api.php` for parent/student mobile APIs
- `routes/teacherapi.php` for teacher mobile APIs
- `routes/web.php` for bootstrap/auth/admission forms and public entry points

Route density by file:

- `admin.php`: 231 route declarations
- `teacher.php`: 180
- `receptionist.php`: 96
- `student.php`: 58
- `payroll.php`: 49
- `accountant.php`: 38
- `librarian.php`: 30
- `web.php`: 23
- `api.php`: 16
- `setting.php`: 13
- `teacherapi.php`: 7
- `addon.php`: 2
- `inventory.php`: 0 visible route declarations
- `stock.php`: 0 visible route declarations
- `superadmin.php`: commented scaffold only

## Core Auth / ACL / Runtime Controls

### Session and API auth

- `config/auth.php` uses `web` session auth and `api` Passport auth.
- `config/sanctum.php` is enabled for SPA-style stateful API auth.
- `app/Http/Kernel.php` registers custom role middleware plus Laratrust middleware.

### RBAC and tenant control

- Laratrust tables: `roles`, `permissions`, `role_user`, `permission_user`, `permission_role`
- Role middleware names in `Kernel.php`:
  - `schooladmin`
  - `schoolsubadmin`
  - `teacher`
  - `librarian`
  - `student`
  - `parent`
  - `receptionist`
  - `accountant`
  - `stockkeeper`
  - `adminaccountant`
  - `privilegeconditions`
  - `verifyotp`
  - `alumni`
- Custom policy gates in `AuthServiceProvider` are school-scoped, largely on `school_id`

### Filesystem / queue / broadcast

- Filesystem disks:
  - `local`
  - `public`
  - `s3`
  - `uploads`
- Queue drivers:
  - `sync`
  - `database`
  - `beanstalkd`
  - `sqs`
  - `redis`
- Broadcast drivers:
  - `pusher`
  - `redis`
  - `log`
  - `null`

## Major Modules Found

### Administration / backbone

- Dashboard
- Academic year management
- School details
- Sections and standards
- Standard-section linking
- Subjects
- Students
- Parents
- Teachers and staff
- Attendance
- Notice board
- Reports
- Documents
- Fees and payment flows
- Visitor / call / postal logs
- Settings and maintenance

### Pedagogy / academics

- Assignments
- Homework
- Lesson plans
- Approvals
- Marks and grading
- Bulletins
- Class wall / posts / comments
- Events / calendars

### Operations / support

- Receptionist console
- Accountant console
- Librarian console
- Payroll console
- Tasks and reminders
- Notifications and messaging
- Conversations / chat

### Mobile / API

- Parent API
- Teacher API
- School detail APIs
- Homework and assignment APIs
- Leave, attendance, events, notices, lesson plan APIs

## Most Important Reference Entities

- `User`
- `School`
- `AcademicYear`
- `Standard`
- `Section`
- `StandardLink`
- `StudentAcademic`
- `StudentParentLink`
- `TeacherProfile`
- `ParentProfile`
- `Attendance`
- `Assignment`
- `Homework`
- `LessonPlan`
- `Book`
- `BookLending`
- `Payroll`
- `PayrollTemplate`
- `PayrollItem`
- `Conversation`
- `Message`
- `NoticeBoard`
- `Document`
- `Task`

## Observed Product Behavior

- School scoping is pervasive through `school_id`
- Academic workflows are usually scoped by `academic_year_id`
- Class assignment is normalized through `standardLink_id`
- Teacher approval flows exist for assignments, homework, and lesson plans
- Parent-student linkage is explicit through `student_parent_links`
- Many screens are CRUD-heavy but not superficial; they carry approvals, exports, prints, notifications, or status transitions

## Build / Front-End Tooling

- `composer.json` uses Laravel artisan scripts plus `npm install` and `npm run build`
- `webpack.mix.js` builds from `resources/assets/js/app.js` and `resources/assets/sass/app.scss`
- `resources/js` is not the primary front-end root; the source is Mix/Blade/Vue oriented

## Source Risk Notes

- This reference app is broad and operationally dense, not a minimal clone target.
- The runtime expects multiple role-specific middlewares and school-scoped policies.
- The front end is legacy Laravel-era Vue/Blade, so the rebuild must translate behavior, not copy structure.
- Some source naming is inconsistent (`standard` vs `class`, `schooladmin` vs `administrator`, `teacherprofile` table singular/plural drift).

