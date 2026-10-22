-- Private document authority; storage uses the existing Supabase adapter and an explicitly private bucket.
-- No storage policy or bucket is mutated by source tooling or the installer.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=6) then raise exception 'JOBKIX_MIGRATION_ORDER';end if;end $$;
alter table public.jobkix_files add column library_archived_at timestamptz;
alter table public.jobkix_files add column upload_key text;
grant select on public.jobkix_files to authenticated;
create function public.jobkix_file_owned(p_file uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.jobkix_files f join public.jobkix_accounts a on a.user_id=f.owner_user_id join auth.users u on u.id=a.user_id where f.id=p_file and a.user_id=auth.uid() and a.status='active' and u.email_confirmed_at is not null)
$$;
revoke all on function public.jobkix_file_owned(uuid) from public,anon,authenticated;
grant execute on function public.jobkix_file_owned(uuid) to authenticated;
create policy jobkix_files_authorized on public.jobkix_files for select to authenticated using(
 public.jobkix_file_visible(id) or public.jobkix_file_owned(id)
);
create function public.jobkix_file_begin(p_metadata jsonb,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();prior public.jobkix_command_receipts;fingerprint text;f public.jobkix_files;org uuid;result jsonb;new_id uuid:=gen_random_uuid();
begin
 if p_metadata is null or jsonb_typeof(p_metadata)<>'object' or octet_length(p_metadata::text)>4000 or p_idempotency_key is null or length(p_idempotency_key) not between 16 and 180 then raise exception 'INVALID_INPUT';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_idempotency_key,0));
 fingerprint:=encode(sha256(convert_to(jsonb_build_object('action','file.begin','payload',p_metadata)::text,'UTF8')),'hex');
 select * into prior from public.jobkix_command_receipts where actor_user_id=actor and idempotency_key=p_idempotency_key;
 if found then if prior.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT';end if;return prior.result;end if;
 if length(p_metadata->>'filename') not between 1 and 240 or (p_metadata->>'filename')~E'[\\\\/\\r\\n\\x00-\\x1f]'
 or coalesce(p_metadata->>'sha256','')!~'^[a-f0-9]{64}$' or (p_metadata->>'bytes')::bigint not between 1 and 20971520
 or p_metadata->>'mime' not in ('application/pdf','image/jpeg','image/png') or p_metadata->>'purpose' not in ('cv','credential','portfolio','verification','report','message') then raise exception 'INVALID_INPUT';end if;
 if p_metadata->>'purpose'='cv' and (p_metadata->>'mime'<>'application/pdf' or not exists(select 1 from public.jobkix_candidates where user_id=actor)) then raise exception 'FORBIDDEN';end if;
 org:=nullif(p_metadata->>'organizationId','')::uuid;
 if p_metadata->>'purpose'='verification' and (org is null or not public.jobkix_can_act(org,'organization.manage')) then raise exception 'FORBIDDEN';end if;
 if org is not null and not public.jobkix_can_act(org,'organization.manage') then raise exception 'FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended('jobkix-upload:'||actor::text,0));
 if (select count(*) from public.jobkix_files where owner_user_id=actor and created_at>now()-interval '10 minutes')>=20
 or (select coalesce(sum(expected_bytes),0) from public.jobkix_files where owner_user_id=actor and created_at>now()-interval '1 day')+(p_metadata->>'bytes')::bigint>209715200 then raise exception 'RATE_LIMITED';end if;
 insert into public.jobkix_files(id,owner_user_id,organization_id,purpose,object_key,filename,mime,expected_bytes,sha256,upload_key)
 values(new_id,actor,org,p_metadata->>'purpose',actor::text||'/'||new_id::text||'/original',p_metadata->>'filename',p_metadata->>'mime',(p_metadata->>'bytes')::bigint,p_metadata->>'sha256',p_idempotency_key) returning * into f;
 result:=jsonb_build_object('id',f.id,'objectKey',f.object_key,'state',f.state,'sha256',f.sha256,'bytes',f.expected_bytes);
 insert into public.jobkix_command_receipts(actor_user_id,idempotency_key,action,request_hash,result) values(actor,p_idempotency_key,'file.begin',fingerprint,result);return result;
end $$;

