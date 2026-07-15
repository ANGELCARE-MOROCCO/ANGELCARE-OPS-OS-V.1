# ANGELCARE 360 Laravel Module Feature Map

## Source Module Inventory

### 1. Admissions

Source surfaces:

- `routes/web.php`
- `routes/admin.php`
- `app/Http/Controllers/AdmissionController.php`
- `app/Http/Controllers/Admin/AdmissionController.php`

Operational workflows:

- public admission form
- standard selection
- form validation per step
- admission review and conversion
- student profile creation
- parent profile creation
- class assignment
- confirmation and record tracking

### 2. Students

Source surfaces:

- `routes/admin.php`
- `routes/student.php`
- `app/Http/Controllers/Admin/StudentController.php`
- `app/Http/Controllers/Admin/StudentDetailsController.php`
- `app/Http/Controllers/Student/*`
- models `User`, `StudentAcademic`, `StudentParentLink`, `StudentHistory`

Operational workflows:

- student dossier
- parent links
- academic history
- attendance history
- discipline history
- assignment and homework history
- document / medical notes
- class / section assignment

### 3. Parents

Source surfaces:

- `StudentParentLink`
- `ParentProfile`
- parent-oriented API and portal logic
- `app/Http/Controllers/Admin/ParentController.php`

Operational workflows:

- parent dossier
- child linkage
- message and notification readiness
- payment and fee visibility
- student performance visibility

### 4. Teachers and Staff

Source surfaces:

- `routes/teacher.php`
- `routes/admin.php`
- `TeacherProfile`
- `Teacherlink`
- `Admin/Teacher*` controllers
- `Teacher/*` controllers

Operational workflows:

- staff profile
- qualification capture
- class/subject assignment
- reporting line
- attendance and leave
- payroll linkage
- document attachment

### 5. Classes, Sections, Subjects, Academic Years

Source surfaces:

- `AcademicYearController`
- `SectionController`
- `StandardController`
- `StandardsLinkController`
- `SubjectController`
- models `AcademicYear`, `Section`, `Standard`, `StandardLink`, `Subject`

Operational workflows:

- school setup
- academic-year lifecycle
- grade/class master data
- class-section-year linking
- class teacher assignment
- subject assignment

### 6. Attendance and Justifications

Source surfaces:

- `AttendanceController`
- `AbsentReason`
- attendance-related dashboard widgets and APIs

Operational workflows:

- daily attendance
- present / absent / late / excused
- absence reasons
- monthly reporting
- parent notification readiness

### 7. Timetable / Calendar

Source surfaces:

- timetable-related controllers in admin, teacher APIs, and standard-link details
- calendar / events controllers

Operational workflows:

- timetable creation
- day-based schedules
- class-based schedules
- teacher schedules
- academic calendar
- holiday tracking

### 8. Devoirs / Homework / Assignments / Lesson Plans

Source surfaces:

- `Assignment`
- `Homework`
- `LessonPlan`
- approval controllers for homework and assignments
- lesson plan step-by-step creation and publishing

Operational workflows:

- teacher content creation
- approval gates
- student submission tracking
- grading / marks entry
- publish / reject / review

### 9. Exams / Marks / Bulletins / Averages

Source surfaces:

- `Exam` and `Mark` references in controllers and relations
- `Bulletin`
- grading tables
- report/export controllers

Operational workflows:

- exam setup
- mark entry
- average calculation
- report-card generation
- comment / appreciation workflow

### 10. Finance / Fees / Billing / Payroll

Source surfaces:

- `PaymentController`
- `Payroll*` controllers
- `Plan`, `Subscription`, `PayCategory`, `Salary`, `PayrollTransaction`

Operational workflows:

- fee or billing plan handling
- payment records
- payroll templates and payslips
- transaction tracking
- unpaid report export

### 11. Transport

Source surfaces:

- transport-related role middleware
- transport coordinator / driver roles
- `transportations` table
- notifications and attendance associations

Operational workflows:

- route management
- student assignment to routes
- coordinator / driver assignment
- transport notification readiness

### 12. Library

Source surfaces:

- `BookCategory`
- `Book`
- `BookLending`
- `LibraryCard`
- `Librarian/*` controllers

Operational workflows:

- catalog
- borrowing
- return
- overdue handling
- import utilities

### 13. Documents / Media / Export

Source surfaces:

- `Document`
- `Media`
- export controllers
- PDF views

Operational workflows:

- upload and store documents
- attachment-based records
- PDF export
- student export
- printable reports

### 14. Messaging / Notifications / Announcements

Source surfaces:

- `Conversation`
- `Message`
- `Notification`
- `NoticeBoard`
- `Feed`
- `Posts`, `Comments`, `Replies`

Operational workflows:

- internal messaging
- announcements
- notifications by role
- class wall content
- feed and comments

### 15. Audit / Security / Configuration

Source surfaces:

- `ActivityLog`
- `Settings`
- `Plan`
- `Subscription`
- `Kernel` middleware
- `AuthServiceProvider` gates

Operational workflows:

- audit logging
- policy enforcement
- school-level access control
- maintenance and SEO settings

## Workflow Depth Notes

This is not a screen-only product. The source contains:

- approval gates
- stepwise form flows
- import/export flows
- attachment and file-path handling
- comment/reply chains
- dashboard summaries
- role-specific portals
- mobile API mirrors of the core workflows

## Direct Feature-to-Route Signals

- Many routes are CRUD-like but are backed by workflow transitions and role checks.
- Teacher content modules are deliberately split into create/edit/show/approve actions.
- Student and parent surfaces are read-heavy but still include messaging, submission, and notification actions.
- Accounting and payroll modules include both list/detail workflows and export/report actions.

