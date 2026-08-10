-- ANGELCARE SOCIAL COMMAND MZ6 — PRECHECK (READ ONLY)
select
  to_regclass('public.social_command_conversations') as conversations,
  to_regclass('public.social_command_messages') as messages,
  to_regclass('public.social_command_comments') as comments,
  to_regclass('public.social_command_conversation_assignments') as assignments,
  to_regclass('public.social_command_engagement_events') as engagement_events,
  to_regclass('public.social_command_operator_notes') as operator_notes,
  to_regclass('public.social_command_copy_items') as copy_vault;
