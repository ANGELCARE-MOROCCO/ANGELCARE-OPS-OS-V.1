-- ANGELCARE MARKETPLACE — EXPERIENCE CORE ZERO-DOWNGRADE HARDENING
-- Forward-only. No DROP/TRUNCATE. Existing CMS/page/block authorities remain compatible.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '15min';

create extension if not exists pgcrypto;

alter table public.angelcare_marketplace_cms_pages
  add column if not exists publication_state text not null default 'never_published',
  add column if not exists draft_revision_id uuid,
  add column if not exists published_revision_id uuid,
  add column if not exists published_slug text,
  add column if not exists published_locale text,
  add column if not exists published_territory_id uuid,
  add column if not exists source_template_id uuid,
  add column if not exists source_template_revision_id uuid;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname='angelcare_marketplace_cms_pages_publication_state_check'
  ) then
    alter table public.angelcare_marketplace_cms_pages
      add constraint angelcare_marketplace_cms_pages_publication_state_check
      check(publication_state in('never_published','published','unpublished'));
  end if;
end $$;

update public.angelcare_marketplace_cms_pages
set publication_state = case
  when status='published' then 'published'
  when status in('retired','archived') and published_version is not null then 'unpublished'
  when published_version is not null then 'published'
  else 'never_published'
end
where publication_state='never_published';

alter table public.angelcare_marketplace_cms_blocks
  add column if not exists parent_block_key text,
  add column if not exists slot_key text not null default 'default',
  add column if not exists schema_version int not null default 1;

create index if not exists ac_cms_blocks_parent_idx
  on public.angelcare_marketplace_cms_blocks(page_id,parent_block_key,slot_key,sort_order)
  where status<>'archived';

create table if not exists public.angelcare_marketplace_cms_revisions(
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.angelcare_marketplace_cms_pages(id) on delete cascade,
  revision_number int not null,
  state text not null default 'draft' check(state in('draft','published','archived')),
  schema_version int not null default 2,
  document jsonb not null default '{"schemaVersion":2,"blocks":[]}'::jsonb,
  page_snapshot jsonb not null default '{}'::jsonb,
  dependency_manifest jsonb not null default '{}'::jsonb,
  checksum text not null,
  change_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(page_id,revision_number)
);

create index if not exists ac_cms_revisions_page_created_idx
  on public.angelcare_marketplace_cms_revisions(page_id,created_at desc);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='angelcare_marketplace_cms_pages_draft_revision_fk') then
    alter table public.angelcare_marketplace_cms_pages add constraint angelcare_marketplace_cms_pages_draft_revision_fk
      foreign key(draft_revision_id) references public.angelcare_marketplace_cms_revisions(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='angelcare_marketplace_cms_pages_published_revision_fk') then
    alter table public.angelcare_marketplace_cms_pages add constraint angelcare_marketplace_cms_pages_published_revision_fk
      foreign key(published_revision_id) references public.angelcare_marketplace_cms_revisions(id) on delete set null;
  end if;
end $$;

alter table public.angelcare_marketplace_cms_preview_sessions
  add column if not exists revision_id uuid references public.angelcare_marketplace_cms_revisions(id) on delete cascade,
  add column if not exists token_hash text;

update public.angelcare_marketplace_cms_preview_sessions
set token_hash=encode(digest(preview_token,'sha256'),'hex')
where token_hash is null and preview_token is not null;
create unique index if not exists ac_cms_preview_token_hash_uq
  on public.angelcare_marketplace_cms_preview_sessions(token_hash)
  where token_hash is not null;
create index if not exists ac_cms_preview_active_idx
  on public.angelcare_marketplace_cms_preview_sessions(page_id,expires_at desc)
  where revoked_at is null;

alter table public.angelcare_marketplace_cms_publication_jobs
  add column if not exists revision_id uuid references public.angelcare_marketplace_cms_revisions(id) on delete set null,
  add column if not exists idempotency_key text,
  add column if not exists attempt_count int not null default 0,
  add column if not exists claimed_at timestamptz,
  add column if not exists claimed_by text,
  add column if not exists last_error text,
  add column if not exists executed_at timestamptz;
create unique index if not exists ac_cms_publication_job_idempotency_uq
  on public.angelcare_marketplace_cms_publication_jobs(idempotency_key)
  where idempotency_key is not null;
create index if not exists ac_cms_publication_due_idx
  on public.angelcare_marketplace_cms_publication_jobs(status,scheduled_at)
  where status in('queued','ready');

create table if not exists public.angelcare_marketplace_cms_dependency_edges(
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.angelcare_marketplace_cms_pages(id) on delete cascade,
  revision_id uuid not null references public.angelcare_marketplace_cms_revisions(id) on delete cascade,
  source_type text not null,
  source_key text not null,
  source_field text,
  relation_type text not null,
  target_type text not null,
  target_id uuid,
  target_key text,
  target_route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique nulls not distinct(revision_id,source_type,source_key,source_field,relation_type,target_type,target_id,target_key,target_route)
);
create index if not exists ac_cms_dependency_target_idx
  on public.angelcare_marketplace_cms_dependency_edges(target_type,target_id,target_key);
create index if not exists ac_cms_dependency_page_idx
  on public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id);

