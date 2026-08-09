begin;
drop view if exists public.angelcare_marketplace_category_discovery_v;
drop view if exists public.angelcare_marketplace_catalog_discovery_v;
update public.angelcare_marketplace_category_designs set visual_theme=visual_theme,updated_at=now();
-- Data-preserving rollback: tables and records remain available for audit and later reactivation.
commit;
