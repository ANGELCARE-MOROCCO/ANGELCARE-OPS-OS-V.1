-- OPSOS Runtime Control Plane — Layer 2 Runtime Config, Feature Flags & Safe Modes
-- Safe to run multiple times. Does not delete existing data.

create extension if not exists pgcrypto;

create table if not exists public.opsos_runtime_controls (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  description text,
  scope text not null default 'global' check (scope in ('global','route','modal','api','module','user','environment')),
  target text not null default 'global',
  value_json jsonb default 'null'::jsonb,
  enabled boolean not null default true,
  risk text not null default 'medium' check (risk in ('low','medium','high','critical')),
  updated_by text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, target)
);

create table if not exists public.opsos_feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  description text,
  scope text not null default 'global' check (scope in ('global','route','modal','api','module','user','environment')),
  target text not null default 'global',
  enabled boolean not null default false,
  rollout numeric not null default 0 check (rollout >= 0 and rollout <= 100),
  audience text default 'all',
  risk text not null default 'medium' check (risk in ('low','medium','high','critical')),
  updated_by text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, target)
);

create table if not exists public.opsos_safe_mode_profiles (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  description text,
  scope text not null default 'global' check (scope in ('global','route','modal','api','module','user','environment')),
  target text not null default 'global',
  enabled boolean not null default false,
  rules_json jsonb not null default '{}'::jsonb,
  risk text not null default 'high' check (risk in ('low','medium','high','critical')),
  updated_by text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, target)
);

create table if not exists public.opsos_action_logs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  target text not null default 'global',
  status text not null default 'pending',
  actor text,
  reason text,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  rollback_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_opsos_runtime_controls_target on public.opsos_runtime_controls(target, enabled) where is_archived = false;
create index if not exists idx_opsos_feature_flags_target on public.opsos_feature_flags(target, enabled) where is_archived = false;
create index if not exists idx_opsos_safe_mode_profiles_target on public.opsos_safe_mode_profiles(target, enabled) where is_archived = false;
create index if not exists idx_opsos_action_logs_created_at on public.opsos_action_logs(created_at desc);

insert into public.opsos_runtime_controls (key, label, description, scope, target, value_json, enabled, risk, updated_by)
values
  ('global.maxRows', 'Global row safety limit', 'Default safety cap for heavy table/list renderers.', 'global', 'global', '80'::jsonb, true, 'low', 'migration'),
  ('marketos.timeline.limitCards', 'Market-OS timeline card limit', 'Limits campaign timeline card rendering.', 'route', '/market-os/campaign-lifecycle', '40'::jsonb, true, 'medium', 'migration'),
  ('hr.employee360.modalRecordLimit', 'Employee 360 modal record limit', 'Maximum nested records shown in HR dossier modals.', 'modal', 'Employee360DossierModal', '30'::jsonb, true, 'medium', 'migration')
on conflict (key, target) do nothing;

insert into public.opsos_feature_flags (key, label, description, scope, target, enabled, rollout, audience, risk, updated_by)
values
  ('global.heavyAnimations', 'Heavy animations', 'Controls non-essential motion and transition-heavy UI effects.', 'global', 'global', false, 0, 'all', 'low', 'migration'),
  ('marketos.timeline.liveProgress', 'Market-OS live timeline progress', 'Allows timeline progress to update continuously where target modules support runtime controls.', 'route', '/market-os/campaign-lifecycle', true, 100, 'internal', 'medium', 'migration'),
  ('hr.employee360.printPreview', 'Employee 360 print preview', 'Controls early print-preview loading for HR dossier documents.', 'modal', 'Employee360DossierModal', false, 0, 'hr-admins', 'medium', 'migration')
on conflict (key, target) do nothing;

insert into public.opsos_safe_mode_profiles (key, label, description, scope, target, enabled, rules_json, risk, updated_by)
values
  ('global.safeMode', 'Global Runtime Safe Mode', 'Default global runtime protection profile.', 'global', 'global', false, '{"disableAnimations":true,"disableLivePolling":true,"lazyLoadModals":true,"disablePrintPreview":true,"limitRows":50,"limitCards":40,"apiPollingIntervalMs":60000,"compactMode":true}'::jsonb, 'high', 'migration'),
  ('marketos.campaignLifecycle.safeMode', 'Market-OS Campaign Lifecycle Safe Mode', 'Limits heavy rendering and polling in the campaign lifecycle workspace.', 'route', '/market-os/campaign-lifecycle', false, '{"disableAnimations":true,"disableCharts":true,"disableLivePolling":true,"lazyLoadModals":true,"disablePrintPreview":true,"limitRows":40,"limitCards":24,"apiPollingIntervalMs":90000,"compactMode":true}'::jsonb, 'high', 'migration')
on conflict (key, target) do nothing;

alter table public.opsos_runtime_controls enable row level security;
alter table public.opsos_feature_flags enable row level security;
alter table public.opsos_safe_mode_profiles enable row level security;
alter table public.opsos_action_logs enable row level security;

-- Service-role API endpoints bypass RLS. These policies allow authenticated read for internal admin UIs.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opsos_runtime_controls' and policyname='opsos_runtime_controls_authenticated_read') then
    create policy opsos_runtime_controls_authenticated_read on public.opsos_runtime_controls for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opsos_feature_flags' and policyname='opsos_feature_flags_authenticated_read') then
    create policy opsos_feature_flags_authenticated_read on public.opsos_feature_flags for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opsos_safe_mode_profiles' and policyname='opsos_safe_mode_profiles_authenticated_read') then
    create policy opsos_safe_mode_profiles_authenticated_read on public.opsos_safe_mode_profiles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opsos_action_logs' and policyname='opsos_action_logs_authenticated_read') then
    create policy opsos_action_logs_authenticated_read on public.opsos_action_logs for select to authenticated using (true);
  end if;
end $$;
