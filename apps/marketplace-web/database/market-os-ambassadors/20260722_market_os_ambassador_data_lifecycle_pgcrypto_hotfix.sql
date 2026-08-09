begin;

do $pgcrypto_scope_fix$
declare
  v_crypto_schema text;
begin
  /*
   * Discover the schema that actually owns pgcrypto.digest().
   * In Supabase this is normally "extensions".
   */
  select n.nspname
  into v_crypto_schema
  from pg_proc p
  join pg_namespace n
    on n.oid = p.pronamespace
  where p.proname = 'digest'
    and n.nspname not in (
      'pg_catalog',
      'information_schema'
    )
  order by
    case
      when n.nspname = 'extensions' then 0
      else 1
    end,
    n.nspname
  limit 1;

  if v_crypto_schema is null then
    raise exception
      'pgcrypto.digest() was not found. Verify that the pgcrypto extension is installed.';
  end if;

  /*
   * These four lifecycle functions directly call digest().
   * Extend their protected runtime search path without opening
   * access to uncontrolled application schemas.
   */
  execute format(
    'alter function public.market_os_ambassador_lifecycle_preview(text,text,text,text)
       set search_path = public, %I',
    v_crypto_schema
  );

  execute format(
    'alter function public.market_os_ambassador_lifecycle_set_state(text,text,text,text,text,text,text,text)
       set search_path = public, %I',
    v_crypto_schema
  );

  execute format(
    'alter function public.market_os_ambassador_lifecycle_request_delete(text,text,text,text,text,text,text,text,text)
       set search_path = public, %I',
    v_crypto_schema
  );

  execute format(
    'alter function public.market_os_ambassador_lifecycle_execute_delete(text,text,text,text,text,text)
       set search_path = public, %I',
    v_crypto_schema
  );

  raise notice
    'Ambassador lifecycle pgcrypto resolution enabled through schema %',
    v_crypto_schema;
end
$pgcrypto_scope_fix$;

commit;

select
  p.oid::regprocedure as lifecycle_function,
  p.proconfig as runtime_configuration
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'market_os_ambassador_lifecycle_preview',
    'market_os_ambassador_lifecycle_set_state',
    'market_os_ambassador_lifecycle_request_delete',
    'market_os_ambassador_lifecycle_execute_delete'
  )
order by p.proname;
