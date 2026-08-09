# ANGELCARE 360 COMMAND CENTER - Phase 3 Administration Control Plane Report

## 1. Phase 3 Scope Confirmation

Phase 3 was limited to the Administration Control Plane inside the isolated product space:

- `/angelcare-360-command-center/administration`
- `/angelcare-360-command-center/administration/etablissements`
- `/angelcare-360-command-center/administration/annees-scolaires`
- `/angelcare-360-command-center/administration/periodes`
- `/angelcare-360-command-center/administration/classes`
- `/angelcare-360-command-center/administration/sections`
- `/angelcare-360-command-center/administration/matieres`
- `/angelcare-360-command-center/administration/affectations`
- `/angelcare-360-command-center/administration/roles-permissions`
- `/angelcare-360-command-center/administration/parametres`
- `/angelcare-360-command-center/administration/audit`

The old subtree `app/(protected)/angelcare-360` was not modified by this phase.

## 2. Files Created

### Administration routes and page scaffolding

- `app/(protected)/angelcare-360-command-center/administration/_mappers.ts`
- `app/(protected)/angelcare-360-command-center/administration/layout.tsx`
- `app/(protected)/angelcare-360-command-center/administration/loading.tsx`
- `app/(protected)/angelcare-360-command-center/administration/error.tsx`
- `app/(protected)/angelcare-360-command-center/administration/not-found.tsx`
- `app/(protected)/angelcare-360-command-center/administration/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/etablissements/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/annees-scolaires/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/periodes/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/classes/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/sections/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/matieres/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/affectations/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/roles-permissions/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/parametres/page.tsx`
- `app/(protected)/angelcare-360-command-center/administration/audit/page.tsx`

### API and server foundation

- `app/api/angelcare360/administration/route.ts`
- `lib/angelcare360/server/administration.ts`

### Administration UI components

- `components/angelcare360/administration/Angelcare360AdminPageShell.tsx`
- `components/angelcare360/administration/Angelcare360AdminToolbar.tsx`
- `components/angelcare360/administration/Angelcare360AdminTable.tsx`
- `components/angelcare360/administration/Angelcare360EntityDrawer.tsx`
- `components/angelcare360/administration/Angelcare360AdministrationChrome.tsx`
- `components/angelcare360/administration/Angelcare360AdministrationContextRow.tsx`
- `components/angelcare360/administration/Angelcare360SetupChecklistDrawer.tsx`
- `components/angelcare360/administration/Angelcare360AuditEventDrawer.tsx`
- `components/angelcare360/administration/Angelcare360PermissionMatrix.tsx`
- `components/angelcare360/administration/Angelcare360AdministrationHub.tsx`
- `components/angelcare360/administration/Angelcare360AdministrationEntityScreen.tsx`
- `components/angelcare360/administration/Angelcare360SchoolSettingsForm.tsx`
- `components/angelcare360/administration/Angelcare360AdminAuditExplorer.tsx`

### Shared registries / types

- `data/angelcare360/administration-navigation.ts`
- `types/angelcare360/administration.ts`

## 3. Files Modified

### Existing Phase 2 foundation files updated

- `lib/angelcare360/server/index.ts`
- `lib/angelcare360/server/queries.ts`
- `lib/angelcare360/server/context.ts`
- `lib/angelcare360/validation/index.ts`

### Existing UI helper updates

- `components/angelcare360/administration/Angelcare360AdministrationEntityScreen.tsx`
- `components/angelcare360/administration/Angelcare360AdminToolbar.tsx`
- `components/angelcare360/administration/Angelcare360PermissionMatrix.tsx`
- `components/angelcare360/administration/Angelcare360AdminPageShell.tsx`

### Existing workspace files already dirty before this phase

- `app/(protected)/angelcare-360/customer/[module]/page.tsx`
- `app/(protected)/angelcare-360/customer/finance-creances/`
- `components/ac360/customer/finance/`
- `scripts/verify-ac360-finance-route-force-hotfix.mjs`

Those files were not modified by the Phase 3 work.

## 4. Routes Added

Implemented routes:

- `/angelcare-360-command-center/administration`
- `/angelcare-360-command-center/administration/etablissements`
- `/angelcare-360-command-center/administration/annees-scolaires`
- `/angelcare-360-command-center/administration/periodes`
- `/angelcare-360-command-center/administration/classes`
- `/angelcare-360-command-center/administration/sections`
- `/angelcare-360-command-center/administration/matieres`
- `/angelcare-360-command-center/administration/affectations`
- `/angelcare-360-command-center/administration/roles-permissions`
- `/angelcare-360-command-center/administration/parametres`
- `/angelcare-360-command-center/administration/audit`

All of them render inside the ANGELCARE 360 COMMAND CENTER shell.

## 5. Components Added

New shared components:

