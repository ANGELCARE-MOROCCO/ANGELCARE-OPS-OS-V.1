-- Source-only migration. Installer never executes it. PostgreSQL / service-role APIs only.
begin;
create schema if not exists angelcare_private;
-- Complete data authority, not a browser slice. Each canonical offer is counted once.
create or replace function angelcare_private.population_items(p_territory uuid)
returns table(item jsonb) language sql stable security invoker set search_path=pg_catalog as $$
 select to_jsonb(s)||jsonb_build_object(
 'media',coalesce((select jsonb_agg(to_jsonb(m))from public.angelcare_marketplace_catalog_item_media m where m.catalog_item_id=s.id),'[]'::jsonb),
 'categories',coalesce((select jsonb_agg(to_jsonb(l))from public.angelcare_marketplace_catalog_item_categories l where l.catalog_item_id=s.id),'[]'::jsonb),
 'availability',coalesce((select jsonb_agg(to_jsonb(a))from public.angelcare_marketplace_catalog_availability a where a.catalog_item_id=s.id),'[]'::jsonb),
 'priceRules',coalesce((select jsonb_agg(to_jsonb(p))from public.angelcare_marketplace_finance_price_rules p where p.catalog_item_id=s.id),'[]'::jsonb))
 from public.angelcare_marketplace_catalog_items s
 where (p_territory is null or to_jsonb(s)->>'territory_id' is null or to_jsonb(s)->>'territory_id'=p_territory::text);
$$;
revoke all on function angelcare_private.population_items(uuid) from public,anon,authenticated;
create or replace function angelcare_private.population_categories(p_territory uuid,p_locale text)
returns table(category jsonb) language sql stable security invoker set search_path=pg_catalog as $$
 select to_jsonb(c) from public.angelcare_marketplace_catalog_categories c
 where c.locale=p_locale and c.status<>'archived' and (p_territory is null or to_jsonb(c)->>'territory_id' is null or to_jsonb(c)->>'territory_id'=p_territory::text);
$$;
revoke all on function angelcare_private.population_categories(uuid,text) from public,anon,authenticated;
create or replace function angelcare_private.population_array(v jsonb) returns jsonb language sql immutable set search_path=pg_catalog as $$ select case when jsonb_typeof(v)='array' then v else '[]'::jsonb end; $$;
revoke all on function angelcare_private.population_array(jsonb) from public,anon,authenticated;
create or replace function angelcare_private.population_has_primary(i jsonb)
returns boolean language sql immutable set search_path=pg_catalog as $$
 select exists(select 1 from jsonb_array_elements(case when jsonb_typeof(i->'media')='array' then i->'media' else '[]'::jsonb end)m where m->>'media_key'='primary' and coalesce(m->>'status','active')='active' and nullif(m->>'asset_url','') is not null);
$$;
create or replace function angelcare_private.population_locale_complete(i jsonb,l text)
returns boolean language sql immutable set search_path=pg_catalog as $$
 select nullif(btrim(i->>('name_'||l)),'') is not null and nullif(btrim(i->>('short_description_'||l)),'') is not null and nullif(btrim(i->>('description_'||l)),'') is not null and nullif(btrim(i->'seo_metadata'->>('title_'||l)),'') is not null and nullif(btrim(i->'seo_metadata'->>('description_'||l)),'') is not null;
$$;
revoke all on function angelcare_private.population_has_primary(jsonb),angelcare_private.population_locale_complete(jsonb,text) from public,anon,authenticated;
create or replace function public.angelcare_population_inventory(p_territory uuid default null)
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 with i as materialized(select item from angelcare_private.population_items(p_territory) where item->>'status'<>'archived'),
 totals as(select count(*) total,count(*) filter(where item->>'status'='published') published,count(*) filter(where item->>'status'='draft') draft,count(*) filter(where not angelcare_private.population_has_primary(item)) missing_media,count(*) filter(where jsonb_array_length(angelcare_private.population_array(item->'categories'))=0) missing_category,count(*) filter(where angelcare_private.population_locale_complete(item,'fr')) fr,count(*) filter(where angelcare_private.population_locale_complete(item,'en')) en,count(*) filter(where angelcare_private.population_locale_complete(item,'ar')) ar from i),
 schemas as(select coalesce(nullif(item->>'experience_schema_key',''),nullif(item->'commercial_metadata'->>'experience_schema_key',''),'unclassified') key,count(*) total,count(*) filter(where item->>'status'='published') published from i group by 1)
 select jsonb_build_object('generatedAt',now(),'total',t.total,'published',t.published,'draft',t.draft,'withoutMedia',t.missing_media,'withoutCategory',t.missing_category,'localeCounts',jsonb_build_object('fr',t.fr,'en',t.en,'ar',t.ar),'schemas',coalesce((select jsonb_agg(to_jsonb(s))from schemas s),'[]'::jsonb)) from totals t;
