# ANGELCARE MARKETPLACE — P00 MARKETPLACE CAPABILITY CENSUS

## Certification result

**P00 STATUS: PASS — census complete for the supplied post-transplant Marketplace source.**

This is a constitutional inventory. It introduces **no business runtime, database, SQL, migration, admin workspace, shadow commerce or shadow workflow**. P01–P13 must consume the authorities catalogued here.

## Measured source surface

| Surface | Count |
|---|---:|
| Marketplace API routes | 569 |
| Marketplace admin pages | 564 |
| Locale public pages | 93 |
| Other Marketplace pages | 37 |
| Direct data authorities/views referenced | 324 |
| Marketplace permission strings discovered | 536 |
| Authority files with exported runtime functions | 259 |
| Curated canonical capability families | 46 |
| Studio fully wired capability families today | 2 |
| Partial/parallel native capability families | 9 |
| Capability families requiring Studio wiring | 35 |

The complete 569-route, 324-authority and 536-permission inventories are preserved as machine-readable evidence beside this document; they are not collapsed into a hand-picked subset.

## Constitutional finding

The Marketplace already contains mature canonical authorities for catalog, Category-Native experience schemas, public discovery, Media Vault, Experience Core, Conversion Universe, quote baskets, checkout, journeys/orders/bookings, public inquiries, CRM/customers, Academy, subscriptions, family requests, providers, territories, promotions, payments, wallet, B2B, partner operations, trust, operations, localization, analytics and governed publication.

Therefore the future Studio saturation must be **orchestration over existing authorities**, not a rebuild.

```text
STUDIO = VISUAL + ORCHESTRATION AUTHORITY
MARKETPLACE CORES = BUSINESS AUTHORITY
NO SHADOW COMMERCE / MEDIA / FORMS / BOOKINGS / ORDERS / CRM / WORKSPACES
```

## Existing template authority is real

`category-native/types.ts` already defines, per experience schema:

- `admin_studio_template`
- `public_experience_template`
- `conversion_template`
- `operations_handover_type`
- `homepage_card_template`
- `availability_authority`
- pricing modes, public fields, filters, comparison fields and version/status.

P04 must therefore reuse this constitution and Experience Core templates rather than invent a second template taxonomy.

## Existing conversion authority is real

Conversion Universe already exposes canonical functions for session creation/read/update, price revalidation, availability revalidation, consent, confirmation, basket creation/items and recovery. Category-Native `ExperienceConfigurator` already uses this API and revalidates before commit.

P03/P07/P08 must route Studio actions/forms into these engines. Studio must never implement pricing, availability, checkout or operational handover itself.

## Existing Experience Core is real

Experience Core already owns pages, blocks, revisions, templates, template revisions, symbols, symbol revisions, dependency edges, previews, publication jobs and governed transitions. Universal Studio already persists through this authority.

P04/P12 must extend reuse of this model rather than creating a Studio-specific template/dependency database.

## Existing operational destinations are sufficient

P00 found existing admin destinations for the principal customer consequences, including:

- `/angelcare-marketplace/admin/public-inquiries`
- `/angelcare-marketplace/admin/bookings`
- `/angelcare-marketplace/admin/quote-baskets`
- `/angelcare-marketplace/admin/orders`
- `/angelcare-marketplace/admin/conversion`
- `/angelcare-marketplace/admin/academy`
- `/angelcare-marketplace/admin/subscriptions`
- `/angelcare-marketplace/admin/family-requests`
- `/angelcare-marketplace/admin/payments`

**P00 conclusion: Studio-specific inboxes/orders/bookings/forms workspaces are not required.**

## Exact current Studio boundary

Universal Studio is native for page authoring/persistence/preview/publication/public rendering. However its source picker is currently limited to **Media Vault + categories + homepage collections**. Product-grid and collection-rail are special public runtime integrations. CTA destinations remain primarily raw `primaryCtaHref` / `secondaryCtaHref` text fields.

Public product/service entrypoints currently render `AdaptiveExperience` directly through Category-Native (`/marketplace/item/[itemSlug]`, `/experience/[itemSlug]`, `/booking/[itemSlug]`, `/quotation/[itemSlug]`, `/subscription/[itemSlug]`). They do not yet resolve a Studio template assignment.

That is the concrete boundary P01–P08 must remove.

## Studio gap sequence

