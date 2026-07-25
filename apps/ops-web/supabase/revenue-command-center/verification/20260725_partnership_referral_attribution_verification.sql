-- ANGELCARE Revenue Command Center — Mega ZIP 8
-- Read-only referral attribution and authoritative-event lineage verification.
-- Every issue_count should be 0.

select 'ORPHAN_REFERRAL_PARTNERSHIP' as check_name,count(*) as issue_count
from public.revenue_partner_referrals r
left join public.revenue_partnerships p on p.id=r.partnership_id
where p.id is null
union all
select 'ORPHAN_ATTRIBUTION_REFERRAL',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_partner_referrals r on r.id=a.referral_id
where r.id is null
union all
select 'OPEN_CONFLICT_WITH_CONFIRMED_ATTRIBUTION',count(*)
from public.revenue_partner_attribution_conflicts c
join public.revenue_partner_referral_attributions a
  on a.referral_id=c.referral_id and a.status in ('confirmed','attributed','active')
where c.status='open'
union all
select 'PROSPECT_ATTRIBUTION_WITHOUT_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_prospects p on a.event_type='prospect_created' and p.id=a.event_id
where a.event_type='prospect_created' and p.id is null
union all
select 'OPPORTUNITY_ATTRIBUTION_WITHOUT_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_opportunities o
  on a.event_type='opportunity_created'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and o.id=a.event_id::uuid
where a.event_type='opportunity_created' and o.id is null
union all
select 'MEETING_ATTRIBUTION_WITHOUT_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_appointments m
  on a.event_type='meeting_completed'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and m.id=a.event_id::uuid
 and m.status in ('completed','done')
where a.event_type='meeting_completed' and m.id is null
union all
select 'PROPOSAL_ATTRIBUTION_WITHOUT_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_proposals p
  on a.event_type='proposal_created'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and p.id=a.event_id::uuid
 and p.status not in ('withdrawn','archived')
where a.event_type='proposal_created' and p.id is null
union all
select 'CONTRACT_ATTRIBUTION_WITHOUT_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_contracts c
  on a.event_type='contract_signed'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and c.id=a.event_id::uuid
 and c.status in ('fully_signed','conditions_pending','effective','activation_pending','active','completed')
where a.event_type='contract_signed' and c.id is null
union all
select 'PAYMENT_ATTRIBUTION_WITHOUT_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_payment_confirmations pc
  on a.event_type='payment_confirmed'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and pc.id=a.event_id::uuid
 and pc.reconciliation_status in ('confirmed','partial')
where a.event_type='payment_confirmed' and pc.id is null
union all
select 'REALIZED_ATTRIBUTION_WITHOUT_REALIZATION_EVENT',count(*)
from public.revenue_partner_referral_attributions a
left join public.revenue_realization_events e
  on a.event_type='revenue_realized'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and e.id=a.event_id::uuid
where a.event_type='revenue_realized' and e.id is null
union all
select 'REALIZED_ATTRIBUTION_WITHOUT_COMMERCIAL_LINEAGE',count(*)
from public.revenue_partner_referral_attributions a
join public.revenue_partner_referrals rf on rf.id=a.referral_id
join public.revenue_realization_events e
  on a.event_type='revenue_realized'
 and a.event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 and e.id=a.event_id::uuid
join public.revenue_contracts c on c.id=e.contract_id
where a.event_type='revenue_realized'
  and not (
    c.partnership_id=rf.partnership_id::text
    or (rf.linked_prospect_id is not null and c.prospect_id=rf.linked_prospect_id)
    or (rf.linked_opportunity_id is not null and c.opportunity_id=rf.linked_opportunity_id)
  )
union all
select 'ACTIVE_ATTRIBUTION_FOR_REVERSED_REALIZATION',count(*)
from public.revenue_partner_referral_attributions a
join public.revenue_realization_events reversal
  on reversal.reversal_of_id::text=a.event_id and reversal.status='reversed'
where a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')
union all
select 'ATTRIBUTION_WITHOUT_EVIDENCE',count(*)
from public.revenue_partner_referral_attributions
where coalesce(trim(evidence_reference),'')=''
union all
select 'DUPLICATE_REFERRAL_EVENT_ATTRIBUTION',coalesce(sum(record_count-1),0)::bigint
from (
  select referral_id,event_type,event_id,count(*) record_count
  from public.revenue_partner_referral_attributions
  group by referral_id,event_type,event_id
  having count(*)>1
) duplicate_records
union all
select 'PRE_EXISTING_PROSPECT_WITHOUT_CONFLICT_REVIEW',count(*)
from public.revenue_partner_referrals r
where r.status='duplicate_review'
  and r.linked_prospect_id is not null
  and not exists(
    select 1 from public.revenue_partner_attribution_conflicts c
    where c.referral_id=r.id and c.conflict_type='pre_existing_prospect'
  );

-- No commercial event may receive more than 100% of active attribution.
select event_type,event_id,
  sum(attribution_share) as total_share,
  sum(attributed_value) as total_attributed_value,
  count(*) as attribution_records
from public.revenue_partner_referral_attributions
where status in ('confirmed','attributed','active')
group by event_type,event_id
having sum(attribution_share)>100.0001
order by total_share desc;

-- Stored partner realized value must equal authoritative active realized attribution.
select p.id,p.partner_name,
  coalesce(sum(a.attributed_value) filter(where a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')),0) as calculated_realized_mad,
  p.attributed_realized_mad as stored_realized_mad,
  coalesce(sum(a.attributed_value) filter(where a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')),0)-coalesce(p.attributed_realized_mad,0) as difference
from public.revenue_partnerships p
left join public.revenue_partner_referral_attributions a on a.partnership_id=p.id
group by p.id,p.partner_name,p.attributed_realized_mad
having abs(coalesce(sum(a.attributed_value) filter(where a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')),0)-coalesce(p.attributed_realized_mad,0))>0.01
order by abs(coalesce(sum(a.attributed_value) filter(where a.event_type='revenue_realized' and a.status in ('confirmed','attributed','active')),0)-coalesce(p.attributed_realized_mad,0)) desc;
