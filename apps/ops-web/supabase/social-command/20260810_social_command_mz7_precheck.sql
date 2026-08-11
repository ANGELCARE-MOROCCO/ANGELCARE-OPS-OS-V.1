-- ANGELCARE SOCIAL COMMAND MZ7 — READ-ONLY PRECHECK
select
  to_regclass('public.social_command_conversations') as conversations,
  to_regclass('public.social_command_messages') as messages,
  to_regclass('public.social_command_comments') as comments,
  to_regclass('public.social_command_mentions') as mentions,
  to_regclass('public.social_command_contact_profiles') as contact_profiles,
  to_regclass('public.social_command_publications') as publications,
  to_regclass('public.social_command_campaigns') as campaigns,
  to_regclass('public.social_command_provider_results') as provider_results,
  to_regclass('public.social_command_audit_events') as audit_events;

select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_conversations' and column_name='channel') as conversation_channel_ready,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_comments' and column_name='provider_comment_id') as comment_provider_id_ready,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_messages' and column_name='provider_message_id') as message_provider_id_ready,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_contact_profiles' and column_name='provider_scoped_user_id') as mz6_profile_cache_ready;
