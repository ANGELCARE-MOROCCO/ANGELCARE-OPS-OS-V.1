# SANILA Final Product Closure — Action Ledger

Generated from actual UI and server action sources.

- Route/action associations: **40**
- Unique role/action pairs: **37**
- Blocked UI→backend actions: **0**
- Unmapped backend actions (excluding explicit compatibility handler): **0**

| Role | View | UI action | Backend handlers | Command keys | Canonical resources/stores | Status |
|---|---|---|---:|---|---|---|
| teacher | attendance | `attendance.batch` | 1 | teacher.attendance.batch | angelcare360_attendance_records<br>angelcare360_class_enrollments<br>angelcare360_attendance_sessions<br>angelcare360_attendance_records<br>angelcare360_attendance_status_history<br>angelcare360_student_parent_links | COMPLETE |
| teacher | attendance | `attendance.mark` | 1 | teacher.attendance.mark | angelcare360_attendance_records<br>angelcare360_attendance_sessions<br>angelcare360_attendance_records<br>angelcare360_student_parent_links<br>angelcare360_attendance_status_history | COMPLETE |
| teacher | teaching | `lesson.create` | 1 | teacher.lesson.create | angelcare360_lessons<br>angelcare360_lessons | COMPLETE |
| teacher | teaching | `lesson.update` | 1 | teacher.lesson.update | angelcare360_lessons<br>angelcare360_lessons | COMPLETE |
| teacher | homework | `assignment.create` | 1 | teacher.assignment.create | angelcare360_assignments<br>angelcare360_class_enrollments<br>angelcare360_assignments | COMPLETE |
| teacher | homework | `assignment.update` | 1 | teacher.assignment.update | angelcare360_assignments<br>angelcare360_assignments | COMPLETE |
| teacher | submissions | `submission.grade` | 1 | teacher.submission.grade | angelcare360_assignment_submissions<br>angelcare360_assignment_submissions<br>angelcare360_assignments<br>angelcare360_grade_submission_atomic_v1 | COMPLETE |
| teacher | assessments | `exam.create` | 1 | teacher.exam.create | angelcare360_exams<br>angelcare360_exams | COMPLETE |
| teacher | assessments | `exam.update` | 1 | teacher.exam.update | angelcare360_exams<br>angelcare360_exams | COMPLETE |
| teacher | marks | `mark.upsert` | 1 | teacher.mark.upsert | angelcare360_marks<br>angelcare360_exams<br>angelcare360_marks | COMPLETE |
| teacher | bulletins | `comment.create` | 1 | teacher.comment.create | angelcare360_teacher_comments<br>angelcare360_teacher_comments | COMPLETE |
| teacher | families | `family.message` | 1 | teacher.family.message | angelcare360_messages<br>angelcare360_student_parent_links | COMPLETE |
| teacher | families | `message.reply` | 1 | ${kind | angelcare360_messages | COMPLETE |
| teacher | tasks | `task.update` | 1 | ${kind | ac360_school_tasks | COMPLETE |
| teacher | work | `task.update` | 1 | ${kind | ac360_school_tasks | COMPLETE |
| teacher | work | `leave.request` | 2 | teacher.leave.request<br>${kind | ac360_school_leave_requests | COMPLETE |
| parent | requests | `request.create` | 1 | parent.request.create | angelcare360_reclamations<br>angelcare360_reclamations | COMPLETE |
| parent | attendance | `attendance.justify` | 1 | parent.attendance.justify | angelcare360_attendance_justifications<br>angelcare360_attendance_records<br>angelcare360_attendance_justifications | COMPLETE |
| parent | meetings | `meeting.create` | 1 | parent.meeting.create | angelcare360_area12_meetings<br>angelcare360_area12_meetings | COMPLETE |
| parent | meetings | `meeting.cancel` | 1 | parent.meeting.cancel | angelcare360_area12_meetings<br>angelcare360_area12_meetings | COMPLETE |
| parent | satisfaction | `satisfaction.submit` | 1 | parent.satisfaction.submit | angelcare360_area12_satisfaction_responses<br>angelcare360_area12_satisfaction_responses | COMPLETE |
| parent | satisfaction | `feedback.submit` | 1 | parent.feedback.submit | angelcare360_area12_feedback<br>angelcare360_area12_feedback | COMPLETE |
| parent | finance | `request.create` | 1 | parent.request.create | angelcare360_reclamations<br>angelcare360_reclamations | COMPLETE |
| parent | transport | `pickup.request` | 1 | parent.pickup.request | angelcare360_area11_pickup_authorizations<br>angelcare360_area11_pickup_authorizations | COMPLETE |
| parent | transport | `pickup.revoke` | 1 | parent.pickup.revoke | angelcare360_area11_pickup_authorizations<br>angelcare360_area11_pickup_authorizations | COMPLETE |
| parent | transport | `request.create` | 1 | parent.request.create | angelcare360_reclamations<br>angelcare360_reclamations | COMPLETE |
| parent | messages | `teacher.message` | 2 | parent.teacher.message<br>student.teacher.message | angelcare360_messages<br>angelcare360_students<br>angelcare360_teacher_assignments | COMPLETE |
| parent | messages | `message.reply` | 1 | ${kind | angelcare360_messages | COMPLETE |
| parent | account | `account.update` | 1 | parent.account.update | angelcare360_parents<br>angelcare360_parents | COMPLETE |
| student | submissions | `assignment.submit` | 1 | student.assignment.submit | angelcare360_assignment_submissions<br>angelcare360_assignments<br>angelcare360_assignment_submissions<br>angelcare360_documents<br>angelcare360_document_objects | COMPLETE |
| student | messages | `teacher.message` | 2 | parent.teacher.message<br>student.teacher.message | angelcare360_messages<br>angelcare360_students<br>angelcare360_teacher_assignments | COMPLETE |
| student | messages | `message.reply` | 1 | ${kind | angelcare360_messages | COMPLETE |
| staff | leave | `leave.request` | 2 | teacher.leave.request<br>${kind | ac360_school_leave_requests | COMPLETE |
| staff | tasks | `task.update` | 1 | ${kind | ac360_school_tasks | COMPLETE |
| staff | approvals | `approval.decide` | 1 | staff.approval.decide | angelcare360_workflow_instances<br>angelcare360_workflow_instances | COMPLETE |
| staff | workflows | `workflow.transition` | 1 | staff.workflow.transition | angelcare360_workflow_instances<br>angelcare360_workflow_instances | COMPLETE |
| staff | tickets | `incident.create` | 1 | staff.incident.create | ac360_school_incident_reports<br>ac360_school_incident_reports | COMPLETE |
| staff | tickets | `incident.update` | 1 | staff.incident.update | ac360_school_incident_reports<br>ac360_school_incident_reports | COMPLETE |
| staff | messages | `staff.message` | 1 | staff.message.create | angelcare360_messages<br>angelcare360_staff | COMPLETE |
| staff | messages | `message.reply` | 1 | ${kind | angelcare360_messages | COMPLETE |
