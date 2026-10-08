# ANGELCARE MARKETPLACE — P01 UNIVERSAL SOURCE REGISTRY

## Status

P01 implements the runtime discovery layer certified from P00. It does not create a new business authority.

## Result

- 20/20 P00 source candidates registered with stable Studio source IDs.
- 20/20 registered server adapters.
- Fixed, bounded, paginated reads; maximum 50 results per request.
- Registered-column projection only: generic adapters never expose `select(*)` payloads.
- Locale and territory context are propagated centrally; a territory-scoped session cannot escape its assigned territory.
- Source filters are explicit allowlists; unknown filters fail closed.
- Canonical references persist only `sourceId + entityId`.
- Source-specific Marketplace permissions are enforced by the resolver.
- Unknown sources, missing adapters and unsupported capabilities fail closed.
- Source entity payloads are normalized; raw repository records are not exposed as the Studio contract.
- Studio Developer Contract includes the Universal Source Registry.
- Dedicated Source Registry exports exist in JSON / CSV / TXT with SHA-256 response evidence.
- Six protected API surfaces cover registry, descriptor, search, browse, entity resolution and reference validation.

## Sources

- `catalog.items` ← P00 `catalog_item` · authority `catalog-discovery` · permission `marketplace.catalog.view`
- `catalog.categories` ← P00 `catalog_category` · authority `catalog-categories` · permission `marketplace.catalog.view`
- `homepage.collections` ← P00 `homepage_collection` · authority `homepage-flagship` · permission `marketplace.homepage.view`
- `media.assets` ← P00 `media_asset` · authority `media-vault` · permission `marketplace.media.view`
- `content.pages` ← P00 `cms_page` · authority `experience-core` · permission `marketplace.cms.view`
- `content.templates` ← P00 `cms_template` · authority `experience-core` · permission `marketplace.cms.view`
- `content.symbols` ← P00 `cms_symbol` · authority `experience-core` · permission `marketplace.cms.view`
- `experience.schemas` ← P00 `experience_schema` · authority `category-native` · permission `marketplace.experience_schema.view`
- `homepage.campaigns` ← P00 `homepage_campaign` · authority `homepage-flagship` · permission `marketplace.homepage.view`
- `experience.live_campaigns` ← P00 `live_experience_campaign` · authority `live-experience-command` · permission `marketplace.cms.view`
- `audience.segments` ← P00 `audience_segment` · authority `enterprise-command-segments` · permission `marketplace.admin.access`
- `context.territories` ← P00 `territory` · authority `territory-authority` · permission `marketplace.territories.view`
- `academy.programmes` ← P00 `academy_program` · authority `academy-engine` · permission `marketplace.academy.view`
- `academy.cohorts` ← P00 `academy_cohort` · authority `academy-engine` · permission `marketplace.academy.view`
- `providers.profiles` ← P00 `provider_profile` · authority `provider-workforce` · permission `marketplace.providers.view`
- `commerce.promotions` ← P00 `promotion` · authority `enterprise-closure` · permission `marketplace.catalog.view`
- `partners.plans` ← P00 `partner_plan` · authority `partner-os` · permission `marketplace.partner_os.plans.view`
- `b2b.programmes` ← P00 `b2b_program` · authority `b2b-verticals` · permission `marketplace.b2b.programs.view`
- `trust.claims` ← P00 `trust_claim` · authority `trust-quality` · permission `marketplace.catalog.view`
- `navigation.destinations` ← P00 `navigation_destination` · authority `public-navigation+experience-core+catalog` · permission `marketplace.cms.view`

## Boundaries

P02 visual pickers are intentionally not implemented here. P03 actions, P04 templates, P05 bindings and later phases remain blocked until their respective contracts.

`SQL=NO` · `MIGRATION=NO` · `DATABASE_CHANGE=NO` · `LOCAL_BUILD=NO` · `GLOBAL_TYPESCRIPT=NO`
