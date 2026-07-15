-- AngelCare OPSOS — Global Operation Completion Engine V2
-- Autonomous execution core persistence, audit trail, rollback readiness and module governance.

create extension if not exists pgcrypto;

create table if not exists public.operation_completion_scans (
  id text primary key,
  selected_modules text[] not null default '{}',
  selected_areas text[] not null default '{}',
  scanned_files integer not null default 0,
  total_actions integer not null default 0,
  completion_score integer not null default 0,
  risk_summary jsonb not null default '{}'::jsonb,
  coverage jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.operation_completion_scan_items (
  id uuid primary key default gen_random_uuid(),
  scan_id text not null references public.operation_completion_scans(id) on delete cascade,
  item_id text not null,
  module_key text not null,
  area text not null,
  file_path text not null,
  label text not null,
  action_type text not null,
  risk text not null check (risk in ('low','medium','high','critical')),
  confidence integer not null default 0,
  protected_action boolean not null default false,
  evidence text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(scan_id, item_id)
);

create table if not exists public.operation_completion_jobs (
  id text primary key,
  mode text not null check (mode in ('observe','controlled','strict','autonomous')),
  dry_run boolean not null default true,
  source_write_applied boolean not null default false,
  progress integer not null default 0,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','blocked','rolled_back')),
  summary jsonb not null default '{}'::jsonb,
  artifacts text[] not null default '{}',
  rollback_manifest text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operation_completion_job_steps (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.operation_completion_jobs(id) on delete cascade,
  step_id text not null,
  title text not null,
  module_key text not null,
  area text not null,
  risk text not null check (risk in ('low','medium','high','critical')),
  execution text not null check (execution in ('automatic','approval-required','manual-review')),
  status text not null check (status in ('queued','running','completed','blocked','failed','skipped')),
  description text,
  target_files text[] not null default '{}',
  rollback_hint text,
  created_at timestamptz not null default now(),
  unique(job_id, step_id)
);

create table if not exists public.operation_completion_module_policies (
  module_key text primary key,
  enabled boolean not null default true,
  execution_mode text not null default 'controlled' check (execution_mode in ('observe','controlled','strict','autonomous')),
  selected_areas text[] not null default '{}',
  require_approval_for_high_risk boolean not null default true,
  allow_source_write boolean not null default false,
  policy_payload jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.operation_completion_approvals (
  id uuid primary key default gen_random_uuid(),
  job_id text references public.operation_completion_jobs(id) on delete cascade,
  module_key text not null,
  risk text not null check (risk in ('low','medium','high','critical')),
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','expired')),
  requested_payload jsonb not null default '{}'::jsonb,
  decision_note text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.operation_completion_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_role text,
  job_id text,
  scan_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operation_completion_scan_items_scan_idx on public.operation_completion_scan_items(scan_id);
create index if not exists operation_completion_scan_items_module_idx on public.operation_completion_scan_items(module_key, area, risk);
create index if not exists operation_completion_job_steps_job_idx on public.operation_completion_job_steps(job_id);
create index if not exists operation_completion_audit_events_job_idx on public.operation_completion_audit_events(job_id, created_at desc);
create index if not exists operation_completion_audit_events_scan_idx on public.operation_completion_audit_events(scan_id, created_at desc);

alter table public.operation_completion_scans enable row level security;
alter table public.operation_completion_scan_items enable row level security;
alter table public.operation_completion_jobs enable row level security;
alter table public.operation_completion_job_steps enable row level security;
alter table public.operation_completion_module_policies enable row level security;
alter table public.operation_completion_approvals enable row level security;
alter table public.operation_completion_audit_events enable row level security;

-- Service-role API routes write these records. Authenticated app users can read operational history.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_scans' and policyname = 'operation_completion_scans_read') then
    create policy operation_completion_scans_read on public.operation_completion_scans for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_scan_items' and policyname = 'operation_completion_scan_items_read') then
    create policy operation_completion_scan_items_read on public.operation_completion_scan_items for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_jobs' and policyname = 'operation_completion_jobs_read') then
    create policy operation_completion_jobs_read on public.operation_completion_jobs for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_job_steps' and policyname = 'operation_completion_job_steps_read') then
    create policy operation_completion_job_steps_read on public.operation_completion_job_steps for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_module_policies' and policyname = 'operation_completion_module_policies_read') then
    create policy operation_completion_module_policies_read on public.operation_completion_module_policies for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_approvals' and policyname = 'operation_completion_approvals_read') then
    create policy operation_completion_approvals_read on public.operation_completion_approvals for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operation_completion_audit_events' and policyname = 'operation_completion_audit_events_read') then
    create policy operation_completion_audit_events_read on public.operation_completion_audit_events for select using (auth.role() = 'authenticated');
  end if;
end $$;

insert into public.operation_completion_module_policies (module_key, enabled, execution_mode, selected_areas, require_approval_for_high_risk, allow_source_write, policy_payload)
values
  ('ac360', true, 'controlled', array['ui-actions','forms','api-routes','data-sync','runtime-policy'], true, false, '{"critical":true}'::jsonb),
  ('carelink-ops', true, 'controlled', array['ui-actions','forms','api-routes','data-sync'], true, false, '{"critical":true}'::jsonb),
  ('carelink', true, 'controlled', array['ui-actions','forms','api-routes','performance'], true, false, '{"critical":true}'::jsonb),
  ('users', true, 'strict', array['ui-actions','forms','api-routes','security'], true, false, '{"critical":true,"identitySensitive":true}'::jsonb),
  ('email-os', true, 'controlled', array['api-routes','data-sync','security','quality'], true, false, '{"critical":true}'::jsonb),
  ('operation-completion', true, 'strict', array['runtime-policy','api-routes','security','quality'], true, false, '{"protected":true}'::jsonb)
on conflict (module_key) do update set
  enabled = excluded.enabled,
  execution_mode = excluded.execution_mode,
  selected_areas = excluded.selected_areas,
  require_approval_for_high_risk = excluded.require_approval_for_high_risk,
  policy_payload = public.operation_completion_module_policies.policy_payload || excluded.policy_payload,
  updated_at = now();