$$;
create or replace function public.angelcare_population_categories(p_territory uuid default null,p_locale text default 'fr',p_parent uuid default null,p_query text default '',p_page integer default 1,p_size integer default 60)
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 with recursive cats as materialized(select category c from angelcare_private.population_categories(p_territory,case when p_locale in ('en','ar') then p_locale else 'fr' end)),
 closure(root,id,path)as(select c->>'id',c->>'id',array[c->>'id'] from cats union all select x.root,c.c->>'id',x.path||(c.c->>'id') from closure x join cats c on c.c->>'parent_category_id'=x.id where not(c.c->>'id'=any(x.path))),
 i as materialized(select item from angelcare_private.population_items(p_territory) where item->>'status'<>'archived'),
 links as(select item,jsonb_array_elements(angelcare_private.population_array(item->'categories'))->>'category_id' category_id from i),
 stats as(select x.root,count(distinct l.item->>'id') total,count(distinct l.item->>'id') filter(where l.category_id=x.root) direct,count(distinct l.item->>'id') filter(where l.item->>'status'='published') published,count(distinct l.item->>'id') filter(where not angelcare_private.population_has_primary(l.item)) missing_media,count(distinct l.item->>'id') filter(where not angelcare_private.population_locale_complete(l.item,'en') or not angelcare_private.population_locale_complete(l.item,'ar')) missing_locales from closure x left join links l on l.category_id=x.id group by x.root),
 matched as(select c.c||jsonb_build_object('total',coalesce(s.total,0),'direct',coalesce(s.direct,0),'published',coalesce(s.published,0),'missing_media',coalesce(s.missing_media,0),'missing_locales',coalesce(s.missing_locales,0),'children', (select count(*)from cats child where child.c->>'parent_category_id'=c.c->>'id')) node from cats c left join stats s on s.root=c.c->>'id' where case when nullif(btrim(p_query),'')is not null then concat(c.c->>'title',' ',c.c->>'category_key')ilike '%'||p_query||'%' when p_parent is null then nullif(c.c->>'parent_category_id','')is null else c.c->>'parent_category_id'=p_parent::text end),
 page as(select node from matched order by coalesce((node->>'sort_order')::integer,100),node->>'id' limit least(100,greatest(1,p_size)) offset (greatest(1,p_page)-1)*least(100,greatest(1,p_size)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(node)from page),'[]'::jsonb),'total',(select count(*)from matched),'page',greatest(1,p_page),'pageSize',least(100,greatest(1,p_size)));
$$;
create or replace function public.angelcare_population_offers(p_territory uuid default null,p_query text default '',p_category uuid default null,p_schema text default '',p_status text default '',p_gap text default '',p_page integer default 1,p_size integer default 36)
returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 with recursive category_ids(id,path)as(select p_category::text,array[p_category::text] where p_category is not null union all select c.id::text,x.path||c.id::text from public.angelcare_marketplace_catalog_categories c join category_ids x on c.parent_category_id::text=x.id where not(c.id::text=any(x.path))and(p_territory is null or to_jsonb(c)->>'territory_id' is null or to_jsonb(c)->>'territory_id'=p_territory::text)),
 matched as(select item from angelcare_private.population_items(p_territory) where
 (case when p_status='' then item->>'status'<>'archived' else item->>'status'=p_status end)
 and (p_query='' or concat_ws(' ',item->>'item_key',item->>'sku',item->>'public_reference',item->>'name_fr',item->>'name_en',item->>'name_ar') ilike '%'||p_query||'%')
 and (p_schema='' or coalesce(nullif(item->>'experience_schema_key',''),item->'commercial_metadata'->>'experience_schema_key','unclassified')=p_schema)
 and (p_category is null or exists(select 1 from jsonb_array_elements(angelcare_private.population_array(item->'categories'))l join category_ids c on c.id=l->>'category_id'))
 and(case when p_gap='media' then not angelcare_private.population_has_primary(item) when p_gap='category' then jsonb_array_length(angelcare_private.population_array(item->'categories'))=0 when p_gap in ('fr','en','ar') then not angelcare_private.population_locale_complete(item,p_gap) else true end)),
 page as(select item from matched order by item->>'updated_at' desc nulls last,item->>'id' limit least(100,greatest(1,p_size)) offset(greatest(1,p_page)-1)*least(100,greatest(1,p_size)))
 select jsonb_build_object('rows',coalesce((select jsonb_agg(item)from page),'[]'::jsonb),'total',(select count(*)from matched),'page',greatest(1,p_page),'pageSize',least(100,greatest(1,p_size)));
