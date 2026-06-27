create table if not exists public.carelink_agent_payment_validations (
  id bigserial primary key,
  caregiver_id bigint not null,
  mission_id bigint null,
  mission_group_id uuid null,
  label text null,
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

alter table public.carelink_agent_payment_validations
  add column if not exists mission_id bigint,
  add column if not exists mission_group_id uuid,
  add column if not exists label text,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists validation_type text default 'manual',
  add column if not exists validated_by text,
  add column if not exists validated_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists evidence_url text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_carelink_agent_payment_validations_caregiver_id
  on public.carelink_agent_payment_validations(caregiver_id);

create index if not exists idx_carelink_agent_payment_validations_status
  on public.carelink_agent_payment_validations(status);

create index if not exists idx_carelink_agent_payment_validations_mission_id
  on public.carelink_agent_payment_validations(mission_id);
