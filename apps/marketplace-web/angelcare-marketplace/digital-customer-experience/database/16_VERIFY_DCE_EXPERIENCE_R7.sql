-- Read only; keep pending until separately authorised activation of SQL15.
begin read only;
select 'ANGELCARE_DCE_EXPERIENCE_R7' contract,now() checked_at;
select to_regclass('public.ac_dce_operator_drafts') is not null installed,
 obj_description(to_regclass('public.ac_dce_operator_drafts'),'pg_class')='ANGELCARE_DCE_EXPERIENCE_R7' owned,
 (select relrowsecurity from pg_class where oid=to_regclass('public.ac_dce_operator_drafts')) rls_enabled;
select proname,obj_description(oid,'pg_proc')='ANGELCARE_DCE_EXPERIENCE_R7' owned,
 not has_function_privilege('anon',oid,'execute') anon_blocked,
 not has_function_privilege('authenticated',oid,'execute') authenticated_blocked
from pg_proc where pronamespace='public'::regnamespace and proname like 'ac_dce_r7_%' order by proname;
select 'invalid_draft_payload' check_name,count(*) invalid_count from public.ac_dce_operator_drafts where jsonb_typeof(payload)<>'object'or octet_length(payload::text)>524288 or revision<1;
select 'invalid_active_edition' check_name,count(*) invalid_count from public.ac_dce_editions e left join public.ac_dce_releases z on z.id=e.active_release_id where e.active_release_id is not null and (z.id is null or z.record_id<>e.record_id or z.state<>'published' or z.manifest->>'editionLocale'<>e.locale);
commit;
