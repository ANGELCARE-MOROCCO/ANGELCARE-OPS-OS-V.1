# ANGELCARE MARKET-OS — CONTENT COMMAND CENTER 360
## Mega ZIP 1 — Sovereign Shell, Official Brand Ownership & Smart Retractable Navigation

**Execution status:** Implemented and statically accepted
**Source baseline:** Uploaded Content Command Center UI/UX source bundle
**Source repository recorded by manifest:** `/Users/user/Desktop/angelcare-platform`
**Source branch recorded by manifest:** `main`
**Scope:** Front-end shell, navigation, brand ownership, responsive containment and shell-level interaction only

---

## 1. Executive result

Mega ZIP 1 replaces the former top-heavy command header and horizontally scrolling 12-link navigation ribbon with a sovereign AngelCare operating shell.

The completed foundation now provides:

- Official AngelCare logo enforcement through `AngelCareLogo` and `/public/logo.png`.
- Permanent AngelCare / SANILA Market OS / Content Command Headquarters ownership hierarchy.
- Seven corporate navigation divisions.
- Thirty-eight permanent route entries mapped to real protected pages.
- Six dynamic record routes handled contextually rather than exposed as fake menu links.
- Expanded, compact, focus-hidden and mobile drawer navigation states.
- Persistent sidebar mode, expanded groups, favorites, recent routes, density and experience mode.
- Route-aware parent activation and breadcrumbs.
- Global command palette with keyboard operation.
- Search across workspaces and existing local Content Command records, with explicit provenance.
- Shell actions for navigation, density and experience modes.
- Neutral, truthful authenticated-session presentation without fabricating a person, role or permission.
- Notification, contextual-help and creation surfaces that do not fabricate operational data.
- Focus trapping and focus restoration in the mobile drawer and command palette.
- Premium white/icy-blue enterprise visual language with controlled navy and AngelCare red.
- Full-width operating canvas preserving all existing workspace interiors.
- No API, database, migration or business-logic architecture changes.

---

## 2. Source baseline confirmed

The uploaded source manifest records:

- 429 selected source files.
- 44 protected Content Command routes.
- 76 related API route handlers.
- 272 Market-OS component files.
- Five style files.

Mega ZIP 1 deliberately operates at the shell level and does not redesign the individual workspace interiors reserved for later contracts.

---

## 3. Modified source files

### `components/market-os/content-command/ContentCommand360Shell.tsx`

Rebuilt as the sovereign shell orchestrator.

Implemented:

- Sidebar state orchestration.
- Experience mode state.
- Density state.
- Mobile drawer state.
- Favorites and recent-route state.
- Defensive local preference persistence.
- Current-route tracking.
- Search-index construction.
- Command-palette actions.
- Keyboard launch with `⌘ K`, `Ctrl K` and `/` outside text fields.
- Shell-level trust and ownership rail.
- Preservation of existing child route content.

### `components/market-os/content-command/content-command-navigation.tsx`

Replaced the flat 12-link client navigation with a canonical typed registry.

Implemented:

- Seven navigation-group definitions.
- Thirty-eight permanent protected-route definitions.
- Six contextual dynamic-route definitions.
- Human-readable French labels and descriptions.
- Search keywords.
- Permission metadata.
- Counter metadata hooks.
- Legacy-route metadata.
- Exact and nested active-route resolution.
- Static-route guard preventing dynamic matcher collisions.
- Route-group and parent-resolution helpers.

### `components/brand/AngelCareLogo.tsx`

Preserved the official `/logo.png` source and added:

- Official ownership data marker.
- French official-logo alt text.
- Optional `priority` control without breaking existing callers.
- SANILA naming in the optional text lockup.

The official logo binary remains unchanged. Its SHA-256 is:

`4f505544243d940b9295d246e4c33fe46b39f51c38492a94cca0536c176c8a3e`

---

## 4. New shell modules

### `shell/ContentCommandSidebar.tsx`

Provides:

- Official brand crown.
- Active mandate indicator.
- Seven corporate divisions.
- Collapsible groups.
- Active route and contextual parent indication.
- Favorites.
- Recent routes.
- Expanded and compact states.
- Focus-hidden transition.
- Responsive mobile drawer.
- Mobile body-scroll lock.
- Escape handling.
- Mobile focus trapping and restoration.
- Controlled legacy presentation.
- Environment status footer.

