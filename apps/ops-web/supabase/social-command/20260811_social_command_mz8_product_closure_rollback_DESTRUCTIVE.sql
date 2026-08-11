-- DANGER · ANGELCARE SOCIAL COMMAND MZ8 DESTRUCTIVE ROLLBACK
-- DO NOT RUN in normal rollback. This removes MZ8 taxonomy/tombstone structures and lifecycle columns.
begin;
drop table if exists public.social_command_media_collection_items cascade;
drop table if exists public.social_command_media_category_links cascade;
drop table if exists public.social_command_media_collections cascade;
drop table if exists public.social_command_media_categories cascade;
drop table if exists public.social_command_media_tombstones cascade;
drop table if exists public.social_command_copy_tombstones cascade;

update public.social_command_copy_items set lifecycle_status='archived' where lifecycle_status='trashed';
update public.social_command_copy_categories set status='archived' where status='trashed';
alter table public.social_command_copy_items drop constraint if exists social_command_copy_items_lifecycle_status_check;
alter table public.social_command_copy_items add constraint social_command_copy_items_lifecycle_status_check check(lifecycle_status in ('active','archived'));
alter table public.social_command_copy_categories drop constraint if exists social_command_copy_categories_status_check;
alter table public.social_command_copy_categories add constraint social_command_copy_categories_status_check check(status in ('active','archived'));
alter table public.social_command_copy_approval_events drop constraint if exists social_command_copy_approval_events_action_check;
alter table public.social_command_copy_approval_events add constraint social_command_copy_approval_events_action_check check(action in ('submitted','approved','rejected','archived','restored'));

alter table public.social_command_media_assets drop column if exists title;
alter table public.social_command_media_assets drop column if exists description;
alter table public.social_command_media_assets drop column if exists lifecycle_status;
alter table public.social_command_media_assets drop column if exists favorite;
alter table public.social_command_media_assets drop column if exists updated_by;
alter table public.social_command_media_assets drop column if exists updated_at;
commit;
