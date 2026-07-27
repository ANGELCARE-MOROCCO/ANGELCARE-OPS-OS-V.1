-- AC CAPITAL OS — Mega Ultra ZIP 1 Foundation
-- Reviewed scope: foundational backend contract for protected internal capital command module.

create extension if not exists pgcrypto;

create table if not exists public.ac_capital_os_module_registry (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  module_name text not null,
  route text not null,
  status text not null default 'foundation-ready',
  mega_zip integer not null default 1,
  is_protected boolean not null default true,
  visual_universe text,
  mission text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_os_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  flag_label text not null,
  is_enabled boolean not null default false,
  safe_mode boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_os_roles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  role_label text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_os_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  permission_label text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_os_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_key text not null references public.ac_capital_os_roles(role_key) on delete cascade,
  permission_key text not null references public.ac_capital_os_permissions(permission_key) on delete cascade,
  created_at timestamptz not null default now(),
  unique(role_key, permission_key)
);

create table if not exists public.ac_capital_os_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_label text,
  action text not null,
  object_type text not null,
  object_id text,
  severity text not null default 'medium',
  message text not null,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_os_system_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  event_label text not null,
  event_status text not null default 'open',
  severity text not null default 'medium',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.ac_capital_os_module_registry enable row level security;
alter table public.ac_capital_os_feature_flags enable row level security;
alter table public.ac_capital_os_roles enable row level security;
alter table public.ac_capital_os_permissions enable row level security;
alter table public.ac_capital_os_role_permissions enable row level security;
alter table public.ac_capital_os_audit_logs enable row level security;
alter table public.ac_capital_os_system_events enable row level security;

-- Safe baseline policy: authenticated users may read foundation metadata.
-- Mutation policies should be tightened against your canonical app role system in later ZIPs.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_capital_os_module_registry' and policyname = 'ac_capital_os_module_registry_read_authenticated') then
    create policy ac_capital_os_module_registry_read_authenticated on public.ac_capital_os_module_registry for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_capital_os_feature_flags' and policyname = 'ac_capital_os_feature_flags_read_authenticated') then
    create policy ac_capital_os_feature_flags_read_authenticated on public.ac_capital_os_feature_flags for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ac_capital_os_audit_logs' and policyname = 'ac_capital_os_audit_logs_read_authenticated') then
    create policy ac_capital_os_audit_logs_read_authenticated on public.ac_capital_os_audit_logs for select to authenticated using (true);
  end if;
end $$;

insert into public.ac_capital_os_roles(role_key, role_label, description) values
  ('founder', 'Founder / Executive Authority', 'Full strategic approval authority for AC CAPITAL OS.'),
  ('capital-admin', 'Capital Admin', 'Capital operations manager with preparation and review authority.'),
  ('coordinator', 'Capital Coordinator', 'Human execution coordinator for approvals, uploads, emails and calls.'),
  ('viewer', 'Capital Viewer', 'Read-only access to capital readiness information.'),
  ('ai-system', 'AI System', 'Internal AI agent execution identity with no final external communication authority.')
on conflict(role_key) do nothing;

insert into public.ac_capital_os_permissions(permission_key, permission_label, description) values
  ('ac_capital_os.view', 'View AC CAPITAL OS', 'Can access protected AC CAPITAL OS screens.'),
  ('ac_capital_os.create', 'Create AC CAPITAL OS records', 'Can create opportunities, tasks or cases where allowed.'),
  ('ac_capital_os.approve', 'Approve AC CAPITAL OS actions', 'Can approve cases, documents or sensitive decisions.'),
  ('ac_capital_os.execute_external_communication', 'Execute external communication', 'Can send or confirm external communications after approval.'),
  ('ac_capital_os.inject_doctrine', 'Inject doctrine', 'Can create or update doctrine records.'),
  ('ac_capital_os.manage_ai', 'Manage AI settings', 'Can modify AI agents, skills and prompts.')
on conflict(permission_key) do nothing;

insert into public.ac_capital_os_role_permissions(role_key, permission_key) values
  ('founder', 'ac_capital_os.view'),
  ('founder', 'ac_capital_os.create'),
  ('founder', 'ac_capital_os.approve'),
  ('founder', 'ac_capital_os.execute_external_communication'),
  ('founder', 'ac_capital_os.inject_doctrine'),
  ('founder', 'ac_capital_os.manage_ai'),
  ('capital-admin', 'ac_capital_os.view'),
  ('capital-admin', 'ac_capital_os.create'),
  ('capital-admin', 'ac_capital_os.approve'),
  ('capital-admin', 'ac_capital_os.inject_doctrine'),
  ('coordinator', 'ac_capital_os.view'),
  ('coordinator', 'ac_capital_os.create'),
  ('viewer', 'ac_capital_os.view'),
  ('ai-system', 'ac_capital_os.view'),
  ('ai-system', 'ac_capital_os.create')
on conflict(role_key, permission_key) do nothing;

insert into public.ac_capital_os_module_registry(module_key, module_name, route, status, mega_zip, is_protected, visual_universe, mission) values
  ('executive-cockpit', 'Capital Executive Cockpit', '/ac-capital-os', 'foundation-ready', 2, true, 'capital command room', 'Daily executive capital priorities and readiness.'),
  ('capital-radar', 'Capital Radar', '/ac-capital-os/radar', 'contracted-next', 3, true, 'global funding radar', 'Opportunity detection and source capture.'),
  ('qualification-engine', 'Qualification Engine', '/ac-capital-os/qualification', 'contracted-next', 4, true, 'investment committee scoring room', 'Opportunity scoring and pursue/reject decisions.'),
  ('manual-sop', 'Manual & SOP', '/ac-capital-os/manual', 'foundation-ready', 12, true, 'interactive operating academy', 'Coordinator training and operating manual.'),
  ('settings', 'Settings', '/ac-capital-os/settings', 'foundation-ready', 1, true, 'capital operating configuration', 'Safe operating configuration for AC CAPITAL OS.')
on conflict(module_key) do update set
  module_name = excluded.module_name,
  route = excluded.route,
  status = excluded.status,
  mega_zip = excluded.mega_zip,
  is_protected = excluded.is_protected,
  visual_universe = excluded.visual_universe,
  mission = excluded.mission,
  updated_at = now();