$$;
revoke all on function public.angelcare_population_inventory(uuid),public.angelcare_population_categories(uuid,text,uuid,text,integer,integer),public.angelcare_population_offers(uuid,text,uuid,text,text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.angelcare_population_inventory(uuid),public.angelcare_population_categories(uuid,text,uuid,text,integer,integer),public.angelcare_population_offers(uuid,text,uuid,text,text,text,integer,integer) to service_role;

-- Durable coordinator. File bytes stay in the existing Windows Media Vault.
do $$ begin
 if to_regclass('public.angelcare_marketplace_population_batches')is not null and obj_description(to_regclass('public.angelcare_marketplace_population_batches'),'pg_class')is distinct from 'ANGELCARE_CATALOGUE_POPULATION_R1' then raise exception 'Unrelated population table preserved';end if;
end $$;
create table if not exists public.angelcare_marketplace_population_batches(
 id uuid primary key default gen_random_uuid(),schema_key text not null,schema_version integer not null,source_name text not null,source_csv text not null,
 manifest jsonb not null default '[]',assets jsonb not null default '{}',settings jsonb not null default '{}',signatures jsonb not null default '{}',native_job_id uuid,
 status text not null default 'draft' check(status in('draft','validated','running','partial','completed','rolled_back')),result jsonb not null default '{}',revision integer not null default 1,
 lease_token uuid,created_by uuid not null,territory_id uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
comment on table public.angelcare_marketplace_population_batches is 'ANGELCARE_CATALOGUE_POPULATION_R1';
alter table public.angelcare_marketplace_population_batches enable row level security;
revoke all on public.angelcare_marketplace_population_batches from public,anon,authenticated;
grant select,insert,update on public.angelcare_marketplace_population_batches to service_role;
create index if not exists angelcare_population_owner_idx on public.angelcare_marketplace_population_batches(created_by,created_at desc);
create or replace function public.angelcare_population_batch_asset(p_id uuid,p_actor uuid,p_revision integer,p_path text,p_asset jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;
begin
 select * into b from public.angelcare_marketplace_population_batches where id=p_id and created_by=p_actor for update;
 if not found or b.revision<>p_revision or b.status in('running','completed','rolled_back') then raise exception 'POPULATION_REVISION_CONFLICT';end if;
 if not exists(select 1 from jsonb_array_elements(b.manifest)m where m->>'path'=p_path) then raise exception 'POPULATION_MANIFEST_CONFLICT';end if;
 update public.angelcare_marketplace_population_batches set assets=jsonb_set(assets,array[p_path],p_asset,true),native_job_id=null,status='draft',revision=revision+1,updated_at=now() where id=p_id returning * into b;return to_jsonb(b);
end $$;
create or replace function public.angelcare_population_batch_validate(p_id uuid,p_actor uuid,p_revision integer,p_job uuid,p_signatures jsonb,p_result jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;
begin
 update public.angelcare_marketplace_population_batches set native_job_id=p_job,signatures=p_signatures,result=p_result,status=case when coalesce((p_result->>'invalid')::integer,1)=0 then 'validated' else 'draft' end,revision=revision+1,updated_at=now()where id=p_id and created_by=p_actor and revision=p_revision and status not in('running','completed','rolled_back') returning * into b;
 if not found then raise exception 'POPULATION_REVISION_CONFLICT';end if;return to_jsonb(b);
end $$;
create or replace function public.angelcare_population_batch_claim(p_id uuid,p_actor uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;
begin
 update public.angelcare_marketplace_population_batches set status='running',lease_token=gen_random_uuid(),revision=revision+1,updated_at=now()where id=p_id and created_by=p_actor and status='validated'and (native_job_id is not null or settings->>'kind'='taxonomy') returning * into b;if not found then return null;end if;return to_jsonb(b);
end $$;
create or replace function public.angelcare_population_batch_finish(p_id uuid,p_actor uuid,p_lease uuid,p_status text,p_result jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;
begin
 if p_status not in('partial','completed','validated')then raise exception 'POPULATION_STATUS_INVALID';end if;
 update public.angelcare_marketplace_population_batches set status=p_status,result=p_result,revision=revision+1,lease_token=null,updated_at=now()where id=p_id and created_by=p_actor and lease_token=p_lease and status='running' returning * into b;if not found then raise exception 'POPULATION_LEASE_CONFLICT';end if;return to_jsonb(b);
end $$;
revoke all on function public.angelcare_population_batch_asset(uuid,uuid,integer,text,jsonb),public.angelcare_population_batch_validate(uuid,uuid,integer,uuid,jsonb,jsonb),public.angelcare_population_batch_claim(uuid,uuid),public.angelcare_population_batch_finish(uuid,uuid,uuid,text,jsonb)from public,anon,authenticated;
grant execute on function public.angelcare_population_batch_asset(uuid,uuid,integer,text,jsonb),public.angelcare_population_batch_validate(uuid,uuid,integer,uuid,jsonb,jsonb),public.angelcare_population_batch_claim(uuid,uuid),public.angelcare_population_batch_finish(uuid,uuid,uuid,text,jsonb)to service_role;

-- Category membership uses one transaction and an optimistic item version.
create or replace function public.angelcare_population_assign_categories(p_item uuid,p_ids uuid[],p_mode text,p_primary uuid,p_expected text,p_actor uuid,p_territory uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare i jsonb;before_ids uuid[];after_ids uuid[];primary_id uuid;
begin
 if p_mode not in('add','remove','replace')then raise exception 'CATEGORY_MODE_INVALID';end if;
 select to_jsonb(c)into i from public.angelcare_marketplace_catalog_items c where c.id=p_item for update;
 if i is null then raise exception 'ITEM_NOT_FOUND';end if;
 if p_territory is not null and i->>'territory_id' is not null and i->>'territory_id'<>p_territory::text then raise exception 'ITEM_SCOPE_DENIED';end if;
 if nullif(p_expected,'')is not null and(i->>'updated_at')::timestamptz<>p_expected::timestamptz then raise exception 'ITEM_VERSION_CONFLICT';end if;
 if exists(select 1 from unnest(p_ids) x left join public.angelcare_marketplace_catalog_categories c on c.id=x where c.id is null or c.status='archived' or(p_territory is not null and to_jsonb(c)->>'territory_id' is not null and to_jsonb(c)->>'territory_id'<>p_territory::text))then raise exception 'CATEGORY_SCOPE_INVALID';end if;
 select coalesce(array_agg(category_id),'{}'::uuid[])into before_ids from public.angelcare_marketplace_catalog_item_categories where catalog_item_id=p_item;
 select category_id into primary_id from public.angelcare_marketplace_catalog_item_categories where catalog_item_id=p_item and is_primary=true order by sort_order,id limit 1;
 if p_mode='replace'then after_ids=p_ids;elsif p_mode='add'then select array_agg(distinct x)into after_ids from unnest(before_ids||p_ids)x;else select array_agg(x)into after_ids from unnest(before_ids)x where not(x=any(p_ids));end if;
 after_ids=coalesce(after_ids,'{}'::uuid[]);if p_primary is not null then primary_id=p_primary;end if;if primary_id is null or not(primary_id=any(after_ids))then primary_id=after_ids[1];end if;
 delete from public.angelcare_marketplace_catalog_item_categories where catalog_item_id=p_item and not(category_id=any(after_ids));
 insert into public.angelcare_marketplace_catalog_item_categories(catalog_item_id,category_id,is_primary,sort_order)select p_item,x,false,n::integer*10 from unnest(after_ids)with ordinality a(x,n)where not exists(select 1 from public.angelcare_marketplace_catalog_item_categories c where c.catalog_item_id=p_item and c.category_id=x);
 update public.angelcare_marketplace_catalog_item_categories set is_primary=false where catalog_item_id=p_item;
 update public.angelcare_marketplace_catalog_item_categories set is_primary=true where catalog_item_id=p_item and category_id=primary_id;
 update public.angelcare_marketplace_catalog_items set updated_by=p_actor,updated_at=now()where id=p_item;
 return jsonb_build_object('before',before_ids,'after',after_ids,'primary',primary_id);
end $$;
revoke all on function public.angelcare_population_assign_categories(uuid,uuid[],text,uuid,text,uuid,uuid)from public,anon,authenticated;
grant execute on function public.angelcare_population_assign_categories(uuid,uuid[],text,uuid,text,uuid,uuid)to service_role;
notify pgrst,'reload schema';
commit;
