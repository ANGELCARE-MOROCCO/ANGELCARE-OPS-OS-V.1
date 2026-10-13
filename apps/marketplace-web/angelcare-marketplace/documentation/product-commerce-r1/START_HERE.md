# Product Commerce Light R3

Complete Product-only correction: a professional white opening, light content and assistance panels, restrained AngelCare colour accents, compact technical icons and a dedicated recommended-products rail after the final selection recap and before the existing Marketplace footer.

## Install

Extract into Downloads and run install.mjs against the repository root. The installer accepts the supplied 20261012_114923 source or the delivered Complete R1 and Impact R2 packages. It preflights all changes, saves actual working files and prints a guarded rollback command. Repeated installation is safe. Conflicting edits are preserved and stop installation before writes.

No SQL, user-app dependencies, environment changes, global TypeScript, local application build, Git operation or deployment is executed. Release through the existing remote Marketplace image workflow, then deploy its immutable image.

## Product data and images

Full description, public specifications, contents, usage/care, fulfilment, conditions, FAQ, options, prices and availability remain native Product360 data. A section without public business data stays hidden. Primary and supporting product imagery uses contain fitting. Supporting context, description, contents and detail images remain editable through Product360 media assignments and existing media_json imports. The shared help portrait remains neutral AngelCare assistance imagery.

The global header/navigation/footer, Homepage, Service, Course, B2B, imports, authentication, email, Hotline and payment authorities are preserved. The existing navy global footer remains unchanged.

## Recommended products

The final “À découvrir aussi / Recommended products / منتجات قد تعجبك” rail uses a dedicated read-only API. It prioritises shared published visible native categories, then the primary category and schema, then broader published Product discovery. Explicit known atomic schemas override legacy kind. Services, courses, audits, SaaS, drafts, other territories and the current product are excluded. IDs are deduplicated; multi-category membership reads are paginated and batched. Products without a known new schema can remain discoverable as native products.

Up to eight actual products show their current names, contained media, price and native detail links. Each opens its own options and purchase journey. Recommendations do not assert bundle discounts, suitability or compatibility. Explicit bundle/accessory/alternative relations remain separate. Requests begin near the end of the page, so initial product rendering does not await recommendation discovery.

Read errors retain previously projected products and expose retry. A genuinely empty selection keeps a link to the Product catalogue. No products, reviews or prices are invented.

## Studio selection

Native Product defaults, native fallback and existing Product Commerce R1/R2 roots use the shared updated renderer. Other valid published custom Studio compositions remain authoritative. To adopt this design for one of those, import public/angelcare-marketplace/product-commerce-r1/product.world.json through the existing World Factory, assign its Product master domain, preview and publish. This is revision 3 of the existing pack key; the installer does not change database assignments or publish a theme. Explicitly hidden recommendation sections remain hidden in Studio.

## Purchasing

Existing required choices, active variant combinations, availability and native basket/checkout authority remain enforced. Draft selections and quantities survive reload. Changes clear an earlier basket success. Errors retain input. Basket-line and advice success requires a real reference. No transaction POST is automatically retried.

The review area uses the existing proven aggregate rating/count or a truthful empty state. Individual-review submission is not introduced by this patch.

## Evidence

previews/ renders the delivered components with the unchanged source shell. Two product detail snapshots and twelve public catalogue records were captured read-only; a third local fixture is clearly labelled for conditional modules. No fixture is installed into the database. PNGs are actual code previews, not deployed acceptance. Browser transaction/enquiry tests use mocked receipts; database-query tests use isolated fixtures.

verification/ reports the current data, recommendation, browser, scoped type/syntax, World Factory and installer checks. Remote full image build, deployed assignment and real basket/checkout/advice acceptance remain pending. Your visual approval is separate from these checks.
