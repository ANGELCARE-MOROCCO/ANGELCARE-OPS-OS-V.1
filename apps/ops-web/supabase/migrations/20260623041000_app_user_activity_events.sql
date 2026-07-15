create extension if not exists pgcrypto;

create table if not exists public.app_user_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  email text,
  full_name text,
  role text,
  event_type text not null default 'page_view',
  module_key text,
  route_href text,
  ip_address text,
  city text,
  country text,
  region text,
  user_agent text,
  device_type text,
  browser_name text,
  os_name text,
  session_id text,
  referrer text,
  screen_size text,
  timezone text,
  language text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_user_activity_events_user_id
  on public.app_user_activity_events(user_id);

create index if not exists idx_app_user_activity_events_email
  on public.app_user_activity_events(email);

create index if not exists idx_app_user_activity_events_created_at
  on public.app_user_activity_events(created_at desc);

create index if not exists idx_app_user_activity_events_route_href
  on public.app_user_activity_events(route_href);

create index if not exists idx_app_user_activity_events_module_key
  on public.app_user_activity_events(module_key);

create index if not exists idx_app_user_activity_events_event_type
  on public.app_user_activity_events(event_type);
