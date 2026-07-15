-- CARELINK OPS EMERGENCY RECOVERY — caregiver profile schema alignment
-- Purpose: stop caregiver creation from silently falling back to name/phone only.
-- This aligns public.caregivers and linked agent tables with the CareLink OPS Agents modal.

alter table public.caregivers
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists display_name text,
  add column if not exists phone text,
  add column if not exists mobile text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists zone text,
  add column if not exists current_status text default 'available',
  add column if not exists status text default 'available',
  add column if not exists availability_status text default 'available',
  add column if not exists role text default 'Caregiver',
  add column if not exists notes text,
  add column if not exists summary text,
  add column if not exists skills_summary text,
  add column if not exists skill_tags text[] not null default '{}'::text[],
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists language_tags text[] not null default '{}'::text[],
  add column if not exists mission_types text[] not null default '{}'::text[],
  add column if not exists academy_certified boolean not null default false,
  add column if not exists special_needs_capable boolean not null default false,
  add column if not exists reliability_score numeric not null default 0,
  add column if not exists readiness_score numeric not null default 0,
  add column if not exists payment_mode text,
  add column if not exists hourly_rate numeric,
  add column if not exists carelink_ops_payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.caregivers
set
  full_name = coalesce(nullif(full_name, ''), nullif(name, ''), nullif(display_name, ''), full_name),
  name = coalesce(nullif(name, ''), nullif(full_name, ''), nullif(display_name, ''), name),
  display_name = coalesce(nullif(display_name, ''), nullif(full_name, ''), nullif(name, ''), display_name),
  mobile = coalesce(nullif(mobile, ''), nullif(phone, ''), mobile),
  status = coalesce(nullif(status, ''), nullif(current_status, ''), 'available'),
  current_status = coalesce(nullif(current_status, ''), nullif(status, ''), 'available'),
  availability_status = coalesce(nullif(availability_status, ''), nullif(status, ''), nullif(current_status, ''), 'available'),
  role = coalesce(nullif(role, ''), 'Caregiver'),
  updated_at = coalesce(updated_at, now());

create index if not exists idx_caregivers_email_lower on public.caregivers(lower(email));
create index if not exists idx_caregivers_current_status on public.caregivers(current_status);
create index if not exists idx_caregivers_city_zone on public.caregivers(city, zone);
create index if not exists idx_caregivers_skill_tags on public.caregivers using gin(skill_tags);
create index if not exists idx_caregivers_mission_types on public.caregivers using gin(mission_types);

