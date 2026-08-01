begin;

create extension if not exists pgcrypto;

do $sovereign_pulse_preflight$
declare
  missing_relations text[];
begin
  select array_agg(required_relation)
  into missing_relations
  from (values
    ('public.app_users'),
    ('public.angelcare360_operator_clients'),
    ('public.angelcare360_operator_tenants'),
    ('public.angelcare360_operator_subscriptions')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if missing_relations is not null then
    raise exception 'Sovereign Pulse prerequisites missing: %', array_to_string(missing_relations, ', ');
  end if;
end
$sovereign_pulse_preflight$;

create table if not exists public.angelcare360_operator_pulse_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  display_mode text not null default 'desk' check (display_mode in ('desk','wall')),
  privacy_mode text not null default 'team_safe' check (privacy_mode in ('executive','operations','team_safe','visitor_safe')),
  active_scene text not null default 'overview' check (active_scene in ('overview','revenue','customers','tenants','experience','communications','platform','missions')),
  rotation_seconds integer not null default 24 check (rotation_seconds between 10 and 120),
  reduced_motion boolean not null default false,
  density_mode text not null default 'balanced' check (density_mode in ('calm','balanced','dense')),
  sound_enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.angelcare360_operator_pulse_wallboard_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique,
  label text not null,
  privacy_mode text not null default 'team_safe' check (privacy_mode in ('executive','operations','team_safe','visitor_safe')),
  scene_sequence jsonb not null default '["overview","revenue","customers","tenants","experience","communications","platform","missions"]'::jsonb,
  rotation_seconds integer not null default 24 check (rotation_seconds between 10 and 120),
  critical_takeover_enabled boolean not null default true,
  customer_names_visible boolean not null default false,
  financial_values_visible boolean not null default true,
  individual_names_visible boolean not null default false,
  auto_fullscreen boolean not null default false,
  active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_pulse_alert_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null,
  alert_title text not null,
  acknowledged_by uuid references public.app_users(id) on delete set null,
  acknowledged_at timestamptz not null default now(),
  note text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists angelcare360_operator_pulse_alert_ack_idx
  on public.angelcare360_operator_pulse_alert_acknowledgements(alert_key, acknowledged_at desc);

create table if not exists public.angelcare360_operator_pulse_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_by uuid references public.app_users(id) on delete set null,
  global_health integer not null check (global_health between 0 and 100),
  source_state text not null check (source_state in ('live','partial','unavailable')),
  snapshot jsonb not null,
  captured_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '180 days')
);
create index if not exists angelcare360_operator_pulse_snapshots_time_idx
  on public.angelcare360_operator_pulse_snapshots(captured_at desc);

create table if not exists public.angelcare360_operator_pulse_critical_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  label text not null,
  domain text not null,
  severity text not null default 'critical' check (severity in ('warning','critical')),
  threshold_definition jsonb not null default '{}'::jsonb,
  takeover_enabled boolean not null default true,
  cooldown_minutes integer not null default 30 check (cooldown_minutes between 1 and 1440),
  owner_team text,
  runbook_href text,
  active boolean not null default true,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.angelcare360_operator_pulse_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger angelcare360_operator_pulse_preferences_touch
before update on public.angelcare360_operator_pulse_preferences
for each row execute function public.angelcare360_operator_pulse_touch_updated_at();

create or replace trigger angelcare360_operator_pulse_wallboard_profiles_touch
before update on public.angelcare360_operator_pulse_wallboard_profiles
for each row execute function public.angelcare360_operator_pulse_touch_updated_at();

create or replace trigger angelcare360_operator_pulse_critical_rules_touch
before update on public.angelcare360_operator_pulse_critical_rules
for each row execute function public.angelcare360_operator_pulse_touch_updated_at();

insert into public.angelcare360_operator_pulse_wallboard_profiles
  (profile_key,label,privacy_mode,scene_sequence,rotation_seconds,critical_takeover_enabled,customer_names_visible,financial_values_visible,individual_names_visible,active,settings)
