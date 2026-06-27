-- CARELINK P4: Mobile device/session governance and security-event audit.
-- UI-neutral migration: no OPS/mobile screen changes; supports mobile access enforcement only.

create table if not exists public.carelink_mobile_device_sessions (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null,
  auth_user_id text,
  access_id text,
  device_fingerprint text not null,
  device_id text,
  device_label text,
  platform text,
  app_version text,
  user_agent text,
  ip_address text,
  status text not null default 'active',
  trusted_at timestamptz,
  trusted_by text,
  blocked_at timestamptz,
  blocked_by text,
  revoked_at timestamptz,
  revoked_by text,
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carelink_mobile_device_sessions_unique unique (caregiver_id, device_fingerprint)
);

create index if not exists carelink_mobile_device_sessions_caregiver_idx
  on public.carelink_mobile_device_sessions (caregiver_id, last_seen_at desc);
create index if not exists carelink_mobile_device_sessions_status_idx
  on public.carelink_mobile_device_sessions (status, blocked_at, revoked_at);
create index if not exists carelink_mobile_device_sessions_fingerprint_idx
  on public.carelink_mobile_device_sessions (device_fingerprint);

create table if not exists public.carelink_mobile_security_events (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint,
  auth_user_id text,
  event_type text not null,
  severity text not null default 'normal',
  device_fingerprint text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists carelink_mobile_security_events_caregiver_idx
  on public.carelink_mobile_security_events (caregiver_id, created_at desc);
create index if not exists carelink_mobile_security_events_type_idx
  on public.carelink_mobile_security_events (event_type, severity, created_at desc);
create index if not exists carelink_mobile_security_events_device_idx
  on public.carelink_mobile_security_events (device_fingerprint, created_at desc);

alter table public.carelink_mobile_device_sessions enable row level security;
alter table public.carelink_mobile_security_events enable row level security;

drop policy if exists "carelink mobile device sessions authenticated read" on public.carelink_mobile_device_sessions;
create policy "carelink mobile device sessions authenticated read" on public.carelink_mobile_device_sessions
  for select to authenticated using (true);

drop policy if exists "carelink mobile device sessions authenticated insert" on public.carelink_mobile_device_sessions;
create policy "carelink mobile device sessions authenticated insert" on public.carelink_mobile_device_sessions
  for insert to authenticated with check (true);

drop policy if exists "carelink mobile device sessions authenticated update" on public.carelink_mobile_device_sessions;
create policy "carelink mobile device sessions authenticated update" on public.carelink_mobile_device_sessions
  for update to authenticated using (true) with check (true);

drop policy if exists "carelink mobile security events authenticated read" on public.carelink_mobile_security_events;
create policy "carelink mobile security events authenticated read" on public.carelink_mobile_security_events
  for select to authenticated using (true);

drop policy if exists "carelink mobile security events authenticated insert" on public.carelink_mobile_security_events;
create policy "carelink mobile security events authenticated insert" on public.carelink_mobile_security_events
  for insert to authenticated with check (true);
