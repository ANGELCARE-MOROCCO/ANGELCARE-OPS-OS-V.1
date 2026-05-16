-- AngelCare Ambassador OS Phase 3 optional database preparation.
-- Safe to review before running. This does not alter existing tables.

create table if not exists public.ambassador_command_actions (
  id text primary key,
  title text not null,
  owner text not null default 'Ambassador Director',
  area text not null,
  priority text not null default 'High',
  due_date date,
  status text not null default 'queued',
  detail text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ambassador_automation_rules (
  id text primary key,
  title text not null,
  trigger text not null,
  channel text not null default 'Internal',
  audience text not null default 'Ambassador Director',
  enabled boolean not null default true,
  message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
