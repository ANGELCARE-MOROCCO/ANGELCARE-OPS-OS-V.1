-- RefferQ schema isolation bootstrap for AngelCare OPS OS
--
-- This file is intentionally reviewable and manually executable later.
-- No destructive public-table changes are included here.

create schema if not exists refferq;
set search_path to refferq, public;

-- Authoritative Prisma schema:
-- integrations/refferq/live/prisma/schema.prisma
--
-- Manual execution strategy:
-- 1. Apply the schema creation above in Supabase SQL editor.
-- 2. Review the Prisma datamodel in integrations/refferq/live/prisma/schema.prisma.
-- 3. Generate or hand-translate the remaining table DDL into the refferq schema.
-- 4. Do not touch public.users, public.audit_logs, public.transactions,
--    public.email_templates, or any AngelCare production table.
--
-- Table/model families to preserve under refferq:
-- users, affiliates, referrals, referral_clicks, conversions, commissions,
-- payouts, commission_rules, audit_logs, otps, program_settings,
-- partner_groups, transactions, email_templates, email_logs,
-- integration_settings, webhooks, webhook_logs, scheduled_reports,
-- saved_reports, api_keys, api_usage_logs, rate_limit_entries,
-- coupons, resources, invoices, programs, team_members.
--
-- Deferred until manual review:
-- - CREATE TABLE statements for the models above
-- - indexes and unique constraints
-- - foreign keys and enum type declarations
-- - seed data
