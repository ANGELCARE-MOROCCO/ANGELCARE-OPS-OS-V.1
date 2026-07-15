-- AngelCare Market OS — Ambassador Module Production Completion / Schema Compatibility Fix
-- Date: 2026-07-09
-- Purpose: complete Ambassador OS persistence while supporting existing Supabase schemas where
-- market_os_ambassadors.id and settings.id may already be UUID or TEXT in partial schemas.

create extension if not exists pgcrypto;

-- 1) Parent tables first. New installs use UUID ids; existing installs keep their current id type.
create table if not exists public.market_os_ambassadors (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  city text,
  region text,
  zone text,
  role text,
  title text,
  profile_type text,
  status text not null default 'active',
  lifecycle_stage text not null default 'active',
  territory_id text,
  territory_name text,
  manager_name text,
  performance_score numeric not null default 0,
  kpi_score numeric not null default 0,
  missions_assigned numeric not null default 0,
  missions_completed numeric not null default 0,
  leads_generated numeric not null default 0,
  hot_leads numeric not null default 0,
  meetings_booked numeric not null default 0,
  incentives_balance numeric not null default 0,
  certification_status text not null default 'pending',
  drive_folder_url text,
  notes text,
  source text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_os_ambassadors add column if not exists full_name text;
alter table public.market_os_ambassadors add column if not exists email text;
alter table public.market_os_ambassadors add column if not exists phone text;
alter table public.market_os_ambassadors add column if not exists city text;
alter table public.market_os_ambassadors add column if not exists region text;
alter table public.market_os_ambassadors add column if not exists zone text;
alter table public.market_os_ambassadors add column if not exists role text;
alter table public.market_os_ambassadors add column if not exists title text;
alter table public.market_os_ambassadors add column if not exists profile_type text;
alter table public.market_os_ambassadors add column if not exists status text not null default 'active';
alter table public.market_os_ambassadors add column if not exists lifecycle_stage text not null default 'active';
alter table public.market_os_ambassadors add column if not exists territory_id text;
alter table public.market_os_ambassadors add column if not exists territory_name text;
alter table public.market_os_ambassadors add column if not exists manager_name text;
alter table public.market_os_ambassadors add column if not exists performance_score numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists kpi_score numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists missions_assigned numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists missions_completed numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists leads_generated numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists hot_leads numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists meetings_booked numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists incentives_balance numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists certification_status text not null default 'pending';
alter table public.market_os_ambassadors add column if not exists drive_folder_url text;
alter table public.market_os_ambassadors add column if not exists notes text;
alter table public.market_os_ambassadors add column if not exists source text;
alter table public.market_os_ambassadors add column if not exists archived_at timestamptz;
alter table public.market_os_ambassadors add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassadors add column if not exists updated_at timestamptz not null default now();

create table if not exists public.market_os_ambassador_territories (
  id uuid primary key default gen_random_uuid(),
  name text,
  city text,
  region text,
  zone text,
  manager_name text,
  coverage_goal numeric not null default 0,
  active_ambassadors_count numeric not null default 0,
  status text not null default 'active',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_os_ambassador_territories add column if not exists name text;
alter table public.market_os_ambassador_territories add column if not exists city text;
alter table public.market_os_ambassador_territories add column if not exists region text;
alter table public.market_os_ambassador_territories add column if not exists zone text;
alter table public.market_os_ambassador_territories add column if not exists manager_name text;
alter table public.market_os_ambassador_territories add column if not exists coverage_goal numeric not null default 0;
alter table public.market_os_ambassador_territories add column if not exists active_ambassadors_count numeric not null default 0;
alter table public.market_os_ambassador_territories add column if not exists status text not null default 'active';
alter table public.market_os_ambassador_territories add column if not exists notes text;
alter table public.market_os_ambassador_territories add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_territories add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_territories add column if not exists updated_at timestamptz not null default now();

-- 2) Child tables. Their foreign-key columns follow the actual parent id types, so UUID/TEXT mixed legacy schemas do not break the migration.
do $$
declare
  ambassador_id_type text;
  territory_id_type text;
begin
  select udt_name into ambassador_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'market_os_ambassadors'
    and column_name = 'id'
  limit 1;

  select udt_name into territory_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'market_os_ambassador_territories'
    and column_name = 'id'
  limit 1;

  ambassador_id_type := coalesce(ambassador_id_type, 'uuid');
  territory_id_type := coalesce(territory_id_type, 'uuid');

  execute format($ddl$
    create table if not exists public.market_os_ambassador_missions (
      id uuid primary key default gen_random_uuid(),
      ambassador_id %s references public.market_os_ambassadors(id) on delete set null,
      territory_id %s references public.market_os_ambassador_territories(id) on delete set null,
      title text,
      mission_type text not null default 'field_activation',
      priority text not null default 'normal',
      status text not null default 'assigned',
      city text,
      region text,
      due_date date,
      completed_at timestamptz,
      archived_at timestamptz,
      description text,
      instructions text,
      evidence_url text,
      proof_status text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $ddl$, ambassador_id_type, territory_id_type);

  execute format('alter table public.market_os_ambassador_missions add column if not exists ambassador_id %s', ambassador_id_type);
  execute format('alter table public.market_os_ambassador_missions add column if not exists territory_id %s', territory_id_type);

  execute format($ddl$
    create table if not exists public.market_os_ambassador_recruitment (
      id uuid primary key default gen_random_uuid(),
      candidate_name text,
      email text,
      phone text,
      city text,
      region text,
      source text,
      stage text not null default 'sourced',
      evaluation_score numeric not null default 0,
      interviewer text,
      next_step text,
      notes text,
      ambassador_id %s references public.market_os_ambassadors(id) on delete set null,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $ddl$, ambassador_id_type);

  execute format('alter table public.market_os_ambassador_recruitment add column if not exists ambassador_id %s', ambassador_id_type);

  execute format($ddl$
    create table if not exists public.market_os_ambassador_onboarding (
      id uuid primary key default gen_random_uuid(),
      ambassador_id %s references public.market_os_ambassadors(id) on delete cascade,
      stage text not null default 'not_started',
      assigned_owner text,
      due_date date,
      completed_at timestamptz,
      completion_rate numeric not null default 0,
      checklist jsonb not null default '[]'::jsonb,
      notes text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $ddl$, ambassador_id_type);

  execute format('alter table public.market_os_ambassador_onboarding add column if not exists ambassador_id %s', ambassador_id_type);

  execute format($ddl$
    create table if not exists public.market_os_ambassador_training (
      id uuid primary key default gen_random_uuid(),
      ambassador_id %s references public.market_os_ambassadors(id) on delete cascade,
      training_name text,
      certification_name text,
      status text not null default 'assigned',
      certification_status text not null default 'pending',
      score numeric not null default 0,
      valid_until date,
      issued_by text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $ddl$, ambassador_id_type);

  execute format('alter table public.market_os_ambassador_training add column if not exists ambassador_id %s', ambassador_id_type);

  execute format($ddl$
    create table if not exists public.market_os_ambassador_goals (
      id uuid primary key default gen_random_uuid(),
      ambassador_id %s references public.market_os_ambassadors(id) on delete cascade,
      period text not null default 'current',
      goal_type text,
      target_value numeric not null default 0,
      current_value numeric not null default 0,
      completion_rate numeric not null default 0,
      status text not null default 'tracking',
      manager_notes text,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $ddl$, ambassador_id_type);

  execute format('alter table public.market_os_ambassador_goals add column if not exists ambassador_id %s', ambassador_id_type);

  execute format($ddl$
    create table if not exists public.market_os_ambassador_incentives (
      id uuid primary key default gen_random_uuid(),
      ambassador_id %s references public.market_os_ambassadors(id) on delete cascade,
      incentive_type text not null default 'performance_bonus',
      amount numeric not null default 0,
      currency text not null default 'MAD',
      status text not null default 'pending',
      reason text,
      approved_by text,
      approved_at timestamptz,
      paid_at timestamptz,
      archived_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $ddl$, ambassador_id_type);

  execute format('alter table public.market_os_ambassador_incentives add column if not exists ambassador_id %s', ambassador_id_type);
end $$;

-- 3) Add non-key columns for child tables that may have existed before this completion migration.
alter table public.market_os_ambassador_missions add column if not exists title text;
alter table public.market_os_ambassador_missions add column if not exists mission_type text not null default 'field_activation';
alter table public.market_os_ambassador_missions add column if not exists priority text not null default 'normal';
alter table public.market_os_ambassador_missions add column if not exists status text not null default 'assigned';
alter table public.market_os_ambassador_missions add column if not exists city text;
alter table public.market_os_ambassador_missions add column if not exists region text;
alter table public.market_os_ambassador_missions add column if not exists due_date date;
alter table public.market_os_ambassador_missions add column if not exists completed_at timestamptz;
alter table public.market_os_ambassador_missions add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_missions add column if not exists description text;
alter table public.market_os_ambassador_missions add column if not exists instructions text;
alter table public.market_os_ambassador_missions add column if not exists evidence_url text;
alter table public.market_os_ambassador_missions add column if not exists proof_status text;
alter table public.market_os_ambassador_missions add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_missions add column if not exists updated_at timestamptz not null default now();

alter table public.market_os_ambassador_recruitment add column if not exists candidate_name text;
alter table public.market_os_ambassador_recruitment add column if not exists email text;
alter table public.market_os_ambassador_recruitment add column if not exists phone text;
alter table public.market_os_ambassador_recruitment add column if not exists city text;
alter table public.market_os_ambassador_recruitment add column if not exists region text;
alter table public.market_os_ambassador_recruitment add column if not exists source text;
alter table public.market_os_ambassador_recruitment add column if not exists stage text not null default 'sourced';
alter table public.market_os_ambassador_recruitment add column if not exists evaluation_score numeric not null default 0;
alter table public.market_os_ambassador_recruitment add column if not exists interviewer text;
alter table public.market_os_ambassador_recruitment add column if not exists next_step text;
alter table public.market_os_ambassador_recruitment add column if not exists notes text;
alter table public.market_os_ambassador_recruitment add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_recruitment add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_recruitment add column if not exists updated_at timestamptz not null default now();

alter table public.market_os_ambassador_onboarding add column if not exists stage text not null default 'not_started';
alter table public.market_os_ambassador_onboarding add column if not exists assigned_owner text;
alter table public.market_os_ambassador_onboarding add column if not exists due_date date;
alter table public.market_os_ambassador_onboarding add column if not exists completed_at timestamptz;
alter table public.market_os_ambassador_onboarding add column if not exists completion_rate numeric not null default 0;
alter table public.market_os_ambassador_onboarding add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.market_os_ambassador_onboarding add column if not exists notes text;
alter table public.market_os_ambassador_onboarding add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_onboarding add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_onboarding add column if not exists updated_at timestamptz not null default now();

alter table public.market_os_ambassador_training add column if not exists training_name text;
alter table public.market_os_ambassador_training add column if not exists certification_name text;
alter table public.market_os_ambassador_training add column if not exists status text not null default 'assigned';
alter table public.market_os_ambassador_training add column if not exists certification_status text not null default 'pending';
alter table public.market_os_ambassador_training add column if not exists score numeric not null default 0;
alter table public.market_os_ambassador_training add column if not exists valid_until date;
alter table public.market_os_ambassador_training add column if not exists issued_by text;
alter table public.market_os_ambassador_training add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_training add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_training add column if not exists updated_at timestamptz not null default now();

alter table public.market_os_ambassador_goals add column if not exists period text not null default 'current';
alter table public.market_os_ambassador_goals add column if not exists goal_type text;
alter table public.market_os_ambassador_goals add column if not exists target_value numeric not null default 0;
alter table public.market_os_ambassador_goals add column if not exists current_value numeric not null default 0;
alter table public.market_os_ambassador_goals add column if not exists completion_rate numeric not null default 0;
alter table public.market_os_ambassador_goals add column if not exists status text not null default 'tracking';
alter table public.market_os_ambassador_goals add column if not exists manager_notes text;
alter table public.market_os_ambassador_goals add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_goals add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_goals add column if not exists updated_at timestamptz not null default now();

alter table public.market_os_ambassador_incentives add column if not exists incentive_type text not null default 'performance_bonus';
alter table public.market_os_ambassador_incentives add column if not exists amount numeric not null default 0;
alter table public.market_os_ambassador_incentives add column if not exists currency text not null default 'MAD';
alter table public.market_os_ambassador_incentives add column if not exists status text not null default 'pending';
alter table public.market_os_ambassador_incentives add column if not exists reason text;
alter table public.market_os_ambassador_incentives add column if not exists approved_by text;
alter table public.market_os_ambassador_incentives add column if not exists approved_at timestamptz;
alter table public.market_os_ambassador_incentives add column if not exists paid_at timestamptz;
alter table public.market_os_ambassador_incentives add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_incentives add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_incentives add column if not exists updated_at timestamptz not null default now();

create table if not exists public.market_os_ambassador_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text,
  title text,
  period_start date,
  period_end date,
  generated_by text,
  status text not null default 'generated',
  filters jsonb not null default '{}'::jsonb,
  row_count numeric not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_os_ambassador_reports add column if not exists report_type text;
alter table public.market_os_ambassador_reports add column if not exists title text;
alter table public.market_os_ambassador_reports add column if not exists period_start date;
alter table public.market_os_ambassador_reports add column if not exists period_end date;
alter table public.market_os_ambassador_reports add column if not exists generated_by text;
alter table public.market_os_ambassador_reports add column if not exists status text not null default 'generated';
alter table public.market_os_ambassador_reports add column if not exists filters jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_reports add column if not exists row_count numeric not null default 0;
alter table public.market_os_ambassador_reports add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_reports add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_reports add column if not exists updated_at timestamptz not null default now();

-- Settings: use a valid fixed UUID so both UUID and TEXT legacy schemas accept the default row.
create table if not exists public.market_os_ambassador_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  default_region text,
  approval_rules jsonb not null default '{}'::jsonb,
  incentive_rules jsonb not null default '{}'::jsonb,
  onboarding_rules jsonb not null default '{}'::jsonb,
  training_rules jsonb not null default '{}'::jsonb,
  kpi_rules jsonb not null default '{}'::jsonb,
  notification_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_os_ambassador_settings add column if not exists default_region text;
alter table public.market_os_ambassador_settings add column if not exists approval_rules jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_settings add column if not exists incentive_rules jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_settings add column if not exists onboarding_rules jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_settings add column if not exists training_rules jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_settings add column if not exists kpi_rules jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_settings add column if not exists notification_rules jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_settings add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_settings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.market_os_ambassador_audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text,
  action text not null,
  summary text,
  actor_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_os_ambassador_audit_logs add column if not exists entity_type text;
alter table public.market_os_ambassador_audit_logs add column if not exists entity_id text;
alter table public.market_os_ambassador_audit_logs add column if not exists action text;
alter table public.market_os_ambassador_audit_logs add column if not exists summary text;
alter table public.market_os_ambassador_audit_logs add column if not exists actor_name text;
alter table public.market_os_ambassador_audit_logs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.market_os_ambassador_audit_logs add column if not exists created_at timestamptz not null default now();
alter table public.market_os_ambassador_audit_logs add column if not exists updated_at timestamptz not null default now();

insert into public.market_os_ambassador_settings (
  id,
  default_region,
  approval_rules,
  incentive_rules,
  onboarding_rules,
  training_rules,
  kpi_rules,
  notification_rules
) values (
  '00000000-0000-0000-0000-000000000001',
  'Rabat / Casablanca',
  '{"payout_requires_manager_validation":true,"proof_required_before_payment":true,"child_image_publication_blocked_without_written_authorization":true}'::jsonb,
  '{"currency":"MAD","payment_states":["pending","approved","rejected","paid"]}'::jsonb,
  '{"mandatory_steps":["Profile verified","Files collected","Orientation completed","Training assigned","Territory confirmed"]}'::jsonb,
  '{"certification_min_score":80,"field_shadowing_required":true}'::jsonb,
  '{"default_daily_contacts":20,"default_daily_leads":5,"hot_lead_requires_call_followup":true}'::jsonb,
  '{"daily_report_required":true,"escalation_when_blocked_hours":24}'::jsonb
) on conflict (id) do update set
  default_region = excluded.default_region,
  approval_rules = excluded.approval_rules,
  incentive_rules = excluded.incentive_rules,
  onboarding_rules = excluded.onboarding_rules,
  training_rules = excluded.training_rules,
  kpi_rules = excluded.kpi_rules,
  notification_rules = excluded.notification_rules,
  updated_at = now();

create index if not exists idx_market_os_ambassadors_status on public.market_os_ambassadors(status);
create index if not exists idx_market_os_ambassadors_region on public.market_os_ambassadors(region);
create index if not exists idx_market_os_ambassadors_territory on public.market_os_ambassadors(territory_id);
create index if not exists idx_market_os_ambassador_missions_status on public.market_os_ambassador_missions(status);
create index if not exists idx_market_os_ambassador_missions_ambassador on public.market_os_ambassador_missions(ambassador_id);
create index if not exists idx_market_os_ambassador_recruitment_stage on public.market_os_ambassador_recruitment(stage);
create index if not exists idx_market_os_ambassador_onboarding_ambassador on public.market_os_ambassador_onboarding(ambassador_id);
create index if not exists idx_market_os_ambassador_training_ambassador on public.market_os_ambassador_training(ambassador_id);
create index if not exists idx_market_os_ambassador_goals_ambassador on public.market_os_ambassador_goals(ambassador_id);
create index if not exists idx_market_os_ambassador_incentives_status on public.market_os_ambassador_incentives(status);
create index if not exists idx_market_os_ambassador_audit_entity on public.market_os_ambassador_audit_logs(entity_type, entity_id);
