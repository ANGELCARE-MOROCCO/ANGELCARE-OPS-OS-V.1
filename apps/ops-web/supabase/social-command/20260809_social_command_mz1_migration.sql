-- ANGELCARE SOCIAL COMMAND MZ1 · SOVEREIGN CREATIVE/PUBLISHING CORE
-- Additive only. Media binaries are NOT stored in Supabase.
-- Short transaction by design.
begin;

create extension if not exists pgcrypto;

create table if not exists public.social_command_connections (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'connected' check (status in ('connected','disconnected','revoked','error')),
  facebook_page_id text,
  facebook_page_name text,
  instagram_business_id text,
  instagram_username text,
  granted_scopes text[] not null default '{}',
  encrypted_user_token text,
  encrypted_page_token text,
  token_expires_at timestamptz,
  last_verified_at timestamptz,
  last_refresh_at timestamptz,
  connection_health text not null default 'unknown' check (connection_health in ('healthy','warning','unhealthy','disconnected','unknown')),
  meta_json jsonb not null default '{}'::jsonb,
  connected_by text,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_command_one_connected_meta_idx on public.social_command_connections ((status)) where status='connected';

create table if not exists public.social_command_channel_capabilities (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.social_command_connections(id) on delete cascade,
  channel text not null check(channel in ('facebook','instagram')),
  capability text not null,
  supported boolean not null default false,
  source text not null default 'provider',
  reason text,
  checked_at timestamptz not null default now(),
  unique(connection_id,channel,capability)
);

create table if not exists public.social_command_oauth_sessions (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  actor_user_id text not null,
  encrypted_user_token text,
  token_expires_in integer,
  status text not null default 'initiated' check(status in ('initiated','authorized','completed','expired','failed')),
  expires_at timestamptz not null,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_command_oauth_expiry_idx on public.social_command_oauth_sessions(expires_at,status);

create table if not exists public.social_command_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  objective text,
  status text not null default 'active' check(status in ('draft','active','paused','completed','archived')),
  start_at timestamptz,
  end_at timestamptz,
  owner_user_id text,
  channels text[] not null default '{}',
  internal_tags text[] not null default '{}',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_command_campaign_window_idx on public.social_command_campaigns(start_at,end_at,status);

create table if not exists public.social_command_media_assets (
  id uuid primary key,
  status text not null default 'queued' check(status in ('queued','uploading','stored','inspecting','ready','failed','archived','deleted')),
  storage_provider text not null default 'windows_node',
  storage_key text,
  original_filename text not null,
  safe_filename text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check(size_bytes >= 0),
  width integer,
  height integer,
  duration_seconds numeric,
  sha256_hash text,
  thumbnail_key text,
  campaign_id uuid references public.social_command_campaigns(id) on delete set null,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  usage_count integer not null default 0 check(usage_count >= 0),
  created_by text,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists social_command_media_status_created_idx on public.social_command_media_assets(status,created_at desc);
create index if not exists social_command_media_campaign_idx on public.social_command_media_assets(campaign_id);
create index if not exists social_command_media_sha_idx on public.social_command_media_assets(sha256_hash) where sha256_hash is not null;

create table if not exists public.social_command_media_tags (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  normalized_label text not null unique,
  created_by text,
  created_at timestamptz not null default now()
);
create table if not exists public.social_command_media_asset_tags (
  asset_id uuid not null references public.social_command_media_assets(id) on delete cascade,
  tag_id uuid not null references public.social_command_media_tags(id) on delete cascade,
  primary key(asset_id,tag_id)
);
create table if not exists public.social_command_media_usage (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.social_command_media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  usage_role text not null default 'media',
  created_at timestamptz not null default now()
);
create index if not exists social_command_media_usage_asset_idx on public.social_command_media_usage(asset_id,created_at desc);

create table if not exists public.social_command_publications (
  id uuid primary key,
  title text not null,
  format text not null check(format in ('post','story','reel','carousel')),
  status text not null default 'draft' check(status in ('draft','ready','scheduled','queued','preparing','publishing','confirming','published','paused','failed','cancelled','archived')),
  channels text[] not null default '{}',
  caption text not null default '',
  hashtags text[] not null default '{}',
  campaign_id uuid references public.social_command_campaigns(id) on delete set null,
  owner_user_id text,
  scheduled_at timestamptz,
  published_at timestamptz,
  platform_variants jsonb not null default '{}'::jsonb,
  internal_tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_command_publication_schedule_idx on public.social_command_publications(status,scheduled_at);
create index if not exists social_command_publication_campaign_idx on public.social_command_publications(campaign_id,created_at desc);

create table if not exists public.social_command_publication_variants (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.social_command_publications(id) on delete cascade,
  channel text not null check(channel in ('facebook','instagram')),
  caption text,
  hashtags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(publication_id,channel)
);
create table if not exists public.social_command_publication_media (
  publication_id uuid not null references public.social_command_publications(id) on delete cascade,
  asset_id uuid not null references public.social_command_media_assets(id) on delete restrict,
  sort_order integer not null default 0,
  primary key(publication_id,asset_id)
);
create index if not exists social_command_publication_media_order_idx on public.social_command_publication_media(publication_id,sort_order);

create or replace function public.social_command_refresh_media_usage_count() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    update public.social_command_media_assets set usage_count=usage_count+1 where id=new.asset_id;
    return new;
  elsif tg_op='DELETE' then
    update public.social_command_media_assets set usage_count=greatest(usage_count-1,0) where id=old.asset_id;
    return old;
  end if;
  return null;
end $$;
drop trigger if exists social_command_media_usage_insert on public.social_command_publication_media;
create trigger social_command_media_usage_insert after insert on public.social_command_publication_media for each row execute function public.social_command_refresh_media_usage_count();
drop trigger if exists social_command_media_usage_delete on public.social_command_publication_media;
create trigger social_command_media_usage_delete after delete on public.social_command_publication_media for each row execute function public.social_command_refresh_media_usage_count();

create table if not exists public.social_command_campaign_items (
  campaign_id uuid not null references public.social_command_campaigns(id) on delete cascade,
  publication_id uuid not null references public.social_command_publications(id) on delete cascade,
  sort_order integer not null default 0,
  primary key(campaign_id,publication_id)
);

create table if not exists public.social_command_schedules (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.social_command_publications(id) on delete cascade,
  scheduled_at timestamptz not null,
  timezone text not null default 'Africa/Casablanca',
  status text not null default 'active' check(status in ('active','paused','executed','cancelled')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_command_schedules_due_idx on public.social_command_schedules(status,scheduled_at);

create table if not exists public.social_command_execution_jobs (
  id uuid primary key,
  publication_id uuid not null references public.social_command_publications(id) on delete cascade,
  channel text not null check(channel in ('facebook','instagram')),
  status text not null default 'queued' check(status in ('queued','preparing','publishing','confirming','published','retrying','failed','cancelled')),
  due_at timestamptz not null,
  locked_at timestamptz,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  last_error text,
  provider_reference text,
  provider_state jsonb not null default '{}'::jsonb,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_command_job_idempotency_idx on public.social_command_execution_jobs(publication_id,channel) where status not in ('cancelled');
create index if not exists social_command_jobs_due_idx on public.social_command_execution_jobs(status,next_attempt_at,due_at);

create table if not exists public.social_command_execution_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.social_command_execution_jobs(id) on delete cascade,
  attempt_no integer not null,
  status text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  latency_ms integer,
  provider_reference text,
  error_message text,
  provider_state jsonb not null default '{}'::jsonb,
  unique(job_id,attempt_no)
);
create table if not exists public.social_command_provider_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.social_command_execution_jobs(id) on delete cascade,
  publication_id uuid not null references public.social_command_publications(id) on delete cascade,
  channel text not null,
  result_type text not null,
  provider_reference text,
  public_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.social_command_bulk_plans (
  id uuid primary key,
  title text not null,
  format text not null check(format in ('post','story','reel','carousel')),
  channels text[] not null default '{}',
  campaign_id uuid references public.social_command_campaigns(id) on delete set null,
  slot_count integer not null default 0,
  status text not null default 'draft' check(status in ('draft','validated','applied','cancelled')),
  configuration jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.social_command_bulk_slots (
  id uuid primary key,
  bulk_plan_id uuid not null references public.social_command_bulk_plans(id) on delete cascade,
  slot_no integer not null,
  format text not null,
  channels text[] not null default '{}',
  scheduled_at timestamptz not null,
  title text not null,
  caption text not null default '',
  hashtags text[] not null default '{}',
  asset_ids uuid[] not null default '{}',
  platform_variants jsonb not null default '{}'::jsonb,
  internal_tags text[] not null default '{}',
  status text not null default 'draft',
  publication_id uuid references public.social_command_publications(id) on delete set null,
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bulk_plan_id,slot_no)
);

create table if not exists public.social_command_action_operations (
  id uuid primary key,
  operation_key uuid not null unique,
  operation_type text not null,
  label text not null,
  status text not null default 'preparing' check(status in ('preparing','processing','waiting','completed','failed')),
  progress integer not null default 0 check(progress between 0 and 100),
  current_step text,
  total_items integer not null default 1,
  completed_items integer not null default 0,
  failed_items integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists social_command_operations_recent_idx on public.social_command_action_operations(created_at desc);

create table if not exists public.social_command_audit_events (
  id uuid primary key,
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_command_audit_recent_idx on public.social_command_audit_events(created_at desc);
create index if not exists social_command_audit_entity_idx on public.social_command_audit_events(entity_type,entity_id,created_at desc);

-- These records are accessed only through server-side authenticated Social Command APIs.
do $$
declare t text;
begin
  foreach t in array array[
    'social_command_connections','social_command_channel_capabilities','social_command_oauth_sessions',
    'social_command_media_assets','social_command_media_tags','social_command_media_asset_tags','social_command_media_usage',
    'social_command_campaigns','social_command_campaign_items','social_command_publications','social_command_publication_variants',
    'social_command_publication_media','social_command_schedules','social_command_execution_jobs','social_command_execution_attempts',
    'social_command_provider_results','social_command_bulk_plans','social_command_bulk_slots','social_command_action_operations','social_command_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

commit;

select 'SOCIAL_COMMAND_MZ1_DATABASE_APPLIED' as result;
