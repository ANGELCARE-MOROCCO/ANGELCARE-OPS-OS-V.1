-- Market-OS Database Sync + CRUD layer for Ambassador Program and Partners Network
-- Safe to run after previous Market-OS migrations. Uses IF NOT EXISTS.

create extension if not exists pgcrypto;

create table if not exists market_os_execution_events (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  resource_key text not null,
  record_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function market_os_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists market_os_ambassadors (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'draft', type text, city text, area text, phone text, email text, assigned_manager text, commission_model text, contract_status text, kyc_status text, risk_score numeric default 0, performance_score numeric default 0, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_programs (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'draft', program_type text, target_audience text, commission_model text, kpi_target text, approval_workflow text, eligibility_rules jsonb not null default '{}'::jsonb, reward_rules jsonb not null default '{}'::jsonb, compliance_rules jsonb not null default '{}'::jsonb, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_missions (id uuid primary key default gen_random_uuid(), title text, name text, status text default 'draft', priority text, deadline text, expected_proof text, assigned_to text, assigned_manager text, program_id uuid, validation_status text default 'pending', checklist jsonb not null default '[]'::jsonb, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_leads (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'submitted', phone text, city text, source_code text, owner_name text, ambassador_id uuid, validation_status text default 'pending', conversion_value numeric default 0, lost_reason text, duplicate_risk numeric default 0, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_payouts (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'pending', amount numeric default 0, currency text default 'MAD', period text, approval_status text default 'pending', payment_reference text, ambassador_id uuid, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_territories (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'active', city text, zone text, coverage_score numeric default 0, saturation_score numeric default 0, assigned_owner text, restrictions jsonb not null default '{}'::jsonb, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_documents (id uuid primary key default gen_random_uuid(), title text, name text, status text default 'pending', document_type text, owner_name text, approval_status text default 'pending', expires_at text, file_url text, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_ambassador_approvals (id uuid primary key default gen_random_uuid(), title text, name text, status text default 'pending', approval_type text, requested_by text, assigned_to text, risk_level text, decision_note text, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists market_os_partners (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'prospect', partner_type text, city text, area text, phone text, email text, assigned_manager text, contract_status text, commission_model text, risk_score numeric default 0, performance_score numeric default 0, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_programs (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'draft', program_type text, services_allowed text, commission_model text, workflow_definition text, eligibility_rules jsonb not null default '{}'::jsonb, compliance_rules jsonb not null default '{}'::jsonb, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_leads (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'submitted', phone text, city text, partner_code text, partner_id uuid, validation_status text default 'pending', conversion_value numeric default 0, lost_reason text, duplicate_risk numeric default 0, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_deals (id uuid primary key default gen_random_uuid(), title text, name text, status text default 'open', deal_stage text, partner_name text, partner_id uuid, value numeric default 0, sla_status text default 'on_track', assigned_owner text, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_payouts (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'pending', amount numeric default 0, currency text default 'MAD', period text, approval_status text default 'pending', payment_reference text, partner_id uuid, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_territories (id uuid primary key default gen_random_uuid(), name text, title text, status text default 'active', city text, zone text, coverage_score numeric default 0, saturation_score numeric default 0, assigned_owner text, restrictions jsonb not null default '{}'::jsonb, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_documents (id uuid primary key default gen_random_uuid(), title text, name text, status text default 'pending', document_type text, partner_name text, approval_status text default 'pending', expires_at text, file_url text, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists market_os_partner_approvals (id uuid primary key default gen_random_uuid(), title text, name text, status text default 'pending', approval_type text, requested_by text, assigned_to text, risk_level text, decision_note text, description text, notes text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'market_os_ambassadors','market_os_ambassador_programs','market_os_ambassador_missions','market_os_ambassador_leads','market_os_ambassador_payouts','market_os_ambassador_territories','market_os_ambassador_documents','market_os_ambassador_approvals',
    'market_os_partners','market_os_partner_programs','market_os_partner_leads','market_os_partner_deals','market_os_partner_payouts','market_os_partner_territories','market_os_partner_documents','market_os_partner_approvals'
  ] LOOP
    execute format('drop trigger if exists %I on %I', 'market_os_touch_updated_at_trigger', t);
    execute format('create trigger %I before update on %I for each row execute function market_os_touch_updated_at()', 'market_os_touch_updated_at_trigger', t);
  END LOOP;
END $$;

create index if not exists idx_market_os_events_module_resource on market_os_execution_events(module_key, resource_key, created_at desc);
create index if not exists idx_market_os_ambassadors_status on market_os_ambassadors(status);
create index if not exists idx_market_os_partners_status on market_os_partners(status);

insert into market_os_ambassadors (name, status, type, city, area, assigned_manager, commission_model, risk_score, performance_score)
values ('Casablanca Family Referral Ambassador', 'active', 'family_referrer', 'Casablanca', 'Maarif', 'Market Manager', 'tiered referral', 8, 82), ('Rabat Community Outreach Ambassador', 'draft', 'community_agent', 'Rabat', 'Agdal', 'Market Manager', 'fixed + bonus', 4, 61)
on conflict do nothing;

insert into market_os_partners (name, status, partner_type, city, assigned_manager, contract_status, commission_model, risk_score, performance_score)
values ('Pharmacy Referral Partner Template', 'prospect', 'pharmacy', 'Casablanca', 'Partnership Manager', 'draft', 'fixed per validated lead', 6, 72), ('Clinic Discharge Referral Partner Template', 'active', 'clinic', 'Rabat', 'Partnership Manager', 'signed', 'percentage revenue share', 3, 88)
on conflict do nothing;
