create table if not exists public.traininghub_internal_actions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  entity_id uuid,
  organization_id uuid,
  status text not null default 'recorded',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  requester_user_id uuid,
  assigned_user_id uuid,
  request_type text not null default 'support_issue',
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'normal',
  due_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  document_type text not null,
  title text not null,
  status text not null default 'available',
  file_url text,
  related_entity_type text,
  related_entity_id uuid,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid,
  title text not null,
  body text,
  status text not null default 'unread',
  notification_type text not null default 'info',
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
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

create index if not exists idx_traininghub_internal_actions_module on public.traininghub_internal_actions(module, created_at desc);
create index if not exists idx_partner_requests_org_status on public.partner_requests(organization_id, status);
create index if not exists idx_partner_documents_org_type on public.partner_documents(organization_id, document_type);
create index if not exists idx_partner_notifications_org_status on public.partner_notifications(organization_id, status);
create index if not exists idx_partner_activity_events_org on public.partner_activity_events(organization_id, created_at desc);

alter table public.traininghub_internal_actions enable row level security;
alter table public.partner_requests enable row level security;
alter table public.partner_documents enable row level security;
alter table public.partner_notifications enable row level security;
alter table public.partner_activity_events enable row level security;
