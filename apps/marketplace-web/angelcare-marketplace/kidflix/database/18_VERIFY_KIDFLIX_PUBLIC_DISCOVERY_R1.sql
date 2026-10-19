-- READ ONLY. PENDING until 17 is applied explicitly in the Marketplace SQL Editor.
select p.proname, obj_description(p.oid,'pg_proc') owner,
 has_function_privilege('anon',p.oid,'execute') anon_can_execute,
 has_function_privilege('authenticated',p.oid,'execute') authenticated_can_execute,
 has_function_privilege('service_role',p.oid,'execute') service_can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in('ac_kidflix_home','ac_kidflix_catalogue','ac_kidflix_experience')order by p.proname;
select indexname,indexdef from pg_indexes where schemaname='public'and indexname='ac_kidflix_live_host';
select key,revision,lifecycle,data->>'liveHost'public_host,
 coalesce(data->'live','{}')?'en'english_published,
 coalesce(data->'live','{}')?'fr'french_published,
 coalesce(data->'live','{}')?'ar'arabic_published
from public.ac_dce_records where kind='setting'and key='kidflix-homepage';
-- Expected: 3 owned functions, anon/authenticated=false, service=true, 1 owned unique host index.
-- A new source-only installation can correctly return no settings row; create/review it in DCE Settings.