create table if not exists public.angelcare_marketplace_cms_templates(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('TPL-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  template_key text unique not null,
  name text not null,
  description text,
  category text not null default 'page',
  status text not null default 'draft' check(status in('draft','published','archived')),
  owner_id uuid,
  current_revision_id uuid,
  published_revision_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_cms_template_revisions(
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.angelcare_marketplace_cms_templates(id) on delete cascade,
  revision_number int not null,
  document jsonb not null,
  checksum text not null,
  change_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(template_id,revision_number)
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='ac_cms_templates_current_revision_fk') then
    alter table public.angelcare_marketplace_cms_templates add constraint ac_cms_templates_current_revision_fk foreign key(current_revision_id) references public.angelcare_marketplace_cms_template_revisions(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='ac_cms_templates_published_revision_fk') then
    alter table public.angelcare_marketplace_cms_templates add constraint ac_cms_templates_published_revision_fk foreign key(published_revision_id) references public.angelcare_marketplace_cms_template_revisions(id) on delete set null;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='ac_cms_pages_source_template_fk') then
    alter table public.angelcare_marketplace_cms_pages add constraint ac_cms_pages_source_template_fk foreign key(source_template_id) references public.angelcare_marketplace_cms_templates(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='ac_cms_pages_source_template_revision_fk') then
    alter table public.angelcare_marketplace_cms_pages add constraint ac_cms_pages_source_template_revision_fk foreign key(source_template_revision_id) references public.angelcare_marketplace_cms_template_revisions(id) on delete set null;
  end if;
end $$;

create table if not exists public.angelcare_marketplace_cms_symbols(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('SYM-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  symbol_key text unique not null,
  name text not null,
  description text,
  propagation_policy text not null default 'follow_published' check(propagation_policy in('follow_published','pinned')),
  status text not null default 'draft' check(status in('draft','published','archived')),
  owner_id uuid,
  current_revision_id uuid,
  published_revision_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_cms_symbol_revisions(
  id uuid primary key default gen_random_uuid(),
  symbol_id uuid not null references public.angelcare_marketplace_cms_symbols(id) on delete cascade,
  revision_number int not null,
  document jsonb not null,
  checksum text not null,
  change_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(symbol_id,revision_number)
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='ac_cms_symbols_current_revision_fk') then
    alter table public.angelcare_marketplace_cms_symbols add constraint ac_cms_symbols_current_revision_fk foreign key(current_revision_id) references public.angelcare_marketplace_cms_symbol_revisions(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='ac_cms_symbols_published_revision_fk') then
    alter table public.angelcare_marketplace_cms_symbols add constraint ac_cms_symbols_published_revision_fk foreign key(published_revision_id) references public.angelcare_marketplace_cms_symbol_revisions(id) on delete set null;
  end if;
end $$;

create table if not exists public.angelcare_marketplace_cms_custom_block_registrations(
  id uuid primary key default gen_random_uuid(),
  block_type text unique not null,
  display_name text not null,
  schema_version int not null default 1,
  manifest jsonb not null default '{}'::jsonb,
  contract_hash text not null,
  source_hash text not null,
  status text not null default 'proposed' check(status in('proposed','validated','registered','rejected','archived')),
  validation_evidence jsonb not null default '{}'::jsonb,
  proposed_by uuid,
  registered_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.angelcare_marketplace_cms_document_checksum(p_document jsonb)
returns text language sql immutable as $$
  select encode(digest(convert_to(coalesce(p_document,'{}'::jsonb)::text,'UTF8'),'sha256'),'hex')
$$;

create or replace function public.angelcare_marketplace_cms_build_document(p_page_id uuid)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'schemaVersion',2,
    'blocks',coalesce(jsonb_agg(to_jsonb(b) order by b.sort_order,b.created_at) filter(where b.id is not null),'[]'::jsonb)
  )
  from public.angelcare_marketplace_cms_blocks b
  where b.page_id=p_page_id and b.status<>'archived'
$$;

create or replace function public.angelcare_marketplace_cms_refresh_dependencies(p_page_id uuid,p_revision_id uuid,p_document jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare b jsonb; item jsonb; media_id uuid; target_id uuid; source_key text; parent_key text; v text;
begin
  delete from public.angelcare_marketplace_cms_dependency_edges where revision_id=p_revision_id;
  insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_id,metadata)
  select p.id,p_revision_id,'page',p.public_reference,'source_template_id','instantiated_from','template',p.source_template_id,jsonb_build_object('templateRevisionId',p.source_template_revision_id)
  from public.angelcare_marketplace_cms_pages p where p.id=p_page_id and p.source_template_id is not null
  on conflict do nothing;
  for b in select value from jsonb_array_elements(coalesce(p_document->'blocks','[]'::jsonb)) loop
    source_key:=coalesce(b->>'block_key','unknown'); parent_key:=nullif(b->>'parent_block_key','');
    if parent_key is not null then
      insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_key)
      values(p_page_id,p_revision_id,'block',source_key,'parent_block_key','nested_in','block',parent_key) on conflict do nothing;
    end if;
    v:=coalesce(b->'content'->>'mediaAssetId',b->'content'->>'media_asset_id');
    if v is not null and v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      media_id:=v::uuid;
      insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_id)
      values(p_page_id,p_revision_id,'block',source_key,'mediaAssetId','uses_asset','media_asset',media_id) on conflict do nothing;
      insert into public.angelcare_marketplace_media_usage(media_asset_id,object_type,object_id,slot_key,locale,territory_id)
      select media_id,'cms_page',p_page_id,source_key,p.locale,p.territory_id from public.angelcare_marketplace_cms_pages p where p.id=p_page_id
      on conflict do nothing;
    end if;
    for item in select value from jsonb_array_elements(case when jsonb_typeof(b->'content'->'items')='array' then b->'content'->'items' else '[]'::jsonb end) loop
      v:=coalesce(item->>'mediaAssetId',item->>'media_asset_id');
      if v is not null and v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        media_id:=v::uuid;
        insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_id)
        values(p_page_id,p_revision_id,'block',source_key,'items.mediaAssetId','uses_asset','media_asset',media_id) on conflict do nothing;
        insert into public.angelcare_marketplace_media_usage(media_asset_id,object_type,object_id,slot_key,locale,territory_id)
        select media_id,'cms_page',p_page_id,source_key||':item',p.locale,p.territory_id from public.angelcare_marketplace_cms_pages p where p.id=p_page_id
        on conflict do nothing;
      end if;
    end loop;
    foreach v in array array['pageTargetId','primaryPageId','secondaryPageId'] loop
      if (b->'content') ? v then
        begin target_id:=(b->'content'->>v)::uuid; exception when invalid_text_representation then target_id:=null; end;
        if target_id is not null then
          insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_id)
          values(p_page_id,p_revision_id,'block',source_key,v,'links_to','page',target_id) on conflict do nothing;
        end if;
      end if;
    end loop;
    foreach v in array array['primaryCtaHref','secondaryCtaHref','ctaHref','href'] loop
      if nullif(b->'content'->>v,'') is not null then
        insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_route)
        values(p_page_id,p_revision_id,'block',source_key,v,'links_to_route','route',b->'content'->>v) on conflict do nothing;
      end if;
    end loop;
    if nullif(b->'content'->>'categoryKey','') is not null then
      insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_key)
      values(p_page_id,p_revision_id,'block',source_key,'categoryKey','uses_entity','category',b->'content'->>'categoryKey') on conflict do nothing;
    end if;
    if nullif(b->'content'->>'collectionKey','') is not null then
      insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_key)
      values(p_page_id,p_revision_id,'block',source_key,'collectionKey','uses_entity','collection',b->'content'->>'collectionKey') on conflict do nothing;
    end if;
    if b->>'block_type'='symbol' and nullif(b->'content'->>'symbolId','') is not null then
      begin target_id:=(b->'content'->>'symbolId')::uuid; exception when invalid_text_representation then target_id:=null; end;
      if target_id is not null then
        insert into public.angelcare_marketplace_cms_dependency_edges(page_id,revision_id,source_type,source_key,source_field,relation_type,target_type,target_id)
        values(p_page_id,p_revision_id,'block',source_key,'symbolId','uses_symbol','symbol',target_id) on conflict do nothing;
      end if;
    end if;
  end loop;
  -- Rebuild the legacy Media Library usage projection from BOTH active draft and published revisions.
  -- This prevents a draft edit from making a still-live published asset appear unused.
  delete from public.angelcare_marketplace_media_usage where object_type='cms_page' and object_id=p_page_id;
  insert into public.angelcare_marketplace_media_usage(media_asset_id,object_type,object_id,slot_key,locale,territory_id)
  select distinct e.target_id,'cms_page',p_page_id,e.source_key,p.locale,p.territory_id
  from public.angelcare_marketplace_cms_dependency_edges e
  join public.angelcare_marketplace_cms_pages p on p.id=p_page_id
  where e.page_id=p_page_id and e.target_type='media_asset' and e.target_id is not null
    and e.revision_id in (p.draft_revision_id,p.published_revision_id)
  on conflict do nothing;
