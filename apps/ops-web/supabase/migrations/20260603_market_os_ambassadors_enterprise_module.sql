create extension if not exists pgcrypto;

create or replace function public.market_os_ambassadors_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.market_os_ambassadors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  full_name text,
  name text,
  display_name text,
  email text,
  phone text,
  city text,
  region text,
  territory_id uuid,
  territory_name text,
  territory text,
  role text,
  title text,
  status text not null default 'candidate',
  lifecycle_stage text not null default 'candidate',
  manager_id uuid,
  manager_name text,
  recruitment_stage text,
  onboarding_stage text,
  training_status text,
  certification_status text,
  performance_score numeric not null default 0,
  score numeric not null default 0,
  kpi_score numeric not null default 0,
  missions_completed integer not null default 0,
  missions_assigned integer not null default 0,
  incentives_balance numeric not null default 0,
  last_activity_at timestamptz,
  joined_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_territories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  name text not null,
  title text,
  city text,
  region text,
  zone text,
  coverage_goal numeric not null default 0,
  active_ambassadors_count integer not null default 0,
  manager_name text,
  assigned_owner text,
  status text not null default 'active',
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  restrictions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_missions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  ambassador_id uuid references public.market_os_ambassadors(id) on delete set null,
  assigned_ambassador_id uuid references public.market_os_ambassadors(id) on delete set null,
  title text not null,
  name text,
  mission_type text,
  priority text not null default 'normal',
  status text not null default 'assigned',
  city text,
  region text,
  territory_id uuid references public.market_os_ambassador_territories(id) on delete set null,
  due_date timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  assigned_by text,
  description text,
  instructions text,
  proof_required boolean default true,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_recruitment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  candidate_name text not null,
  email text,
  phone text,
  city text,
  region text,
  source text,
  stage text not null default 'sourced',
  evaluation_score numeric not null default 0,
  interviewer text,
  notes text,
  next_step text,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_onboarding (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  ambassador_id uuid not null references public.market_os_ambassadors(id) on delete cascade,
  stage text not null default 'not_started',
  checklist jsonb not null default '[]'::jsonb,
  completion_rate numeric not null default 0,
  assigned_owner text,
  due_date timestamptz,
  completed_at timestamptz,
  notes text,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_training (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  ambassador_id uuid references public.market_os_ambassadors(id) on delete cascade,
  training_name text,
  module_title text,
  certification_name text,
  status text not null default 'assigned',
  certification_status text default 'pending',
  score numeric not null default 0,
  valid_until timestamptz,
  completed_at timestamptz,
  issued_by text,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_kpis (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  ambassador_id uuid references public.market_os_ambassadors(id) on delete cascade,
  period text not null default 'current',
  goal_type text not null,
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  completion_rate numeric not null default 0,
  status text not null default 'tracking',
  manager_notes text,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_incentives (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  ambassador_id uuid not null references public.market_os_ambassadors(id) on delete cascade,
  incentive_type text not null default 'performance_bonus',
  amount numeric not null default 0,
  amount_mad numeric not null default 0,
  currency text not null default 'MAD',
  status text not null default 'pending',
  reason text,
  approved_by text,
  approved_at timestamptz,
  paid_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  report_type text not null,
  title text not null,
  period_start timestamptz,
  period_end timestamptz,
  filters jsonb not null default '{}'::jsonb,
  generated_by text,
  status text not null default 'generated',
  export_url text,
  export_payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  tenant_id uuid,
  organization_id uuid,
  default_region text,
  approval_rules jsonb not null default '{}'::jsonb,
  incentive_rules jsonb not null default '{}'::jsonb,
  onboarding_rules jsonb not null default '{}'::jsonb,
  training_rules jsonb not null default '{}'::jsonb,
  kpi_rules jsonb not null default '{}'::jsonb,
  notification_rules jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_ambassador_audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  organization_id uuid,
  actor_id uuid,
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.market_os_ambassadors add column if not exists tenant_id uuid;
alter table public.market_os_ambassadors add column if not exists organization_id uuid;
alter table public.market_os_ambassadors add column if not exists full_name text;
alter table public.market_os_ambassadors add column if not exists display_name text;
alter table public.market_os_ambassadors add column if not exists region text;
alter table public.market_os_ambassadors add column if not exists territory_id uuid;
alter table public.market_os_ambassadors add column if not exists territory_name text;
alter table public.market_os_ambassadors add column if not exists role text;
alter table public.market_os_ambassadors add column if not exists lifecycle_stage text not null default 'candidate';
alter table public.market_os_ambassadors add column if not exists manager_id uuid;
alter table public.market_os_ambassadors add column if not exists manager_name text;
alter table public.market_os_ambassadors add column if not exists recruitment_stage text;
alter table public.market_os_ambassadors add column if not exists onboarding_stage text;
alter table public.market_os_ambassadors add column if not exists training_status text;
alter table public.market_os_ambassadors add column if not exists certification_status text;
alter table public.market_os_ambassadors add column if not exists kpi_score numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists missions_completed integer not null default 0;
alter table public.market_os_ambassadors add column if not exists missions_assigned integer not null default 0;
alter table public.market_os_ambassadors add column if not exists incentives_balance numeric not null default 0;
alter table public.market_os_ambassadors add column if not exists last_activity_at timestamptz;
alter table public.market_os_ambassadors add column if not exists joined_at timestamptz;
alter table public.market_os_ambassadors add column if not exists archived_at timestamptz;
alter table public.market_os_ambassadors add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_territories add column if not exists tenant_id uuid;
alter table public.market_os_ambassador_territories add column if not exists organization_id uuid;
alter table public.market_os_ambassador_territories add column if not exists region text;
alter table public.market_os_ambassador_territories add column if not exists coverage_goal numeric not null default 0;
alter table public.market_os_ambassador_territories add column if not exists active_ambassadors_count integer not null default 0;
alter table public.market_os_ambassador_territories add column if not exists manager_name text;
alter table public.market_os_ambassador_territories add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_territories add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_missions add column if not exists tenant_id uuid;
alter table public.market_os_ambassador_missions add column if not exists organization_id uuid;
alter table public.market_os_ambassador_missions add column if not exists assigned_ambassador_id uuid;
alter table public.market_os_ambassador_missions add column if not exists mission_type text;
alter table public.market_os_ambassador_missions add column if not exists region text;
alter table public.market_os_ambassador_missions add column if not exists territory_id uuid;
alter table public.market_os_ambassador_missions add column if not exists due_date timestamptz;
alter table public.market_os_ambassador_missions add column if not exists completed_at timestamptz;
alter table public.market_os_ambassador_missions add column if not exists assigned_by text;
alter table public.market_os_ambassador_missions add column if not exists instructions text;
alter table public.market_os_ambassador_missions add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_missions add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.market_os_ambassador_training add column if not exists tenant_id uuid;
alter table public.market_os_ambassador_training add column if not exists organization_id uuid;
alter table public.market_os_ambassador_training add column if not exists training_name text;
alter table public.market_os_ambassador_training add column if not exists certification_name text;
alter table public.market_os_ambassador_training add column if not exists certification_status text default 'pending';
alter table public.market_os_ambassador_training add column if not exists valid_until timestamptz;
alter table public.market_os_ambassador_training add column if not exists issued_by text;
alter table public.market_os_ambassador_training add column if not exists archived_at timestamptz;
alter table public.market_os_ambassador_training add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.market_os_ambassadors
set full_name = coalesce(full_name, name, display_name),
    display_name = coalesce(display_name, full_name, name),
    territory_name = coalesce(territory_name, 'Unassigned'),
    performance_score = coalesce(performance_score, 0),
    metadata = coalesce(metadata, '{}'::jsonb)
where full_name is null or display_name is null or territory_name is null;

update public.market_os_ambassador_missions
set assigned_ambassador_id = coalesce(assigned_ambassador_id, ambassador_id),
    due_date = coalesce(due_date, due_at),
    name = coalesce(name, title),
    metadata = coalesce(metadata, '{}'::jsonb)
where assigned_ambassador_id is null or due_date is null or name is null;

update public.market_os_ambassador_training
set training_name = coalesce(training_name, module_title),
    metadata = coalesce(metadata, '{}'::jsonb)
where training_name is null;

create index if not exists idx_mos_ambassadors_status on public.market_os_ambassadors(status);
create index if not exists idx_mos_ambassadors_region_city on public.market_os_ambassadors(region, city);
create index if not exists idx_mos_ambassadors_territory on public.market_os_ambassadors(territory_id);
create index if not exists idx_mos_territories_status_region on public.market_os_ambassador_territories(status, region);
create index if not exists idx_mos_missions_ambassador on public.market_os_ambassador_missions(ambassador_id);
create index if not exists idx_mos_missions_status_due on public.market_os_ambassador_missions(status, due_date);
create index if not exists idx_mos_recruitment_stage on public.market_os_ambassador_recruitment(stage);
create index if not exists idx_mos_onboarding_ambassador on public.market_os_ambassador_onboarding(ambassador_id);
create index if not exists idx_mos_training_ambassador on public.market_os_ambassador_training(ambassador_id);
create index if not exists idx_mos_kpis_ambassador_period on public.market_os_ambassador_kpis(ambassador_id, period);
create index if not exists idx_mos_incentives_status on public.market_os_ambassador_incentives(status);
create index if not exists idx_mos_reports_type_status on public.market_os_ambassador_reports(report_type, status);
create index if not exists idx_mos_audit_entity on public.market_os_ambassador_audit_logs(entity_type, entity_id);

drop trigger if exists trg_market_os_ambassadors_updated_at on public.market_os_ambassadors;
create trigger trg_market_os_ambassadors_updated_at before update on public.market_os_ambassadors for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_territories_updated_at on public.market_os_ambassador_territories;
create trigger trg_market_os_ambassador_territories_updated_at before update on public.market_os_ambassador_territories for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_missions_updated_at on public.market_os_ambassador_missions;
create trigger trg_market_os_ambassador_missions_updated_at before update on public.market_os_ambassador_missions for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_recruitment_updated_at on public.market_os_ambassador_recruitment;
create trigger trg_market_os_ambassador_recruitment_updated_at before update on public.market_os_ambassador_recruitment for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_onboarding_updated_at on public.market_os_ambassador_onboarding;
create trigger trg_market_os_ambassador_onboarding_updated_at before update on public.market_os_ambassador_onboarding for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_training_updated_at on public.market_os_ambassador_training;
create trigger trg_market_os_ambassador_training_updated_at before update on public.market_os_ambassador_training for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_kpis_updated_at on public.market_os_ambassador_kpis;
create trigger trg_market_os_ambassador_kpis_updated_at before update on public.market_os_ambassador_kpis for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_incentives_updated_at on public.market_os_ambassador_incentives;
create trigger trg_market_os_ambassador_incentives_updated_at before update on public.market_os_ambassador_incentives for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_reports_updated_at on public.market_os_ambassador_reports;
create trigger trg_market_os_ambassador_reports_updated_at before update on public.market_os_ambassador_reports for each row execute function public.market_os_ambassadors_set_updated_at();
drop trigger if exists trg_market_os_ambassador_settings_updated_at on public.market_os_ambassador_settings;
create trigger trg_market_os_ambassador_settings_updated_at before update on public.market_os_ambassador_settings for each row execute function public.market_os_ambassadors_set_updated_at();

alter table public.market_os_ambassadors enable row level security;
alter table public.market_os_ambassador_territories enable row level security;
alter table public.market_os_ambassador_missions enable row level security;
alter table public.market_os_ambassador_recruitment enable row level security;
alter table public.market_os_ambassador_onboarding enable row level security;
alter table public.market_os_ambassador_training enable row level security;
alter table public.market_os_ambassador_kpis enable row level security;
alter table public.market_os_ambassador_incentives enable row level security;
alter table public.market_os_ambassador_reports enable row level security;
alter table public.market_os_ambassador_settings enable row level security;
alter table public.market_os_ambassador_audit_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'market_os_ambassadors',
    'market_os_ambassador_territories',
    'market_os_ambassador_missions',
    'market_os_ambassador_recruitment',
    'market_os_ambassador_onboarding',
    'market_os_ambassador_training',
    'market_os_ambassador_kpis',
    'market_os_ambassador_incentives',
    'market_os_ambassador_reports',
    'market_os_ambassador_settings',
    'market_os_ambassador_audit_logs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', t || '_authenticated_all', t);
  end loop;
end $$;
