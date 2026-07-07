# ANGELCARE 360 Implementation Master Plan

## Phase 0

Status: complete

Deliverables:

- Laravel source audit
- repo audit
- route map
- database map
- feature map
- role/permission map
- target architecture
- rebuild plan
- phase file plan

## Phase 1 - Independent Product Shell

Objective:

- Create the isolated AngelCare 360 command-center shell and navigation system.

Acceptance criteria:

- primary route resolves at `/angelcare-360-command-center`
- layout and sidebar are dedicated to AngelCare 360
- module registry drives navigation
- French loading / empty / error states exist
- shell is readable on mobile and desktop
- no unrelated product module is rewritten

## Phase 2 - Database Foundation

Objective:

- Build the AngelCare 360 data model and access layer.

Acceptance criteria:

- namespaced schema/migrations or Supabase SQL are created
- seed/demo data exists for core entities
- RBAC tables and audit logs persist
- validation and repository helpers exist
- build still passes

## Phase 3 - Admin Structure

Objective:

- Implement the school administrative core.

Scope:

- établissements
- années scolaires
- classes
- sections
- matières
- paramètres
- rôles et permissions

Acceptance criteria:

- CRUD and list/filter flows exist
- mutations are permission-aware
- audit trails are written
- empty and error states are explicit

## Phase 4 - Core People

Objective:

- Implement student, parent, teacher, and staff dossiers.

Scope:

- élèves
- parents
- enseignants
- personnel
- admissions
- documents

Acceptance criteria:

- dossier pages exist for each entity
- relation views are functional
- document handling is wired
- status lifecycle is tracked

## Phase 5 - Operations

Objective:

- Attendance and calendar operations.

Scope:

- présences
- retards
- absences
- justifications
- emploi du temps
- calendrier scolaire

Acceptance criteria:

- daily and monthly views exist
- justification flow exists
- schedule views are functional
- attendance mutations are audited

## Phase 6 - Academics

Objective:

- Academic production workflows.

Scope:

- devoirs
- cours
- examens
- notes
- moyennes
- bulletins
- appréciations
- PDF readiness

Acceptance criteria:

- teacher and admin academic views exist
- submission and grading flows are real
- report-card/export readiness exists
- approval or review states are explicit where needed

## Phase 7 - Finance

Objective:

- Billing and finance workflows.

Scope:

- frais
- factures
- paiements
- reçus
- remises
- relances
- comptabilité
- paie

Acceptance criteria:

- invoicing and payment flows are functional
- balances and reminders are visible
- finance actions are audited
- export/report endpoints exist

## Phase 8 - Extended Modules

Objective:

- Operational extensions and communication.

Scope:

- transport
- bibliothèque
- inventaire
- messagerie
- notifications
- annonces
- réclamations
- rapports

Acceptance criteria:

- each module has a real data contract
- module actions are not dead buttons
- permissions are enforced
- reporting/export surfaces exist

## Phase 9 - Production Hardening

Objective:

- Verify security, reliability, and deployment readiness.

Scope:

- authorization verification
- validation verification
- audit completeness
- error handling
- rate limits where relevant
- build/typecheck/lint/tests
- Vercel readiness
- documentation

Acceptance criteria:

- build passes
- typecheck passes or known exceptions are documented
- lint passes or known exceptions are documented
- tests pass or the absence of tests is documented
- no critical mutation lacks audit logging
- route and permission review is complete

## Verification Commands

Current repo reality:

- `npm run build` exists
- `npm run lint` does not exist as a script
- `npm run typecheck` does not exist as a script
- `npm test` does not exist as a script

Recommended checks during later phases:

- `npm run build`
- `npx eslint .`
- `npx tsc --noEmit`
- any available targeted test runner for the feature area

## Exit Rule For Each Phase

Do not move to the next phase until:

- the phase scope is implemented
- the phase has an explicit acceptance check
- the user has reviewed the phase summary if approval is required
- regressions in existing modules are called out

## Phase 2 Completion Note

- Completed on 2026-07-06.
- Delivered the ANGELCARE 360 COMMAND CENTER database / RBAC / security / domain backbone in the isolated `angelcare360_` namespace.
- Added Supabase migrations, demo seed data, strict server-side helpers, validation schemas, audit persistence, and AngelCare 360 domain types.
- Kept `app/(protected)/angelcare-360` isolated and untouched by the Phase 2 implementation.
- Build validation was attempted with `npm run build`, but the Next.js build did not complete in this environment before being stopped to avoid a stale worker lock.

## Phase 3 Administration Control Plane Note

- Phase 3 implemented the isolated administration control plane under `app/(protected)/angelcare-360-command-center/administration`.
- Added real French admin routes for établissements, années scolaires, périodes, classes, sections, matières, affectations enseignants, rôles & permissions, paramètres, and audit.
- Added a generic authenticated mutation route at `POST /api/angelcare360/administration` plus server-side permission, validation, and audit wiring.
- The latest `npm run build` run reached the production compile stage and then encountered TypeScript checks that were fixed during the phase; the final rerun was interrupted by the user before completion, so the last build result is incomplete and should be rerun to completion before Phase 4.

## Phase 5 Admissions / Conversion Engine Note

- Phase 5 implemented the isolated `Admissions & Inscriptions` operating layer under `app/(protected)/angelcare-360-command-center/admissions`.
- Added the admissions cockpit, pipeline, demandes, dossiers, documents, entretiens / suivis, conversions, and audit routes with French premium enterprise UI.
- Added the admissions mutation API at `POST /api/angelcare360/admissions`, plus server-side validation, duplicate detection, capacity checks, and critical audit logging.
- The admissions conversion path now creates or reuses `Élève`, `Parent`, `Lien parent/enfant`, and `Inscription de classe` records safely when conversion prerequisites are satisfied.
- `npm run build` was launched for validation, but the build remained on the optimized production build step for an extended time and was stopped with exit code `130` to avoid leaving a hanging process in this environment.
