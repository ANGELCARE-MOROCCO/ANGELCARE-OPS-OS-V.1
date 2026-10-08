# ANGELCARE PRODUCT PAGE PRO MAX WORLD 01 — FULL X-RAY BLUEPRINT

**Status:** APPROVED DESKTOP + MOBILE VISUALS → OFFICIAL BUILD CONSTITUTION  
**World ID:** `ac.product.pro-max.commerce.01`  
**Type:** `PRODUCT_PAGE_WORLD`  
**Desktop reference:** `935 × 1683` — SHA-256 `32b8a7a604391a7519d963e6a2344fb96c8263e3c9a690b9eb7ca5bd30f2e694`  
**Mobile reference montage:** `941 × 1672` — SHA-256 `9fc064fbc27005cc2e63d10979d521f3ea958b9f290e8ab9a76eeed5f8e5c4df`  
**Canonical desktop implementation frame:** `1440 × ~2592`  
**Canonical mobile certification viewport:** `390 × 844`  
**Primary purpose:** a high-trust, high-conversion AngelCare product detail world that combines product truth, rich media, purchase orchestration, recommendations, education, community and reassurance without creating a shadow commerce authority.

---

# 1. Constitutional doctrine

This Product Page World is **not** a flattened screenshot, iframe, copied HTML blob or one giant locked React component.

It must materialize as a governed Experience Core/Puck tree whose major sections remain independently selectable, configurable, movable, duplicable, removable and upgradeable.

The visual references govern **composition, density, hierarchy, spacing, proportions, interaction intent and responsive behavior**. They do not become authority for mutable commercial facts.

The page stores or references only what the authoring system legitimately owns:

- layout and presentation,
- editorial defaults,
- canonical references,
- dynamic-source recipes,
- structured actions/workflows,
- responsive rules,
- approved media selections,
- empty/error/fallback policies.

It must **not** own copies of live price, inventory, delivery status, rating aggregate, review facts, variant stock, bestseller state, sales counts, promotion eligibility, cart state, or customer identity.

Public resolution remains:

`P04 template assignment → P05 bindings → P06 dynamic sources → P03 actions → P07 workflows → P08 public runtime`

with P11 governance, P12 dependency invalidation and P13 compatibility doctrine applied around the result.

---

# 2. Approved reference authority

## 2.1 Desktop

`references/APPROVED_DESKTOP_REFERENCE.png`

- Width: **935px**
- Height: **1683px**
- SHA-256: `32b8a7a604391a7519d963e6a2344fb96c8263e3c9a690b9eb7ca5bd30f2e694`

The reference shows a complete tall desktop PDP: urgency/header/nav, breadcrumb, three-column decision fold, trust strip, benefit story, product-detail quadrants, bundle/accessory/similar merchandising, editorial/community/mission surfaces, trust strip and mega footer.

## 2.2 Mobile

`references/APPROVED_MOBILE_REFERENCE.png`

- Width: **941px**
- Height: **1672px**
- SHA-256: `9fc064fbc27005cc2e63d10979d521f3ea958b9f290e8ab9a76eeed5f8e5c4df`

The visual is a **three-panel certification montage**:

- **M-A:** product discovery + decision + purchase
- **M-B:** benefit proof + description + specifications + reviews
- **M-C:** accessories + bundle + similar products + FAQ + guides + app/trust

Production must implement **one continuous mobile PDP**, not three routes or three separate page documents. The three panels become required scroll-anchor render states.

## 2.3 Logo authority

The official source supplied by the user has SHA-256:

`d0c6f556e929f4b1b9a1fd4d00229f595f174ee3c43e6fbc25b4af870785a30a`

Production policy:

- use the existing official ANGEL CARE artwork,
- crop/mask only to exclude `Corporate Care` and the yellow underline,
- never redraw the wordmark,
- never redraw geometric symbols,
- never recolor,
- never AI-regenerate,
- never substitute a lookalike.

---

# 3. Core design tokens

## 3.1 Color roles

- `--ac-navy: #092E73` — titles, trusted navigation, editorial authority.
- `--ac-pink: #FF2D6F` — primary commerce CTAs, promotions, urgency.
- `--ac-blue: #0875F5` — secondary actions, information, navigation.
- `--ac-green: #12A56B` — stock, success, availability, verified states.
- `--ac-amber: #FFA51F` — rating, attention, savings highlight.
- `--ac-soft-blue: #EFF7FF`
- `--ac-soft-pink: #FFF1F6`
- `--ac-white: #FFFFFF`
- `--ac-text: #0B255B`
- `--ac-muted: #64748B`
- `--ac-border: #E4EBF3`

No arbitrary per-block palette picker may undermine product-page coherence. Studio may expose approved variants only.

## 3.2 Typography

Two typography roles are mandatory:

- `display.family` — editorial serif for product title and major narrative headings.
- `ui.family` — modern highly legible sans for commerce controls, labels, prices, specs and supporting text.

Bind to the installed AngelCare design system when available. Font identity is a system token, not a random block property.

## 3.3 Radius/elevation

