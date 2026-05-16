-- SALES MODULE V30 PACK 8 — LIVE EXECUTION FLOOR
create table if not exists public.sales_agent_workbench_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid null,
  shift_date date not null default current_date,
  current_mission text not null default 'Hot lead attack',
  focus_target numeric default 0,
  calls_target integer default 0,
  quotes_target integer default 0,
  closes_target integer default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.sales_live_followup_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  deal_id uuid null,
  owner_id uuid null,
  queue_type text not null,
  due_at timestamptz not null,
  priority text not null default 'normal',
  required_action text not null,
  client_promise text,
  status text not null default 'open',
  escalation_level text default 'none',
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table if not exists public.sales_closing_sprints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sprint_type text not null,
  target_revenue numeric default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  owner_id uuid null,
  rules jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.sales_callback_controls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  deal_id uuid null,
  owner_id uuid null,
  callback_type text not null,
  promised_at timestamptz not null,
  channel text default 'phone',
  promise_context text,
  risk_level text default 'normal',
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create table if not exists public.sales_deal_rescue_actions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid null,
  lead_id uuid null,
  risk_type text not null,
  rescue_play text not null,
  owner_id uuid null,
  manager_required boolean not null default false,
  status text not null default 'open',
  result text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

alter table public.sales_agent_workbench_sessions enable row level security;
alter table public.sales_live_followup_queue enable row level security;
alter table public.sales_closing_sprints enable row level security;
alter table public.sales_callback_controls enable row level security;
alter table public.sales_deal_rescue_actions enable row level security;

create policy if not exists "sales_pack8_read_all" on public.sales_agent_workbench_sessions for select using (true);
create policy if not exists "sales_pack8_insert_all" on public.sales_agent_workbench_sessions for insert with check (true);
create policy if not exists "sales_pack8_update_all" on public.sales_agent_workbench_sessions for update using (true);

create policy if not exists "sales_followup_read_all" on public.sales_live_followup_queue for select using (true);
create policy if not exists "sales_followup_insert_all" on public.sales_live_followup_queue for insert with check (true);
create policy if not exists "sales_followup_update_all" on public.sales_live_followup_queue for update using (true);

create policy if not exists "sales_sprints_read_all" on public.sales_closing_sprints for select using (true);
create policy if not exists "sales_sprints_insert_all" on public.sales_closing_sprints for insert with check (true);
create policy if not exists "sales_sprints_update_all" on public.sales_closing_sprints for update using (true);

create policy if not exists "sales_callbacks_read_all" on public.sales_callback_controls for select using (true);
create policy if not exists "sales_callbacks_insert_all" on public.sales_callback_controls for insert with check (true);
create policy if not exists "sales_callbacks_update_all" on public.sales_callback_controls for update using (true);

create policy if not exists "sales_rescue_read_all" on public.sales_deal_rescue_actions for select using (true);
create policy if not exists "sales_rescue_insert_all" on public.sales_deal_rescue_actions for insert with check (true);
create policy if not exists "sales_rescue_update_all" on public.sales_deal_rescue_actions for update using (true);
