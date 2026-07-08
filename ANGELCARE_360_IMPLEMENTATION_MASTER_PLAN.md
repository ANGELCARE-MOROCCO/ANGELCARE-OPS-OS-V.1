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

## Phase 6 - Daily School Operations

Objective:

- Daily school execution and attendance workflows.

Scope:

- présences
- absences
- retards
- justifications
- emploi du temps
- calendrier scolaire

Acceptance criteria:

- daily and monthly views exist
- justification flow exists
- schedule views are functional
- attendance mutations are audited

## Phase 7 - Academics & Evaluation

Objective:

- Academic production, assessment, averages, and bulletin workflows.

Scope:

- cours
- devoirs
- soumissions
- examens
- sessions d’examens
- notes
- moyennes
- bulletins
- appréciations
- audit académique

Acceptance criteria:

- academic route tree exists
- server-backed lesson, assignment, exam, mark, average, and bulletin actions exist
- status workflows are explicit and permission-aware
- PDF/export readiness is locked unless a real export stack exists
- audit events are written for critical academic mutations

## Phase 8 - Finance & Paiements

Objective:

- Billing, receivables, payments, receipts, discounts, reminders, and balances.

Scope:

- frais
- factures
- paiements
- reçus
- remises
- relances
- soldes élèves
- états de compte
- dépenses financières

Acceptance criteria:

- invoicing and payment flows are functional
- invoice totals and balances are computed server-side
- receipts are only available for confirmed payments
- discounts and reminders are permission-aware
- finance actions are audited
- PDF/export and online payment remain locked unless real infrastructure exists

## Phase 9 - Payroll Control Plane

Objective:

- Controlled staff payroll preparation, validation, and compensation tracking.

Scope:

- périodes de paie
- dossiers de paie
- éléments de paie
- primes
- retenues
- avances
- ajustements
- remboursements
- validation
- paiements internes
- historique personnel
- conformité verrouillée
- audit paie

Acceptance criteria:

- payroll route tree exists under the command center shell
- server-backed payroll period, record, item, validation, payment, compliance, and audit actions exist
- gross/net readiness is explicit or locked when rules are not safe
- payslip PDF, bank transfer, and compliance automation remain disabled unless real infrastructure exists
- permissions are enforced
- audit events are written for critical payroll mutations

## Phase 10 - Transport & Sécurité

Objective:

- Controlled transport planning, assignment, pickup/drop-off, capacity safety, and audit readiness.

Scope:

- circuits de transport
- arrêts
- véhicules
- affectations élèves
- ramassage
- dépôt
- sécurité transport
- incidents locked unless a real schema exists
- notifications parents locked unless real messaging exists
- GPS and live tracking locked unless a real provider exists
- audit transport

Acceptance criteria:

- transport route tree exists under the command center shell
- server-backed transport route, stop, vehicle, assignment, safety, notification, and audit actions exist
- capacity and emergency-contact readiness are explicit
- GPS, live tracking, and parent notifications remain disabled unless real infrastructure exists
- permissions are enforced
- audit events are written for critical transport mutations

## Phase 11 - Production Hardening

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

## Phase 11 Library / Inventory Operating Engine Note

- Phase 11 delivered the isolated `Bibliothèque & Inventaire` control plane under `app/(protected)/angelcare-360-command-center/bibliotheque` and `app/(protected)/angelcare-360-command-center/inventaire`.
- Added French route trees, server-backed mutation helpers, API routes, validation schemas, audit exploration, and an additive migration for the library / inventory namespace.
- Updated the AngelCare 360 module registry so `bibliotheque` and `inventaire` now resolve to active command-center routes.
- TypeScript / static verification was run with `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` and passed.
- Full production build was intentionally not run by Codex, per the phase restriction.
- `app/(protected)/angelcare-360` remained untouched.

## Phase 12 - Communication, Notifications & Réclamations

Objective:

- Deliver the controlled communication, notification-readiness, and claims/tickets control plane.

Scope:

- messagerie
- conversations
- messages internes
- annonces
- modèles de message
- audiences
- notifications internes
- canaux verrouillés
- réclamations / tickets
- assignations
- priorités
- résolution auditable
- audit communication / notifications / réclamations

Acceptance criteria:

- isolated French route trees exist under the AngelCare 360 command center shell
- server-backed communication, notification, and claim helpers exist
- API routes handle real mutations and audit critical changes
- internal delivery persists server-side
- external messaging channels remain locked unless real infrastructure exists
- ticket resolution requires a summary
- permissions are enforced and audit events are written
- `app/(protected)/angelcare-360` remains untouched
- unrelated product areas remain untouched
- TypeScript / static verification passes without running the production build

## Phase 13 Reports / Exports / Documents Note

Objective:

- Deliver the isolated reporting, export-readiness, PDF/A4-readiness, CSV/XLSX-readiness, and document governance control plane.

Scope:

- rapports
- catalogue de rapports
- modèles de rapports
- demandes de rapports
- historique rapports
- exports readiness
- PDF A4 readiness
- CSV/XLSX readiness
- documents générés readiness
- templates documentaires
- gouvernance documentaire
- audit rapports
- audit exports
- audit documents

Acceptance criteria:

- isolated French route trees exist under the AngelCare 360 command center shell
- server-backed reporting, export, and document helpers exist
- API routes handle real mutations and audit critical changes
- export and document generation remain locked unless real infrastructure exists
- no fake PDF, CSV, XLSX, download, or generated document claims are exposed
- permissions are enforced and audit events are written
- `app/(protected)/angelcare-360` remains untouched
- unrelated product areas remain untouched
- TypeScript / static verification passes without running the production build
