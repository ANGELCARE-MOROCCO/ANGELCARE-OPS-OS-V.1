# ANGELCARE 360 Phase 1 File Change Plan

## Phase 1 Objective

Create the independent shell for `ANGELCARE 360 COMMAND CENTER` without touching unrelated product areas.

## Files to Create

### App route tree

- `app/(protected)/angelcare-360-command-center/layout.tsx`
- `app/(protected)/angelcare-360-command-center/page.tsx`
- `app/(protected)/angelcare-360-command-center/loading.tsx`
- `app/(protected)/angelcare-360-command-center/error.tsx`
- `app/(protected)/angelcare-360-command-center/not-found.tsx`
- `app/(protected)/angelcare-360-command-center/direction/page.tsx`

### Shell UI

- `components/angelcare360/layout/Angelcare360Shell.tsx`
- `components/angelcare360/layout/Angelcare360Sidebar.tsx`
- `components/angelcare360/layout/Angelcare360Header.tsx`
- `components/angelcare360/layout/Angelcare360Toolbar.tsx`
- `components/angelcare360/states/Angelcare360EmptyState.tsx`
- `components/angelcare360/states/Angelcare360LoadingState.tsx`
- `components/angelcare360/states/Angelcare360ErrorState.tsx`

### Registry and types

- `data/angelcare360/module-registry.ts`
- `data/angelcare360/navigation.ts`
- `types/angelcare360/module.ts`
- `types/angelcare360/permissions.ts`
- `types/angelcare360/ui.ts`

### Hooks / utilities

- `hooks/angelcare360/useAngelcare360Session.ts`
- `hooks/angelcare360/useAngelcare360Module.ts`
- `lib/angelcare360/permissions.ts`
- `lib/angelcare360/audit.ts`
- `lib/angelcare360/module-access.ts`
- `lib/angelcare360/route-guards.ts`
- `lib/angelcare360/constants.ts`

### Optional styling

- `styles/angelcare360/tokens.css`
- `styles/angelcare360/shell.css`

## Files Potentially Changed If Required By Routing

Only if the shell needs to register itself in existing shared control logic:

- `proxy.ts`
- `app/(protected)/layout.tsx`
- `permissions.ts`

These should only change if the new route must participate in existing global guards or navigation. The default preference is to keep them untouched in Phase 1.

## Phase 1 Content Boundaries

Phase 1 should include:

- the dedicated shell
- French navigation labels
- module registry
- a real cockpit direction page
- route-aware loading/error/empty states
- permission-aware disabled actions
- audit utility scaffolding

Phase 1 should not include:

- database migrations
- CRUD for all modules
- finance or academic business logic
- broad rewrites of existing product areas
- unrelated route cleanup

## Route / Layout Behavior

The first route should:

- render the command center landing page
- expose direction cockpit actions
- show the module registry
- respect the current authenticated user
- avoid dead buttons by disabling or wiring every action

## Phase 1 Readiness Checklist

- shell exists
- sidebar exists
- top bar exists
- module registry exists
- direction cockpit exists
- French copy exists
- explicit empty/loading/error states exist
- no unrelated app surface is disturbed

