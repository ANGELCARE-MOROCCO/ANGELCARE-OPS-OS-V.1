# ANGELCARE 360 Laravel Route Map

## Route File Inventory

| Route file | Count | Primary responsibility |
|---|---:|---|
| `routes/web.php` | 23 | Bootstrap, auth, admission forms, public entry points |
| `routes/admin.php` | 231 | Main school admin cockpit |
| `routes/teacher.php` | 180 | Teacher workflow, approvals, lesson plans, assignments, leaves |
| `routes/student.php` | 58 | Student portal, class wall, homework, conversation, library, notifications |
| `routes/receptionist.php` | 96 | Front desk workflows, visitor/call/postal logs, leaves, phone directory |
| `routes/accountant.php` | 38 | Accounting dashboard, tasks, notices, payroll views, events |
| `routes/librarian.php` | 30 | Library catalog, lending, imports, staff/student lookups |
| `routes/payroll.php` | 49 | Payroll templates, salaries, payslips, transactions, reports |
| `routes/setting.php` | 13 | Academic year and setup utilities |
| `routes/api.php` | 16 top-level route groups | Parent/student mobile APIs and teacher APIs |
| `routes/teacherapi.php` | 7 visible declarations before the main teacher API group continues | Teacher mobile API entrypoints and approvals |
| `routes/addon.php` | 2 | Add-on installer hooks |
| `routes/superadmin.php` | scaffold only | Disabled or commented superadmin route skeleton |
| `routes/inventory.php` | no visible route declarations | Placeholder / empty |
| `routes/stock.php` | no visible route declarations | Placeholder / empty |
| `routes/channels.php` | broadcast channels | Realtime auth channels |
| `routes/console.php` | console commands | Scheduled / CLI support |

## Route Families by Domain

### Administration

Key workflows:

- Dashboard and structural lists
- Admissions list, show, edit, update, delete
- Academic year management
- School details
- Standards, sections, and standard-section links
- Subjects
- Notes
- Discipline
- Phone directory
- Student lifecycle
- Message sending
- Attendance
- Reports
- Staff / teacher / parent management
- Settings and SEO / maintenance / general config

Representative controllers:

- `Admin/DashboardController`
- `Admin/AdmissionController`
- `Admin/AcademicYearController`
- `Admin/StandardController`
- `Admin/SectionController`
- `Admin/StandardsLinkController`
- `Admin/StudentController`
- `Admin/StudentDetailsController`
- `Admin/TeacherAddController`
- `Admin/TeacherListController`
- `Admin/ReportsController`
- `Admin/NotificationController`

### Teacher

Key workflows:

- Teacher dashboard
- Assignments with approval flow
- Homework with approval flow
- Student marks and submissions
- Leave requests and approvals
- Lesson plan creation, step workflow, publishing, approval
- Class wall and conversations
- Tasks
- Payroll views and payslips
- Attendance, notices, events, holidays, notifications

Representative controllers:

- `Teacher/DashboardController`
- `Teacher/AssignmentController`
- `Teacher/Approval/AssignmentController`
- `Teacher/Approval/HomeWorkController`
- `Teacher/HomeWorkController`
- `Teacher/LessonPlanAddController`
- `Teacher/LessonPlanEditController`
- `Teacher/LessonPlanApprovalController`
- `Teacher/LeaveController`
- `Teacher/TaskController`
- `Teacher/ConversationController`

### Student

Key workflows:

- Student dashboard
- Homework and assignment submissions
- Conversations and notifications
- Class wall pages and posts
- Library activity
- Events, holidays, feed, noticeboard
- Profile and tasks

Representative controllers:

- `Student/DashboardController`
- `Student/AssignmentController`
- `Student/HomeworkController`
- `Student/ConversationController`
- `Student/PagesController`
- `Student/PostsController`
- `Student/NotificationController`
- `Student/LibraryActivityController`

### Receptionist / Front Desk

Key workflows:

- Visitor logs
- Call logs
- Postal records
- Holiday and notice lookups
- Leave management
- Tasks
- Notifications
- Phone directory

Representative controllers:

- `Receptionist/DashboardController`
- `Receptionist/VisitorLogController`
- `Receptionist/CallLogController`
- `Receptionist/PostalRecordController`
- `Receptionist/TelephoneDirectoryController`
- `Receptionist/LeaveController`

### Accountant

Key workflows:

- Accounting dashboard
- Birthday / anniversary digests
- Events and feed
- Noticeboard
- Notifications
- Tasks and todo lists
- Payroll readouts

Representative controllers:

- `Accountant/DashboardController`
- `Accountant/BirthdayController`
- `Accountant/EventsController`
- `Accountant/FeedController`
- `Accountant/NoticeBoardController`
- `Accountant/NotificationController`
- `Accountant/TaskController`

### Librarian

Key workflows:

- Book categories
- Books
- Lending / returns
- Import
- Lookups for students, teachers, staff

Representative controllers:

- `Librarian/BookCategoryController`
- `Librarian/BookController`
- `Librarian/BookLendingController`
- `Librarian/LibraryImportController`
- `Librarian/StudentController`
- `Librarian/TeacherListController`

### Payroll

Key workflows:

- Payroll templates
- Salary definitions
- Payslips
- Transactions
- Unpaid payroll reporting

Representative controllers:

- `Payroll/PayrollTemplateController`
- `Payroll/PayrollSalaryController`
- `Payroll/PayrollController`
- `Payroll/TransactionController`
- `Payroll/ReportsController`

### API / Mobile

Parent-facing API:

- Login and token issuance
- Child list / child details
- School info
- Events
- Holiday list
- Bulletins
- Leave requests
- Messages / notifications
- Feedbacks
- Discipline
- Homework
- Lesson plans
- Attendance
- Teachers
- Assignments

Teacher-facing API:

- Login, logout, profile, subject dashboard
- Assignment creation and approval
- Homework creation and approval
- Student assignment scoring
- Leave management
- Lesson plan publishing
- Tasks
- Attendance
- Events / notices / holidays

## Observed Route Design Patterns

- Role-specific route files are used instead of a single global route registry.
- Most mutating workflows expose show/list/create/edit/update/delete variants.
- Approval workflows are encoded as separate route families and sometimes role-restricted groups.
- API routes mirror the web modules rather than abstracting them behind a generic REST layer.
- Some routes are commented out rather than deleted, which indicates module toggles and feature drift.

## Notable Gaps / Oddities

- `inventory.php` and `stock.php` are effectively empty in the extracted archive.
- `superadmin.php` is commented scaffolding only.
- `web.php` mostly handles bootstrap and admission forms, not the heavy admin work.
- The source uses a mix of singular/plural and English/French-ish naming conventions.

