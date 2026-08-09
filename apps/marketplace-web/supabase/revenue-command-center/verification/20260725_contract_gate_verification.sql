-- Read-only contract gate verification
select
  c.id,c.reference,c.status,c.approval_status,c.signature_status,c.effectiveness_status,c.payment_gate_status,c.activation_status,
  count(distinct s.id) filter(where s.required) required_signatories,
  count(distinct s.id) filter(where s.required and s.status='signed') signed_signatories,
  count(distinct cond.id) filter(where cond.required and cond.status not in ('verified','waived','not_applicable')) pending_conditions,
  count(distinct g.id) filter(where g.mandatory and g.status='failed') failed_activation_gates,
  count(distinct r.id) filter(where r.severity='critical' and r.status in ('open','monitoring')) critical_risks
from public.revenue_contracts c
left join public.revenue_contract_signatories s on s.contract_id=c.id
left join public.revenue_contract_conditions cond on cond.contract_id=c.id
left join public.revenue_activation_gates g on g.contract_id=c.id
left join public.revenue_contract_risks r on r.contract_id=c.id
group by c.id,c.reference,c.status,c.approval_status,c.signature_status,c.effectiveness_status,c.payment_gate_status,c.activation_status
order by c.updated_at desc;
