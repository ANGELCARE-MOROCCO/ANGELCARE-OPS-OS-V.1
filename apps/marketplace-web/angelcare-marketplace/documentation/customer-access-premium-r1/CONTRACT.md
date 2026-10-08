# ANGELCARE · Customer Access Premium R1

Source contract and implementation acceptance — 7 October 2026

Baseline: `81ad74c61d0b316d835e65a96e5353e131a7f99c`, uploaded Marketplace source archive.

## Mission

Replace the customer access presentation with one complete premium ANGELCARE experience and repair its connected authentication lifecycle. White/light surfaces, rich brand colors, editorial family photography, layered panels, clear interaction feedback and responsive layouts must work together. Use the supplied ANGEL CARE logo without redrawing or recoloring it. The supplied PNG is copied byte for byte; CSS clips only its screenshot frame. Phone OTP is excluded from the active interface; its existing API remains unchanged.

## Exact scope

Five customer pages in FR, EN and Arabic RTL:

1. `/angelcare-marketplace/{locale}/auth/login`
2. `/angelcare-marketplace/{locale}/auth/register`
3. `/angelcare-marketplace/{locale}/auth/recover`
4. `/angelcare-marketplace/{locale}/auth/reset`
5. `/angelcare-marketplace/{locale}/auth/verified`

Connected source repairs include the existing email confirmation endpoint, a PKCE/email-token callback, resend confirmation, legacy email-fragment session handoff, cookie refresh on customer page routes, the selected family request/diagnostic return destination, all existing account-page return destinations, customer journey detail and its customer APIs, and customer-owned journey filtering.

The 21 account routes and family workspaces remain existing business surfaces. This release upgrades their authentication connections; it does not redesign their entire operational content. Their commercial, family, wallet, payment, booking and document authorities remain canonical. The legacy staff account workspace and Admin authentication are separate authorities.

## Design acceptance

- Exact attached logo; no generic triangle or invented mark in customer access pages.
- White canvas; brand pink, blue, green and amber; no full dark authentication panel.
- Editorial family photography reused from the deployed Families world, packaged locally to avoid external runtime image dependencies.
- One coherent shell, photographic story, capability cards, language navigation, mode navigation, contextual continuation, forms, results and FAQ.
- Five complete page experiences, not a login page with unstyled recovery/verification fallbacks.
- Desktop, mobile and RTL layouts with no horizontal overflow; image proportions and input visibility checked.
- Password visibility, Caps Lock notice, four policy checks, confirmation matching, optional phone validation, consent feedback and keyboard form submission.
- Explicit loading, retry, provider failure, unavailable customer profile, expired/invalid link, email-sent and password-saved states.
- Focus styles, input labels, inline errors, alert/status semantics, skip link, native keyboard FAQ and reduced-motion behavior.
- No invented credits, ratings, statistics, discounts, service availability, phone verification or registration benefits.

## Authentication acceptance

- Login uses the existing Supabase password authority and canonical customer account.
- Registration validates consent on the server and records account-creation consent version/time in existing Auth metadata. No marketing opt-in is inferred. This is not a new immutable legal-consent ledger.
- Duplicate/obfuscated signups cannot overwrite an existing customer profile.
- Customer access requires a confirmed email and an eligible customer record. Suspended/closed records stay blocked and are never reactivated by callbacks.
- Callback supports PKCE code exchange and supported email token hashes; recovery leads to password reset, magic login resumes its safe destination, signup leads to truthful verification.
- Legacy token fragments are removed from the visible address before exchanging tokens through the server. No token logs or additional local-storage persistence.
- Email confirmation success requires verified Auth identity plus a usable customer profile. Query-string markers alone cannot claim success.
- Resend confirmation is available after registration and on the invalid verification screen. Browser cooldowns and provider-side rate controls remain distinct.
- Password reset uses PATCH, enforces the existing 10-character/uppercase/lowercase/digit policy and requires a verified customer session.
- Reset does not silently revoke all sessions; the existing explicit account session-revocation control remains authoritative.
- Login/register/recovery/language navigation and generated email links keep a validated local customer destination, including the selected family need.
- Safe redirects reject external origins, platform/staff destinations, auth loops, control characters and encoded path bypasses; legitimate encoded checkout queries remain intact.
- Customer session refresh updates request and response cookies and marks customer HTML private/no-store. It never grants authorization itself.
- Customer journey pages/APIs accept customer identity; existing Admin permission guards stay unchanged.
- Customer journeys filter by the authenticated owner, linked family, or canonical customer account—not all records sharing a tenant.
- Guest commerce linking runs after authenticated customer confirmation/login using the existing canonical RPC. No shadow baskets/orders are created.

## Release boundaries

Changes apply only to `apps/marketplace-web`. No SQL/schema migration, package dependency change, homepage/Studio replacement, new commercial doctrine, or phone OTP activation is included. No local full application build, commit, push or deployment is performed by the patch installer.

Installer acceptance: validate exact baseline hashes before any write, reject conflicting files, back up originals, install exact package bytes, run portable behavioral/syntax gates using existing dependencies, verify installed hashes, and restore the original state if checks fail. A separate restore command restores this patch only and rejects subsequent edits.

## Evidence and practical limits

The acceptance report includes executed function tests with explicit Auth/database fixtures, actual React component browser tests with mocked APIs, targeted strict UI TypeScript checks, changed-source checks, desktop/mobile previews and protected-source hash comparison. These prove source behavior and component interactions within the stated test conditions.

They do not prove production SMTP delivery, actual Supabase redirect allowlisting/email templates, live database provisioning, live guest-claim RPC execution, a full Next build or the deployed image. Those operational gates must be checked with the deployed application and an authorized test customer. The exact provider setup and release checklist are included in `PROVIDER_AND_LIVE_CHECKS.md`. No claim of perfect live authentication is made from mocked evidence.

Reference documentation reviewed: Supabase SSR cookie clients, password recovery and passwordless email authentication:
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-email-passwordless
