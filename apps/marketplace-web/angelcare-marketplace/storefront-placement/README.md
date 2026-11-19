# Product 360 — optional storefront placement

One canonical offer keeps **all automatic storefront placement active**. Admin may optionally add the offer to any combination of 12 existing atomic storefronts, independent of its category, kind or schema. Manual selections are additive merchandising hints, never replacements for native eligibility. Product identity, category, pricing, stock, publication and operational conversion remain canonical.

## Admin entry points

- Product 360 → **Vitrines & diffusion**.
- Catalogue population → offer’s 360 dossier → **Vitrines & diffusion**.
- Deep link: `/angelcare-marketplace/admin/catalog/items/<itemId>/storefronts`.

All existing catalogue kinds can use this control, including drafts without a schema. Existing `marketplace.catalog.view` / `marketplace.catalog.manage` permissions and territory scope apply.

## Behaviour

| Mode | Result |
| --- | --- |
| Missing configuration / Automatic | Existing native storefront rules remain authoritative. |
| Manual with one or more storefronts | Automatic placement **still applies**; checked storefronts add optional exposure where the offer is not already native. |
| Manual, no storefronts checked | Identical automatic storefront exposure. No optional additions; never remove the product from native storefronts. |
| Automatic selected again and saved | Keep native placement and clear optional additions only. |

Établissements contains three independent destinations: `conseil`, `partner-os`, `produits`. Checking its parent initially selects all three; each child can then be changed. Removing the last child removes the parent. Its Partner OS child is distinct from the standalone `partner-os` storefront.

The optional top-level placement set is shared by FR/EN/AR. The three Établissements sub-explorers extend their automatic classification rather than replacing it. Previews use the saved sub-explorer and the offer’s territory.

```json
{
  "storefront_placement": {
    "version": 1,
    "mode": "manual",
    "storefronts": ["families", "establishments"],
    "establishmentViews": ["conseil", "produits"]
  }
}
```

Stored under the existing catalogue item’s `experience_config`. No SQL migration, backfill or new table is required. The native `experience_configuration` schema is not changed.

## Save and publication contract

`GET` / `PATCH /api/angelcare-marketplace/admin/catalog/items/<itemId>/storefront-placement` returns a database-backed snapshot. PATCH merges only this setting into the current configuration and uses an `updated_at` compare-and-swap. Its revision advances beyond the previous timestamp even if the wall clock has not advanced. Concurrent writes return 409; the UI retains the draft and requires an explicit re-read before replacing a newer selection.

The UI keeps an item-specific session draft, distinguishes pending from saved selections, supports reset/select-all/clear-all, and exposes public-status explanations with correction actions. Draft recovery keeps its original base revision, including across a page refresh during a conflict. Success requires returned identity, revision and normalized configuration to match.

Saving an optional placement never publishes an offer. Public readers retain publication, public slug, visible category and territory gates. Optional additions cannot expose hidden, suspended, cancelled or territory-restricted offers. These public-eligibility safeguards are independent of the freedom to select any destination. Out-of-stock/unavailable offers retain native availability and detail behaviour. Global offers remain global; unknown visitor territories cannot expose territory-specific manual offers.

Public metadata contains only the normalized placement contract. The raw admin configuration is never added to public payloads. Changes emit the existing marketplace audit event and invalidate all 12 storefront paths for all three locales plus the canonical item path and existing commerce tags.

## Reader integration

- Five consumer/learning storefronts: finish native pagination before adding optional selections; load manual inclusions through the published catalogue; rebuild counts/facets and featured items. Native offers and original collection recommendations are never removed by manual settings.
- Seven business storefronts: evaluate native audience/doctrine even when manual settings exist, then union any optional manual additions under the same public visibility gates. Preserve native schema, conversion and operational authority.
- Family and home-service component selectors accept deliberately cross-merchandised kinds while their original automatic selectors remain active for all unselected destinations. Their links keep the canonical detail journey and actual kind.
- Établissements unions optional explorer memberships with native channel classification in filtering, facets and counts. Native channel identity remains available for programme/formula bridges.
- Studio’s canonical inventory role reads the resolved offer set for all 12 storefronts. Promotional/editorial sections remain separate.
- A resolved catalogue is marked so downstream native pagination cannot restore excluded entries or offset past manually added offers.

## Verification

From `apps/marketplace-web`:

```sh
node scripts/storefront-placement/verify.cjs
npx tsc -p tsconfig.storefront-placement.json --pretty false
node scripts/home-services-storefront/verify-runtime.mjs
```

The feature suite executes the actual TS handlers, catalogue readers and selectors against a test Supabase contract. It covers all 12 readers, additive Établissements membership, permissions, drafts, read-back, concurrent writes, cache invalidation, public eligibility, locale category hiding, native automatic preservation, collection preservation, pagination and 501 optional additions. It does not write to the live database.

Browser checks use the real placement component and API handler with disposable test records: multi-selection/read-back, exact public membership, conflict recovery across refresh, failed-save retry, drafts without schemas and read-only permissions.

The older `verify-families-storefront-promax.mjs` source-string guard targets an earlier renderer and reports the same 36 failures on the saved R5 baseline and this continuation; this change introduces none. It is not counted as a passing check. Full application build, deployment and live database verification are separate from these focused checks.