- primary cards: 12–16px
- key purchase panels: 16px
- editorial campaign/lifestyle panels: 18–24px
- pills/badges: full pill
- shadows: subtle; no neon/glass effect
- white canvas remains dominant

---

# 4. Desktop grid and decision architecture

Canonical desktop:

- frame: **1440px**
- max content shell: **1380px**
- outer gutter: **30px**
- base grid: **12 columns**
- standard gap: **16px**
- dense merchandising gap: **10–14px**

The approved first fold has three simultaneous decision surfaces:

1. **ProductMediaGallery** — visual confidence.
2. **ProductIdentityPanel** — identity, proof and benefit understanding.
3. **PurchaseDecisionBox** — price, availability, variant, quantity and conversion.

Do not collapse these into one generic two-column commerce block at desktop.

---

# 5. Inch-by-inch root section map

| ID | Section | Reference Y | Canonical Y @1440 | Authority |
|---|---|---:|---:|---|
| P00 | Bandeau d’urgence commercial | 0–25px | 0–39px | `campaign` |
| P01 | Header marque + recherche + compte/favoris/panier | 25–70px | 39–108px | `navigation+identity` |
| P02 | Navigation univers/catégories | 70–91px | 108–140px | `taxonomy` |
| P03 | Fil d’Ariane canonique | 91–115px | 140–177px | `navigation` |
| P04 | Galerie média produit + miniatures | 115–474px | 177–730px | `catalog.media` |
| P05 | Identité produit + badges + preuve + bénéfices | 115–474px | 177–730px | `catalog.item` |
| P06 | Prix + stock + variante + quantité + achat | 115–474px | 177–730px | `commerce` |
| P07 | Livraison + familles + paiement + retours + support | 474–544px | 730–838px | `trust` |
| P08 | Bannière lifestyle + bénéfices produit | 544–684px | 838–1053px | `editorial+catalog` |
| P09 | Navigation ancrée description/caractéristiques/avis/FAQ | 684–716px | 1053–1103px | `navigation` |
| P10 | Description longue + média éditorial | 716–1034px | 1103–1592px | `content+catalog` |
| P11 | Tableau de caractéristiques techniques | 716–1034px | 1103–1592px | `catalog.specs` |
| P12 | Note agrégée + avis clients | 716–1034px | 1103–1592px | `reviews` |
| P13 | Questions fréquentes produit | 716–1034px | 1103–1592px | `faq` |
| P14 | Souvent achetés ensemble | 1034–1228px | 1592–1891px | `recommendation+cart` |
| P15 | Accessoires compatibles | 1034–1228px | 1592–1891px | `recommendation` |
| P16 | Produits similaires | 1034–1228px | 1592–1891px | `recommendation` |
| P17 | Conseils & inspirations pour parents | 1228–1399px | 1891–2155px | `content` |
| P18 | Communauté AngelCare | 1228–1399px | 1891–2155px | `community` |
| P19 | Mission/raison d’être produit | 1228–1399px | 1891–2155px | `brand` |
| P20 | Preuves de confiance finales | 1399–1472px | 2155–2267px | `trust` |
| P21 | Footer complet + app + newsletter + légal | 1472–1683px | 2267–2592px | `navigation+brand` |


The top decision fold intentionally contains P04/P05/P06 in parallel at the same Y range. They are separate governed sections/components sharing one desktop composition.

---

# 6. Exact desktop geometry anchors

These are implementation anchors extracted from the approved visual. They define the major rectangles; internal optical tuning may vary only within the visual-lock tolerance.

| Geometry ID | Parent | Ref X | Ref Y | Ref W | Ref H | 1440 X | 1440 Y | 1440 W | 1440 H |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| D00 | P00 | 0 | 0 | 935 | 25 | 0 | 0 | 1440 | 39 |
| D01 | P01 | 0 | 25 | 935 | 45 | 0 | 39 | 1440 | 69 |
| D02 | P02 | 0 | 70 | 935 | 21 | 0 | 108 | 1440 | 32 |
| D03 | P03 | 20 | 91 | 895 | 24 | 31 | 140 | 1378 | 37 |
| D04_MEDIA_RAIL | P04 | 20 | 115 | 61 | 359 | 31 | 177 | 94 | 553 |
| D04_MAIN_MEDIA | P04 | 86 | 115 | 332 | 359 | 132 | 177 | 511 | 553 |
| D05_IDENTITY | P05 | 427 | 115 | 231 | 359 | 658 | 177 | 356 | 553 |
| D06_PURCHASE | P06 | 671 | 115 | 244 | 359 | 1033 | 177 | 376 | 553 |
| D07 | P07 | 20 | 474 | 895 | 70 | 31 | 730 | 1378 | 108 |
| D08 | P08 | 20 | 544 | 895 | 140 | 31 | 838 | 1378 | 216 |
| D09 | P09 | 20 | 684 | 895 | 32 | 31 | 1053 | 1378 | 49 |
| D10_DESC | P10 | 20 | 716 | 309 | 318 | 31 | 1103 | 476 | 490 |
| D11_SPECS | P11 | 339 | 716 | 194 | 318 | 522 | 1103 | 299 | 490 |
| D12_REVIEWS | P12 | 543 | 716 | 183 | 318 | 836 | 1103 | 282 | 490 |
| D13_FAQ | P13 | 736 | 716 | 179 | 318 | 1134 | 1103 | 276 | 490 |
| D14_BUNDLE | P14 | 20 | 1034 | 309 | 194 | 31 | 1592 | 476 | 299 |
| D15_ACCESSORIES | P15 | 339 | 1034 | 287 | 194 | 522 | 1592 | 442 | 299 |
| D16_SIMILAR | P16 | 636 | 1034 | 279 | 194 | 980 | 1592 | 430 | 299 |
| D17_GUIDES | P17 | 20 | 1228 | 385 | 171 | 31 | 1891 | 593 | 263 |
| D18_COMMUNITY | P18 | 415 | 1228 | 219 | 171 | 639 | 1891 | 337 | 263 |
| D19_MISSION | P19 | 644 | 1228 | 271 | 171 | 992 | 1891 | 417 | 263 |
| D20 | P20 | 20 | 1399 | 895 | 73 | 31 | 2155 | 1378 | 112 |
| D21 | P21 | 0 | 1472 | 935 | 211 | 0 | 2267 | 1440 | 325 |


