-- Guarded compatibility rollback. This restores legacy broad authenticated policies.
-- It intentionally retains additive schema and data.
do $$
begin
  if current_setting('app.ambassador_hardening_allow_security_regression', true) is distinct from 'true' then
    raise exception 'Rollback blocked. Set app.ambassador_hardening_allow_security_regression=true only after security approval.';
  end if;
end $$;

begin;

-- Remove hardened policies from operational tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'market_os_ambassadors','market_os_ambassador_territories','market_os_ambassador_missions',
    'market_os_ambassador_recruitment','market_os_ambassador_leads','market_os_ambassador_conversions',
    'market_os_ambassador_onboarding','market_os_ambassador_training','market_os_ambassador_goals',
    'market_os_ambassador_incentives','market_os_ambassador_proofs','market_os_ambassador_payouts',
    'market_os_ambassador_reports','market_os_ambassador_settings','market_os_ambassador_audit_logs',
    'market_os_ambassador_mission_assignments','market_os_ambassador_territory_assignments'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_scoped_delete', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_authenticated_all', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', table_name || '_authenticated_all', table_name);
  end loop;
end $$;

-- Restore audit mutability only for legacy compatibility; application rollback should be preferred.
drop trigger if exists trg_market_os_ambassador_audit_immutable on public.market_os_ambassador_audit_logs;

commit;