- `Angelcare360AdminPageShell`
- `Angelcare360AdminToolbar`
- `Angelcare360AdminTable`
- `Angelcare360EntityDrawer`
- `Angelcare360AdministrationChrome`
- `Angelcare360AdministrationContextRow`
- `Angelcare360SetupChecklistDrawer`
- `Angelcare360AuditEventDrawer`
- `Angelcare360PermissionMatrix`
- `Angelcare360AdministrationHub`
- `Angelcare360AdministrationEntityScreen`
- `Angelcare360SchoolSettingsForm`
- `Angelcare360AdminAuditExplorer`

## 6. Server Helpers Added

New or expanded server helpers under `lib/angelcare360/server`:

- `getAngelcare360AdministrationOverview`
- `getAngelcare360SchoolSettings`
- `listAngelcare360Sections`
- `listAngelcare360Terms`
- `listAngelcare360Subjects`
- `listAngelcare360TeacherAssignments`
- `listAngelcare360AdminAuditEvents`
- `getAngelcare360AuditEventDetail`
- `getAngelcare360PermissionMatrix`
- `createAngelcare360School`
- `updateAngelcare360School`
- `changeAngelcare360SchoolStatus`
- `createAngelcare360AcademicYear`
- `updateAngelcare360AcademicYear`
- `setAngelcare360ActiveAcademicYear`
- `createAngelcare360Term`
- `updateAngelcare360Term`
- `createAngelcare360Class`
- `updateAngelcare360Class`
- `createAngelcare360Section`
- `updateAngelcare360Section`
- `createAngelcare360Subject`
- `updateAngelcare360Subject`
- `createAngelcare360TeacherAssignment`
- `updateAngelcare360TeacherAssignment`
- `updateAngelcare360SchoolSettings`
- `updateAngelcare360RolePermissions`
- `getAngelcare360AdministrationRolesAndPermissions`
- `getAngelcare360AdministrationContext`

## 7. API Routes Added

One generic secure mutation route was added:

- `POST /api/angelcare360/administration`

It supports validated mutations for:

- établissements
- années scolaires
- périodes
- classes
- sections
- matières
- affectations enseignants
- paramètres établissement
- rôles & permissions

All mutation paths perform server-side permission checks and audit logging.

## 8. Tables Used

The Phase 3 control plane reads and writes against the Phase 2 Supabase foundation tables:

- `angelcare360_schools`
- `angelcare360_school_settings`
- `angelcare360_academic_years`
- `angelcare360_terms`
- `angelcare360_classes`
- `angelcare360_sections`
- `angelcare360_subjects`
- `angelcare360_class_subjects`
- `angelcare360_staff`
- `angelcare360_teacher_assignments`
- `angelcare360_roles`
- `angelcare360_permissions`
- `angelcare360_role_permissions`
- `angelcare360_user_roles`
- `angelcare360_audit_logs`

## 9. Validation Schemas Used / Created

The Phase 3 admin mutation layer reuses and extends the Phase 2 validation framework in `lib/angelcare360/validation/index.ts`.

Admin-specific schemas used:

- `angelcare360SchoolAdminSchema`
- `angelcare360AcademicYearAdminSchema`
- `angelcare360TermAdminSchema`
- `angelcare360ClassAdminSchema`
- `angelcare360SectionAdminSchema`
- `angelcare360SubjectAdminSchema`
- `angelcare360TeacherAssignmentAdminSchema`
- `angelcare360SchoolSettingsSchema`
- `angelcare360RolePermissionsSchema`
- `angelcare360AuditFilterSchema`

Validation helpers added in the same file:

- optional boolean parsing for string values
- optional string array parsing
- date-order validation helper

## 10. Permission Keys Enforced

Enforced in route guards, server helpers, and UI gating:

- `parametres.view`
- `parametres.create`
- `parametres.update`
- `annees_scolaires.view`
- `annees_scolaires.create`
- `annees_scolaires.update`
- `classes.view`
- `classes.create`
- `classes.update`
- `matieres.view`
- `matieres.create`
- `matieres.update`
- `enseignants.view`
- `enseignants.assign`
- `securite.view`
- `securite.configure`
- `audit.view`

Super Admin bypass is still respected in the access profile.

## 11. Audit Events Implemented

Critical mutation events now write to `angelcare360_audit_logs` through the server audit helper.

Implemented event families:

- `school.created`
- `school.updated`
- `school.status_changed`
- `academic_year.created`
- `academic_year.updated`
- `academic_year.activated`
- `term.created`
- `term.updated`
- `class.created`
- `class.updated`
- `section.created`
- `section.updated`
- `subject.created`
- `subject.updated`
- `teacher_assignment.created`
- `teacher_assignment.updated`
- `school_settings.updated`
- `role_permissions.updated`

Severity usage:

- `info` for normal configuration updates
- `warning` for status/activation changes
- `critical` for RBAC changes

## 12. Data Sources Used

Phase 3 uses the Phase 2 server-side access context and query helpers instead of mock arrays.

