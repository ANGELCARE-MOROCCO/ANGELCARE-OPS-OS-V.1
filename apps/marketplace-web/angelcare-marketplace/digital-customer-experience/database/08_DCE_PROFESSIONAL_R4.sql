begin;
-- Fail before writes if an unrelated function or trigger occupies an R4 name.
do $$declare f record;begin
 for f in select oid,oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname=any(array['ac_dce_approval_exception','ac_dce_author_evidence','ac_dce_case_operation','ac_dce_disposal_execute','ac_dce_disposal_finish','ac_dce_disposal_prepare','ac_dce_editorial_guard','ac_dce_editorial_notice','ac_dce_field_patch','ac_dce_json_set','ac_dce_patch_references','ac_dce_processing_action','ac_dce_professional_health','ac_dce_rebind','ac_dce_response_stamp','ac_dce_retention_hold','ac_dce_service_batch','ac_dce_service_scopes','ac_dce_strategy','ac_dce_text_commit','ac_dce_work_page','ac_dce_work_write'])loop
 if obj_description(f.oid,'pg_proc')is distinct from'ANGELCARE_DCE_PROFESSIONAL_R4'then raise exception 'UNRELATED_FUNCTION: %',f.signature;end if;end loop;
 if exists(select 1 from pg_trigger t where not t.tgisinternal and t.tgname in('ac_dce_editorial_guard_trigger','ac_dce_author_evidence_trigger','ac_dce_patch_references_trigger','ac_dce_editorial_notice_trigger')and obj_description(t.tgfoid,'pg_proc')is distinct from'ANGELCARE_DCE_PROFESSIONAL_R4')then raise exception 'UNRELATED_TRIGGER';end if;
end $$;

-- Additive DCE-owned operations. No role assignments, global mailbox or storage changes.
do $$ declare n text;r regclass;begin
 if to_regclass('public.ac_dce_attachment_receipts') is null then raise exception 'DCE_R3_REQUIRED';end if;
 foreach n in array array['ac_dce_work_items','ac_dce_edit_presence','ac_dce_field_edits','ac_dce_text_documents','ac_dce_editorial_authors','ac_dce_activity_v2','ac_dce_processing_outputs','ac_dce_disposal_items']loop
 r:=to_regclass('public.'||n);if r is not null and obj_description(r,'pg_class') is distinct from 'ANGELCARE_DCE_PROFESSIONAL_R4' then raise exception 'UNRELATED_RELATION: %',n;end if;end loop;
end $$;
create table if not exists public.ac_dce_work_items(
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in('task','comment','media_job','sla_policy','case_operation','retention_policy','disposal','saved_report','notification','capability','editorial_policy','editorial_notice')),
 record_id uuid references ac_dce_records on delete restrict,title text not null check(length(title)between 1 and 240),status text not null,data jsonb not null default '{}',revision int not null default 1,
 created_by text not null,updated_by text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),tenant_id text,territory_id text,
 scope_key text generated always as(coalesce(tenant_id,'~')||'|'||coalesce(territory_id,'~'))stored,check(octet_length(data::text)<=2000000));
create unique index if not exists ac_dce_media_job_fingerprint on ac_dce_work_items(scope_key,(data->>'fingerprint'))where kind='media_job'and status not in('cancelled');
create unique index if not exists ac_dce_case_operation_unique on ac_dce_work_items(scope_key,record_id)where kind='case_operation';
create index if not exists ac_dce_work_scope on ac_dce_work_items(scope_key,kind,status,updated_at desc,id);
create index if not exists ac_dce_work_record on ac_dce_work_items(record_id,kind);
create table if not exists public.ac_dce_edit_presence(record_id uuid not null references ac_dce_records on delete cascade,session_id uuid not null,actor_id text not null,display_name text not null,field_path text,expires_at timestamptz not null,tenant_id text,territory_id text,primary key(record_id,session_id));
create table if not exists public.ac_dce_field_edits(id uuid primary key default gen_random_uuid(),record_id uuid not null references ac_dce_records on delete cascade,path text[]not null,before_value jsonb,after_value jsonb,revision int not null,actor_id text not null,request_id uuid not null,created_at timestamptz not null default now(),unique(actor_id,request_id));
create table if not exists public.ac_dce_text_documents(record_id uuid not null references ac_dce_records on delete cascade,path text[]not null,generation uuid not null default gen_random_uuid(),nodes jsonb not null default '[]',value_hash text not null,revision int not null default 1,updated_at timestamptz not null default now(),primary key(record_id,path));
create table if not exists public.ac_dce_editorial_authors(record_id uuid not null references ac_dce_records on delete cascade,actor_id text not null,revision int not null,primary key(record_id,actor_id,revision));
create table if not exists public.ac_dce_activity_v2(id uuid primary key,record_id uuid not null references ac_dce_records on delete restrict,subject_key text not null check(subject_key~'^[a-f0-9]{64}$'),action text not null check(action in('discover','start','checkpoint','complete','bookmark','share','download','print','submission','return','native_conversion')),environment text not null check(environment in('production','preview','fixture')),release_id uuid references ac_dce_releases,dimensions jsonb not null default '{}',occurred_at timestamptz not null,received_at timestamptz not null default now(),tenant_id text,territory_id text);
create index if not exists ac_dce_activity_scope on ac_dce_activity_v2(tenant_id,territory_id,environment,occurred_at,record_id);
create index if not exists ac_dce_activity_subject on ac_dce_activity_v2(subject_key,record_id,action,occurred_at);
create unique index if not exists ac_dce_activity_native_receipt on ac_dce_activity_v2(record_id,(dimensions->>'nativeReceiptId'))where action='native_conversion';
create table if not exists public.ac_dce_processing_outputs(id uuid primary key default gen_random_uuid(),job_id uuid not null references ac_dce_work_items,asset_id uuid not null unique default gen_random_uuid(),file_name text not null,mime_type text not null,size_bytes bigint not null check(size_bytes>0),sha256 text not null check(sha256~'^[a-f0-9]{64}$'),role text not null,state text not null default 'pending'check(state in('pending','verified','promoted','revoked','disposed')),metadata jsonb not null default '{}',created_at timestamptz not null default now(),tenant_id text,territory_id text);
create table if not exists public.ac_dce_disposal_items(id uuid primary key default gen_random_uuid(),plan_id uuid not null references ac_dce_work_items,target_id uuid not null,target_kind text not null,expected_revision int,expected_hash text not null,state text not null default 'scheduled'check(state in('scheduled','blocked','revoked','disposed','failed','cancelled')),reason text,error text,updated_at timestamptz not null default now(),unique(plan_id,target_id));
-- Preserve author evidence for existing drafts; new edits maintain exact revision attribution.
insert into ac_dce_editorial_authors(record_id,actor_id,revision)select id,created_by,1 from ac_dce_records where kind in('experience','content','template','bundle')on conflict do nothing;
insert into ac_dce_editorial_authors(record_id,actor_id,revision)
 select v.record_id,v.actor_id,v.revision from ac_dce_versions v join ac_dce_records r on r.id=v.record_id
 where r.kind in('experience','content','template','bundle')and(v.revision=1 or exists(select 1 from ac_dce_versions p where p.record_id=v.record_id and p.revision=v.revision-1 and(p.snapshot->'data' is distinct from v.snapshot->'data' or p.snapshot->'title' is distinct from v.snapshot->'title')))on conflict do nothing;
