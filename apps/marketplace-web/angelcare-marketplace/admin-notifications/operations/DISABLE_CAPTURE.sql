-- Operational rollback: stop worker scheduling first. Retains event history, receipts and personal state.
begin;
do $$declare r record;begin
 for r in select id from public.ac_nc_sources loop
 if to_regclass('public.'||quote_ident(r.id))is not null then
 execute format('drop trigger if exists ac_nc_capture_r1 on public.%I',r.id);
 if r.id='ac_dce_activity_v2'then execute 'drop trigger if exists ac_nc_activity_r1 on public.ac_dce_activity_v2';end if;
 end if;end loop;
end $$;
update public.ac_nc_sources set enabled=false,state='disabled',reason='OPERATOR_DISABLED_CAPTURE',checked_at=now();
commit;
-- Restore backed-up app files using the installer's --rollback JOURNAL after confirming no intervening edits.
-- Re-enable deliberately: set enabled=true only for intended sources, then rerun 006_activate_and_grants.sql.
