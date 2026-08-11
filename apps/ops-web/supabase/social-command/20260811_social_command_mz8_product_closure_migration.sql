-- ANGELCARE SOCIAL COMMAND MZ8 · FINAL PRODUCT CLOSURE
-- Additive / compatibility migration. Introduces governed trash, permanent-delete tombstones,
-- real Media Vault taxonomy/collections and Copy Vault lifecycle closure.
begin;
create extension if not exists pgcrypto;

-- MEDIA VAULT · enrich canonical asset lifecycle without breaking existing provider status.
alter table public.social_command_media_assets add column if not exists title text not null default '';
alter table public.social_command_media_assets add column if not exists description text not null default '';
alter table public.social_command_media_assets add column if not exists lifecycle_status text not null default 'active';
alter table public.social_command_media_assets add column if not exists favorite boolean not null default false;
alter table public.social_command_media_assets add column if not exists updated_by text;
alter table public.social_command_media_assets add column if not exists updated_at timestamptz not null default now();

update public.social_command_media_assets
set title = coalesce(nullif(title,''), original_filename),
    lifecycle_status = case when status='deleted' then 'trashed' when status='archived' then 'archived' else coalesce(nullif(lifecycle_status,''),'active') end,
    updated_at = coalesce(updated_at,created_at,now())
where title='' or lifecycle_status is null or updated_at is null or status in ('deleted','archived');

alter table public.social_command_media_assets drop constraint if exists social_command_media_assets_lifecycle_status_check;
alter table public.social_command_media_assets add constraint social_command_media_assets_lifecycle_status_check check(lifecycle_status in ('active','archived','trashed'));
create index if not exists social_command_media_lifecycle_idx on public.social_command_media_assets(lifecycle_status,status,created_at desc);
create index if not exists social_command_media_favorite_idx on public.social_command_media_assets(favorite,created_at desc) where lifecycle_status='active';

create table if not exists public.social_command_media_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.social_command_media_categories(id) on delete set null,
  description text not null default '',
  status text not null default 'active' check(status in ('active','archived','trashed')),
  sort_order integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_command_media_category_sibling_slug_idx
  on public.social_command_media_categories(coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),slug)
  where status='active';
create index if not exists social_command_media_category_tree_idx on public.social_command_media_categories(parent_id,status,sort_order,name);

create table if not exists public.social_command_media_category_links (
  asset_id uuid not null references public.social_command_media_assets(id) on delete cascade,
  category_id uuid not null references public.social_command_media_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(asset_id,category_id)
);
create index if not exists social_command_media_category_links_category_idx on public.social_command_media_category_links(category_id,asset_id);

create table if not exists public.social_command_media_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'active' check(status in ('active','archived','trashed')),
  campaign_id uuid references public.social_command_campaigns(id) on delete set null,
  sort_order integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_command_media_collections_idx on public.social_command_media_collections(status,sort_order,name);
create index if not exists social_command_media_collections_campaign_idx on public.social_command_media_collections(campaign_id,status);

create table if not exists public.social_command_media_collection_items (
  collection_id uuid not null references public.social_command_media_collections(id) on delete cascade,
  asset_id uuid not null references public.social_command_media_assets(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key(collection_id,asset_id)
);
create index if not exists social_command_media_collection_items_asset_idx on public.social_command_media_collection_items(asset_id,collection_id);

create table if not exists public.social_command_media_tombstones (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  title text not null default '',
  original_filename text not null default '',
  mime_type text not null default '',
  size_bytes bigint not null default 0,
  sha256_hash text,
  storage_provider text not null default '',
  storage_key text,
  usage_count bigint not null default 0,
  publication_ids uuid[] not null default '{}',
  usage_snapshot jsonb not null default '[]'::jsonb,
  deleted_by text,
  deleted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create unique index if not exists social_command_media_tombstones_asset_unique_idx on public.social_command_media_tombstones(asset_id);
create index if not exists social_command_media_tombstones_asset_idx on public.social_command_media_tombstones(asset_id,deleted_at desc);

-- COPY VAULT · recoverable trash and explicit permanent deletion.
alter table public.social_command_copy_items drop constraint if exists social_command_copy_items_lifecycle_status_check;
alter table public.social_command_copy_items add constraint social_command_copy_items_lifecycle_status_check check(lifecycle_status in ('active','archived','trashed'));
alter table public.social_command_copy_categories drop constraint if exists social_command_copy_categories_status_check;
alter table public.social_command_copy_categories add constraint social_command_copy_categories_status_check check(status in ('active','archived','trashed'));
alter table public.social_command_copy_approval_events drop constraint if exists social_command_copy_approval_events_action_check;
alter table public.social_command_copy_approval_events add constraint social_command_copy_approval_events_action_check check(action in ('submitted','approved','rejected','archived','restored','trashed','purged'));

create table if not exists public.social_command_copy_tombstones (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  code text not null,
  title text not null,
  copy_type text not null,
  business_unit text not null default '',
  category_names text[] not null default '{}',
  version_count integer not null default 0,
  approved_version_no integer,
  body_fingerprints text[] not null default '{}',
  usage_count bigint not null default 0,
  usage_snapshot jsonb not null default '[]'::jsonb,
  deleted_by text,
  deleted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create unique index if not exists social_command_copy_tombstones_item_unique_idx on public.social_command_copy_tombstones(item_id);
create index if not exists social_command_copy_tombstones_item_idx on public.social_command_copy_tombstones(item_id,deleted_at desc);
create index if not exists social_command_copy_items_lifecycle_v2_idx on public.social_command_copy_items(lifecycle_status,updated_at desc);
create index if not exists social_command_copy_categories_status_v2_idx on public.social_command_copy_categories(status,parent_id,sort_order,name);

-- Service-only boundary matches the rest of Social Command.
do $$
declare t text;
begin
  foreach t in array array[
    'social_command_media_categories','social_command_media_category_links','social_command_media_collections',
    'social_command_media_collection_items','social_command_media_tombstones','social_command_copy_tombstones'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
  end loop;
end $$;

commit;
