-- Source rollback and SQL rollback must be coordinated. Does not delete cases, music or calls.
begin;
set local lock_timeout='8s';
do $$declare r record;definitions jsonb;begin
 perform pg_advisory_xact_lock(817510);
 select installed_definitions into definitions from public.ac_hotline_manual_r5_backup where id;
 if definitions is null then raise exception 'NO_R5_BACKUP';end if;
 for r in select * from jsonb_each_text(definitions) loop
  if pg_get_functiondef(to_regprocedure(r.key)) is distinct from r.value then raise exception 'LATER_SQL_EDIT_PRESERVED: %',r.key;end if;
 end loop;
 if exists(select 1 from public.ac_hotline_sessions where state in('queued','offered','connecting','connected')) then raise exception 'ACTIVE_RECEPTIONS_RETAINED: finish active receptions before SQL rollback';end if;
 for r in select * from jsonb_each_text((select original_definitions from public.ac_hotline_manual_r5_backup where id)) loop execute r.value;end loop;
end $$;
drop function public.ac_hotline_presence_r5(uuid,text);
drop function public.ac_hotline_pickup_r5(uuid,uuid);
drop table public.ac_hotline_manual_r5_backup;
notify pgrst,'reload schema';
commit;
select 'HOTLINE_MANUAL_RECEPTION_R5=ROLLED_BACK' as result;
