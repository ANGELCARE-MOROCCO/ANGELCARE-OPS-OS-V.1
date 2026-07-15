-- CARELINK P3: Operational escalation, dispatch action queue, and completion-readiness enforcement foundations.
-- UI-neutral migration: supports mobile/OPS backend workflow only.

create table if not exists public.carelink_operational_escalations (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint,
  caregiver_id bigint,
  action_type text not null,
  escalation_type text not null,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  severity text,
  status text not null default 'ops_review_required',
  minutes integer,
  source text not null default 'carelink_mobile',
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carelink_operational_escalations_mission_idx on public.carelink_operational_escalations (mission_id, created_at desc);
create index if not exists carelink_operational_escalations_caregiver_idx on public.carelink_operational_escalations (caregiver_id, created_at desc);
create index if not exists carelink_operational_escalations_status_idx on public.carelink_operational_escalations (status, priority, created_at desc);

create table if not exists public.carelink_ops_action_queue (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint,
  caregiver_id bigint,
  escalation_id uuid,
  queue_type text not null,
  action_type text not null,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  source text not null default 'carelink_mobile',
  assigned_to text,
  due_at timestamptz,
  acknowledged_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carelink_ops_action_queue_mission_idx on public.carelink_ops_action_queue (mission_id, created_at desc);
create index if not exists carelink_ops_action_queue_status_idx on public.carelink_ops_action_queue (status, priority, created_at desc);
create index if not exists carelink_ops_action_queue_escalation_idx on public.carelink_ops_action_queue (escalation_id);

alter table public.carelink_operational_escalations enable row level security;
alter table public.carelink_ops_action_queue enable row level security;

drop policy if exists "carelink operational escalations authenticated read" on public.carelink_operational_escalations;
create policy "carelink operational escalations authenticated read" on public.carelink_operational_escalations
  for select to authenticated using (true);

drop policy if exists "carelink operational escalations authenticated insert" on public.carelink_operational_escalations;
create policy "carelink operational escalations authenticated insert" on public.carelink_operational_escalations
  for insert to authenticated with check (true);

drop policy if exists "carelink ops action queue authenticated read" on public.carelink_ops_action_queue;
create policy "carelink ops action queue authenticated read" on public.carelink_ops_action_queue
  for select to authenticated using (true);

drop policy if exists "carelink ops action queue authenticated insert" on public.carelink_ops_action_queue;
create policy "carelink ops action queue authenticated insert" on public.carelink_ops_action_queue
  for insert to authenticated with check (true);
