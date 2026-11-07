-- Read-only production inspection. Run AFTER six migrations; no source records are modified.
begin read only;
select revision,installed_at from public.ac_nc_version;
select state,reason,count(*)as sources from public.ac_nc_sources group by state,reason order by state,reason;
select id,config->>'world'world,config->>'family'family,config->>'workspace'workspace,state,reason,last_capture_at,monitored_at from public.ac_nc_sources order by state,id;
select last_success_at,now()-last_success_at as worker_age,processed,last_error_code from public.ac_nc_worker_state;
select count(*)filter(where projected_at is null)pending,count(*)filter(where projected_at is null and attempts>=8)quarantined,min(occurred_at)filter(where projected_at is null)oldest_pending from public.ac_nc_events;
select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and left(relname,6)='ac_nc_'and relkind='r';
select p.proname,has_function_privilege('anon',p.oid,'EXECUTE')as anon_execute,has_function_privilege('authenticated',p.oid,'EXECUTE')as authenticated_execute from pg_proc p where p.pronamespace='public'::regnamespace and left(p.proname,6)='ac_nc_';
rollback;
