-- TrainingHub production hardening audit tables.
-- Safe to run manually in Supabase SQL editor.
-- This does not alter existing business tables.

create table if not exists public.traininghub_production_gate_runs (
  id uuid primary key default gen_random_uuid(),
  gate_code text not null default 'traininghub_final_production_completion',
  status text not null check (status in ('pass','fail','warning','running')),
  score integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists idx_traininghub_production_gate_runs_created_at
  on public.traininghub_production_gate_runs(created_at desc);

create table if not exists public.traininghub_partner_access_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  profile_id uuid null,
  auth_user_id uuid null,
  action text not null,
  status text not null default 'recorded',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_traininghub_partner_access_audit_org
  on public.traininghub_partner_access_audit(organization_id, created_at desc);

alter table public.traininghub_production_gate_runs enable row level security;
alter table public.traininghub_partner_access_audit enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'traininghub_production_gate_runs'
      and policyname = 'service_role_traininghub_gate_runs'
  ) then
    create policy service_role_traininghub_gate_runs
      on public.traininghub_production_gate_runs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'traininghub_partner_access_audit'
      and policyname = 'service_role_traininghub_partner_access_audit'
  ) then
    create policy service_role_traininghub_partner_access_audit
      on public.traininghub_partner_access_audit
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
