-- READ ONLY. Run after SQL 11 in the same Marketplace SQL Editor.
select 'ANGELCARE_DCE_AUTONOMOUS_R5' contract,current_database() database,now() checked_at;
select name,to_regclass('public.'||name)is not null installed,
 coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.'||name)),false) rls_enabled,
 obj_description(to_regclass('public.'||name),'pg_class') owner_marker
from unnest(array['ac_dce_editions','ac_dce_assessment_attempts','ac_dce_certificate_requests','ac_dce_certificate_history'])name;
select proname,pg_get_function_identity_arguments(oid) arguments,
 obj_description(oid,'pg_proc')='ANGELCARE_DCE_AUTONOMOUS_R5' owned,
 not has_function_privilege('anon',oid,'EXECUTE') anon_blocked,
 not has_function_privilege('authenticated',oid,'EXECUTE') authenticated_blocked
from pg_proc where pronamespace='public'::regnamespace and proname like'ac_dce_r5_%' order by proname;
-- All following counts must be zero. No personal contact data is displayed.
select 'invalid_active_edition' check_name,count(*) invalid_count from ac_dce_editions e left join ac_dce_releases r on r.id=e.active_release_id
where e.active_release_id is not null and(r.id is null or r.record_id<>e.record_id or r.state<>'published' or r.manifest->>'editionLocale'is distinct from e.locale or r.tenant_id is distinct from e.tenant_id or r.territory_id is distinct from e.territory_id)
union all select 'certificate_wrong_course',count(*) from ac_dce_certificate_requests q join ac_dce_releases r on r.id=q.release_id where q.course_id<>r.record_id or q.tenant_id is distinct from r.tenant_id or q.territory_id is distinct from r.territory_id
union all select 'issued_without_document',count(*)from ac_dce_certificate_requests where status='issued'and nullif(data->'issuedDocument'->>'documentId','')is null;
