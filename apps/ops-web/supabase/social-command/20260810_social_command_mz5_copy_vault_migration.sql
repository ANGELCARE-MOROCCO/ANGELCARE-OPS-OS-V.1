-- ANGELCARE SOCIAL COMMAND MZ5 · COPY VAULT & GOVERNED MESSAGING LIBRARY
-- Additive migration. No existing Social Command tables are dropped or rewritten.
begin;
create extension if not exists pgcrypto;

create table if not exists public.social_command_copy_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.social_command_copy_categories(id) on delete set null,
  description text not null default '',
  status text not null default 'active' check(status in ('active','archived')),
  sort_order integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_command_copy_category_sibling_slug_idx
  on public.social_command_copy_categories(coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),slug)
  where status='active';
create index if not exists social_command_copy_category_parent_idx on public.social_command_copy_categories(parent_id,status,sort_order,name);

create table if not exists public.social_command_copy_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  copy_type text not null check(copy_type in (
    'post_caption','opening_hook','cta','promotional_message','service_description','offer_text','hashtag_pack',
    'story_text','reel_caption','carousel_intro','carousel_closing','b2b_message','faq_answer','comment_reply',
    'dm_reply','complaint_response','lead_response','disclaimer','terms_block','location_block','contact_block',
    'seasonal_message','brand_signature'
  )),
  business_unit text not null default '',
  campaign_id uuid references public.social_command_campaigns(id) on delete set null,
  owner_user_id text,
  lifecycle_status text not null default 'active' check(lifecycle_status in ('active','archived')),
  current_version_no integer not null default 1 check(current_version_no >= 1),
  approved_version_no integer check(approved_version_no is null or approved_version_no >= 1),
  usage_count bigint not null default 0,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now()
);
create index if not exists social_command_copy_items_work_idx on public.social_command_copy_items(lifecycle_status,copy_type,updated_at desc);
create index if not exists social_command_copy_items_campaign_idx on public.social_command_copy_items(campaign_id,lifecycle_status);

create table if not exists public.social_command_copy_versions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.social_command_copy_items(id) on delete cascade,
  version_no integer not null check(version_no >= 1),
  status text not null default 'draft' check(status in ('draft','in_review','approved','rejected','archived','expired')),
  body text not null,
  short_version text not null default '',
  cta text not null default '',
  hashtags text[] not null default '{}',
  tags text[] not null default '{}',
  channels text[] not null default '{}' check(channels <@ array['facebook','instagram']::text[]),
  formats text[] not null default '{}' check(formats <@ array['post','story','reel','carousel']::text[]),
  language text not null default 'fr',
  country text not null default 'Morocco',
  city text not null default '',
  tone text not null default '',
  purpose text not null default '',
  audience text not null default '',
  collection_name text not null default '',
  valid_from timestamptz,
  valid_until timestamptz,
  approval_policy text not null default 'standard' check(approval_policy in ('standard','marketing','brand','director')),
  change_summary text not null default '',
  body_fingerprint text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  decision_note text,
  check(valid_until is null or valid_from is null or valid_until >= valid_from),
  unique(item_id,version_no)
);
create index if not exists social_command_copy_versions_status_idx on public.social_command_copy_versions(status,created_at desc);
create index if not exists social_command_copy_versions_fingerprint_idx on public.social_command_copy_versions(body_fingerprint);
create index if not exists social_command_copy_versions_context_idx on public.social_command_copy_versions(language,city,tone,purpose);
create index if not exists social_command_copy_versions_tags_gin_idx on public.social_command_copy_versions using gin(tags);
create index if not exists social_command_copy_versions_hashtags_gin_idx on public.social_command_copy_versions using gin(hashtags);
create index if not exists social_command_copy_versions_channels_gin_idx on public.social_command_copy_versions using gin(channels);
create index if not exists social_command_copy_versions_formats_gin_idx on public.social_command_copy_versions using gin(formats);

create table if not exists public.social_command_copy_category_links (
  item_id uuid not null references public.social_command_copy_items(id) on delete cascade,
  category_id uuid not null references public.social_command_copy_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(item_id,category_id)
);
create index if not exists social_command_copy_category_links_category_idx on public.social_command_copy_category_links(category_id,item_id);

create table if not exists public.social_command_copy_approval_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.social_command_copy_items(id) on delete cascade,
  version_no integer not null,
  action text not null check(action in ('submitted','approved','rejected','archived','restored')),
  stage text not null default 'standard',
  note text not null default '',
  actor_user_id text,
  actor_role text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists social_command_copy_approval_item_idx on public.social_command_copy_approval_events(item_id,version_no,created_at desc);

create table if not exists public.social_command_copy_usage_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.social_command_copy_items(id) on delete cascade,
  version_no integer not null check(version_no >= 1),
  surface text not null,
  publication_id uuid references public.social_command_publications(id) on delete set null,
  bulk_plan_id uuid references public.social_command_bulk_plans(id) on delete set null,
  actor_user_id text,
  content_snapshot text not null default '',
  customized boolean not null default false,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key(item_id,version_no) references public.social_command_copy_versions(item_id,version_no) on delete cascade
);
create index if not exists social_command_copy_usage_item_idx on public.social_command_copy_usage_events(item_id,created_at desc);
create index if not exists social_command_copy_usage_publication_idx on public.social_command_copy_usage_events(publication_id) where publication_id is not null;

create table if not exists public.social_command_copy_import_jobs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  status text not null check(status in ('processing','completed','completed_with_errors','failed')),
  row_count integer not null default 0,
  valid_count integer not null default 0,
  imported_count integer not null default 0,
  error_count integer not null default 0,
  duplicate_count integer not null default 0,
  skipped_duplicate_count integer not null default 0,
  mapping jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists social_command_copy_import_jobs_idx on public.social_command_copy_import_jobs(created_at desc,status);

create table if not exists public.social_command_copy_import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.social_command_copy_import_jobs(id) on delete cascade,
  row_no integer not null,
  status text not null check(status in ('imported','failed','skipped_duplicate')),
  error_messages text[] not null default '{}',
  raw jsonb not null default '{}'::jsonb,
  item_id uuid references public.social_command_copy_items(id) on delete set null,
  version_no integer,
  created_at timestamptz not null default now(),
  unique(job_id,row_no)
);

create or replace function public.social_command_copy_usage_rollup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_command_copy_items
     set usage_count = usage_count + 1,
         last_used_at = greatest(coalesce(last_used_at, new.created_at), new.created_at),
         updated_at = greatest(updated_at, new.created_at)
   where id = new.item_id;
  return new;
end;
$$;

drop trigger if exists social_command_copy_usage_rollup_trg on public.social_command_copy_usage_events;
create trigger social_command_copy_usage_rollup_trg
after insert on public.social_command_copy_usage_events
for each row execute function public.social_command_copy_usage_rollup();

-- Service-only boundary, consistent with Social Command MZ1/MZ2.
do $$ declare t text; begin
  foreach t in array array[
    'social_command_copy_categories','social_command_copy_items','social_command_copy_versions',
    'social_command_copy_category_links','social_command_copy_approval_events','social_command_copy_usage_events',
    'social_command_copy_import_jobs','social_command_copy_import_rows'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
  end loop;
end $$;

commit;