**Visual-lock rule:** a future build may not use these coordinates as absolute CSS positioning. They are certification geometry for grid/flex composition and screenshot comparison. The implementation must remain responsive and semantic.

---

# 7. Root section contracts

## P00 — UrgencyCampaignBar

**Visual intent:** full-width hot-pink strip. Message left/center, real campaign timer capsule, optional CTA.

**Slots**
- campaign reference
- approved message
- valid discount/benefit claim
- `startsAt`
- `endsAt`
- CTA
- territory/locale

**Truth guard**
- timer only from real end date
- no resetting countdown
- no synthetic urgency
- expired campaign hides or resolves governed fallback

**Mobile**
- one or two text lines maximum
- timer remains readable
- no marquee required
- reduced-motion safe

---

## P01 — CommerceHeader

### Visible atoms
- official AngelCare logo
- global search
- support phone/service utility
- account
- favorites
- cart + live count
- partner CTA

### Behavior
- global search suggestions
- auth-aware account state
- live wishlist/cart count
- sticky/compact after configured scroll threshold
- keyboard navigable
- mobile collapses to icon-led header

### Governance
Page authors cannot replace official branding or create arbitrary account/cart destinations.

---

## P02 — PrimaryTaxonomyNav

Uses canonical navigation/taxonomy authority. Labels and destinations must not be duplicated as orphan arrays in the PDP recipe.

Desktop: horizontal row with dropdown/mega-menu capability.  
Mobile: quick category row/rail below search, as shown in M-A.

---

## P03 — BreadcrumbTrail

Canonical ancestry only.

Example visual role:
`Accueil → Sorties et voyage → Poussettes → [Produit]`

Rules:
- schema-aware
- locale-aware
- current item non-clickable
- structured data may be emitted by public runtime if existing SEO authority supports it

---

## P04 — ProductMediaGallery

### Desktop anatomy
- vertical thumbnail rail
- primary large media
- overflow tile `+N`
- optional media count
- zoom/lightbox
- video/360 only when actual asset exists

### Data
- canonical item media
- selected variant media takes precedence when authoritative
- editorial image order may be curated without copying URLs as product truth

### States
- no media → governed placeholder from design system
- one media → no fake thumbnails
- video loading failure → image fallback
- inaccessible media → omit safely

### Accessibility
- alt from media/entity metadata
- thumbnail buttons with meaningful labels
- keyboard gallery navigation
- zoom not required to access essential product information

---

## P05 — ProductIdentityPanel

This block explains **what it is, why it matters and why to trust it**.

### Atoms
- real merchandising badge
- promotion badge if valid
- product title
- brand/vendor byline
- rating summary
- review count
- approved real sales proof
- short descriptor
- benefit checklist
- 4 feature proof cells

### Rules
- no fake bestseller
- no fake sales count
- no fabricated rating
- no invented certification
- title and merchant/brand remain live-bound

On mobile, this content follows the gallery and precedes price/purchase controls.

---

## P06 — PurchaseDecisionBox

This is the primary transaction authority surface.

### Price cluster
- compare-at price
- current price
- savings amount/percentage
- currency `MAD` / `Dhs`

### Availability
- in stock
- low stock
- out of stock
- preorder
- unavailable territory
- variant unavailable

### Fulfillment
- delivery destination/territory
- estimate
- free-delivery eligibility if real
- pickup if canonical authority supports it

### Variant selector
- color/media swatches
- option labels
- selected state
- unavailable combinations disabled

### Quantity
- minus
- current value
- plus
- bounded by stock/order policy

### CTAs
1. `Ajouter au panier`
2. `Acheter maintenant`
3. `Demander conseil`
4. `Ajouter aux favoris`

### Trust cluster
- secure payment
- returns
- refund policy
- support

### Transaction safety
Before mutation, canonical price/availability is revalidated by the existing commerce authority. The display state is not transaction authority.