end $$;

-- Import every existing durable page snapshot into the new revision authority first.
insert into public.angelcare_marketplace_cms_revisions(page_id,revision_number,state,schema_version,document,page_snapshot,checksum,change_summary,created_by,created_at)
select v.page_id,v.version_number,
  case when p.published_version=v.version_number then 'published' else 'draft' end,
  2,
  case when jsonb_typeof(v.snapshot->'blocks')='array' then jsonb_build_object('schemaVersion',2,'blocks',v.snapshot->'blocks') else '{"schemaVersion":2,"blocks":[]}'::jsonb end,
  coalesce(v.snapshot->'page','{}'::jsonb),
  public.angelcare_marketplace_cms_document_checksum(case when jsonb_typeof(v.snapshot->'blocks')='array' then jsonb_build_object('schemaVersion',2,'blocks',v.snapshot->'blocks') else '{"schemaVersion":2,"blocks":[]}'::jsonb end),
  v.change_summary,v.created_by,v.created_at
from public.angelcare_marketplace_cms_page_versions v
join public.angelcare_marketplace_cms_pages p on p.id=v.page_id
on conflict(page_id,revision_number) do nothing;

-- Preserve historical published pointers for non-live pages where a historical snapshot exists.
update public.angelcare_marketplace_cms_pages p
set published_revision_id=r.id
from public.angelcare_marketplace_cms_revisions r
where r.page_id=p.id and r.revision_number=p.published_version and p.published_revision_id is null;

-- Zero-downgrade migration baseline: capture the EXACT mutable composition and metadata that exist now.
-- Published pages currently render those mutable rows, so their current visible state becomes the first isolated published revision.
do $$
declare p record; doc jsonb; rev_id uuid; next_version int; snapshot jsonb;
begin
  for p in select * from public.angelcare_marketplace_cms_pages order by id for update loop
    doc:=public.angelcare_marketplace_cms_build_document(p.id);
    select greatest(p.current_version,coalesce(max(r.revision_number),0))+1 into next_version
      from public.angelcare_marketplace_cms_revisions r where r.page_id=p.id;
    snapshot:=to_jsonb(p)||jsonb_build_object('current_version',next_version);
    insert into public.angelcare_marketplace_cms_revisions(page_id,revision_number,state,schema_version,document,page_snapshot,checksum,change_summary,created_by)
    values(p.id,next_version,case when p.status='published' then 'published' else 'draft' end,2,doc,snapshot,public.angelcare_marketplace_cms_document_checksum(doc),'Migration zéro-downgrade · baseline exact de l’état courant',p.updated_by)
    returning id into rev_id;

    update public.angelcare_marketplace_cms_pages set
      current_version=next_version,
      draft_revision_id=rev_id,
      publication_state=case when p.status='published' then 'published' when p.published_version is not null then 'unpublished' else 'never_published' end,
      published_revision_id=case when p.status='published' then rev_id else published_revision_id end,
      published_version=case when p.status='published' then next_version else published_version end,
      published_slug=case when p.status='published' then p.slug else published_slug end,
      published_locale=case when p.status='published' then p.locale else published_locale end,
      published_territory_id=case when p.status='published' then p.territory_id else published_territory_id end
    where id=p.id;

    insert into public.angelcare_marketplace_cms_page_versions(page_id,version_number,title,description,slug,status,snapshot,change_summary,created_by)
    values(p.id,next_version,p.title,p.description,p.slug,p.status,jsonb_build_object('page',snapshot,'blocks',doc->'blocks'),'Migration zéro-downgrade · baseline exact de l’état courant',p.updated_by)
    on conflict(page_id,version_number) do nothing;
  end loop;
end $$;

create unique index if not exists ac_cms_pages_published_route_uq
  on public.angelcare_marketplace_cms_pages(published_locale,published_slug,published_territory_id) nulls not distinct
  where publication_state='published';

update public.angelcare_marketplace_cms_preview_sessions s
set revision_id=p.draft_revision_id
from public.angelcare_marketplace_cms_pages p
where p.id=s.page_id and s.revision_id is null;

