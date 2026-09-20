# ANGELCARE MEGA HOME WORLD 01 — FULL X-RAY BLUEPRINT

**Status:** APPROVED VISUAL WORLD → BUILD CONSTITUTION
**World ID:** `ac.home.family.hypercommerce.01`
**Type:** `FULL_PAGE_WORLD`
**Reference:** approved desktop visual `page_d_accueil_angelcare_famille_bébé.png`
**Reference frame:** 841 × 1870 px
**Canonical implementation frame:** 1440 × ~3202 px
**Primary purpose:** a dense, living AngelCare marketplace homepage combining services, products, Academy, B2B, content, trust, community and conversion without duplicating business truth.

---

## 1. Constitutional rule

This world is **not one flattened screenshot** and **not one black-box component**. It is a full Puck page tree composed of independently editable first-class sections and cards. Dragging/applying the world loads the complete page, but every child remains selectable, movable, duplicable, configurable and removable.

Default insertion mode: **Replace page**. Alternate mode: **Insert entire composition at cursor**. Before replacement, Studio must show a preview/diff and require explicit confirmation.

The template stores **layout, design, copy defaults, recipes and canonical references**. It never stores shadow copies of live prices, stock, booking availability, reviews, Academy capacity, customer records, service provider facts or other mutable business facts.

---

# 2. Brand constitution

## 2.1 Official logo

`brand.logo.primary` and `brand.logo.footer` must use the **official user-supplied Angel Care asset**. The build may crop/mask the source to remove **“Corporate Care”** and its yellow underline, but must never redraw, recolor, approximate or regenerate the ANGEL CARE wordmark or geometric symbols.

Required logo variants:

- `brand.logo.primary.horizontal` — header, full-color on white.
- `brand.logo.footer.horizontal` — footer, full-color on white.
- `brand.logo.compact` — mobile/sticky header only if derived from the same approved artwork.

No AI-generated logo replacement is acceptable in production.

## 2.2 Core color tokens

- `--ac-navy: #092E73` — headings, trust, navigation, serious actions.
- `--ac-pink: #FF2D6F` — primary commerce CTA, urgency, sales.
- `--ac-blue: #0875F5` — discovery/navigation/action accents.
- `--ac-green: #12A56B` — availability, success, B2B/service trust.
- `--ac-amber: #FFA51F` — rating, scarcity, highlights.
- `--ac-soft-blue: #EFF7FF`
- `--ac-soft-pink: #FFF1F6`
- `--ac-white: #FFFFFF`
- `--ac-text: #0B255B`
- `--ac-muted: #64748B`
- `--ac-border: #E4EBF3`

## 2.3 Typography

Two roles, never one generic font everywhere:

- `display.family`: premium editorial serif used for hero/mission statements.
- `ui.family`: highly legible modern sans for navigation, prices, cards, controls and labels.

The production implementation should bind to the approved/installed AngelCare brand typography. If no brand font is registered, font choice becomes a design-system decision, not a per-block setting.

## 2.4 Shape and elevation

- Primary cards: 12–16 px radius.
- Promotional feature cards: 16–24 px radius.
- Pills/badges: full pill radius.
- Shadows: soft, low-spread, never glassy/neon.
- White canvas dominates; color appears through merchandising zones, media and CTAs.

---

# 3. Desktop frame and grid

Canonical desktop artboard: **1440 px** wide, approximately **3202 px** tall for this world.

- Max content shell: 1360 px.
- Outer gutter: 40 px.
- Grid: 12 columns.
- Column gap: 16 px.
- Standard section gap: 18 px.
- Dense card gap: 10–14 px.
- Content rhythm: no long dead zones; almost every viewport should expose the next commercial/discovery affordance.

The approved 841×1870 visual is the visual truth. The canonical 1440 frame is a proportional implementation frame, not permission to redesign the composition.

---

# 4. Inch-by-inch section map

