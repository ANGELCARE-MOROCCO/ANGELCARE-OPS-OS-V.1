-- PENDING PRODUCTION ACTIVATION. Run after 13, in the Marketplace SQL Editor only.
begin;
do $$begin
 if to_regclass('public.ac_dce_editions') is null or to_regclass('public.ac_dce_operator_batches') is null then raise exception 'DCE_R6_PREREQUISITE_REQUIRED';end if;
 if to_regclass('public.ac_dce_operator_drafts') is not null then
  if obj_description(to_regclass('public.ac_dce_operator_drafts'),'pg_class') is distinct from 'ANGELCARE_DCE_EXPERIENCE_R7' then raise exception 'UNRELATED_TABLE';end if;
 end if;
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname like 'ac_dce_r7_%' and obj_description(oid,'pg_proc') is distinct from 'ANGELCARE_DCE_EXPERIENCE_R7') then raise exception 'UNRELATED_FUNCTION';end if;
end $$;
create table if not exists public.ac_dce_operator_drafts(
 id uuid primary key default gen_random_uuid(), actor_id text not null,tenant_id text,territory_id text,draft_key text not null check(length(draft_key) between 1 and 160),payload jsonb not null check(octet_length(payload::text)<=524288),revision int not null default 1,updated_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '30 days'
);
comment on table public.ac_dce_operator_drafts is 'ANGELCARE_DCE_EXPERIENCE_R7';
create unique index if not exists ac_dce_r7_draft_scope on public.ac_dce_operator_drafts(actor_id,coalesce(tenant_id,''),coalesce(territory_id,''),draft_key);
alter table public.ac_dce_operator_drafts enable row level security;
revoke all on public.ac_dce_operator_drafts from public,anon,authenticated;
grant select,insert,update,delete on public.ac_dce_operator_drafts to service_role;
create or replace function public.ac_dce_r7_draft(p_actor text,p_tenant text,p_territory text,p_key text,p_revision int,p_action text,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_operator_drafts;begin
 if nullif(p_actor,'')is null or length(p_key)not between 1 and 160 then raise exception 'INVALID_DRAFT_IDENTITY';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor||coalesce(p_tenant,'')||'|'||coalesce(p_territory,'')||p_key,0));
 select *into r from ac_dce_operator_drafts where actor_id=p_actor and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory and draft_key=p_key for update;
 if p_action='read'then if r.id is null then return null;end if;if r.expires_at<now()then return to_jsonb(r)||jsonb_build_object('payload',null,'expired',true);end if;return to_jsonb(r);end if;
 if p_revision<>coalesce(r.revision,0)then raise exception 'DRAFT_REVISION_CONFLICT';end if;
 if p_action='delete'then delete from ac_dce_operator_drafts where id=r.id;return jsonb_build_object('deleted',true);end if;
 if p_action<>'save'or jsonb_typeof(p_payload)<>'object'or octet_length(p_payload::text)>524288 then raise exception 'INVALID_DRAFT';end if;
 if r.id is null then insert into ac_dce_operator_drafts(actor_id,tenant_id,territory_id,draft_key,payload)values(p_actor,p_tenant,p_territory,p_key,p_payload)returning *into r;
 else update ac_dce_operator_drafts set payload=p_payload,revision=revision+1,updated_at=now(),expires_at=now()+interval'30 days'where id=r.id returning *into r;end if;
 return to_jsonb(r);end $$;
create or replace function public.ac_dce_r7_discovery(p_tenant text,p_territory text,p_locale text,p_filters jsonb default '{}',p_page int default 1)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;begin
 if p_locale not in('ar','fr','en')then raise exception 'INVALID_LANGUAGE';end if;
 with live as(select r.id,r.key,r.family,r.topic,r.audience,z.id release_id,z.manifest->>'title' title,z.manifest->'definition' definition from ac_dce_records r join ac_dce_editions e on e.record_id=r.id and e.locale=p_locale join ac_dce_releases z on z.id=e.active_release_id and z.state='published'where r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory and r.kind in('experience','bundle')and r.lifecycle<>'archived'),filtered as(select *from live l where (coalesce(p_filters->>'family','')=''or l.family=p_filters->>'family')and(coalesce(p_filters->>'audience','')=''or l.audience=p_filters->>'audience')and(coalesce(p_filters->>'q','')=''or l.title ilike '%'||(p_filters->>'q')||'%')and(coalesce(p_filters->>'subject','')=''or l.definition->>'subject'=p_filters->>'subject')and(coalesce(p_filters->>'skill','')=''or coalesce(l.definition->>'skillTags','')ilike '%'||(p_filters->>'skill')||'%')and(coalesce(p_filters->>'difficulty','')=''or l.definition->>'difficulty'=p_filters->>'difficulty')and(coalesce(p_filters->>'slot','')=''or exists(select 1 from jsonb_array_elements(coalesce(l.definition->'discoveryPlacements','[]'))p where p->>'enabled'='true'and p->>'slot'=p_filters->>'slot'and(coalesce(p->>'startsAt','')=''or(p->>'startsAt')::timestamptz<=now())and(coalesce(p->>'endsAt','')=''or(p->>'endsAt')::timestamptz>now())and(coalesce(p_filters->>'collection','')=''or p->>'collectionKey'=p_filters->>'collection')))),paged as(select id,key,family,topic,audience,release_id,title,definition->>'subject'subject,definition->>'difficulty'difficulty from filtered order by title,id limit 30 offset(greatest(1,p_page)-1)*30)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(p))from paged p),'[]'),'total',(select count(*)from filtered),'page',greatest(1,p_page),'pageSize',30,'locale',p_locale,'source','active_language_editions')into result;return result;end $$;
