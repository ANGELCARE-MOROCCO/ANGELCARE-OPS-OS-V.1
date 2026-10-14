-- Run after catalogue-import-r2.sql. Uses the installed Population R1 coordinator.
begin;
do $$begin if to_regclass('public.angelcare_marketplace_population_batches')is null then raise exception 'Install the existing catalogue-population-r1.sql first';end if;if obj_description(to_regclass('public.angelcare_marketplace_population_batches'),'pg_class')is distinct from 'ANGELCARE_CATALOGUE_POPULATION_R1'then raise exception 'Unrelated coordinator preserved';end if;end$$;
alter table public.angelcare_marketplace_population_batches add column if not exists lease_until timestamptz;
create or replace function public.angelcare_import_r2_taxonomy_claim(p_id uuid,p_actor uuid,p_territory uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;
begin
 select * into b from public.angelcare_marketplace_population_batches where id=p_id and schema_key='catalog-taxonomy'for update;
 if not found or(p_territory is not null and b.territory_id is distinct from p_territory)then raise exception 'TAXONOMY_SCOPE_DENIED';end if;
 if b.status not in('validated','partial','running')or b.lease_until>now()or(b.status='running'and b.lease_until is null and b.updated_at>now()-interval '10 minutes')then raise exception 'TAXONOMY_LEASE_CONFLICT';end if;
 update public.angelcare_marketplace_population_batches set lease_token=gen_random_uuid(),lease_until=now()+interval '90 seconds',status='running',revision=revision+1,updated_at=now()where id=p_id returning * into b;return to_jsonb(b);
end $$;
create or replace function angelcare_private.import_r2_category_write(p_value jsonb)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare cols text;updates text;result jsonb;
begin
 select string_agg(format('%I',attname),',' order by attnum),string_agg(format('%I=excluded.%I',attname,attname),',' order by attnum)filter(where attname not in('id','created_at','created_by'))into cols,updates from pg_attribute where attrelid='public.angelcare_marketplace_catalog_categories'::regclass and attnum>0 and not attisdropped and attgenerated='' and p_value?attname;
 execute format('insert into public.angelcare_marketplace_catalog_categories(%1$s)select %1$s from jsonb_populate_record(null::public.angelcare_marketplace_catalog_categories,$1)on conflict(id)do update set %2$s returning to_jsonb(angelcare_marketplace_catalog_categories)',cols,updates)into result using p_value;return result;
end $$;
create or replace function public.angelcare_import_r2_taxonomy_apply(p_id uuid,p_lease uuid,p_key text,p_actor uuid,p_territory uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;p jsonb;row_value jsonb;current_value jsonb;after_value jsonb;parent_id uuid;key_id uuid;clear text[];receipts jsonb='[]';applied jsonb;v_locale text;existing_applied jsonb;
begin
 select * into b from public.angelcare_marketplace_population_batches where id=p_id and schema_key='catalog-taxonomy'for update;
 if not found or(p_territory is not null and b.territory_id is distinct from p_territory)then raise exception 'TAXONOMY_SCOPE_DENIED';end if;
 if b.status<>'running'or b.lease_token is distinct from p_lease or b.lease_until<=now()then raise exception 'TAXONOMY_LEASE_CONFLICT';end if;
 if exists(select 1 from jsonb_array_elements(coalesce(b.result->'applied','[]'))v where v->>'key'=p_key and jsonb_typeof(v->'records')='array')then return to_jsonb(b);end if;
 if not exists(select 1 from jsonb_array_elements(b.settings->'plan')v where v->>'key'=p_key)then raise exception 'TAXONOMY_KEY_DENIED';end if;
 for p in select value from jsonb_array_elements(b.settings->'plan')where value->>'key'=p_key loop
  row_value=p->'row';v_locale=p->>'locale';clear=string_to_array(coalesce(row_value->>'_clear_fields',''),'|');
  select to_jsonb(c)into current_value from public.angelcare_marketplace_catalog_categories c where c.category_key=p_key and c.locale=v_locale and c.territory_id is not distinct from p_territory and c.status<>'archived'for update;
  select v into existing_applied from jsonb_array_elements(coalesce(b.result->'applied','[]'))v where v->>'key'=p_key and v->>'locale'=v_locale;
  if existing_applied is not null then
   if current_value->>'id' is distinct from existing_applied->>'id'or(current_value->>'updated_at')::timestamptz is distinct from(existing_applied->>'afterUpdatedAt')::timestamptz then raise exception 'TAXONOMY_LATER_EDIT_CONFLICT';end if;
   receipts=receipts||jsonb_build_array(jsonb_build_object('key',p_key,'locale',v_locale,'before',p->'before','after',current_value));continue;
  end if;
  if current_value is distinct from nullif(p->'before','null'::jsonb)then raise exception 'TAXONOMY_CHANGED';end if;
  key_id=coalesce((current_value->>'id')::uuid,gen_random_uuid());parent_id=(current_value->>'parent_category_id')::uuid;
  if nullif(row_value->>'parent_key','')is not null then
   select c.id into parent_id from public.angelcare_marketplace_catalog_categories c where c.category_key=row_value->>'parent_key'and c.locale=v_locale and c.territory_id is not distinct from p_territory and c.status<>'archived'for key share;
   if parent_id is null then raise exception 'TAXONOMY_PARENT_MISSING';end if;
  elsif 'parent_key'=any(clear)then parent_id=null;end if;
  if parent_id is not null and exists(with recursive ancestors(id,parent,path)as(select c.id,c.parent_category_id,array[c.id]from public.angelcare_marketplace_catalog_categories c where c.id=parent_id union all select c.id,c.parent_category_id,a.path||c.id from ancestors a join public.angelcare_marketplace_catalog_categories c on c.id=a.parent where not(c.id=any(a.path)))select 1 from ancestors where id=key_id)then raise exception 'TAXONOMY_CYCLE';end if;
  after_value=coalesce(current_value,'{}')||jsonb_build_object('id',key_id,'category_key',p_key,'locale',v_locale,'parent_category_id',parent_id,'territory_id',p_territory,'updated_by',p_actor,'updated_at',now());
  if current_value is null then after_value=after_value||jsonb_build_object('title',row_value->>('title_'||v_locale),'slug',coalesce(nullif(row_value->>('slug_'||v_locale),''),p_key),'status','draft','visible',false,'sort_order',100,'created_by',p_actor);end if;
  if nullif(row_value->>('title_'||v_locale),'')is not null then after_value=after_value||jsonb_build_object('title',row_value->>('title_'||v_locale));end if;
  if nullif(row_value->>('slug_'||v_locale),'')is not null then after_value=after_value||jsonb_build_object('slug',row_value->>('slug_'||v_locale));end if;
  if nullif(row_value->>('short_description_'||v_locale),'')is not null or ('short_description_'||v_locale)=any(clear)then after_value=after_value||jsonb_build_object('short_description',nullif(row_value->>('short_description_'||v_locale),''));end if;
  for v_locale in select unnest(array['cover_asset_url','mobile_cover_asset_url','visual_theme','storefront_template'])loop
   if nullif(row_value->>v_locale,'')is not null or v_locale=any(clear)then after_value=after_value||jsonb_build_object(v_locale,nullif(row_value->>v_locale,''));end if;
  end loop;v_locale=p->>'locale';
  if nullif(row_value->>'sort_order','')is not null then after_value=after_value||jsonb_build_object('sort_order',(row_value->>'sort_order')::integer);end if;
  if nullif(row_value->>'allowed_sellable_types','')is not null or 'allowed_sellable_types'=any(clear)then after_value=after_value||jsonb_build_object('allowed_sellable_types',to_jsonb(coalesce(string_to_array(nullif(row_value->>'allowed_sellable_types',''),'|'),'{}'::text[])));end if;
  if nullif(row_value->>('seo_title_'||v_locale),'')is not null or ('seo_title_'||v_locale)=any(clear)then after_value=jsonb_set(after_value,'{seo_metadata}',coalesce(after_value->'seo_metadata','{}')||jsonb_build_object('title',row_value->>('seo_title_'||v_locale)));end if;
  if nullif(row_value->>('seo_description_'||v_locale),'')is not null or ('seo_description_'||v_locale)=any(clear)then after_value=jsonb_set(after_value,'{seo_metadata}',coalesce(after_value->'seo_metadata','{}')||jsonb_build_object('description',row_value->>('seo_description_'||v_locale)));end if;
  after_value=angelcare_private.import_r2_category_write(after_value);
  receipts=receipts||jsonb_build_array(jsonb_build_object('key',p_key,'locale',v_locale,'before',p->'before','after',after_value));
 end loop;
 select coalesce(jsonb_agg(v),'[]')into applied from jsonb_array_elements(coalesce(b.result->'applied','[]'))v where v->>'key'<>p_key;
 applied=applied||jsonb_build_array(jsonb_build_object('key',p_key,'records',receipts));
 update public.angelcare_marketplace_population_batches set result=result||jsonb_build_object('applied',applied),lease_until=now()+interval '90 seconds',updated_at=now()where id=p_id returning * into b;return to_jsonb(b);
end $$;
create or replace function public.angelcare_import_r2_taxonomy_finish(p_id uuid,p_lease uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;total integer;received integer;
begin
 select * into b from public.angelcare_marketplace_population_batches where id=p_id and lease_token=p_lease for update;if not found then raise exception 'TAXONOMY_LEASE_CONFLICT';end if;
 select count(distinct v->>'key')into total from jsonb_array_elements(b.settings->'plan')v;
 select count(*)into received from jsonb_array_elements(coalesce(b.result->'applied','[]'))v where jsonb_typeof(v->'records')='array';
 update public.angelcare_marketplace_population_batches set result=result||jsonb_build_object('records',received,'remaining',total-received),status=case when received=total then 'completed'else 'validated'end,lease_token=null,lease_until=null,revision=revision+1,updated_at=now()where id=p_id returning * into b;return to_jsonb(b);
end $$;
create or replace function public.angelcare_import_r2_taxonomy_rollback(p_id uuid,p_key text,p_actor uuid,p_territory uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.angelcare_marketplace_population_batches%rowtype;entry jsonb;receipt jsonb;current_value jsonb;restored jsonb='[]';remaining integer;
begin
 select * into b from public.angelcare_marketplace_population_batches where id=p_id and schema_key='catalog-taxonomy' for update;
 if not found or(p_territory is not null and b.territory_id is distinct from p_territory)then raise exception 'TAXONOMY_SCOPE_DENIED';end if;
 if b.lease_until>now() or b.status='running' then raise exception 'TAXONOMY_LEASE_CONFLICT';end if;
 if exists(select 1 from jsonb_array_elements(coalesce(b.result->'rolledBack','[]'))v where v->>'key'=p_key)then return to_jsonb(b);end if;
 select v into receipt from jsonb_array_elements(coalesce(b.result->'applied','[]'))v where v->>'key'=p_key and jsonb_typeof(v->'records')='array';
 if receipt is null then raise exception 'TAXONOMY_RECEIPT_REQUIRED';end if;
 for entry in select value from jsonb_array_elements(receipt->'records')loop
  select to_jsonb(c) into current_value from public.angelcare_marketplace_catalog_categories c where c.id=(entry->'after'->>'id')::uuid for update;
  if current_value is distinct from entry->'after' then raise exception 'TAXONOMY_LATER_EDIT_CONFLICT';end if;
  if exists(select 1 from public.angelcare_marketplace_catalog_item_categories where category_id=(entry->'after'->>'id')::uuid) or exists(select 1 from public.angelcare_marketplace_catalog_categories where parent_category_id=(entry->'after'->>'id')::uuid and status<>'archived')then raise exception 'TAXONOMY_USED_BRANCH_CONFLICT';end if;
 end loop;
 for entry in select value from jsonb_array_elements(receipt->'records')loop
  if nullif(entry->'before','null'::jsonb)is null then
   update public.angelcare_marketplace_catalog_categories set status='archived',visible=false,updated_at=now(),updated_by=p_actor where id=(entry->'after'->>'id')::uuid;
  else perform angelcare_private.import_r2_category_write(entry->'before');end if;
 end loop;
 restored=coalesce(b.result->'rolledBack','[]')||jsonb_build_array(jsonb_build_object('key',p_key,'at',now(),'actor',p_actor));
 select count(*)into remaining from jsonb_array_elements(coalesce(b.result->'applied','[]'))v where jsonb_typeof(v->'records')='array'and not exists(select 1 from jsonb_array_elements(restored)x where x->>'key'=v->>'key');
 update public.angelcare_marketplace_population_batches set result=result||jsonb_build_object('rolledBack',restored),status=case when remaining=0 then 'rolled_back'else 'partial'end,revision=revision+1,updated_at=now()where id=p_id returning * into b;
 return to_jsonb(b);
end $$;

revoke all on function angelcare_private.import_r2_category_write(jsonb)from public,anon,authenticated;
revoke all on function public.angelcare_import_r2_taxonomy_claim(uuid,uuid,uuid),public.angelcare_import_r2_taxonomy_apply(uuid,uuid,text,uuid,uuid),public.angelcare_import_r2_taxonomy_finish(uuid,uuid),public.angelcare_import_r2_taxonomy_rollback(uuid,text,uuid,uuid)from public,anon,authenticated;
grant execute on function public.angelcare_import_r2_taxonomy_claim(uuid,uuid,uuid),public.angelcare_import_r2_taxonomy_apply(uuid,uuid,text,uuid,uuid),public.angelcare_import_r2_taxonomy_finish(uuid,uuid),public.angelcare_import_r2_taxonomy_rollback(uuid,text,uuid,uuid)to service_role;
notify pgrst,'reload schema';
commit;