create or replace function public.ac_dce_editorial_guard()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare policy jsonb; exception jsonb; floor_revision int;
begin
 if new.kind not in('experience','content','template','bundle')then return new;end if;
 if tg_op='UPDATE'and new.lifecycle='approved'and old.lifecycle is distinct from'approved'then
  if exists(select 1 from ac_dce_work_items w where w.record_id=new.id and w.kind='task'and w.status not in('done','cancelled')and coalesce((w.data->>'blocking')::boolean,false))then raise exception 'EDITORIAL_TASKS_BLOCKED';end if;
  select data into policy from ac_dce_work_items where kind='editorial_policy'and status='active'and tenant_id is not distinct from new.tenant_id and territory_id is not distinct from new.territory_id order by updated_at desc,id limit 1;
  if coalesce((policy->>'independentReview')::boolean,false)then
   select coalesce(max(revision),0)into floor_revision from ac_dce_releases where record_id=new.id;
   if exists(select 1 from ac_dce_editorial_authors where record_id=new.id and actor_id=new.updated_by and revision>floor_revision)then
    begin exception:=nullif(current_setting('ac_dce.approval_exception',true),'')::jsonb;exception when others then exception:=null;end;
    if exception->>'actor'is distinct from new.updated_by or exception->>'record'is distinct from new.id::text or exception->>'revision'is distinct from old.revision::text or length(coalesce(exception->>'reason',''))<12 then raise exception 'INDEPENDENT_REVIEW_REQUIRED';end if;
   end if;
  end if;
 end if;return new;
end $$;
create or replace function public.ac_dce_author_evidence()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.kind in('experience','content','template','bundle')and(tg_op='INSERT'or new.data is distinct from old.data or new.title is distinct from old.title or new.family is distinct from old.family or new.topic is distinct from old.topic or new.audience is distinct from old.audience)then insert into ac_dce_editorial_authors values(new.id,new.updated_by,new.revision)on conflict do nothing;if tg_op='UPDATE'then update ac_dce_work_items set status='changes_requested',revision=revision+1,updated_at=now(),data=data||jsonb_build_object('reviewInvalidatedAt',now(),'changedRevision',new.revision)where record_id=new.id and kind='task'and status='done'and data->>'reviewedRevision'is not null;end if;end if;return new;end $$;
drop trigger if exists ac_dce_editorial_guard_trigger on ac_dce_records;
create trigger ac_dce_editorial_guard_trigger before update on ac_dce_records for each row execute function ac_dce_editorial_guard();
drop trigger if exists ac_dce_author_evidence_trigger on ac_dce_records;
create trigger ac_dce_author_evidence_trigger after insert or update on ac_dce_records for each row execute function ac_dce_author_evidence();
create or replace function public.ac_dce_work_write(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_item jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare w ac_dce_work_items;c ac_dce_commands;s text:=coalesce(p_tenant,'~')||'|'||coalesce(p_territory,'~');k text:=p_item->>'kind';rid uuid:=nullif(p_item->>'record_id','')::uuid;reply jsonb;
begin
 if nullif(p_actor,'')is null then raise exception 'ACTOR_REQUIRED';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 if rid is not null and not exists(select 1 from ac_dce_records where id=rid and scope_key=s)then raise exception 'RECORD_NOT_FOUND';end if;
 if p_id is not null then select *into w from ac_dce_work_items where id=p_id and scope_key=s for update;if not found then raise exception 'NOT_FOUND';end if;if w.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;if w.kind<>k or w.record_id is distinct from rid then raise exception 'IDENTITY_IMMUTABLE';end if;end if;
 if k='task'then
  if p_item->>'status'not in('open','in_progress','review','changes_requested','done','cancelled')then raise exception 'TASK_STATUS_REQUIRED';end if;
  if exists(select 1 from jsonb_array_elements_text(coalesce(p_item->'data'->'dependencies','[]'))d where not exists(select 1 from ac_dce_work_items t where t.id=d::uuid and t.kind='task'and t.scope_key=s)or d=p_id::text)then raise exception 'TASK_DEPENDENCY_BLOCKED';end if;
  if p_id is not null and exists(with recursive deps(id,seen)as(select d::uuid,array[p_id,d::uuid]from jsonb_array_elements_text(coalesce(p_item->'data'->'dependencies','[]'))d union all select z::uuid,seen||z::uuid from deps join ac_dce_work_items t on t.id=deps.id cross join lateral jsonb_array_elements_text(coalesce(t.data->'dependencies','[]'))z where not z::uuid=any(seen))select 1 from deps join ac_dce_work_items t on t.id=deps.id where t.data->'dependencies'?p_id::text)then raise exception 'TASK_CYCLE_BLOCKED';end if;
  if p_item->>'status'='done'and exists(select 1 from jsonb_array_elements_text(coalesce(p_item->'data'->'dependencies','[]'))d join ac_dce_work_items t on t.id=d::uuid where t.status<>'done')then raise exception 'TASK_DEPENDENCY_BLOCKED';end if;
 end if;
 if p_id is null then insert into ac_dce_work_items(kind,record_id,title,status,data,created_by,updated_by,tenant_id,territory_id)values(k,rid,p_item->>'title',p_item->>'status',p_item->'data',p_actor,p_actor,p_tenant,p_territory)returning *into w;
 else update ac_dce_work_items set title=p_item->>'title',status=p_item->>'status',data=p_item->'data',revision=revision+1,updated_at=now(),updated_by=p_actor where id=p_id returning *into w;end if;
 insert into ac_dce_events(channel,action,record_id,actor_id,request_id,data,tenant_id,territory_id)values('admin','work_'||k,rid,p_actor,p_request,jsonb_build_object('workId',w.id,'status',w.status,'revision',w.revision),p_tenant,p_territory);
 reply:=to_jsonb(w);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_work_page(p_tenant text,p_territory text,p_kind text,p_record uuid,p_status text,p_q text,p_owner text,p_page int default 1,p_actor text default '',p_filters jsonb default '{}')returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 with r as(select w.*,r.title as record_title,assigned.full_name as assigned_name,reviewer.full_name as reviewer_name from ac_dce_work_items w left join ac_dce_records r on r.id=w.record_id left join app_users assigned on assigned.id::text=w.data->>'assignedTo'left join app_users reviewer on reviewer.id::text=w.data->>'reviewerId' where w.tenant_id is not distinct from p_tenant and w.territory_id is not distinct from p_territory and(p_kind=''or w.kind=p_kind)and(w.kind<>'saved_report'or w.data->>'visibility'='team'or w.data->>'ownerId'=p_actor)and(w.kind<>'editorial_notice'or w.data->>'assignedTo'=p_actor)and(p_record is null or w.record_id=p_record)and(p_status=''or w.status=p_status)and(p_owner=''or w.data->>'assignedTo'=p_owner or w.data->>'reviewerId'=p_owner)and(coalesce(p_filters->>'month','')=''or to_char((w.data->>'dueAt')::timestamptz at time zone coalesce(nullif(p_filters->>'zone',''),'UTC'),'YYYY-MM')=p_filters->>'month')and(p_q=''or w.title ilike'%'||p_q||'%'or r.title ilike'%'||p_q||'%')),
 selected as(select *from r where coalesce(p_filters->>'day','')=''or to_char((data->>'dueAt')::timestamptz at time zone coalesce(nullif(p_filters->>'zone',''),'UTC'),'YYYY-MM-DD')=p_filters->>'day'),
 page as(select *from selected order by updated_at desc,id limit 30 offset(greatest(p_page,1)-1)*30)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(p))from page p),'[]'),'total',(select count(*)from selected),'page',greatest(p_page,1),'pageSize',30,'calendar',coalesce((select jsonb_object_agg(calendar_day,n)from(select to_char((data->>'dueAt')::timestamptz at time zone coalesce(nullif(p_filters->>'zone',''),'UTC'),'YYYY-MM-DD')as calendar_day,count(*)n from r where data->>'dueAt'is not null group by 1)a),'{}'),'byStatus',coalesce((select jsonb_object_agg(status,n)from(select status,count(*)n from selected group by status)a),'{}'));
