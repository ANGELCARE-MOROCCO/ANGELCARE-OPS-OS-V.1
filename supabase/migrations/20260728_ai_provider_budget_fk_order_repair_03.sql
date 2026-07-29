begin;

-- AI Provider Control repair 03
-- The budget reservation is created before the governed-request parent row
-- inside the same governed transaction. Preserve the FK and defer its check.

do $preflight$
begin
  if to_regclass('public.ai_provider_budget_reservations') is null then
    raise exception 'AI_PROVIDER_BUDGET_RESERVATIONS_TABLE_MISSING';
  end if;

  if to_regclass('public.ai_provider_governed_requests') is null then
    raise exception 'AI_PROVIDER_GOVERNED_REQUESTS_TABLE_MISSING';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid =
          'public.ai_provider_budget_reservations'::regclass
      and conname =
          'ai_provider_budget_reservations_governed_request_fk'
      and contype = 'f'
  ) then
    raise exception
      'AI_PROVIDER_BUDGET_GOVERNED_REQUEST_FK_MISSING';
  end if;
end
$preflight$;

alter table public.ai_provider_budget_reservations
  alter constraint
    ai_provider_budget_reservations_governed_request_fk
  deferrable initially deferred;

do $verify$
declare
  is_deferrable boolean;
  is_initially_deferred boolean;
begin
  select
    condeferrable,
    condeferred
  into
    is_deferrable,
    is_initially_deferred
  from pg_constraint
  where conrelid =
        'public.ai_provider_budget_reservations'::regclass
    and conname =
        'ai_provider_budget_reservations_governed_request_fk'
    and contype = 'f';

  if not coalesce(is_deferrable, false) then
    raise exception
      'AI_PROVIDER_BUDGET_FK_IS_NOT_DEFERRABLE';
  end if;

  if not coalesce(is_initially_deferred, false) then
    raise exception
      'AI_PROVIDER_BUDGET_FK_IS_NOT_INITIALLY_DEFERRED';
  end if;
end
$verify$;

commit;
