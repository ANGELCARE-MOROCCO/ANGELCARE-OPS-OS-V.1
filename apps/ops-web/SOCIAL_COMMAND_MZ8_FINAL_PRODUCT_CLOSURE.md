# ANGELCARE SOCIAL COMMAND MZ8 — Final Product Closure

## Mission
MZ8 closes the user-owned content lifecycle without disturbing the working Meta/Webhook/Publishing runtime. It repairs Copy Vault import materialization, converts Media Vault into a governed DAM, synchronizes media taxonomy into Studio/Bulk Publisher, adds recoverable trash and explicit permanent deletion, and compresses the Social Command command masthead to the approved cockpit geometry.

## Copy Vault closure
- CSV import supports `Draft`, `Send to review`, or `Approve now` as an explicit import-state decision.
- Approved imports materialize canonical item + version records immediately and set `approved_version_no`.
- Import completion verifies the number of canonical rows physically materialized. A mismatch is surfaced as `COPY_VAULT_IMPORT_MATERIALIZATION_MISMATCH` instead of claiming success.
- Import completion clears stale Library filters and reloads the unfiltered canonical Library so newly approved copy becomes visible immediately.
- Approved active copy remains automatically consumable by Copy Vault pickers used in Studio/Publish/Engage.
- Items support create, view, revision/edit, submit, approve, reject, archive, restore, trash, and permanent purge.
- Categories support create, edit, archive, restore, trash, and permanent purge.
- Permanent purge requires the object to be in Trash and the exact confirmation `PERMANENTLY DELETE`.
- Copy purge removes canonical content while preserving a minimal audit tombstone containing fingerprints/usage evidence, not the deleted copy body.

## Media Vault DAM closure
- Canonical media assets gain title, description, lifecycle, favorite, editor and update metadata.
- Real hierarchical categories/subcategories are stored independently from tags.
- Collections provide curated reusable media sets, optionally linked to campaigns.
- Assets can belong to multiple categories and multiple collections.
- Asset editor supports title, description, tags, campaign, favorites, categories and collections.
- Bulk classify is additive: it adds selected category/collection membership without erasing existing classifications.
- Library supports search, categories, collections, campaigns, type and favorite filters.
- Asset lifecycle supports archive, restore, recoverable trash and authorized permanent delete.
- Permanent delete requires Trash first and typed `PERMANENTLY DELETE` confirmation.
- Permanent delete removes the Windows Media Gateway binary, removes canonical DB linkage, and leaves a minimal audit tombstone.
- Category/collection lifecycle supports create, edit, archive, restore, trash and permanent delete.
- Existing legacy Media DELETE now moves the asset to recoverable Trash instead of physically deleting immediately.

## Studio + Bulk Publisher synchronization
- Studio media selection now uses the governed Media Vault picker.
- Media Vault categories and collections are immediately available inside Studio selection.
- Campaign-aware filtering is supported.
- Reel selection is restricted to video media; story/reel selection respects single-asset limits where configured.
- Bulk Publisher slots use the same governed Media Vault taxonomy instead of a disconnected raw asset strip.

## Header / cockpit geometry closure
The MZ4 institutional masthead is retained functionally but reflowed:
- Identity/logo remains at left.
- Live Broadcast Feed occupies the full main first row.
- Search/Command occupies the full main second row.
- Windows / Meta / Attention status remains compactly available on the right.
- The previous large vertical dead zone is removed by reducing masthead rows/padding.
- Broadcast hover/focus pause behavior and existing snapshot/preset controls are preserved.

## Safety boundaries
- No relationship-history destructive delete was introduced for DMs/comments/provider events.
- User-owned working content receives CRUD/lifecycle controls; relationship evidence remains governed operational history.
- No Meta permission change is part of MZ8.
- No environment value change is required for core MZ8 operation.
- No Marketplace source is part of MZ8.
- SQL migration is additive; destructive rollback is isolated and must never be run casually.

## Deployment gate
1. Apply MZ8 source installer.
2. Installer static verification must PASS.
3. Installer targeted TypeScript gate must PASS.
4. Run SQL precheck.
5. Run SQL migration.
6. Run SQL verify and confirm every result is true/exists.
7. Only then commit/push/deploy.

Do not deploy MZ8 source before the database migration is applied because the new Media Vault runtime reads the added lifecycle/taxonomy columns/tables.
