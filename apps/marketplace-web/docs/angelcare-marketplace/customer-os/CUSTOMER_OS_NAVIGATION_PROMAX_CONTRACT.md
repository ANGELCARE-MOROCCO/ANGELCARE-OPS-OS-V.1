# ANGELCARE Marketplace — Customer OS + 12 Storefront Navigation Pro Max Contract

Status: FINAL R1 source contract · 2026-10-06

## Mission

This contract aligns the public Marketplace horizontal navigation with the canonical 12-storefront Public Experience Authority and upgrades the authenticated customer experience into one coherent **Mon ANGELCARE Customer OS** without creating shadow commerce, family, finance, document, notification, support, saved-item, address, or journey authorities.

## Navigation authority

The Marketplace primary storefront rail is derived from `PUBLIC_EXPERIENCE_STOREFRONTS`, not the legacy CMS menu. Exactly 12 atomic storefronts are represented: Families, Home Services, Development, Kits, Academy, Establishments, Hospitality, Health Partners, Corporates, Partner OS, Quality Check, Professionals. `All Marketplace` remains an additional catalog action. The standard non-Marketplace shell remains independently CMS-driven.

## Customer OS information architecture

Mon ANGELCARE exposes Overview, Saved, Action Center, Orders, Bookings, Academy, My Family, Quotes, Subscriptions, Quality Check, Wallet, Payments, Documents, Notifications, Support, and Account & Security. The specialist `/family/*` authorities remain intact and are surfaced as a coherent family domain rather than duplicated.

## Commerce specialization

Orders, service bookings, Academy enrollments, B2B quotations/programmes, Partner OS subscriptions, and Quality Check assessments keep their real journey authorities but receive customer-native summaries, live catalog continuation when the original offer still exists, documents, actions, scheduling, financial/fulfillment context, and safe canonical continuation links.

`Buy again` / `Book again` is never an unverified duplication: it only appears when the original journey still resolves to a currently published catalog item and sends the customer back through that item's canonical commerce journey.

## Customer utilities

- Saved items are account-owned selections; guest selections continue to be claimed by existing customer-auth logic.
- Compare can recover persisted compare selections when no explicit item list is supplied.
- Payments shows the customer's full payment history while Action Center separately highlights unresolved obligations.
- Documents aggregates actual `JourneyDocument` records.
- Notifications aggregates actual `JourneyNotification` records and uses the existing acknowledgement authority.
- Action Center aggregates real open journey actions, payment obligations, and support/recovery cases.
- Support unifies family tickets and journey support cases without introducing another ticket table.
- Account & Security exposes real family profile controls, the existing canonical customer address table, password change, session revocation, and truthful privacy/support guidance.

## Change / cancellation / return governance

Customers can submit governed change requests appropriate to the journey type (schedule/service/delivery/return/cohort/scope/plan/assessment/cancellation). Submission never promises automatic approval or refund. Operators resolve the existing `angelcare_marketplace_journey_change_requests` record through `marketplace.journeys.manage`; the decision is audited, customer-visible, and appears in the journey. Financial refunds remain under the existing finance authority.

## Truth and authority rules

- No fake order, booking, document, notification, review, rating, availability, refund, or customer state.
- No shadow address, saved-item, family, support, payment, journey, or refund store.
- No SQL or migration is part of this package.
- No local production build is permitted by the installer.
- Existing Homepage World 01 and World 02 R2 remain valid; only the intended saved/account integration into World 02 is included.
- Existing Enterprise Footer is protected and not modified.

## UI doctrine

The customer experience is consumer-facing, tri-lingual FR/EN/AR, RTL-aware, mobile-responsive, and uses readable commerce hierarchy rather than internal operator jargon. Core customer actions use hardened touch targets; account navigation is horizontally scrollable rather than silently dropping destinations.
