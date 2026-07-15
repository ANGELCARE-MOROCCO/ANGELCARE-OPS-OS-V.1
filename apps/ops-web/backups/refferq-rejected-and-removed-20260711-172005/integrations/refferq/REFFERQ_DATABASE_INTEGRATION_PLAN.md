# RefferQ Database Integration Plan

## Objective

Wire the mounted RefferQ runtime into AngelCare OPS OS with isolated RefferQ tables, a dedicated database URL, and an AngelCare-to-RefferQ auth bridge. The goal is to preserve feature parity while avoiding any writes to AngelCare production tables.

## Required env vars

- `REFFERQ_DATABASE_URL`
- `REFFERQ_JWT_SECRET`
- `REFFERQ_APP_BASE_PATH`
- `REFFERQ_API_BASE_PATH`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Compatibility fallback:

- `JWT_SECRET` is still read as a fallback for the session bridge if `REFFERQ_JWT_SECRET` is not present.
- `DATABASE_URL` is not used for live RefferQ database access.

## Schema isolation strategy

- All live RefferQ data is targeted to the Supabase schema `refferq`.
- The live Prisma datasource now reads `env("REFFERQ_DATABASE_URL")`.
- The reviewable SQL file starts with `create schema if not exists refferq;`.
- No public AngelCare tables are mutated by this phase.

## Prisma model and table map

Preserved RefferQ model families:

- `User` -> `users`
- `Affiliate` -> `affiliates`
- `Referral` -> `referrals`
- `ReferralClick` -> `referral_clicks`
- `Conversion` -> `conversions`
- `Commission` -> `commissions`
- `Payout` -> `payouts`
- `CommissionRule` -> `commission_rules`
- `AuditLog` -> `audit_logs`
- `OTP` -> `otps`
- `ProgramSettings` -> `program_settings`
- `PartnerGroup` -> `partner_groups`
- `Transaction` -> `transactions`
- `EmailTemplate` -> `email_templates`
- `EmailLog` -> `email_logs`
- `IntegrationSettings` -> `integration_settings`
- `Webhook` -> `webhooks`
- `WebhookLog` -> `webhook_logs`
- `ScheduledReport` -> `scheduled_reports`
- `SavedReport` -> `saved_reports`
- `ApiKey` -> `api_keys`
- `ApiUsageLog` -> `api_usage_logs`
- `RateLimitEntry` -> `rate_limit_entries`
- `Coupon` -> `coupons`
- `Resource` -> `resources`
- `Invoice` -> `invoices`
- `Program` -> `programs`
- `TeamMember` -> `team_members`

## Collision avoidance

Avoided or deferred collisions:

- `public.users`
- `public.audit_logs`
- `public.transactions`
- `public.email_templates`
- Any AngelCare production table in the `public` schema
- Any old Ambassador runtime entrypoint
- Generic cookie names that could collide with AngelCare sessions

## Manual Supabase SQL execution

1. Open the Supabase SQL editor for the AngelCare database.
2. Review `database/refferq/20260710_refferq_schema.sql`.
3. Confirm the statement `create schema if not exists refferq;`.
4. Apply the remaining table DDL manually or via a separate reviewed migration export.
5. Verify the target schema is `refferq` before any seed or runtime traffic is allowed.
6. Do not execute destructive SQL against public AngelCare tables.

## Seed command

```bash
node scripts/seed-refferq.mjs
```

Seed behavior:

- Uses `REFFERQ_DATABASE_URL` only
- Refuses to run without `REFFERQ_DATABASE_URL`
- Seeds only the `refferq` schema
- Idempotently ensures:
  - `admin@example.com`
  - `sarah.johnson@example.com`
  - `david.lee@example.com`
  - default program settings
  - basic demo partner/referral/conversion/commission data

## Auth bridge behavior

- AngelCare authenticated users can enter RefferQ through the mounted protected route tree.
- The bridge checks the existing AngelCare session/user if available through the shared AngelCare helper.
- Matching RefferQ users are found or created in `refferq.users` when the RefferQ database is configured.
- Safe AngelCare owner/admin/operator roles are promoted to RefferQ `ADMIN`.
- Uncertain roles default conservatively to `AFFILIATE`.
- RefferQ-native login, registration, OTP, and password flows remain available.
- Session cookies are namespaced as:
  - `refferq_session`
  - `refferq_token`
  - `refferq_user`

## Deferred production items

- Supabase-managed migration execution
- Automated production schema rollout
- Backfill of historical AngelCare-to-RefferQ user mappings
- Production-grade session revocation table for RefferQ tokens
- End-to-end mail delivery validation against live Resend
- Any cross-schema reporting merge with AngelCare public tables

## Rollback strategy

- Remove the RefferQ-mounted middleware bridge.
- Restore the previous RefferQ auth cookie handling if needed.
- Keep the archived source under `integrations/refferq/source`.
- Leave the `refferq` schema untouched unless a future migration intentionally alters it.
- Do not roll back AngelCare production tables as part of RefferQ isolation work.
