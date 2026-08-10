-- DANGER: INTENTIONAL MZ7 DATA/SCHEMA ROLLBACK. DO NOT RUN FOR NORMAL OPERATIONS.
begin;
do $$ declare t text; begin foreach t in array array['social_command_relationship_contacts','social_command_relationship_identities','social_command_journey_events','social_command_contact_profiles','social_command_conversations','social_command_messages','social_command_comments','social_command_mentions'] loop execute format('drop trigger if exists social_command_mz7_no_delete on public.%I',t); end loop; end $$;
drop function if exists public.social_command_mz7_compliance_anonymize_contact(uuid,text,text);
drop function if exists public.social_command_mz7_block_delete();
alter table public.social_command_contact_profiles drop column if exists relationship_contact_id;
alter table public.social_command_messages drop column if exists edited_at,drop column if exists provider_state,drop column if exists source_kind;
alter table public.social_command_mentions drop column if exists provider_state,drop column if exists source_kind,drop column if exists archive_reason,drop column if exists archived_by,drop column if exists archived_at,drop column if exists relationship_contact_id;
alter table public.social_command_comments drop column if exists provider_state,drop column if exists source_kind,drop column if exists archive_reason,drop column if exists archived_by,drop column if exists archived_at,drop column if exists provider_permalink,drop column if exists parent_comment_id,drop column if exists provider_post_id,drop column if exists provider_account_id,drop column if exists relationship_contact_id;
alter table public.social_command_conversations drop column if exists provider_state,drop column if exists source_kind,drop column if exists waiting_until,drop column if exists waiting_reason,drop column if exists archive_reason,drop column if exists archived_by,drop column if exists archived_at,drop column if exists messaging_window_expires_at,drop column if exists provider_account_id,drop column if exists relationship_contact_id;
drop table if exists public.social_command_history_sync_checkpoints cascade;
drop table if exists public.social_command_history_sync_runs cascade;
drop table if exists public.social_command_journey_events cascade;
drop table if exists public.social_command_relationship_identities cascade;
drop table if exists public.social_command_relationship_contacts cascade;
commit;
