-- AngelCare Market-OS Core Production Spine
create extension if not exists pgcrypto;

create table if not exists public.market_os_records (
  id uuid primary key default gen_random_uuid(),
  kind text,
  record_type text not null default 'task',
  engine text not null default 'system',
  pipeline text,
  title text not null,
  description text,
  owner text,
  owner_agent text,
  status text not null default 'draft',
  priority text not null default 'normal',
  stage text,
  due_date date,
  score numeric,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_actions (
  id uuid primary key default gen_random_uuid(),
  action_key text not null,
  record_id uuid references public.market_os_records(id) on delete set null,
  engine text not null default 'system',
  actor_name text,
  owner_agent text,
  status text not null default 'completed',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_os_audit_log (
  id uuid primary key default gen_random_uuid(),
  action_key text,
  title text not null,
  summary text,
  engine text,
  record_id uuid references public.market_os_records(id) on delete set null,
  actor_name text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_os_agents (
  id uuid primary key default gen_random_uuid(),
  agent_key text unique not null,
  name text not null,
  role text not null,
  engine text not null default 'system',
  mission text,
  daily_routine jsonb not null default '{}'::jsonb,
  target_kpis jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_os_kpis (
  id uuid primary key default gen_random_uuid(),
  kpi_key text unique not null,
  label text not null,
  engine text not null default 'system',
  current_value numeric not null default 0,
  target_value numeric not null default 0,
  unit text,
  status text not null default 'tracking',
  last_updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.market_os_notifications (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references public.market_os_records(id) on delete cascade,
  title text not null,
  body text,
  severity text not null default 'info',
  target_role text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_os_records_kind on public.market_os_records(kind);
create index if not exists idx_market_os_records_status on public.market_os_records(status);
create index if not exists idx_market_os_actions_record on public.market_os_actions(record_id);
create index if not exists idx_market_os_audit_record on public.market_os_audit_log(record_id);

alter table public.market_os_records enable row level security;
alter table public.market_os_actions enable row level security;
alter table public.market_os_audit_log enable row level security;
alter table public.market_os_agents enable row level security;
alter table public.market_os_kpis enable row level security;
alter table public.market_os_notifications enable row level security;

do $$ begin
  create policy "market_os_records_authenticated_read" on public.market_os_records for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_os_records_authenticated_write" on public.market_os_records for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_os_actions_authenticated_all" on public.market_os_actions for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_os_audit_authenticated_read" on public.market_os_audit_log for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_os_agents_authenticated_read" on public.market_os_agents for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_os_kpis_authenticated_read" on public.market_os_kpis for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market_os_notifications_authenticated_all" on public.market_os_notifications for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

insert into public.market_os_agents(agent_key,name,role,engine,mission,target_kpis) values
('market_ai_director','Market AI Director','Executive orchestration','system','Convert market signals into tasks, approvals and KPI movement','{"velocity":95,"risk_response":"same_day"}'::jsonb),
('content_commander','Content Commander','Content execution','content','Keep campaigns, content, SEO and publishing connected','{"publishing_sla_hours":24}'::jsonb),
('ambassador_growth_operator','Ambassador Growth Operator','Network activation','network','Turn ambassador activity into verified leads and revenue movement','{"verified_leads_weekly":50}'::jsonb)
on conflict(agent_key) do update set name=excluded.name, role=excluded.role, engine=excluded.engine, mission=excluded.mission, target_kpis=excluded.target_kpis, updated_at=now();

insert into public.market_os_kpis(kpi_key,label,engine,current_value,target_value,unit,status) values
('market_execution_velocity','Market execution velocity','system',0,100,'score','tracking'),
('content_publish_readiness','Content publish readiness','content',0,100,'score','tracking'),
('ambassador_verified_leads','Ambassador verified leads','network',0,100,'leads','tracking'),
('campaign_roi_control','Campaign ROI control','acquisition',0,100,'score','tracking')
on conflict(kpi_key) do update set label=excluded.label, engine=excluded.engine, target_value=excluded.target_value, unit=excluded.unit, status=excluded.status, last_updated_at=now();
