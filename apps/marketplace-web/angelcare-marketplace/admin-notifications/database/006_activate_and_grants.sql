-- AC-NOTIFY-PROMAX-R1 / 6. Activate capture and service-only capabilities.
begin;
select public.ac_nc_install_hooks();
do $$begin
 if to_regclass('public.ac_dce_activity_v2')is not null then
 drop trigger if exists ac_nc_activity_r1 on public.ac_dce_activity_v2;
 create trigger ac_nc_activity_r1 after insert on public.ac_dce_activity_v2 for each row execute function public.ac_nc_aggregate_activity();
 update ac_nc_sources set state='connected',reason='AGGREGATION_INSTALLED',installed_at=now(),checked_at=now()where id='ac_dce_activity_v2';
 end if;
end $$;
do $$declare f record;begin
 for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname like 'ac_nc_%'loop
 execute format('revoke all on function %s from public,anon,authenticated',f.sig);
 execute format('grant execute on function %s to service_role',f.sig);
 comment on table public.ac_nc_events is 'AC-NOTIFY-PROMAX-R1: internal safe event projection; no outbound messaging';
 end loop;
end $$;
grant usage,select on sequence public.ac_nc_events_id_seq,public.ac_nc_policy_changes_id_seq to service_role;
commit;
-- This report is installation evidence, not a live acceptance claim.
select state,reason,count(*)from public.ac_nc_sources group by state,reason order by state,reason;
