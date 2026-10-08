# AngelCare Families · Immersive R2 contract

Route: `/angelcare-marketplace/:locale/families`.
Storefront key: `families`. Existing built-in ID: `builtin:pea:storefront:families:v1`.
The existing published custom Studio world retains precedence. This source upgrade enriches the built-in Families storefront; it does not create a new atomic detail theme or bypass an operator's published assignment.

## Scope and protected authorities

Only the existing 16 Families schema keys are admitted. Academy courses, Partner OS and B2B institutional offers are excluded. Preschool admission remains a family-facing admission journey. Hotel childcare is a family-facing travel service.

Homepage World 01 and World 02 R4, the global header, all 12 storefront links, footer, Customer OS navigation, public-experience theme infrastructure and category-native transaction authorities are preserved.

## Navigation and interaction

- Four chapters: everyday care; learning and accompaniment; products/digital/play; travel/holidays/preschool.
- All 16 original category anchors preserved, including homepage deep links.
- Photographic category map and native modal dialog with Escape, focus containment and return to its opener.
- Sticky chapter navigation, active chapter indication, page progress, smooth in-page navigation and reduced-motion support.
- Three editorial hero scenes with manual previous/next/dots, pause/resume, hover/focus pause, hidden-tab suppression and no autoplay with reduced motion.
- Family-only offer search, available/limited filter, real price sorting and reset. Filters affect offers, while all 16 category sections remain present.
- Horizontal rails: touch scrolling, thresholded mouse drag, click preservation, keyboard controls and RTL direction.
- 12 offers initially per category with incremental exposure of every remaining loaded item.
- Favourites use the existing homepage engagement authority. State changes only after a successful server response; failures are exposed.
- Mobile discovery/help/back-to-top dock; native FAQ disclosure controls.

## Truth and imagery

17 photographic editorial assets: a dedicated hero plus 16 distinct category images. Eight new generated editorial photographs and nine independently packaged existing project photographs. These illustrate family situations; they never stand in for actual product photos, stock or providers.

Offer cards retain canonical media. An offer with no canonical image uses an explicit image-forthcoming state. Category scenes use a canonical image from the category when present, otherwise clearly labelled editorial imagery.

Prices, currency, published status and availability come from the catalogue. Missing fixed prices are described as conditions to consult, without being converted to fictional quotation doctrine. A configured quote-only offer retains its qualification status. No ratings, scarcity, discount, inventory, provider certification or live visitor counts are fabricated.

Empty shelves are finished editorial journey sections with `Sélection en cours de mise à jour`, category guidance, contextual assistance and two related family universes. There are no permanent loading skeletons or fake offers.

The repeating 24-hour countdown is a visual editorial cycle and explicitly guarantees neither publication nor availability. All countdowns share one clock; server rendering has a stable placeholder and the ticking number is not a live screen-reader announcement.

## Data and territory

Families resolves the requested territory (default `MA-MASTER`) through the existing territory registry. A successful resolution selects global offers plus that territory. An unresolved code selects global-only offers. Lookup and catalogue errors fail visibly at the route boundary rather than becoming empty successes.

The catalogue is fetched in deterministic 240-row pages until complete. Only published items with one of the 16 allowed schemas enter the storefront. Published unavailable offers remain visible.

Active Families-assigned collection membership is joined to the current eligible catalogue projection. Foreign, unpublished, removed and non-family collection members are excluded. Collection cards reuse current catalogue prices and availability.

## Conversion and assistance

All offer links open the existing category-native item detail route; no broad kind-based checkout shortcuts are introduced. Recurring care, pickup routes, urgent requests, suitability, physical products, digital entitlement, activity subscriptions and admission keep their existing declared transaction authorities.

Assistance preserves an allowlisted `need` key through the localized login return path and the protected request redirect. The request form prefills a human-readable category and submits its schema context through the existing priorities payload. Unknown keys are rejected. The original authenticated request API, persistence and permission guards are preserved. A request is assistance, not a confirmed booking.

## Certification boundaries

Targeted Families TypeScript, behavioral source checks, actual component browser checks with explicit TEST catalogue fixtures, empty-catalogue visual evidence, protected file hashes, guarded installer application and restore are required before delivering the patch.

These checks do not certify live production inventory, actual authenticated transaction completion, live Studio publication, provider capacity or payment settlement. Those require the configured application and live operational evidence after release. No SQL, migration, dependency installation, full Next build, commit, push or deployment is part of this source patch.