create or replace function public.angelcare_marketplace_save_cms_draft(
  p_page_id uuid,p_blocks jsonb,p_expected_version int,p_change_summary text,p_actor_id uuid
) returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.angelcare_marketplace_cms_pages; b jsonb; doc jsonb; rev public.angelcare_marketplace_cms_revisions; next_version int; parent_key text; block_key text; next_status text;
begin
  select * into p from public.angelcare_marketplace_cms_pages where id=p_page_id for update;
  if p.id is null then raise exception 'Page not found'; end if;
  if p.current_version<>p_expected_version then raise exception 'CMS_VERSION_CONFLICT expected %, current %',p_expected_version,p.current_version using errcode='40001'; end if;
  if jsonb_typeof(p_blocks)<>'array' then raise exception 'Blocks must be an array'; end if;
  if exists(select 1 from jsonb_array_elements(p_blocks) x group by x->>'blockKey' having count(*)>1) then raise exception 'Duplicate block keys are forbidden'; end if;
  for b in select value from jsonb_array_elements(p_blocks) loop
    block_key:=nullif(b->>'blockKey',''); parent_key:=nullif(b->>'parentBlockKey','');
    if block_key is null then raise exception 'Every block requires a stable blockKey'; end if;
    if parent_key=block_key then raise exception 'A block cannot contain itself: %',block_key; end if;
    if parent_key is not null and not exists(select 1 from jsonb_array_elements(p_blocks) px where px->>'blockKey'=parent_key) then raise exception 'Parent block not found: %',parent_key; end if;
  end loop;
  -- Detect parent cycles inside the submitted document.
  if exists(
    with recursive edges as (
      select x->>'blockKey' child,nullif(x->>'parentBlockKey','') parent from jsonb_array_elements(p_blocks)x
    ), walk(child,parent,path,cycle) as (
      select child,parent,array[child],false from edges
      union all
      select w.child,e.parent,w.path||e.child,e.child=any(w.path)
      from walk w join edges e on e.child=w.parent where w.parent is not null and not w.cycle
    ) select 1 from walk where cycle limit 1
  ) then raise exception 'Block nesting cycle detected'; end if;

  update public.angelcare_marketplace_cms_blocks set status='archived',updated_at=now(),updated_by=p_actor_id
  where page_id=p_page_id and status<>'archived' and block_key not in(select x->>'blockKey' from jsonb_array_elements(p_blocks)x);

  for b in select value from jsonb_array_elements(p_blocks) loop
    insert into public.angelcare_marketplace_cms_blocks(
      id,page_id,block_key,block_type,sort_order,status,content,settings,audience,territory_id,locale,updated_by,parent_block_key,slot_key,schema_version,updated_at
    ) values(
      coalesce(nullif(b->>'id','')::uuid,gen_random_uuid()),p_page_id,b->>'blockKey',b->>'blockType',coalesce((b->>'sortOrder')::int,0),
      coalesce(nullif(b->>'status',''),'active'),coalesce(b->'content','{}'::jsonb),coalesce(b->'settings','{}'::jsonb),
      case when b ? 'audience' then coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(b->'audience')='array' then b->'audience' else '[]'::jsonb end)),'{}'::text[])
           else coalesce((select existing.audience from public.angelcare_marketplace_cms_blocks existing where existing.page_id=p_page_id and existing.block_key=b->>'blockKey'),'{}'::text[]) end,
      p.territory_id,p.locale,p_actor_id,
      nullif(b->>'parentBlockKey',''),coalesce(nullif(b->>'slotKey',''),'default'),coalesce((b->>'schemaVersion')::int,1),now()
    ) on conflict(page_id,block_key) do update set
      block_type=excluded.block_type,sort_order=excluded.sort_order,status=excluded.status,content=excluded.content,settings=excluded.settings,audience=excluded.audience,
      territory_id=excluded.territory_id,locale=excluded.locale,updated_by=excluded.updated_by,parent_block_key=excluded.parent_block_key,
      slot_key=excluded.slot_key,schema_version=excluded.schema_version,updated_at=now();
  end loop;

  next_version:=p.current_version+1;
  next_status:=case when p.status='published' then 'draft' else p.status end;
  doc:=public.angelcare_marketplace_cms_build_document(p_page_id);
  insert into public.angelcare_marketplace_cms_revisions(page_id,revision_number,state,schema_version,document,page_snapshot,checksum,change_summary,created_by)
  values(p_page_id,next_version,'draft',2,doc,to_jsonb(p)||jsonb_build_object('status',next_status,'current_version',next_version),public.angelcare_marketplace_cms_document_checksum(doc),coalesce(nullif(p_change_summary,''),'Composition Experience enregistrée'),p_actor_id)
  returning * into rev;
  update public.angelcare_marketplace_cms_pages set current_version=next_version,draft_revision_id=rev.id,status=next_status,updated_by=p_actor_id,updated_at=now() where id=p_page_id returning * into p;
  insert into public.angelcare_marketplace_cms_page_versions(page_id,version_number,title,description,slug,status,snapshot,change_summary,created_by)
  values(p_page_id,next_version,p.title,p.description,p.slug,p.status,jsonb_build_object('page',to_jsonb(p),'blocks',doc->'blocks'),coalesce(nullif(p_change_summary,''),'Composition Experience enregistrée'),p_actor_id)
  on conflict(page_id,version_number) do nothing;
  perform public.angelcare_marketplace_cms_refresh_dependencies(p_page_id,rev.id,doc);
  return jsonb_build_object('page',to_jsonb(p),'revision',to_jsonb(rev),'blocks',doc->'blocks');
end $$;

