# AngelCare Living Marketplace — Hyper-Commerce 02

## Status
Production source world. Additional homepage authority. World 01 remains available and unchanged as a selectable Studio world.

## Activation authority
- Studio/Public Experience Authority owns assignment, preview and publish.
- The locale-root public route continues to prefer a valid published Studio homepage.
- If no valid Studio homepage is published, the established Homepage Flagship continuity path remains active.

## Shell boundary
World 02 is BODY ONLY. It MUST NOT own or duplicate:
- the existing Marketplace header;
- the existing horizontal navigation;
- the existing Enterprise footer.

Protected snapshot SHA-256:
- `GlobalPublicShell.tsx`: `512fa645b3eb59867cd228c2b56b0476b8358057254786428a306a840f99973e`
- `EnterpriseFooter.tsx`: `4b6f32b6cac3e9c13187a9f5e7400feec34b6933126b2b4c40e4f87631021108`
- `public.module.css`: `11cd880bafe460814ff56be02b5e670f55f6c44fda07dd0add97b73a6df661f9`

## Visual authority
- Light/white premium marketplace body.
- Long-scroll, dense, saturated, commercial and continuously active.
- Approved visual reference: `/public/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png`.
- Reference SHA-256: `37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d`.
- Composition is source-owned and intentionally locked in Studio to prevent gradual section-by-section visual drift.

## Runtime truth
World 02 consumes the established `getHomepageExperience()` authority. It does not create a parallel commerce store.

Live runtime inputs include published:
- navigation;
- campaigns and campaign media;
- taxonomy/categories and category media;
- catalogue products/kits/services/training/B2B offers and their media;
- prices and price modes;
- availability/territory/qualification states;
- merchandising placements and collections;
- Academy cohorts/capacity;
- professional/organization offers;
- public trust evidence;
- saved/compare selections.

## Image contract
1. Hero/editorial slots consume real campaign/catalog/category media when available.
2. Commerce/service/Academy cards consume their canonical item media.
3. Collection cards consume canonical collection media.
4. Missing legitimate media gets a neutral AngelCare visual fallback, never a fabricated product/service photograph.
5. The approved reference image is used only as Studio world preview/reference, not as the public homepage itself.

## Conversion contract
World 02 reuses the canonical conversion universe:
- Service → booking journey.
- Training → enrollment journey.
- SaaS/partner → subscription journey.
- Audit/B2B → quotation journey.
- Product/kit → basket journey.
- Card title/image still expose the canonical item-detail path for discovery.

## Truth firewall
Forbidden without canonical evidence:
- fake prices or crossed-out prices;
- fake discounts;
- fake stock/scarcity;
- fake cohort scarcity;
- fake review scores/review counts;
- fake countdowns;
- fake trust/partner claims.

If canonical homepage data cannot be resolved, World 02 fails closed with a neutral unavailability surface instead of demo commerce.

## Commercial body sequence
1. Real campaign urgency ribbon when eligible.
2. Dense family-commerce hero with multiple immediate paths.
3. Marketplace live proof counters derived from current runtime collections.
4. Published category universe rail.
5. Family / Academy / professional promo triptych.
6. Current commercial selection rail.
7. Services + family-help conversion panel.
8. Products/kits/development + popular shelves.
9. Academy offers + cohort capacity evidence.
10. Institutional/B2B vertical router + organization offers.
11. Journey guides.
12. Collections + new arrivals.
13. Account/support/active-campaign engagement panels.
14. Active public trust evidence.
15. FAQ + AngelCare mission close.
16. Existing Enterprise footer (outside World 02).

## Responsive contract
- Desktop: high-density six-card rails / multi-column merchandising.
- Tablet: deliberate reduction and horizontal commerce rails.
- Mobile: swipeable rails, two-column micro-grids where appropriate, compact typography and high CTA visibility.
- RTL is supported through locale root direction.
- Reduced motion remains respected.

## Persistence / publishing
The Studio component type is `ac_home_pro_max_living_world_02`, deliberately matching the existing Homepage Pro Max published-page qualification prefix. The document contains a single source-world marker component. Publishing stores the assignment; public rendering resolves the living homepage body from source code + canonical marketplace runtime data.

## Change classification
- Database migration: NO.
- SQL: NO.
- Header/nav/footer change: NO.
- Existing World 01 deletion/replacement: NO.
- New parallel commerce authority: NO.

## Visual Pro Max Revision 2 — final hardening
Revision 2 is the visual-signoff pass performed after source-level self-audit. It preserves the World 02 architecture and corrects the gaps that could make a technically dense homepage feel visually miniature rather than premium.

Locked R2 upgrades:
- three-part commerce hero: proposition + dominant canonical photo + family/community conversion panel;
- readable premium micro-typography while retaining six-card desktop density;
- 42–44px-class primary action and favorite targets;
- stronger card hierarchy for title, price, availability and CTA;
- image-led services assistance panel;
- Academy visual banner + canonical course cards + real cohort-capacity evidence;
- image-led B2B sector router when canonical organization media exists;
- image-led journey guides plus a public-safe human-guidance panel (no fabricated expert identities);
- photographic account/support/campaign engagement triptych;
- collections route into an actual collection-context item experience rather than an ignored query parameter;
- public support CTA corrected to the existing family request journey;
- “new arrivals” rendered only from `newArrivalItems` with no fallback that could mislabel older items;
- no fake app-store, testimonial, review, scarcity, discount or partner claims;
- responsive/mobile saturation preserved through swipe rails instead of oversized single-column simplification.

R2 remains BODY ONLY and introduces no SQL, migration, database authority, global shell change or World 01 replacement.
