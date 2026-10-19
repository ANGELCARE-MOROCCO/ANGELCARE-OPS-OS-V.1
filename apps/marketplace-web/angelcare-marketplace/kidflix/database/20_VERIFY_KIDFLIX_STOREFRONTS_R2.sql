-- PENDING. Read-only activation verification.
do $$begin
 if obj_description(to_regprocedure('public.ac_kidflix_storefront(text,text,text,jsonb,integer)'),'pg_proc')is distinct from 'ANGELCARE_KIDFLIX_STOREFRONTS_R2' then raise exception 'R2_FUNCTION_MISSING';end if;
 if has_function_privilege('anon','public.ac_kidflix_storefront(text,text,text,jsonb,integer)','EXECUTE')or has_function_privilege('authenticated','public.ac_kidflix_storefront(text,text,text,jsonb,integer)','EXECUTE')then raise exception 'BROWSER_ROLE_MUST_NOT_EXECUTE';end if;
 if not has_function_privilege('service_role','public.ac_kidflix_storefront(text,text,text,jsonb,integer)','EXECUTE')then raise exception 'SERVICE_ROLE_REQUIRED';end if;
end $$;
