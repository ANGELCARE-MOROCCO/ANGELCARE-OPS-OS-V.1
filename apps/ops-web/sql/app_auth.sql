create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text unique not null,
  password_hash text not null,
  role text not null default 'agent',
  status text not null default 'active',
  language text not null default 'fr',
  phone text,
  email text,
  department text,
  job_title text,
  created_by uuid references public.app_users(id) on delete set null,
  last_login_at timestamp with time zone,
  must_change_password boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  session_token text unique not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.app_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  details jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_app_users_username on public.app_users(username);
create index if not exists idx_app_sessions_token on public.app_sessions(session_token);
create index if not exists idx_app_sessions_user_id on public.app_sessions(user_id);
