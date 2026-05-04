-- HR V2 Operational Control + QA Layer
-- Safe add-on migration. Does not drop or rewrite existing HR backbone.
create extension if not exists pgcrypto;

create table if not exists public.hr_quality_checks (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid,
  related_mission_id uuid,
  category text not null default 'service_quality',
  status text not null default 'open',
  priority text not null default 'medium',
  score int,
  findings text,
  corrective_action text,
  owner_user_id uuid,
  due_at timestamptz,
  closed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_shift_handovers (
  id uuid primary key default gen_random_uuid(),
  shift_date date not null default current_date,
  from_user_id uuid,
  to_user_id uuid,
  department text,
  duty_type text default 'standard',
  status text not null default 'pending',
  open_items jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  notes text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_escalations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text default 'hr',
  source_id uuid,
  staff_user_id uuid,
  severity text not null default 'medium',
  status text not null default 'open',
  owner_user_id uuid,
  escalation_reason text,
  resolution text,
  due_at timestamptz,
  closed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_manager_reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  review_type text not null default 'manager_review',
  staff_user_id uuid,
  requested_by uuid,
  reviewer_user_id uuid,
  status text not null default 'pending',
  decision text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_service_standards (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  category text not null default 'general',
  department text,
  description text,
  checklist jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  notes text,
  created_at timestamptz not null default now()
);

insert into public.hr_service_standards(title, category, department, description, checklist)
values
('Care mission standard','care_quality','Care Operations','Minimum execution standard for assigned care missions.', '["Arrive on time","Confirm service start","Respect care instructions","Report completion","Escalate incident immediately"]'::jsonb),
('Attendance standard','attendance','Core Office Staff','Standard for punctuality, absence communication and shift discipline.', '["Clock in before shift","Explain lateness","Submit absence proof","Respect break windows","Complete handover"]'::jsonb),
('Communication standard','communication','Core Office Staff','Expected internal and client communication protocol.', '["Use approved channel","Log important calls","Keep tone professional","Escalate urgent issues","Close loop with confirmation"]'::jsonb),
('Document compliance standard','compliance','Core Office Staff','Required document control for HR, caregivers and operations.', '["Verify document owner","Check expiry","Attach proof","Mark status","Schedule renewal reminder"]'::jsonb)
on conflict(title) do update set
  category = excluded.category,
  department = excluded.department,
  description = excluded.description,
  checklist = excluded.checklist,
  updated_at = now();
