-- DATA BACKFILL ROLLBACK. Run before schema rollback.
-- psql: psql "$DATABASE_URL" -v bridge_run_id='...' -f 04_ULTRA_DATA_BRIDGE_BACKFILL_ROLLBACK.sql
\if :{?bridge_run_id}
\else
  \echo 'ERROR: bridge_run_id psql variable is required'
  \quit 3
\endif
begin;
select pg_advisory_xact_lock(hashtext('angelcare-browser-os-ultra-data-bridge-v1'));
select set_config('app.ultra_bridge_run_id', :'bridge_run_id', true);

-- Refuse rollback if later non-bridge operational history exists.
do $$
begin
 if exists (
   select 1 from public.browser_extension_ultra_commercial_id_map m
   join public.browser_extension_b2b_opportunities o on o.id=m.target_opportunity_id
   where m.bridge_run_id=current_setting('app.ultra_bridge_run_id', true)::uuid and m.match_method='created_from_revenue_opportunity'
     and exists (select 1 from public.browser_extension_b2b_proposal_versions p where p.opportunity_id=o.id)
 ) then raise exception 'ROLLBACK_BLOCKED: bridged opportunities have proposal history'; end if;
 if exists (
   select 1 from public.browser_extension_ultra_commercial_id_map m
   join public.browser_extension_b2b_partners p on p.id=m.target_partner_id
   where m.bridge_run_id=current_setting('app.ultra_bridge_run_id', true)::uuid and m.match_method='created_pending_partner_from_revenue_partnership'
     and (p.status<>'pending_handoff' or p.activation_status<>'not_started')
 ) then raise exception 'ROLLBACK_BLOCKED: bridged partners progressed beyond pending handoff'; end if;
end $$;

delete from public.browser_extension_b2b_partners p using public.browser_extension_ultra_commercial_id_map m
where m.bridge_run_id=current_setting('app.ultra_bridge_run_id', true)::uuid and m.match_method='created_pending_partner_from_revenue_partnership' and m.target_partner_id=p.id and p.status='pending_handoff' and p.activation_status='not_started';

delete from public.browser_extension_b2b_opportunities o using public.browser_extension_ultra_commercial_id_map m
where m.bridge_run_id=current_setting('app.ultra_bridge_run_id', true)::uuid and m.match_method='created_from_revenue_opportunity' and m.target_opportunity_id=o.id;

delete from public.b2b_prospects p using public.browser_extension_ultra_commercial_id_map m
where m.bridge_run_id=current_setting('app.ultra_bridge_run_id', true)::uuid and m.match_method='created_from_revenue_account' and m.target_prospect_id=p.id
  and not exists (select 1 from public.browser_extension_b2b_opportunities o where o.prospect_id=p.id)
  and not exists (select 1 from public.browser_extension_b2b_partners bp where bp.prospect_id=p.id);

update public.browser_extension_ultra_commercial_id_map set status='rolled_back',updated_at=now() where bridge_run_id=current_setting('app.ultra_bridge_run_id', true)::uuid;
update public.browser_extension_ultra_bridge_runs set status='rolled_back',completed_at=now(),result_summary=result_summary||jsonb_build_object('rolledBackAt',now()) where id=current_setting('app.ultra_bridge_run_id', true)::uuid;
commit;
