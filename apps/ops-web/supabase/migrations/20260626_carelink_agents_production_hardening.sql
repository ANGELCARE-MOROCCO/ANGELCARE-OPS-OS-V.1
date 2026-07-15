create table if not exists public.carelink_agent_notifications (
  id bigserial primary key,
  audience_type text not null,
  caregiver_id bigint null,
  caregiver_name text null,
  title text not null,
  body text null,
  action_type text not null,
  priority text not null default 'normal',
  delivery_status text not null default 'queued',
  is_read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

alter table public.carelink_agent_notifications
  add column if not exists audience_type text,
  add column if not exists caregiver_id bigint null,
  add column if not exists caregiver_name text null,
  add column if not exists title text,
  add column if not exists body text null,
  add column if not exists action_type text,
  add column if not exists priority text not null default 'normal',
  add column if not exists delivery_status text not null default 'queued',
  add column if not exists is_read boolean not null default false,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists created_by text null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists read_at timestamptz null;

create table if not exists public.carelink_agent_action_logs (
  id bigserial primary key,
  caregiver_id bigint null,
  action_type text not null,
  module_type text null,
  payload jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

alter table public.carelink_agent_action_logs
  add column if not exists caregiver_id bigint null,
  add column if not exists action_type text,
  add column if not exists module_type text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists created_by text null,
  add column if not exists created_at timestamptz not null default now();

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_app_access
  add column if not exists caregiver_id bigint,
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
  add column if not exists notes text null,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.carelink_agent_roster_preferences (
  id bigserial primary key,
  caregiver_id bigint not null,
  preferred_days text[] null default '{}',
  preferred_time_blocks text[] null default '{}',
  preferred_start_time time null,
  preferred_end_time time null,
  preferred_zones text[] null default '{}',
  excluded_zones text[] null default '{}',
  blocked_days text[] null default '{}',
  max_daily_hours numeric null,
  max_weekly_hours numeric null,
  max_distance_km numeric null,
  replacement_priority text null,
  accepts_weekends boolean not null default false,
  accepts_night boolean not null default false,
  accepts_emergency_replacement boolean not null default true,
  transport_required boolean not null default false,
  emergency_available boolean not null default false,
  notes text null,
  roster_notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_roster_preferences
  add column if not exists caregiver_id bigint,
  add column if not exists preferred_days text[] null default '{}',
  add column if not exists preferred_time_blocks text[] null default '{}',
  add column if not exists preferred_start_time time null,
  add column if not exists preferred_end_time time null,
  add column if not exists preferred_zones text[] null default '{}',
  add column if not exists excluded_zones text[] null default '{}',
  add column if not exists blocked_days text[] null default '{}',
  add column if not exists max_daily_hours numeric null,
  add column if not exists max_weekly_hours numeric null,
  add column if not exists max_distance_km numeric null,
  add column if not exists replacement_priority text null,
  add column if not exists accepts_weekends boolean not null default false,
  add column if not exists accepts_night boolean not null default false,
  add column if not exists accepts_emergency_replacement boolean not null default true,
  add column if not exists transport_required boolean not null default false,
  add column if not exists emergency_available boolean not null default false,
  add column if not exists notes text null,
  add column if not exists roster_notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.carelink_agent_payment_configs (
  id bigserial primary key,
  caregiver_id bigint not null,
  hourly_rate numeric null,
  hourly_rate_mad numeric null,
  daily_rate numeric null,
  mission_rate numeric null,
  overtime_rate numeric null,
  transport_allowance numeric null,
  payment_mode text null default 'monthly',
  payment_cycle text null default 'monthly',
  currency text not null default 'MAD',
  allowance_rules text null,
  bank_name text null,
  bank_account text null,
  wallet_phone text null,
  bank_or_wallet text null,
  finance_status text not null default 'draft',
  finance_notes text null,
  notes text null,
  is_active boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_payment_configs
  add column if not exists caregiver_id bigint,
  add column if not exists hourly_rate numeric null,
  add column if not exists hourly_rate_mad numeric null,
  add column if not exists daily_rate numeric null,
  add column if not exists mission_rate numeric null,
  add column if not exists overtime_rate numeric null,
  add column if not exists transport_allowance numeric null,
  add column if not exists payment_mode text null default 'monthly',
  add column if not exists payment_cycle text null default 'monthly',
  add column if not exists currency text not null default 'MAD',
  add column if not exists allowance_rules text null,
  add column if not exists bank_name text null,
  add column if not exists bank_account text null,
  add column if not exists wallet_phone text null,
  add column if not exists bank_or_wallet text null,
  add column if not exists finance_status text not null default 'draft',
  add column if not exists finance_notes text null,
  add column if not exists notes text null,
  add column if not exists is_active boolean not null default true,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.carelink_agent_payment_validations (
  id bigserial primary key,
  caregiver_id bigint not null,
  mission_id text null,
  mission_group_id uuid null,
  label text null,
  amount numeric not null default 0,
  currency text not null default 'MAD',
  status text not null default 'draft',
  validation_type text null default 'manual',
  period_start date null,
  period_end date null,
  evidence_url text null,
  notes text null,
  validated_at timestamptz null,
  validated_by text null,
  paid_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_payment_validations
  add column if not exists caregiver_id bigint,
  add column if not exists mission_id text null,
  add column if not exists label text null,
  add column if not exists amount numeric not null default 0,
  add column if not exists currency text not null default 'MAD',
  add column if not exists status text not null default 'draft',
  add column if not exists validation_type text null default 'manual',
  add column if not exists period_start date null,
  add column if not exists period_end date null,
  add column if not exists evidence_url text null,
  add column if not exists notes text null,
  add column if not exists validated_at timestamptz null,
  add column if not exists validated_by text null,
  add column if not exists paid_at timestamptz null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.carelink_agent_training_plans (
  id bigserial primary key,
  caregiver_id bigint not null,
  training_path text null,
  required_tracks text[] null default '{}',
  completed_tracks text[] null default '{}',
  training_status text not null default 'draft',
  onboarding_status text null default 'pending',
  certification_status text null default 'pending',
  compliance_status text not null default 'pending',
  next_training_date date null,
  trainer_name text null,
  learning_notes text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carelink_agent_training_plans
  add column if not exists caregiver_id bigint,
  add column if not exists training_path text null,
  add column if not exists required_tracks text[] null default '{}',
  add column if not exists completed_tracks text[] null default '{}',
  add column if not exists training_status text not null default 'draft',
  add column if not exists onboarding_status text null default 'pending',
  add column if not exists certification_status text null default 'pending',
  add column if not exists compliance_status text not null default 'pending',
  add column if not exists next_training_date date null,
  add column if not exists trainer_name text null,
  add column if not exists learning_notes text null,
  add column if not exists notes text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_carelink_agent_app_access_caregiver
  on public.carelink_agent_app_access(caregiver_id);
create unique index if not exists uq_carelink_agent_roster_preferences_caregiver
  on public.carelink_agent_roster_preferences(caregiver_id);
create unique index if not exists uq_carelink_agent_payment_configs_caregiver
  on public.carelink_agent_payment_configs(caregiver_id);
create unique index if not exists uq_carelink_agent_training_plans_caregiver
  on public.carelink_agent_training_plans(caregiver_id);
create index if not exists idx_carelink_agent_notifications_caregiver
  on public.carelink_agent_notifications(caregiver_id);
create index if not exists idx_carelink_agent_notifications_audience
  on public.carelink_agent_notifications(audience_type, is_read);
create index if not exists idx_carelink_agent_action_logs_caregiver
  on public.carelink_agent_action_logs(caregiver_id);
create index if not exists idx_carelink_agent_payment_validations_caregiver
  on public.carelink_agent_payment_validations(caregiver_id);
