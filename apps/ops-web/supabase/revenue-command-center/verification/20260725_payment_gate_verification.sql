-- Read-only payment gate and Finance-source verification
-- Uses correlated aggregates to avoid cross-product inflation across requirements,
-- confirmations, handoffs and promises.
select
  c.id,
  c.reference,
  c.contract_value,
  c.currency,
  c.payment_gate_status,
  (
    select coalesce(sum(req.amount),0)
    from public.revenue_payment_requirements req
    where req.contract_id=c.id
      and req.activation_blocking
      and req.status not in ('waived','cancelled')
  ) as blocking_required,
  (
    select coalesce(sum(pc.confirmed_amount),0)
    from public.revenue_payment_confirmations pc
    where pc.contract_id=c.id
      and pc.reconciliation_status in ('confirmed','partial')
  ) as confirmed_amount,
  (
    select count(*)
    from public.revenue_finance_handoffs fh
    where fh.contract_id=c.id
      and fh.status='accepted'
  ) as accepted_finance_handoffs,
  (
    select count(*)
    from public.revenue_payment_promises pp
    where pp.contract_id=c.id
      and pp.status='broken'
  ) as broken_promises
from public.revenue_contracts c
order by c.updated_at desc;