values
  ('team_wall','Équipe — Mur opérationnel','team_safe','["overview","revenue","customers","tenants","experience","communications","platform","missions"]'::jsonb,24,true,false,true,false,true,'{"burn_in_protection":true,"quiet_motion":true}'::jsonb),
  ('executive_wall','Direction — Exécutif complet','executive','["overview","revenue","customers","tenants","experience","platform","missions"]'::jsonb,28,true,true,true,true,true,'{"burn_in_protection":true}'::jsonb),
  ('visitor_wall','Visiteur — Présentation protégée','visitor_safe','["overview","revenue","tenants","platform","missions"]'::jsonb,30,false,false,false,false,true,'{"mask_customer_identity":true,"mask_exact_financials":true}'::jsonb)
on conflict (profile_key) do update set
  label = excluded.label,
  privacy_mode = excluded.privacy_mode,
  scene_sequence = excluded.scene_sequence,
  rotation_seconds = excluded.rotation_seconds,
  critical_takeover_enabled = excluded.critical_takeover_enabled,
  customer_names_visible = excluded.customer_names_visible,
  financial_values_visible = excluded.financial_values_visible,
  individual_names_visible = excluded.individual_names_visible,
  active = true,
  settings = excluded.settings,
  updated_at = now();

insert into public.angelcare360_operator_pulse_critical_rules
  (rule_key,label,domain,severity,threshold_definition,takeover_enabled,cooldown_minutes,owner_team,runbook_href,active)
values
  ('critical_customer_pressure','Pression client critique','customer','critical','{"critical_cases_gte":3}'::jsonb,true,30,'Customer Operations','/angelcare-360-operator/growth?view=health',true),
  ('multi_service_degradation','Dégradation multi-service','platform','critical','{"degraded_services_gte":3}'::jsonb,true,20,'Platform Operations','/angelcare-360-operator/platform',true),
  ('revenue_exposure','Exposition revenus critique','finance','warning','{"overdue_value_vs_mrr_gte":1}'::jsonb,false,120,'Finance','/angelcare-360-operator/revenue',true),
  ('tenant_activation_block','Blocage activation tenant','tenant','warning','{"pending_admin_activations_gte":5}'::jsonb,false,60,'Customer Operations','/angelcare-360-operator/tenants-product?view=deployments',true)
on conflict (rule_key) do update set
  label = excluded.label,
  domain = excluded.domain,
  severity = excluded.severity,
  threshold_definition = excluded.threshold_definition,
  takeover_enabled = excluded.takeover_enabled,
  cooldown_minutes = excluded.cooldown_minutes,
  owner_team = excluded.owner_team,
  runbook_href = excluded.runbook_href,
  active = true,
  updated_at = now();

alter table public.angelcare360_operator_pulse_preferences enable row level security;
alter table public.angelcare360_operator_pulse_wallboard_profiles enable row level security;
alter table public.angelcare360_operator_pulse_alert_acknowledgements enable row level security;
alter table public.angelcare360_operator_pulse_snapshots enable row level security;
alter table public.angelcare360_operator_pulse_critical_rules enable row level security;

revoke all on table public.angelcare360_operator_pulse_preferences from public, anon, authenticated;
revoke all on table public.angelcare360_operator_pulse_wallboard_profiles from public, anon, authenticated;
revoke all on table public.angelcare360_operator_pulse_alert_acknowledgements from public, anon, authenticated;
revoke all on table public.angelcare360_operator_pulse_snapshots from public, anon, authenticated;
revoke all on table public.angelcare360_operator_pulse_critical_rules from public, anon, authenticated;

grant all on table public.angelcare360_operator_pulse_preferences to service_role;
grant all on table public.angelcare360_operator_pulse_wallboard_profiles to service_role;
grant all on table public.angelcare360_operator_pulse_alert_acknowledgements to service_role;
grant all on table public.angelcare360_operator_pulse_snapshots to service_role;
grant all on table public.angelcare360_operator_pulse_critical_rules to service_role;

commit;