### Mobile
Primary price + add-to-cart + buy-now are repeated in a **sticky bottom purchase bar** once the main purchase panel scrolls away.

---

## P07 — AssuranceProofStrip

Compact evidence cells, such as:
- delivery throughout Morocco
- family/customer reach
- secure payment
- returns
- support

Numeric claims appear only when approved/live.

This strip is not allowed to become decorative fake social proof.

---

## P08 — LifestyleBenefitBanner

Full-width narrative bridge between decision fold and deep detail.

### Composition
- lifestyle media left
- editorial headline
- 4 benefit pictograms
- lifestyle media right
- handwritten-brand accent where part of approved visual language

### Purpose
Translate technical features into parent-facing use cases without replacing technical specification authority.

### Data ownership
Media and editorial copy can be page-managed; factual product benefits should bind to the item/schema when available.

---

## P09 — ProductAnchorTabs

Desktop sticky-capable anchor tabs:
- Description
- Caractéristiques
- Avis
- Questions fréquentes

Requirements:
- active section tracking
- keyboard
- no duplicated page route
- smooth scroll disabled/reduced when user requests reduced motion

Mobile may omit visible tab rail if the continuous content hierarchy remains obvious; optional compact sticky jump menu is allowed.

---

## P10 — ProductDescription

### Visible content
- title
- canonical/editorial long description
- lifestyle media
- use-case icon row

### Rules
- source text can be edited only according to owning authority
- merchant/manufacturer factual claims remain governed
- no hidden SEO text blocks
- rich text sanitized
- no executable HTML

---

## P11 — TechnicalSpecifications

Schema-mapped specification table.

### Required behavior
- key/value rows
- stable keys
- localized labels
- units formatted coherently
- missing values omitted rather than invented
- variants can override applicable fields

### Example classes
- recommended age
- weight
- dimensions open/folded
- recline
- harness
- canopy
- storage
- materials
- color
- warranty

The template never hardcodes these as stroller-only schema requirements. It renders compatible available specs for the assigned product archetype.

---

## P12 — ReviewSummaryAndFeed

### Aggregate
- average rating
- star visualization
- review count
- optional distribution if authority supports it

### Review cards
- display name policy
- verified state if real
- date
- rating
- text
- approved media
- helpful/menu controls only if existing review product supports them

### Privacy
No customer PII beyond existing published review policy.

### Empty state
No fake testimonials. Render `Aucun avis publié` or governed empty state.

---

## P13 — ProductFAQ

Accessible accordion.

Sources:
- canonical product FAQ
- category/schema FAQ
- approved page-managed FAQ where allowed

Behavior:
- one or multiple open according to design-system choice
- semantic buttons
- keyboard support
- no hidden content inaccessible to screen readers

---

## P14 — BundleCrossSell

**“Souvent achetés ensemble”**

### Composition
- focal current product
- 1–N compatible complementary items
- `+` visual relationship
- current per-item prices
- combined governed price
- savings only if legitimate
- `Ajouter le pack`

### Authority
If there is no canonical bundle engine, do **not** invent a shadow bundle entity. Use a curated compatible set and add items to cart transactionally, while wording remains accurate.

### Validation
All items and prices revalidated before cart mutation.

---

## P15 — CompatibleAccessories

Dynamic/curated canonical accessory relationships.

Each card:
- media
- title
- current price
- optional valid discount
- favorite
- quick add

Compatibility claim itself must come from real relationship authority or approved curation. Do not infer compatibility from category alone when safety/function depends on exact fit.

---

## P16 — SimilarProducts

Dynamic recommendation shelf.

Potential strategies:
- same category
- same experience schema
- compatible price band
- merchandising recommendation
- curated alternatives

No arbitrary client-side similarity algorithm in the template.

---

## P17 — ParentGuideRail

Editorial help surface.

Cards:
- media
- title
- topic
- optional reading time
- structured content navigation

The goal is decision support, not fake commerce pressure.

---

## P18 — CommunityJoinPanel

- governed parent/community imagery
- proposition
- membership/community CTA
- optional count only if approved/live

No fabricated community-size counters.

---

## P19 — MissionBrandPanel

Editorial mission block tied to the product context.

- family/product media
- brand statement
- official logo or mark where approved
- no unsupported commercial claims

This block protects AngelCare emotional identity without becoming a second trust-fact store.

---

## P20 — SecondaryTrustStrip

Final reassurance before footer.

May include:
- secure payment
- delivery
- returns
- support
- family reach
- satisfaction guarantee where policy legitimately supports it

All claims governed.

---

## P21 — MegaCommerceFooter

Required zones:
- official logo
- social channels
- product/service universes
- help/contact
- about/company
- app badges
- newsletter
- legal
- copyright
- closing brand statement

Links resolve through canonical navigation/configuration.

---

# 8. Component registry

Every visible atom must have a stable component contract.

