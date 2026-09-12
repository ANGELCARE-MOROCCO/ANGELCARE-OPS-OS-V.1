begin;
create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text unique not null,
  email text,
  password_hash text not null,
  role text not null default 'staff',
  status text not null default 'active',
  language text not null default 'fr',
  phone text,
  department text,
  job_title text,
  created_by uuid references public.app_users(id) on delete set null,
  must_change_password boolean not null default false,
  permissions text[] not null default '{}',
  last_login_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.app_users add column if not exists email text;
alter table public.app_users add column if not exists language text not null default 'fr';
alter table public.app_users add column if not exists phone text;
alter table public.app_users add column if not exists department text;
alter table public.app_users add column if not exists job_title text;
alter table public.app_users add column if not exists created_by uuid references public.app_users(id) on delete set null;
alter table public.app_users add column if not exists must_change_password boolean not null default false;
alter table public.app_users add column if not exists permissions text[] not null default '{}';
alter table public.app_users add column if not exists last_seen_at timestamptz;
create unique index if not exists app_users_email_ci_idx on public.app_users(lower(email)) where email is not null;

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  session_token text not null unique,
  expires_at timestamptz not null,
  mfa_verified_at timestamptz,
  mfa_challenge_at timestamptz,
  last_seen_at timestamptz,
  device_label text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists app_sessions_user_idx on public.app_sessions(user_id, expires_at desc);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_users force row level security;
alter table public.app_sessions force row level security;
revoke all on public.app_users, public.app_sessions from anon, authenticated;
grant all on public.app_users, public.app_sessions to service_role;
commit;
