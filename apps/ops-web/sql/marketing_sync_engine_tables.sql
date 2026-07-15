-- Marketing Sync Engine V3 support tables.
-- Safe: no destructive drops.

create table if not exists marketing_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  title text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  source_module text not null default 'market-os',
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  source_module text not null default 'market-os',
  event_type text not null default 'activity',
  title text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table marketing_tasks enable row level security;
alter table marketing_activity_log enable row level security;

drop policy if exists "marketing tasks select" on marketing_tasks;
create policy "marketing tasks select" on marketing_tasks for select using (true);

drop policy if exists "marketing activity select" on marketing_activity_log;
create policy "marketing activity select" on marketing_activity_log for select using (true);

create index if not exists idx_marketing_tasks_status_priority on marketing_tasks(status, priority);
create index if not exists idx_marketing_activity_source_created on marketing_activity_log(source_module, created_at desc);
