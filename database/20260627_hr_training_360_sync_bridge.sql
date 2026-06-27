create extension if not exists pgcrypto;

create table if not exists public.hr_training_course_assignments (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null,
  position_title text not null,
  course_title text not null,
  employee_id text,
  employee_name text,
  scheduled_at timestamptz,
  due_at timestamptz,
  trainer_name text,
  session_mode text not null default 'online',
  status text not null default 'not_started',
  score_percent integer,
  pass_score integer not null default 75,
  attempt_count integer not null default 0,
  completed_at timestamptz,
  delayed_reason text,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hr_training_course_assignments_employee_id
on public.hr_training_course_assignments(employee_id);

create index if not exists idx_hr_training_course_assignments_employee_name
on public.hr_training_course_assignments(employee_name);

create index if not exists idx_hr_training_course_assignments_status_due
on public.hr_training_course_assignments(status, due_at);

select pg_notify('pgrst', 'reload schema');
