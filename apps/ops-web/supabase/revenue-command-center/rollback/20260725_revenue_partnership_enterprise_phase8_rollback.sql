-- Controlled rollback for Mega ZIP 8.
-- Base revenue_partnerships columns are intentionally preserved to avoid deleting
-- data that may have been populated after cutover.

begin;

drop view if exists public.revenue_partner_performance_command_view;
drop view if exists public.revenue_partner_referral_command_view;
drop view if exists public.revenue_partnership_command_view;

drop trigger if exists trg_revenue_partner_realization_reversal on public.revenue_realization_events;
drop function if exists public.revenue_partner_realization_reversal_trigger();

drop function if exists public.revenue_evaluate_partner_activation(uuid,uuid,text,text);
drop function if exists public.revenue_launch_partner_renewal_workflow(uuid,text,uuid,text);
drop function if exists public.revenue_close_partner_performance_period(uuid,uuid,text,text,text);
drop function if exists public.revenue_create_partner_attribution(uuid,text,text,numeric,numeric,text,text,uuid);
drop function if exists public.revenue_accept_partner_referral(uuid,uuid,boolean,text);
drop function if exists public.revenue_partner_referral_history_trigger();
drop function if exists public.revenue_partner_touch_updated_at();

drop table if exists public.revenue_partnership_closures cascade;
drop table if exists public.revenue_partnership_risks cascade;
drop table if exists public.revenue_partnership_status_history cascade;
drop table if exists public.revenue_partner_expansions cascade;
drop table if exists public.revenue_partner_renewal_readiness cascade;
drop table if exists public.revenue_partner_recovery_checkpoints cascade;
drop table if exists public.revenue_partner_recovery_plans cascade;
drop table if exists public.revenue_partner_reviews cascade;
drop table if exists public.revenue_partner_scorecards cascade;
drop table if exists public.revenue_partner_performance_metrics cascade;
drop table if exists public.revenue_partner_performance_periods cascade;
drop table if exists public.revenue_partner_attribution_conflicts cascade;
drop table if exists public.revenue_partner_referral_attributions cascade;
drop table if exists public.revenue_partner_referral_status_history cascade;
drop table if exists public.revenue_partner_referrals cascade;
drop table if exists public.revenue_partner_activation_gates cascade;
drop table if exists public.revenue_partner_activation_plans cascade;
drop table if exists public.revenue_partnership_milestones cascade;
drop table if exists public.revenue_partnership_obligations cascade;
drop table if exists public.revenue_partner_benefit_usage cascade;
drop table if exists public.revenue_partner_benefits cascade;
drop table if exists public.revenue_partner_program_service_lines cascade;
drop table if exists public.revenue_partner_program_locations cascade;
drop table if exists public.revenue_partner_programs cascade;
drop table if exists public.revenue_partnership_qualifications cascade;
drop table if exists public.revenue_partnership_stakeholders cascade;

commit;
