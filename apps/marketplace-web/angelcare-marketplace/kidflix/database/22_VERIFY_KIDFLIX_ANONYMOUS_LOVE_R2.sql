-- PENDING / READ ONLY. Execute after SQL21. Does not seed reactions or send anything.
do $$declare n text;f regprocedure;begin
 foreach n in array array['ac_kidflix_love_totals','ac_kidflix_love_members']loop
  if to_regclass('public.'||n)is null then raise exception 'MISSING: %',n;end if;
  if obj_description(to_regclass('public.'||n),'pg_class')is distinct from 'ANGELCARE_KIDFLIX_LOVE_R2'then raise exception 'WRONG_OWNER_MARKER: %',n;end if;
  if not(select relrowsecurity from pg_class where oid=to_regclass('public.'||n))then raise exception 'RLS_REQUIRED: %',n;end if;
  if has_table_privilege('anon','public.'||n,'SELECT')or has_table_privilege('authenticated','public.'||n,'SELECT')or has_table_privilege('service_role','public.'||n,'INSERT')then raise exception 'DIRECT_ACCESS_DENIED_REQUIRED: %',n;end if;
 end loop;
 f:=to_regprocedure('public.ac_kidflix_love(text,text,text,text,boolean)');
 if f is null or not has_function_privilege('service_role',f,'EXECUTE')or has_function_privilege('anon',f,'EXECUTE')or has_function_privilege('authenticated',f,'EXECUTE')then raise exception 'FUNCTION_GRANTS_INVALID';end if;
 if exists(select 1 from public.ac_kidflix_love_totals t where t.total<>(select count(*)from public.ac_kidflix_love_members m where m.record_id=t.record_id and m.liked))or exists(select 1 from public.ac_kidflix_love_members m where m.liked and not exists(select 1 from public.ac_kidflix_love_totals t where t.record_id=m.record_id))then raise exception 'LOVE_TOTALS_MISMATCH';end if;
 raise notice 'KIDFLIX_LOVE_R2_VERIFIED; no data changed';
end $$;