The Y coordinates below are extracted from the approved reference. `reference` = 841×1870 image; `canonical` = proportional 1440px implementation frame.

| ID | Section | Reference Y | Canonical Y | Contract |
|---|---|---:|---:|---|
| S00 | Urgency Bar | 0–28 | 0–48 | Live campaign urgency |
| S01 | Commerce Header | 28–78 | 48–134 | Logo/search/account/favorites/cart |
| S02 | Primary Nav | 78–95 | 134–163 | Canonical taxonomy navigation |
| S03 | Hero Family Commerce | 95–316 | 163–541 | Editorial hero + family image + CTA/community card |
| S04 | Trust Proof Strip | 316–358 | 541–613 | Delivery/payment/returns/support proof |
| S05 | Category Icon Rail | 358–414 | 613–709 | 12 quick-entry universe tiles |
| S06 | Promo Triptych | 414–493 | 709–844 | 3 campaign/editorial promos |
| S07 | Flash Deals Shelf | 493–676 | 844–1157 | 6 dense commerce cards + real countdown |
| S08 | Services This Week | 676–820 | 1157–1404 | service cards + human-help aside |
| S09 | Packs + Best Sellers | 820–970 | 1404–1661 | two commercial shelves |
| S10 | Academy Urgency | 970–1130 | 1661–1935 | training cards + capacity urgency + Academy banner |
| S11 | B2B Sector Solutions | 1130–1235 | 1935–2115 | sector tiles + quote CTA |
| S12 | Guides + Experts | 1235–1350 | 2115–2312 | content cards + expert profiles |
| S13 | Collections + New Arrivals | 1350–1475 | 2312–2526 | thematic collections + newest catalog |
| S14 | Community + App + Welcome Offer | 1475–1594 | 2526–2729 | engagement, app, first-order campaign |
| S15 | Commitments + Trust Marks | 1594–1668 | 2729–2856 | brand commitments + approved partner/trust logos |
| S16 | FAQ + Testimonial + Mission | 1668–1786 | 2856–3058 | reassurance and brand mission |
| S17 | Mega Footer | 1786–1870 | 3058–3202 | navigation/social/apps/newsletter/legal |

---

# 5. Global component anatomy

Every visual component must expose the same predictable control layers.

## 5.1 Identity

- immutable `blockId`
- component type
- display label
- contract version
- owning design system token set

## 5.2 Content

- eyebrow
- title
- subtitle/body
- badge text
- optional helper copy
- locale-aware copy variants

## 5.3 Data

- `sourceMode = dynamic | curated | mixed`
- canonical source picker
- canonical entity/collection/category/campaign reference
- filters
- sort
- limit
- audience
- territory
- schedule
- missing-data policy

## 5.4 Media

- Media Vault picker
- aspect ratio
- focal point
- object-fit policy
- alt text
- optional mobile-specific crop
- optional background/overlay

## 5.5 Action

- structured P03 action picker
- target picker
- CTA label
- primary/secondary hierarchy
- optional workflow binding
- disabled/unavailable state

## 5.6 Presentation

- density
- background variant
- columns
- card style
- gap
- alignment
- text treatment
- desktop/mobile layout variants

## 5.7 Governance

- permission visibility
- publication state
- P11 policy outcome
- attribution metadata
- P12 dependency tags

---

# 6. Section contracts

## S00 — Urgency Bar

**Visual:** full-width hot-pink strip with left campaign message and right countdown capsule.

### Slots
- `campaign.message`
- `campaign.badge`
- `campaign.endsAt`
- `campaign.cta`
- optional `campaign.icon`

### Admin
- select existing campaign
- schedule window
- audience/territory
- message override if permitted
- CTA action
- color variant from approved palette only

### Truth guard
Countdown renders only from a real `ends_at`. It disappears at expiry. “-20%”, “jusqu’à ce soir”, “stock limité”, etc. are forbidden unless supported by canonical campaign/catalog facts.

---

## S01 — Commerce Header

