begin;

-- Data-preserving rollback: disable the new operator surfaces while preserving
-- products, categories, media, placements, versions, publication history and transactions.
update public.angelcare_marketplace_modules
set status='disabled',enabled=false,health_status='unknown',updated_at=now()
where module_key='complete-commerce-administration-universe';

update public.angelcare_marketplace_feature_flags
set enabled=false,status='inactive',reason='Safe rollback requested',updated_at=now()
where flag_key='marketplace.complete-commerce-administration.enabled';

update public.angelcare_marketplace_merchandising_rules
set status='paused',updated_at=now()
where status='active';

insert into public.angelcare_marketplace_commerce_publication_events(
 object_type,object_id,action,status,affected_paths,error_message,completed_at
) values(
 'complete-commerce-administration-universe','module','safe_rollback','rolled_back','{}'::text[],
 'Operator interface disabled; all commercial records and histories preserved.',now()
);

commit;
