-- DESTRUCTIVE. RUN ONLY IF INTENTIONALLY REMOVING MZ6 CONTACT PROFILE CACHE.
begin;
drop table if exists public.social_command_contact_profiles;
commit;
select 'SOCIAL_COMMAND_MZ6_CONTACT_PROFILE_CACHE_REMOVED' as result;