### Visual atoms
- official AngelCare logo
- large search field
- search submit button
- service phone/contact utility
- account icon + label
- favorites icon + label
- cart icon + live count badge

### Behavior
- sticky on scroll after hero threshold
- search suggestions from canonical discovery API
- cart count live
- keyboard accessible
- responsive compact mode

### Admin
Header is mostly global governance; page admin can choose allowed header variant but cannot replace official branding or invent arbitrary utility links.

---

## S02 — Primary Nav

Horizontal taxonomy bar. All labels/targets come from approved navigation/taxonomy configuration. Supports dropdown/mega menu if configured. Never hardcode orphan category URLs.

---

## S03 — Hero Family Commerce

### Layout
Desktop 12-column structure:
- left 4.5 columns: editorial headline, support copy, CTA
- middle 5 columns: dominant family lifestyle media
- right 2.5 columns: community/service proposition panel

### Child blocks
- `HeroEditorialCopy`
- `HeroPrimaryCTA`
- `HeroFamilyMedia`
- `HeroHandwrittenAccent`
- `HeroCommunityPanel`
- `HeroCommunityBenefitList`
- `HeroCommunityCTA`

### Media
Desktop and mobile crops are separately selectable from the same Media Vault asset family.

### Copy control
Admin may edit copy, but design hierarchy is fixed: eyebrow → H1 → support → CTA. No arbitrary font-size textarea.

---

## S04 — Trust Proof Strip

6–7 compact proof cells. Each cell has icon, title and microcopy.

Recommended types:
- delivery
- family/customer reach
- secure payment
- returns/cancellation policy
- support availability
- Morocco presence
- family impact

Any numeric proof is live/approved or hidden.

---

## S05 — Category Icon Rail

12 quick-entry tiles with icon/media, label, target and optional microbadge.

### Design
Soft circular/rounded icon tile, short label, extremely scanable. Desktop shows full row; mobile becomes horizontal swipe rail or 4×N grid based on chosen mobile variant.

### Data
Taxonomy references only. No manually typed IDs.

---

## S06 — Promo Triptych

Three large cards:
1. consumer promotion
2. Academy/editorial campaign
3. B2B/professional lead-generation campaign

Each card has image, title, support copy, CTA and campaign schedule. Cards can be reordered but preserve the 3-up composition at desktop.

---

## S07 — Flash Deals Shelf

This is the strongest commerce-pressure zone.

### Header
- title
- lightning/urgency mark
- optional `Voir toutes les offres`
- real countdown on right

### Product cards
Each card exposes:
- image
- promo badge
- optional bestseller/new/limited-stock badge
- title
- variant/short descriptor
- current price in **MAD/Dhs**
- compare-at price only when legitimate
- rating/review count only if real
- favorite
- add-to-cart / product action

### Rules
- MAD/Dhs only.
- no synthetic discount.
- no synthetic stock pressure.
- timer must match selected campaign.
- expired campaigns auto-fallback to normal product shelf or hide according to `emptyPolicy`.

---

## S08 — Services This Week + Help Aside

### Main shelf
Service cards include:
- service media
- service title
- starting price or rate in MAD/Dhs if authoritative
- rating if authoritative
- nearest/availability context when supported
- primary `Réserver` action

### Aside
Human-help card:
- approved advisor portrait
- support headline
- real contact channels/actions
- availability copy from configured support schedule

No fake “available today” claim.

---

## S09 — Family Packs + Best Sellers

Two equally strong commercial shelves.

### Packs
Curated bundles/collections. If the Marketplace does not have a canonical bundle authority, the section must use existing collections rather than creating shadow bundles.

### Best sellers
Dynamic strategy driven by real sales/discovery metrics. If bestseller ranking is unavailable, section falls back to curated/popular without falsely displaying “best seller.”

---

## S10 — Academy Urgency

### Training cards
- training media
- program title
- status badge
- price in MAD/Dhs
- delivery mode
- date/session
- remaining-capacity badge only from real cohort capacity
- enrollment action

