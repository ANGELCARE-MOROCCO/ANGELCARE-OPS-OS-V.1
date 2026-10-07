-- ANGELCARE MARKETPLACE — CMS STUDIO DRAFT PERSISTENCE HOTFIX
-- Root cause: PL/pgSQL local variable `block_key` collides with
-- angelcare_marketplace_cms_blocks.block_key inside SQL statements in
-- angelcare_marketplace_save_cms_draft(). PostgreSQL resolves this as an
-- ambiguous column/variable reference (SQLSTATE 42702) at runtime.
--
-- Scope:
--   1) Replace only angelcare_marketplace_save_cms_draft() with the same
--      business behavior, renaming local variables to v_block_key/v_parent_key.
--   2) Register source-owned `homepage_world` in the DB block library so the
--      database authority matches the already-fixed TypeScript/Studio registry.
--   3) Preserve service_role-only execution authority.
--   4) Reload PostgREST schema cache.
--
-- No table drop/create. No business-data rewrite. No published-content change.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '5min';

create or replace function public.angelcare_marketplace_save_cms_draft(
  p_page_id uuid,
  p_blocks jsonb,
  p_expected_version int,
  p_change_summary text,
  p_actor_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  p public.angelcare_marketplace_cms_pages;
  b jsonb;
  doc jsonb;
  rev public.angelcare_marketplace_cms_revisions;
  next_version int;
  v_parent_key text;
  v_block_key text;
  next_status text;
begin
  select *
    into p
    from public.angelcare_marketplace_cms_pages
   where id = p_page_id
   for update;

  if p.id is null then
    raise exception 'Page not found';
  end if;

  if p.current_version <> p_expected_version then
    raise exception 'CMS_VERSION_CONFLICT expected %, current %', p_expected_version, p.current_version
      using errcode='40001';
  end if;

  if jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Blocks must be an array';
  end if;

  if exists(
    select 1
      from jsonb_array_elements(p_blocks) x
     group by x->>'blockKey'
    having count(*) > 1
  ) then
    raise exception 'Duplicate block keys are forbidden';
  end if;

  for b in select value from jsonb_array_elements(p_blocks) loop
    v_block_key := nullif(b->>'blockKey','');
    v_parent_key := nullif(b->>'parentBlockKey','');

    if v_block_key is null then
      raise exception 'Every block requires a stable blockKey';
    end if;

    if v_parent_key = v_block_key then
      raise exception 'A block cannot contain itself: %', v_block_key;
    end if;

    if v_parent_key is not null and not exists(
      select 1
        from jsonb_array_elements(p_blocks) px
       where px->>'blockKey' = v_parent_key
    ) then
      raise exception 'Parent block not found: %', v_parent_key;
    end if;
  end loop;

  -- Detect parent cycles inside the submitted document.
  if exists(
    with recursive edges as (
      select
        x->>'blockKey' child,
        nullif(x->>'parentBlockKey','') parent
      from jsonb_array_elements(p_blocks) x
    ), walk(child,parent,path,cycle) as (
      select child,parent,array[child],false from edges
      union all
      select w.child,e.parent,w.path||e.child,e.child=any(w.path)
      from walk w
      join edges e on e.child=w.parent
      where w.parent is not null and not w.cycle
    )
    select 1 from walk where cycle limit 1
  ) then
    raise exception 'Block nesting cycle detected';
  end if;

  update public.angelcare_marketplace_cms_blocks
     set status='archived',
         updated_at=now(),
         updated_by=p_actor_id
   where page_id=p_page_id
     and status<>'archived'
     and block_key not in(
       select x->>'blockKey'
       from jsonb_array_elements(p_blocks) x
     );

  for b in select value from jsonb_array_elements(p_blocks) loop
    insert into public.angelcare_marketplace_cms_blocks(
      id,
      page_id,
      block_key,
      block_type,
      sort_order,
      status,
      content,
      settings,
      audience,
      territory_id,
      locale,
      updated_by,
      parent_block_key,
      slot_key,
      schema_version,
      updated_at
    ) values(
      coalesce(nullif(b->>'id','')::uuid,gen_random_uuid()),
      p_page_id,
      b->>'blockKey',
      b->>'blockType',
      coalesce((b->>'sortOrder')::int,0),
      coalesce(nullif(b->>'status',''),'active'),
      coalesce(b->'content','{}'::jsonb),
      coalesce(b->'settings','{}'::jsonb),
      case
        when b ? 'audience' then
          coalesce(
            array(
              select jsonb_array_elements_text(
                case
                  when jsonb_typeof(b->'audience')='array' then b->'audience'
                  else '[]'::jsonb
                end
              )
            ),
            '{}'::text[]
          )
        else
          coalesce(
            (
              select existing.audience
              from public.angelcare_marketplace_cms_blocks existing
              where existing.page_id=p_page_id
                and existing.block_key=b->>'blockKey'
            ),
            '{}'::text[]
          )
      end,
      p.territory_id,
      p.locale,
      p_actor_id,
      nullif(b->>'parentBlockKey',''),
      coalesce(nullif(b->>'slotKey',''),'default'),
      coalesce((b->>'schemaVersion')::int,1),
      now()
    )
    on conflict(page_id,block_key) do update set
      block_type=excluded.block_type,
      sort_order=excluded.sort_order,
      status=excluded.status,
      content=excluded.content,
      settings=excluded.settings,
      audience=excluded.audience,
      territory_id=excluded.territory_id,
      locale=excluded.locale,
      updated_by=excluded.updated_by,
      parent_block_key=excluded.parent_block_key,
      slot_key=excluded.slot_key,
      schema_version=excluded.schema_version,
      updated_at=now();
  end loop;

  next_version := p.current_version + 1;
  next_status := case when p.status='published' then 'draft' else p.status end;
  doc := public.angelcare_marketplace_cms_build_document(p_page_id);

  insert into public.angelcare_marketplace_cms_revisions(
    page_id,
    revision_number,
    state,
    schema_version,
    document,
    page_snapshot,
    checksum,
    change_summary,
    created_by
  ) values(
    p_page_id,
    next_version,
    'draft',
    2,
    doc,
    to_jsonb(p)||jsonb_build_object('status',next_status,'current_version',next_version),
    public.angelcare_marketplace_cms_document_checksum(doc),
    coalesce(nullif(p_change_summary,''),'Composition Experience enregistrée'),
    p_actor_id
  )
  returning * into rev;

  update public.angelcare_marketplace_cms_pages
     set current_version=next_version,
         draft_revision_id=rev.id,
         status=next_status,
         updated_by=p_actor_id,
         updated_at=now()
   where id=p_page_id
  returning * into p;

  insert into public.angelcare_marketplace_cms_page_versions(
    page_id,
    version_number,
    title,
    description,
    slug,
    status,
    snapshot,
    change_summary,
    created_by
  ) values(
    p_page_id,
    next_version,
    p.title,
    p.description,
    p.slug,
    p.status,
    jsonb_build_object('page',to_jsonb(p),'blocks',doc->'blocks'),
    coalesce(nullif(p_change_summary,''),'Composition Experience enregistrée'),
    p_actor_id
  )
  on conflict(page_id,version_number) do nothing;

  perform public.angelcare_marketplace_cms_refresh_dependencies(p_page_id,rev.id,doc);

  return jsonb_build_object(
    'page',to_jsonb(p),
    'revision',to_jsonb(rev),
    'blocks',doc->'blocks'
  );
end
$$;

-- Keep execution authority identical to the original Experience Core contract.
revoke all on function public.angelcare_marketplace_save_cms_draft(uuid,jsonb,int,text,uuid)
  from public,anon,authenticated;

grant execute on function public.angelcare_marketplace_save_cms_draft(uuid,jsonb,int,text,uuid)
  to service_role;

-- Complete dual registration for the source-owned homepage world persistence type.
insert into public.angelcare_marketplace_cms_block_library(
  block_type,
  name,
  description,
  schema_definition,
  allowed_audiences,
  rtl_ready,
  status
) values (
  'homepage_world',
  'Homepage World source-owned',
  'Monde homepage source-owned persisté comme autorité atomique unique.',
  '{"registry":"canonical","schemaVersion":2,"sourceOwned":true,"surface":"homepage"}'::jsonb,
  '{public}'::text[],
  true,
  'active'
)
on conflict(block_type) do update set
  name=excluded.name,
  description=excluded.description,
  schema_definition=excluded.schema_definition,
  allowed_audiences=excluded.allowed_audiences,
  rtl_ready=excluded.rtl_ready,
  status='active',
  updated_at=now();

notify pgrst, 'reload schema';

commit;

-- ---------------------------------------------------------------------------
-- Certification: these SELECTs are read-only and print the post-fix truth.
-- ---------------------------------------------------------------------------

select
  case
    when position('v_block_key text' in pg_get_functiondef(
      'public.angelcare_marketplace_save_cms_draft(uuid,jsonb,integer,text,uuid)'::regprocedure
    )) > 0
    and position('v_parent_key text' in pg_get_functiondef(
      'public.angelcare_marketplace_save_cms_draft(uuid,jsonb,integer,text,uuid)'::regprocedure
    )) > 0
    then 'PASS'
    else 'FAIL'
  end as cms_draft_variable_ambiguity_fixed;

select
  block_type,
  status,
  rtl_ready,
  schema_definition
from public.angelcare_marketplace_cms_block_library
where block_type='homepage_world';

select
  has_function_privilege(
    'service_role',
    'public.angelcare_marketplace_save_cms_draft(uuid,jsonb,integer,text,uuid)',
    'EXECUTE'
  ) as service_role_execute;