Primary data sources:

- `getAngelcare360AdministrationContext`
- `getAngelcare360AdministrationOverview`
- `listAngelcare360Schools`
- `listAngelcare360AcademicYears`
- `listAngelcare360Terms`
- `listAngelcare360Classes`
- `listAngelcare360Sections`
- `listAngelcare360Subjects`
- `listAngelcare360Staff`
- `listAngelcare360TeacherAssignments`
- `getAngelcare360AdministrationRolesAndPermissions`
- `getAngelcare360SchoolSettings`
- `listAngelcare360AdminAuditEvents`

## 13. Buttons / Actions Implemented

Implemented real actions:

- create / edit drawers for schools, years, periods, classes, sections, subjects, and teacher assignments
- save settings form
- RBAC matrix save
- audit row detail drawer
- setup checklist drawer
- hub refresh
- filter reset / refresh in admin toolbars
- row action status changes where safe

## 14. Disabled Actions and Why

Disabled controls intentionally shown to the user:

- audit export button
  - disabled because PDF/export hardening was intentionally deferred to a later phase
- permission-matrix mutation controls
  - disabled when the role is locked or the user lacks `securite.configure`
- create/update controls on entity pages
  - disabled when the current access profile lacks the required permission
  - disabled when no active academic year exists for year-scoped records

Each disabled control includes a French explanation.

## 15. Security Decisions

Security model used in Phase 3:

- all writes happen server-side through the API route or server helper
- every mutation validates input on the server
- every mutation checks AngelCare 360 permissions before writing
- every critical mutation writes an audit event
- protected system roles in RBAC are not editable
- audit export remains disabled until the compliance/export phase
- no client-side direct database writes were added
- no anonymous mutation path was added

## 16. Server / Client Boundary Decisions

The following pattern was used:

- server components fetch initial data
- client components manage drawers, forms, tables, and local filter state
- mutations are executed through `POST /api/angelcare360/administration`
- the shared page shell was made client-safe because it is reused by client-driven admin workspaces

This keeps the command center interactive without leaking database logic into the browser.

## 17. Build Commands Run

Commands available in this repo:

- `npm run build`

Scripts not present in `package.json`:

- `npm run lint`
- `npm run typecheck`
- `npm test`

## 18. Build Result

Status during this phase:

- multiple `npm run build` attempts were executed
- the build repeatedly reached the Next.js production compile stage
- several TypeScript issues were fixed during the process
- the final build attempt was interrupted by the user before completion, so there is no final completed pass to claim in this report

Fixed during the build loop:

- admin mapper typing in `affectations/page.tsx`
- audit table row typing in `Angelcare360AdminAuditExplorer`
- missing RBAC style constant in `Angelcare360PermissionMatrix`
- missing term schema import in `lib/angelcare360/server/administration.ts`
- access-context relation typing in `lib/angelcare360/server/context.ts`

## 19. Existing App Impact

The existing application remained stable and isolated:

- the ANGELCARE 360 COMMAND CENTER stayed under its own route tree
- the old `app/(protected)/angelcare-360` subtree was not touched by the Phase 3 implementation
- the pre-existing user work in `app/(protected)/angelcare-360/customer/[module]/page.tsx` was left intact
- unrelated modules were not rewritten as part of this phase

## 20. Confirmation: `app/(protected)/angelcare-360` Was Not Touched

Confirmed.

No Phase 3 edits were made inside `app/(protected)/angelcare-360`.

The only diff in that subtree is pre-existing workspace content from before this phase.

## 21. Confirmation: Unrelated Product Areas Were Not Touched

Confirmed.

No Phase 3 work was made in:

- marketplace
- OPSOS
- finance product areas outside the isolated command-center integration
- HR modules
- public landing pages
- customer modules outside the pre-existing workspace changes

## 22. Known Limitations

- the final `npm run build` attempt was interrupted by the user before it completed
- Phase 3 does not implement student, parent, attendance, finance, academics, library, transport, inventory, or messaging workflows yet
- audit export remains intentionally disabled
- role-permission mutation is limited to the safe matrix flow already encoded in the server helper

## 23. Risks Before Production

- the build verification should be rerun to completion in a quiet environment
- RBAC mutation should be reviewed against the exact production policy before allowing broader admin staff to edit role matrices
- the admin API route is intentionally generic; future phases should split domain-specific mutations if the surface grows
- some setup fields are stored in metadata-backed columns where the legacy schema did not expose first-class columns

## 24. Exact Recommended Phase 4 Prompt

Proceed with Phase 4 only after rerunning and completing the build verification.

Recommended Phase 4 scope:

- Élèves
- Parents
- Personnel
- Admissions foundations
- document attachments for core people records
- school-linked dossier views
- parent-child linkage screens

Keep Phase 4 isolated inside the ANGELCARE 360 COMMAND CENTER namespace and continue to avoid the old `app/(protected)/angelcare-360` subtree.