### Large banner
Academy brand proposition with family imagery and a strong route to the Academy universe.

---

## S11 — B2B Sector Solutions

5 sector shortcut tiles:
- crèches
- écoles
- maternités
- hôtels/tourisme
- entreprises

Each route resolves through existing B2B/category authority. Right-side quote card routes into the existing quote/inquiry workflow; no new workspace.

---

## S12 — Guides + Experts

### Guides
Editorial cards with media, title, category/tag, reading metadata and route.

### Experts
Profile cards with portrait, role/specialty, rating if real, and structured appointment/contact action.

Do not fabricate credentials, ratings or availability.

---

## S13 — Collections + New Arrivals

### Collections
Strong visual collection tiles with short labels.

### New arrivals
Dynamic catalog strategy using real publish/create date. “Nouveau” badge is time-bounded by configuration.

---

## S14 — Community + App + Welcome Offer

Three conversion blocks:
- parent community/newsletter/join action
- app promotion with approved screenshots/store badges
- first-order promotion governed by an actual campaign/promotion object

Coupon code may only render if active and valid.

---

## S15 — Commitments + Trust Marks

### Commitments
Small icon-value pairs such as safety, verified profiles, payment security, listening/support, positive impact.

### Trust marks
Approved institutions/partners only. Never generate logos from text and never imply a partnership that does not exist.

---

## S16 — FAQ + Testimonial + Mission

### FAQ
Accordion, fully keyboard accessible, content driven from approved FAQ/content authority or page-managed copy.

### Testimonial
Real testimonial only. Source, consent and publication status govern rendering.

### Mission panel
Brand statement + family image + official logo. Editorial, not a commerce claim.

---

## S17 — Mega Footer

Required zones:
- official logo + brand statement
- social channels
- service universe links
- help/contact links
- about/company links
- app store badges
- newsletter field
- locale/market selector
- legal links
- copyright
- closing handwritten/brand line

Footer links come from canonical navigation configuration, not duplicated arrays inside this page world.

---

# 7. Card-level contracts

## ProductCard.DenseCommerce

Required fields:
- canonical item reference
- media
- title
- price
- optional compare-at price
- optional campaign badge
- optional review aggregate
- optional availability badge
- favorite action
- cart/buy action

Forbidden:
- fake reviews
- fake stock
- fake compare-at price
- static product ID typed by admin

## ServiceCard.Bookable

Required:
- canonical service reference
- title
- media
- price/rate policy
- location/availability context if real
- structured booking action

## AcademyCard.Session

Required:
- program/cohort reference
- title
- date/mode
- price
- capacity state
- enrollment action

## ExpertCard.Trusted

Required:
- canonical expert/provider reference
- portrait
- role/specialty
- availability state
- appointment/contact action

## CollectionTile

Required:
- canonical collection/category reference
- image/icon
- label
- navigation action

---

# 8. Asset registry doctrine

Every visible asset belongs to one of four classes.

### A. Immutable brand assets
Official AngelCare logo, approved app badges, approved social icons. Admin cannot replace these with arbitrary uploads.

### B. Governed editorial assets
Hero family media, mission imagery, community image, Academy campaign media. Selected from Media Vault with focal point and mobile crop.

### C. Dynamic commerce media
Product/service/expert/training/collection images. Pulled from the canonical referenced entity. Template does not copy the URL as its own business truth.

### D. UI iconography
Delivery, lock, heart, cart, location, Academy, health, etc. Use one approved icon system and token sizes. Do not mix generated icon sets per section.

---

# 9. Admin control model

The admin should almost never type raw identifiers.

## Page-level controls
- World name
- locale
- territory
- audience
- publish schedule
- global density
- header variant
- urgency campaign
- default empty-state policy
- desktop/mobile preview