| Gap | Severity | Required patch |
|---|---|---|
| G01 — Source registry | P0 | P01 |
| G02 — Picker UX | P0 | P02 |
| G03 — Actions | P0 | P03 |
| G04 — Template assignment | P0 | P04 |
| G05 — Live bindings | P0 | P05 |
| G06 — Dynamic sources | P0 | P06 |
| G07 — Forms/conversion | P0 | P07 |
| G08 — Runtime | P0 | P08 |
| G09 — Attribution | P1 | P09 |
| G10 — Admin trust | P1 | P10 |
| G11 — Governance | P0 | P11 |
| G12 — Dependency invalidation | P1 | P12 |
| G13 — Developer contract | P1 | P13 |

## Deterministic target architecture

```text
STUDIO
 ├─ P01 SOURCE REGISTRY → canonical public-safe entities
 ├─ P02 PICKERS → selection, not IDs/keys/URLs
 ├─ P03 ACTION REGISTRY → typed consequences
 ├─ P04 TEMPLATE RESOLVER → item > context > schema > category > family > default
 ├─ P05 BINDING ENGINE → live business facts
 ├─ P06 DYNAMIC SOURCES → collections/queries/campaigns/audiences/territories
 ├─ P07 FORMS → canonical workflows
 └─ P08 RUNTIME ORCHESTRATOR
       ↓
   EXISTING MARKETPLACE CORES
       ↓
   EXISTING ADMIN WORKSPACES
```

## Frozen P04 template precedence input

P00 recommends the following deterministic precedence for implementation in P04:

1. exact catalog item override
2. explicit collection/placement context override
3. Category-Native experience schema assignment
4. primary category assignment
5. sellable/product-service family assignment
6. Marketplace global default

No implicit collection inheritance should occur merely because an item belongs to multiple collections. Context inheritance must be explicit.

## Public-safe binding constitution

Live bindable: public catalog identity/content, resolved public price, current availability, Media Vault assets, public variants/schema fields, verified trust claims, territory context and recommendations.

Never general Studio-bindable: customer PII, internal margin/reconciliation, provider eligibility internals, incidents/case notes or other admin-sensitive data.

## No-new-workspace rule

P01–P13 must first resolve every customer action to an existing admin destination. A new workspace is allowed only if a genuinely missing business authority is proven, not because Studio generated the interaction.

## P01–P13 handoff

- **P01 — Universal Source Registry**: requires P00 capability registry; source registry candidates; public-safe projections; permission map
- **P02 — Universal Picker Framework**: requires P01 source registry; zero-typing map; Media Vault authority
- **P03 — Universal Action Registry**: requires action candidates; admin destination map; Conversion/Public Inquiry/route authorities
- **P04 — Template Assignment & Inheritance**: requires Category-Native template fields; Experience Core templates; catalog/schema/category/collection identities
- **P05 — Live Data Binding Engine**: requires catalog discovery; pricing/availability/trust public-safe projections; P01
- **P06 — Dynamic Content Source Engine**: requires collections/categories/catalog discovery/homepage/campaign/audience/territory authorities
- **P07 — Native Forms & Conversion Wiring**: requires PublicInquiryForm/public-universe; Conversion Universe; Family/Academy/B2B workflows; P03
- **P08 — Public Runtime Orchestrator**: requires StudioPublishedRenderer; AdaptiveExperience; template resolver; binding engine; action registry
- **P09 — Origin / Attribution Propagation**: requires audit/events/conversion source_route/session metadata; Studio page/template/block/CTA identities
- **P10 — Studio Trust Inspector**: requires source/action/template metadata; admin destination map; permission/validation metadata
- **P11 — Permissions / Governance / Fail-Closed**: requires 536 discovered Marketplace permission strings; publication models; failure matrix; P01-P10
- **P12 — Dependency + Cache + Invalidation**: requires cms_dependency_edges; template/source/binding/action identities; runtime revalidation points
- **P13 — Developer Contract Saturation**: requires all prior registries; anti-shadow invariants; machine-readable diagnostics

## Verification doctrine

P00 verification is static and targeted only. It checks census artifacts, required source authorities, key route surfaces, Studio boundary evidence and anti-shadow invariants.

It intentionally does **not** run:

- local production build
- repository-wide TypeScript
- SQL/migration
- database mutation
- commit/push/deploy

## Final P00 state

```text
P00_CAPABILITY_CENSUS=PASS
P01_BLOCKED_UNTIL_P00_PASS=RELEASED
SHADOW_SYSTEM_CREATED=NO
DATABASE_CHANGE=NO
SQL_REQUIRED=NO
MIGRATION=NO
LOCAL_BUILD=NO
GLOBAL_TYPESCRIPT=NO
COMMIT=NO
PUSH=NO
DEPLOY=NO
```
