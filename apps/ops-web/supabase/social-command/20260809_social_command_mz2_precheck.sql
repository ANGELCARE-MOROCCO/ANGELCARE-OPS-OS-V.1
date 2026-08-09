-- ANGELCARE SOCIAL COMMAND MZ2 · PRECHECK
with required(name) as (
  values
  ('social_command_connections'),('social_command_channel_capabilities'),('social_command_oauth_sessions'),('social_command_campaigns'),('social_command_media_assets'),('social_command_media_tags'),('social_command_media_asset_tags'),('social_command_media_usage'),('social_command_publications'),('social_command_publication_variants'),('social_command_publication_media'),('social_command_campaign_items'),('social_command_schedules'),('social_command_execution_jobs'),('social_command_execution_attempts'),('social_command_provider_results'),('social_command_bulk_plans'),('social_command_bulk_slots'),('social_command_action_operations'),('social_command_audit_events')
), mz1 as (
 select count(*)::int n from required r where to_regclass('public.'||r.name) is not null
), mz2_required(name) as (
 values ('social_command_webhook_deliveries'),('social_command_webhook_events'),('social_command_conversations'),('social_command_messages'),('social_command_conversation_assignments'),('social_command_conversation_tags'),('social_command_engagement_events'),('social_command_comments'),('social_command_mentions'),('social_command_automations'),('social_command_automation_versions'),('social_command_automation_runs'),('social_command_automation_actions'),('social_command_metric_snapshots'),('social_command_campaign_metrics'),('social_command_reconciliation_runs'),('social_command_channel_health_events'),('social_command_ai_operations'),('social_command_operator_notes')
), mz2 as (
 select count(*)::int n from mz2_required r where to_regclass('public.'||r.name) is not null
)
select case when mz1.n<>20 then 'MZ1_BASELINE_MISSING' when mz2.n=0 then 'CLEAN_INSTALL' when mz2.n=19 then 'ALREADY_COMPLETE' else 'PARTIAL_OR_DRIFTED' end as state,
       mz1.n as mz1_tables, mz2.n as mz2_tables, 19 as expected_mz2_tables
from mz1,mz2;