$$;
-- Atomic field edits merge disjoint work using the actual previous value, not a stale whole-dossier write.
create or replace function public.ac_dce_field_patch(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_path text[],p_before jsonb,p_after jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;v jsonb;reply jsonb;c ac_dce_commands;path text[]:=p_path;idx int;piece text;walk jsonb;i int;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select *into r from ac_dce_records where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 if r.kind not in('experience','template','content','bundle')or cardinality(path)<2 or cardinality(path)>12 or path[1]<>'data'or path&&array['__proto__','constructor','prototype']then raise exception 'FIELD_NOT_ALLOWED';end if;
 walk:=to_jsonb(r);for i in 1..cardinality(path)loop piece:=path[i];if left(piece,1)='@'then select ordinality::int-1 into idx from jsonb_array_elements(walk)with ordinality where value->>'id'=substr(piece,2);if idx is null then raise exception 'UNIT_NOT_FOUND';end if;path[i]:=idx::text;end if;walk:=walk->path[i];end loop;
 if walk is distinct from p_before then raise exception 'FIELD_CONFLICT';end if;
 v:=ac_dce_json_set(to_jsonb(r),path,p_after)->'data';if v is not distinct from r.data then reply:=jsonb_build_object('record',to_jsonb(r),'unchanged',true);else
 perform set_config('ac_dce.field_patch','on',true);
 update ac_dce_records set data=v,lifecycle='draft',revision=revision+1,updated_by=p_actor,updated_at=now()where id=p_id returning *into r;
 insert into ac_dce_versions(record_id,revision,snapshot,actor_id)values(r.id,r.revision,to_jsonb(r),p_actor);
 insert into ac_dce_field_edits(record_id,path,before_value,after_value,revision,actor_id,request_id)values(r.id,p_path,p_before,p_after,r.revision,p_actor,p_request);
 reply:=jsonb_build_object('record',to_jsonb(r));end if;
 insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_approval_exception(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_reason text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$begin
 if length(trim(p_reason))<12 then raise exception 'REASON_REQUIRED';end if;
 perform set_config('ac_dce.approval_exception',jsonb_build_object('actor',p_actor,'record',p_id,'revision',p_revision,'reason',p_reason)::text,true);
 return ac_dce_write(p_actor,p_tenant,p_territory,p_request,p_hash,'approve',p_id,p_revision,jsonb_build_object('reason',p_reason), '{}');end $$;
-- Durable job claiming, fair scope capacity and expiring leases. No CPU work occurs in a web request.
create or replace function public.ac_dce_processing_action(p_action text,p_worker text,p_id uuid default null,p_lease text default null,p_input jsonb default '{}')returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare w ac_dce_work_items;token text:=gen_random_uuid()::text;scope_limit int;
begin
 if length(p_worker)<3 then raise exception 'WORKER_REQUIRED';end if;
 if p_action='claim'then
  update ac_dce_work_items set status='failed',revision=revision+1,data=data||'{"errorCode":"ATTEMPTS_EXHAUSTED"}'::jsonb where kind='media_job'and status='running'and(data->>'leaseUntil')::timestamptz<now()and coalesce((data->>'attempts')::int,0)>=3;
  update ac_dce_work_items set status='cancelled',revision=revision+1 where kind='media_job'and status='cancel_requested'and(data->>'leaseUntil')::timestamptz<now();
  perform pg_advisory_xact_lock(hashtextextended('dce-processor-capacity',0));
  select *into w from ac_dce_work_items j where j.kind='media_job'and(j.status='queued'or j.status='running'and coalesce((j.data->>'leaseUntil')::timestamptz,'epoch')<now())and coalesce((j.data->>'attempts')::int,0)<3
   and not exists(select 1 from jsonb_array_elements_text(coalesce(j.data->'requiredTools','[]'))t where not coalesce(p_input->'tools','[]')?t)
   and(select count(*)from ac_dce_work_items active where active.kind='media_job'and active.scope_key=j.scope_key and active.status='running'and(active.data->>'leaseUntil')::timestamptz>now())<greatest(1,least(coalesce((p_input->>'concurrency')::int,1),4))
   order by coalesce((select max(active.updated_at)from ac_dce_work_items active where active.kind='media_job'and active.scope_key=j.scope_key and active.data->>'worker'is not null),'epoch'::timestamptz),coalesce((j.data->>'priority')::int,0)desc,j.created_at,j.id for update skip locked limit 1;
  if not found then return jsonb_build_object('state','idle');end if;
  update ac_dce_processing_outputs set state='revoked'where job_id=w.id and state in('pending','verified');
  update ac_dce_work_items set status='running',revision=revision+1,updated_at=now(),data=data||jsonb_build_object('worker',p_worker,'lease',token,'leaseUntil',now()+interval'120 seconds','attempts',coalesce((data->>'attempts')::int,0)+1,'stage','source_verification','progress',0)where id=w.id returning *into w;
 else
  select *into w from ac_dce_work_items where id=p_id and kind='media_job'for update;if not found then raise exception 'NOT_FOUND';end if;
  if w.data->>'worker'is distinct from p_worker or w.data->>'lease'is distinct from p_lease or(w.data->>'leaseUntil')::timestamptz<now()then raise exception 'LEASE_CONFLICT';end if;
  if w.status='cancel_requested'then update ac_dce_work_items set status='cancelled',revision=revision+1,updated_at=now(),data=data-'lease'-'leaseUntil'where id=w.id returning *into w;return to_jsonb(w);end if;
  if w.status<>'running'then raise exception 'JOB_NOT_RUNNING';end if;
  if p_action='heartbeat'then update ac_dce_work_items set data=data||jsonb_build_object('leaseUntil',now()+interval'120 seconds','stage',left(p_input->>'stage',80),'progress',greatest(0,least(99,coalesce((p_input->>'progress')::int,0)))),updated_at=now()where id=w.id returning *into w;
  elsif p_action='finish'then
   if not exists(select 1 from ac_dce_processing_outputs where job_id=w.id and state='verified')and coalesce(p_input->>'text','')=''then raise exception 'OUTPUT_REQUIRED';end if;
   if exists(select 1 from ac_dce_processing_outputs where job_id=w.id and state='pending')then raise exception 'OUTPUT_VERIFICATION_REQUIRED';end if;
   update ac_dce_work_items set status='needs_review',revision=revision+1,updated_at=now(),data=(data-'lease'-'leaseUntil')||jsonb_build_object('stage','review','progress',100,'result',p_input,'completedAt',now())where id=w.id returning *into w;
  elsif p_action='fail'then update ac_dce_work_items set status='failed',revision=revision+1,updated_at=now(),data=(data-'lease'-'leaseUntil')||jsonb_build_object('errorCode',left(p_input->>'code',120),'errorStage',left(p_input->>'stage',80),'failedAt',now())where id=w.id returning *into w;
  else raise exception 'ACTION_NOT_SUPPORTED';end if;
 end if;return to_jsonb(w);
end $$;
-- Privacy-preserving exact strategic queries. Legacy events remain available in the original investigation view.
create or replace function public.ac_dce_strategy(p_tenant text,p_territory text,p_since timestamptz,p_until timestamptz,p_environment text,p_family text,p_locale text,p_record uuid,p_steps jsonb default '["discover","start","complete"]')returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 with recursive ev as(select *from ac_dce_activity_v2 where tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory and environment=p_environment and(p_family=''or dimensions->>'family'=p_family)and(p_locale=''or dimensions->>'locale'=p_locale)and(p_record is null or record_id=p_record)),
 windowed as(select *from ev where occurred_at>=p_since and occurred_at<p_until),
 steps as(select value as action,ordinality::int as n from jsonb_array_elements_text(p_steps)with ordinality),
 funnel(subject_key,record_id,n,at)as(
  select subject_key,record_id,1,min(occurred_at)from windowed where action=(select action from steps where n=1)group by subject_key,record_id
  union all select f.subject_key,f.record_id,f.n+1,e.at from funnel f join steps s on s.n=f.n+1 cross join lateral(select min(occurred_at)at from windowed w where w.subject_key=f.subject_key and w.record_id=f.record_id and w.action=s.action and w.occurred_at>=f.at)e where e.at is not null),
 entrants as(select subject_key,min(occurred_at)first_at from ev where action='start' group by subject_key),
 cohorts as(select *from entrants where first_at>=p_since and first_at<p_until),
 horizons as(select *from(values(1),(7),(30))v(day)),
 retention as(select h.day,count(c.*)as cohort_size,count(*)filter(where c.first_at+(h.day+1)*interval'1 day'<=p_until)as eligible,
 count(*)filter(where c.first_at+(h.day+1)*interval'1 day'<=p_until and exists(select 1 from ev e where e.subject_key=c.subject_key and e.action in('start','checkpoint','complete','return')and e.occurred_at>=c.first_at+h.day*interval'1 day'and e.occurred_at<c.first_at+(h.day+1)*interval'1 day'))as retained from horizons h left join cohorts c on true group by h.day)
 select jsonb_build_object('contractVersion',2,'environment',p_environment,'since',p_since,'until',p_until,'generatedAt',now(),'events',(select count(*)from windowed),'subjects',(select count(distinct subject_key)from windowed),'funnel',coalesce((select jsonb_agg(jsonb_build_object('step',s.n,'action',s.action,'reached',(select count(*)from funnel f where f.n=s.n))order by s.n)from steps s),'[]'),
 'retention',(select jsonb_agg(jsonb_build_object('day',day,'cohort',cohort_size,'eligible',eligible,'retained',retained,'rate',case when eligible>0 then retained::numeric/eligible else null end)order by day)from retention),
 'actions',coalesce((select jsonb_object_agg(action,n)from(select action,count(*)n from windowed group by action)a),'{}'),
 'definitions',jsonb_build_object('funnelUnit','subject and experience; ordered events inside selected window','retentionUnit','subject; first recorded start; exact elapsed day window','productionOnly',p_environment='production','legacyEventsExcluded',true));
$$;
create or replace function public.ac_dce_professional_health(p_tenant text,p_territory text,p_private boolean default false)returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 with w as(select *from ac_dce_work_items where tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory)
 select jsonb_build_object('contract','ANGELCARE_DCE_PROFESSIONAL_R4','checkedAt',now(),'processingQueued',(select count(*)from w where kind='media_job'and status='queued'),'processingFailed',(select count(*)from w where kind='media_job'and status='failed'),'processingReview',(select count(*)from w where kind='media_job'and status='needs_review'),'expiredLeases',(select count(*)from w where kind='media_job'and status='running'and(data->>'leaseUntil')::timestamptz<now()),'overdueTasks',(select count(*)from w where kind='task'and status not in('done','cancelled')and(data->>'dueAt')::timestamptz<now()),'pendingReviews',(select count(*)from w where kind='task'and status='review'),'disposalPending',case when p_private then(select count(*)from w where kind='disposal'and status in('scheduled','failed'))else null end,'capabilities',coalesce((select jsonb_agg(jsonb_build_object('title',title,'observedAt',updated_at,'status',status,'data',data))from ac_dce_work_items where kind='capability'and(tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory or tenant_id is null and territory_id is null)),'[]'));
$$;
-- Owned tables and functions are never callable by browser roles.
do $$declare n text;f regprocedure;begin
 foreach n in array array['ac_dce_work_items','ac_dce_edit_presence','ac_dce_field_edits','ac_dce_text_documents','ac_dce_editorial_authors','ac_dce_activity_v2','ac_dce_processing_outputs','ac_dce_disposal_items']loop
 execute format('comment on table public.%I is %L',n,'ANGELCARE_DCE_PROFESSIONAL_R4');execute format('alter table public.%I enable row level security',n);execute format('revoke all on public.%I from public',n);
 if exists(select 1 from pg_roles where rolname='anon')then execute format('revoke all on public.%I from anon',n);end if;if exists(select 1 from pg_roles where rolname='authenticated')then execute format('revoke all on public.%I from authenticated',n);end if;if exists(select 1 from pg_roles where rolname='service_role')then execute format('grant all on public.%I to service_role',n);end if;end loop;
 for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_editorial_guard','ac_dce_author_evidence','ac_dce_work_write','ac_dce_work_page','ac_dce_field_patch','ac_dce_approval_exception','ac_dce_processing_action','ac_dce_strategy','ac_dce_professional_health')loop
 execute format('comment on function %s is %L',f,'ANGELCARE_DCE_PROFESSIONAL_R4');execute format('revoke all on function %s from public',f);if exists(select 1 from pg_roles where rolname='anon')then execute format('revoke all on function %s from anon',f);end if;if exists(select 1 from pg_roles where rolname='authenticated')then execute format('revoke all on function %s from authenticated',f);end if;if exists(select 1 from pg_roles where rolname='service_role')then execute format('grant execute on function %s to service_role',f);end if;end loop;
end $$;


create or replace function public.ac_dce_json_set(p jsonb,path text[],v jsonb)returns jsonb language plpgsql immutable set search_path=public,pg_temp as $$declare i int;begin
 if cardinality(path)<1 or path&&array['__proto__','constructor','prototype']then raise exception 'INVALID_PATH';end if;
 if cardinality(path)>1 then for i in 1..cardinality(path)-1 loop if p#>path[1:i]is null then p:=jsonb_set(p,path[1:i],'{}',true);end if;end loop;end if;
 return jsonb_set(p,path,v,true);end $$;
create or replace function public.ac_dce_text_commit(p_actor text,p_tenant text,p_territory text,p_id uuid,p_path text[],p_generation uuid,p_doc_revision int,p_before text,p_nodes jsonb,p_value text,p_spans jsonb default'[]',p_reset boolean default false)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;d ac_dce_text_documents;rendered text;generation uuid:=coalesce(p_generation,gen_random_uuid());
begin
 select *into r from ac_dce_records where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 if r.kind not in('experience','template','content','bundle')or cardinality(p_path)<>4 or p_path[1]<>'data'or p_path[2]<>'locales'or p_path[3]not in('fr','en','ar')or p_path[4]not in('body','summary','instructions')then raise exception 'FIELD_NOT_ALLOWED';end if;
 select *into d from ac_dce_text_documents where record_id=p_id and path=p_path for update;
 if d.record_id is not null and(d.revision<>p_doc_revision or d.generation is distinct from p_generation)then raise exception 'DOC_REVISION_CONFLICT';end if;
 if p_reset then if d.record_id is null or d.value_hash=md5(p_before)or p_value is distinct from p_before then raise exception 'INVALID_TEXT_RESET';end if;generation:=gen_random_uuid();end if;
 if d.record_id is null and p_doc_revision<>0 then raise exception 'DOC_REVISION_CONFLICT';end if;
 if coalesce(to_jsonb(r)#>>p_path,'')is distinct from p_before then raise exception 'TEXT_REPLACED_REOPEN';end if;
 if jsonb_array_length(p_nodes)>50000 or octet_length(p_nodes::text)>4500000 then raise exception 'TEXT_LIMIT';end if;
 with recursive nodes as(select value n from jsonb_array_elements(p_nodes)),walk(n,sort)as(
 select n,array[lpad((9999999999-(n->>'clock')::bigint)::text,10,'0')||(n->>'id')]from nodes where n->>'after'=''
 union all select child.n,w.sort||(lpad((9999999999-(child.n->>'clock')::bigint)::text,10,'0')||(child.n->>'id'))from walk w join nodes child on child.n->>'after'=w.n->>'id')
 select coalesce(string_agg(n->>'char',''order by sort)filter(where not coalesce((n->>'deleted')::boolean,false)),'')into rendered from walk;
 if rendered is distinct from p_value then raise exception 'TEXT_RENDER_MISMATCH';end if;
 insert into ac_dce_text_documents(record_id,path,generation,nodes,value_hash,revision)values(p_id,p_path,generation,p_nodes,md5(p_value),1)
 on conflict(record_id,path)do update set generation=excluded.generation,nodes=excluded.nodes,value_hash=excluded.value_hash,revision=ac_dce_text_documents.revision+1,updated_at=now()returning *into d;
 if p_before is distinct from p_value or coalesce(r.data#>array['formattedText',p_path[3],p_path[4]],'[]')is distinct from p_spans then
 update ac_dce_records set data=ac_dce_json_set(ac_dce_json_set(to_jsonb(r),p_path,to_jsonb(p_value)),array['data','formattedText',p_path[3],p_path[4]],p_spans)->'data',lifecycle='draft',revision=revision+1,updated_by=p_actor,updated_at=now()where id=p_id returning *into r;
 insert into ac_dce_versions(record_id,revision,snapshot,actor_id)values(r.id,r.revision,to_jsonb(r),p_actor);
 end if;
 return jsonb_build_object('document',to_jsonb(d),'record',to_jsonb(r));
end $$;
do $$declare f regprocedure;begin for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_text_commit','ac_dce_json_set')loop execute format('comment on function %s is %L',f,'ANGELCARE_DCE_PROFESSIONAL_R4');execute format('revoke all on function %s from public,anon,authenticated',f);execute format('grant execute on function %s to service_role',f);end loop;end $$;


do $$begin if to_regclass('public.ac_dce_production_sources')is not null and obj_description(to_regclass('public.ac_dce_production_sources'),'pg_class')is distinct from'ANGELCARE_DCE_PROFESSIONAL_R4'then raise exception 'UNRELATED_SOURCE_TABLE';end if;end $$;
create table if not exists public.ac_dce_production_sources(id uuid primary key,file_name text not null,mime_type text not null,size_bytes bigint not null,sha256 text not null,state text not null default'pending'check(state in('pending','verified','revoked')),created_by text not null,created_at timestamptz not null default now(),verified_at timestamptz,tenant_id text,territory_id text);
comment on table public.ac_dce_production_sources is'ANGELCARE_DCE_PROFESSIONAL_R4';alter table public.ac_dce_production_sources enable row level security;revoke all on public.ac_dce_production_sources from public,anon,authenticated;grant all on public.ac_dce_production_sources to service_role;
create or replace function public.ac_dce_case_operation(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_operation_id uuid,p_operation_revision int,p_data jsonb,p_status text,p_resolution text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;w ac_dce_work_items;c ac_dce_commands;reply jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select *into r from ac_dce_records where id=p_id and kind='case'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'CASE_NOT_FOUND';end if;if r.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 if p_status not in('open','assigned','waiting_customer','resolved','closed')or p_status in('resolved','closed')and length(p_resolution)<8 then raise exception 'CASE_STATUS_REQUIRED';end if;
 select *into w from ac_dce_work_items where record_id=r.id and kind='case_operation'for update;
 if w.id is distinct from p_operation_id or coalesce(w.revision,0)<>p_operation_revision then raise exception 'OPERATION_CONFLICT';end if;
 if w.id is null then insert into ac_dce_work_items(kind,record_id,title,status,data,created_by,updated_by,tenant_id,territory_id)values('case_operation',r.id,r.title,p_status,p_data,p_actor,p_actor,p_tenant,p_territory)returning *into w;
 else update ac_dce_work_items set status=p_status,data=p_data,revision=revision+1,updated_at=now(),updated_by=p_actor where id=w.id returning *into w;end if;
 update ac_dce_records set lifecycle=p_status,data=data||jsonb_build_object('assignedTo',p_data->'assignedTo','priority',p_data->'priority','resolution',p_resolution,'decisions',coalesce(data->'decisions','[]')||jsonb_build_array(jsonb_build_object('action',p_status,'reason',p_resolution,'actorId',p_actor,'createdAt',now()))),revision=revision+1,updated_by=p_actor,updated_at=now()where id=r.id returning *into r;
 insert into ac_dce_versions(record_id,revision,snapshot,actor_id)values(r.id,r.revision,to_jsonb(r),p_actor);
 insert into ac_dce_events(channel,action,record_id,actor_id,request_id,data,tenant_id,territory_id)values('admin','case_operation',r.id,p_actor,p_request,jsonb_build_object('status',p_status,'operationId',w.id),p_tenant,p_territory);
 reply:=jsonb_build_object('record',to_jsonb(r),'operation',to_jsonb(w));insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_retention_hold(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_active boolean,p_reason text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r ac_dce_records;reply jsonb;c ac_dce_commands;begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select *into r from ac_dce_records where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory and kind in('case','run','contribution')for update;if not found then raise exception 'NOT_FOUND';end if;if r.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;if length(p_reason)<8 then raise exception 'REASON_REQUIRED';end if;
 update ac_dce_records set data=data||jsonb_build_object('retentionHold',jsonb_build_object('active',p_active,'reason',p_reason,'actorId',p_actor,'at',now())),revision=revision+1,updated_by=p_actor,updated_at=now()where id=p_id returning *into r;
 insert into ac_dce_versions(record_id,revision,snapshot,actor_id)values(r.id,r.revision,to_jsonb(r),p_actor);reply:=to_jsonb(r);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;end $$;
create or replace function public.ac_dce_disposal_prepare(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_policy uuid,p_reason text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p ac_dce_work_items;plan ac_dce_work_items;c ac_dce_commands;n int;reply jsonb;cutoff timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select *into p from ac_dce_work_items where id=p_policy and kind='retention_policy'and status='active'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory;if not found then raise exception 'POLICY_NOT_FOUND';end if;
 if length(p_reason)<12 then raise exception 'REASON_REQUIRED';end if;cutoff:=now()-make_interval(days=>(p.data->>'days')::int);
 insert into ac_dce_work_items(kind,title,status,data,created_by,updated_by,tenant_id,territory_id)values('disposal',p.title,'scheduled',jsonb_build_object('policyId',p.id,'policyRevision',p.revision,'reason',p_reason,'cutoff',cutoff,'executeAfter',now()+make_interval(days=>(p.data->>'graceDays')::int),'target',p.data->>'target'),p_actor,p_actor,p_tenant,p_territory)returning *into plan;
 if p.data->>'target'in('case','run','contribution')then
 insert into ac_dce_disposal_items(plan_id,target_id,target_kind,expected_revision,expected_hash,state,reason)
 select plan.id,r.id,r.kind,r.revision,md5(to_jsonb(r)::text),case when coalesce((r.data->'retentionHold'->>'active')::boolean,false)or r.lifecycle not in('closed','resolved','archived','rejected')or r.published_release_id is not null then'blocked'else'scheduled'end,'Revalidate hold, lifecycle, dependencies and revision at execution'from ac_dce_records r where r.kind=p.data->>'target'and r.tenant_id is not distinct from p_tenant and r.territory_id is not distinct from p_territory and r.updated_at<cutoff and coalesce((r.data->>'disposed')::boolean,false)=false;
 end if;
 if p.data->>'target'in('attachment','case')then
 insert into ac_dce_disposal_items(plan_id,target_id,target_kind,expected_hash,state,reason)
 select plan.id,a.id,'attachment',md5(to_jsonb(a)::text),case when coalesce((r.data->'retentionHold'->>'active')::boolean,false)or r.lifecycle not in('closed','resolved','archived','rejected')then'blocked'else'scheduled'end,'Revoke access, delete owned bytes, retain receipt'from ac_dce_attachment_receipts a join ac_dce_records r on r.id=a.case_id where a.tenant_id is not distinct from p_tenant and a.territory_id is not distinct from p_territory and a.created_at<cutoff and a.state<>'revoked'and(p.data->>'target'='attachment'or exists(select 1 from ac_dce_disposal_items where plan_id=plan.id and target_id=r.id))on conflict do nothing;
 end if;
 if p.data->>'target'='production_output'then
 insert into ac_dce_disposal_items(plan_id,target_id,target_kind,expected_revision,expected_hash,state,reason)
 select plan.id,o.id,'production_output',j.revision,md5(to_jsonb(o)::text),case when j.status not in('failed','cancelled')or o.state='promoted'or exists(select 1 from angelcare_marketplace_media_assets m where m.id=o.asset_id)then'blocked'else'scheduled'end,'Only abandoned unpromoted DCE derivatives; source and native media remain protected'
 from ac_dce_processing_outputs o join ac_dce_work_items j on j.id=o.job_id where o.tenant_id is not distinct from p_tenant and o.territory_id is not distinct from p_territory and o.created_at<cutoff and o.state<>'disposed';
 end if;
 if p.data->>'target'='event'then insert into ac_dce_disposal_items(plan_id,target_id,target_kind,expected_hash)select plan.id,e.id,'event',md5(to_jsonb(e)::text)from ac_dce_activity_v2 e where e.tenant_id is not distinct from p_tenant and e.territory_id is not distinct from p_territory and e.occurred_at<cutoff;end if;
 select count(*)into n from ac_dce_disposal_items where plan_id=plan.id;update ac_dce_work_items set data=data||jsonb_build_object('total',n,'blocked',(select count(*)from ac_dce_disposal_items where plan_id=plan.id and state='blocked'),'bytes',(select coalesce(sum(a.size_bytes),0)from ac_dce_attachment_receipts a join ac_dce_disposal_items d on d.target_id=a.id where d.plan_id=plan.id))where id=plan.id returning *into plan;
 reply:=to_jsonb(plan);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_disposal_execute(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_limit int default 30)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare receipt ac_dce_commands;reply jsonb;plan ac_dce_work_items;d ac_dce_disposal_items;r ac_dce_records;a ac_dce_attachment_receipts;o ac_dce_processing_outputs;j ac_dce_work_items;jobs jsonb:='[]';done int:=0;blocked int:=0;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into receipt from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if receipt.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return receipt.response;end if;
 select *into plan from ac_dce_work_items where id=p_id and kind='disposal'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;if plan.status not in('scheduled','failed')or(plan.data->>'executeAfter')::timestamptz>now()then raise exception 'DISPOSAL_NOT_DUE';end if;
 for d in select *from ac_dce_disposal_items where plan_id=plan.id and state in('scheduled','failed','revoked')order by updated_at,case when target_kind='attachment'then 0 else 1 end,id for update skip locked limit greatest(1,least(p_limit,100))loop
  if d.target_kind='attachment'then
   select *into a from ac_dce_attachment_receipts where id=d.target_id for update;select *into r from ac_dce_records where id=a.case_id for update;
   if a.id is null or r.id is null or coalesce((r.data->'retentionHold'->>'active')::boolean,false)or r.lifecycle not in('closed','resolved','archived','rejected')or exists(select 1 from angelcare_marketplace_media_assets where id=a.id)or a.state<>'revoked'and md5(to_jsonb(a)::text)<>d.expected_hash then update ac_dce_disposal_items set state='blocked',reason='Hold, active case, shared file or later change',updated_at=now()where id=d.id;blocked:=blocked+1;continue;end if;
   update ac_dce_attachment_receipts set state='revoked'where id=a.id;update ac_dce_disposal_items set state='revoked',updated_at=now()where id=d.id;jobs:=jobs||jsonb_build_array(jsonb_build_object('id',d.id,'assetId',a.id));
  elsif d.target_kind='production_output'then
   select *into o from ac_dce_processing_outputs where id=d.target_id for update;select *into j from ac_dce_work_items where id=o.job_id for update;
   if o.id is null or j.id is null or j.status not in('failed','cancelled')or j.revision<>d.expected_revision or o.state='promoted'or exists(select 1 from angelcare_marketplace_media_assets m where m.id=o.asset_id)or o.state<>'revoked'and md5(to_jsonb(o)::text)<>d.expected_hash then update ac_dce_disposal_items set state='blocked',reason='Active job, later change or native media dependency',updated_at=now()where id=d.id;blocked:=blocked+1;continue;end if;
   update ac_dce_processing_outputs set state='revoked'where id=o.id;update ac_dce_disposal_items set state='revoked',updated_at=now()where id=d.id;jobs:=jobs||jsonb_build_array(jsonb_build_object('id',d.id,'assetId',o.asset_id));
  elsif d.target_kind in('case','run','contribution')then
   select *into r from ac_dce_records where id=d.target_id for update;
   if r.id is null then update ac_dce_disposal_items set state='disposed',updated_at=now()where id=d.id;continue;end if;
   if r.revision<>d.expected_revision or md5(to_jsonb(r)::text)<>d.expected_hash or coalesce((r.data->'retentionHold'->>'active')::boolean,false)or r.published_release_id is not null or exists(select 1 from ac_dce_links where target_type='record'and target_id=r.id)or exists(select 1 from ac_dce_releases where record_id=r.id)or exists(select 1 from ac_dce_attachment_receipts att where att.case_id=r.id and not exists(select 1 from ac_dce_disposal_items x where x.target_id=att.id and x.state='disposed'))then update ac_dce_disposal_items set state='blocked',reason='Later edit, hold, active dependency or pending file disposal',updated_at=now()where id=d.id;blocked:=blocked+1;continue;end if;
   update ac_dce_records set title='Disposed DCE receipt',data=jsonb_build_object('disposed',true,'disposedAt',now(),'disposalPlanId',plan.id,'requiredLocales','[]'::jsonb),lifecycle='archived',revision=revision+1,updated_by=p_actor,updated_at=now()where id=r.id returning *into r;
   delete from ac_dce_versions where record_id=r.id;insert into ac_dce_versions(record_id,revision,snapshot,actor_id)values(r.id,r.revision,to_jsonb(r),p_actor);
   update ac_dce_work_items set title='Disposed case metadata',data=jsonb_build_object('disposed',true,'disposalPlanId',plan.id),status='disposed',revision=revision+1,updated_at=now()where record_id=r.id and kind in('case_operation','notification','comment');
   update ac_dce_disposal_items set state='disposed',updated_at=now()where id=d.id;done:=done+1;
  elsif d.target_kind='event'then delete from ac_dce_activity_v2 where id=d.target_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory;update ac_dce_disposal_items set state='disposed',updated_at=now()where id=d.id;done:=done+1;
  end if;
 end loop;
 update ac_dce_work_items set status=case when exists(select 1 from ac_dce_disposal_items where plan_id=plan.id and state not in('disposed','cancelled'))then'scheduled'else'disposed'end,updated_at=now(),revision=revision+1 where id=plan.id;
 insert into ac_dce_events(channel,action,actor_id,request_id,data,tenant_id,territory_id)values('admin','disposal_execution',p_actor,p_request,jsonb_build_object('planId',plan.id,'disposed',done,'blocked',blocked),p_tenant,p_territory);
 reply:=jsonb_build_object('disposed',done,'blocked',blocked,'byteDeletion',jobs);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_disposal_finish(p_actor text,p_tenant text,p_territory text,p_id uuid,p_ok boolean)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare d ac_dce_disposal_items;p ac_dce_work_items;begin
 select *into d from ac_dce_disposal_items where id=p_id for update;select *into p from ac_dce_work_items where id=d.plan_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory;if p.id is not null and d.state='disposed'then return to_jsonb(d);end if;if p.id is null or d.state<>'revoked'then raise exception 'NOT_FOUND';end if;
 if p_ok then if d.target_kind='attachment'then update ac_dce_attachment_receipts set file_name='disposed',customer_id=null,field_id=null where id=d.target_id;elsif d.target_kind='production_output'then update ac_dce_processing_outputs set state='disposed',metadata='{}'where id=d.target_id;end if;end if;
 update ac_dce_disposal_items set state=case when p_ok then'disposed'else'failed'end,error=case when p_ok then null else'Owned file deletion requires retry'end,updated_at=now()where id=p_id returning *into d;return to_jsonb(d);end $$;
do $$declare f regprocedure;begin for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_case_operation','ac_dce_retention_hold','ac_dce_disposal_prepare','ac_dce_disposal_execute','ac_dce_disposal_finish')loop execute format('comment on function %s is %L',f,'ANGELCARE_DCE_PROFESSIONAL_R4');execute format('revoke all on function %s from public,anon,authenticated',f);execute format('grant execute on function %s to service_role',f);end loop;end $$;


create or replace function public.ac_dce_rebind(p_id uuid)returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;begin
 select *into r from ac_dce_records where id=p_id;if not found then raise exception 'NOT_FOUND';end if;
 delete from ac_dce_links where record_id=p_id;
 with recursive walk(key,value)as(
 select key,value from jsonb_each(r.data||jsonb_build_object('parentId',r.topic))
 union all select x.key,x.value from walk w cross join lateral(
 select key,value from jsonb_each(case when jsonb_typeof(w.value)='object'then w.value else'{}'::jsonb end)
 union all select w.key,value from jsonb_array_elements(case when jsonb_typeof(w.value)='array'then w.value else'[]'::jsonb end))x),refs as(
 select distinct case when key in('assetId','nativeAssetId','narrationAssetId','captionAssetId','backAssetId','coverAssetId','posterAssetId')then'media'when key='nativeId'then'offer'else'record'end as kind,(value#>>'{}')::uuid as id from walk where jsonb_typeof(value)='string'and value#>>'{}'~*'^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'and key in('assetId','nativeAssetId','narrationAssetId','captionAssetId','backAssetId','coverAssetId','posterAssetId','nativeId','experienceId','assessmentId','contentId','templateId','accessPolicyId','parentId','adPolicyId','rewardPolicyId','dependencies'))
 insert into ac_dce_links select p_id,kind,id from refs;
 insert into ac_dce_links select p_id,'media',key::uuid from ac_dce_releases z cross join lateral jsonb_object_keys(coalesce(z.manifest->'bindings'->'media','{}'))key where z.record_id=p_id and z.state in('published','scheduled','withdrawn')on conflict do nothing;
end $$;
create or replace function public.ac_dce_patch_references()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin if current_setting('ac_dce.field_patch',true)='on'then perform ac_dce_rebind(new.id);end if;return new;end $$;
drop trigger if exists ac_dce_patch_references_trigger on ac_dce_records;
create trigger ac_dce_patch_references_trigger after update of data on ac_dce_records for each row execute function ac_dce_patch_references();
do $$declare f regprocedure;begin for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_rebind','ac_dce_patch_references')loop execute format('comment on function %s is %L',f,'ANGELCARE_DCE_PROFESSIONAL_R4');execute format('revoke all on function %s from public,anon,authenticated',f);execute format('grant execute on function %s to service_role',f);end loop;end $$;


do $$begin if to_regclass('public.ac_dce_service_cursor')is not null and obj_description(to_regclass('public.ac_dce_service_cursor'),'pg_class')is distinct from'ANGELCARE_DCE_PROFESSIONAL_R4'then raise exception'FOREIGN_CURSOR';end if;end $$;
create table if not exists ac_dce_service_cursor(scope_key text primary key,after_id uuid,updated_at timestamptz not null default now());
comment on table ac_dce_service_cursor is'ANGELCARE_DCE_PROFESSIONAL_R4';alter table ac_dce_service_cursor enable row level security;revoke all on ac_dce_service_cursor from public,anon,authenticated;grant all on ac_dce_service_cursor to service_role;
create or replace function public.ac_dce_service_batch(p_tenant text,p_territory text,p_limit int default 20)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare s text:=coalesce(p_tenant,'~')||'|'||coalesce(p_territory,'~');cursor_id uuid;reply jsonb;last_id uuid;begin
 insert into ac_dce_service_cursor values(s,null,now())on conflict do nothing;select after_id into cursor_id from ac_dce_service_cursor where scope_key=s for update;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]')into reply from(select *from ac_dce_records where scope_key=s and kind='case'and lifecycle in('open','assigned','waiting_customer')and(cursor_id is null or id>cursor_id)order by id limit greatest(1,least(p_limit,100)))x;
 if jsonb_array_length(reply)=0 and cursor_id is not null then update ac_dce_service_cursor set after_id=null where scope_key=s;return ac_dce_service_batch(p_tenant,p_territory,p_limit);end if;
 last_id:=(reply->-1->>'id')::uuid;update ac_dce_service_cursor set after_id=last_id,updated_at=now()where scope_key=s;return reply;
end $$;
create or replace function public.ac_dce_editorial_notice()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$declare recipient text;begin
 if new.kind='task'and(tg_op='INSERT'or new.status is distinct from old.status or new.data->>'assignedTo'is distinct from old.data->>'assignedTo')then
 for recipient in select distinct value from jsonb_array_elements_text(jsonb_build_array(new.data->>'assignedTo',case when new.status='review'then new.data->>'reviewerId'else null end))where value is not null and value<>''loop
 insert into ac_dce_work_items(kind,record_id,title,status,data,created_by,updated_by,tenant_id,territory_id)values('editorial_notice',new.record_id,new.title,'unread',jsonb_build_object('assignedTo',recipient,'taskId',new.id,'state',new.status,'dueAt',new.data->'dueAt'),new.updated_by,new.updated_by,new.tenant_id,new.territory_id);
 end loop;end if;return new;end $$;
drop trigger if exists ac_dce_editorial_notice_trigger on ac_dce_work_items;
create trigger ac_dce_editorial_notice_trigger after insert or update on ac_dce_work_items for each row execute function ac_dce_editorial_notice();
do $$declare f regprocedure;begin for f in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname in('ac_dce_service_batch','ac_dce_editorial_notice')loop execute format('comment on function %s is %L',f,'ANGELCARE_DCE_PROFESSIONAL_R4');execute format('revoke all on function %s from public,anon,authenticated',f);execute format('grant execute on function %s to service_role',f);end loop;end $$;


create or replace function public.ac_dce_service_scopes(p_limit int default 10)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare after_id uuid;reply jsonb;begin
 insert into ac_dce_service_cursor values('__scheduler_scopes__',null,now())on conflict do nothing;select c.after_id into after_id from ac_dce_service_cursor c where scope_key='__scheduler_scopes__'for update;
 with scopes as(select tenant_id,territory_id,(array_agg(id order by id))[1]id from ac_dce_work_items where kind='sla_policy'and status='active'group by tenant_id,territory_id)
 select coalesce(jsonb_agg(to_jsonb(s)),'[]')into reply from(select *from scopes where after_id is null or id>after_id order by id limit greatest(1,least(p_limit,20)))s;
 if jsonb_array_length(reply)=0 and after_id is not null then update ac_dce_service_cursor set after_id=null where scope_key='__scheduler_scopes__';return ac_dce_service_scopes(p_limit);end if;
 update ac_dce_service_cursor set after_id=(reply->-1->>'id')::uuid,updated_at=now()where scope_key='__scheduler_scopes__';return reply;
end $$;
comment on function ac_dce_service_scopes(int)is'ANGELCARE_DCE_PROFESSIONAL_R4';revoke all on function ac_dce_service_scopes(int)from public,anon,authenticated;grant execute on function ac_dce_service_scopes(int)to service_role;


create or replace function public.ac_dce_response_stamp(p_actor text,p_tenant text,p_territory text,p_case uuid,p_notification uuid)returns void language plpgsql security definer set search_path=public,pg_temp as $$declare r ac_dce_records;n ac_dce_work_items;begin
 select *into r from ac_dce_records where id=p_case and kind='case'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 select *into n from ac_dce_work_items where id=p_notification and kind='notification'and record_id=r.id and status='provider_accepted';if not found then raise exception 'ACCEPTED_RECEIPT_REQUIRED';end if;
 insert into ac_dce_work_items(kind,record_id,title,status,data,created_by,updated_by,tenant_id,territory_id)values('case_operation',r.id,r.title,r.lifecycle,jsonb_build_object('firstResponseAt',n.updated_at,'assignedTo',r.data->>'assignedTo','team',r.data->>'responsibleTeam','notes','[]'::jsonb,'pauses','[]'::jsonb),p_actor,p_actor,p_tenant,p_territory)on conflict do nothing;
 update ac_dce_work_items set data=jsonb_set(data,'{firstResponseAt}',to_jsonb(n.updated_at)),revision=revision+1,updated_at=now()where kind='case_operation'and record_id=r.id and scope_key=r.scope_key and data->>'firstResponseAt'is null;
end $$;
comment on function public.ac_dce_response_stamp(text,text,text,uuid,uuid)is'ANGELCARE_DCE_PROFESSIONAL_R4';
revoke all on function public.ac_dce_response_stamp(text,text,text,uuid,uuid)from public,anon,authenticated;
grant execute on function public.ac_dce_response_stamp(text,text,text,uuid,uuid)to service_role;
notify pgrst,'reload schema';
commit;
