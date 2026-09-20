# P04 — Template Assignment & Inheritance Engine

## Mission

P04 makes published Experience Core templates assignable to existing Marketplace scopes without creating a parallel assignment table or replacing canonical Category-Native commerce data.

## Deterministic precedence

1. Exact catalog item
2. Contextual homepage placement
3. Contextual homepage collection
4. Experience schema
5. Catalog category
6. Sellable family
7. Marketplace default
8. Native Category-Native runtime fallback when no valid published Studio template resolves

## Persistence authorities

- Item: `angelcare_marketplace_catalog_items.experience_config`
- Collection: `angelcare_marketplace_homepage_collections.settings`
- Experience schema: `angelcare_marketplace_experience_schemas.configuration`
- Category: `angelcare_marketplace_catalog_categories.experience_config`
- Placement/family/default: existing `angelcare_marketplace_configurations`
- Template identity and published revision: Experience Core `angelcare_marketplace_cms_templates`

## Admin experience

P04 is surfaced inside the existing AngelCare Studio command bar. Item/category/collection/schema/template selection reuses P02. Families and placements are presented as bounded human-readable selectors derived from existing authorities. The panel includes a read-only live resolution inspector with full provenance.

## Runtime boundary

The three existing Category-Native item entrypoints invoke the P04 resolver and carry the selected template identity/provenance into `AdaptiveExperience`. P04 deliberately does not inject live product fields into a template and does not switch the public renderer to Studio template rendering; those remain P05/P08 responsibilities.

## Invariants

- Published template required.
- Missing/unpublished/mismatched assignment continues safely to the next precedence level.
- Existing native customer experience remains the fallback.
- Every write is permission-gated and audited.
- No new admin workspace.
- No shadow assignment table.
- No SQL/migration.
- No local production build.
- No repository-wide TypeScript sweep.