| Parent | Component | Contract |
|---|---|---|
| P00 | `UrgencyCampaignBar` | campaign message, discount claim, real endsAt, CTA, market |
| P01 | `OfficialLogoSlot` | immutable official logo crop/mask only |
| P01 | `GlobalSearch` | query input, suggestions, submit action |
| P01 | `AccountShortcut` | auth-aware account entry |
| P01 | `FavoritesShortcut` | wishlist entry + live count |
| P01 | `CartShortcut` | cart entry + live item count |
| P02 | `TaxonomyNavItem` | canonical category/navigation reference |
| P03 | `BreadcrumbItem` | canonical navigable ancestry |
| P04 | `GalleryThumbnailRail` | ordered media thumbnails |
| P04 | `PrimaryProductMedia` | image/video with focal point + zoom |
| P04 | `GalleryOverflowTile` | +N additional media trigger |
| P05 | `MerchandisingBadge` | best-seller/new/promo states from real authority |
| P05 | `ProductTitle` | canonical title |
| P05 | `BrandByline` | canonical brand/vendor identity |
| P05 | `RatingSummary` | real aggregate rating and review count |
| P05 | `SalesProof` | real sales metric only when governed |
| P05 | `BenefitChecklist` | authoritative product benefits |
| P05 | `FeatureIconGrid` | 4 compact benefit/spec proof cells |
| P06 | `CompareAtPrice` | legitimate historical/reference price only |
| P06 | `CurrentPrice` | MAD/Dhs only |
| P06 | `SavingsBadge` | computed from valid promotion |
| P06 | `StockState` | inventory/availability truth |
| P06 | `DeliveryPromise` | shipping authority |
| P06 | `VariantSelector` | canonical variant/color options |
| P06 | `QuantityStepper` | bounded quantity |
| P06 | `AddToCartCTA` | P03 cart.add |
| P06 | `BuyNowCTA` | P03 checkout.start/buy_now |
| P06 | `AdviceCTA` | P03 contact/advice workflow |
| P06 | `FavoriteCTA` | wishlist toggle |
| P06 | `PurchaseTrustGrid` | payment, returns, refund, support |
| P07 | `TrustProofItem` | icon + approved proof copy |
| P08 | `LifestyleMediaLeft` | governed editorial media |
| P08 | `BenefitPictogram` | benefit icon + label |
| P08 | `LifestyleMediaRight` | governed editorial media |
| P09 | `AnchorTab` | scroll target + active state |
| P10 | `DescriptionCopy` | canonical/editorial description |
| P10 | `DescriptionMedia` | governed product lifestyle media |
| P10 | `UseCaseIconRow` | contextual use-case benefits |
| P11 | `SpecificationTable` | key/value specs with schema mapping |
| P12 | `ReviewAggregate` | rating, distribution, count |
| P12 | `ReviewCard` | verified review content + media if approved |
| P13 | `FAQAccordion` | question + answer + accessible expand |
| P14 | `BundleComposer` | main item + compatible items + computed bundle |
| P14 | `BundlePricePanel` | valid bundle saving + add pack |
| P15 | `AccessoryCard` | canonical accessory recommendation |
| P16 | `SimilarProductCard` | canonical related item |
| P17 | `GuideCard` | approved editorial content reference |
| P18 | `CommunityMediaMosaic` | governed community imagery |
| P18 | `CommunityJoinCTA` | community/newsletter workflow |
| P19 | `MissionStatement` | brand statement |
| P19 | `MissionMedia` | governed family/product image |
| P20 | `TrustProofItem` | secondary assurance cell |
| P21 | `OfficialFooterLogo` | immutable official logo |
| P21 | `FooterNavGroup` | canonical navigation group |
| P21 | `AppBadgeGroup` | approved store badges |
| P21 | `NewsletterForm` | canonical consent + newsletter workflow |
| P21 | `LegalLinks` | canonical legal navigation |


A renderer may internally compose smaller atoms, but these public authoring/runtime contracts remain stable across revisions unless P13 compatibility policy explicitly permits migration.

---

# 9. Asset registry doctrine

Every visible asset belongs to one of these classes.

## A. Immutable brand assets
- official AngelCare logo
- approved app-store badges
- approved social icons

No arbitrary replacement in page authoring.

## B. Product-owned media
- primary product media
- thumbnail media
- variant media
- approved product video/360

Owned by canonical catalog/media authority.

## C. Governed editorial media
- lifestyle family photography
- community imagery
- mission imagery
- article thumbnails

Selected via Media Vault and may define focal points/mobile crops.

## D. Dynamic recommendation media
- accessory cards
- similar products
- bundle components

Always pulled from referenced canonical entities.

## E. UI iconography
- shipping
- payment
- return
- support
- heart
- cart
- share
- quantity
- benefits

One approved icon system and consistent token sizes.

---

# 10. Source and binding contract

The PDP recipe must resolve through existing source registry descriptors rather than inventing a parallel source layer.

Required authority families:

- catalog item
- product variants/options
- catalog media
- inventory/availability
- pricing/promotions
- shipping/fulfillment
- reviews
- FAQ/content
- compatibility/relationships
- recommendations/merchandising
- editorial guides
- community/newsletter
- app/store link configuration
- canonical navigation

Admin UX must use friendly pickers/inspectors. Raw IDs are not the default UX.

