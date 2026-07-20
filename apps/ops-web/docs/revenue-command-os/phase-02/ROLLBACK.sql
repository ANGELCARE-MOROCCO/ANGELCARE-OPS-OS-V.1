-- ANGELCARE Revenue Command OS Mega ZIP 2 rollback
-- WARNING: destroys Phase 2 Digital Twin data only. Phase 1 foundation and legacy Revenue Command Center remain.
begin;

delete from public.revenue_os_feature_flags where flag_key in ('revenue_os.digital_twin','revenue_os.digital_twin_mutations');
delete from public.revenue_os_workspaces where workspace_key = 'digital-twin';
delete from public.revenue_os_permission_registry where permission_key = 'revenue_os.digital_twin.manage';
delete from public.revenue_os_system_checks where check_key = 'digital-twin-model';

drop table if exists public.revenue_os_model_approval_requests cascade;
drop table if exists public.revenue_os_model_owners cascade;
drop table if exists public.revenue_os_digital_twin_change_log cascade;
drop table if exists public.revenue_os_digital_twin_versions cascade;
drop table if exists public.revenue_os_digital_twin_gaps cascade;
drop table if exists public.revenue_os_digital_twin_validations cascade;
drop table if exists public.revenue_os_referral_paths cascade;
drop table if exists public.revenue_os_renewal_paths cascade;
drop table if exists public.revenue_os_upsell_paths cascade;
drop table if exists public.revenue_os_cross_sell_paths cascade;
drop table if exists public.revenue_os_growth_paths cascade;
drop table if exists public.revenue_os_seasonal_windows cascade;
drop table if exists public.revenue_os_revenue_dependencies cascade;
drop table if exists public.revenue_os_delivery_constraints cascade;
drop table if exists public.revenue_os_capacity_requirements cascade;
drop table if exists public.revenue_os_capacity_types cascade;
drop table if exists public.revenue_os_discount_rules cascade;
drop table if exists public.revenue_os_margin_rules cascade;
drop table if exists public.revenue_os_cost_models cascade;
drop table if exists public.revenue_os_offer_prices cascade;
drop table if exists public.revenue_os_pricing_models cascade;
drop table if exists public.revenue_os_price_books cascade;
drop table if exists public.revenue_os_stage_requirements cascade;
drop table if exists public.revenue_os_sales_journey_stages cascade;
drop table if exists public.revenue_os_sales_journeys cascade;
drop table if exists public.revenue_os_sales_channels cascade;
drop table if exists public.revenue_os_offer_territory_availability cascade;
drop table if exists public.revenue_os_markets cascade;
drop table if exists public.revenue_os_territories cascade;
drop table if exists public.revenue_os_cities cascade;
drop table if exists public.revenue_os_regions cascade;
drop table if exists public.revenue_os_decision_maker_profiles cascade;
drop table if exists public.revenue_os_segment_offer_fit cascade;
drop table if exists public.revenue_os_segment_pain_points cascade;
drop table if exists public.revenue_os_segment_needs cascade;
drop table if exists public.revenue_os_customer_segments cascade;
drop table if exists public.revenue_os_offer_relationships cascade;
drop table if exists public.revenue_os_offer_bundle_items cascade;
drop table if exists public.revenue_os_offer_bundles cascade;
drop table if exists public.revenue_os_offer_formats cascade;
drop table if exists public.revenue_os_offer_versions cascade;
drop table if exists public.revenue_os_offers cascade;
drop table if exists public.revenue_os_offer_families cascade;
drop table if exists public.revenue_os_business_units cascade;

commit;