create or replace function public.angelcare_marketplace_save_cms_metadata(
  p_page_id uuid,p_patch jsonb,p_expected_version int,p_change_summary text,p_actor_id uuid
) returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.angelcare_marketplace_cms_pages; doc jsonb; rev public.angelcare_marketplace_cms_revisions; next_version int; next_status text;
begin
  select * into p from public.angelcare_marketplace_cms_pages where id=p_page_id for update;
  if p.id is null then raise exception 'Page not found'; end if;
  if p.current_version<>p_expected_version then raise exception 'CMS_VERSION_CONFLICT expected %, current %',p_expected_version,p.current_version using errcode='40001'; end if;
  update public.angelcare_marketplace_cms_pages set
    title=case when p_patch?'title' then coalesce(nullif(p_patch->>'title',''),title) else title end,
    navigation_label=case when p_patch?'navigation_label' then nullif(p_patch->>'navigation_label','') else navigation_label end,
    slug=case when p_patch?'slug' then coalesce(nullif(p_patch->>'slug',''),slug) else slug end,
    description=case when p_patch?'description' then nullif(p_patch->>'description','') else description end,
    seo_title=case when p_patch?'seo_title' then nullif(p_patch->>'seo_title','') else seo_title end,
    seo_description=case when p_patch?'seo_description' then nullif(p_patch->>'seo_description','') else seo_description end,
    canonical_url=case when p_patch?'canonical_url' then nullif(p_patch->>'canonical_url','') else canonical_url end,
    translation_status=case when p_patch?'translation_status' then p_patch->>'translation_status' else translation_status end,
    sensitive=case when p_patch?'sensitive' then coalesce((p_patch->>'sensitive')::boolean,false) else sensitive end,
    scheduled_at=case when p_patch?'scheduled_at' then nullif(p_patch->>'scheduled_at','')::timestamptz else scheduled_at end,
    updated_by=p_actor_id,updated_at=now()
  where id=p_page_id returning * into p;
  next_version:=p.current_version+1;
  next_status:=case when p.status='published' then 'draft' else p.status end;
  doc:=public.angelcare_marketplace_cms_build_document(p_page_id);
  insert into public.angelcare_marketplace_cms_revisions(page_id,revision_number,state,schema_version,document,page_snapshot,checksum,change_summary,created_by)
  values(p_page_id,next_version,'draft',2,doc,to_jsonb(p)||jsonb_build_object('status',next_status,'current_version',next_version),public.angelcare_marketplace_cms_document_checksum(doc),p_change_summary,p_actor_id)
  returning * into rev;
  update public.angelcare_marketplace_cms_pages set current_version=next_version,draft_revision_id=rev.id,status=next_status where id=p_page_id returning * into p;
  insert into public.angelcare_marketplace_cms_page_versions(page_id,version_number,title,description,slug,status,snapshot,change_summary,created_by)
  values(p_page_id,next_version,p.title,p.description,p.slug,p.status,jsonb_build_object('page',to_jsonb(p),'blocks',doc->'blocks'),p_change_summary,p_actor_id)
  on conflict(page_id,version_number) do nothing;
  perform public.angelcare_marketplace_cms_refresh_dependencies(p_page_id,rev.id,doc);
  return jsonb_build_object('page',to_jsonb(p),'revision',to_jsonb(rev));
end $$;

create or replace function public.angelcare_marketplace_transition_cms_page(p_page_id uuid,p_target_status text,p_reason text,p_actor_id uuid)
returns public.angelcare_marketplace_cms_pages language plpgsql security definer set search_path=public as $$
declare r public.angelcare_marketplace_cms_pages; current_status text; rev public.angelcare_marketplace_cms_revisions; job_status text;
begin
  select * into r from public.angelcare_marketplace_cms_pages where id=p_page_id for update;
  if r.id is null then raise exception 'Page not found'; end if;
  current_status:=r.status;
  if p_target_status='published' and current_status not in('approved','scheduled','retired') then raise exception 'Page is not publishable'; end if;
  if p_target_status='approved' and current_status not in('submitted','in_review','scheduled') then raise exception 'Page is not approvable'; end if;
  if p_target_status='scheduled' then
    if current_status<>'approved' then raise exception 'Only an approved page can be scheduled'; end if;
    if r.scheduled_at is null or r.scheduled_at<=now() then raise exception 'A future scheduled_at is required'; end if;
    if r.draft_revision_id is null then raise exception 'No draft revision is available'; end if;
    update public.angelcare_marketplace_cms_publication_jobs set status='cancelled',last_error='Superseded by a newer schedule'
      where page_id=p_page_id and action='publish' and status in('queued','ready','validating');
    insert into public.angelcare_marketplace_cms_publication_jobs(page_id,revision_id,action,status,scheduled_at,requested_by,approved_by,idempotency_key)
      values(p_page_id,r.draft_revision_id,'publish','queued',r.scheduled_at,p_actor_id,p_actor_id,'schedule:'||p_page_id::text||':'||r.draft_revision_id::text||':'||extract(epoch from r.scheduled_at)::bigint::text)
      on conflict(idempotency_key) where idempotency_key is not null do nothing;
  elsif p_target_status='published' then
    select * into rev from public.angelcare_marketplace_cms_revisions where id=r.draft_revision_id and page_id=p_page_id;
    if rev.id is null then raise exception 'No draft revision is available'; end if;
    update public.angelcare_marketplace_cms_publication_jobs set status='cancelled',last_error='Superseded by explicit publication'
      where page_id=p_page_id and action='publish' and status in('queued','ready','validating');
    update public.angelcare_marketplace_cms_pages set
      published_revision_id=rev.id,published_version=rev.revision_number,publication_state='published',published_at=now(),
      published_slug=coalesce(nullif(rev.page_snapshot->>'slug',''),slug),
      published_locale=coalesce(nullif(rev.page_snapshot->>'locale',''),locale),
      published_territory_id=case when nullif(rev.page_snapshot->>'territory_id','') is null then territory_id else (rev.page_snapshot->>'territory_id')::uuid end
    where id=p_page_id;
    update public.angelcare_marketplace_cms_revisions set state='published' where id=rev.id;
    insert into public.angelcare_marketplace_cms_publication_jobs(page_id,revision_id,action,status,scheduled_at,requested_by,approved_by,idempotency_key,executed_at,completed_at)
      values(p_page_id,rev.id,'publish','completed',now(),p_actor_id,p_actor_id,'publish:'||p_page_id::text||':'||rev.id::text,now(),now())
      on conflict(idempotency_key) where idempotency_key is not null do nothing;
  elsif p_target_status in('retired','archived') then
    update public.angelcare_marketplace_cms_pages set publication_state=case when published_revision_id is null then 'never_published' else 'unpublished' end where id=p_page_id;
    insert into public.angelcare_marketplace_cms_publication_jobs(page_id,revision_id,action,status,scheduled_at,requested_by,approved_by,idempotency_key,executed_at,completed_at)
      values(p_page_id,r.published_revision_id,'unpublish','completed',now(),p_actor_id,p_actor_id,'unpublish:'||p_page_id::text||':'||extract(epoch from now())::bigint::text,now(),now());
  elsif current_status='scheduled' and p_target_status='approved' then
    update public.angelcare_marketplace_cms_publication_jobs set status='cancelled',last_error='Schedule cancelled by operator'
      where page_id=p_page_id and action='publish' and status in('queued','ready','validating');
  end if;
  update public.angelcare_marketplace_cms_pages set status=p_target_status,updated_by=p_actor_id,updated_at=now() where id=p_page_id returning * into r;
  insert into public.angelcare_marketplace_cms_page_versions(page_id,version_number,title,description,slug,status,snapshot,change_summary,created_by)
  select r.id,r.current_version,r.title,r.description,r.slug,p_target_status,jsonb_build_object('page',to_jsonb(r),'blocks',coalesce(rv.document->'blocks','[]'::jsonb)),p_reason,p_actor_id
  from public.angelcare_marketplace_cms_revisions rv where rv.id=r.draft_revision_id
  on conflict(page_id,version_number) do nothing;
  return r;
