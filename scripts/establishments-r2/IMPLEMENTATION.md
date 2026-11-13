# Établissements — approved journeys R3

Source baseline: `7380c9c023bc0f131ec45d6095ae4eb2efe99240` on `upgrade/next-angelcare-upgrade`.
Implementation branch: `feat/establishments-approved-journeys`.

## Approved reference mapping

| Approved image | Destination                                             | Role                                              | Catalogue source                       |
| -------------- | ------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `01-image.png` | `/angelcare-marketplace/fr/establishments` / `#conseil` | Default landing: Conseil & programmes             | `01-ACB2BCRECHE-MATERNELLEPC2-2-.pdf`  |
| `02-image.png` | Same pathname / `#partner-os`                           | Partner OS journey, linked from landing           | `03-ACB2BCRECHE.pdf`                   |
| `03-image.png` | Same pathname / `#produits`                             | Products & equipment journey, linked from landing | `02-B2B-CRECHE-ITEMS-CATALOGUE-3-.pdf` |

The detailed findings and remaining backend/release opportunities are recorded in `AUDIT-R3.md`.

The pages are implemented with real HTML, React components and controls. Only their source photographs/illustrations are raster crops. The approved screenshots are visual references, not flattened page replacements.

## Boundary contract

Only the French Établissements route selects this body. It reuses the existing `GlobalPublicShell` with the same marketplace shell arguments as the existing business storefront. Shared header/footer files, navigation authorities, the other eleven storefront routes, existing English/Arabic rendering, database schemas, checkout APIs and admin permissions are unchanged.

The French route deliberately selects the approved source-defined body instead of its previous body/template dispatcher. Existing CMS body templates are not rendered on this French route. Editorial content lives in `establishments-world/content.ts`; assets remain manageable through 40 registered Établissements-only imagery placements. This release does not introduce a new CMS editor for the editorial copy.

## Journey and commercial contract

1. Each hero is immediately followed by its explorer. Horizontal speciality links and cross-journey teasers connect the three views. URL hashes, territory query, browser back and current project selection work together. Section anchors retain their active journey, for example `#partner-os/ew-stories`.
2. Consulting provides nine brochure formulas across EduPlay, Academy Pro and ParentTrust. Priority and text filters, detail dialogs and comparisons expose cadence, scope, reporting, support and each tariff's unit.
3. Partner OS provides twenty brochure capability areas with need filters, search, pagination and details. The one-year offer is displayed as **12 full months on the free plan**. Its CTA prepares an enquiry for scope/conditions/activation; it never provisions a subscription or asserts that all paid modules are free.
4. Products provide the published catalogue explorer under the hero and sixteen non-clickable commercial universes in four illustrated chapters. The chapters explain needs and solutions; purchasable/requestable native offers are handled in the explorer.
5. Every view has source-led imagery, commercial explanations, reasons to work with AngelCare, tangible programme deliverables where applicable, a five-step approach and a contextual enquiry. Motion controls, reduced-motion support, focus indicators and native modal keyboard handling are included. The layout targets desktop, with no added sidebar or alternate tablet/mobile design.

## Catalogue and conversion authority

`prepareBusinessStorefront` remains the eligibility authority. The new body receives its territory-filtered canonical offers, not a fabricated catalogue. Products/kits, SaaS plans and consulting/training/audit offers are separated into their relevant journeys.

The live explorer supports explicit speciality/all-Établissements scope, category, availability, text, tariff-mode, favourites and public-characteristic filters, plus price/name/editorial sorting, 10, 20 or 40 offers per page, persisted native favourites and four-offer comparisons. Canonical detail links and conversion routes preserve the territory. Existing unavailable states block new project additions.

Brochure formulas are editorial references. Their tariffs are explicitly labelled as catalogue reference tariffs. A formula only links to a native offer through its exact item key or explicit programme metadata binding; a matching display name cannot invent an ID, stock, quotation or checkout. Native offers retain their own published conditions and prices.

The shared project holds up to eight elements across journeys and supports removal. Versioned session storage retains public selection keys and filters across refresh; native items are revalidated on restoration. Contact information stays in React memory. Submitted briefs distinguish real native IDs from brochure formulas, capability interests and the free-year commercial request. Enquiries use the existing diagnostics API and native payload/validation contracts, with a combined character budget, timeout/retry behaviour, a double-submit lock and a confirmed reference. The complete selection is assembled without using the earlier 2,000-character brief truncation helper. The contact form retains its draft across journey changes. Successful confirmations keep the submitted snapshot, and an explicit action starts a new request. A refresh clears contact information while preserving public selection/filter choices. A successful request never silently activates a plan or buys a product.

## Imagery contract

Forty PNG crops are derived exclusively from the three supplied PDFs and approved screenshots. `public/angelcare-marketplace/establishments-r2/provenance.json` records source filenames, SHA-256 hashes, page numbers, crop coordinates and output dimensions. `prepare_assets.py` reproduces the crops with Pillow and PyMuPDF:

```sh
python scripts/establishments-r2/prepare_assets.py --sources /path/to/original/files
```

Processing uses deterministic cropping and Lanczos presentation resampling. The PDF render size is not an assertion about the original photograph resolution. No generative enhancement, stock imagery, invented logo or reconstructed text is used. The supplied source resolution limits visible detail; true high-definition replacement requires the original high-resolution assets. Existing published catalogue images continue to come from their own catalogue records.

Imagery Studio registration is restricted to `establishments.journey.*`. Existing registry entries retain their values. Layout rules accommodate both plain source images and managed imagery wrappers.

## Verification completed locally

- Strict TypeScript checking of the new client module and its transitive client dependencies: passed.
- Production-mode client bundling of the actual component: passed.
- `verify.cjs`: 19 contract checks passed (view/hash behaviour, channel boundaries, exact bindings, filtering, sorting, unavailable states, selection cap, identity-preserving briefs, price authority, catalogue counts and source-slot isolation).
- Browser checks: main landing, three in-place views, programme priority filtering, native search, pagination, native comparisons, modal selection/Escape, project retention, back navigation, section anchors, motion toggle, free-year context and simulated request confirmation.
- Managed imagery wrapper dimensions checked in the browser for hero, priority and formula placements.
- Browser fixtures used explicitly synthetic offers and simulated engagement/diagnostics responses. No production enquiries or database writes were made. These checks do not establish live database persistence or real offer counts.
- Diff scope and whitespace checks: passed against the stated source baseline.

Run the contract checks from the repository root, with the marketplace's existing TypeScript dependency installed:

```sh
NODE_PATH=apps/marketplace-web/node_modules node scripts/establishments-r2/verify.cjs
```

## Release status and remaining gate

This is a local source implementation. A full application production build, live backend acceptance, GHCR image, SQL migration and deployment have not been performed. No SQL is required by these source changes.

External GitHub publication was blocked by automatic approval review. The local implementation remains reviewable and committed; publishing its isolated branch requires approval of that specific repository write. No remote merge, force push, production workflow dispatch or deployment is part of this completed local work.

Before production release: review the three journeys with real published catalogue data; run the repository's normal marketplace build and relevant release checks; verify real engagement/enquiry persistence in a suitable test environment; then use the existing deployment process. Do not declare the mocked browser success a production acceptance result.
