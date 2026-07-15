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
  status text not null default 'scheduled',
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

alter table if exists public.workspace_broadcast_memos
  add column if not exists situation_key text,
  add column if not exists situation_label text,
  add column if not exists template_key text,
  add column if not exists template_label text,
  add column if not exists admin_status text not null default 'open';

create table if not exists public.workspace_broadcast_memo_targets (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid not null references public.workspace_broadcast_memos(id) on delete cascade,
  user_id uuid,
  user_email text,
  status text not null default 'unread',
  read_at timestamptz,
  acknowledged_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hr_training_course_assignments_due
on public.hr_training_course_assignments(status, due_at);

create index if not exists idx_workspace_broadcast_memo_targets_user
on public.workspace_broadcast_memo_targets(user_id, user_email, status);

select pg_notify('pgrst', 'reload schema');
