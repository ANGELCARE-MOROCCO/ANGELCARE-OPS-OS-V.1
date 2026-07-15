-- Angelcare Revenue Command Center - Central Revenue Core
-- Run this once in Supabase SQL editor before testing the live dashboard.

create extension if not exists pgcrypto;

create table if not exists public.revenue_core_records (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('prospects','appointments','sdr','daily-tasks','campaigns','partnerships','analytics','executive-briefing','follow-ups','b2c-workflow','decision-maps')),
  title text not null,
  account text not null default 'Angelcare revenue account',
  owner text not null default 'Revenue Core',
  stage text not null default 'prospecting' check (stage in ('prospecting','qualified','proposal','negotiation','closed-won','blocked','lost')),
  status text not null default 'open' check (status in ('open','in-progress','won','blocked','overdue','done')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  value_mad numeric(14,2) not null default 0,
  probability integer not null default 50 check (probability >= 0 and probability <= 100),
  due_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_core_activity (
  id uuid primary key default gen_random_uuid(),
  record_id uuid null references public.revenue_core_records(id) on delete set null,
  module text not null,
  action text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists revenue_core_records_module_idx on public.revenue_core_records(module);
create index if not exists revenue_core_records_stage_idx on public.revenue_core_records(stage);
create index if not exists revenue_core_records_status_idx on public.revenue_core_records(status);
create index if not exists revenue_core_records_priority_idx on public.revenue_core_records(priority);
create index if not exists revenue_core_records_due_at_idx on public.revenue_core_records(due_at);
create index if not exists revenue_core_records_updated_at_idx on public.revenue_core_records(updated_at desc);
create index if not exists revenue_core_activity_created_at_idx on public.revenue_core_activity(created_at desc);

create or replace function public.touch_revenue_core_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_revenue_core_records on public.revenue_core_records;
create trigger trg_touch_revenue_core_records
before update on public.revenue_core_records
for each row execute function public.touch_revenue_core_updated_at();

alter table public.revenue_core_records enable row level security;
alter table public.revenue_core_activity enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='revenue_core_records' and policyname='revenue_core_records_authenticated_all') then
    create policy revenue_core_records_authenticated_all on public.revenue_core_records for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='revenue_core_activity' and policyname='revenue_core_activity_authenticated_all') then
    create policy revenue_core_activity_authenticated_all on public.revenue_core_activity for all to authenticated using (true) with check (true);
  end if;
end $$;

insert into public.revenue_core_records (module,title,account,owner,stage,status,priority,value_mad,probability,due_at,metadata)
select * from (values
  ('prospects','High value preschool partnership','Amina Corp','Revenue Core','proposal','open','critical',2100000,75,now()+interval '1 day','{"seed":"central_core"}'::jsonb),
  ('prospects','Cloud migration acquisition project','Globex Inc','SDR Team','qualified','in-progress','high',1600000,60,now()+interval '2 days','{"seed":"central_core"}'::jsonb),
  ('appointments','Discovery Call','Amina Corp','Appointments Desk','qualified','open','high',450000,55,now()+interval '2 hours','{"duration":"30m"}'::jsonb),
  ('sdr','SDR recovery sequence','Initech','SDR Hub','negotiation','overdue','critical',420000,45,now()-interval '8 hours','{"cadence":"recovery"}'::jsonb),
  ('campaigns','Q2 strategic acquisition campaign','Enterprise Segment','Marketing Revenue','prospecting','in-progress','high',980000,35,now()+interval '5 days','{"channel":"multi-channel"}'::jsonb),
  ('partnerships','Kindergarten B2B channel activation','Partner Network','Partnerships','proposal','open','high',1250000,62,now()+interval '3 days','{"vertical":"kindergarten"}'::jsonb),
  ('daily-tasks','Approve blocked proposal','Ops Desk','Management','blocked','blocked','critical',45000,20,now()-interval '2 hours','{"action":"approval"}'::jsonb),
  ('follow-ups','CEO revenue decision follow-up','Amina','Executive Briefing','negotiation','overdue','critical',42000,30,now()-interval '4 hours','{"escalated":true}'::jsonb),
  ('b2c-workflow','B2C active family onboarding','B2C Pipeline','B2C Workflow','qualified','in-progress','medium',156000,70,now()+interval '36 hours','{"journey":"onboarding"}'::jsonb),
  ('decision-maps','Decision maker confirmation map','Strategic Account','Revenue Core','proposal','open','high',300000,50,now()+interval '4 days','{"stakeholders":3}'::jsonb),
  ('executive-briefing','Weekly revenue risk briefing','Executive Office','CEO Briefing','negotiation','open','critical',760000,48,now()+interval '12 hours','{"briefing":true}'::jsonb)
) as seed(module,title,account,owner,stage,status,priority,value_mad,probability,due_at,metadata)
where not exists (select 1 from public.revenue_core_records limit 1);
