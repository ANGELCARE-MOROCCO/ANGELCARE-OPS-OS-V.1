begin;

delete from public.browser_extension_compatibility_matrix where extension_version='0.7.1' and schema_min_version='scanner2';
delete from public.browser_extension_feature_flags where flag_key in ('browser_os.scanner_intelligence_2','browser_os.scanner_deep_research','browser_os.scanner_governed_ai');
delete from public.browser_extension_release_versions where version='0.7.1';

update public.browser_extension_release_channels
set version='0.7.0', minimum_version='0.7.0', release_notes='Mega ZIP 7 production final', updated_at=now()
where channel_key in ('development','internal','pilot') and version='0.7.1';

drop table if exists public.browser_extension_scan_errors;
drop table if exists public.browser_extension_scan_user_decisions;
drop table if exists public.browser_extension_scan_opportunity_hypotheses;
drop table if exists public.browser_extension_scan_signals;
drop table if exists public.browser_extension_scan_contacts;
drop table if exists public.browser_extension_scan_facts;
drop table if exists public.browser_extension_scan_pages;
drop table if exists public.browser_extension_scan_sessions;

commit;
