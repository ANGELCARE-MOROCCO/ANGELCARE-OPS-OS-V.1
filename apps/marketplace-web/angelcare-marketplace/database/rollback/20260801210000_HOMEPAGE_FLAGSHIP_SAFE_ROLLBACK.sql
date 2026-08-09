begin;
-- Data-preserving rollback: suppress the Homepage Flagship orchestration while preserving
-- campaigns, collections, interactions, visitor selections and commercial evidence.
update public.angelcare_marketplace_homepage_campaigns set status='paused',updated_at=now() where status in('active','scheduled','approved');
update public.angelcare_marketplace_homepage_sections set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_homepage_collections set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_homepage_collection_items set status='suppressed',updated_at=now() where status='active';
update public.angelcare_marketplace_homepage_placements set status='suppressed',updated_at=now() where status in('active','scheduled','eligible','configured');
update public.angelcare_marketplace_homepage_audience_rules set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_homepage_territory_rules set status='paused',updated_at=now() where status='active';
update public.angelcare_marketplace_catalog_items set status='paused',updated_at=now()
where commercial_metadata->>'merchandising_source'='homepage_flagship_initial_catalog' and status='published';
commit;