---

# 11. Structured action contract

Required structured behaviors:

- `product.open_media`
- `cart.add`
- `checkout.start`
- `wishlist.toggle`
- `support.ask_advice`
- `share.open`
- `variant.select`
- `quantity.change`
- `bundle.add`
- `recommendation.open`
- `review.open_all`
- `faq.toggle`
- `community.join`
- `newsletter.subscribe`
- `appstore.open`

Actions that create or mutate business state must delegate to the existing Marketplace authority/workflow. Studio never creates a shadow cart/order/wishlist/inquiry database.

---

# 12. Price, promotion and urgency constitution

## Currency
Customer-facing price representation is **MAD / Dhs only** for this Moroccan AngelCare market.

## Compare-at pricing
Visible only when legitimate and supported by current pricing/promotion authority.

## Savings
Derived from canonical price facts. Do not persist independent discount truth in the template.

## Stock urgency
- `En stock`
- `Plus que X articles`
- `Stock limité`
- out-of-stock

Only from inventory/availability authority.

## Bestseller / New / Popular
Only from the corresponding merchandising rule or approved source.

## Countdown
Only from real campaign dates. No randomized/resetting timer.

---

# 13. Mobile constitution

The approved mobile sample is not a squeezed desktop. The production mobile PDP is authored as one continuous sequence optimized for one-thumb commerce.

## Core mobile sequence

1. urgency
2. compact header
3. persistent search
4. quick universe/category rail
5. breadcrumb
6. product gallery
7. product title/rating/sales proof
8. short description
9. price + savings
10. stock + delivery
11. variant selector
12. quantity
13. add-to-cart
14. buy-now
15. favorite/share
16. purchase trust
17. lifestyle teaser
18. benefits
19. specs
20. reviews
21. community
22. accessories
23. bundle
24. similar
25. FAQ
26. guides
27. app/trust
28. footer where appropriate

## Sticky purchase bar

Once the primary price/purchase cluster is above the viewport, show persistent bottom bar containing:

- current price
- optional compare-at price
- `Ajouter au panier`
- `Acheter maintenant`

Rules:
- respect safe-area inset
- must not cover content
- hidden/disabled when purchase unavailable
- variant required state handled clearly
- no duplicate mutation on double tap
- keyboard/input focus can temporarily dismiss where necessary

## Reference panel M-A — Top / achat

Required visible patterns:
- urgency
- compact logo/header
- search
- quick categories
- breadcrumb
- dominant media
- badge overlays
- thumbnail rail
- title/rating
- price/savings
- stock
- shipping
- variants
- quantity
- primary purchase CTAs
- trust icons
- lifestyle teaser

## Reference panel M-B — Milieu / preuve

Required:
- benefit checklist
- 4 proof icons
- loyalty/value card
- product description
- specification table
- review summary/cards
- community/lifestyle card

## Reference panel M-C — Bas / cross-sell

Required:
- compatible accessories
- bundle
- similar products
- FAQ
- guides
- app promotion
- trust icons

---

# 14. Responsive rules beyond mobile

## Desktop >=1280
Match approved three-column decision fold and high-density downstream composition.

## Laptop 1024–1279
- gallery remains dominant
- identity and purchase preserve reading order
- detail quadrants may become 2×2
- cross-sell remains 3 zones where space permits

## Tablet 768–1023
- gallery full/major width
- price/purchase surfaced early
- identity details integrated
- specs/reviews/FAQ stack
- recommendations use horizontal rails
- no sidebar hidden behind hover

## Mobile <=767
Dedicated composition described above.

No breakpoint may:
- remove required transaction information,
- hide price/stock,
- rely on hover,
- introduce horizontal page overflow.

---

# 15. Runtime state matrix

Every dynamic component must support explicit states.

## Global
- `LOADING`
- `READY`
- `PARTIAL`
- `EMPTY`
- `ERROR`
- `POLICY_BLOCKED`
- `FALLBACK_NATIVE`

## Purchase
- `IN_STOCK`
- `LOW_STOCK`
- `OUT_OF_STOCK`
- `PREORDER`
- `UNAVAILABLE_TERRITORY`
- `VARIANT_UNAVAILABLE`

## Promotion
- `ACTIVE`
- `SCHEDULED`
- `EXPIRED`
- `INELIGIBLE`

## Reviews
- `AVAILABLE`
- `NO_REVIEWS`
- `HIDDEN_BY_POLICY`

No raw internal error messages may reach customers.

---

# 16. Admin authoring contract

## Page-level controls
- world/revision
- locale
- territory
- audience
- header variant
- density token
- mobile sticky purchase policy
- default empty policy

## Product context
Ordinary page authoring should not require typing an item ID. The assigned item comes from P04 resolution or canonical picker.

## Section controls
- visible/hidden
- heading/subheading
- editorial media
- source mode
- dynamic strategy
- curated canonical refs
- count/limit
- CTA
- responsive presentation
- empty/fallback policy

## Business-fact restrictions
The editor may display current:
- price
- stock
- rating
- delivery
- variant

