begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=23) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_admin_page(p_actor uuid,p_collection text,p_purpose text,p_page integer default 1) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare source_table text;total bigint;items jsonb;condition text;begin
 if p_actor is null or p_page is null or p_page not between 1 and 10000 or length(trim(p_purpose)) not between 20 and 1000 then raise exception 'INVALID_INPUT';end if;
 source_table:=case p_collection when 'verification' then 'jobkix_cases' when 'vacancies' then 'jobkix_vacancies' when 'cases' then 'jobkix_cases' when 'reputation' then 'jobkix_reputation' when 'editorial' then 'jobkix_editorial_editions' when 'taxonomy' then 'jobkix_taxonomy' when 'audit' then 'jobkix_events' end;
 if source_table is null then raise exception 'INVALID_INPUT';end if;
 condition:=case when p_collection='verification' then 'where kind=''verification''' when p_collection='cases' then 'where kind<>''verification''' else '' end;
 -- Both identifier and condition are internal literals. Pagination uses the existing record projector.
 execute format('select count(*) from public.%I %s',source_table,condition) into total;
 items:=public.jobkix_admin_read(p_actor,p_collection,p_purpose,null,p_page);
 return jsonb_build_object('items',items,'total',total,'page',p_page,'pageSize',24);
end $$;
revoke all on function public.jobkix_admin_page(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.jobkix_admin_page(uuid,text,text,integer) to service_role;
insert into public.jobkix_schema_versions(version) values(24);
commit;