## Section-level controls
- visible / hidden
- title/subtitle
- canonical source picker
- dynamic strategy
- curated override items
- filter/sort
- item count
- desktop columns
- mobile presentation
- CTA action
- campaign schedule
- audience/territory
- fallback policy

## Individual card overrides
Allowed only for editorial ordering/copy/media where the owning source permits it. Business facts remain live-bound.

---

# 10. Full Page World insertion behavior

Library location:

`Left Library → Mega Homepages → AngelCare Famille & Bébé — Hyper-Commerce`

On drag/click:

1. Studio loads a preview of the entire 18-section tree.
2. Admin chooses `Remplacer la page` or `Insérer ici`.
3. Existing page is snapshotted by the normal Studio history system.
4. Full world is instantiated as normal Puck data.
5. All source recipes remain canonical references.
6. Any unresolved source displays an authoring warning, never a fake fallback product.
7. Admin configures via pickers/drawers.
8. Preview uses real runtime pipeline.
9. Publish remains governed by P11.
10. P12 registers dependencies and invalidates on upstream change.

---

# 11. Urgency and sales trigger constitution

Sales pressure must be **truthful and data-backed**.

Supported triggers:
- real campaign countdown
- legitimate percentage/amount discount
- genuine low stock
- real Academy remaining seats
- recently published/new item window
- actual bestseller/trending rank
- real delivery/service availability
- real coupon validity window
- real first-order eligibility

Forbidden:
- randomized countdowns
- resetting timers
- fabricated “X people viewing”
- fabricated crossed-out prices
- fabricated scarcity
- invented ratings/review counts
- fake partner endorsements

---

# 12. Mobile contract

This desktop world must have a **separately authored mobile composition** sharing the same source references, not a squeezed CSS version.

Required mobile behaviors:
- compact official-logo header
- persistent search
- sticky bottom commerce navigation
- swipeable category rail
- 2-up product/service shelves or 1.3-card peek rail where appropriate
- bottom-sheet pickers/actions
- sticky booking/cart CTA where contextually relevant
- promo cards stacked by commercial priority
- hero copy before image or integrated image depending approved mobile world
- no horizontal overflow
- touch targets ≥44 px
- carousel keyboard/screen-reader equivalents

---

# 13. Runtime/state matrix

Every dynamic section supports:

- `LOADING` — skeleton preserving exact layout dimensions.
- `READY` — full content.
- `PARTIAL` — render valid cards only; never invent missing fields.
- `EMPTY` — hide section or render governed empty state.
- `ERROR` — no broken component; show safe fallback or omit.
- `FALLBACK_NATIVE` — when policy/runtime blocks Studio content, preserve existing Category-Native/public runtime.

No internal engineering error text reaches customers.

---

# 14. Accessibility

- semantic heading order
- visible keyboard focus
- all CTAs keyboard reachable
- proper button/link semantics
- carousel prev/next with accessible names
- alt text from Media Vault/entity metadata
- timer announces meaningful changes without spamming screen readers
- color is never the sole status signal
- reduced-motion mode
- minimum contrast target WCAG AA

---

# 15. Performance

- hero/LCP image prioritized and correctly sized
- everything below first viewport lazy-loaded
- responsive image srcsets
- dynamic shelves fetch bounded item counts
- no duplicate source calls for same query/context where P12 cache applies
- admin preview bypasses public caches
- no autoplay video unless explicitly configured and in viewport
- avoid CLS by reserving media/card dimensions
- no giant one-component rerender for the entire page

---

# 16. Analytics contract

Every meaningful surface gets stable telemetry IDs independent of visible copy:

- page world view
- section impression
- hero CTA
- search submit
- category entry
- campaign click
- product impression/click/add-to-cart
- service impression/booking start
- Academy enrollment start
- quote request start
- expert contact/appointment start
- collection click
- app-store click
- newsletter/community join
- FAQ open

Analytics never becomes a second business authority.

---

# 17. Surgical upgradeability

The world must be changeable at four levels without rewrite:

1. **Token upgrade** — color/radius/spacing/typography globally.
2. **Component upgrade** — e.g. ProductCard v2 without changing section recipe.
3. **Section upgrade** — replace S07 flash shelf while leaving S00–S06/S08–S17 untouched.
4. **World upgrade** — publish a new world revision while preserving previous published revision and dependencies.

Every block ID and section ID is stable. Renames/removals must follow P13 compatibility doctrine.

---

# 18. Build component tree

```text
MegaHomeWorld01
├── S00 UrgencyBar
├── S01 CommerceHeader
├── S02 PrimaryNav
├── S03 HeroFamilyCommerce
│   ├── HeroEditorialCopy
│   ├── HeroFamilyMedia
│   └── HeroCommunityPanel
├── S04 TrustProofStrip
├── S05 CategoryIconRail
├── S06 PromoTriptych
│   ├── PromoCampaignCard
│   ├── AcademyCampaignCard
│   └── B2BCampaignCard
├── S07 FlashDealsShelf
│   └── ProductCard.DenseCommerce × N
├── S08 ServiceAvailabilityShelf
│   ├── ServiceCard.Bookable × N
│   └── HumanHelpCard
├── S09 FamilyPacksAndBestSellers
│   ├── PackCard × N
│   └── ProductCard.DenseCommerce × N
├── S10 AcademyUrgency
│   ├── AcademyCard.Session × N
│   └── AcademyCampaignBanner
├── S11 B2BSectorSolutions
│   ├── SectorTile × N
│   └── QuoteCTA
├── S12 GuidesAndExperts
│   ├── EditorialGuideCard × N
│   └── ExpertCard.Trusted × N
├── S13 CollectionsAndNewArrivals
│   ├── CollectionTile × N
│   └── ProductCard.Compact × N
├── S14 CommunityAppWelcome
│   ├── CommunityJoinCard
│   ├── AppPromotionCard
│   └── FirstOrderCampaignCard
├── S15 CommitmentsAndTrustMarks
│   ├── CommitmentItem × N
│   └── TrustLogoStrip
├── S16 FAQTestimonialMission
│   ├── FAQAccordion
│   ├── TestimonialCard
│   └── MissionBrandCard
└── S17 MegaFooter
```

---

# 19. Acceptance gates

This world is **not complete** merely because it visually resembles the screenshot.

It passes only when:

```text
REFERENCE_VISUAL=APPROVED
OFFICIAL_LOGO_ONLY=PASS
18_SECTIONS=PASS
ALL_CHILD_BLOCKS_EDITABLE=PASS
FULL_PAGE_LIBRARY_APPLY=PASS
REPLACE_PAGE_MODE=PASS
INSERT_COMPOSITION_MODE=PASS
CANONICAL_PICKERS=PASS
REAL_DATA_ONLY=PASS
MAD_DHS_ONLY=PASS
REAL_URGENCY_ONLY=PASS
P03_ACTIONS=PASS
P05_BINDINGS=PASS
P06_DYNAMIC_SOURCES=PASS
P07_WORKFLOWS=PASS
P08_PUBLIC_RUNTIME=PASS
P11_FAIL_CLOSED=PASS
P12_INVALIDATION=PASS
P13_STABLE_IDS=PASS
DESKTOP=PASS
TABLET=PASS
MOBILE=PASS
KEYBOARD=PASS
REDUCED_MOTION=PASS
EMPTY_ERROR_LOADING_STATES=PASS
NO_FAKE_COMMERCIAL_DATA=PASS
```

---

# 20. Final doctrine

This approved page is hereby treated as **a governed AngelCare Full Page World**, not merely inspiration.

The build target is the visual composition **plus** its complete authoring model, source model, action model, responsive model, asset registry, urgency truth rules, state model, analytics identity, accessibility contract, dependency contract and upgrade path.

That is what makes it surgically controllable later instead of becoming another hardcoded homepage that must be rewritten whenever the business changes.