but cannot override them as local page truth unless the owning canonical system explicitly allows editing through its proper workflow.

---

# 17. P04 template assignment behavior

This Product Page World must be assignable using the existing precedence:

`EXACT_ITEM > PLACEMENT > COLLECTION > EXPERIENCE_SCHEMA > CATEGORY > FAMILY > MARKETPLACE_DEFAULT`

Examples:
- exact stroller → this template
- stroller category → this template
- baby equipment family → this template
- global Marketplace fallback → another template

Public runtime uses published template revisions only.

Missing/unpublished/incompatible assignment falls through safely to the next level or Category-Native.

---

# 18. Dynamic source recipes

P06 can power:

- compatible accessories
- similar products
- best alternatives
- editorial guides
- related collections

Recipes must use allowlisted filters/sorts and bounded counts.

Examples:
- compatibility relationship
- category + published
- collection membership
- same experience schema
- merchandising strategy
- curated canonical references

No arbitrary SQL/query text from the authoring UI.

---

# 19. Accessibility

Mandatory:
- semantic heading order
- landmark roles
- breadcrumb semantics
- gallery buttons
- visible keyboard focus
- all purchase controls keyboard-operable
- variant swatches with text equivalents
- quantity control accessible name/state
- star rating has text equivalent
- FAQ semantic disclosure
- error/state announcements appropriate but non-spammy
- minimum touch target 44px
- WCAG AA contrast target
- reduced motion
- sticky bar not blocking zoom/focus
- alt text from governed media metadata

---

# 20. Performance

## Above the fold
- primary media/LCP prioritized
- exact responsive sizes/srcset
- no eager loading of all gallery images

## Below the fold
- lazy-load editorial/recommendation media
- bounded recommendation counts
- no duplicate source queries where P12 cache applies
- reserve card/media dimensions to prevent CLS
- reviews may paginate/lazy-load
- no giant one-component rerender

## Interaction
- variant selection must not rerender the entire page
- cart mutation feedback must be immediate but server-authoritative
- sticky mobile bar must be lightweight

Admin preview may bypass public caches according to existing P12 doctrine.

---

# 21. SEO / discoverability contract

Use existing public SEO authority if present.

PDP should support:
- canonical URL
- localized title/description
- product structured data only from real facts
- breadcrumb structured data
- review aggregate only when valid
- availability only when valid
- no fabricated schema data
- OpenGraph media from governed product media

The Studio recipe must not become a second SEO authority if canonical Marketplace SEO already exists.

---

# 22. Analytics and attribution

Stable telemetry independent of visible copy:

- `pdp_view`
- `gallery_media_view`
- `gallery_zoom`
- `variant_select`
- `quantity_change`
- `add_to_cart`
- `buy_now`
- `wishlist_toggle`
- `advice_start`
- `review_impression`
- `review_open_all`
- `faq_open`
- `bundle_impression`
- `bundle_add`
- `accessory_impression`
- `accessory_add`
- `similar_impression`
- `similar_click`
- `guide_click`
- `community_join`
- `app_store_click`
- `newsletter_submit`

P09 origin attribution must preserve:
- page/template/revision
- block/interaction
- item
- collection/placement context
- campaign/audience/territory where applicable

Analytics is observational, never business authority.

---

# 23. Security / trust

- no raw executable HTML
- no `eval`
- no `new Function`
- no unsafe imported scripts
- no business authority in localStorage/sessionStorage
- permission-aware source resolution
- policy fail-closed
- external links constrained by existing safe-link policy
- cart/checkout cannot trust display price
- publish/preview permissions remain governed
- sensitive customer data never enters page config

---

# 24. Surgical upgradeability

The world must be upgradeable at five levels:

1. **Token patch** — typography/color/radius/spacing.
2. **Atom patch** — e.g. QuantityStepper v2.
3. **Component patch** — e.g. ProductCard or ReviewCard v2.
4. **Section patch** — e.g. replace P14 bundle shelf only.
5. **World revision** — new Product Page Pro Max revision without silently mutating already-published revision.

Stable IDs and contract changes follow P13:
- `PATCH_SAFE`
- `MIGRATION_REQUIRED`
- `BREAKING_FORBIDDEN`

---

# 25. Product archetype portability

The approved sample is a stroller, but the build must not secretly hardcode stroller-specific rendering.

The recipe defines reusable slots and schema-driven specs.

For another product:
- gallery changes
- title changes
- benefits change
- specs change
- variants change
- accessories change
- recommendations change

while the Product Page World architecture remains reusable.

Stroller-specific copy appears only as preview/default editorial content, never as immutable code assumptions.

---

# 26. Build component tree

