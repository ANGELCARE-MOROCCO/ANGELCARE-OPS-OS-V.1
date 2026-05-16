# Revenue Command Center Canonicalization Policy

This file defines the consolidation rule:

## Rule 1 — One canonical component per route
No route should import old v10/v11/v12/max/final variants directly.

## Rule 2 — Supabase is source of truth
Browser storage is allowed only for:
- temporary UI state
- recovery import screens
- emergency fallback clearly marked as fallback

## Rule 3 — No automatic fake seed actions
The app must not create default fake tasks, appointments, comments, documents, or prospects on render.

## Rule 4 — No competing final workspaces
Files named `Final`, `Max`, `V10`, `V11`, `V12`, `Mega` may remain archived but must not be imported by production routes unless listed in `canonical-modules.ts`.

## Rule 5 — All actions go through the engine
Tasks, appointments, comments, documents and events must use:
- `revenue-action-engine.ts`
- `production-prospect-store.ts`
- Supabase tables

## Rule 6 — Realtime replaces polling
`setInterval` is acceptable only for:
- temporary fallback
- explicit retry
- noncritical UI refresh
Production sync should use Supabase realtime subscriptions.
