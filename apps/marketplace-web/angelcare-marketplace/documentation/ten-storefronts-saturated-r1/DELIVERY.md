# ANGELCARE — Ten Saturated Storefronts R1

This completes the ten remaining public storefront bodies using the current Marketplace source supplied in the two uploaded ZIPs. Homepage World 02 R4, Families Gateway R2, Home Services Premium R1 and the global shell remain in place.

## The ten worlds

| Storefront | Dedicated experience | Primary customer path |
|---|---|---|
| Development | Age and goal discovery studio, published activities and development kits | Catalogue → existing item detail; child support → Family request |
| Kits | Interactive product workbench, declared contents, age and format exploration | Catalogue → existing item detail → existing product journey |
| Academy | Programme campus and learning progression | Training detail; published programmes → Academy request |
| Establishments | Organisation transformation map and priority briefing | Establishment diagnostic, with Academy / Quality / Partner OS pathways |
| Hospitality | Family stay itinerary, kids club / guest childcare / concierge / seasonal discovery | Existing hospitality routes and request |
| Health Partners | Family support pathway with an explicit nonmedical boundary | Existing health partner request |
| Corporates | Family benefits priorities and organisation briefing | Existing corporate request |
| Partner OS | Published plan desk with original billing periods and prices | Existing Partner OS contact/demo path |
| Quality Check | Scope compass and audit priority briefing | Existing Quality Check 360 path |
| Professionals | Professional development and competency discovery | Training detail and existing Academy request |

## Experience standard

Each page contains 15 substantial modules, with an additional published editorial module when configured: photographic hero; colourful topic gateways; canonical offer shelf; dedicated interactive tool; editorial chapter experience; complete filterable catalogue with incremental reveal; canonical collections; published native resources; customer progression; evidence and conditions; comparison; saved/recent browsing; related storefront gateways; questions; and a photographic closing action.

Visual treatments include saturated brand pink, blue and storefront accents; layered gradients; photographic editorial panels; distinct topic tile compositions; contained offer imagery; dense responsive grids; bright category/status tags; hover lift; controlled shimmer; section entrances; scroll progress; a sticky local navigation; and a mobile action dock.

FR / EN / AR copy, RTL layouts, keyboard controls, labelled inputs, actual empty/error states and reduced motion support are implemented. Motion stops when its editorial chapter is offscreen, the page is hidden or reduced motion is preferred.

Offer images use contain and remove the native cropped thumbnail variant. A missing offer photo stays missing: no editorial photograph is presented as the product's own image. Editorial photography may use cover. All photography reuses assets already present in the supplied source.

## Commercial and data boundaries

- Published Studio worlds retain first priority. The new bodies render only after that decision and after the existing Families and Home Services branches.
- Canonical catalogue membership, ordering, prices, availability, trust labels and item objects remain the authority. Larger storefront catalogues page through the existing discovery API beyond its original 120-item first page, retaining locale/category/territory. Filtering/sorting works on derived arrays. Unavailable published offers and unknown future schemas remain visible by default.
- Collections intersect the current storefront's canonical items; collection members cannot inject another offer or overwrite a canonical item.
- Offer actions preserve the existing /marketplace/item/[slug] journey. Editorial topic buttons are searches; they do not create atomic categories or classify products.
- Native Development activities/kits, Academy programmes and Partner OS plans are projected to explicit public fields and only shown when published. Native French content is identified with lang="fr" rather than represented as translated.
- Partner prices retain published billing periods. No annual discounts, stock promises, review counts, employment promises or medical claims are invented.
- Favourites and comparisons reuse the existing Marketplace engagement endpoint. Failed writes report an error and do not show a successful save. Comparisons are limited to four. Recent browsing is local, versioned and scoped to storefront/locale/territory.
- Briefing tools prepare local selections and a copyable summary. They do not submit an organisation diagnostic, create an order or change a backend record.
- No SQL, schema/category import changes, atomic engine changes, dependency installation or shared shell/logo/navigation/footer edits.

## Verification

- Scoped TypeScript: 17 source files in the new renderer dependency graph.
- Eight route/dispatcher integration files: syntax and route guards.
- Actual server dispatcher: 13/13; all ten branches, published Studio priority, existing two storefronts and large catalogue reads.
- CSS: 129 referenced classes and 747 pure module selector branches.
- New runtime contract: 73/73, including a complete 605-offer catalogue over multiple batches and read-error/no-progress stops.
- Browser checks: 47/47, including ten storefronts at desktop FR and mobile EN/AR, selection persistence/failure, four-item comparison, filters, pagination, unknown schemas, unavailable offers, null images, collections, editorial controls, reduced motion, FAQ and empty sources.
- Existing Families compatibility: 35/35.
- Existing Home Services: 37/37.
- Existing Homepage R4: 71/71.
- Installer and rollback: 7/7, including no-write conflict protection, clean install without dependencies, idempotence, later-edit preservation, exact restoration and automatic recovery after runtime failure.

Browser captures use the actual new renderer and existing global shell with explicitly synthetic public records. They verify rendering and interaction; they do not claim live catalogue population or live backend verification. Those records are not included in the installed payload.

## Installation

Extract the ZIP into Downloads and run its install.mjs with the repository path. It validates every payload hash and the exact baseline of each modified file before writing. Unexpected local edits stop installation before any source write. Reapplying an identical installed version succeeds without a duplicate backup.

The installer backs up the exact current files, installs atomically per file, runs the standalone runtime contract, verifies protected boundaries and checks all installed hashes. It prints the exact rollback command. Rollback preserves later edits and refuses to overwrite them. Install and rollback errors set only the Node process's status; they do not exit the interactive terminal.

Full Marketplace image build, immutable GHCR reference and deployed storefront checks remain release gates. The package does not stage, commit, push or deploy.
