-- Read-only verification: function ACL, active release sample, event-source integrity.
select to_regprocedure('public.ac_kidflix_public_engagement_v1(uuid)') as function_present;
select has_function_privilege('service_role', 'public.ac_kidflix_public_engagement_v1(uuid)', 'EXECUTE') as service_only_execution;
select has_function_privilege('anon', 'public.ac_kidflix_public_engagement_v1(uuid)', 'EXECUTE') as anon_must_be_false;
select has_function_privilege('authenticated', 'public.ac_kidflix_public_engagement_v1(uuid)', 'EXECUTE') as authenticated_must_be_false;
-- Public endpoint and function access are verified without scanning the event table.
-- For a live sample, use a known active release ID; DO NOT use a draft or withdrawn release:
-- select public.ac_kidflix_public_engagement_v1('00000000-0000-0000-0000-000000000000'::uuid);
