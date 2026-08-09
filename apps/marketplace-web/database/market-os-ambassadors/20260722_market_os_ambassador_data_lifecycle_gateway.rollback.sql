begin;

delete from
  public.market_os_ambassador_role_permissions

where role_key =
      'ambassador_admin'

  and permission_key in (
    'ambassadors.lifecycle.read',
    'ambassadors.archive',
    'ambassadors.restore',
    'ambassadors.anonymize',
    'ambassadors.delete.request',
    'ambassadors.delete.approve',
    'ambassadors.delete.execute'
  );

do $drop_execute_delete$
declare
  v_function record;
begin
  for v_function in
    select p.oid::regprocedure as identity
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname =
        'market_os_ambassador_lifecycle_execute_delete'
  loop
    execute format(
      'drop function if exists %s',
      v_function.identity
    );
  end loop;
end
$drop_execute_delete$;

drop function if exists
  public.market_os_ambassador_lifecycle_decide_request(
    text,
    text,
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_lifecycle_request_delete(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_lifecycle_set_state(
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_lifecycle_preview(
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_lifecycle_dependency(
    text,
    text,
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_lifecycle_inventory(
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_lifecycle_entity_table(
    text
  );

drop table if exists
  public.market_os_ambassador_purge_ledger;

drop table if exists
  public.market_os_ambassador_lifecycle_events;

drop table if exists
  public.market_os_ambassador_lifecycle_requests;

drop table if exists
  public.market_os_ambassador_lifecycle_states;

drop function if exists
  public.market_os_ambassador_lifecycle_immutable_guard();

commit;
