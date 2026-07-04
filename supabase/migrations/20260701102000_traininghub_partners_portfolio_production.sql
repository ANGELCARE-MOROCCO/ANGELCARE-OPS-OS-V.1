create table if not exists public.traininghub_internal_actions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  entity_id uuid,
  organization_id uuid,
  status text not null default 'open',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  event_type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_traininghub_internal_actions_partners
on public.traininghub_internal_actions(module, organization_id, status, created_at desc);

create index if not exists idx_partner_activity_events_partners
on public.partner_activity_events(organization_id, created_at desc);

alter table public.traininghub_internal_actions enable row level security;
alter table public.partner_activity_events enable row level security;
