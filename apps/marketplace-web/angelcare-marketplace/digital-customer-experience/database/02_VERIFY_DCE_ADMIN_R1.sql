-- Read-only acceptance after 01_DCE_ADMIN_R1.sql. No data is changed.
select n as object_name,to_regclass('public.'||n) is not null as installed,
 case when to_regclass('public.'||n) is not null then obj_description(to_regclass('public.'||n),'pg_class')='ANGELCARE_DCE_ADMIN_R1' else false end as owned,
 coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.'||n)),false) as rls_enabled
from unnest(array['ac_dce_records','ac_dce_versions','ac_dce_releases','ac_dce_events','ac_dce_commands','ac_dce_jobs','ac_dce_job_lines','ac_dce_links'])n;
select p.proname as function_name,obj_description(p.oid,'pg_proc')='ANGELCARE_DCE_ADMIN_R1' as owned,p.prosecdef as security_definer,
 case when exists(select 1 from pg_roles where rolname='anon') then not has_function_privilege('anon',p.oid,'EXECUTE') else true end as anon_denied,
 case when exists(select 1 from pg_roles where rolname='authenticated') then not has_function_privilege('authenticated',p.oid,'EXECUTE') else true end as customer_role_denied
from pg_proc p where p.pronamespace='public'::regnamespace and p.proname like 'ac_dce_%' order by p.proname;
select kind,lifecycle,count(*) as dossiers,count(*) filter(where published_release_id is not null) as released from public.ac_dce_records group by kind,lifecycle order by kind,lifecycle;
select state,count(*) as releases from public.ac_dce_releases group by state;
select 'Public routes remain gated until Chapter 2. No Google approval or live advertising is implied by these checks.' as acceptance_boundary;
