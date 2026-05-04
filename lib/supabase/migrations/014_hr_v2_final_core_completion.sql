-- 014 HR V2 FINAL CORE COMPLETION PACK
-- Safe compatibility upgrade. Does not drop existing HR tables.

create extension if not exists pgcrypto;

-- HR operational activity feed for unified actions across HR, roster, payroll, compliance, tasks, missions.
create table if not exists public.hr_activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid,
  source text default 'hr',
  source_ref text,
  event_type text not null,
  title text not null,
  description text,
  severity text default 'info',
  status text default 'open',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_activity_events_target_idx on public.hr_activity_events(target_user_id);
create index if not exists hr_activity_events_source_idx on public.hr_activity_events(source, source_ref);
create index if not exists hr_activity_events_created_idx on public.hr_activity_events(created_at desc);

-- HR sync registry to track what app systems HR reads from.
create table if not exists public.hr_sync_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_label text not null,
  source_table text,
  route_prefix text,
  enabled boolean not null default true,
  sync_mode text default 'read_safe',
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.hr_sync_sources(source_key, source_label, source_table, route_prefix, notes) values
('users','Users / Staff Accounts','users','/users','Staff identity and access source.'),
('pointage','Attendance / Pointage','attendance','/pointage','Attendance and clock events when attendance tables exist.'),
('missions','Missions','missions','/missions','Care missions and worker assignment history.'),
('caregivers','Caregivers','caregivers','/caregivers','Field caregiver workforce source.'),
('academy','Academy / Training','academy','/academy','Training and certification source.'),
('incidents','Incidents','incidents','/incidents','Incident and corrective action source.'),
('tasks','Tasks / Revenue Command','tasks','/revenue-command-center/tasks','Assigned tasks and execution workload.'),
('contracts','Contracts','contracts','/contracts','Contract activation and worker/client operation source.')
on conflict(source_key) do update set
  source_label=excluded.source_label,
  source_table=excluded.source_table,
  route_prefix=excluded.route_prefix,
  notes=excluded.notes,
  updated_at=now();

-- Payroll preparation periods. Calculation is controlled before payroll execution.
create table if not exists public.hr_payroll_periods (
  id uuid primary key default gen_random_uuid(),
  period_label text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft',
  notes text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists hr_payroll_periods_label_unique on public.hr_payroll_periods(period_label);

create table if not exists public.hr_payroll_items (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references public.hr_payroll_periods(id) on delete cascade,
  user_id uuid not null,
  base_salary numeric default 0,
  attendance_days numeric default 0,
  absence_days numeric default 0,
  late_count int default 0,
  overtime_hours numeric default 0,
  bonus numeric default 0,
  deduction numeric default 0,
  net_estimate numeric default 0,
  status text default 'draft',
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(period_id, user_id)
);

-- Compliance checks and alerts.
create table if not exists public.hr_compliance_checks (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid,
  category text not null,
  title text not null,
  status text not null default 'pending',
  severity text default 'medium',
  due_date date,
  resolved_at timestamptz,
  owner_user_id uuid,
  evidence_url text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hr_compliance_checks_target_idx on public.hr_compliance_checks(target_user_id);
create index if not exists hr_compliance_checks_status_idx on public.hr_compliance_checks(status, due_date);

-- Intelligence alerts. These power the HR command widgets.
create table if not exists public.hr_intelligence_alerts (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid,
  alert_type text not null,
  title text not null,
  message text not null,
  severity text default 'info',
  status text default 'active',
  recommended_action text,
  route text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists hr_intelligence_alerts_status_idx on public.hr_intelligence_alerts(status, severity);
create index if not exists hr_intelligence_alerts_target_idx on public.hr_intelligence_alerts(target_user_id);

-- Helper function to mark updated_at.
create or replace function public.hr_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'hr_activity_events','hr_sync_sources','hr_payroll_periods','hr_payroll_items',
    'hr_compliance_checks'
  ]
  loop
    execute format('drop trigger if exists trg_%s_touch on public.%I', t, t);
    execute format('create trigger trg_%s_touch before update on public.%I for each row execute function public.hr_touch_updated_at()', t, t);
  end loop;
end $$;

-- Seed useful compliance templates.
insert into public.hr_compliance_checks(category, title, status, severity, notes, payload)
select 'system_template','Staff document validity control','template','medium','Template: check IDs, contracts, certificates and policy docs.', '{"template":true}'::jsonb
where not exists (select 1 from public.hr_compliance_checks where title='Staff document validity control' and status='template');

insert into public.hr_intelligence_alerts(alert_type,title,message,severity,status,recommended_action,route)
select 'system_ready','HR Final Core installed','Final HR core tables are ready: sync sources, payroll prep, compliance checks and intelligence alerts.','success','active','Open HR sync center and verify connected modules.','/hr/final-core'
where not exists (select 1 from public.hr_intelligence_alerts where title='HR Final Core installed');
