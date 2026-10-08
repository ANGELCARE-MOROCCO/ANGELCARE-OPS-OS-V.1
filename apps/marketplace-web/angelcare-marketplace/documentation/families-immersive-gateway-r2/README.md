# Families Immersive Gateway R2

Families is the commercial discovery gateway to Home Services, Development and Kits. The existing marketplace shell and canonical offer/detail journeys remain authoritative. This is a storefront redesign, with no database, import engine, pricing authority, booking authority or taxonomy mutation.

## Sixteen sections

| Section | Design and customer purpose | Authoritative next step |
|---|---|---|
| 01 · Hero | Split photographic scene and clear family proposition | Three worlds or finder |
| 02 · Three gateways | Distinct care, learning and kits entry cards | Existing storefront routes |
| 03 · Situations | Asymmetric photographic needs mosaic | Need selection in finder |
| 04 · Finder | Need, service rhythm and configured age discovery | Canonical offer previews and full storefront |
| 05 · Home Services | Immersive care feature with published offers | Home Services or item detail |
| 06 · Rhythms | Occasional, recurring, overnight and school pickup comparison | Exact schema/legacy sellable classification |
| 07 · Development | Learning scene and native competency controls | Real product previews and Development |
| 08 · Kits | Interactive kit selection and real configured contents | Canonical kit details and Kits |
| 09 · Ages | Age bands with explicit configured eligibility | Real product previews and canonical details |
| 10 · Moments | Alternating lifestyle editorial panels | Three main storefronts |
| 11 · Published selection | Searchable gateway previews | Existing item journeys |
| 12 · Collections | Canonical eligible collection membership | Canonical item links |
| 13 · Confidence | Conditions, service coverage and suitable format | Existing trust and storefront routes |
| 14 · Continue | Saved offers and session-only recent browsing | Existing engagement API and canonical details |
| 15 · Other opportunities | Travel, holidays, preschool and all 16 schema directory | Existing storefront/search/establishment routes |
| 16 · Closing | Photographic guidance and three clear exits | Existing family request and storefronts |

## Locked commercial and atomic rules

- Source eligibility remains the existing Families contract: all 16 eligible schema families remain reachable. Academy courses, institutional B2B and Partner SaaS remain excluded under the original eligibility authority.
- Published unavailable offers remain visible with their existing status. Drafts and foreign territory offers remain excluded by the canonical repository.
- Rhythm comes from explicit atomic schema or existing canonical legacy sellable type. Subscription billing never manufactures recurring childcare.
- Postpartum remains an existing legacy capability. The gateway does not invent a new atomic schema or atomic request need.
- Product age and developmental goals come from explicit public configuration. Names and marketing descriptions are not used to guess eligibility.
- Montessori kits and activity subscription boxes lead to Kits. Development previews include product/kit kinds; preschool admissions retain their establishment destination.
- All displayed offer prices, availability, media and detail URLs remain canonical. Editorial photography illustrates situations and does not represent guaranteed inventory or staffing.
- Collections are deduplicated against canonical eligible IDs. Gateway previews intentionally show a small selection; full catalogues remain in the destination storefronts.
- FR/EN/AR copy, RTL, reduced motion, semantic controls, labelled search and visible save failure states are included.
- Saved offers reuse the existing homepage engagement endpoint. Recent IDs are validated, bounded to 12 and stored only for the current browser session and territory.
- Existing global header, 12 storefront navigation, footer and customer account navigation are unchanged.
- Published custom Studio worlds retain precedence. This patch upgrades the existing built-in Families renderer; it does not override an active custom Studio world.
- All original atomic directory anchors and four legacy capability section anchors are preserved.
- There is no waiting countdown, fabricated review, false scarcity, invented discount, stock guarantee or publication promise.

## Installation

Run the package's `APPLY_FAMILIES_IMMERSIVE_GATEWAY_R2.sh` with the repository directory as its first argument. It operates only inside `apps/marketplace-web`. It accepts unrelated pending work, verifies a precise baseline for touched code and relevant read-only dependencies, and refuses to overwrite later edits. Existing editorial photographs are kept; bundled photographs are copied only if missing. The backup contains a self-contained rollback script and checksum journal.

The installer runs the small gateway runtime checks and the existing compatibility script if present. It does not run the global or app-wide TypeScript compiler, install dependencies, issue SQL, stage, commit, push, build or deploy. The supplied focused TypeScript configuration was verified during preparation; it does not extend the mega-repository tsconfig.

For optional future focused checking: from `apps/marketplace-web`, run `./node_modules/.bin/tsc -p scripts/families-gateway-r2/tsconfig.ui.json --pretty false`.

## Rollback

Use the exact `ROLLBACK_COMMAND` printed after installation. It restores the prior entry point and removes only newly installed patch files. It verifies hashes before restoring and refuses to erase edits made after installation. Empty directories may remain. It does not reset, clean or stash the repository.

## Release gates

The patch is prepared and verified in a source snapshot. It is not installed in the user's Mac checkout and is not deployed. The full Marketplace image build and deployed storefront checks remain release gates. Release authority remains **Build Marketplace GHCR One-Off → exact source commit SHA → immutable GHCR image/digest → Coolify**.

Preview photographs and browser verification use the real components and captured published catalogue fixtures, with explicitly mocked engagement responses for success/failure behaviour. They do not certify live database contents, live customer authentication, deployed availability or deployed saves.
