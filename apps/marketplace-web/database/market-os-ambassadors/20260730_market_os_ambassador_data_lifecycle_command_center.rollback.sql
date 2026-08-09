begin;

drop function if exists
  public.market_os_ambassador_bulk_purge_execute(
    text,
    text,
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_bulk_purge_decide(
    text,
    text,
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_bulk_purge_preflight(
    text,
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_bulk_purge_create(
    text,
    text,
    text,
    text,
    text,
    jsonb,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_bulk_cleanup_adapters(
    text,
    text,
    text,
    text
  );

drop function if exists
  public.market_os_ambassador_bulk_adapter_preview(
    text,
    text,
    text,
    text
  );

drop table if exists
  public.market_os_ambassador_bulk_purge_items;

drop table if exists
  public.market_os_ambassador_bulk_purge_jobs;

drop table if exists
  public.market_os_ambassador_purge_adapters;

-- The authority table and its CEO policy are deliberately preserved.
-- They predate this command-center delivery and may be used by the
-- existing single-record approval and execution functions.

commit;
