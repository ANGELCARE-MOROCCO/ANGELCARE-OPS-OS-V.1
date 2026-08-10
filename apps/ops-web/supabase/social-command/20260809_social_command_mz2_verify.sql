-- ANGELCARE SOCIAL COMMAND MZ2 · VERIFY (read-only)
do $$
declare n int; bad_rls int; auto_n int; bad_media int; begin
 select count(*) into n from pg_tables where schemaname='public' and tablename in (
 'social_command_webhook_deliveries','social_command_webhook_events','social_command_conversations','social_command_messages','social_command_conversation_assignments','social_command_conversation_tags','social_command_engagement_events','social_command_comments','social_command_mentions','social_command_automations','social_command_automation_versions','social_command_automation_runs','social_command_automation_actions','social_command_metric_snapshots','social_command_campaign_metrics','social_command_reconciliation_runs','social_command_channel_health_events','social_command_ai_operations','social_command_operator_notes');
 if n<>19 then raise exception 'SOCIAL_COMMAND_MZ2_TABLE_COUNT_MISMATCH:%',n; end if;
 select count(*) into bad_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'social_command_%' and c.relkind='r' and not c.relrowsecurity;
 if bad_rls<>0 then raise exception 'SOCIAL_COMMAND_RLS_MISSING:%',bad_rls; end if;
 select count(*) into auto_n from public.social_command_automations where automation_code in ('A01','A02','A03','A04','A05','A06','A07','A08','A09','A10');
 if auto_n<>10 then raise exception 'SOCIAL_COMMAND_AUTOMATION_CATALOGUE_MISSING:%',auto_n; end if;
 select count(*) into bad_media from information_schema.columns where table_schema='public' and table_name='social_command_media_assets' and (column_name ~* '(blob|binary|base64|bytea|file_data|content_bytes)' or data_type='bytea');
 if bad_media<>0 then raise exception 'SOCIAL_COMMAND_SUPABASE_MEDIA_BINARY_COLUMN_DETECTED:%',bad_media; end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_automations' and column_name ~* '(approval|shadow|governance_hold)') then raise exception 'SOCIAL_COMMAND_AUTOMATION_GOVERNANCE_BLOCKER_COLUMN_DETECTED'; end if;
end $$;
select 'SOCIAL_COMMAND_MZ2_DATABASE_VERIFIED' as result,
 (select count(*) from public.social_command_automations) as automations,
 (select count(*) from public.social_command_conversations) as conversations,
 (select count(*) from public.social_command_messages) as messages,
 (select count(*) from public.social_command_metric_snapshots) as metric_snapshots;
