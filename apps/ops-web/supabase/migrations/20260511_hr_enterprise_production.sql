create table if not exists public.hr_notifications (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'in_app',
  audience_role text null,
  user_id uuid null,
  title text not null,
  body text null,
  severity text not null default 'info',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz null
);
create table if not exists public.hr_observability_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  severity text not null default 'info',
  source text not null default 'hr_enterprise',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
