-- Repair the native shared-vault schema contract. No table columns, resource
-- publication, role permissions or scope bindings are created or changed.
begin;
do $repair$
declare sig text; expected text; fn regprocedure; definition text; corrected text;
begin
  perform pg_advisory_xact_lock(hashtextextended('kidflix-native-media-compatibility-r1',0));
  foreach sig in array array[
    'public.ac_kidflix_documents_r1(text,text,jsonb,integer)',
    'public.ac_kidflix_reference_discovery_r1(text,text,text,jsonb,integer)'
  ] loop
    fn:=to_regprocedure(sig);
    if fn is null then raise exception 'KIDFLIX_DISCOVERY_DEPENDENCY_MISSING: %',sig;end if;
    expected:=case when sig like '%documents_r1%' then 'ANGELCARE_KIDFLIX_DOCUMENTS_REFERENCE_R1'else 'ANGELCARE_KIDFLIX_CATEGORIES_REFERENCE_R1'end;
    if obj_description(fn,'pg_proc') is distinct from expected then raise exception 'UNREVIEWED_DISCOVERY_FUNCTION: %',sig;end if;
    definition:=pg_get_functiondef(fn);
    corrected:=replace(replace(definition,'m.tenant_id','(to_jsonb(m)->>''tenant_id'')'),'m.territory_id','(to_jsonb(m)->>''territory_id'')');
    if corrected<>definition then execute corrected;end if;
  end loop;
  -- Exercise both query families on the real configured scope before committing.
  perform public.ac_kidflix_documents_r1('my.angelcarehub.com','fr','{}'::jsonb,1);
  perform public.ac_kidflix_reference_discovery_r1('my.angelcarehub.com','fr','printables','{}'::jsonb,1);
end $repair$;
notify pgrst,'reload schema';
commit;

select
  result->>'configured' as configured,
  result->>'total' as documents_total,
  result->'rows' as document_cards
from (select public.ac_kidflix_documents_r1('my.angelcarehub.com','fr','{}'::jsonb,1) result) checked;