### `shell/ContentCommandTopbar.tsx`

Provides:

- Mobile and focus-mode menu restoration.
- Route-specific icon and identity.
- Route-aware breadcrumbs.
- Search trigger.
- Experience-mode selector.
- Density selector.
- Governed creation menu.
- Notification surface with truthful empty state.
- Contextual workspace help.
- Neutral authenticated-session and authority surface.

### `shell/ContentCommandCommandPalette.tsx`

Provides:

- Dialog semantics.
- Searchbox semantics.
- Grouped result metadata.
- Result provenance.
- Arrow-key navigation.
- Enter selection.
- Escape close.
- Tab focus trapping.
- Focus restoration.
- Full-screen mobile behavior.

### `shell/content-command-shell-storage.ts`

Provides:

- Namespaced AngelCare shell storage keys.
- Defensive parsing.
- Valid-value checking.
- Safe fallback defaults.
- Favorite and recent-route limits.

### `shell/content-command-shell-types.ts`

Provides canonical shell state types.

### `shell/content-command-shell.module.css`

Provides the complete scoped visual system for:

- Shell layout.
- Sidebar states.
- Brand crown.
- Navigation groups.
- Active-route states.
- Favorites and recents.
- Top command bar.
- Popovers.
- Mobile drawer.
- Focus restore rail.
- Command palette.
- Density modes.
- Experience modes.
- Desktop, laptop, tablet and mobile adaptation.
- Reduced-motion support.
- Focus visibility.

The module currently resolves **95 referenced classes with zero missing references**.

---

## 5. Canonical navigation result

### Commandement

- Commandement 360.

Dynamic dossiers are handled contextually through `/dossiers/[id]` and never linked with a fake ID.

### Intelligence & stratégie

- Observatoire.
- Fabrique stratégique.
- Briefing Suite.
- Planning éditorial.

### Production & exécution

- Mission Control.
- Task Command.
- Exécution active.
- Studios de création.
- Création rapide.
- Evidence Lab.

### Bibliothèque & gouvernance

- Content Atlas.
- Asset Library.
- Active Assets.
- Brand Governance.
- Source Vault.

### Validation & diffusion

- Review Workspace.
- Validation Chamber.
- Distribution Tower.
- Publishing Operations.

### AI Director

- AI Director Foundry.
- Commandement IA.
- Commands 3000.
- Skills.
- Schedules.
- Missions IA.
- Runs.
- Decision Center.
- Learning.
- Doctrine.
- Autopilot.
- Compiler.
- Live Queue.
- Propagation.
- Repository.
- Recovery.
- Configuration IA.

### Administration & migration

- Migration & compatibilité.

The old “Opérations existantes” label is retired in favor of a controlled migration identity.

---

## 6. Dynamic route treatment

The following routes are not permanent menu links:

- `/[id]`.
- `/[id]/edit`.
- `/[id]/delete`.
- `/dossiers/[id]`.
- `/tasks/[taskId]`.
- `/tasks/[taskId]/edit`.

They are represented through contextual labels and parent workspaces.

A static-route guard was added so pages such as `/signals`, `/ai-director` and `/tasks/execution` cannot be misclassified as dynamic record IDs.

---

## 7. Persistence contract

The shell uses the following namespaced storage family:

`angelcare:sanila:market-os:content-command:shell:*`

Persisted preferences:

- Sidebar state.
- Expanded groups.
- Favorites.
- Recent routes.
- Density.
- Experience mode.

Parsing is defensive. Invalid or inaccessible browser storage cannot prevent route operation.

---

## 8. Brand and ownership enforcement

The expanded sidebar visibly communicates:

- Official AngelCare identity.
- SANILA Market OS family.
- Content Command department.
- Headquarters status.
- Current active mandate.
- Protected-environment state.

Compact mode preserves the official mark rather than replacing it with initials or a generic icon.

Mobile mode preserves the same official ownership hierarchy.

---

## 9. Accessibility implementation

Implemented provisions include:

- Semantic primary navigation.
- `aria-current` on active routes.
- `aria-expanded` and `aria-controls` for navigation groups.
- Dialog and modal semantics for mobile navigation and command palette.
- Focus trapping in modal surfaces.
- Focus restoration after modal closure.
- Escape handling.
- Arrow navigation in the command palette.
- Visible focus rings.
- Accessible icon-only labels.
- Keyboard-accessible compact mode.
- Reduced-motion support.
- Status meanings not dependent exclusively on color.

---

## 10. Responsive implementation

The shell includes dedicated behavior for:

- Wide desktop.
- Standard desktop.
- Laptop.
- Tablet.
- Mobile.
- Narrow mobile.

Key behavior:

- Expanded sidebar on wide displays.
- Automatically space-efficient compact visual treatment on intermediate desktop widths.
- Overlay drawer below the mobile breakpoint.
- Full-width route canvas on mobile.
- Progressive topbar action reduction.
- Full-screen mobile command palette.
- No return of the old horizontal route ribbon.

---

## 11. Data truth and authority

Mega ZIP 1 does not fabricate:

- Employee names.
- Employee roles.
- Permission scopes.
- Notification counts.
- Operational alerts.
- Backend health values.

The user surface explicitly states that identity and authority are resolved by the platform authentication layer.

The shell’s route permission metadata is presentation-ready, but existing server-side protection remains authoritative.

---

## 12. Verification results

### Passed source syntax gate

Eight changed TypeScript/TSX source modules passed isolated TypeScript transpilation with zero syntax diagnostics.

### Passed strict targeted type gate

The changed shell modules passed a strict targeted TypeScript gate using local dependency declarations because the uploaded source bundle did not contain `node_modules` and package installation was unavailable in the execution environment.

A real project-native configuration is included:

`tsconfig.market-os-content-command-mz1.json`

Run it inside the actual repository where dependencies are installed:

```bash
npx tsc \
  -p tsconfig.market-os-content-command-mz1.json \
  --noEmit \
  --pretty false
```

No full production build was run.

### Passed automated contract checks

- 38 permanent routes classified.
- 6 dynamic routes contextualized.
- No duplicate route keys.
- No dead `#` links.
- Official logo hash preserved.
- Sovereign shell mounted by protected layout.
- Old horizontal navigation no longer mounted.
- 38 permanent navigation targets resolve to real `page.tsx` files.
- 95 CSS-module references resolve.
- Accessibility contract present.
- No MZ1 API, backend or database architecture introduced.

---

## 13. Verification commands

From `apps/ops-web`:

```bash
node scripts/verify-content-command-mz1-route-registry.mjs
node scripts/verify-content-command-mz1-logo-integrity.mjs
node scripts/verify-content-command-mz1-shell-coverage.mjs
node scripts/verify-content-command-mz1-navigation-links.mjs
node scripts/verify-content-command-mz1-css-references.mjs
node scripts/verify-content-command-mz1-accessibility-contract.mjs
node scripts/verify-content-command-mz1-scope-boundaries.mjs
npx tsc -p tsconfig.market-os-content-command-mz1.json --noEmit --pretty false
```

Do not run `npm run build` unless separately authorized.

---

## 14. Scope boundaries confirmed

Mega ZIP 1 did not modify:

- Content Command API handlers.
- Marketing AI API handlers.
- Supabase migrations.
- Database schema.
- Database RLS.
- Existing route names.
- Existing business workflows.
- Existing content records.
- Existing task records.
- Existing asset records.
- Existing publication records.

The package creates the permanent sovereign frame while preserving route interiors for individual redesign in later Mega ZIP contracts.

---

## 15. Remaining work intentionally reserved

The following are not defects in Mega ZIP 1; they belong to later signed contracts:

- Full interior redesign of Commandement 360.
- Full Dossier 360 case-room redesign.
- Route-specific live counters.
- Real notification hydration.
- Real authenticated user profile and role rendering when the platform exposes it to the shell.
- Route-specific primary-action registration.
- Individual lifecycle visual redesign of all root workspaces.
- Final browser-based visual acceptance in the running full repository.

---

## 16. Final acceptance statement

Mega ZIP 1 establishes the permanent AngelCare Content Command operating frame:

- Officially branded.
- Route-complete.
- Retractable.
- Responsive.
- Accessible.
- Persistent.
- Context-aware.
- Backend-preserving.
- Ready for the individually architected workspace contracts that follow.