-- A hold can be released explicitly without clearing its audit trail or bypassing eligibility.
create or replace function public.ac_dce_r7_release_hold(p_actor text,p_tenant text,p_territory text,p_request uuid,p_revision int,p_reason text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_certificate_retention;begin
 if length(trim(coalesce(p_reason,'')))<10 then raise exception 'RELEASE_REASON_REQUIRED';end if;
 select *into r from ac_dce_certificate_retention where request_id=p_request and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if r.id is null or r.revision<>p_revision or r.state<>'planned'or r.hold_reason is null then raise exception 'RETENTION_REVISION_CONFLICT';end if;
 insert into ac_dce_certificate_history(request_id,actor_id,action,data)values(p_request,p_actor,'retention_hold_released',jsonb_build_object('reason',p_reason,'previousHold',r.hold_reason));
 update ac_dce_certificate_retention set hold_reason=null,revision=revision+1 where id=r.id returning *into r;return to_jsonb(r);end $$;
create or replace function public.ac_dce_r7_certificate_message(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_subject text,p_body text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_certificate_requests;w ac_dce_work_items;c ac_dce_commands;cid uuid;reply jsonb;begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 if length(trim(p_subject))not between 1 and 240 or length(trim(p_body))not between 1 and 8000 then raise exception 'MESSAGE_CONTENT_REQUIRED';end if;
 select *into r from ac_dce_certificate_requests where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if r.id is null then raise exception 'NOT_FOUND';end if;if r.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 if r.data ? 'anonymisedAt' or r.data->>'consent'is distinct from'true' or r.email='anonymised@invalid.example' then raise exception 'CERTIFICATE_CONTACT_UNAVAILABLE';end if;
 cid:=nullif(r.data->>'privateCaseId','')::uuid;
 if cid is null then insert into ac_dce_records(kind,key,title,audience,data,lifecycle,created_by,updated_by,tenant_id,territory_id)values('case','certificate-document-'||r.id::text,r.reference||' · '||r.course_title,'parent',jsonb_build_object('source','explicit_certificate_request','certificateRequestId',r.id,'experienceId',r.course_id,'releaseId',r.release_id,'body','Private certificate follow-up.','notes','[]'::jsonb),'open',p_actor,p_actor,p_tenant,p_territory)returning id into cid;
 update ac_dce_certificate_requests set data=data||jsonb_build_object('privateCaseId',cid),revision=revision+1,updated_at=now()where id=r.id returning *into r;
 elsif not exists(select 1 from ac_dce_records where id=cid and kind='case'and data->>'certificateRequestId'=r.id::text and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory)then raise exception 'CERTIFICATE_CASE_MISMATCH';end if;
 insert into ac_dce_work_items(kind,record_id,title,status,data,created_by,updated_by,tenant_id,territory_id)values('notification',cid,trim(p_subject),'queued',jsonb_build_object('channel','email','recipient',r.email,'body',p_body,'sender','supports@angelcarehub.ma','attempts',0,'locale',r.contact_locale,'certificateRequestId',r.id,'caseRevision',r.revision),p_actor,p_actor,p_tenant,p_territory)returning *into w;
 insert into ac_dce_certificate_history(request_id,actor_id,action,data)values(r.id,p_actor,'message_prepared',jsonb_build_object('notificationId',w.id,'state','queued'));
 reply:=jsonb_build_object('item',to_jsonb(w),'request',to_jsonb(r));insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;end $$;

create or replace function public.ac_dce_r6_retention(p_actor text,p_tenant text,p_territory text,p_id uuid,p_revision int,p_action text,p_data jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r ac_dce_certificate_requests;p ac_dce_certificate_retention;days int;begin
 select *into r from ac_dce_certificate_requests where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 select *into p from ac_dce_certificate_retention where request_id=r.id for update;
 if p_action='plan'then
 days:=(p_data->>'days')::int;if r.revision<>p_revision or r.status not in('closed','cancelled','rejected')or r.updated_at>now()-make_interval(days=>days)or length(trim(coalesce(p_data->>'reason','')))<10 then raise exception 'RETENTION_NOT_ELIGIBLE';end if;
 insert into ac_dce_certificate_retention(request_id,tenant_id,territory_id,expected_revision,policy_days,reason,execute_after,actor_id)values(r.id,p_tenant,p_territory,r.revision,days,p_data->>'reason',now()+interval'7 days',p_actor)on conflict(request_id)do update set expected_revision=excluded.expected_revision,policy_days=excluded.policy_days,reason=excluded.reason,execute_after=excluded.execute_after,state='planned',revision=ac_dce_certificate_retention.revision+1 returning *into p;
 elsif p_action='hold'then
 if p.id is null or p.revision<>p_revision or length(trim(coalesce(p_data->>'reason','')))<10 then raise exception 'HOLD_REASON_REQUIRED';end if;update ac_dce_certificate_retention set hold_reason=p_data->>'reason',revision=revision+1 where id=p.id returning *into p;
 elsif p_action='cancel'then
 if p.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;update ac_dce_certificate_retention set state='cancelled',revision=revision+1 where id=p.id returning *into p;
 elsif p_action='execute'then
 if p.revision<>p_revision or p.state<>'planned'or p.hold_reason is not null or p.execute_after>now()or r.revision<>p.expected_revision or r.status not in('closed','cancelled','rejected')then raise exception 'DISPOSAL_BLOCKED';end if;
 if exists(select 1 from ac_dce_work_items where record_id=nullif(r.data->>'privateCaseId','')::uuid and kind='notification'and status in('queued','sending','delivery_unknown'))then raise exception 'PENDING_COMMUNICATION_BLOCKS_DISPOSAL';end if;
 if exists(select 1 from ac_dce_attachment_receipts where case_id=nullif(r.data->>'privateCaseId','')::uuid and state='linked')then raise exception 'PRIVATE_FILE_RETENTION_REQUIRED';end if;
 update ac_dce_certificate_requests set learner_name='Anonymised',requester_name='Anonymised',email='anonymised@invalid.example',phone='',subject_hash=encode(sha256((id::text||'anonymised')::bytea),'hex'),data=jsonb_build_object('anonymisedAt',now(),'privateCaseId',data->>'privateCaseId'),evidence=jsonb_build_object('evidenceLevel',evidence->>'evidenceLevel','score',evidence->'score'),revision=revision+1,updated_at=now()where id=r.id;
 update ac_dce_certificate_history set data='{}' where request_id=r.id;
 update ac_dce_commands set response=jsonb_build_object('requestId',r.id,'anonymised',true,'receipt',request_id)where response->'request'->>'id'=r.id::text;
 update ac_dce_commands set response=jsonb_build_object('caseId',r.data->>'privateCaseId','anonymised',true,'receipt',request_id)where response->'record'->>'id'=r.data->>'privateCaseId';
 update ac_dce_versions set snapshot=jsonb_build_object('recordId',record_id,'revision',revision,'anonymised',true)where record_id=nullif(r.data->>'privateCaseId','')::uuid;
 update ac_dce_work_items set data=jsonb_build_object('certificateRequestId',r.id,'anonymised',true),revision=revision+1,updated_at=now()where record_id=nullif(r.data->>'privateCaseId','')::uuid and kind in('comment','case_operation','notification');

 update ac_dce_assessment_attempts set evidence=jsonb_build_object('retainedForIssuedRecord',true),subject_hash=encode(sha256((id::text||'anonymised')::bytea),'hex')where id=r.attempt_id;
 if r.data->>'privateCaseId'is not null then update ac_dce_records set data=jsonb_build_object('source','explicit_certificate_request','certificateRequestId',r.id,'status','closed','anonymised',true),revision=revision+1,updated_at=now(),updated_by=p_actor where id=(r.data->>'privateCaseId')::uuid and kind='case';end if;
 update ac_dce_certificate_retention set state='anonymised',revision=revision+1 where id=p.id returning *into p;
 else raise exception 'UNKNOWN_RETENTION_ACTION';end if;return to_jsonb(p);end $$;

create or replace function public.ac_dce_r6_features()returns jsonb language sql security definer set search_path=public,pg_temp as $$select jsonb_build_object('core',to_regclass('public.ac_dce_records')is not null,'production',to_regclass('public.ac_dce_processing_outputs')is not null,'editions',to_regclass('public.ac_dce_editions')is not null,'certificates',to_regclass('public.ac_dce_certificate_requests')is not null,'operatorBatches',true,'operatorDrafts',true,'experienceDesigner',true,'publicServing',false)$$;
do $$declare f record;begin for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname like 'ac_dce_r7_%'loop execute format('comment on function %s is %L',f.sig,'ANGELCARE_DCE_EXPERIENCE_R7');execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end $$;
notify pgrst,'reload schema';
commit;
