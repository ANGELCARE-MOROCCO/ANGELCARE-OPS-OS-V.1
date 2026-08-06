begin;
update public.angelcare_marketplace_live_experience_campaigns set status='suspended',updated_at=now() where status in('active','scheduled');
update public.angelcare_marketplace_live_experience_schedules set status='cancelled',updated_at=now() where status='scheduled';
do $$ begin
 if to_regclass('public.angelcare_marketplace_feature_flags') is not null then update public.angelcare_marketplace_feature_flags set enabled=false,status='inactive',reason='Safe rollback — evidence preserved',updated_at=now() where flag_key='marketplace.live_experience.enabled'; end if;
 if to_regclass('public.angelcare_marketplace_modules') is not null then update public.angelcare_marketplace_modules set status='disabled',enabled=false,health_status='paused',updated_at=now() where module_key='live-experience-command'; end if;
end $$;
commit;
select 'live_experience_command_safely_suspended' as result,(select count(*) from public.angelcare_marketplace_live_experience_campaigns) as preserved_campaigns,(select count(*) from public.angelcare_marketplace_live_experience_impressions) as preserved_impressions,(select count(*) from public.angelcare_marketplace_live_experience_interactions) as preserved_interactions,(select count(*) from public.angelcare_marketplace_live_experience_conversions) as preserved_conversions;
