# AngelCare — Live Experience Studio 2030 R1

## Installation and release

```bash
unzip -q -o "$HOME/Downloads/ANGELCARE_LIVE_EXPERIENCE_STUDIO_2030_R1_20261010.zip" -d "$HOME/Downloads" &&
node "$HOME/Downloads/ANGELCARE_LIVE_EXPERIENCE_STUDIO_2030_R1_20261010/install.mjs" "$HOME/Desktop/angelcare-platform"
```

The command never exits your interactive terminal. It checks every target before writing, preserves incompatible local edits, installs only the manifest files, creates an exact backup, verifies installed hashes and prints a guarded rollback command. Repeated installation is safe. No SQL execution, dependencies, global TypeScript, full local build, staging, commit, push or deployment is performed.

**Before deploying the new code, run `database/01_LIVE_EXPERIENCE_STUDIO_2030.sql` in your SQL Editor, then the read-only verification file.** The migration is also included at the app's canonical `supabase/migrations/20261010094500_live_experience_studio_2030.sql` path. They are the same migration: use your normal migration process OR SQL Editor, not two separate changes. Existing Live Experience tables from the supplied source are prerequisites. No catalogue, atomic import, Wallet balance, pricing or fulfilment table is changed.

Source baseline: the supplied current-source ZIP plus the Operational Reception R1 and Care Orbit R1 changes already prepared in this conversation. Per-file hashes determine compatibility. No claim is made that this package has been applied to your computer or deployed.

## Delivered production desk

- Existing admin entry: `/angelcare-marketplace/admin/live-experience-command`.
- Redesigned Popup, Broadcast, Flash Sale & Proof, preset gallery and evidence-source workspaces; matching saturated governance surfaces for audiences, placements, calendars, experiments, immutable history and capability controls.
- 54 purpose-specific recipes with bespoke FR/EN/AR title and narrative seeds, 15 themes and 270 combinations. This is **54 purposes × five compositions in each family**, not 270 independently authored business processes. The renderer changes structure, block order and visual treatment; copy is specific to registration, care, recurring rhythms, learning, organisational scope, recovery, pricing and evidence.
- Decorative SVG editorial metaphors are delivered in code. They are not invented product photography, facilities, staff or social proof. Real bound offers and Media Library assets provide photography. Canonical offer images remain fully visible with contain fitting; explicit editorial images can use cover.
- Native offer/category/schema search, paginated offer selection, Media Library reuse, localized editing, device previews, native audience selection, placement and trigger controls, time/frequency caps, calendar windows, priority, experiment/variant binding, actual public-renderer preview and server-backed eligibility simulation.
- Draft autosave, retained edits on failure, bounded undo/redo, unsaved-work protection, explicit publication reason, reviewed version checks and protected published snapshots. Editing an active record changes its draft, not the public snapshot.
- Publication/save functions lock the row, reject a stale revision, and atomically write campaign/version/audit records. Campaign duplication creates a fresh draft through that function. Source and governance authorities retain their existing save/transition repositories and explicit audit writes; those separate source/governance writes are not claimed to be one database transaction.

## Native runtime and journeys

Public resolution derives authentication, customer kind and Wallet membership from the existing authorities, not submitted browser flags. Targeting intersects native schema, category, item, route segment, device, locale, territory, customer kind, active audience and journey stage. Legacy city-only audiences require explicit native territory mapping; they do not silently match everyone.

The existing 31 schemas remain authoritative. Explicit one-time/recurring childcare recipes reject the wrong schema. Global campaigns can run without inventing an offer. Public attributes are limited to each schema's declared public fields; internal attributes and source payloads are not dumped into the browser. Native prices and promotion calculations are preserved.

Supported native surfaces are mounted through empty slots: navigation/header/content/footer boundaries; bound catalogue cards and atomic detail entrances; after a discoverable native hero; configurator/price context; basket/checkout/confirmation/account/Wallet; floating-side and bottom-dock compositions. Empty slots occupy no space. `hero_overlay` and `product_hero` are adjacent mounts at the native detail entrance, not a rewrite or visual overlay of a published Studio hero. `after_hero` is discovered from the detail's first H1-containing header/section; it is absent if that structure is unavailable. Missing product/card/configurator/account context does not relocate a proof onto an unrelated global page.

Choice controls retain their draft through the existing atomic selection store and native configurator URL. They do not create a second booking, Academy enrolment, payment or B2B backend. Calls to action can use native detail/configuration or a safe existing internal destination. Forms remain the existing authenticated/native enquiry pages, rather than duplicate forms collecting information inside a campaign.

Basket changes, verified configuration, checkout errors, recorded receipts and actual Wallet eligibility/top-up requirements emit native events. Route-derived interests cover schema, care, Academy, admission, Partner OS, Quality Check, event and business context. Explicit click triggers require a `[data-live-trigger="campaign UUID"]` marker in the initiating UI; the engine does not hijack every button. Repeat visits are route visits, not polling repetitions. Inactivity resets on activity. Timer/scroll/exit events remain user-interface signals, not financial or availability evidence.

One overlay is selected at a time, with modal/drawer/sheet/floating alternatives. Modals trap keyboard focus, make the background inert, restore its prior state, support Escape and safe dismissal, and avoid competing with Care Orbit, input focus, another dialog, or sensitive auth/payment/checkout steps. This is controlled exposure, not simultaneous display of every campaign. Inline broadcasts and evidence remain separately governed. Reduced motion and RTL are supported.

