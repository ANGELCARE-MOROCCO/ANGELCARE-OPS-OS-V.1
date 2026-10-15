-- Additive protection for the new contact centre only. Existing inquiries are not changed.
begin;
do $$ declare existing_index regclass; begin
 if to_regclass('public.angelcare_marketplace_public_inquiries') is null then
  raise exception 'Native public inquiry table is missing. Stop: do not create a second inquiry engine.';
 end if;
 existing_index := to_regclass('public.angelcare_contact_submission_key_r1_uq');
 if existing_index is not null then
  if obj_description(existing_index,'pg_class') is distinct from 'ANGELCARE_PUBLIC_DISCOVERY_CONTACT_R1: contact submission idempotency; no existing receipt mutation' then
   raise exception 'Existing index name belongs to another definition. No change applied.';
  end if;
 end if;
end $$;
create unique index if not exists angelcare_contact_submission_key_r1_uq
 on public.angelcare_marketplace_public_inquiries ((source_metadata->>'submissionKey'))
 where source_metadata->>'entry'='contact-centre-r1'
 and source_metadata->>'submissionKey' is not null;
comment on index public.angelcare_contact_submission_key_r1_uq is 'ANGELCARE_PUBLIC_DISCOVERY_CONTACT_R1: contact submission idempotency; no existing receipt mutation';
commit;
select 'CONTACT_SUBMISSION_GUARD=READY' as result;
