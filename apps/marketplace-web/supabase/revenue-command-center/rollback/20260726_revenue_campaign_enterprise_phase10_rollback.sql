-- MEGA ZIP 10 CONTROLLED ROLLBACK
-- Destructive to Phase 10 support records. Preserve a backup before use.
begin;

drop trigger if exists revenue_campaign_realization_reversal_v10 on public.revenue_realization_events;
drop function if exists public.revenue_campaign_realization_reversal_v10();
drop trigger if exists revenue_campaign_closed_period_immutable_v10 on public.revenue_campaign_performance_periods;
drop trigger if exists revenue_campaign_sequence_version_immutable_v10 on public.revenue_campaign_sequence_versions;
drop trigger if exists revenue_campaign_template_version_immutable_v10 on public.revenue_campaign_template_versions;
drop trigger if exists revenue_campaign_version_step_immutable_v10 on public.revenue_campaign_sequence_steps;
drop function if exists public.revenue_campaign_closed_period_immutable_v10();
drop function if exists public.revenue_campaign_approved_asset_immutable_v10();

drop view if exists public.revenue_sdr_campaign_queue_view;
drop view if exists public.revenue_campaign_recipient_command_view;
drop view if exists public.revenue_campaign_command_view;

alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_step_fk_v10;
alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_sequence_version_fk_v10;
alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_recipient_fk_v10;
alter table public.revenue_communication_events drop constraint if exists revenue_communication_events_campaign_fk_v10;
alter table public.revenue_campaigns drop constraint if exists revenue_campaigns_audience_snapshot_fk_v10;

drop function if exists public.revenue_close_campaign_performance_period(uuid,uuid);
drop function if exists public.revenue_create_campaign_attribution(uuid,uuid,text,text,text,numeric,numeric,text,text,uuid);
drop function if exists public.revenue_record_campaign_provider_event(uuid,text,text,text,timestamptz,jsonb,uuid);
drop function if exists public.revenue_approve_campaign_sequence(uuid,integer,uuid);
drop function if exists public.revenue_process_campaign_reply(uuid,text,text,text,text,uuid);
drop function if exists public.revenue_dispatch_campaign_step(uuid,text,text,uuid,text);
drop function if exists public.revenue_launch_campaign(uuid,uuid,text);
drop function if exists public.revenue_evaluate_campaign_readiness(uuid,uuid);
drop function if exists public.revenue_enroll_campaign_recipient(uuid,text,uuid,uuid,text,text,text,uuid,text);
drop function if exists public.revenue_freeze_campaign_audience(uuid,uuid,uuid,text,jsonb,jsonb,uuid);
drop function if exists public.revenue_evaluate_campaign_recipient(uuid,text,uuid,text,text,uuid);

drop table if exists public.revenue_campaign_recovery_checkpoints cascade;
drop table if exists public.revenue_campaign_recovery_plans cascade;
drop table if exists public.revenue_campaign_experiment_variants cascade;
drop table if exists public.revenue_campaign_experiments cascade;
drop table if exists public.revenue_campaign_performance_periods cascade;
drop table if exists public.revenue_campaign_costs cascade;
drop table if exists public.revenue_campaign_attribution_conflicts cascade;
drop table if exists public.revenue_campaign_attributions cascade;
drop table if exists public.revenue_campaign_conversion_events cascade;
drop table if exists public.revenue_campaign_status_history cascade;
drop table if exists public.revenue_campaign_evidence cascade;
drop table if exists public.revenue_campaign_risks cascade;
drop table if exists public.revenue_campaign_approvals cascade;
drop table if exists public.revenue_campaign_sender_readiness cascade;
drop table if exists public.revenue_campaign_provider_readiness cascade;
drop table if exists public.revenue_campaign_sdr_assignments cascade;
drop table if exists public.revenue_campaign_replies cascade;
drop table if exists public.revenue_campaign_dispatch_attempts cascade;
drop table if exists public.revenue_campaign_step_executions cascade;
drop table if exists public.revenue_campaign_enrollments cascade;
drop table if exists public.revenue_campaign_sequence_branches cascade;
drop table if exists public.revenue_campaign_sequence_steps cascade;
drop table if exists public.revenue_campaign_template_versions cascade;
drop table if exists public.revenue_campaign_templates cascade;
drop table if exists public.revenue_campaign_sequence_versions cascade;
drop table if exists public.revenue_campaign_sequences cascade;
drop table if exists public.revenue_campaign_frequency_decisions cascade;
drop table if exists public.revenue_campaign_suppressions cascade;
drop table if exists public.revenue_campaign_recipients cascade;
drop table if exists public.revenue_campaign_recipient_eligibility cascade;
drop table if exists public.revenue_campaign_audience_members cascade;
drop table if exists public.revenue_campaign_audience_snapshots cascade;
drop table if exists public.revenue_campaign_segment_versions cascade;
drop table if exists public.revenue_campaign_segments cascade;

drop function if exists public.revenue_campaign_touch_updated_at_v10();

alter table public.revenue_communication_events
  drop column if exists campaign_step_id,
  drop column if exists campaign_sequence_version_id,
  drop column if exists campaign_recipient_id,
  drop column if exists campaign_id;

alter table public.revenue_campaigns
  drop column if exists updated_by,
  drop column if exists created_by,
  drop column if exists audience_snapshot_id,
  drop column if exists emergency_stopped_at,
  drop column if exists emergency_stopped,
  drop column if exists pause_reason,
  drop column if exists risk_status,
  drop column if exists strategy,
  drop column if exists frequency_policy,
  drop column if exists attribution_window_days,
  drop column if exists attribution_model,
  drop column if exists audience_mode,
  drop column if exists readiness_status,
  drop column if exists approval_status,
  drop column if exists end_at,
  drop column if exists sdr_lead,
  drop column if exists owner_id,
  drop column if exists channel_mix,
  drop column if exists campaign_type,
  drop column if exists reference;

commit;