Visible exposure requires an IntersectionObserver threshold for 600ms in a visible document. Frequency records separate session/day/week windows, cooldown, dismissal expiry and revision; storage failure has an in-memory fallback. Public refresh is route/locale scoped, aborts obsolete reads and suppresses proof/promotion after refresh failure. Evidence and campaign deadlines are checked locally as well as server-side. Full registry reads page through 500-record batches rather than silently stopping at 100 or 500; an explicit >50,000 registry guard fails instead of returning a falsely complete result.

## Pricing, evidence and deliberate dependency gates

Flash-sale campaigns require a bound published fixed-price offer, the actual automatic promotion selected by the existing pricing authority, and a real promotion end. The public comparison and server preview use that calculation. The deadline uses the earliest campaign/promotion end. A coupon-only or differently targeted promotion cannot invent a public flash price.

Supported proof paths:

| Purpose | Native authority and condition |
|---|---|
| Flash-sale proof | Published catalogue item + actually applicable automatic promotion |
| Academy remaining seats | Cohort capacity minus recorded enrolled count, open enrolment window; a bound offer must belong to the cohort's published course |
| Booking availability | Published availability flags scoped to current territory/audience and date window; never capacity_limit as remaining appointments |
| Trust & Quality evidence | Actual issuance/reference with active/issued/expiring status, valid_until and no revocation |
| Wallet saving / personal privilege | Real signed-in member and bound fixed-price Dh offer; native Wallet evaluator plus its persisted evaluation with the selected policy ID belonging to that customer and item |

Public sources read through to the native authority at resolution time. The selected verified source identity must remain active; native failures, inactive entities and stale/expired results cannot produce a proof. Runtime refresh does not impersonate an admin or mutate source status. Observation TTLs remain 60s for cohorts/policies, 120s availability, 300s catalogue and 900s Trust, bounded by relevant native end dates. Wallet comparisons are on the published base price, excluding configuration options; the actual journey recalculates the final price. Amounts are Dh, not relabelled as AC credits.

**Nine proof recipes are intentionally dependency-blocked in this source:** low stock, variant scarcity, event remaining capacity, recent purchases, recent bookings, product popularity, service trends, campaign redemption progress and earned top-up bonus. The inspected source does not provide sufficient authoritative facts for those claims. They remain editable compositions with clear blockers and cannot be published as fabricated counters. Back-in-stock and capacity-full triggers also require their missing native authorities. This package does not pretend the old 129 declared capability names are 129 operational features. Capability switches that correspond to the delivered runtime's required features are enforced; future declarations remain a catalogue of dependencies.

## Attribution and analytics

Clicks and journey starts are interactions. A browser cannot send an arbitrary `conversion` event. The new receipt endpoint reads the existing visitor-protected native session, verifies the actual outcome ID and canonical object, requires a recent recorded campaign journey-start and records a deduplicated `native_receipt_v2030`. It means an order/request/booking receipt is recorded; **it does not mean payment captured, booking accepted or service fulfilled**. Guest and account ownership remain under the existing conversion authority. Requests that lack its visitor/session/outcome contract do not count as verified receipts.

Analytics separates new verified native receipts from historical conversion rows. Historical rows are not retrospectively certified. No uplift, winning variant or revenue is invented. Experiment allocation honours weights (including zero), running/paused states and an explicit winner; a winner transition requires a named variant and a written evidence note. This is not an automatic statistical significance engine.

## Verification and limits

See `verification/runtime-results.json`, `installer-results.json` and `boundaries-and-limits.json`. Tests execute actual contracts, repositories and component handlers through Babel with controlled database, React and clock/DOM fixtures. They are meaningful source/behaviour tests, not a TypeScript type check, real SQL execution or a deployed end-to-end certification.

`previews/LIVE_STUDIO_ACTUAL_COMPOSITIONS.html` contains 225 offline references of delivered JSX/CSS (15 selected purposes × three locales × five compositions) and switches purpose/locale/variant/viewport. Synthetic facts are explicitly marked. Customer actions are disabled. `LIVE_STUDIO_ADMIN_GALLERY.html` renders the actual admin gallery JSX. Icons are simplified for these offline references. No Chromium executable is available here, so pixel/browser-layout/hydration verification is not marked passed.

Homepage, storefront design implementations, atomic imports and schema registry, published Studio selector/precedence, native pricing algorithm, auth authorities, payment APIs and existing fulfilment engines are preserved. Only the explicitly listed shell/card/detail/configurator/basket/checkout/account/Wallet components receive slots or event hooks.

## Release checklist

- [ ] Install hashes pass; retain the printed rollback command.
- [ ] Execute/rehearse the included SQL against your intended database; run the read-only schema/ACL verification. Verify against real seeded rows and two simultaneous operator sessions.
- [ ] Stage/commit/push the reviewed source. Remote Build Marketplace GHCR One-Off builds the exact commit, verifies compiled routes and runtime identity, and pushes the immutable tag/digest.
- [ ] Deploy that immutable image in Coolify and confirm its revision.
- [ ] Browser-test FR/EN/AR and mobile with keyboard, reduced motion, protected Studio precedence, full image fitting, view caps, route changes, stale responses, empty/error states and retained drafts.
- [ ] Validate all supported proof adapters against real records, cancelled cohorts, territorial availability, promotion periods, Wallet membership and Trust revocation. No unsupported claim may appear.
- [ ] Test real guest/account basket and atomic confirmations; verify received-request attribution without interpreting it as captured payment or accepted fulfilment.

## Rollback

The printed rollback command restores only the installed code/migration files whose current hashes still match the package, preserving later edits. It does not undo executed SQL or erase customer/campaign history. The optional database rollback file drops only the two new RPCs; the published_snapshot column, verified-receipt index and existing history are retained. Deploy old compatible code before using that optional SQL rollback. No automatic rollback or database execution occurs.
