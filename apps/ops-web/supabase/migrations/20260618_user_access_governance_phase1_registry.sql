-- ANGELCARE USER ACCESS GOVERNANCE PHASE 1
-- Additive registry foundation for access surface scanning and future permission governance.

create extension if not exists pgcrypto;

create table if not exists public.access_module_registry (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  module_label text not null,
  module_group text null,
  parent_module_key text null,
  description text null,
  icon text null,
  route_prefixes text[] not null default '{}',
  permission_key text null,
  module_permission_key text null,
  status text not null default 'active',
  risk_level text not null default 'normal',
  sort_order integer not null default 0,
  detected_source text null,
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_route_registry (
  id uuid primary key default gen_random_uuid(),
  href text not null unique,
  label text not null,
  short_label text null,
  module_key text not null,
  module_label text null,
  parent_module_key text null,
  permission_key text not null,
  module_permission_key text null,
  route_type text not null default 'page',
  workspace_key text null,
  submodule_key text null,
  status text not null default 'active',
  is_protected boolean not null default true,
  is_core_system boolean not null default false,
  is_navigation_visible boolean not null default true,
  detected_source text null,
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_scan_runs (
  id uuid primary key default gen_random_uuid(),
  scan_type text not null default 'app_routes_scan',
  status text not null default 'completed',
  modules_detected integer not null default 0,
  routes_detected integer not null default 0,
  new_modules integer not null default 0,
  new_routes integer not null default 0,
  stale_modules integer not null default 0,
  stale_routes integer not null default 0,
  source text null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null,
  actor_email text null,
  created_at timestamptz not null default now()
);

create table if not exists public.access_registry_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  module_key text null,
  route_href text null,
  actor_user_id uuid null,
  actor_email text null,
  message text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.access_role_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  template_label text not null,
  description text null,
  role text null,
  permissions text[] not null default '{}',
  is_system boolean not null default false,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_access_module_registry_module_key on public.access_module_registry(module_key);
create index if not exists idx_access_module_registry_status on public.access_module_registry(status);
create index if not exists idx_access_route_registry_href on public.access_route_registry(href);
create index if not exists idx_access_route_registry_module_key on public.access_route_registry(module_key);
create index if not exists idx_access_route_registry_permission_key on public.access_route_registry(permission_key);
create index if not exists idx_access_route_registry_status on public.access_route_registry(status);
create index if not exists idx_access_scan_runs_created_at on public.access_scan_runs(created_at desc);
create index if not exists idx_access_registry_events_module_key on public.access_registry_events(module_key);
create index if not exists idx_access_registry_events_route_href on public.access_registry_events(route_href);
create index if not exists idx_access_registry_events_created_at on public.access_registry_events(created_at desc);
create index if not exists idx_access_role_templates_template_key on public.access_role_templates(template_key);
create index if not exists idx_access_role_templates_status on public.access_role_templates(status);

create or replace function public.touch_access_governance_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_access_module_registry_updated_at on public.access_module_registry;
create trigger trg_access_module_registry_updated_at
before update on public.access_module_registry
for each row execute function public.touch_access_governance_updated_at();

drop trigger if exists trg_access_route_registry_updated_at on public.access_route_registry;
create trigger trg_access_route_registry_updated_at
before update on public.access_route_registry
for each row execute function public.touch_access_governance_updated_at();

drop trigger if exists trg_access_role_templates_updated_at on public.access_role_templates;
create trigger trg_access_role_templates_updated_at
before update on public.access_role_templates
for each row execute function public.touch_access_governance_updated_at();

alter table public.access_module_registry enable row level security;
alter table public.access_route_registry enable row level security;
alter table public.access_scan_runs enable row level security;
alter table public.access_registry_events enable row level security;
alter table public.access_role_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'access_module_registry' and policyname = 'authenticated_all_access_module_registry'
  ) then
    create policy authenticated_all_access_module_registry
    on public.access_module_registry
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'access_route_registry' and policyname = 'authenticated_all_access_route_registry'
  ) then
    create policy authenticated_all_access_route_registry
    on public.access_route_registry
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'access_scan_runs' and policyname = 'authenticated_all_access_scan_runs'
  ) then
    create policy authenticated_all_access_scan_runs
    on public.access_scan_runs
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'access_registry_events' and policyname = 'authenticated_all_access_registry_events'
  ) then
    create policy authenticated_all_access_registry_events
    on public.access_registry_events
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'access_role_templates' and policyname = 'authenticated_all_access_role_templates'
  ) then
    create policy authenticated_all_access_role_templates
    on public.access_role_templates
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;

