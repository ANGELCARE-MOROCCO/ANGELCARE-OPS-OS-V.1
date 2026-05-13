-- CSA Command Home database preparation.
-- Safe to run in Supabase SQL editor.
-- No destructive drop statements.

create table if not exists csa_followups (
  id uuid primary key default gen_random_uuid(),
  family_id uuid,
  lead_id uuid,
  owner_user_id uuid,
  title text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  source_module text not null default 'csa',
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists csa_escalations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid,
  lead_id uuid,
  service_id uuid,
  owner_user_id uuid,
  title text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  source_module text not null default 'csa',
  resolution_notes text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists csa_service_activations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid,
  lead_id uuid,
  service_id uuid,
  owner_user_id uuid,
  activation_status text not null default 'pending',
  checklist jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  planned_start_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table csa_followups enable row level security;
alter table csa_escalations enable row level security;
alter table csa_service_activations enable row level security;

drop policy if exists "csa followups visible to csa users" on csa_followups;
create policy "csa followups visible to csa users"
on csa_followups
for select
using (true);

drop policy if exists "csa escalations visible to csa users" on csa_escalations;
create policy "csa escalations visible to csa users"
on csa_escalations
for select
using (true);

drop policy if exists "csa activations visible to csa users" on csa_service_activations;
create policy "csa activations visible to csa users"
on csa_service_activations
for select
using (true);

create index if not exists idx_csa_followups_status_priority on csa_followups(status, priority);
create index if not exists idx_csa_escalations_status_severity on csa_escalations(status, severity);
create index if not exists idx_csa_service_activations_status on csa_service_activations(activation_status);