```text
ProductPageProMaxWorld01
├── P00 UrgencyCampaignBar
├── P01 CommerceHeader
│   ├── OfficialLogoSlot
│   ├── GlobalSearch
│   ├── AccountShortcut
│   ├── FavoritesShortcut
│   └── CartShortcut
├── P02 PrimaryTaxonomyNav
├── P03 BreadcrumbTrail
├── DecisionFold
│   ├── P04 ProductMediaGallery
│   │   ├── GalleryThumbnailRail
│   │   ├── PrimaryProductMedia
│   │   └── GalleryOverflowTile
│   ├── P05 ProductIdentityPanel
│   │   ├── MerchandisingBadge
│   │   ├── ProductTitle
│   │   ├── RatingSummary
│   │   ├── BenefitChecklist
│   │   └── FeatureIconGrid
│   └── P06 PurchaseDecisionBox
│       ├── CurrentPrice
│       ├── CompareAtPrice
│       ├── StockState
│       ├── DeliveryPromise
│       ├── VariantSelector
│       ├── QuantityStepper
│       ├── AddToCartCTA
│       ├── BuyNowCTA
│       ├── AdviceCTA
│       ├── FavoriteCTA
│       └── PurchaseTrustGrid
├── P07 AssuranceProofStrip
├── P08 LifestyleBenefitBanner
├── P09 ProductAnchorTabs
├── DetailMatrix
│   ├── P10 ProductDescription
│   ├── P11 TechnicalSpecifications
│   ├── P12 ReviewSummaryAndFeed
│   └── P13 ProductFAQ
├── MerchandisingMatrix
│   ├── P14 BundleCrossSell
│   ├── P15 CompatibleAccessories
│   └── P16 SimilarProducts
├── P17 ParentGuideRail
├── P18 CommunityJoinPanel
├── P19 MissionBrandPanel
├── P20 SecondaryTrustStrip
└── P21 MegaCommerceFooter

MobileOnlyRuntimeLayer
└── StickyPurchaseBar
```

---

# 27. Final build acceptance gates

The official build is not complete because files exist or TypeScript transpiles.

It passes only when:

```text
REFERENCES
DESKTOP_REFERENCE_SHA=PASS
MOBILE_REFERENCE_SHA=PASS
OFFICIAL_LOGO_PROVENANCE=PASS

STRUCTURE
PRODUCT_PAGE_WORLD_REGISTERED=PASS
ROOT_SECTIONS=22
ALL_ROOT_SECTIONS_EDITABLE=PASS
NO_MONOLITHIC_BLACK_BOX=PASS
PUCK_ROUNDTRIP=PASS

DESKTOP
THREE_COLUMN_DECISION_FOLD=PASS
GALLERY_GEOMETRY=PASS
IDENTITY_GEOMETRY=PASS
PURCHASE_BOX_GEOMETRY=PASS
LIFESTYLE_BAND=PASS
DETAIL_4_ZONE_MATRIX=PASS
MERCHANDISING_3_ZONE_MATRIX=PASS
FOOTER=PASS
MAJOR_LAYOUT_DEVIATION<=2%

MOBILE
ONE_CONTINUOUS_PDP=PASS
M_A_TOP_STATE=PASS
M_B_MIDDLE_STATE=PASS
M_C_LOWER_STATE=PASS
STICKY_PURCHASE_BAR=PASS
NO_HORIZONTAL_OVERFLOW=PASS
TOUCH_TARGETS>=44PX
NO_DESKTOP_SQUEEZE=PASS

COMMERCE
MAD_DHS_ONLY=PASS
PRICE_CANONICAL=PASS
STOCK_CANONICAL=PASS
VARIANT_CANONICAL=PASS
DELIVERY_CANONICAL=PASS
REVIEWS_CANONICAL=PASS
FAKE_PRICE=0
FAKE_STOCK=0
FAKE_RATING=0
FAKE_SALES_PROOF=0
FAKE_URGENCY=0

ACTIONS
ADD_TO_CART=PASS
BUY_NOW=PASS
WISHLIST=PASS
ADVICE=PASS
BUNDLE_ADD=PASS
ACCESSORY_ADD=PASS
RECOMMENDATION_OPEN=PASS

PLATFORM
P04_ASSIGNMENT=PASS
P05_BINDINGS=PASS
P06_DYNAMIC=PASS
P08_RUNTIME=PASS
P09_ATTRIBUTION=PASS
P11_FAIL_CLOSED=PASS
P12_INVALIDATION=PASS
P13_STABLE_IDS=PASS
CATEGORY_NATIVE_FALLBACK=PASS

QUALITY
KEYBOARD=PASS
SCREEN_READER=PASS
REDUCED_MOTION=PASS
LOADING_EMPTY_ERROR_STATES=PASS
PERFORMANCE_BUDGET=PASS
PREVIEW_PUBLIC_PARITY=PASS
```

Only then:

`ANGELCARE_PRODUCT_PAGE_PRO_MAX_WORLD01_FINAL_CERTIFICATION=PASS`

---

# 28. Final doctrine

This approved product page is hereby treated as a **governed Product Page World**, not inspiration.

The build target is the visual design **plus**:

- canonical product truth,
- variant and purchase authority,
- action/workflow consequences,
- responsive composition,
- mobile sticky commerce,
- recommendation logic,
- asset provenance,
- accessibility,
- analytics/attribution,
- runtime state behavior,
- dependency invalidation,
- safe fallback,
- and future surgical upgradeability.

That is the difference between a pretty PDP mockup and a production-grade AngelCare commerce operating surface.