insert into public.access_role_templates (
  template_key,
  template_label,
  description,
  role,
  permissions,
  is_system,
  status,
  metadata
)
values
  ('role_ceo', 'CEO Full Access', 'System template mapped from the current CEO permission model.', 'ceo', array['*'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_direction', 'Direction Full Access', 'System template mapped from the current Direction permission model.', 'direction', array['*'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_admin', 'Admin Full Access', 'System template mapped from the current Admin permission model.', 'admin', array['*'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_operations', 'Operations', 'System template mapped from the current Operations permission model.', 'operations', array['profile.view', 'reports.view', 'operations.view', 'operations.manage', 'interventions.view', 'interventions.command', 'interventions.dispatch', 'interventions.manage', 'missions.view', 'missions.create', 'missions.edit', 'missions.assign', 'pointage.view', 'pointage.manage', 'caregivers.view', 'contracts.view', 'services.view', 'voice.view', 'staff_portal.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_hr', 'HR', 'System template mapped from the current HR permission model.', 'hr', array['profile.view', 'reports.view', 'hr.view', 'hr.dashboard', 'hr.recruitment.view', 'hr.recruitment.manage', 'hr.staff.view', 'hr.staff.manage', 'hr.onboarding.manage', 'hr.rosters.manage', 'hr.attendance.manage', 'hr.documents.manage', 'hr.approvals.manage', 'hr.analytics.view', 'hr.executive.view', 'interventions.view', 'interventions.staff', 'interventions.audit', 'caregivers.view', 'staff_portal.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_marketing', 'Marketing', 'System template mapped from the current Marketing permission model.', 'marketing', array['profile.view', 'reports.view', 'market_os.view', 'marketing.home', 'marketing.view', 'market_os.campaigns.view', 'market_os.content.view', 'market_os.automation.view', 'market_os.ambassadors.view', 'market_os.partners.view', 'revenue.view', 'leads.view', 'sales.view', 'voice.view', 'staff_portal.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_csa', 'Customer Success', 'System template mapped from the current CSA permission model.', 'csa', array['profile.view', 'staff_portal.view', 'staff_services.view', 'csa.home', 'csa.view', 'csa.leads.followup', 'csa.families.manage', 'csa.services.activate', 'csa.revenue.recover', 'csa.escalations.manage', 'families.view', 'leads.view', 'sales.view', 'revenue.view', 'incidents.view', 'services.view', 'voice.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_finance', 'Finance', 'System template mapped from the current Finance permission model.', 'finance', array['profile.view', 'reports.view', 'billing.view', 'billing.manage', 'interventions.view', 'interventions.billing', 'contracts.view', 'contracts.edit', 'print.view', 'print.create', 'families.view', 'revenue.view', 'capital.view', 'capital.manage', 'staff_portal.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_academy_admin', 'Academy Admin', 'System template mapped from the current Academy admin permission model.', 'academy_admin', array['profile.view', 'reports.view', 'academy.view', 'academy.manage', 'hr.staff.view', 'caregivers.view', 'services.view', 'staff_portal.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_academy_trainer', 'Academy Trainer', 'System template mapped from the current Academy trainer permission model.', 'academy_trainer', array['profile.view', 'academy.view', 'staff_portal.view', 'staff_services.view', 'caregivers.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_session_leader', 'Session Leader', 'System template mapped from the current Session Leader permission model.', 'session_leader', array['profile.view', 'staff_portal.view', 'staff_portal.manager', 'team_command.view', 'operations.view', 'missions.view', 'missions.assign', 'pointage.view', 'caregivers.view', 'incidents.view', 'voice.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_staff', 'Staff Portal', 'System template mapped from the current Staff permission model.', 'staff', array['profile.view', 'staff_portal.view', 'staff_services.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb),
  ('role_caregiver', 'Caregiver', 'System template mapped from the current Caregiver permission model.', 'caregiver', array['profile.view', 'staff_portal.view', 'staff_services.view', 'pointage.view', 'interventions.view'], true, 'active', '{"source":"existing_role_permission_templates"}'::jsonb)
on conflict (template_key) do update set
  template_label = excluded.template_label,
  description = excluded.description,
  role = excluded.role,
  permissions = excluded.permissions,
  is_system = excluded.is_system,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

