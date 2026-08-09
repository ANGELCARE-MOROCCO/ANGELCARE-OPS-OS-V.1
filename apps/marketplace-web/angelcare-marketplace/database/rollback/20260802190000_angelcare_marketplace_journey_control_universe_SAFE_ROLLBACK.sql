begin;
update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Journey Control safely paused',updated_at=now() where flag_key='marketplace.journeys.enabled';
update public.angelcare_marketplace_modules set enabled=false,status='disabled',health_status='degraded',updated_at=now() where module_key='journey-control-universe';
update public.angelcare_marketplace_journey_policies set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_journey_notifications set status='failed',failure_reason='Journey Control safely paused',updated_at=now() where status='queued';
commit;
-- Data-preserving rollback: journey records, evidence, links, documents and audit history remain intact.
