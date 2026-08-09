-- Read-only realization integrity verification
select
  c.id,c.reference,c.contract_value,c.realized_value,c.realization_status,c.activation_status,c.effectiveness_status,
  coalesce(sum(re.amount) filter(where re.status in ('realized','partially_realized')),0) ledger_realized,
  count(re.id) filter(where re.finance_reference is null or re.evidence_reference is null) invalid_evidence_count,
  case when c.realized_value=coalesce(sum(re.amount) filter(where re.status in ('realized','partially_realized')),0) then 'PASS' else 'MISMATCH' end reconciliation
from public.revenue_contracts c
left join public.revenue_realization_events re on re.contract_id=c.id
group by c.id,c.reference,c.contract_value,c.realized_value,c.realization_status,c.activation_status,c.effectiveness_status
order by c.updated_at desc;

-- Duplicate and reversal integrity controls
select contract_id,finance_reference,status,count(*) as duplicate_count
from public.revenue_realization_events
group by contract_id,finance_reference,status
having count(*)>1;

select reversal_of_id,count(*) as reversal_count
from public.revenue_realization_events
where reversal_of_id is not null
group by reversal_of_id
having count(*)>1;

select
  c.id,
  c.reference,
  c.realized_value,
  coalesce(sum(re.amount),0) as signed_ledger_balance,
  case when c.realized_value=greatest(0,coalesce(sum(re.amount),0)) then 'PASS' else 'MISMATCH' end as reversal_reconciliation
from public.revenue_contracts c
left join public.revenue_realization_events re
  on re.contract_id=c.id and re.status in ('realized','partially_realized','reversed')
group by c.id,c.reference,c.realized_value
order by c.updated_at desc;
