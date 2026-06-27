create extension if not exists pgcrypto;

create table if not exists public.hr_training_deleted_resource_tombstones (
  id uuid primary key default gen_random_uuid(),
  resource_id text,
  position_title text not null default '',
  course_title text not null default '',
  deleted_reason text,
  deleted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(resource_id, position_title)
);

create index if not exists idx_hr_training_deleted_resource_tombstones_resource
on public.hr_training_deleted_resource_tombstones(resource_id, position_title);

create index if not exists idx_hr_training_deleted_resource_tombstones_title
on public.hr_training_deleted_resource_tombstones(position_title, course_title);

select pg_notify('pgrst', 'reload schema');
