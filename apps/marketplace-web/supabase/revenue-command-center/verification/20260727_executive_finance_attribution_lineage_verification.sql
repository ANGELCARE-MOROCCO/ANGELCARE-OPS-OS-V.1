-- Phase 11 authoritative Finance, realization and attribution lineage verification
select
  to_regclass('public.revenue_contracts') is not null as contracts_available,
  to_regclass('public.revenue_payment_confirmations') is not null as payment_confirmations_available,
  to_regclass('public.revenue_realization_events') is not null as realization_events_available,
  to_regclass('public.revenue_partner_referral_attributions') is not null as partner_attribution_available,
  to_regclass('public.revenue_campaign_attributions') is not null as campaign_attribution_available;

select
  (select coalesce(sum(greatest(coalesce(amount,0),0)),0)
   from public.revenue_realization_events
   where coalesce(status,'confirmed') not in ('reversed','cancelled','canceled','void','rejected')) as authoritative_realized_mad,
  (select coalesce(sum(greatest(coalesce(amount,0),0)),0)
   from public.revenue_realization_events
   where coalesce(status,'') in ('reversed','cancelled','canceled','void','rejected')) as reversed_realization_mad,
  (select coalesce(sum(greatest(coalesce(confirmed_amount,0),0)),0)
   from public.revenue_payment_confirmations
   where coalesce(reconciliation_status,'confirmed') in ('confirmed','partial')) as finance_confirmed_mad;

select
  (select count(*) from (
     select event_id,coalesce(sum(attribution_share),0) as share
     from public.revenue_campaign_attributions
     where event_type in ('revenue_realization','realization')
       and coalesce(status,'active') not in ('reversed','cancelled')
     group by event_id having coalesce(sum(attribution_share),0)>100.0001
   ) x) as campaign_overallocation_events,
  (select count(*) from (
     select event_id,coalesce(sum(attribution_share),0) as share
     from public.revenue_partner_referral_attributions
     where event_type in ('revenue_realization','realization')
       and coalesce(status,'confirmed') not in ('reversed','cancelled')
     group by event_id having coalesce(sum(attribution_share),0)>100.0001
   ) x) as partner_overallocation_events;
