# ANGELCARE 360 Role Permission Map

## What the Source Actually Uses

### Laratrust

- `roles`
- `permissions`
- `role_user`
- `permission_user`
- `permission_role`

Laratrust middleware is registered directly in `app/Http/Kernel.php` as:

- `role`
- `permission`
- `ability`

### Custom role middleware

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

### User-group constants in `User`

The `User` model defines coarse legacy categories:

- site admin
- school admin
- teacher
- student
- parent
- librarian
- alumni
- receptionist
- accountant
- stock keeper
- non-teaching

### Seeded roles found in source

- `leave_applier`
- `leave_checker`
- `principal`
- `student_leave_checker`
- `class_coordinator`
- `transport_coordinator`
- `transport_driver`

The source therefore mixes:

- legacy user groups
- Laratrust roles
- route middleware
- policy gates

That is workable in Laravel, but the rebuild should collapse this into one coherent RBAC model.

## Proposed AngelCare 360 French RBAC

### Role set

| Role | Scope | Default intent |
|---|---|---|
| Super Admin | Platform-wide | Full control, tenancy, security, schema, feature flags |
| Direction Générale | Multi-établissement | Strategic oversight, approvals, reporting, audit access |
| Direction d’Établissement | School-wide | Operational ownership of one school |
| Administration | School back office | Students, parents, admissions, documents, exports |
| Réception | Front desk | Intake, contacts, visitor logs, document collection |
| Enseignant | Class/subject scope | Attendance, homework, marks, lesson plans, messaging |
| Parent | Own children | Child dossier, notifications, invoices, payments, messages |
| Élève | Own dossier | Homework, timetable, grades, documents, notifications |
| Comptabilité | Finance | Invoices, payments, receipts, remises, relances, reporting |
| RH / Paie | Staff/payroll | Staff records, payroll, attendance, leave, documents |
| Responsable Transport | Transport | Routes, vehicles, assignments, passenger communication |
| Bibliothécaire | Library | Books, lending, returns, overdue tracking |
| Responsable Qualité | Audit/compliance | Logs, exports, controls, policy checks |
| Support Technique | Technical support | Diagnostics, logs, system state, recovery |

## Permission Families

Use permission namespaces that remain technical but French-facing in the UI.

### Core families

- `angelcare360.direction.*`
- `angelcare360.admissions.*`
- `angelcare360.eleves.*`
- `angelcare360.parents.*`
- `angelcare360.enseignants.*`
- `angelcare360.personnel.*`
- `angelcare360.classes.*`
- `angelcare360.matieres.*`
- `angelcare360.annees_scolaires.*`
- `angelcare360.presences.*`
- `angelcare360.justifications.*`
- `angelcare360.emploi_du_temps.*`
- `angelcare360.calendrier.*`
- `angelcare360.devoirs.*`
- `angelcare360.cours.*`
- `angelcare360.examens.*`
- `angelcare360.notes.*`
- `angelcare360.bulletins.*`
- `angelcare360.finance.*`
- `angelcare360.comptabilite.*`
- `angelcare360.transport.*`
- `angelcare360.bibliotheque.*`
- `angelcare360.inventaire.*`
- `angelcare360.messagerie.*`
- `angelcare360.notifications.*`
- `angelcare360.annonces.*`
- `angelcare360.reclamations.*`
- `angelcare360.documents.*`
- `angelcare360.rapports.*`
- `angelcare360.parametres.*`
- `angelcare360.rbac.*`
- `angelcare360.audit.*`
- `angelcare360.conformite.*`

## Initial Permission Matrix

Legend:

- `L` = lecture
- `C` = création
- `M` = modification
- `S` = suppression
- `V` = validation / approbation
- `E` = export
- `A` = administration

| Role | Default matrix |
|---|---|
| Super Admin | `L C M S V E A` everywhere |
| Direction Générale | `L V E` on all operational modules, `A` on RBAC and compliance, limited mutating rights by approval |
| Direction d’Établissement | `L C M V E` on academic, people, finance summary, transport, documents |
| Administration | `L C M E` on admissions, students, parents, documents, reports |
| Réception | `L C M` on admissions intake, contacts, visitor logs, documents |
| Enseignant | `L C M V` on own classes for attendance, homework, marks, lesson plans, comments |
| Parent | `L E` on own children; `C M` only for profile/contact updates and justifications where allowed |
| Élève | `L E` on own dossier; `C` only for submissions / responses where allowed |
| Comptabilité | `L C M V E` on finance, accounting, receipts, relances, remises |
| RH / Paie | `L C M V E` on staff, leave, payroll, documents |
| Responsable Transport | `L C M V E` on routes, assignments, vehicle readiness |
| Bibliothécaire | `L C M V E` on library catalog and lending |
| Responsable Qualité | `L E A` on audit logs, reports, configuration checks |
| Support Technique | `L E A` on diagnostics, system health, access control, recovery tools |

## Critical Source Behavior To Preserve

- School scoping is mandatory.
- Approval actions must remain separated from creation actions.
- Teacher content publication should never be hardcoded as “already approved.”
- Parent and student access must remain child/self scoped.
- Finance and payroll require explicit audit trails.
- Settings and RBAC must be treated as security-sensitive mutations.

## Rebuild Guidance

- Keep permissions readable in French in the UI.
- Keep technical slugs stable and namespaced under `angelcare360`.
- Avoid copying the source's mixed role-group logic directly.
- Use one role engine, not three overlapping systems.

