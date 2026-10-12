-- Read-only verification after the R1 migration. No imports or catalogue writes.
select obj_description(to_regclass('public.angelcare_marketplace_population_batches'),'pg_class') as migration_marker;
select p.proname, p.prosecdef as security_definer,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_role_allowed,
 has_function_privilege('anon',p.oid,'EXECUTE') as anonymous_allowed,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_allowed
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'angelcare_population_%' order by p.proname;
select public.angelcare_population_inventory(null);
select public.angelcare_population_categories(null,'fr',null,'',1,60);
select public.angelcare_population_offers(null,'',null,'','', '',1,2);
-- Expected: marker ANGELCARE_CATALOGUE_POPULATION_R1; service_role true;
-- anon/authenticated false on every public RPC; inventory/pages return JSON.
