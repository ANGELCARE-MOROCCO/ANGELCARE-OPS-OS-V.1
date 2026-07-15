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

create index if not exists idx_traininghub_internal_actions_command_center
on public.traininghub_internal_actions(module, status, created_at desc);

alter table public.traininghub_internal_actions enable row level security;
