-- READ ONLY. Run after both R2 migrations.
with required(name)as(values
 ('public.angelcare_import_r2_snapshot(uuid)'),
 ('public.angelcare_import_r2_create(jsonb,jsonb)'),
 ('public.angelcare_import_r2_claim(uuid,uuid,uuid,uuid,integer,text)'),
 ('public.angelcare_import_r2_apply(uuid,uuid,uuid,uuid,uuid,uuid)'),
 ('public.angelcare_import_r2_release(uuid,uuid)'),
 ('public.angelcare_import_r2_rollback(uuid,uuid,uuid,uuid,uuid)'),
 ('public.angelcare_import_r2_taxonomy_claim(uuid,uuid,uuid)'),
 ('public.angelcare_import_r2_taxonomy_apply(uuid,uuid,text,uuid,uuid)'),
 ('public.angelcare_import_r2_taxonomy_finish(uuid,uuid)'),
 ('public.angelcare_import_r2_taxonomy_rollback(uuid,text,uuid,uuid)')
), resolved as(select name,to_regprocedure(name)as oid from required)
select name,oid is not null as installed,
 case when oid is null then false else has_function_privilege('service_role',oid,'EXECUTE')end as service_allowed,
 case when oid is null then true else has_function_privilege('anon',oid,'EXECUTE')or has_function_privilege('authenticated',oid,'EXECUTE')end as public_execution_blocker
from resolved order by name;
-- Every row: installed=true, service_allowed=true, public_execution_blocker=false.
select c.relname,c.relrowsecurity as rls_enabled,obj_description(c.oid,'pg_class')as owner_marker,
 has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE')as anon_access_blocker,
 has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE')as customer_access_blocker
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'and c.relname in('angelcare_marketplace_catalogue_import_runs','angelcare_marketplace_catalogue_import_lines');
-- Both tables: RLS=true, marker=ANGELCARE_CATALOGUE_IMPORT_R2, access blockers=false.
select count(*) as active_native_schemas from public.angelcare_marketplace_experience_schemas where status='active';
