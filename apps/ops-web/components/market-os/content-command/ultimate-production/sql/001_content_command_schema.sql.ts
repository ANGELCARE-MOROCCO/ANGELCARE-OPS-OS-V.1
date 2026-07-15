export const contentCommandSchemaSql = `
-- REVIEW BEFORE RUNNING
create table if not exists market_content_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft',
  owner_id uuid,
  campaign_id uuid,
  channel text,
  scheduled_date date,
  due_date date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_content_deliverables (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid,
  title text not null,
  status text not null default 'queued',
  readiness integer not null default 0,
  owner_id uuid,
  blocked_reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_content_approvals (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  target_id uuid not null,
  reviewer_id uuid,
  state text not null default 'review',
  comments jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_content_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  entity_table text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
`;