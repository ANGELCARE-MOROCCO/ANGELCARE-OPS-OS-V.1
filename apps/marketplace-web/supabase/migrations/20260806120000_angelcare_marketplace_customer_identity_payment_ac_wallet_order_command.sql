begin;
create extension if not exists pgcrypto;

-- ============================================================================
-- CUSTOMER IDENTITY AUTHORITY
-- ============================================================================
create table if not exists public.angelcare_marketplace_customer_accounts(
 id uuid primary key default gen_random_uuid(),
 public_reference text unique not null default ('CUS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 auth_user_id uuid not null unique references auth.users(id) on delete cascade,
 account_kind text not null default 'family' check(account_kind in('individual','family','organization','employee_beneficiary','guest')),
 status text not null default 'pending_verification' check(status in('pending_verification','active','restricted','suspended','closed')),
 display_name text not null,
 email text,
 phone text,
 preferred_locale text not null default 'fr' check(preferred_locale in('fr','en','ar')),
 family_account_id uuid,
 crm_account_id uuid,
 tenant_id uuid,
 territory_id uuid,
 email_verified_at timestamptz,
 phone_verified_at timestamptz,
 premium_status boolean not null default false,
 last_login_at timestamptz,
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists ac_customer_accounts_email_uq on public.angelcare_marketplace_customer_accounts(lower(email)) where email is not null;
create index if not exists ac_customer_accounts_phone_idx on public.angelcare_marketplace_customer_accounts(phone) where phone is not null;
create index if not exists ac_customer_accounts_scope_idx on public.angelcare_marketplace_customer_accounts(account_kind,status,territory_id,tenant_id);

create table if not exists public.angelcare_marketplace_customer_verifications(
 id uuid primary key default gen_random_uuid(), customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 channel text not null check(channel in('email','phone')), destination_hash text not null, status text not null default 'pending' check(status in('pending','verified','expired','blocked','cancelled')),
 attempt_count integer not null default 0, expires_at timestamptz, verified_at timestamptz, evidence jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_customer_session_events(
 id uuid primary key default gen_random_uuid(), customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 auth_user_id uuid, session_reference_hash text, event_type text not null, risk_level text not null default 'normal' check(risk_level in('normal','review','high','blocked')),
 ip_hash text, user_agent_summary text, evidence jsonb not null default '{}', occurred_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_customer_addresses(
 id uuid primary key default gen_random_uuid(), customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 address_type text not null default 'home', label text, recipient_name text, phone text, city text not null, address_line text not null, postal_code text,
 latitude numeric(10,7), longitude numeric(10,7), territory_id uuid, is_default boolean not null default false, service_instructions text,
 status text not null default 'active' check(status in('active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_customer_organization_memberships(
 id uuid primary key default gen_random_uuid(), customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 crm_account_id uuid, tenant_id uuid, role_key text not null default 'buyer', status text not null default 'active' check(status in('invited','active','suspended','removed')),
 wallet_permissions jsonb not null default '{}', commercial_permissions jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_customer_notification_preferences(
 id uuid primary key default gen_random_uuid(), customer_account_id uuid not null unique references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 transactional_channels jsonb not null default '{"email":true,"in_app":true}', marketing_channels jsonb not null default '{}', preferred_locale text not null default 'fr',
 quiet_hours jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Link accepted conversion and Journey authorities without replacing them.
alter table public.angelcare_marketplace_conversion_sessions add column if not exists customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id);
alter table public.angelcare_marketplace_journeys add column if not exists customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id);
create index if not exists ac_conversion_customer_idx on public.angelcare_marketplace_conversion_sessions(customer_account_id,updated_at desc);
create index if not exists ac_journeys_customer_idx on public.angelcare_marketplace_journeys(customer_account_id,updated_at desc);

-- ============================================================================
-- PROVIDER-NEUTRAL PAYMENT ORCHESTRATION
-- ============================================================================
create table if not exists public.angelcare_marketplace_payment_methods(
 id uuid primary key default gen_random_uuid(), method_key text unique not null,
 method_kind text not null check(method_kind in('ac_wallet','card','bank_transfer','cash_on_delivery','pay_at_location','invoice','deposit','installment','corporate_allowance','voucher','manual_verified')),
 provider_key text, status text not null default 'inactive' check(status in('inactive','sandbox','active','suspended')),
 customer_segments text[] not null default '{}', offer_types text[] not null default '{}', territory_ids uuid[] not null default '{}',
 minimum_amount numeric(16,2), maximum_amount numeric(16,2), supports_split boolean not null default false, supports_refund boolean not null default false,
 requires_verified_identity boolean not null default true, configuration jsonb not null default '{}', display_content jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_payment_intents(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('PAY-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id), conversion_session_id uuid references public.angelcare_marketplace_conversion_sessions(id),
 canonical_object_type text, canonical_object_id uuid,
 status text not null default 'created' check(status in('created','requires_method','requires_customer_action','pending','authorized','partially_captured','captured','failed','cancelled','expired','partially_refunded','refunded','disputed','chargeback','reversed','reconciliation_pending','reconciled')),
 currency_label text not null default 'Dh', expected_amount numeric(16,2) not null check(expected_amount>=0), authorized_amount numeric(16,2) not null default 0,
 captured_amount numeric(16,2) not null default 0, refunded_amount numeric(16,2) not null default 0, due_now_amount numeric(16,2) not null default 0,
 due_later_amount numeric(16,2) not null default 0, wallet_contribution numeric(16,2) not null default 0, external_contribution numeric(16,2) not null default 0,
 idempotency_key text unique not null, selected_method text, provider_key text, provider_reference text, wallet_reservation_id uuid,
 metadata jsonb not null default '{}', expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ac_payment_intent_customer_idx on public.angelcare_marketplace_payment_intents(customer_account_id,updated_at desc);
create index if not exists ac_payment_intent_canonical_idx on public.angelcare_marketplace_payment_intents(canonical_object_type,canonical_object_id);
create table if not exists public.angelcare_marketplace_payment_attempts(
 id uuid primary key default gen_random_uuid(), payment_intent_id uuid not null references public.angelcare_marketplace_payment_intents(id) on delete cascade,
 attempt_number integer not null, method_kind text not null, status text not null default 'created', amount numeric(16,2) not null,
 idempotency_key text unique not null, provider_key text, provider_reference text, failure_code text, customer_message text, provider_evidence jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(payment_intent_id,attempt_number)
);
create table if not exists public.angelcare_marketplace_payment_provider_events(
 id uuid primary key default gen_random_uuid(), provider_key text not null, provider_event_id text not null, event_type text not null,
 signature_valid boolean not null default false, replay_key text not null, status text not null default 'received' check(status in('received','processing','processed','failed','dead_letter')),
 payment_intent_id uuid references public.angelcare_marketplace_payment_intents(id), payload jsonb not null default '{}', error_message text,
 received_at timestamptz not null default now(), processed_at timestamptz, unique(provider_key,provider_event_id), unique(replay_key)
);
create table if not exists public.angelcare_marketplace_payment_allocations(
 id uuid primary key default gen_random_uuid(), payment_intent_id uuid not null references public.angelcare_marketplace_payment_intents(id) on delete cascade,
 allocation_kind text not null, source_reference text, amount numeric(16,2) not null check(amount>=0), currency_label text not null default 'Dh',
 status text not null default 'reserved', evidence jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_payment_refunds(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('RFD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 payment_intent_id uuid not null references public.angelcare_marketplace_payment_intents(id), customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id),
 status text not null default 'requested' check(status in('requested','pending','processing','completed','failed','cancelled','reconciliation_pending','reconciled')),
 requested_amount numeric(16,2) not null check(requested_amount>0), wallet_restore_amount numeric(16,2) not null default 0, external_refund_amount numeric(16,2) not null default 0,
 promotional_restore_amount numeric(16,2) not null default 0, reason_code text not null, reason text, idempotency_key text unique not null,
 provider_reference text, policy_evidence jsonb not null default '{}', created_by uuid, created_at timestamptz not null default now(), completed_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_payment_disputes(
 id uuid primary key default gen_random_uuid(), payment_intent_id uuid not null references public.angelcare_marketplace_payment_intents(id), provider_reference text,
 status text not null default 'open', dispute_type text not null, disputed_amount numeric(16,2) not null, evidence jsonb not null default '{}',
 opened_at timestamptz not null default now(), resolved_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_payment_reconciliation_items(
 id uuid primary key default gen_random_uuid(), payment_intent_id uuid references public.angelcare_marketplace_payment_intents(id), provider_key text,
 provider_reference text, expected_amount numeric(16,2) not null default 0, provider_amount numeric(16,2) not null default 0, difference_amount numeric(16,2) generated always as (provider_amount-expected_amount) stored,
 status text not null default 'open' check(status in('open','investigating','matched','adjusted','reconciled','waived')), evidence jsonb not null default '{}',
 owner_id uuid, created_at timestamptz not null default now(), reconciled_at timestamptz, updated_at timestamptz not null default now()
);

-- ============================================================================
-- AC PRIVILEGE WALLET: CLOSED-LOOP LEDGER, MEMBERSHIP AND POLICY AUTHORITY
-- ============================================================================
create table if not exists public.angelcare_marketplace_wallet_accounts(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('ACW-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 customer_account_id uuid not null unique references public.angelcare_marketplace_customer_accounts(id) on delete restrict,
 status text not null default 'active' check(status in('active','frozen','restricted','closed')), currency_label text not null default 'Dh',
 available_balance numeric(16,2) not null default 0, purchased_balance numeric(16,2) not null default 0, bonus_balance numeric(16,2) not null default 0,
 reserved_balance numeric(16,2) not null default 0, expiring_balance numeric(16,2) not null default 0,
 lifetime_funded numeric(16,2) not null default 0, lifetime_spent numeric(16,2) not null default 0, lifetime_savings numeric(16,2) not null default 0,
 risk_reason text, metadata jsonb not null default '{}', created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_balance_buckets(
 id uuid primary key default gen_random_uuid(), wallet_account_id uuid not null references public.angelcare_marketplace_wallet_accounts(id) on delete restrict,
 bucket_kind text not null check(bucket_kind in('purchased','promotional','goodwill','refund','employer','gift','reserved','pending','expiring','expired','frozen','disputed')),
 available_amount numeric(16,2) not null default 0 check(available_amount>=0), reserved_amount numeric(16,2) not null default 0 check(reserved_amount>=0),
 expires_at timestamptz, policy_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ac_wallet_bucket_lookup_idx on public.angelcare_marketplace_wallet_balance_buckets(wallet_account_id,bucket_kind,expires_at);
create table if not exists public.angelcare_marketplace_wallet_ledger_entries(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('WLE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 wallet_account_id uuid not null references public.angelcare_marketplace_wallet_accounts(id) on delete restrict,
 entry_type text not null, bucket_kind text not null, direction text not null check(direction in('credit','debit')), amount numeric(16,2) not null check(amount>0),
 balance_after numeric(16,2) not null, source_type text not null, source_id uuid, order_reference text, payment_reference text, policy_id uuid,
 reason_code text not null, description text not null, idempotency_key text unique not null, effective_at timestamptz not null default now(), expires_at timestamptz,
 evidence jsonb not null default '{}', created_by uuid, created_at timestamptz not null default now()
);
create index if not exists ac_wallet_ledger_account_idx on public.angelcare_marketplace_wallet_ledger_entries(wallet_account_id,effective_at desc);
create table if not exists public.angelcare_marketplace_wallet_reservations(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('WRS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 wallet_account_id uuid not null references public.angelcare_marketplace_wallet_accounts(id) on delete restrict, amount numeric(16,2) not null check(amount>0),
 status text not null default 'reserved' check(status in('reserved','committed','released','expired','cancelled')), source_type text not null, source_id uuid,
 idempotency_key text unique not null, allocation jsonb not null default '[]', expires_at timestamptz not null default (now()+interval '30 minutes'),
 created_at timestamptz not null default now(), committed_at timestamptz, released_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_topups(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('WTU-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 wallet_account_id uuid not null references public.angelcare_marketplace_wallet_accounts(id), customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id),
 payment_intent_id uuid not null unique references public.angelcare_marketplace_payment_intents(id), status text not null default 'payment_pending' check(status in('draft','payment_pending','completed','failed','cancelled','refunded','chargeback')),
 requested_amount numeric(16,2) not null, purchased_credits numeric(16,2) not null, bonus_credits numeric(16,2) not null default 0, total_credits numeric(16,2) not null,
 currency_label text not null default 'Dh', bonus_expires_at timestamptz, idempotency_key text unique not null, created_at timestamptz not null default now(), completed_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_tiers(
 id uuid primary key default gen_random_uuid(), tier_key text unique not null, name_fr text not null, name_en text not null, name_ar text not null,
 status text not null default 'active' check(status in('active','suspended','archived')), rank integer not null default 100,
 qualification_rules jsonb not null default '{}', benefits_summary jsonb not null default '{}', visual_config jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_memberships(
 id uuid primary key default gen_random_uuid(), wallet_account_id uuid not null unique references public.angelcare_marketplace_wallet_accounts(id) on delete cascade,
 tier_key text not null references public.angelcare_marketplace_wallet_tiers(tier_key), status text not null default 'active' check(status in('qualified','active','grace','suspended','expired')),
 qualified_at timestamptz, expires_at timestamptz, progress numeric(8,2) not null default 0, next_tier_threshold numeric(16,2), assignment_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_policies(
 id uuid primary key default gen_random_uuid(), policy_key text unique not null, name_fr text not null, name_en text not null, name_ar text not null,
 description_fr text, status text not null default 'draft' check(status in('draft','active','suspended','archived')), priority integer not null default 100,
 stack_mode text not null default 'best_benefit' check(stack_mode in('stackable','exclusive','best_benefit')), customer_scope text not null default 'wallet_member',
 conditions jsonb not null default '{}', benefits jsonb not null default '{}', customer_message jsonb not null default '{}', starts_at timestamptz, ends_at timestamptz,
 usage_limit_per_customer integer, campaign_budget numeric(16,2), consumed_budget numeric(16,2) not null default 0, maximum_discount numeric(16,2), margin_floor_rate numeric(8,5),
 version integer not null default 1, created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ac_wallet_policy_active_idx on public.angelcare_marketplace_wallet_policies(status,starts_at,ends_at,priority desc);
create table if not exists public.angelcare_marketplace_wallet_policy_versions(
 id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.angelcare_marketplace_wallet_policies(id) on delete restrict,
 version integer not null, snapshot jsonb not null, created_by uuid, created_at timestamptz not null default now(), unique(policy_id,version)
);
create table if not exists public.angelcare_marketplace_wallet_policy_assignments(
 id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.angelcare_marketplace_wallet_policies(id) on delete cascade,
 customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id), wallet_account_id uuid references public.angelcare_marketplace_wallet_accounts(id),
 group_id uuid, organization_id uuid, status text not null default 'active' check(status in('active','suspended','expired','removed')), starts_at timestamptz, ends_at timestamptz,
 usage_limit integer, usage_count integer not null default 0, override_conditions jsonb not null default '{}', override_benefits jsonb not null default '{}', assigned_by uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists ac_wallet_policy_assignment_customer_uq on public.angelcare_marketplace_wallet_policy_assignments(policy_id,customer_account_id) where customer_account_id is not null;
create table if not exists public.angelcare_marketplace_wallet_policy_evaluations(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('WPE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id), wallet_account_id uuid references public.angelcare_marketplace_wallet_accounts(id),
 conversion_session_id uuid references public.angelcare_marketplace_conversion_sessions(id), normal_price numeric(16,2) not null, wallet_price numeric(16,2) not null,
 immediate_saving numeric(16,2) not null default 0, wallet_contribution numeric(16,2) not null default 0, external_contribution numeric(16,2) not null default 0,
 accepted_policies jsonb not null default '[]', rejected_policies jsonb not null default '[]', context_snapshot jsonb not null default '{}', evaluator_version text not null default '1.0',
 created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_groups(
 id uuid primary key default gen_random_uuid(), group_key text unique not null, name text not null, group_type text not null default 'static' check(group_type in('static','dynamic','imported')),
 rule_definition jsonb not null default '{}', status text not null default 'active', created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_group_members(
 group_id uuid not null references public.angelcare_marketplace_wallet_groups(id) on delete cascade, customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
 source text not null default 'manual', joined_at timestamptz not null default now(), expires_at timestamptz, primary key(group_id,customer_account_id)
);
create table if not exists public.angelcare_marketplace_wallet_campaigns(
 id uuid primary key default gen_random_uuid(), campaign_key text unique not null, name text not null, status text not null default 'draft' check(status in('draft','scheduled','active','suspended','completed','archived')),
 starts_at timestamptz, ends_at timestamptz, budget numeric(16,2), consumed_budget numeric(16,2) not null default 0, policy_ids uuid[] not null default '{}', targeting jsonb not null default '{}',
 created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_policy_import_jobs(
 id uuid primary key default gen_random_uuid(), public_reference text unique not null default ('WPI-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 import_type text not null, status text not null default 'uploaded', mode text not null default 'validate', file_name text, rows_total integer not null default 0,
 rows_valid integer not null default 0, rows_invalid integer not null default 0, error_report jsonb not null default '[]', rollback_snapshot jsonb not null default '{}', created_by uuid,
 created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.angelcare_marketplace_wallet_risk_cases(
 id uuid primary key default gen_random_uuid(), wallet_account_id uuid not null references public.angelcare_marketplace_wallet_accounts(id), status text not null default 'open',
 risk_type text not null, severity text not null default 'medium' check(severity in('low','medium','high','critical')), summary text not null, evidence jsonb not null default '{}',
 opened_by uuid, owner_id uuid, opened_at timestamptz not null default now(), resolved_at timestamptz, resolution text, updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_wallet_reconciliation_items(
 id uuid primary key default gen_random_uuid(), wallet_account_id uuid references public.angelcare_marketplace_wallet_accounts(id), payment_intent_id uuid references public.angelcare_marketplace_payment_intents(id),
 ledger_entry_id uuid references public.angelcare_marketplace_wallet_ledger_entries(id), expected_amount numeric(16,2) not null default 0, actual_amount numeric(16,2) not null default 0,
 status text not null default 'open' check(status in('open','investigating','matched','adjusted','reconciled','waived')), reason text, evidence jsonb not null default '{}',
 created_at timestamptz not null default now(), reconciled_at timestamptz, updated_at timestamptz not null default now()
);

-- ============================================================================
-- ENTERPRISE ORDER EVENT EXTENSIONS
-- ============================================================================
create table if not exists public.angelcare_marketplace_order_events(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 event_type text not null, status text not null, customer_visible boolean not null default true, reason text, evidence jsonb not null default '{}', created_by uuid,
 occurred_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_order_line_events(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 line_reference text not null, event_type text not null, status text not null default 'recorded', quantity numeric(12,2) not null default 1,
 amount numeric(16,2), currency_label text not null default 'Dh', reason text, evidence jsonb not null default '{}', created_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_order_communications(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
 channel text not null, direction text not null check(direction in('inbound','outbound')), subject text, message text not null, status text not null default 'queued',
 customer_visible boolean not null default true, provider_reference text, evidence jsonb not null default '{}', created_by uuid, created_at timestamptz not null default now(), delivered_at timestamptz
);
create table if not exists public.angelcare_marketplace_order_adjustments(
 id uuid primary key default gen_random_uuid(), journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete restrict,
 adjustment_type text not null, amount numeric(16,2) not null, currency_label text not null default 'Dh', reason_code text not null, reason text not null,
 compensation_reference text, status text not null default 'recorded', evidence jsonb not null default '{}', created_by uuid, created_at timestamptz not null default now()
);

-- ============================================================================
-- IMMUTABLE LEDGER AND RESERVATION FUNCTIONS
-- ============================================================================
create or replace function public.angelcare_marketplace_wallet_refresh_totals(p_wallet_account_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_available numeric(16,2);v_purchased numeric(16,2);v_bonus numeric(16,2);v_reserved numeric(16,2);v_expiring numeric(16,2);
begin
 select coalesce(sum(available_amount),0),coalesce(sum(available_amount) filter(where bucket_kind='purchased'),0),
 coalesce(sum(available_amount) filter(where bucket_kind in('promotional','goodwill','refund','employer','gift')),0),coalesce(sum(reserved_amount),0),
 coalesce(sum(available_amount) filter(where expires_at is not null and expires_at>now()),0)
 into v_available,v_purchased,v_bonus,v_reserved,v_expiring from public.angelcare_marketplace_wallet_balance_buckets where wallet_account_id=p_wallet_account_id;
 update public.angelcare_marketplace_wallet_accounts set available_balance=v_available,purchased_balance=v_purchased,bonus_balance=v_bonus,reserved_balance=v_reserved,expiring_balance=v_expiring,updated_at=now() where id=p_wallet_account_id;
end$$;

create or replace function public.angelcare_marketplace_wallet_post_entry(
 p_wallet_account_id uuid,p_entry_type text,p_bucket_kind text,p_direction text,p_amount numeric,p_source_type text,p_source_id uuid,
 p_reason_code text,p_description text,p_idempotency_key text,p_expires_at timestamptz default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_existing uuid;v_bucket uuid;v_available numeric(16,2);v_total numeric(16,2);v_entry uuid;
begin
 if p_amount is null or p_amount<=0 then raise exception 'wallet amount must be positive';end if;
 select id into v_existing from public.angelcare_marketplace_wallet_ledger_entries where idempotency_key=p_idempotency_key;
 if v_existing is not null then return v_existing;end if;
 perform 1 from public.angelcare_marketplace_wallet_accounts where id=p_wallet_account_id and status in('active','restricted') for update;
 if not found then raise exception 'wallet account unavailable';end if;
 select id,available_amount into v_bucket,v_available from public.angelcare_marketplace_wallet_balance_buckets where wallet_account_id=p_wallet_account_id and bucket_kind=p_bucket_kind and expires_at is not distinct from p_expires_at order by created_at limit 1 for update;
 if v_bucket is null then
  insert into public.angelcare_marketplace_wallet_balance_buckets(wallet_account_id,bucket_kind,available_amount,reserved_amount,expires_at) values(p_wallet_account_id,p_bucket_kind,0,0,p_expires_at) returning id,available_amount into v_bucket,v_available;
 end if;
 if p_direction='debit' and v_available<p_amount then raise exception 'insufficient wallet bucket balance';end if;
 update public.angelcare_marketplace_wallet_balance_buckets set available_amount=case when p_direction='credit' then available_amount+p_amount else available_amount-p_amount end,updated_at=now() where id=v_bucket;
 perform public.angelcare_marketplace_wallet_refresh_totals(p_wallet_account_id);
 select available_balance into v_total from public.angelcare_marketplace_wallet_accounts where id=p_wallet_account_id;
 insert into public.angelcare_marketplace_wallet_ledger_entries(wallet_account_id,entry_type,bucket_kind,direction,amount,balance_after,source_type,source_id,reason_code,description,idempotency_key,effective_at,expires_at)
 values(p_wallet_account_id,p_entry_type,p_bucket_kind,p_direction,p_amount,v_total,p_source_type,p_source_id,p_reason_code,p_description,p_idempotency_key,now(),p_expires_at) returning id into v_entry;
 update public.angelcare_marketplace_wallet_accounts set
  lifetime_funded=lifetime_funded+case when p_entry_type='top_up' and p_direction='credit' then p_amount else 0 end,
  lifetime_spent=lifetime_spent+case when p_entry_type='purchase_commit' and p_direction='debit' then p_amount else 0 end,
  updated_at=now() where id=p_wallet_account_id;
 return v_entry;
end$$;

create or replace function public.angelcare_marketplace_wallet_reserve(p_wallet_account_id uuid,p_amount numeric,p_source_type text,p_source_id uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_existing uuid;v_remaining numeric(16,2):=p_amount;v_take numeric(16,2);v_reservation uuid;v_alloc jsonb:='[]'::jsonb;v_row record;
begin
 if p_amount is null or p_amount<=0 then raise exception 'reservation amount must be positive';end if;
 select id into v_existing from public.angelcare_marketplace_wallet_reservations where idempotency_key=p_idempotency_key;
 if v_existing is not null then return v_existing;end if;
 perform 1 from public.angelcare_marketplace_wallet_accounts where id=p_wallet_account_id and status='active' for update;
 if not found then raise exception 'wallet not active';end if;
 if (select coalesce(sum(available_amount),0) from public.angelcare_marketplace_wallet_balance_buckets where wallet_account_id=p_wallet_account_id and (expires_at is null or expires_at>now()))<p_amount then raise exception 'insufficient wallet balance';end if;
 insert into public.angelcare_marketplace_wallet_reservations(wallet_account_id,amount,source_type,source_id,idempotency_key) values(p_wallet_account_id,p_amount,p_source_type,p_source_id,p_idempotency_key) returning id into v_reservation;
 for v_row in select id,bucket_kind,available_amount,expires_at from public.angelcare_marketplace_wallet_balance_buckets where wallet_account_id=p_wallet_account_id and available_amount>0 and (expires_at is null or expires_at>now()) order by case when expires_at is null then 1 else 0 end,expires_at,bucket_kind for update loop
  exit when v_remaining<=0;v_take:=least(v_remaining,v_row.available_amount);
  update public.angelcare_marketplace_wallet_balance_buckets set available_amount=available_amount-v_take,reserved_amount=reserved_amount+v_take,updated_at=now() where id=v_row.id;
  v_alloc:=v_alloc||jsonb_build_array(jsonb_build_object('bucket_id',v_row.id,'bucket_kind',v_row.bucket_kind,'amount',v_take,'expires_at',v_row.expires_at));v_remaining:=v_remaining-v_take;
 end loop;
 update public.angelcare_marketplace_wallet_reservations set allocation=v_alloc,updated_at=now() where id=v_reservation;
 perform public.angelcare_marketplace_wallet_refresh_totals(p_wallet_account_id);return v_reservation;
end$$;

create or replace function public.angelcare_marketplace_wallet_release(p_reservation_id uuid,p_reason text default 'reservation_release')
returns void language plpgsql security definer set search_path=public as $$
declare v_res record;v_item jsonb;
begin
 select * into v_res from public.angelcare_marketplace_wallet_reservations where id=p_reservation_id for update;
 if v_res.id is null or v_res.status<>'reserved' then return;end if;
 for v_item in select * from jsonb_array_elements(v_res.allocation) loop
  update public.angelcare_marketplace_wallet_balance_buckets set available_amount=available_amount+(v_item->>'amount')::numeric,reserved_amount=greatest(0,reserved_amount-(v_item->>'amount')::numeric),updated_at=now() where id=(v_item->>'bucket_id')::uuid;
 end loop;
 update public.angelcare_marketplace_wallet_reservations set status='released',released_at=now(),updated_at=now() where id=p_reservation_id;
 perform public.angelcare_marketplace_wallet_refresh_totals(v_res.wallet_account_id);
 insert into public.angelcare_marketplace_wallet_ledger_entries(wallet_account_id,entry_type,bucket_kind,direction,amount,balance_after,source_type,source_id,reason_code,description,idempotency_key,effective_at)
 select v_res.wallet_account_id,'reservation_release','reserved','credit',v_res.amount,w.available_balance,v_res.source_type,v_res.source_id,p_reason,'Réservation AC Wallet libérée','release:'||p_reservation_id::text,now() from public.angelcare_marketplace_wallet_accounts w where w.id=v_res.wallet_account_id on conflict(idempotency_key) do nothing;
end$$;

create or replace function public.angelcare_marketplace_wallet_commit_reservation(p_reservation_id uuid,p_order_reference text,p_payment_reference text)
returns void language plpgsql security definer set search_path=public as $$
declare v_res record;v_item jsonb;v_total numeric(16,2);
begin
 select * into v_res from public.angelcare_marketplace_wallet_reservations where id=p_reservation_id for update;
 if v_res.id is null or v_res.status='committed' then return;end if;if v_res.status<>'reserved' then raise exception 'reservation not committable';end if;
 for v_item in select * from jsonb_array_elements(v_res.allocation) loop
  update public.angelcare_marketplace_wallet_balance_buckets set reserved_amount=greatest(0,reserved_amount-(v_item->>'amount')::numeric),updated_at=now() where id=(v_item->>'bucket_id')::uuid;
 end loop;
 update public.angelcare_marketplace_wallet_reservations set status='committed',committed_at=now(),updated_at=now() where id=p_reservation_id;
 perform public.angelcare_marketplace_wallet_refresh_totals(v_res.wallet_account_id);select available_balance into v_total from public.angelcare_marketplace_wallet_accounts where id=v_res.wallet_account_id;
 insert into public.angelcare_marketplace_wallet_ledger_entries(wallet_account_id,entry_type,bucket_kind,direction,amount,balance_after,source_type,source_id,order_reference,payment_reference,reason_code,description,idempotency_key,effective_at)
 values(v_res.wallet_account_id,'purchase_commit','reserved','debit',v_res.amount,v_total,v_res.source_type,v_res.source_id,p_order_reference,p_payment_reference,'canonical_purchase','Paiement AC Wallet capturé','commit:'||p_reservation_id::text,now()) on conflict(idempotency_key) do nothing;
 update public.angelcare_marketplace_wallet_accounts set lifetime_spent=lifetime_spent+v_res.amount,updated_at=now() where id=v_res.wallet_account_id;
end$$;

create or replace function public.angelcare_marketplace_claim_guest_commerce(p_customer_account_id uuid,p_auth_user_id uuid,p_visitor_reference text,p_email text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_hash text;v_conversions int:=0;v_journeys int:=0;v_family uuid;
begin
 v_hash:=encode(digest(p_visitor_reference,'sha256'),'hex');
 select family_account_id into v_family from public.angelcare_marketplace_customer_accounts where id=p_customer_account_id;
 update public.angelcare_marketplace_conversion_sessions set customer_account_id=p_customer_account_id,family_account_id=coalesce(family_account_id,v_family),updated_at=now() where visitor_reference_hash=v_hash and customer_account_id is null;get diagnostics v_conversions=row_count;
 update public.angelcare_marketplace_journeys j set customer_account_id=p_customer_account_id,family_account_id=coalesce(j.family_account_id,v_family),customer_context=j.customer_context||jsonb_build_object('customer_account_id',p_customer_account_id,'email',p_email),updated_at=now()
 where j.customer_account_id is null and (j.conversion_outcome_id in(select outcome_id from public.angelcare_marketplace_conversion_sessions where customer_account_id=p_customer_account_id and outcome_id is not null) or lower(coalesce(j.customer_context->>'email',''))=lower(coalesce(p_email,'')));get diagnostics v_journeys=row_count;
 return jsonb_build_object('conversions',v_conversions,'journeys',v_journeys);
end$$;

-- Protect ledger immutability from ordinary UPDATE/DELETE.
create or replace function public.angelcare_marketplace_prevent_wallet_ledger_mutation() returns trigger language plpgsql as $$begin raise exception 'AC Wallet ledger is immutable; create a compensating entry';end$$;
drop trigger if exists ac_wallet_ledger_immutable_update on public.angelcare_marketplace_wallet_ledger_entries;
create trigger ac_wallet_ledger_immutable_update before update or delete on public.angelcare_marketplace_wallet_ledger_entries for each row execute function public.angelcare_marketplace_prevent_wallet_ledger_mutation();

-- ============================================================================
-- CONFIGURATION SEEDS: NO ACTIVE DISCOUNT OR FABRICATED BALANCE
-- ============================================================================
insert into public.angelcare_marketplace_wallet_tiers(tier_key,name_fr,name_en,name_ar,rank,qualification_rules,benefits_summary)
values
 ('member','AC Wallet Member','AC Wallet Member','عضو محفظة AC',100,'{}','{}'),
 ('plus','AC Wallet Plus','AC Wallet Plus','محفظة AC بلس',200,'{"lifetime_spent":5000}','{}'),
 ('signature','AC Wallet Signature','AC Wallet Signature','محفظة AC سيغنتشر',300,'{"lifetime_spent":20000}','{}'),
 ('family','AC Wallet Family','AC Wallet Family','محفظة AC للعائلة',250,'{"account_kind":"family"}','{}'),
 ('business','AC Wallet Business','AC Wallet Business','محفظة AC للأعمال',250,'{"account_kind":"organization"}','{}')
on conflict(tier_key) do update set name_fr=excluded.name_fr,name_en=excluded.name_en,name_ar=excluded.name_ar,updated_at=now();

insert into public.angelcare_marketplace_payment_methods(method_key,method_kind,provider_key,status,supports_split,supports_refund,display_content)
values
 ('ac_wallet','ac_wallet','ac_wallet','active',true,true,'{"fr":"AC Privilege Wallet","en":"AC Privilege Wallet","ar":"محفظة AC المميزة"}'),
 ('bank_transfer','bank_transfer','manual_bank_transfer','active',true,true,'{"fr":"Virement bancaire","en":"Bank transfer","ar":"تحويل بنكي"}'),
 ('invoice','invoice','invoice_workflow','active',true,true,'{"fr":"Paiement sur facture","en":"Invoice payment","ar":"دفع بالفاتورة"}'),
 ('pay_at_location','pay_at_location','manual_location','active',false,true,'{"fr":"Paiement sur place","en":"Pay at location","ar":"الدفع في الموقع"}'),
 ('card','card','unconfigured','inactive',true,true,'{"fr":"Carte bancaire","en":"Payment card","ar":"بطاقة الدفع"}')
on conflict(method_key) do update set method_kind=excluded.method_kind,display_content=excluded.display_content,updated_at=now();

-- Draft templates are intentionally inactive until AngelCare configures a real commercial rule.
insert into public.angelcare_marketplace_wallet_policies(policy_key,name_fr,name_en,name_ar,description_fr,status,priority,stack_mode,conditions,benefits,customer_message)
values
 ('wallet-payment-comparison-template','Comparaison Wallet — modèle','Wallet comparison — template','مقارنة المحفظة — نموذج','Modèle sans réduction active. Configurer, simuler puis activer explicitement.','draft',100,'best_benefit','{"wallet_payment_required":true}','{"percentage_discount":0}','{"fr":"Avantage AC Wallet","en":"AC Wallet benefit","ar":"ميزة محفظة AC"}'),
 ('topup-bonus-template','Bonus recharge — modèle','Top-up bonus — template','مكافأة الشحن — نموذج','Modèle sans bonus actif.','draft',100,'best_benefit','{"topup_minimum":0}','{"topup_bonus_percent":0}','{"fr":"Bonus de recharge","en":"Top-up bonus","ar":"مكافأة الشحن"}')
on conflict(policy_key) do nothing;

-- ============================================================================
-- RLS, SERVER-ONLY MUTATION AND CUSTOMER READ POLICIES
-- ============================================================================
do $$declare t text;begin
 foreach t in array array[
 'angelcare_marketplace_customer_accounts','angelcare_marketplace_customer_verifications','angelcare_marketplace_customer_session_events','angelcare_marketplace_customer_addresses','angelcare_marketplace_customer_organization_memberships','angelcare_marketplace_customer_notification_preferences',
 'angelcare_marketplace_payment_methods','angelcare_marketplace_payment_intents','angelcare_marketplace_payment_attempts','angelcare_marketplace_payment_provider_events','angelcare_marketplace_payment_allocations','angelcare_marketplace_payment_refunds','angelcare_marketplace_payment_disputes','angelcare_marketplace_payment_reconciliation_items',
 'angelcare_marketplace_wallet_accounts','angelcare_marketplace_wallet_balance_buckets','angelcare_marketplace_wallet_ledger_entries','angelcare_marketplace_wallet_reservations','angelcare_marketplace_wallet_topups','angelcare_marketplace_wallet_tiers','angelcare_marketplace_wallet_memberships','angelcare_marketplace_wallet_policies','angelcare_marketplace_wallet_policy_versions','angelcare_marketplace_wallet_policy_assignments','angelcare_marketplace_wallet_policy_evaluations','angelcare_marketplace_wallet_groups','angelcare_marketplace_wallet_group_members','angelcare_marketplace_wallet_campaigns','angelcare_marketplace_wallet_policy_import_jobs','angelcare_marketplace_wallet_risk_cases','angelcare_marketplace_wallet_reconciliation_items',
 'angelcare_marketplace_order_events','angelcare_marketplace_order_line_events','angelcare_marketplace_order_communications','angelcare_marketplace_order_adjustments']
 loop execute format('alter table public.%I enable row level security',t);end loop;
end$$;

-- Direct browser table access is intentionally denied by RLS; server APIs validate ownership and permissions.
-- Existing project-wide grants remain untouched.
grant execute on function public.angelcare_marketplace_wallet_refresh_totals(uuid) to service_role;
grant execute on function public.angelcare_marketplace_wallet_post_entry(uuid,text,text,text,numeric,text,uuid,text,text,text,timestamptz) to service_role;
grant execute on function public.angelcare_marketplace_wallet_reserve(uuid,numeric,text,uuid,text) to service_role;
grant execute on function public.angelcare_marketplace_wallet_release(uuid,text) to service_role;
grant execute on function public.angelcare_marketplace_wallet_commit_reservation(uuid,text,text) to service_role;
grant execute on function public.angelcare_marketplace_claim_guest_commerce(uuid,uuid,text,text) to service_role;

-- Operational indexes.
create index if not exists ac_payment_attempt_intent_idx on public.angelcare_marketplace_payment_attempts(payment_intent_id,attempt_number desc);
create index if not exists ac_wallet_topup_customer_idx on public.angelcare_marketplace_wallet_topups(customer_account_id,created_at desc);
create index if not exists ac_wallet_assignment_customer_idx on public.angelcare_marketplace_wallet_policy_assignments(customer_account_id,status,starts_at,ends_at);
create index if not exists ac_wallet_evaluation_customer_idx on public.angelcare_marketplace_wallet_policy_evaluations(customer_account_id,created_at desc);
create index if not exists ac_order_line_event_journey_idx on public.angelcare_marketplace_order_line_events(journey_id,created_at desc);

-- Acceptance result.
select
 'customer_identity_payment_ac_wallet_order_command_applied' as result,
 (select count(*) from public.angelcare_marketplace_wallet_tiers where status='active') as wallet_tiers,
 (select count(*) from public.angelcare_marketplace_payment_methods) as payment_method_definitions,
 (select count(*) from public.angelcare_marketplace_wallet_policies where status='active') as active_wallet_policies,
 (select count(*) from public.angelcare_marketplace_wallet_accounts) as real_wallet_accounts,
 (select count(*) from public.angelcare_marketplace_payment_intents) as real_payment_intents;
commit;
