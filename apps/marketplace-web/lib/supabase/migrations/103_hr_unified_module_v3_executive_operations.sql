-- HR UNIFIED MODULE V3 - EXECUTIVE OPERATIONS LAYER
-- Additive and safe. Run after V1 + V2/V2.1.

create extension if not exists pgcrypto;

create table if not exists hr_approval_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  approval_type text not null default 'general',
  entity_type text not null default 'hr',
  entity_id uuid,
  priority text not null default 'medium',
  status text not null default 'pending',
  requested_by uuid,
  requested_reason text,
  decided_by uuid,
  decided_at timestamptz,
  decision_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  channel text not null default 'internal',
  audience text not null default 'hr',
  severity text not null default 'info',
  message text,
  status text not null default 'draft',
  sent_at timestamptz,
  created_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  report_type text not null default 'executive',
  period_label text,
  status text not null default 'generated',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr_workforce_risk_register (
  id uuid primary key default gen_random_uuid(),
  risk_type text not null default 'workforce',
  title text not null default '',
  severity text not null default 'medium',
  status text not null default 'open',
  staff_id uuid,
  department_id uuid,
  related_entity_type text,
  related_entity_id uuid,
  mitigation_plan text,
  owner_id uuid,
  due_at timestamptz,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr_kpi_targets (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_label text not null,
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  period_label text,
  owner_id uuid,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hr_approval_requests add column if not exists title text not null default '';
alter table hr_approval_requests add column if not exists approval_type text not null default 'general';
alter table hr_approval_requests add column if not exists entity_type text not null default 'hr';
alter table hr_approval_requests add column if not exists entity_id uuid;
alter table hr_approval_requests add column if not exists priority text not null default 'medium';
alter table hr_approval_requests add column if not exists status text not null default 'pending';
alter table hr_approval_requests add column if not exists requested_by uuid;
alter table hr_approval_requests add column if not exists requested_reason text;
alter table hr_approval_requests add column if not exists decided_by uuid;
alter table hr_approval_requests add column if not exists decided_at timestamptz;
alter table hr_approval_requests add column if not exists decision_notes text;
alter table hr_approval_requests add column if not exists notes text;
alter table hr_approval_requests add column if not exists created_at timestamptz not null default now();
alter table hr_approval_requests add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_hr_approval_requests_status on hr_approval_requests(status);
create index if not exists idx_hr_approval_requests_priority on hr_approval_requests(priority);
create index if not exists idx_hr_notifications_status on hr_notifications(status);
create index if not exists idx_hr_report_snapshots_type on hr_report_snapshots(report_type);
create index if not exists idx_hr_workforce_risk_status on hr_workforce_risk_register(status);
create index if not exists idx_hr_kpi_targets_metric on hr_kpi_targets(metric_key);

insert into hr_kpi_targets (metric_key, metric_label, target_value, current_value, period_label, status)
select * from (values
  ('time_to_hire_days','Time to hire in days',14,0,'monthly','active'),
  ('onboarding_completion','Onboarding completion %',95,0,'monthly','active'),
  ('attendance_accuracy','Attendance accuracy %',98,0,'monthly','active'),
  ('roster_coverage','Roster coverage %',97,0,'weekly','active'),
  ('document_compliance','Staff document compliance %',100,0,'monthly','active')
) as v(metric_key, metric_label, target_value, current_value, period_label, status)
where not exists (select 1 from hr_kpi_targets k where k.metric_key = v.metric_key);

insert into hr_approval_requests (title, approval_type, entity_type, priority, status, requested_reason)
select * from (values
  ('Approve attendance correction backlog', 'attendance_correction', 'hr_attendance_corrections', 'high', 'pending', 'Initial V3 control queue item.'),
  ('Approve urgent recruitment shortlist', 'recruitment_decision', 'hr_recruitment_candidates', 'high', 'pending', 'Initial V3 control queue item.'),
  ('Approve onboarding exception review', 'onboarding_exception', 'hr_onboarding_steps', 'medium', 'pending', 'Initial V3 control queue item.')
) as v(title, approval_type, entity_type, priority, status, requested_reason)
where not exists (select 1 from hr_approval_requests a where a.title = v.title);

select 'HR V3 executive operations SQL installed successfully' as result;
