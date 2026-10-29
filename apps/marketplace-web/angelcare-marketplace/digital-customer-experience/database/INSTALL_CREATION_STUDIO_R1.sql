-- KidFlix Creation Studio R1 · additive native publication orchestration.
-- Run in the existing Marketplace Supabase SQL editor before deploying this patch.
-- Existing language editions, publishing policies and native RPCs remain authoritative.
begin;
do $$ begin
  if to_regprocedure('public.ac_dce_r5_edition(text,text,text,uuid,text,uuid,integer,text,text,jsonb,text,jsonb,jsonb,timestamp with time zone,uuid)') is null
    or to_regclass('public.ac_dce_work_items') is null then
    raise exception 'DCE_R5_AND_OPERATOR_R6_REQUIRED';
  end if;
end $$;

create or replace function public.ac_dce_creation_publish(
 p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,
 p_id uuid,p_revision int,p_locale text,p_action text,
 p_definition jsonb,p_definition_hash text,
 p_manifest jsonb default '{}',p_validation jsonb default '{}',
 p_schedule timestamptz default null,p_release uuid default null
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 r ac_dce_records;c ac_dce_commands;e ac_dce_editions;z ac_dce_releases;
 reply jsonb;phase text;child_request uuid;guard_hash text;child_hash text;
begin
 if nullif(p_actor,'') is null or p_action is distinct from 'direct_publish'
   or p_locale not in ('fr','en','ar') or p_definition_hash !~ '^[a-f0-9]{64}$'
   or p_revision is null or p_revision < 1 then raise exception 'INVALID_CREATION_PUBLICATION';end if;
 guard_hash:=encode(sha256(convert_to(jsonb_build_array('KIDFLIX_CREATION_STUDIO_R1',p_actor,p_tenant,p_territory,p_hash,p_id,p_revision,p_locale,p_definition_hash,p_definition)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));
 select * into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;
 if found then
   if c.input_hash is distinct from guard_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   return c.response;
 end if;
 select * into r from ac_dce_records where id=p_id
   and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found or r.kind not in ('experience','bundle') then raise exception 'NOT_FOUND';end if;
 if r.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 if coalesce((p_validation->>'valid')::boolean,false) is not true
   or length(coalesce(p_definition->>'title',''))=0 then raise exception 'EDITION_READINESS_REQUIRED';end if;
 if p_manifest->>'editionLocale' is distinct from p_locale
   or p_manifest->>'editionHash' is distinct from p_definition_hash then raise exception 'EDITION_MANIFEST_REQUIRED';end if;
 select * into e from ac_dce_editions where record_id=p_id and locale=p_locale for update;
 if e.active_release_id is not null then
   select * into z from ac_dce_releases where id=e.active_release_id and record_id=p_id
     and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory
     and state='published' and revision=p_revision and manifest->>'editionHash'=p_definition_hash;
   if found and e.definition=p_definition then
     reply:=jsonb_build_object('edition',to_jsonb(e),'release',to_jsonb(z),'receipt',p_request,'reused',true);
     insert into ac_dce_commands values(p_request,p_actor,guard_hash,reply,now());return reply;
   end if;
 end if;
 -- Each call retains native permissions-policy evidence, tasks, hashes and edition rules.
 -- An exception rolls back all three transitions and their child receipts together.
 foreach phase in array array['review','approve','release'] loop
   child_request:=md5(p_request::text||':'||guard_hash||':'||phase)::uuid;
   child_hash:=encode(sha256(convert_to(guard_hash||':'||phase,'UTF8')),'hex');
   reply:=public.ac_dce_r5_edition(p_actor,p_tenant,p_territory,child_request,child_hash,
     p_id,p_revision,p_locale,phase,p_definition,p_definition_hash,p_manifest,p_validation,null,null);
 end loop;
 if reply->'release'->>'state' is distinct from 'published'
   or reply->'edition'->>'active_release_id' is distinct from reply->'release'->>'id' then
   raise exception 'ACTIVE_EDITION_REQUIRED';
 end if;
 reply:=reply||jsonb_build_object('receipt',p_request,'contract','KIDFLIX_CREATION_STUDIO_R1');
 insert into ac_dce_commands values(p_request,p_actor,guard_hash,reply,now());return reply;
end $$;
revoke all on function public.ac_dce_creation_publish(text,text,text,uuid,text,uuid,int,text,text,jsonb,text,jsonb,jsonb,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.ac_dce_creation_publish(text,text,text,uuid,text,uuid,int,text,text,jsonb,text,jsonb,jsonb,timestamptz,uuid) to service_role;

create or replace function public.ac_dce_creation_runtime_status() returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('contract','KIDFLIX_CREATION_STUDIO_R1','atomicPublish',true);
$$;
revoke all on function public.ac_dce_creation_runtime_status() from public,anon,authenticated;
grant execute on function public.ac_dce_creation_runtime_status() to service_role;
commit;
