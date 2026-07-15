-- Optional support tables for deeper Marketing sync.

create table if not exists marketing_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  source_module text not null default 'market-os',
  event_type text not null default 'activity',
  title text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists marketing_automations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'active',
  source_module text not null default 'market-os',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table marketing_activity_log enable row level security;
alter table marketing_automations enable row level security;

drop policy if exists "marketing activity select all" on marketing_activity_log;
create policy "marketing activity select all" on marketing_activity_log for select using (true);

drop policy if exists "marketing automations select all" on marketing_automations;
create policy "marketing automations select all" on marketing_automations for select using (true);
