-- Read-only post-application checks.
select tgname,tgenabled from pg_trigger where tgrelid='public.ac_dce_releases'::regclass and not tgisinternal;
select proname,obj_description(oid,'pg_proc') ownership,has_function_privilege('anon',oid,'execute') anon_execute from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_release_guard','ac_dce_link_release','ac_dce_write','ac_dce_release_action','ac_dce_reschedule','ac_dce_prepare_import','ac_dce_analytics','ac_dce_dashboard_counts');
select id,record_id,revision,state,md5(snapshot::text) snapshot_hash,md5(manifest::text) manifest_hash from public.ac_dce_releases order by created_at desc limit 20;
