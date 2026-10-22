begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=22) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
create function public.jobkix_pipeline_authorized(p_org uuid,p_applications jsonb) returns boolean
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare item jsonb;app public.jobkix_applications;vac public.jobkix_vacancies;actor uuid:=public.jobkix_actor();begin
 if p_org is null or coalesce(jsonb_typeof(p_applications),'null')<>'array' or jsonb_array_length(p_applications)>24 then return false;end if;
 for item in select value from jsonb_array_elements(p_applications) loop
  if coalesce(jsonb_typeof(item),'null')<>'object' or item->>'id'!~*'^[0-9a-f-]{36}$' then return false;end if;
  select * into app from public.jobkix_applications where id=(item->>'id')::uuid;select * into vac from public.jobkix_vacancies where id=app.vacancy_id;
  if app.id is null or app.organization_id<>p_org or app.candidate_user_id=actor or not public.jobkix_application_visible(app.id) or not public.jobkix_can_act(app.organization_id,'application.decide',vac.site_id,vac.id) then return false;end if;
 end loop;
 if jsonb_array_length(p_applications)=0 then return exists(select 1 from public.jobkix_vacancies v where v.organization_id=p_org and public.jobkix_can_act(p_org,'application.decide',v.site_id,v.id));end if;
 return true;
end $$;
create function public.jobkix_bulk_stage(p_payload jsonb,p_expected_version integer,p_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();previous public.jobkix_command_receipts;req_hash text;item jsonb;app public.jobkix_applications;result jsonb;effects jsonb:='[]';org uuid;
begin
 if p_expected_version is distinct from 0 or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>16000 or length(coalesce(p_key,'')) not between 16 and 180
 or coalesce(jsonb_typeof(p_payload->'applications'),'null')<>'array' or jsonb_array_length(p_payload->'applications') not between 1 and 24
 or coalesce(p_payload->>'state','') not in ('acknowledged','under_review','shortlisted','interview','on_hold') or length(trim(coalesce(p_payload->>'reason',''))) not between 10 and 1500
 or exists(select 1 from jsonb_array_elements(p_payload->'applications') i where jsonb_typeof(i)<>'object' or coalesce(jsonb_typeof(i->'version'),'null')<>'number' or (i->>'version')!~'^[1-9][0-9]{0,6}$' or exists(select 1 from jsonb_object_keys(i) k where k not in ('id','version')))
 or (select count(*) from jsonb_array_elements(p_payload->'applications'))<>(select count(distinct i->>'id') from jsonb_array_elements(p_payload->'applications') i) then raise exception 'INVALID_INPUT';end if;
 org:=(p_payload->>'organizationId')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_key,0));
 -- All parent application locks are acquired in the same stable order before any effect.
 perform a.id from public.jobkix_applications a where a.id in (select (i->>'id')::uuid from jsonb_array_elements(p_payload->'applications') i) order by a.id for update;
 if not public.jobkix_pipeline_authorized(org,p_payload->'applications') then raise exception 'FORBIDDEN';end if;
 req_hash:=encode(sha256(convert_to(jsonb_build_object('action','application.bulk_stage','payload',p_payload,'expectedVersion',p_expected_version)::text,'UTF8')),'hex');
 select * into previous from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key;
 if found then if previous.request_hash<>req_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return previous.result||jsonb_build_object('replayed',true);end if;
 for item in select value from jsonb_array_elements(p_payload->'applications') order by value->>'id' loop
  result:=public.jobkix_command('application.stage',jsonb_build_object('applicationId',item->>'id','state',p_payload->>'state'),(item->>'version')::integer,'batch:'||encode(sha256(convert_to(p_key||':'||(item->>'id'),'UTF8')),'hex'));
  effects:=effects||jsonb_build_array(result);
 end loop;
 result:=jsonb_build_object('id',org,'state','recorded','applications',effects,'replayed',false);
 perform public.jobkix_emit('application.bulk_stage',org,actor,'{}',jsonb_build_object('applications',p_payload->'applications','state',p_payload->>'state','privateReason',p_payload->>'reason'));
 insert into public.jobkix_command_receipts(actor_user_id,idempotency_key,action,request_hash,result) values(actor,p_key,'application.bulk_stage',req_hash,result);return result;
end $$;
create function public.jobkix_pipeline_receipt(p_key text) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();receipt public.jobkix_command_receipts;begin
 if length(coalesce(p_key,'')) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 select * into receipt from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_key and action='application.bulk_stage';if not found then return null;end if;
 if not public.jobkix_pipeline_authorized((receipt.result->>'id')::uuid,receipt.result->'applications') then raise exception 'FORBIDDEN';end if;
 return receipt.result||jsonb_build_object('recordedAt',receipt.created_at);
end $$;
revoke all on function public.jobkix_pipeline_authorized(uuid,jsonb),public.jobkix_bulk_stage(jsonb,integer,text),public.jobkix_pipeline_receipt(text) from public,anon,authenticated;
grant execute on function public.jobkix_pipeline_receipt(text) to authenticated;
insert into public.jobkix_schema_versions(version) values(23);
commit;