create table if not exists public.carelink_agent_app_access (
  id bigserial primary key,
  caregiver_id bigint not null,
  auth_user_id uuid null,
  email text null,
  access_status text not null default 'pending',
  access_level text null,
  mobile_enabled boolean not null default false,
  can_view_missions boolean not null default true,
  can_accept_missions boolean not null default true,
  can_submit_reports boolean not null default true,
  can_view_payments boolean not null default false,
  device_policy text null,
  security_notes text null,
  session_limit integer null default 1,
  geo_fence_required boolean not null default false,
  pin_reset_required boolean not null default false,
  emergency_access_allowed boolean not null default false,
  suspended_at timestamptz null,
  suspension_reason text null,
  shutdown_until timestamptz null,
  restored_at timestamptz null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_app_access
  add column if not exists auth_user_id uuid null,
  add column if not exists email text null,
  add column if not exists access_status text not null default 'pending',
  add column if not exists access_level text null,
  add column if not exists mobile_enabled boolean not null default false,
  add column if not exists can_view_missions boolean not null default true,
  add column if not exists can_accept_missions boolean not null default true,
  add column if not exists can_submit_reports boolean not null default true,
  add column if not exists can_view_payments boolean not null default false,
  add column if not exists device_policy text null,
  add column if not exists security_notes text null,
  add column if not exists session_limit integer null default 1,
  add column if not exists geo_fence_required boolean not null default false,
  add column if not exists pin_reset_required boolean not null default false,
  add column if not exists emergency_access_allowed boolean not null default false,
  add column if not exists suspended_at timestamptz null,
  add column if not exists suspension_reason text null,
  add column if not exists shutdown_until timestamptz null,
  add column if not exists restored_at timestamptz null,
  add column if not exists suspended_by text null,
  add column if not exists restored_by text null,
  add column if not exists last_invited_at timestamptz null,
  add column if not exists last_admin_action text null,
  add column if not exists last_admin_action_at timestamptz null,
  add column if not exists notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_carelink_agent_app_access_caregiver
  on public.carelink_agent_app_access(caregiver_id);
create index if not exists idx_carelink_agent_app_access_email_lower
  on public.carelink_agent_app_access(lower(email));

create table if not exists public.carelink_agent_roster_preferences (
  id bigserial primary key,
  caregiver_id bigint not null,
  preferred_days text[] not null default '{}'::text[],
  preferred_start_time text null,
  preferred_end_time text null,
  preferred_time_blocks text[] not null default '{}'::text[],
  preferred_zones text[] not null default '{}'::text[],
  excluded_zones text[] not null default '{}'::text[],
  blocked_days text[] not null default '{}'::text[],
  max_daily_hours numeric null,
  max_weekly_hours numeric null,
  max_distance_km numeric null,
  accepts_weekends boolean not null default false,
  accepts_night boolean not null default false,
  accepts_emergency_replacement boolean not null default true,
  transport_required boolean not null default false,
  roster_notes text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_roster_preferences
  add column if not exists preferred_days text[] not null default '{}'::text[],
  add column if not exists preferred_start_time text null,
  add column if not exists preferred_end_time text null,
  add column if not exists preferred_time_blocks text[] not null default '{}'::text[],
  add column if not exists preferred_zones text[] not null default '{}'::text[],
  add column if not exists excluded_zones text[] not null default '{}'::text[],
  add column if not exists blocked_days text[] not null default '{}'::text[],
  add column if not exists max_daily_hours numeric null,
  add column if not exists max_weekly_hours numeric null,
  add column if not exists max_distance_km numeric null,
  add column if not exists accepts_weekends boolean not null default false,
  add column if not exists accepts_night boolean not null default false,
  add column if not exists accepts_emergency_replacement boolean not null default true,
  add column if not exists transport_required boolean not null default false,
  add column if not exists roster_notes text null,
  add column if not exists notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_carelink_agent_roster_preferences_caregiver
  on public.carelink_agent_roster_preferences(caregiver_id);

create table if not exists public.carelink_agent_payment_configs (
  id bigserial primary key,
  caregiver_id bigint not null,
  hourly_rate numeric null,
  hourly_rate_mad numeric null,
  daily_rate numeric null,
  mission_rate numeric null,
  overtime_rate numeric null,
  transport_allowance numeric null,
  payment_mode text null,
  payment_cycle text null,
  currency text not null default 'MAD',
  bank_name text null,
  bank_account text null,
  wallet_phone text null,
  finance_notes text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_payment_configs
  add column if not exists hourly_rate numeric null,
  add column if not exists hourly_rate_mad numeric null,
  add column if not exists daily_rate numeric null,
  add column if not exists mission_rate numeric null,
  add column if not exists overtime_rate numeric null,
  add column if not exists transport_allowance numeric null,
  add column if not exists payment_mode text null,
  add column if not exists payment_cycle text null,
  add column if not exists currency text not null default 'MAD',
  add column if not exists bank_name text null,
  add column if not exists bank_account text null,
  add column if not exists wallet_phone text null,
  add column if not exists finance_notes text null,
  add column if not exists notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_carelink_agent_payment_configs_caregiver
  on public.carelink_agent_payment_configs(caregiver_id);

create table if not exists public.carelink_agent_training_plans (
  id bigserial primary key,
  caregiver_id bigint not null,
  training_path text null,
  required_tracks text[] not null default '{}'::text[],
  completed_tracks text[] not null default '{}'::text[],
  training_status text null,
  onboarding_status text null,
  hygiene_status text null,
  reporting_status text null,
  emergency_status text null,
  special_needs_status text null,
  certification_status text null,
  compliance_status text null,
  next_training_date date null,
  trainer_name text null,
  learning_notes text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_training_plans
  add column if not exists training_path text null,
  add column if not exists required_tracks text[] not null default '{}'::text[],
  add column if not exists completed_tracks text[] not null default '{}'::text[],
  add column if not exists training_status text null,
  add column if not exists onboarding_status text null,
  add column if not exists hygiene_status text null,
  add column if not exists reporting_status text null,
  add column if not exists emergency_status text null,
  add column if not exists special_needs_status text null,
  add column if not exists certification_status text null,
  add column if not exists compliance_status text null,
  add column if not exists next_training_date date null,
  add column if not exists trainer_name text null,
  add column if not exists learning_notes text null,
  add column if not exists notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_carelink_agent_training_plans_caregiver
  on public.carelink_agent_training_plans(caregiver_id);
