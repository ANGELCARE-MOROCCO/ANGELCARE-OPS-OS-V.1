-- DANGER · MZ9 DESTRUCTIVE ROLLBACK
-- Removes only MZ9 operator preference/saved-view data. Does not touch Social Command business data.
begin;
drop table if exists public.social_command_operator_preferences;
drop table if exists public.social_command_saved_views;
commit;