create function public.jobkix_file_finish(p_actor uuid,p_file uuid,p_sha256 text,p_bytes bigint,p_validation_reference text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare f public.jobkix_files;begin
 if not exists(select 1 from public.jobkix_accounts a join auth.users u on u.id=a.user_id where a.user_id=p_actor and a.status='active' and u.email_confirmed_at is not null) then raise exception 'FORBIDDEN';end if;
 select * into f from public.jobkix_files where id=p_file and owner_user_id=p_actor for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if f.sha256 is distinct from p_sha256 or f.expected_bytes is distinct from p_bytes or coalesce(p_validation_reference,'')<>('jobkix-static-content-v1:'||p_sha256) then raise exception 'DOCUMENT_NOT_READY';end if;
 if f.state not in ('uploading','quarantined','ready') then raise exception 'INVALID_TRANSITION';end if;
 update public.jobkix_files set actual_bytes=p_bytes,scanner_reference=p_validation_reference,state='ready' where id=f.id;
 return jsonb_build_object('id',f.id,'state','ready','revision',f.revision,'sha256',f.sha256,'bytes',f.expected_bytes);
end $$;

create function public.jobkix_file_download(p_file uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();f public.jobkix_files;begin
 if not public.jobkix_file_visible(p_file) then raise exception 'FORBIDDEN';end if;
 select * into f from public.jobkix_files where id=p_file;
 insert into public.jobkix_events(type,object_id,actor_user_id,detail) values('file.download',f.id,actor,jsonb_build_object('purpose',f.purpose));
 return jsonb_build_object('id',f.id,'objectKey',f.object_key,'filename',f.filename,'mime',f.mime,'bytes',f.actual_bytes,'sha256',f.sha256);
end $$;

create function public.jobkix_admin_file_download(p_actor uuid,p_file uuid,p_area text,p_purpose text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare f public.jobkix_files;begin
 if p_actor is null or length(trim(p_purpose)) not between 20 and 1000 or p_area not in ('verification','cases') then raise exception 'FORBIDDEN';end if;
 select * into f from public.jobkix_files where id=p_file and state='ready';
 if not found or not exists(select 1 from public.jobkix_cases c where c.evidence_file_id=f.id and (p_area='cases' or c.kind='verification')) then raise exception 'FORBIDDEN';end if;
 insert into public.jobkix_events(type,object_id,admin_actor_id,detail) values('admin.file_download',f.id,p_actor,jsonb_build_object('area',p_area,'purpose',p_purpose));
 return jsonb_build_object('id',f.id,'objectKey',f.object_key,'filename',f.filename,'mime',f.mime,'bytes',f.actual_bytes,'sha256',f.sha256);
end $$;

create function public.jobkix_file_archive(p_file uuid,p_archived boolean) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=public.jobkix_actor();begin
 if p_archived is null then raise exception 'INVALID_INPUT';end if;
 update public.jobkix_files set library_archived_at=case when p_archived then coalesce(library_archived_at,now()) else null end where id=p_file and owner_user_id=actor;
 if not found then raise exception 'FORBIDDEN';end if;
 -- Historical submission references and private bytes are retained; no shared object is deleted here.
 return jsonb_build_object('id',p_file,'archived',p_archived);
end $$;
create function public.jobkix_file_immutable() returns trigger language plpgsql set search_path=pg_catalog as $$ begin
 if old.state='ready' and (new.owner_user_id<>old.owner_user_id or new.organization_id is distinct from old.organization_id or new.object_key<>old.object_key or new.mime<>old.mime or new.expected_bytes<>old.expected_bytes or new.sha256 is distinct from old.sha256 or new.revision<>old.revision or new.filename<>old.filename) then raise exception 'IMMUTABLE_DOCUMENT_REVISION';end if;return new;
end $$;
create trigger jobkix_file_immutable_guard before update on public.jobkix_files for each row execute function public.jobkix_file_immutable();
revoke all on function public.jobkix_file_begin(jsonb,text),public.jobkix_file_finish(uuid,uuid,text,bigint,text),public.jobkix_file_download(uuid),public.jobkix_admin_file_download(uuid,uuid,text,text),public.jobkix_file_archive(uuid,boolean),public.jobkix_file_immutable() from public,anon,authenticated;
grant execute on function public.jobkix_file_begin(jsonb,text),public.jobkix_file_download(uuid),public.jobkix_file_archive(uuid,boolean) to authenticated;
grant execute on function public.jobkix_file_finish(uuid,uuid,text,bigint,text),public.jobkix_admin_file_download(uuid,uuid,text,text) to service_role;
insert into public.jobkix_schema_versions(version) values(7);
commit;
