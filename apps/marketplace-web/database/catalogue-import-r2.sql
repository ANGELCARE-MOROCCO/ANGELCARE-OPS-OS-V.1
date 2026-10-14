-- ANGELCARE_CATALOGUE_IMPORT_R2. Run separately in the Marketplace SQL editor.
-- No changes to Auth, email, media storage, Finance receipts or operational engines.
begin;
create schema if not exists angelcare_private;
do $$ begin
 if to_regclass('public.angelcare_marketplace_catalogue_import_runs') is not null
 and obj_description(to_regclass('public.angelcare_marketplace_catalogue_import_runs'),'pg_class') is distinct from 'ANGELCARE_CATALOGUE_IMPORT_R2' then raise exception 'Unrelated import table preserved'; end if;
 if to_regclass('public.angelcare_marketplace_catalogue_import_lines') is not null
 and obj_description(to_regclass('public.angelcare_marketplace_catalogue_import_lines'),'pg_class') is distinct from 'ANGELCARE_CATALOGUE_IMPORT_R2' then raise exception 'Unrelated import line table preserved'; end if;
end $$;
create table if not exists public.angelcare_marketplace_catalogue_import_runs(
 id uuid primary key default gen_random_uuid(),reference text not null unique default ('IMP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 created_by uuid not null,territory_id uuid,tenant_id uuid,source_name text not null,source_csv text not null,source_hash text not null,
 profile_key text not null,profile_fingerprint text not null,profile_snapshot jsonb not null,target jsonb not null,manifest jsonb not null default '[]',assets jsonb not null default '{}',companions jsonb not null default '{}',
 status text not null default 'preparing' check(status in('preparing','correct','ready','running','paused','completed','partial','rolled_back')),
 revision integer not null default 1,lease_token uuid,lease_until timestamptz,approved_hash text,approved_by uuid,approved_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(created_by,source_hash)
);
create table if not exists public.angelcare_marketplace_catalogue_import_lines(
 id uuid primary key default gen_random_uuid(),run_id uuid not null references public.angelcare_marketplace_catalogue_import_runs(id),row_number integer not null,
 identity_key text not null,item_id uuid not null,original jsonb not null,prepared jsonb not null,issues jsonb not null default '[]',
 status text not null default 'unchecked' check(status in('unchecked','invalid','ready','applied','failed','conflict','rolled_back')),
 plan jsonb,before_snapshot jsonb,after_snapshot jsonb,applied_at timestamptz,rolled_back_at timestamptz,error text,academy_receipts jsonb not null default '[]',
 unique(run_id,row_number),unique(run_id,identity_key)
);
comment on table public.angelcare_marketplace_catalogue_import_runs is 'ANGELCARE_CATALOGUE_IMPORT_R2';
comment on table public.angelcare_marketplace_catalogue_import_lines is 'ANGELCARE_CATALOGUE_IMPORT_R2';
alter table public.angelcare_marketplace_catalogue_import_runs enable row level security;
alter table public.angelcare_marketplace_catalogue_import_lines enable row level security;
revoke all on public.angelcare_marketplace_catalogue_import_runs,public.angelcare_marketplace_catalogue_import_lines from public,anon,authenticated;
grant select,insert,update on public.angelcare_marketplace_catalogue_import_runs,public.angelcare_marketplace_catalogue_import_lines to service_role;
create index if not exists catalogue_import_runs_scope_r2 on public.angelcare_marketplace_catalogue_import_runs(territory_id,tenant_id,created_at desc);
create index if not exists catalogue_import_lines_pending_r2 on public.angelcare_marketplace_catalogue_import_lines(run_id,status,row_number);

create or replace function angelcare_private.import_r2_snapshot(p_item uuid)
returns jsonb language plpgsql volatile security invoker set search_path=pg_catalog as $$
declare result jsonb; k text; t text; a jsonb;
begin
 select to_jsonb(i) into result from public.angelcare_marketplace_catalog_items i where i.id=p_item;
 if result is null then return null;end if;
 for k,t in select * from(values('variants','angelcare_marketplace_catalog_variants'),('media','angelcare_marketplace_catalog_item_media'),('availability','angelcare_marketplace_catalog_availability'),('categories','angelcare_marketplace_catalog_item_categories'),('priceRules','angelcare_marketplace_finance_price_rules'),('placements','angelcare_marketplace_homepage_placements'))v(k,t) loop
  execute format('select coalesce(jsonb_agg(to_jsonb(r) order by r.id),''[]''::jsonb) from public.%I r where r.catalog_item_id=$1',t) into a using p_item;
  result=result||jsonb_build_object(k,a);
 end loop;
 return result;
end $$;
create or replace function public.angelcare_import_r2_snapshot(p_item uuid)
returns jsonb language sql volatile security definer set search_path=pg_catalog as $$ select angelcare_private.import_r2_snapshot(p_item); $$;

create or replace function angelcare_private.import_r2_scope(r public.angelcare_marketplace_catalogue_import_runs,p_territory uuid,p_tenant uuid)
returns void language plpgsql immutable security invoker set search_path=pg_catalog as $$ begin
 if p_territory is not null and r.territory_id is distinct from p_territory then raise exception 'IMPORT_SCOPE_DENIED';end if;
 if p_tenant is not null and r.tenant_id is distinct from p_tenant then raise exception 'IMPORT_SCOPE_DENIED';end if;
end $$;
create or replace function public.angelcare_import_r2_create(p_run jsonb,p_lines jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.angelcare_marketplace_catalogue_import_runs%rowtype;l jsonb;
begin
 if jsonb_array_length(p_lines)<1 or jsonb_array_length(p_lines)>10000 then raise exception 'IMPORT_SIZE_INVALID';end if;
 insert into public.angelcare_marketplace_catalogue_import_runs(id,created_by,territory_id,tenant_id,source_name,source_csv,source_hash,profile_key,profile_fingerprint,profile_snapshot,target,manifest,companions)
 values((p_run->>'id')::uuid,(p_run->>'created_by')::uuid,(p_run->>'territory_id')::uuid,(p_run->>'tenant_id')::uuid,p_run->>'source_name',p_run->>'source_csv',p_run->>'source_hash',p_run->>'profile_key',p_run->>'profile_fingerprint',p_run->'profile_snapshot',p_run->'target',coalesce(p_run->'manifest','[]'),coalesce(p_run->'companions','{}'))
 on conflict(created_by,source_hash) do nothing returning * into r;
 if not found then select * into r from public.angelcare_marketplace_catalogue_import_runs where created_by=(p_run->>'created_by')::uuid and source_hash=p_run->>'source_hash';return to_jsonb(r);end if;
 for l in select value from jsonb_array_elements(p_lines)loop
  insert into public.angelcare_marketplace_catalogue_import_lines(run_id,row_number,identity_key,item_id,original,prepared,issues,status)
  values(r.id,(l->>'row_number')::integer,l->>'identity_key',(l->>'item_id')::uuid,l->'original',l->'prepared',l->'issues',l->>'status');
 end loop;
 return to_jsonb(r);
end $$;
create or replace function public.angelcare_import_r2_claim(p_id uuid,p_actor uuid,p_territory uuid,p_tenant uuid,p_revision integer,p_hash text)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.angelcare_marketplace_catalogue_import_runs%rowtype;
begin
 select * into r from public.angelcare_marketplace_catalogue_import_runs where id=p_id for update;
 if not found then raise exception 'IMPORT_NOT_FOUND';end if;perform angelcare_private.import_r2_scope(r,p_territory,p_tenant);
 if r.revision<>p_revision or r.profile_fingerprint<>p_hash then raise exception 'IMPORT_REVISION_CONFLICT';end if;
 if r.status not in('ready','paused','partial','running') or (r.lease_until is not null and r.lease_until>now()) then raise exception 'IMPORT_LEASE_CONFLICT';end if;
 if exists(select 1 from public.angelcare_marketplace_catalogue_import_lines where run_id=r.id and status in('unchecked','invalid')) then raise exception 'IMPORT_VALIDATION_REQUIRED';end if;
 update public.angelcare_marketplace_catalogue_import_runs set status='running',lease_token=gen_random_uuid(),lease_until=now()+interval '90 seconds',approved_hash=p_hash,approved_by=p_actor,approved_at=now(),revision=revision+1,updated_at=now()where id=r.id returning * into r;
 return to_jsonb(r);
end $$;
create or replace function angelcare_private.import_r2_write(p_table text,p_value jsonb,p_item uuid)
returns void language plpgsql security invoker set search_path=pg_catalog as $$
declare columns text;updates text;unknown text;owner uuid;tid oid;
begin
 if p_table not in('angelcare_marketplace_catalog_items','angelcare_marketplace_catalog_variants','angelcare_marketplace_catalog_item_media','angelcare_marketplace_catalog_availability','angelcare_marketplace_catalog_item_categories','angelcare_marketplace_finance_price_rules','angelcare_marketplace_homepage_placements') then raise exception 'IMPORT_TABLE_DENIED';end if;
 tid=to_regclass('public.'||p_table);
 if tid is null then raise exception 'IMPORT_NATIVE_TABLE_MISSING';end if;
 if p_table='angelcare_marketplace_catalog_items' then
  if (p_value->>'id')::uuid<>p_item then raise exception 'IMPORT_ITEM_DENIED';end if;
 else
  if (p_value->>'catalog_item_id')::uuid is distinct from p_item then raise exception 'IMPORT_ITEM_DENIED';end if;
  execute format('select catalog_item_id from public.%I where id=$1',p_table) into owner using (p_value->>'id')::uuid;
  if owner is not null and owner<>p_item then raise exception 'IMPORT_CHILD_OWNER_DENIED';end if;
 end if;
 select string_agg(k,',')into unknown from jsonb_object_keys(p_value)k where not exists(select 1 from pg_attribute a where a.attrelid=tid and a.attname=k and a.attnum>0 and not a.attisdropped and a.attidentity='');
 if unknown is not null then raise exception 'IMPORT_UNSUPPORTED_NATIVE_COLUMNS: %',unknown;end if;
 select string_agg(format('%I',a.attname),',' order by a.attnum),string_agg(format('%I=excluded.%I',a.attname,a.attname),',' order by a.attnum)filter(where a.attname not in('id','created_at','created_by')) into columns,updates from pg_attribute a where a.attrelid=tid and a.attnum>0 and not a.attisdropped and a.attgenerated='' and a.attidentity='' and p_value?a.attname;
 execute format('insert into public.%1$I(%2$s) select %2$s from jsonb_populate_record(null::public.%1$I,$1) on conflict(id) do update set %3$s',p_table,columns,updates) using p_value;
end $$;
create or replace function angelcare_private.import_r2_graph(p_item uuid,p_graph jsonb)
returns void language plpgsql security invoker set search_path=pg_catalog as $$
declare k text;t text;value jsonb;ids uuid[];core jsonb;
begin
 core=p_graph-array['variants','media','availability','categories','priceRules','placements'];
 perform angelcare_private.import_r2_write('angelcare_marketplace_catalog_items',core,p_item);
 for k,t in select * from(values('variants','angelcare_marketplace_catalog_variants'),('media','angelcare_marketplace_catalog_item_media'),('availability','angelcare_marketplace_catalog_availability'),('categories','angelcare_marketplace_catalog_item_categories'),('priceRules','angelcare_marketplace_finance_price_rules'),('placements','angelcare_marketplace_homepage_placements'))v(k,t)loop
  ids='{}'::uuid[];
  for value in select v from jsonb_array_elements(coalesce(p_graph->k,'[]'))v loop
   perform angelcare_private.import_r2_write(t,value,p_item);ids=array_append(ids,(value->>'id')::uuid);
  end loop;
  if k in('categories','availability') then execute format('delete from public.%I where catalog_item_id=$1 and not(id=any($2))',t) using p_item,ids;
  else execute format('update public.%I set status=''archived'',updated_at=now() where catalog_item_id=$1 and not(id=any($2))',t)using p_item,ids;end if;
 end loop;
end $$;
create or replace function angelcare_private.import_r2_academy_write(p_table text,p_value jsonb)
returns void language plpgsql security invoker set search_path=pg_catalog as $$
declare columns text;updates text;tid oid;unknown text;
begin
 if p_table not in('angelcare_marketplace_academy_programs','angelcare_marketplace_academy_courses','angelcare_marketplace_academy_course_modules','angelcare_marketplace_academy_cohorts')then raise exception 'ACADEMY_IMPORT_TABLE_DENIED';end if;
 tid=to_regclass('public.'||p_table);if tid is null then raise exception 'ACADEMY_NATIVE_TABLE_MISSING';end if;
 select string_agg(k,',')into unknown from jsonb_object_keys(p_value)k where not exists(select 1 from pg_attribute a where a.attrelid=tid and a.attname=k and a.attnum>0 and not a.attisdropped and a.attgenerated='');
 if unknown is not null then raise exception 'ACADEMY_UNSUPPORTED_COLUMNS: %',unknown;end if;
 select string_agg(format('%I',a.attname),',' order by a.attnum),string_agg(format('%I=excluded.%I',a.attname,a.attname),',' order by a.attnum)filter(where a.attname not in('id','created_at','created_by'))into columns,updates from pg_attribute a where a.attrelid=tid and a.attnum>0 and not a.attisdropped and a.attgenerated='' and a.attidentity='' and p_value?a.attname;
 execute format('insert into public.%1$I(%2$s) select %2$s from jsonb_populate_record(null::public.%1$I,$1) on conflict(id) do update set %3$s',p_table,columns,updates)using p_value;
end $$;
create or replace function angelcare_private.import_r2_academy_apply(p_entries jsonb,p_item uuid,p_territory uuid,p_tenant uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare entry jsonb;current_value jsonb;after_value jsonb;receipts jsonb='[]';t text;course_item uuid;expected_parent uuid;
begin
 for entry in select value from jsonb_array_elements(coalesce(p_entries,'[]'))loop
  t=entry->>'table';
  if t not in('angelcare_marketplace_academy_programs','angelcare_marketplace_academy_courses','angelcare_marketplace_academy_course_modules','angelcare_marketplace_academy_cohorts')then raise exception 'ACADEMY_IMPORT_TABLE_DENIED';end if;
  execute format('select to_jsonb(r) from public.%I r where id=$1 for update',t)into current_value using (entry->'after'->>'id')::uuid;
  if current_value is distinct from nullif(entry->'before','null'::jsonb)then raise exception 'ACADEMY_IMPORT_CHANGED';end if;
  if current_value is not null and p_territory is not null and nullif(current_value->>'territory_id','')is not null and (current_value->>'territory_id')::uuid<>p_territory then raise exception 'ACADEMY_SCOPE_DENIED';end if;
  if current_value is not null and p_tenant is not null and nullif(current_value->>'tenant_id','')is not null and (current_value->>'tenant_id')::uuid<>p_tenant then raise exception 'ACADEMY_SCOPE_DENIED';end if;
  if t='angelcare_marketplace_academy_courses'and(entry->'after'->>'catalog_item_id')::uuid<>p_item then raise exception 'ACADEMY_OFFER_DENIED';end if;
  if t in('angelcare_marketplace_academy_course_modules','angelcare_marketplace_academy_cohorts')then
   select catalog_item_id into course_item from public.angelcare_marketplace_academy_courses where id=(entry->'after'->>'course_id')::uuid for update;
   if course_item is distinct from p_item then raise exception 'ACADEMY_OFFER_DENIED';end if;
  end if;
  if t='angelcare_marketplace_academy_cohorts'and current_value is not null and (current_value->>'status'<>'draft' or coalesce((current_value->>'enrolled_count')::integer,0)>0 or coalesce((current_value->>'waitlist_count')::integer,0)>0)then raise exception 'ACADEMY_OPERATIONAL_CONFLICT';end if;
  perform angelcare_private.import_r2_academy_write(t,entry->'after');
  execute format('select to_jsonb(r) from public.%I r where id=$1',t)into after_value using(entry->'after'->>'id')::uuid;
  receipts=receipts||jsonb_build_array(jsonb_build_object('table',t,'before',entry->'before','after',after_value));
 end loop;return receipts;
end $$;
create or replace function angelcare_private.import_r2_academy_restore(p_receipts jsonb)
returns void language plpgsql security invoker set search_path=pg_catalog as $$
declare entry jsonb;current_value jsonb;c record;n bigint;t text;managed uuid[];
begin
 for entry in select value from jsonb_array_elements(p_receipts)loop
  t=entry->>'table';if t not in('angelcare_marketplace_academy_programs','angelcare_marketplace_academy_courses','angelcare_marketplace_academy_course_modules','angelcare_marketplace_academy_cohorts')then raise exception 'ACADEMY_IMPORT_TABLE_DENIED';end if;
  execute format('select to_jsonb(r) from public.%I r where id=$1 for update',t)into current_value using(entry->'after'->>'id')::uuid;
  if current_value is distinct from entry->'after'then raise exception 'ACADEMY_LATER_EDIT_CONFLICT';end if;
  for c in select cl.relname,a.attname from pg_constraint fk join pg_class cl on cl.oid=fk.conrelid join pg_namespace ns on ns.oid=cl.relnamespace join pg_attribute a on a.attrelid=fk.conrelid and a.attnum=fk.conkey[1]where fk.contype='f'and fk.confrelid=to_regclass('public.'||t)and ns.nspname='public'and array_length(fk.conkey,1)=1 loop
   select coalesce(array_agg((v->'after'->>'id')::uuid),'{}'::uuid[])into managed from jsonb_array_elements(p_receipts)v where v->>'table'=c.relname;
   if exists(select 1 from pg_attribute where attrelid=to_regclass('public.'||c.relname)and attname='id'and not attisdropped)then execute format('select count(*)from public.%I where %I=$1 and not(id=any($2))',c.relname,c.attname)into n using(entry->'after'->>'id')::uuid,managed;else execute format('select count(*)from public.%I where %I=$1',c.relname,c.attname)into n using(entry->'after'->>'id')::uuid;end if;
   if n>0 then raise exception 'ACADEMY_OPERATIONAL_DEPENDENCY_CONFLICT';end if;
  end loop;
 end loop;
 for entry in select value from jsonb_array_elements(p_receipts)with ordinality v(value,n)order by n desc loop
  if nullif(entry->'before','null'::jsonb)is null then execute format('update public.%I set status=''archived''where id=$1',entry->>'table')using(entry->'after'->>'id')::uuid;
  else perform angelcare_private.import_r2_academy_write(entry->>'table',entry->'before');end if;
 end loop;
end $$;

create or replace function public.angelcare_import_r2_apply(p_run uuid,p_line uuid,p_lease uuid,p_actor uuid,p_territory uuid,p_tenant uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.angelcare_marketplace_catalogue_import_runs%rowtype;l public.angelcare_marketplace_catalogue_import_lines%rowtype;current_graph jsonb;t text;academy_proofs jsonb;
begin
 select * into r from public.angelcare_marketplace_catalogue_import_runs where id=p_run for update;
 if not found then raise exception 'IMPORT_NOT_FOUND';end if;perform angelcare_private.import_r2_scope(r,p_territory,p_tenant);
 select * into l from public.angelcare_marketplace_catalogue_import_lines where id=p_line and run_id=p_run for update;
 if not found then raise exception 'IMPORT_LINE_NOT_FOUND';end if;
 if l.status='applied' then return to_jsonb(l);end if;
 if r.status<>'running' or r.lease_token is distinct from p_lease or r.lease_until<=now() then raise exception 'IMPORT_LEASE_CONFLICT';end if;
 if l.status not in('ready','failed') or l.plan is null then raise exception 'IMPORT_LINE_NOT_READY';end if;
 perform 1 from public.angelcare_marketplace_catalog_items where id=l.item_id for update;
 for t in select unnest(array['angelcare_marketplace_catalog_variants','angelcare_marketplace_catalog_item_media','angelcare_marketplace_catalog_availability','angelcare_marketplace_catalog_item_categories','angelcare_marketplace_finance_price_rules','angelcare_marketplace_homepage_placements'])loop
  execute format('select id from public.%I where catalog_item_id=$1 for update',t) using l.item_id;
 end loop;
 current_graph=angelcare_private.import_r2_snapshot(l.item_id);
 if current_graph is distinct from nullif(l.plan->'before','null'::jsonb) then raise exception 'IMPORT_OFFER_CHANGED';end if;
 if p_territory is not null and nullif(current_graph->>'territory_id','')is not null and (current_graph->>'territory_id')::uuid<>p_territory then raise exception 'IMPORT_SCOPE_DENIED';end if;
 perform angelcare_private.import_r2_graph(l.item_id,l.plan->'after');
 academy_proofs=angelcare_private.import_r2_academy_apply(l.plan->'academy'->'entries',l.item_id,p_territory,p_tenant);
 update public.angelcare_marketplace_catalogue_import_lines set status='applied',before_snapshot=current_graph,after_snapshot=angelcare_private.import_r2_snapshot(l.item_id),academy_receipts=coalesce(academy_proofs,'[]'),applied_at=now(),error=null where id=l.id returning * into l;
 update public.angelcare_marketplace_catalogue_import_runs set lease_until=now()+interval '90 seconds',updated_at=now() where id=r.id;
 return to_jsonb(l);
end $$;
create or replace function public.angelcare_import_r2_release(p_run uuid,p_lease uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.angelcare_marketplace_catalogue_import_runs%rowtype;s text;
begin
 select * into r from public.angelcare_marketplace_catalogue_import_runs where id=p_run and lease_token=p_lease for update;
 if not found then raise exception 'IMPORT_LEASE_CONFLICT';end if;
 select case when count(*)filter(where status in('unchecked','invalid','conflict','failed'))>0 then 'partial' when count(*)filter(where status='ready')>0 then 'paused' else 'completed' end into s from public.angelcare_marketplace_catalogue_import_lines where run_id=p_run;
 update public.angelcare_marketplace_catalogue_import_runs set status=s,lease_token=null,lease_until=null,revision=revision+1,updated_at=now()where id=p_run returning * into r;return to_jsonb(r);
end $$;
-- Conservative dependency check: every foreign key outside the owned offer graph
-- is considered operational evidence. A rollback with dependencies is a conflict.
create or replace function angelcare_private.import_r2_dependencies(p_item uuid,p_receipts jsonb)
returns jsonb language plpgsql stable security invoker set search_path=pg_catalog as $$
declare c record;n bigint;result jsonb='[]';
begin
 for c in select cl.relname,a.attname from pg_constraint fk join pg_class cl on cl.oid=fk.conrelid join pg_namespace ns on ns.oid=cl.relnamespace join pg_attribute a on a.attrelid=fk.conrelid and a.attnum=fk.conkey[1] where fk.contype='f' and fk.confrelid='public.angelcare_marketplace_catalog_items'::regclass and ns.nspname='public' and array_length(fk.conkey,1)=1 and cl.relname not in('angelcare_marketplace_catalog_variants','angelcare_marketplace_catalog_item_media','angelcare_marketplace_catalog_availability','angelcare_marketplace_catalog_item_categories','angelcare_marketplace_finance_price_rules','angelcare_marketplace_homepage_placements')loop
  if exists(select 1 from pg_attribute where attrelid=to_regclass('public.'||c.relname)and attname='id'and not attisdropped)then execute format('select count(*) from public.%I where %I=$1 and not(id in(select (v->''after''->>''id'')::uuid from jsonb_array_elements($2)v where v->>''table''=$3))',c.relname,c.attname)into n using p_item,p_receipts,c.relname;else execute format('select count(*)from public.%I where %I=$1',c.relname,c.attname)into n using p_item;end if;
  if n>0 then result=result||jsonb_build_array(jsonb_build_object('table',c.relname,'count',n));end if;
 end loop;
 select count(*)into n from public.angelcare_marketplace_catalog_items i where i.id<>p_item and i.status<>'archived'and exists(select 1 from unnest(array['cross_sell_ids','upsell_ids','alternative_ids','bundle_ids'])k where coalesce(i.relation_config->k,'[]'::jsonb)?p_item::text);
 if n>0 then result=result||jsonb_build_array(jsonb_build_object('table','catalogue_native_relations','count',n));end if;
 return result;
end $$;
create or replace function public.angelcare_import_r2_rollback(p_run uuid,p_line uuid,p_actor uuid,p_territory uuid,p_tenant uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.angelcare_marketplace_catalogue_import_runs%rowtype;l public.angelcare_marketplace_catalogue_import_lines%rowtype;current_graph jsonb;deps jsonb;t text;
begin
 select * into r from public.angelcare_marketplace_catalogue_import_runs where id=p_run for update;
 if not found then raise exception 'IMPORT_NOT_FOUND';end if;perform angelcare_private.import_r2_scope(r,p_territory,p_tenant);
 if r.lease_until>now() then raise exception 'IMPORT_LEASE_CONFLICT';end if;
 select * into l from public.angelcare_marketplace_catalogue_import_lines where id=p_line and run_id=p_run for update;
 if not found then raise exception 'IMPORT_LINE_NOT_FOUND';end if;
 if l.status='rolled_back' then return to_jsonb(l);end if;
 if l.status<>'applied' then raise exception 'IMPORT_ROLLBACK_NOT_APPLIED';end if;
 perform 1 from public.angelcare_marketplace_catalog_items where id=l.item_id for update;
 for t in select unnest(array['angelcare_marketplace_catalog_variants','angelcare_marketplace_catalog_item_media','angelcare_marketplace_catalog_availability','angelcare_marketplace_catalog_item_categories','angelcare_marketplace_finance_price_rules','angelcare_marketplace_homepage_placements'])loop execute format('select id from public.%I where catalog_item_id=$1 for update',t)using l.item_id;end loop;
 current_graph=angelcare_private.import_r2_snapshot(l.item_id);
 if current_graph is distinct from l.after_snapshot then raise exception 'IMPORT_LATER_EDIT_CONFLICT';end if;
 deps=angelcare_private.import_r2_dependencies(l.item_id,l.academy_receipts);
 if jsonb_array_length(deps)>0 then raise exception 'IMPORT_OPERATIONAL_DEPENDENCY_CONFLICT: %',deps;end if;
 perform angelcare_private.import_r2_academy_restore(l.academy_receipts);
 if l.before_snapshot is null then
  update public.angelcare_marketplace_catalog_items set status='archived',updated_by=p_actor,updated_at=now()where id=l.item_id;
 else perform angelcare_private.import_r2_graph(l.item_id,l.before_snapshot);end if;
 update public.angelcare_marketplace_catalogue_import_lines set status='rolled_back',rolled_back_at=now(),error=null where id=l.id returning * into l;
 update public.angelcare_marketplace_catalogue_import_runs set status=case when exists(select 1 from public.angelcare_marketplace_catalogue_import_lines where run_id=p_run and status='applied')then 'partial'else 'rolled_back'end,revision=revision+1,updated_at=now()where id=p_run;
 return to_jsonb(l);
end $$;

revoke all on function angelcare_private.import_r2_snapshot(uuid),angelcare_private.import_r2_scope(public.angelcare_marketplace_catalogue_import_runs,uuid,uuid),angelcare_private.import_r2_write(text,jsonb,uuid),angelcare_private.import_r2_graph(uuid,jsonb),angelcare_private.import_r2_dependencies(uuid,jsonb),angelcare_private.import_r2_academy_write(text,jsonb),angelcare_private.import_r2_academy_apply(jsonb,uuid,uuid,uuid),angelcare_private.import_r2_academy_restore(jsonb)from public,anon,authenticated;
revoke all on function public.angelcare_import_r2_snapshot(uuid),public.angelcare_import_r2_create(jsonb,jsonb),public.angelcare_import_r2_claim(uuid,uuid,uuid,uuid,integer,text),public.angelcare_import_r2_apply(uuid,uuid,uuid,uuid,uuid,uuid),public.angelcare_import_r2_release(uuid,uuid),public.angelcare_import_r2_rollback(uuid,uuid,uuid,uuid,uuid)from public,anon,authenticated;
grant execute on function public.angelcare_import_r2_snapshot(uuid),public.angelcare_import_r2_create(jsonb,jsonb),public.angelcare_import_r2_claim(uuid,uuid,uuid,uuid,integer,text),public.angelcare_import_r2_apply(uuid,uuid,uuid,uuid,uuid,uuid),public.angelcare_import_r2_release(uuid,uuid),public.angelcare_import_r2_rollback(uuid,uuid,uuid,uuid,uuid)to service_role;
notify pgrst,'reload schema';
commit;
