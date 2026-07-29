-- Phase 11 leakage and intervention integrity verification
select
  (select count(*) from public.revenue_executive_interventions
   where status not in ('closed','rejected','cancelled') and nullif(owner_label,'') is null) as active_interventions_without_owner,
  (select count(*) from public.revenue_executive_interventions
   where status='closed' and not exists (
     select 1 from public.revenue_executive_intervention_outcomes o where o.intervention_id=revenue_executive_interventions.id
   )) as closed_interventions_without_outcome,
  (select count(*) from public.revenue_executive_intervention_outcomes
   where nullif(evidence_reference,'') is null) as outcomes_without_evidence,
  (select count(*) from public.revenue_executive_decisions
   where nullif(reason,'') is null or nullif(evidence_reference,'') is null) as decisions_without_reason_or_evidence,
  (select count(*) from (
     select source_entity_type,source_entity_id,count(*)
     from public.revenue_executive_interventions
     where source_entity_id is not null and status not in ('closed','rejected','cancelled')
     group by source_entity_type,source_entity_id having count(*)>1
   ) d) as duplicate_active_interventions,
  (select count(*) from public.revenue_executive_leakage_events
   where status not in ('resolved','closed','dismissed') and nullif(owner_label,'') is null) as open_leakage_without_owner;

select
  i.id,i.intervention_key,i.title,i.status,i.affected_value_mad,i.owner_label,i.due_at,
  o.protected_value_mad,o.recovered_value_mad,o.lost_value_mad,o.evidence_reference
from public.revenue_executive_interventions i
left join public.revenue_executive_intervention_outcomes o on o.intervention_id=i.id
order by i.created_at desc;
