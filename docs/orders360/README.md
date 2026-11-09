# Orders 360 — first five workspaces

The existing `/angelcare-marketplace/admin/orders` route now presents Pilotage, Commandes, Planning, Exécution and Fournisseurs under a shared horizontal navigation. The original admin shell, official logo, sidebar and global header are preserved. Finance, SAV, Documents and Contrôle continue to expose existing authorities with the current order context.

## Functional coverage

| Workspace | Implemented controls |
| --- | --- |
| Pilotage | Authorized historical portfolio, shared filters, currency-separated KPIs, lifecycle groups, priorities, territory load, evidence decoder and direct contextual actions |
| Commandes | Assisted creation, native manual creation, searchable/sortable/paginated register, selection, column controls, CSV export, actor-scoped local saved views, selected dossier, editable lines, address correction, payment evidence, documents and timeline |
| Planning | Day/week/team views, calendar selection, browser-timezone scheduling input with Casablanca display, real proposal comparison, dispatch scoring, conflicts, accept/reject decision and native mission dossier |
| Exécution | Operational stage board, persistent selection, contextual prerequisites, evidence controls, mission/fulfillment/native order dossiers |
| Fournisseurs | Complete paginated procurement snapshot, linked POs, offer and paid-order selectors, purchase creation/lines/transitions, independent approval, declared versus verified availability, shipment transitions/proofs, tasks, audit and six retained advanced supplier workspaces |

All 49 audited authority entry points are searchable through `orders360/capabilities.ts`. The complete native order dossier retains Command, Operate, Items, Payment, Fulfillment, Documents, Communications, Incidents, Refunds, Timeline and Relations. Existing routes remain available. This change does not claim every older authority has received a complete redesign.

## Data and mutation contracts

- Workspace and detail reads require the existing operations permissions. Detail reads verify tenant and territory before assembling the complete native dossier. Customer address choices belong to the order customer and exclude archived entries.
- Supplier reads and writes retain the existing supplier authority. Approval/issuance and independent availability verification retain privileged server checks and database controls.
- Order mutations reject stale revisions, concurrent edits, cross-customer addresses, cross-tenant access and invalid date ranges. Associating an address preserves provider evidence and writes the original event/audit records.
- Native mutation endpoints remain authoritative. Supplier retries retain the same idempotency key for an unchanged command. Success receipts and refresh errors are distinct.
- No synthetic fixtures are imported by production code. No availability, payment, external integration, carrier reservation or supplier purchase is invented from UI state.
- No SQL migration, role expansion, third-party dependency or production data mutation is included. Existing database functions and schemas must already be installed.

## Verification

Run from `apps/marketplace-web`:

```sh
npm run orders360:test
npm run orders360:typecheck
```

The focused suite passes 18 behavioral checks covering history/filter semantics, currency separation, service versus product prerequisites, CSV formula safety, address ownership/archive checks, tenant boundaries, stale and concurrent edits, preservation of provider evidence/audit, date validation, and complete pagination/error propagation. The focused TypeScript check includes the actual dependency closure and synthetic fixture types.

Browser verification used the actual Next.js components and unchanged admin shell with synthetic fixtures in a separate local harness. It confirmed all five areas, search, pagination, address correction, dispatch scoring, provider proposal decision, supplier approval receipt/revision refresh, retained advanced supplier controls and native dossier Documents entry. These are isolated UI checks, not live database certification. The fixture file is explicitly test-only.

A full repository TypeScript run exceeded this execution environment's memory limit. The supported Node 22 CI build and authenticated production/database smoke checks remain release gates. No GHCR image or deployment is certified by these focused checks. The local runtime used Node 24.

## Release and rollback

Review this isolated branch against `upgrade/next-angelcare-upgrade`, run the repository's production CI/GHCR workflow under Node 22, and perform authenticated role-based smoke checks against the target database before deployment. Revert the feature commit to roll back; no database rollback is required because this change adds no SQL.
