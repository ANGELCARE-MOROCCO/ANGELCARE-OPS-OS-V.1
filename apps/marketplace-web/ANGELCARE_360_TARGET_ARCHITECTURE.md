# ANGELCARE 360 Target Architecture

## Product Boundary

ANGELCARE 360 COMMAND CENTER must live as an independent product space inside the existing Next.js app.

### Required surface

- Primary route: `/angelcare-360-command-center`
- Internal namespace: `angelcare360`
- Language: French only
- UX: enterprise white command center, no dark theme
- Isolation: no reuse of unrelated dashboards as the actual product shell

## Proposed Route Tree

Recommended structure:

```text
app/(protected)/angelcare-360-command-center
  page.tsx
  layout.tsx
  loading.tsx
  error.tsx
  not-found.tsx
  direction/page.tsx
  admissions/page.tsx
  eleves/page.tsx
  parents/page.tsx
  enseignants/page.tsx
  personnel/page.tsx
  classes-sections/page.tsx
  matieres/page.tsx
  annees-scolaires/page.tsx
  presences/page.tsx
  retards-absences/page.tsx
  justifications/page.tsx
  emploi-du-temps/page.tsx
  calendrier-scolaire/page.tsx
  devoirs/page.tsx
  cours-contenus/page.tsx
  examens/page.tsx
  notes/page.tsx
  moyennes/page.tsx
  bulletins/page.tsx
  appreciations/page.tsx
  frais-scolarite/page.tsx
  factures/page.tsx
  paiements/page.tsx
  recus/page.tsx
  relances/page.tsx
  remises/page.tsx
  comptabilite/page.tsx
  depenses/page.tsx
  paie/page.tsx
  transport/page.tsx
  bibliotheque/page.tsx
  inventaire/page.tsx
  messagerie/page.tsx
  notifications/page.tsx
  annonces/page.tsx
  reclamations/page.tsx
  documents/page.tsx
  exports-pdf/page.tsx
  rapports/page.tsx
  parametres/page.tsx
  roles-permissions/page.tsx
  audit-securite/page.tsx
  preparation-conformite/page.tsx
  multi-etablissement/page.tsx
```

## Recommended Supporting Folders

```text
components/angelcare360
lib/angelcare360
hooks/angelcare360
types/angelcare360
data/angelcare360
server/angelcare360
app/api/angelcare360
styles/angelcare360
```

## Architectural Principles

### 1. Single product shell

The product should render through a dedicated shell with:

- a French sidebar
- a module registry
- module-level breadcrumbs
- a top command bar
- permission-aware actions
- loading / empty / error states

### 2. Route-driven module registry

All modules should be declared in a single AngelCare 360 registry object so navigation, access rules, titles, icons, and statuses are centralized.

### 3. Data-access isolation

All AngelCare 360 data access must live in `lib/angelcare360` or `server/angelcare360`.

### 4. Action discipline

Every mutation must have:

- auth check
- permission check
- validation
- error handling
- audit log entry

### 5. French-first UX

All labels, empty states, errors, CTA copy, and help text should be written in French.

### 6. No pollution of existing modules

The current app’s OPSOS, Revenue, TrainingHub, Email OS, Market OS, and CareLink spaces must remain structurally separate.

## Shell Responsibilities

The AngelCare 360 shell should own:

- global sidebar
- top-level route group navigation
- French design tokens
- module headers
- module badges / readiness state
- contextual actions
- cross-module quick search
- audit status indicator

## Data Flow

Recommended data flow:

1. Route loads in `app/(protected)/angelcare-360-command-center`
2. Shell resolves the current user and permission scope
3. Module registry determines available sections
4. Server-side data loaders fetch scoped data
5. Components render with explicit loading / empty / error states
6. Mutations call `app/api/angelcare360/*` or server actions
7. Audit log is written for every critical change

## Permission Strategy

Use a dedicated AngelCare 360 permission namespace.

Possible examples:

- `angelcare360.direction.view`
- `angelcare360.admissions.manage`
- `angelcare360.students.manage`
- `angelcare360.finance.manage`
- `angelcare360.audit.view`
- `angelcare360.settings.manage`

Do not reuse unrelated product permissions unless there is a deliberate shared system rule.

## Design System Direction

The UI should feel like a school operations command center:

- white surfaces
- subtle borders
- restrained blue / slate accents
- strong typography hierarchy
- compact density for admin work
- operational callouts instead of decorative charts

## Compatibility With Existing App

The existing app already uses:

- `app/(protected)/layout.tsx`
- `proxy.ts`
- Supabase session handling
- protected route shell components

The new module should plug into that environment rather than replacing it.

## Independence Rule

The new product must not be implemented as:

- a banner on top of an existing dashboard
- a fake “preview” page
- a decorative route with no data contract

It must be a real operational space with its own registry, state, and module routes.

