-- ANGELCARE SOCIAL COMMAND MZ7 — READ-ONLY VERIFICATION
with required(name) as (values
 ('social_command_relationship_contacts'),('social_command_relationship_identities'),('social_command_journey_events'),('social_command_history_sync_runs'),('social_command_history_sync_checkpoints')
)
select name,to_regclass('public.'||name) is not null as ready from required order by name;

select c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in('social_command_relationship_contacts','social_command_relationship_identities','social_command_journey_events','social_command_history_sync_runs','social_command_history_sync_checkpoints') order by c.relname;

select
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_conversations' and column_name='relationship_contact_id') as conversation_relationship_ready,
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_conversations' and column_name='messaging_window_expires_at') as messenger_window_ready,
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_comments' and column_name='provider_post_id') as facebook_comment_lineage_ready,
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_messages' and column_name='source_kind') as message_provenance_ready,
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_contact_profiles' and column_name='relationship_contact_id') as profile_relationship_ready,
 exists(select 1 from information_schema.columns where table_schema='public' and table_name='social_command_relationship_contacts' and column_name='current_owner_user_id') as relationship_owner_ready,
 exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='social_command_mz7_compliance_anonymize_contact') as compliance_function_ready,
 (select count(*) from pg_trigger t where not t.tgisinternal and t.tgname='social_command_mz7_no_delete') >= 8 as delete_guards_ready,
 exists(select 1 from pg_constraint where conrelid='public.social_command_comments'::regclass and pg_get_constraintdef(oid) ilike '%archived%') as comment_archive_status_ready,
 exists(select 1 from pg_constraint where conrelid='public.social_command_mentions'::regclass and pg_get_constraintdef(oid) ilike '%archived%') as mention_archive_status_ready;
