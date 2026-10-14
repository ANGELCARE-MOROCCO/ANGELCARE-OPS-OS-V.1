-- Align the native Sanila/360 sender metadata. Preserve historical correspondence
-- and all approval, scheduling, suppression and automation activation decisions.
begin;
update public.angelcare360_operator_email_templates
set mailbox_key='IT_SUPPORT',updated_at=now()
where mailbox_key is distinct from 'IT_SUPPORT';
update public.angelcare360_operator_email_automation_rules
set mailbox_key='IT_SUPPORT',updated_at=now()
where mailbox_key is distinct from 'IT_SUPPORT';
update public.angelcare360_operator_email_messages
set mailbox_key='IT_SUPPORT',mailbox_email='it.support@angelcarehub.ma',
    sender_email='it.support@angelcarehub.ma',updated_at=now()
where direction='outbound'
and status in ('draft','scheduled','awaiting_approval','approved','queued','retry_scheduled')
and (mailbox_key is distinct from 'IT_SUPPORT'
  or mailbox_email is distinct from 'it.support@angelcarehub.ma'
  or sender_email is distinct from 'it.support@angelcarehub.ma');
commit;
