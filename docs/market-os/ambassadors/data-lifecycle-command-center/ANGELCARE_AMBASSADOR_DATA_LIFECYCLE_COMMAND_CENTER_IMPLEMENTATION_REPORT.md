# ANGELCARE Ambassador Data Lifecycle Command Center

## Delivery

Focused reconstruction of:

`/market-os/ambassadors/data-lifecycle`

The rest of the Ambassador sidebar workspaces remain outside this delivery.

## Frontend execution

The former single-page control surface is reconstructed into five internal workspaces:

1. Vue de gouvernance
2. Registre des demandes
3. Opérations groupées
4. Journal d’audit
5. Politiques et autorités

Implemented experience:

- Premium executive governance hero and posture metrics.
- Governed inventory with search, population tabs and multi-selection.
- Dependency analysis attached to the selected dossier.
- Request register with status tabs, search, entity filters and duplicate-request indicators.
- `requested`, `approved`, `executing`, `completed`, `rejected` and `blocked` remain visually and behaviorally distinct.
- Blocked requests no longer expose a misleading purge button.
- Clickable request rows open a purpose-built decision drawer.
- Drawer tabs: Vue générale, Données concernées, Dépendances, Chaîne de décision, Preuve et audit.
- Classified French audit journal with search, category and entity filters.
- Clickable immutable events open a payload/evidence drawer.
- Bulk-operation register with per-job and per-item outcomes.
- Authorities and purge-adapter registry exposed as governance controls.
- Existing archive, restore, anonymize, request, approve, reject and execute actions are preserved.

## Backend execution

Additive migration:

`apps/ops-web/database/market-os-ambassadors/20260730_market_os_ambassador_data_lifecycle_command_center.sql`

It adds:

- Bulk purge job table.
- Bulk purge item table.
- Purge-adapter registry.
- Bulk create RPC.
- Per-entity preflight RPC.
- Bulk decision RPC.
- Governed bulk execution RPC.
- Adapter preview and cleanup functions.
- Immutable lifecycle events for bulk creation, analysis, decision and execution.

The existing single-record lifecycle functions are not replaced by this migration.

## Adapter strategy

Known relational data families are registered with explicit strategies:

- `delete`: remove nominative operational rows.
- `detach`: retain commercial or financial evidence while removing the governed entity reference.
- `block`: stop deletion when business integrity requires the dependent record.
- `verify_only`: expose external-system verification obligations.

External object storage, search indexes and AI-derived knowledge are registered as `verify_only`. They are not falsely reported as deleted. A job remains `partial` while active external verification adapters are pending.

## Operational truth

A bulk job is never marked completed merely because the primary database row disappeared.

- Each item has its own state and error.
- Partial failure remains partial.
- Known database adapters execute before the primary deletion.
- External verification remains explicit.
- A distinct `PURGE-BULK-XXXXXXXX` code is required for each job.
- Single-record `DELETE-XXXXXXXX` confirmation remains unchanged.

## Safety boundary

- No unrelated Ambassador page was modified.
- No existing lifecycle SQL was overwritten.
- No SQL is auto-applied by the patch installer.
- No production build is run.
- No staging, commit or push is performed.
