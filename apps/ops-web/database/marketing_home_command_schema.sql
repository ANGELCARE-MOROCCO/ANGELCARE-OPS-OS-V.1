create table if not exists marketing_home_signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists marketing_home_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid,
  source_module text,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists marketing_home_signals_status_idx on marketing_home_signals(status);
create index if not exists marketing_home_actions_status_idx on marketing_home_actions(status);
alter table marketing_home_signals enable row level security;
alter table marketing_home_actions enable row level security;
drop policy if exists "marketing home signals authenticated read" on marketing_home_signals;
create policy "marketing home signals authenticated read" on marketing_home_signals for select using (auth.role() = 'authenticated');
drop policy if exists "marketing home actions authenticated read" on marketing_home_actions;
create policy "marketing home actions authenticated read" on marketing_home_actions for select using (auth.role() = 'authenticated');
