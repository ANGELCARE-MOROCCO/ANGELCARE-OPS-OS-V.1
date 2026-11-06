# KidFlix Delivery R2

HTML packages now select an explicit delivery policy while retaining their original atomic family. The same projection drives native validation, translations, references, public manifests and media readiness. Native source data stays in the saved dossier and becomes active again when the administrator selects Native delivery.

## Operator workflow

Open **Créer et publier** for the intended category or existing collection. The interactive Studio exposes **Importer → Vérifier → Publier**. The review runs the executable desktop experience. Native cover registration can use an explicit manifest cover or an administrator-selected PNG inside the package. A separately supplied cover remains supported through the normal native media control.

The collection control center exposes subcategory, parent topic/group, subject, stable key, source template, delivery choice, language bindings, metadata repair and native connections. **Toutes les capacités** opens the complete field/collection registry inline. **Options avancées** retains source editing, visual inspection, asset replacement, project analysis, AI repair export, revision comparison, restore, clone and source archive export. There are no tablet/mobile preview selectors or resource sidebars in this workflow.

The publish button saves the selected revision, runs server validation and either publishes or follows the organization's independent review policy. Public verification reports catalogue, detail, cover, media and HTML runtime delivery separately. An upload receipt is never presented as a publication receipt.

## Package metadata

The existing `KIDFLIX_UNIVERSAL_INTERACTIVE` contract remains valid. Optional additions:

```json
{
  "cover": "assets/cover.png",
  "catalogue": {
    "collection_key": "existing-stable-key",
    "subtype": "flashcards",
    "topic_id": "existing-scoped-topic-uuid",
    "subject": "Langage",
    "storefrontFocus": "language"
  },
  "editorial": {
    "summary": "Reviewed collection description",
    "instructions": "Reviewed instructions"
  }
}
```

Existing reviewed metadata takes precedence. Empty metadata can be filled from explicit declarations; unknown classifications are not invented. Source ages fill a new root but do not overwrite the ages of an existing root. Exact scoped `catalogue.collection_key` matches reuse an existing collection. Otherwise the generated package root key is stable for retry. No pricing is added and resource access stays free.

The administrator can download the current category's complete field/collection/options contract from the import screen. Its machine values come from the same registry used for editing and validation.

`interactivePackages[locale]` retains independent FR/EN/AR references. The legacy single reference is still read and migrated when attaching a package. The release contains only its own selected reference. Switching languages cannot reuse another language's executable package.

## Recoverable import

The new authenticated, same-origin `/interactive-import` API transfers binary chunks of at most 4 MiB. SQL receipts merge under row locks. Extraction advances in bounded batches, with a durable cursor and expiring worker lease. Retry verifies existing immutable objects rather than overwriting them. Completed imports retain their original archive and remove redundant chunks. Cancellation cleans incomplete staged files and preserves validated packages.

Up to 40 same-category/language ZIPs can be queued in a batch. Each item has its own receipt and retry state. Existing draft/selection controls still save and publish resources individually or as an explicitly selected batch. Saved import sessions can also be found in advanced project management.

Archive limits remain 64 MiB compressed, 160 MiB expanded, 36 MiB per file and 1,600 files. Rights, safe paths, CRC, checksums, category/language and local asset references are validated. The legacy multipart asset-edit endpoint remains available; the Next proxy buffer now accommodates its existing endpoint limits. See the official [Next.js request-buffer configuration](https://nextjs.org/docs/pages/api-reference/config/next-config-js/proxyClientMaxBodySize).

The host checks actual asset loading and reports runtime errors. Packages implementing the official bridge retain save/restore/progress behavior. Basic packages can report host-observed loading without fabricated learning progress or a false native-bridge claim. Preview-only visual inspection is excluded from public execution. Host identity uses the existing configured official logo and rights holder.

## Existing draft repair

The metadata review tab proposes exact changes and requires review before applying. Source values are preserved in a repair journal. A category scan lists existing draft/review/approved records with diffs. Selected repairs use revision and fingerprint guards, native save authorization and per-record receipts. They do not publish resources or replace collection identities. Pending CSV imports can be re-prepared through the existing importer after correcting their source values; they are not silently rewritten by this draft-repair tool.

## Activation

1. Apply `database/INSTALL_KIDFLIX_DELIVERY_R2.sql` to the existing Marketplace database before deploying this source. It requires the already installed Universal Interactive package table and DCE release table.
2. Verify activation:

```sql
select public.ac_kidflix_delivery_status();
```

Expected: `contract = KIDFLIX_DELIVERY_R2`, `chunkedImport = true`, `atomicBinding = true`.

3. Deploy the exact passing GHCR image from the existing Marketplace production workflow.
4. Run one real authenticated import against an existing visual-cards root, then publish and verify its anonymous storefront/detail/runtime journey. Existing package archives and catalogue roots can be reused.

The migration adds a private import-session table and service-only RPCs. A release trigger validates and binds the package in the same transaction as publication, including scheduled activation and restored releases. A binding failure rolls back the release. Existing native releases do not require a package. Historical immutable releases remain usable.

No production SQL or deployment is executed by applying source files alone. If the migration is absent, HTML publication reports the missing activation instead of proceeding with a partial release. Native publication retains its existing authority.

## Verification

The isolated QA package is `scripts/kidflix-delivery-r2`. Install its locked dependencies with `npm ci --ignore-scripts` and run `npm run verify`; browser checks run with `npm run browser` and a Chromium installation. The dedicated GitHub Actions workflow executes these checks on relevant changes.

- 64 functional checks, including all 16 families × FR/EN/AR, native-regression requirements, per-language binding, metadata repair and real archive/local asset validation.
- 13 embedded PostgreSQL checks for migration repeatability, atomic rollback/binding, scope/language/dossier protection, leases, receipts and client-role isolation.
- 13 import-service checks against embedded PostgreSQL and controlled object storage, covering interrupted extraction, retries, duplicate requests, completion recovery and cleanup.
- 9 browser checks with controlled APIs: actual iframe interaction, three-stage desktop flow, metadata repair, subcategory/topic selection, complete inline controls, publication, Arabic RTL, permissions and chunked transfer/cover linking.

These tests use controlled fixtures. They are not evidence that production SQL was applied or that a real live collection was published. Full application compilation and image generation are handled by the existing remote Marketplace build workflow.
