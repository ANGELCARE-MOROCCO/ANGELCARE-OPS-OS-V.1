begin;
update public.angelcare_marketplace_footer_profiles set status='suspended',updated_at=now() where status in ('published','scheduled');
update public.angelcare_marketplace_footer_schedules set status='cancelled',updated_at=now() where status='scheduled';
insert into public.angelcare_marketplace_footer_publications(profile_id,action,result,evidence) select id,'safe_rollback','success',jsonb_build_object('recordsPreserved',true,'newActivitySuspended',true) from public.angelcare_marketplace_footer_profiles;
commit;
select 'footer_command_studio_safely_suspended' as result,(select count(*) from public.angelcare_marketplace_footer_profiles) as profiles_preserved,(select count(*) from public.angelcare_marketplace_footer_profile_versions) as versions_preserved,(select count(*) from public.angelcare_marketplace_footer_analytics_events) as analytics_preserved;