end $$;

create or replace function public.angelcare_marketplace_claim_due_cms_publication_jobs(p_limit int,p_worker text)
returns setof public.angelcare_marketplace_cms_publication_jobs language plpgsql security definer set search_path=public as $$
begin
  return query
  with due as (
    select id from public.angelcare_marketplace_cms_publication_jobs
    where status in('queued','ready') and scheduled_at is not null and scheduled_at<=now()
    order by scheduled_at,created_at
    for update skip locked limit greatest(1,least(coalesce(p_limit,20),100))
  ), claimed as (
    update public.angelcare_marketplace_cms_publication_jobs j set status='validating',claimed_at=now(),claimed_by=p_worker,attempt_count=j.attempt_count+1,last_error=null
    from due where j.id=due.id returning j.*
  ) select * from claimed;
end $$;

create or replace function public.angelcare_marketplace_execute_cms_publication_job(p_job_id uuid,p_worker text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare j public.angelcare_marketplace_cms_publication_jobs; p public.angelcare_marketplace_cms_pages; r public.angelcare_marketplace_cms_revisions; failure text;
begin
  select * into j from public.angelcare_marketplace_cms_publication_jobs where id=p_job_id for update;
  if j.id is null then raise exception 'Publication job not found'; end if;
  if j.status='completed' then return jsonb_build_object('status','already_completed','job',to_jsonb(j)); end if;
  if j.status<>'validating' then raise exception 'Publication job is not claimed'; end if;
  if j.scheduled_at is null or j.scheduled_at>now() then raise exception 'Publication job is not due'; end if;
  select * into p from public.angelcare_marketplace_cms_pages where id=j.page_id for update;
  if p.id is null then failure:='Page not found';
  elsif p.status='archived' then failure:='Page archived';
  elsif j.action='publish' then
    select * into r from public.angelcare_marketplace_cms_revisions where id=j.revision_id and page_id=j.page_id;
    if r.id is null then failure:='Revision missing';
    elsif coalesce(nullif(r.page_snapshot->>'title',''),'')='' then failure:='Published revision title missing';
    elsif coalesce(nullif(r.page_snapshot->>'seo_title',''),'')='' then failure:='Published revision SEO title missing';
    elsif coalesce(nullif(r.page_snapshot->>'seo_description',''),'')='' then failure:='Published revision SEO description missing';
    elsif jsonb_array_length(coalesce(r.document->'blocks','[]'::jsonb))=0 then failure:='Published revision has no blocks';
    elsif coalesce(r.page_snapshot->>'locale','fr')<>'fr' and coalesce(r.page_snapshot->>'translation_status','draft')<>'approved' then failure:='Published revision translation not approved';
    end if;
  elsif j.action<>'unpublish' then failure:='Unsupported worker action';
  end if;

  if failure is not null then
    update public.angelcare_marketplace_cms_publication_jobs set status='blocked',blocker=failure,last_error=failure where id=j.id returning * into j;
    insert into public.angelcare_marketplace_audit_events(request_id,actor_id,actor_role,action,object_type,object_id,before_value,after_value,reason,result,severity,source)
    values('worker:'||j.id::text,j.requested_by,'system-worker','marketplace.cms.scheduled_'||j.action,'cms_publication_job',j.id::text,null,to_jsonb(j),failure,'failed','warning','experience-core-worker');
    return jsonb_build_object('status','blocked','job',to_jsonb(j),'error',failure);
  end if;

  if j.action='publish' then
    update public.angelcare_marketplace_cms_pages set
      published_revision_id=r.id,published_version=r.revision_number,publication_state='published',status='published',published_at=now(),updated_at=now(),
      published_slug=coalesce(nullif(r.page_snapshot->>'slug',''),slug),
      published_locale=coalesce(nullif(r.page_snapshot->>'locale',''),locale),
      published_territory_id=case when nullif(r.page_snapshot->>'territory_id','') is null then territory_id else (r.page_snapshot->>'territory_id')::uuid end
    where id=p.id returning * into p;
    update public.angelcare_marketplace_cms_revisions set state='published' where id=r.id;
  else
    update public.angelcare_marketplace_cms_pages set publication_state=case when published_revision_id is null then 'never_published' else 'unpublished' end,status='retired',updated_at=now() where id=p.id returning * into p;
  end if;
  update public.angelcare_marketplace_cms_publication_jobs set status='completed',executed_at=now(),completed_at=now(),claimed_by=p_worker,blocker=null,last_error=null where id=j.id returning * into j;
  insert into public.angelcare_marketplace_audit_events(request_id,actor_id,actor_role,action,object_type,object_id,before_value,after_value,reason,result,severity,source)
  values('worker:'||j.id::text,j.requested_by,'system-worker','marketplace.cms.scheduled_'||j.action,'cms_publication_job',j.id::text,null,jsonb_build_object('job',to_jsonb(j),'page',to_jsonb(p),'revision',case when r.id is null then null else to_jsonb(r) end),'Scheduled execution by '||p_worker,'success','info','experience-core-worker');
  return jsonb_build_object('status','completed','job',to_jsonb(j),'page',to_jsonb(p));
exception when others then
  failure:=sqlerrm;
  update public.angelcare_marketplace_cms_publication_jobs set status='failed',last_error=failure where id=p_job_id returning * into j;
  insert into public.angelcare_marketplace_audit_events(request_id,actor_id,actor_role,action,object_type,object_id,after_value,reason,result,severity,source)
  values('worker:'||p_job_id::text,j.requested_by,'system-worker','marketplace.cms.scheduled_execution_failed','cms_publication_job',p_job_id::text,to_jsonb(j),failure,'failed','critical','experience-core-worker');
  return jsonb_build_object('status','failed','job',to_jsonb(j),'error',failure);
end $$;

create or replace function public.angelcare_marketplace_rollback_cms_page(p_page_id uuid,p_version_number int,p_reason text,p_actor_id uuid)
returns public.angelcare_marketplace_cms_pages language plpgsql security definer set search_path=public as $$
declare source_rev public.angelcare_marketplace_cms_revisions; p public.angelcare_marketplace_cms_pages; b jsonb; new_rev public.angelcare_marketplace_cms_revisions; next_version int; doc jsonb;
begin
  select * into p from public.angelcare_marketplace_cms_pages where id=p_page_id for update;
  if p.id is null then raise exception 'Page not found'; end if;
  select * into source_rev from public.angelcare_marketplace_cms_revisions where page_id=p_page_id and revision_number=p_version_number;
  if source_rev.id is null then raise exception 'Revision not found'; end if;
  update public.angelcare_marketplace_cms_pages set
    route_key=coalesce(nullif(source_rev.page_snapshot->>'route_key',''),route_key),
    title=coalesce(nullif(source_rev.page_snapshot->>'title',''),title),
    navigation_label=case when source_rev.page_snapshot?'navigation_label' then nullif(source_rev.page_snapshot->>'navigation_label','') else navigation_label end,
    slug=coalesce(nullif(source_rev.page_snapshot->>'slug',''),slug),
    description=case when source_rev.page_snapshot?'description' then nullif(source_rev.page_snapshot->>'description','') else description end,
    seo_title=case when source_rev.page_snapshot?'seo_title' then nullif(source_rev.page_snapshot->>'seo_title','') else seo_title end,
    seo_description=case when source_rev.page_snapshot?'seo_description' then nullif(source_rev.page_snapshot->>'seo_description','') else seo_description end,
    canonical_url=case when source_rev.page_snapshot?'canonical_url' then nullif(source_rev.page_snapshot->>'canonical_url','') else canonical_url end,
    translation_status=case when source_rev.page_snapshot?'translation_status' then source_rev.page_snapshot->>'translation_status' else translation_status end,
    sensitive=case when source_rev.page_snapshot?'sensitive' then coalesce((source_rev.page_snapshot->>'sensitive')::boolean,sensitive) else sensitive end,
    scheduled_at=null,
    status='draft',updated_by=p_actor_id,updated_at=now()
  where id=p_page_id returning * into p;
  update public.angelcare_marketplace_cms_blocks set status='archived',updated_at=now(),updated_by=p_actor_id where page_id=p_page_id and status<>'archived';
  for b in select value from jsonb_array_elements(coalesce(source_rev.document->'blocks','[]'::jsonb)) loop
    insert into public.angelcare_marketplace_cms_blocks(id,page_id,block_key,block_type,sort_order,status,content,settings,audience,territory_id,locale,updated_by,parent_block_key,slot_key,schema_version,updated_at)
    values(gen_random_uuid(),p_page_id,b->>'block_key',b->>'block_type',coalesce((b->>'sort_order')::int,0),coalesce(b->>'status','active'),coalesce(b->'content','{}'::jsonb),coalesce(b->'settings','{}'::jsonb),coalesce(array(select jsonb_array_elements_text(coalesce(b->'audience','[]'::jsonb))),'{}'),p.territory_id,p.locale,p_actor_id,nullif(b->>'parent_block_key',''),coalesce(nullif(b->>'slot_key',''),'default'),coalesce((b->>'schema_version')::int,1),now())
    on conflict(page_id,block_key) do update set block_type=excluded.block_type,sort_order=excluded.sort_order,status=excluded.status,content=excluded.content,settings=excluded.settings,parent_block_key=excluded.parent_block_key,slot_key=excluded.slot_key,schema_version=excluded.schema_version,updated_by=p_actor_id,updated_at=now();
  end loop;
  next_version:=p.current_version+1;doc:=public.angelcare_marketplace_cms_build_document(p_page_id);
  insert into public.angelcare_marketplace_cms_revisions(page_id,revision_number,state,schema_version,document,page_snapshot,checksum,change_summary,created_by)
  values(p_page_id,next_version,'draft',2,doc,source_rev.page_snapshot,public.angelcare_marketplace_cms_document_checksum(doc),'Rollback depuis v'||p_version_number||' · '||p_reason,p_actor_id) returning * into new_rev;
  update public.angelcare_marketplace_cms_pages set current_version=next_version,draft_revision_id=new_rev.id,status='draft',updated_by=p_actor_id,updated_at=now() where id=p_page_id returning * into p;
  insert into public.angelcare_marketplace_cms_page_versions(page_id,version_number,title,description,slug,status,snapshot,change_summary,created_by)
  values(p_page_id,next_version,p.title,p.description,p.slug,p.status,jsonb_build_object('page',to_jsonb(p),'blocks',doc->'blocks'),'Rollback depuis v'||p_version_number||' · '||p_reason,p_actor_id)
  on conflict(page_id,version_number) do nothing;
  insert into public.angelcare_marketplace_cms_publication_jobs(page_id,revision_id,action,status,blocker,requested_by,executed_at,completed_at)
  values(p_page_id,new_rev.id,'rollback','completed',p_reason,p_actor_id,now(),now());
  perform public.angelcare_marketplace_cms_refresh_dependencies(p_page_id,new_rev.id,doc);
  return p;
end $$;

-- Canonical block-library parity: preserve all existing entries and add every runtime/editor type.
insert into public.angelcare_marketplace_cms_block_library(block_type,name,description,schema_definition,allowed_audiences,rtl_ready,status) values
('hero','Hero de conversion','Positionnement, promesse, média et actions.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('split_hero','Hero split','Hero éditorial image + copy + actions.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('video_hero','Hero vidéo','Hero premium avec média vidéo.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('audience_router','Routeur d’audiences','Orientation par audience.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('service_grid','Architecture de services','Présenter offres et services.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('product_grid','Grille produits','Sélection commerciale administrée.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('collection_rail','Collection commerciale','Rail de collection réel.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('category_grid','Grille catégories','Navigation par catégories.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('trust_strip','Bande de confiance','Engagements et preuves.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('proof_grid','Preuves et méthode','Preuves structurées.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('stats','Indicateurs prouvés','Métriques administrées avec source.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,b2b}',true,'active'),
('editorial','Narration éditoriale','Contenu long structuré.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family,b2b}',true,'active'),
('story','Story / cas','Récit structuré avec preuve.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('testimonials','Témoignages','Témoignages vérifiés.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('partner_logos','Partenaires / logos','Logos approuvés.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('comparison','Comparaison','Comparer offres ou options.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('pricing','Pricing','Présenter prix et packages réels.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('timeline','Parcours et étapes','Chronologie structurée.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('process','Process','Méthode ou processus.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('faq','Questions fréquentes','FAQ gouvernée.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('cta_band','Bande d’action','Conversion vers destination réelle.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('inquiry_form','Formulaire de contact','Inquiry publique persistante.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('marketplace_entry','Entrée Marketplace','Orientation catalogue.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('partner_os_entry','Entrée Partner OS','Orientation Partner OS.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,b2b}',true,'active'),
('academy_entry','Entrée Academy','Orientation Academy.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('family_story','Parcours famille','Parcours narratif.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public,family}',true,'active'),
('media_gallery','Galerie média','Médias administrés.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('video','Vidéo','Contenu vidéo.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('territory_map','Territoires','Présence géographique.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('quote','Citation','Citation éditoriale.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('download','Téléchargement','Ressource téléchargeable.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('contact','Contact','Bloc contact.','{"registry":"canonical","schemaVersion":2}'::jsonb,'{public}',true,'active'),
('section','Section','Région sémantique majeure.','{"registry":"canonical","schemaVersion":2,"structural":true}'::jsonb,'{public}',true,'active'),
('container','Container','Largeur et padding gouvernés.','{"registry":"canonical","schemaVersion":2,"structural":true}'::jsonb,'{public}',true,'active'),
('stack','Stack','Composition ordonnée verticale ou horizontale.','{"registry":"canonical","schemaVersion":2,"structural":true}'::jsonb,'{public}',true,'active'),
('columns','Columns','Colonnes responsives.','{"registry":"canonical","schemaVersion":2,"structural":true}'::jsonb,'{public}',true,'active'),
('grid','Grid','Grille responsive.','{"registry":"canonical","schemaVersion":2,"structural":true}'::jsonb,'{public}',true,'active'),
('symbol','Symbole global','Référence à un contenu global versionné.','{"registry":"canonical","schemaVersion":2,"symbol":true}'::jsonb,'{public}',true,'active')
on conflict(block_type) do update set name=excluded.name,description=excluded.description,schema_definition=excluded.schema_definition,rtl_ready=excluded.rtl_ready,status='active',updated_at=now();

alter table public.angelcare_marketplace_cms_revisions enable row level security;
alter table public.angelcare_marketplace_cms_dependency_edges enable row level security;
alter table public.angelcare_marketplace_cms_templates enable row level security;
alter table public.angelcare_marketplace_cms_template_revisions enable row level security;
alter table public.angelcare_marketplace_cms_symbols enable row level security;
alter table public.angelcare_marketplace_cms_symbol_revisions enable row level security;
alter table public.angelcare_marketplace_cms_custom_block_registrations enable row level security;

revoke all on table public.angelcare_marketplace_cms_revisions,public.angelcare_marketplace_cms_dependency_edges,public.angelcare_marketplace_cms_templates,public.angelcare_marketplace_cms_template_revisions,public.angelcare_marketplace_cms_symbols,public.angelcare_marketplace_cms_symbol_revisions,public.angelcare_marketplace_cms_custom_block_registrations from anon,authenticated;
grant all on table public.angelcare_marketplace_cms_revisions,public.angelcare_marketplace_cms_dependency_edges,public.angelcare_marketplace_cms_templates,public.angelcare_marketplace_cms_template_revisions,public.angelcare_marketplace_cms_symbols,public.angelcare_marketplace_cms_symbol_revisions,public.angelcare_marketplace_cms_custom_block_registrations to service_role;

revoke all on function
  public.angelcare_marketplace_cms_document_checksum(jsonb),
  public.angelcare_marketplace_cms_build_document(uuid),
  public.angelcare_marketplace_cms_refresh_dependencies(uuid,uuid,jsonb),
  public.angelcare_marketplace_save_cms_draft(uuid,jsonb,int,text,uuid),
  public.angelcare_marketplace_save_cms_metadata(uuid,jsonb,int,text,uuid),
  public.angelcare_marketplace_transition_cms_page(uuid,text,text,uuid),
  public.angelcare_marketplace_claim_due_cms_publication_jobs(int,text),
  public.angelcare_marketplace_execute_cms_publication_job(uuid,text),
  public.angelcare_marketplace_rollback_cms_page(uuid,int,text,uuid)
from public,anon,authenticated;
grant execute on function
  public.angelcare_marketplace_cms_document_checksum(jsonb),
  public.angelcare_marketplace_cms_build_document(uuid),
  public.angelcare_marketplace_cms_refresh_dependencies(uuid,uuid,jsonb),
  public.angelcare_marketplace_save_cms_draft(uuid,jsonb,int,text,uuid),
  public.angelcare_marketplace_save_cms_metadata(uuid,jsonb,int,text,uuid),
  public.angelcare_marketplace_transition_cms_page(uuid,text,text,uuid),
  public.angelcare_marketplace_claim_due_cms_publication_jobs(int,text),
  public.angelcare_marketplace_execute_cms_publication_job(uuid,text),
  public.angelcare_marketplace_rollback_cms_page(uuid,int,text,uuid)
to service_role;

-- Refresh dependency evidence for every migrated draft revision without changing published content.
do $$ declare r record; begin
  for r in select p.id page_id,p.draft_revision_id revision_id,v.document from public.angelcare_marketplace_cms_pages p join public.angelcare_marketplace_cms_revisions v on v.id=p.draft_revision_id loop
    perform public.angelcare_marketplace_cms_refresh_dependencies(r.page_id,r.revision_id,r.document);
  end loop;
end $$;

commit;
