begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=11) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_hiring_receipt(p_action text,p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();receipt public.jobkix_command_receipts;v public.jobkix_vacancies;site public.jobkix_sites;begin
 if p_action not in ('organization.create','vacancy.create','vacancy.save','vacancy.submit_review','vacancy.publish','vacancy.pause','vacancy.close','vacancy.archive','vacancy.reopen','vacancy.duplicate','site.create','site.save') or length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key and action=p_action;
 if not found then return null;end if;
 if p_action='organization.create' then
  if not public.jobkix_can_act((receipt.result->>'id')::uuid,'organization.manage') then raise exception 'FORBIDDEN';end if;
 elsif p_action like 'vacancy.%' then
  select * into v from public.jobkix_vacancies where id=(receipt.result->>'id')::uuid;
  if not found or not public.jobkix_can_act(v.organization_id,'vacancy.write',v.site_id,v.id) then raise exception 'FORBIDDEN';end if;
 else
  select * into site from public.jobkix_sites where id=(receipt.result->>'id')::uuid;
  if not found or not public.jobkix_can_act(site.organization_id,'organization.manage') then raise exception 'FORBIDDEN';end if;
 end if;
 -- Historical effect only. The screen separately reads the current canonical object.
 return receipt.result||jsonb_build_object('recordedAt',receipt.created_at);
end $$;
revoke all on function public.jobkix_hiring_receipt(text,text) from public,anon,authenticated;
grant execute on function public.jobkix_hiring_receipt(text,text) to authenticated;
insert into public.jobkix_schema_versions(version) values(12);
commit;
