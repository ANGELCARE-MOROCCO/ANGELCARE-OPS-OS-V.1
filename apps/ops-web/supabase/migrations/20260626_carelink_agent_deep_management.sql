create table if not exists public.carelink_agent_app_access (
  id bigserial primary key,
  caregiver_id bigint not null,
  auth_user_id uuid null,
  email text null,
  access_status text not null default 'pending',
  access_level text not null default 'carelink_mobile_agent',
  mobile_enabled boolean not null default true,
  can_view_missions boolean not null default true,
  can_accept_missions boolean not null default true,
  can_submit_reports boolean not null default true,
  can_view_payments boolean not null default false,
  device_policy text null,
  last_invited_at timestamptz null,
  last_access_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(caregiver_id)
);

create table if not exists public.carelink_agent_roster_preferences (
  id bigserial primary key,
  caregiver_id bigint not null,
  preferred_days text[] not null default '{}',
  preferred_start_time time null,
  preferred_end_time time null,
  max_daily_hours numeric null,
  max_weekly_hours numeric null,
  preferred_zones text[] not null default '{}',
  excluded_zones text[] not null default '{}',
  accepts_weekends boolean not null default false,
  accepts_night boolean not null default false,
  accepts_emergency_replacement boolean not null default true,
  transport_required boolean not null default false,
  roster_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(caregiver_id)
);

create table if not exists public.carelink_agent_payment_configs (
  id bigserial primary key,
  caregiver_id bigint not null,
  hourly_rate numeric not null default 0,
  daily_rate numeric not null default 0,
  mission_rate numeric not null default 0,
  overtime_rate numeric not null default 0,
  transport_allowance numeric not null default 0,
  payment_mode text not null default 'monthly',
  payment_cycle text not null default 'monthly',
  bank_name text null,
  bank_account text null,
  wallet_phone text null,
  tax_or_id_reference text null,
  finance_notes text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(caregiver_id)
);

create table if not exists public.carelink_agent_payment_validations (
  id bigserial primary key,
  caregiver_id bigint not null,
  mission_id bigint null,
  mission_group_id uuid null,
  period_start date null,
  period_end date null,
  amount numeric not null default 0,
  currency text not null default 'MAD',
  status text not null default 'draft',
  validation_type text not null default 'manual',
  validated_by text null,
  validated_at timestamptz null,
  paid_at timestamptz null,
  evidence_url text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carelink_agent_training_plans (
  id bigserial primary key,
  caregiver_id bigint not null,
  training_path text null,
  onboarding_status text not null default 'pending',
  hygiene_status text not null default 'pending',
  reporting_status text not null default 'pending',
  emergency_status text not null default 'pending',
  special_needs_status text not null default 'not_required',
  certification_status text not null default 'pending',
  next_training_date date null,
  trainer_name text null,
  learning_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(caregiver_id)
);

create index if not exists idx_carelink_agent_app_access_caregiver_id on public.carelink_agent_app_access(caregiver_id);
create index if not exists idx_carelink_agent_roster_preferences_caregiver_id on public.carelink_agent_roster_preferences(caregiver_id);
create index if not exists idx_carelink_agent_payment_configs_caregiver_id on public.carelink_agent_payment_configs(caregiver_id);
create index if not exists idx_carelink_agent_payment_validations_caregiver_id on public.carelink_agent_payment_validations(caregiver_id);
create index if not exists idx_carelink_agent_training_plans_caregiver_id on public.carelink_agent_training_plans(caregiver_id);
