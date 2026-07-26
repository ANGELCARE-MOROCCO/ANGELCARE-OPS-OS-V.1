-- MEGA ZIP 10 — ELIGIBILITY, SUPPRESSION, FREQUENCY AND SEQUENCE INTEGRITY
select 'duplicate_active_recipient' as issue,count(*) as issue_count
from (
  select campaign_id,coalesce(prospect_id,''),coalesce(contact_id::text,''),coalesce(contact_value_normalized,''),count(*)
  from public.revenue_campaign_recipients
  where status not in ('removed','invalid','completed')
  group by campaign_id,coalesce(prospect_id,''),coalesce(contact_id::text,''),coalesce(contact_value_normalized,'')
  having count(*)>1
) x
union all
select 'duplicate_active_enrollment',count(*) from (
  select campaign_recipient_id,sequence_version_id,count(*)
  from public.revenue_campaign_enrollments where status in ('active','paused')
  group by campaign_recipient_id,sequence_version_id having count(*)>1
) x
union all
select 'active_recipient_with_active_suppression',count(*)
from public.revenue_campaign_recipients r
where r.status not in ('removed','invalid','completed','opted_out')
  and exists(select 1 from public.revenue_campaign_suppressions s where s.status='active' and (s.expires_at is null or s.expires_at>now())
    and (s.campaign_id is null or s.campaign_id=r.campaign_id) and (s.channel='all' or s.channel=r.channel)
    and (s.prospect_id=r.prospect_id or s.contact_id=r.contact_id or s.contact_value_normalized=r.contact_value_normalized))
union all
select 'approved_sequence_without_version',count(*) from public.revenue_campaign_sequences where status='approved' and active_version_id is null
union all
select 'execution_without_recipient',count(*) from public.revenue_campaign_step_executions x left join public.revenue_campaign_recipients r on r.id=x.campaign_recipient_id where r.id is null
union all
select 'execution_without_step',count(*) from public.revenue_campaign_step_executions x left join public.revenue_campaign_sequence_steps s on s.id=x.sequence_step_id where s.id is null
union all
select 'duplicate_dispatch_idempotency',count(*) from (select idempotency_key,count(*) from public.revenue_campaign_dispatch_attempts group by idempotency_key having count(*)>1) x
union all
select 'opt_out_without_suppression',count(*) from public.revenue_campaign_replies q
where q.opt_out and not exists(select 1 from public.revenue_campaign_suppressions s where s.source_event_id=q.communication_event_id and s.status='active')
order by issue;

select decision,count(*) as decisions from public.revenue_campaign_recipient_eligibility group by decision order by decision;
select status,count(*) as executions from public.revenue_campaign_step_executions group by status order by status;
