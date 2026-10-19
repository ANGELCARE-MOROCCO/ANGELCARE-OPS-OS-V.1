-- Optional recovery ONLY when restoring R3 source. Preserves records, jobs, releases and audit.
-- Stop the separately activated processor first. This does not delete data or bytes.
begin;
do $$declare t record;begin
 for t in select tgname,tgrelid::regclass relation,tgfoid from pg_trigger where not tgisinternal and tgname in('ac_dce_editorial_guard_trigger','ac_dce_author_evidence_trigger','ac_dce_patch_references_trigger','ac_dce_editorial_notice_trigger')loop
 if obj_description(t.tgfoid,'pg_proc')is distinct from'ANGELCARE_DCE_PROFESSIONAL_R4'then raise exception 'UNRELATED_TRIGGER';end if;
 execute format('alter table %s disable trigger %I',t.relation,t.tgname);
 end loop;
end $$;
notify pgrst,'reload schema';
commit;
-- Reapply 08 to restore all R4 triggers and service-only function permissions.
