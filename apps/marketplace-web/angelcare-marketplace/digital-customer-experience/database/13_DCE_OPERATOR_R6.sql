begin;
do $$begin
 if exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname like 'ac_dce_r6_%'and obj_description(oid,'pg_proc')is distinct from'ANGELCARE_DCE_OPERATOR_R6')then raise exception 'UNRELATED_FUNCTION';end if;
 if to_regclass('public.ac_dce_certificate_retention')is not null and obj_description(to_regclass('public.ac_dce_certificate_retention'),'pg_class')is distinct from'ANGELCARE_DCE_OPERATOR_R6'then raise exception 'UNRELATED_TABLE';end if;
 if to_regclass('public.ac_dce_editions') is null then raise exception 'DCE_R5_REQUIRED_APPLY_11_FIRST';end if;
 if to_regclass('public.ac_dce_operator_batches') is not null and obj_description(to_regclass('public.ac_dce_operator_batches'),'pg_class') is distinct from 'ANGELCARE_DCE_OPERATOR_R6' then raise exception 'UNRELATED_TABLE';end if;
end $$;
alter table ac_dce_activity_v2 drop constraint if exists ac_dce_activity_v2_action_check;
alter table ac_dce_activity_v2 add constraint ac_dce_activity_v2_action_check check(action in('discover','start','checkpoint','complete','bookmark','share','download','print','submission','return','native_conversion','result_view','download_pdf','download_png','certificate_request','action_failed'));
create table if not exists public.ac_dce_operator_batches(id uuid primary key,actor_id text not null,tenant_id text,territory_id text,family text not null,task text not null,source_name text not null,source_hash text not null,chunks jsonb not null,cursor int not null default 0,jobs jsonb not null default '[]',state text not null default 'preparing' check(state in('preparing','prepared','applying','paused','complete','failed')),resume_state text,revision int not null default 1,lease_token uuid,lease_until timestamptz,error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
comment on table public.ac_dce_operator_batches is 'ANGELCARE_DCE_OPERATOR_R6';
create index if not exists ac_dce_operator_batch_scope on ac_dce_operator_batches(tenant_id,territory_id,created_at desc,id);
create index if not exists ac_dce_record_family_key on ac_dce_records(scope_key,family,key)where kind='experience';
create index if not exists ac_dce_record_target on ac_dce_records(scope_key,(data->>'targetId'));
create index if not exists ac_dce_activity_action_date on ac_dce_activity_v2(tenant_id,territory_id,environment,action,occurred_at);
create or replace function public.ac_dce_r6_batch(p_actor text,p_tenant text,p_territory text,p_id uuid,p_revision int,p_action text,p_data jsonb default '{}')returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b ac_dce_operator_batches;token uuid;begin
 if nullif(p_actor,'')is null then raise exception 'ACTOR_REQUIRED';end if;
 if p_action='create'then
 if jsonb_array_length(p_data->'chunks') not between 1 and 5000 then raise exception 'INVALID_BATCH_SIZE';end if;
 insert into ac_dce_operator_batches(id,actor_id,tenant_id,territory_id,family,task,source_name,source_hash,chunks)values(p_id,p_actor,p_tenant,p_territory,p_data->>'family',p_data->>'task',p_data->>'sourceName',p_data->>'sourceHash',p_data->'chunks')on conflict(id)do nothing;
 end if;
 select *into b from ac_dce_operator_batches where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if p_action='create' then if b.actor_id<>p_actor or b.source_hash is distinct from p_data->>'sourceHash' then raise exception 'IDEMPOTENCY_CONFLICT';end if;
 elsif p_action='claim'then
 if b.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 if b.lease_until>now() then raise exception 'BATCH_BUSY';end if;
 if b.state not in('preparing','applying')then raise exception 'CONTINUE_STATE_REQUIRED';end if;
 token:=gen_random_uuid();update ac_dce_operator_batches set lease_token=token,lease_until=now()+interval '180 seconds',revision=revision+1,updated_at=now()where id=b.id returning *into b;
 elsif p_action='checkpoint'then
 if b.lease_token is distinct from (p_data->>'token')::uuid or b.lease_until<now()then raise exception 'LEASE_EXPIRED';end if;
 if(p_data->>'cursor')::int<b.cursor or(p_data->>'cursor')::int>b.cursor+1 then raise exception 'INVALID_CURSOR';end if;
 update ac_dce_operator_batches set cursor=(p_data->>'cursor')::int,jobs=case when p_data->>'jobId' is null then jobs else jobs||jsonb_build_array(p_data->>'jobId')end,state=coalesce(nullif(p_data->>'state',''),state),lease_token=null,lease_until=null,error=null,revision=revision+1,updated_at=now()where id=b.id returning *into b;
 elsif p_action in('pause','resume','apply')then
 if b.revision<>p_revision or b.lease_until>now()then raise exception 'REVISION_CONFLICT';end if;
 if p_action='apply'and b.state not in('prepared','complete')then raise exception 'PREPARATION_REQUIRED';end if;
 if p_action='resume'and b.state<>'paused'then raise exception 'PAUSED_REQUIRED';end if;
 update ac_dce_operator_batches set resume_state=case when p_action='pause'then state else resume_state end,state=case when p_action='pause'then 'paused'when p_action='resume'then coalesce(resume_state,'preparing')else 'applying'end,revision=revision+1,updated_at=now()where id=b.id returning *into b;
 elsif p_action='fail'then
 if b.lease_token is distinct from(p_data->>'token')::uuid then raise exception 'LEASE_REQUIRED';end if;
 update ac_dce_operator_batches set error=left(p_data->>'error',500),lease_token=null,lease_until=null,revision=revision+1,updated_at=now()where id=b.id returning *into b;
 elsif p_action<>'create'then raise exception 'UNKNOWN_BATCH_ACTION';end if;
 return to_jsonb(b);end $$;
create or replace function public.ac_dce_r6_batch_lines(p_tenant text,p_territory text,p_id uuid)returns jsonb language sql security definer set search_path=public,pg_temp as $$with b as(select *from ac_dce_operator_batches where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory),lines as(select l.*from b join ac_dce_job_lines l on l.job_id::text in(select jsonb_array_elements_text(b.jobs))),ready as(select id from lines where state='ready'order by job_id,row_number limit 3)select jsonb_build_object('ready',coalesce((select jsonb_agg(id)from ready),'[]'),'counts',coalesce((select jsonb_object_agg(state,n)from(select state,count(*)n from lines group by state)s),'{}'))$$;
create or replace function public.ac_dce_r6_features()returns jsonb language sql security definer set search_path=public,pg_temp as $$select jsonb_build_object('core',to_regclass('public.ac_dce_records')is not null,'production',to_regclass('public.ac_dce_processing_outputs')is not null,'editions',to_regclass('public.ac_dce_editions')is not null,'certificates',to_regclass('public.ac_dce_certificate_requests')is not null,'operatorBatches',true,'publicServing',false)$$;
create or replace function public.ac_dce_r6_metrics(p_tenant text,p_territory text,p_since timestamptz,p_until timestamptz,p_dimension text default 'action',p_filters jsonb default '{}',p_page int default 1)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare result jsonb;begin
 if p_until<=p_since or p_until-p_since>interval'366 days' or p_dimension not in('action','record_id','audience','source','locale','device','region','family','topic','assetId')then raise exception 'INVALID_REPORT_WINDOW_OR_DIMENSION';end if;
 with ev as(select e.*,case when p_dimension='action'then e.action when p_dimension='record_id'then e.record_id::text else coalesce(e.dimensions->>p_dimension,'unknown')end bucket from ac_dce_activity_v2 e where tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory and environment='production'and occurred_at>=p_since and occurred_at<p_until and not exists(select 1 from jsonb_each_text(p_filters)f where case when f.key='recordId'then e.record_id::text else coalesce(e.dimensions->>f.key,'')end is distinct from f.value)),
 grouped as(select bucket,count(*)count,count(*)filter(where action='complete')completions,count(*)filter(where action='action_failed')failures from ev group by bucket),
 page as(select g.*,coalesce(r.title,g.bucket)label from grouped g left join ac_dce_records r on p_dimension='record_id'and r.id::text=g.bucket order by count desc,bucket limit 50 offset(greatest(1,p_page)-1)*50),
 daily as(select date_trunc('day',occurred_at)bucket_date,count(*)count from ev group by 1),actions as(select action,count(*)count from ev group by action)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(jsonb_build_object('value',bucket,'label',label,'count',count,'completions',completions,'failures',failures))from page),'[]'),'totalBuckets',(select count(*)from grouped),'totalEvents',(select count(*)from ev),'visitors',(select count(distinct subject_key)from ev),'byAction',coalesce((select jsonb_object_agg(action,count)from actions),'{}'),'series',coalesce((select jsonb_agg(jsonb_build_object('created_at',bucket_date,'channel','experience','count',count)order by bucket_date)from daily),'[]'),'complete',true,'source','ac_dce_activity_v2','environment','production','since',p_since,'until',p_until,'checkedAt',now())into result;return result;end $$;
create or replace function public.ac_dce_r6_coverage(p_tenant text,p_territory text,p_family text default '',p_topic uuid default null,p_audience text default '',p_age int default null)returns jsonb language sql security definer set search_path=public,pg_temp as $$
with r as(select *from ac_dce_records where tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory and kind='experience'and lifecycle<>'archived'and(p_family=''or family=p_family)and(p_topic is null or topic=p_topic::text)and(p_audience=''or audience=p_audience)and(p_age is null or(coalesce(nullif(data->>'ageMin','')::numeric,0)<=p_age and coalesce(nullif(data->>'ageMax','')::numeric,120)>=p_age))),cells as(select r.family,r.topic,r.audience,l.locale,count(*)authored,count(*)filter(where l.locale=any(array(select jsonb_array_elements_text(coalesce(r.data->'enabledLocales','["fr"]')))))enabled,count(*)filter(where e.state='approved')approved,count(*)filter(where e.active_release_id is not null)live from r cross join(values('ar'),('fr'),('en'))l(locale)left join ac_dce_editions e on e.record_id=r.id and e.locale=l.locale group by r.family,r.topic,r.audience,l.locale)
select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('topicTitle',coalesce(t.title,'Unclassified')))from cells c left join ac_dce_records t on t.id::text=c.topic),'[]'),'complete',true,'checkedAt',now())$$;
create table if not exists public.ac_dce_certificate_retention(id uuid primary key default gen_random_uuid(),request_id uuid not null unique references ac_dce_certificate_requests,tenant_id text,territory_id text,expected_revision int not null,case_revision int,policy_days int not null check(policy_days between 30 and 3650),reason text not null,hold_reason text,execute_after timestamptz not null,state text not null default 'planned' check(state in('planned','cancelled','anonymised')),revision int not null default 1,actor_id text not null,created_at timestamptz not null default now());
alter table ac_dce_certificate_retention add column if not exists case_revision int;
comment on table public.ac_dce_certificate_retention is 'ANGELCARE_DCE_OPERATOR_R6';
create or replace function public.ac_dce_r6_retention(p_actor text,p_tenant text,p_territory text,p_id uuid,p_revision int,p_action text,p_data jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r ac_dce_certificate_requests;p ac_dce_certificate_retention;days int;begin
 select *into r from ac_dce_certificate_requests where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception 'NOT_FOUND';end if;
 select *into p from ac_dce_certificate_retention where request_id=r.id for update;
 if p_action='plan'then
 days:=(p_data->>'days')::int;if r.revision<>p_revision or r.status not in('closed','cancelled','rejected')or r.updated_at>now()-make_interval(days=>days)or length(trim(coalesce(p_data->>'reason','')))<10 then raise exception 'RETENTION_NOT_ELIGIBLE';end if;
 insert into ac_dce_certificate_retention(request_id,tenant_id,territory_id,expected_revision,case_revision,policy_days,reason,execute_after,actor_id)values(r.id,p_tenant,p_territory,r.revision,(select revision from ac_dce_records where id=nullif(r.data->>'privateCaseId','')::uuid),days,p_data->>'reason',now()+interval'7 days',p_actor)on conflict(request_id)do update set expected_revision=excluded.expected_revision,case_revision=excluded.case_revision,policy_days=excluded.policy_days,reason=excluded.reason,execute_after=excluded.execute_after,state='planned',revision=ac_dce_certificate_retention.revision+1 returning *into p;
 elsif p_action='hold'then
 if p.id is null or p.revision<>p_revision or length(trim(coalesce(p_data->>'reason','')))<10 then raise exception 'HOLD_REASON_REQUIRED';end if;update ac_dce_certificate_retention set hold_reason=p_data->>'reason',revision=revision+1 where id=p.id returning *into p;
 elsif p_action='cancel'then
 if p.id is null or p.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;update ac_dce_certificate_retention set state='cancelled',revision=revision+1 where id=p.id returning *into p;
 elsif p_action='execute'then
 if p.id is null or p.revision<>p_revision or p.state<>'planned'or p.hold_reason is not null or p.execute_after>now()or r.revision<>p.expected_revision or r.status not in('closed','cancelled','rejected')then raise exception 'DISPOSAL_BLOCKED';end if;
 if exists(select 1 from ac_dce_records c where c.id=nullif(r.data->>'privateCaseId','')::uuid and(c.revision is distinct from p.case_revision or coalesce((c.data->'retentionHold'->>'active')::boolean,false)))then raise exception 'FULFILMENT_CHANGED_OR_HELD';end if;
 if exists(select 1 from ac_dce_attachment_receipts where case_id=nullif(r.data->>'privateCaseId','')::uuid and state='linked')then raise exception 'PRIVATE_FILE_RETENTION_REQUIRED';end if;
 update ac_dce_certificate_requests set learner_name='Anonymised',requester_name='Anonymised',email='anonymised@invalid.example',phone='',subject_hash=encode(sha256((id::text||'anonymised')::bytea),'hex'),data=jsonb_build_object('anonymisedAt',now(),'privateCaseId',data->>'privateCaseId'),evidence=jsonb_build_object('evidenceLevel',evidence->>'evidenceLevel','score',evidence->'score'),revision=revision+1,updated_at=now()where id=r.id;
 update ac_dce_certificate_history set data='{}' where request_id=r.id;
 update ac_dce_commands set response=jsonb_build_object('requestId',r.id,'anonymised',true,'receipt',request_id)where response->'request'->>'id'=r.id::text;
 update ac_dce_commands set response=jsonb_build_object('caseId',r.data->>'privateCaseId','anonymised',true,'receipt',request_id)where response->'record'->>'id'=r.data->>'privateCaseId';
 update ac_dce_versions set snapshot=jsonb_build_object('recordId',record_id,'revision',revision,'anonymised',true)where record_id=nullif(r.data->>'privateCaseId','')::uuid;
 update ac_dce_work_items set data=jsonb_build_object('certificateRequestId',r.id,'anonymised',true),revision=revision+1,updated_at=now()where record_id=nullif(r.data->>'privateCaseId','')::uuid and kind in('comment','case_operation');

 update ac_dce_assessment_attempts set evidence=jsonb_build_object('retainedForIssuedRecord',true),subject_hash=encode(sha256((id::text||'anonymised')::bytea),'hex')where id=r.attempt_id;
 if r.data->>'privateCaseId'is not null then update ac_dce_records set data=jsonb_build_object('source','explicit_certificate_request','certificateRequestId',r.id,'status','closed','anonymised',true),revision=revision+1,updated_at=now(),updated_by=p_actor where id=(r.data->>'privateCaseId')::uuid and kind='case';end if;
 update ac_dce_certificate_retention set state='anonymised',revision=revision+1 where id=p.id returning *into p;
 else raise exception 'UNKNOWN_RETENTION_ACTION';end if;return to_jsonb(p);end $$;
create or replace function public.ac_dce_author_evidence()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.kind in('experience','content','template','bundle')and(tg_op='INSERT'or new.data is distinct from old.data or new.title is distinct from old.title or new.family is distinct from old.family or new.topic is distinct from old.topic or new.audience is distinct from old.audience)then insert into ac_dce_editorial_authors values(new.id,new.updated_by,new.revision)on conflict do nothing;if tg_op='UPDATE'then update ac_dce_work_items set status='changes_requested',revision=revision+1,updated_at=now(),data=data||jsonb_build_object('reviewInvalidatedAt',now(),'changedRevision',new.revision)where record_id=new.id and kind='task'and status='done'and data->>'reviewedRevision'is not null and data->>'reviewedEditionHash'is null;end if;end if;return new;end $$;
create or replace function public.ac_dce_r5_edition(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_locale text,p_action text,p_definition jsonb,p_definition_hash text,p_manifest jsonb default'{}',p_validation jsonb default'{}',p_schedule timestamptz default null,p_release uuid default null)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_records;e ac_dce_editions;z ac_dce_releases;c ac_dce_commands;reply jsonb;policy jsonb;begin
 if nullif(p_actor,'')is null or p_locale not in('ar','fr','en')or p_definition_hash!~'^[a-f0-9]{64}$'then raise exception'INVALID_EDITION_COMMAND';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;
 if found then if c.input_hash<>p_hash then raise exception'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select *into r from ac_dce_records where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found or r.kind not in('experience','content','template','bundle')then raise exception'NOT_FOUND';end if;if r.revision<>p_revision then raise exception'REVISION_CONFLICT';end if;
 select *into e from ac_dce_editions where record_id=p_id and locale=p_locale for update;
 if p_action in('review','approve','release','schedule')and(coalesce((p_validation->>'valid')::boolean,false)is not true or length(coalesce(p_definition->>'title',''))=0)then raise exception'EDITION_READINESS_REQUIRED';end if;
 if p_action='review'then
 insert into ac_dce_editions(record_id,locale,state,definition_hash,definition,reviewed_by,tenant_id,territory_id)values(p_id,p_locale,'review',p_definition_hash,p_definition,p_actor,p_tenant,p_territory)on conflict(record_id,locale)do update set state='review',definition_hash=excluded.definition_hash,definition=excluded.definition,reviewed_by=p_actor,approved_by=null,revision=ac_dce_editions.revision+1,updated_at=now()returning *into e;
 elsif p_action='approve'then
 if e.state is distinct from'review'or e.definition_hash is distinct from p_definition_hash then raise exception'EDITION_REVIEW_REQUIRED';end if;
 if exists(select 1 from ac_dce_work_items w where w.record_id=p_id and w.kind='task'and (w.status not in('done','cancelled')or(w.status='done'and w.data->>'reviewedEditionHash'is not null and w.data->>'reviewedEditionHash'<>p_definition_hash))and coalesce((w.data->>'blocking')::boolean,false)and(coalesce(w.data->>'locale','')=''or w.data->>'locale'=p_locale))then raise exception'EDITORIAL_TASKS_BLOCKED';end if;
 select data into policy from ac_dce_work_items where kind='editorial_policy'and status='active'and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory order by updated_at desc,id limit 1;
 if coalesce((policy->>'independentReview')::boolean,false)and(e.reviewed_by=p_actor or r.updated_by=p_actor)then raise exception'INDEPENDENT_REVIEW_REQUIRED';end if;
 update ac_dce_editions set state='approved',approved_by=p_actor,revision=revision+1,updated_at=now()where record_id=p_id and locale=p_locale returning *into e;
 elsif p_action in('release','schedule')then
 if e.state is distinct from'approved'or e.definition_hash is distinct from p_definition_hash or e.definition is distinct from p_definition then raise exception'EDITION_APPROVAL_REQUIRED';end if;
 if p_action='schedule'and(p_schedule is null or p_schedule<=now())then raise exception'FUTURE_DATE_REQUIRED';end if;
 if p_manifest->>'editionLocale'is distinct from p_locale or p_manifest->>'editionHash'is distinct from p_definition_hash then raise exception'EDITION_MANIFEST_REQUIRED';end if;
 insert into ac_dce_releases(record_id,revision,snapshot,manifest,validation,state,scheduled_at,published_at,actor_id,tenant_id,territory_id)values(p_id,r.revision,to_jsonb(r),p_manifest,p_validation,case when p_action='schedule'then'scheduled'else'published'end,p_schedule,case when p_action='release'then now()end,p_actor,p_tenant,p_territory)returning *into z;
 if p_action='release'then update ac_dce_editions set active_release_id=z.id,revision=revision+1,updated_at=now()where record_id=p_id and locale=p_locale returning *into e;update ac_dce_records set published_release_id=coalesce(published_release_id,z.id)where id=p_id;end if;
 elsif p_action in('withdraw','restore','cancel','reschedule','due','fail')then
 select *into z from ac_dce_releases where id=p_release and record_id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;
 if not found or z.manifest->>'editionLocale'is distinct from p_locale then raise exception'EDITION_RELEASE_NOT_FOUND';end if;
 if p_action='withdraw'then
 if e.active_release_id is distinct from z.id or z.state<>'published'then raise exception'NOT_CURRENT_RELEASE';end if;update ac_dce_releases set state='withdrawn'where id=z.id returning *into z;update ac_dce_editions set active_release_id=null,revision=revision+1,updated_at=now()where record_id=p_id and locale=p_locale returning *into e;
 elsif p_action='restore'then
 if z.state not in('published','withdrawn')or coalesce((p_validation->>'valid')::boolean,false)is not true then raise exception'RESTORE_BLOCKED';end if;update ac_dce_releases set state='published',published_at=now()where id=z.id returning *into z;update ac_dce_editions set active_release_id=z.id,revision=revision+1,updated_at=now()where record_id=p_id and locale=p_locale returning *into e;
 elsif p_action='reschedule'then
 if z.state<>'scheduled'or p_schedule is null or p_schedule<=now()or p_definition_hash is distinct from z.manifest->>'editionHash'then raise exception'RESCHEDULE_BLOCKED';end if;update ac_dce_releases set scheduled_at=p_schedule where id=z.id returning *into z;
 elsif p_action='cancel'then
 if z.state<>'scheduled'then raise exception'NOT_SCHEDULED';end if;update ac_dce_releases set state='cancelled'where id=z.id returning *into z;
 elsif p_action='fail'then
 if z.state<>'scheduled'then raise exception'NOT_SCHEDULED';end if;update ac_dce_releases set state='failed',error='Edition source or dependencies changed; previous live edition preserved.'where id=z.id returning *into z;
 else
 if z.state<>'scheduled'or z.scheduled_at>now()then raise exception'NOT_DUE';end if;if e.definition_hash is distinct from z.manifest->>'editionHash'or p_definition_hash is distinct from z.manifest->>'editionHash'or coalesce((p_validation->>'valid')::boolean,false)is not true then raise exception'EDITION_CHANGED';end if;
 update ac_dce_releases set state='published',published_at=now()where id=z.id returning *into z;update ac_dce_editions set active_release_id=z.id,revision=revision+1,updated_at=now()where record_id=p_id and locale=p_locale returning *into e;
 end if;
 update ac_dce_records set published_release_id=(select active_release_id from ac_dce_editions where record_id=p_id and active_release_id is not null order by locale limit 1)where id=p_id and(published_release_id=z.id or published_release_id is null);
 else raise exception'UNKNOWN_EDITION_ACTION';end if;
 insert into ac_dce_events(channel,action,record_id,actor_id,request_id,data,tenant_id,territory_id)values('admin','edition_'||p_action,p_id,p_actor,p_request,jsonb_build_object('locale',p_locale,'releaseId',z.id,'definitionHash',p_definition_hash),p_tenant,p_territory);
 reply:=jsonb_build_object('edition',to_jsonb(e),'release',case when z.id is not null then to_jsonb(z)else null end,'receipt',p_request);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_r5_certificate_action(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_id uuid,p_revision int,p_action text,p_data jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r ac_dce_certificate_requests;c ac_dce_commands;reply jsonb;next_state text;case_id uuid;begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 select *into r from ac_dce_certificate_requests where id=p_id and tenant_id is not distinct from p_tenant and territory_id is not distinct from p_territory for update;if not found then raise exception'NOT_FOUND';end if;if r.revision<>p_revision then raise exception'REVISION_CONFLICT';end if;if r.data->>'anonymisedAt'is not null then raise exception'ANONYMISED_READ_ONLY';end if;next_state:=r.status;
 if p_action='prepare_document_case'then
 if nullif(r.data->>'privateCaseId','')is null then insert into ac_dce_records(kind,key,title,audience,data,lifecycle,created_by,updated_by,tenant_id,territory_id)values('case','certificate-document-'||r.id::text,r.reference||' · '||r.course_title,'parent',jsonb_build_object('source','explicit_certificate_request','certificateRequestId',r.id,'experienceId',r.course_id,'releaseId',r.release_id,'body','Private certificate preparation.','notes','[]'::jsonb),'open',p_actor,p_actor,p_tenant,p_territory)returning id into case_id;r.data:=r.data||jsonb_build_object('privateCaseId',case_id);end if;
 elsif p_action='assign'then
 if nullif(p_data->>'assignedTo','')is not null and not exists(select 1 from app_users where id::text=p_data->>'assignedTo'and status='active')then raise exception'STAFF_REQUIRED';end if;r.assigned_to:=nullif(p_data->>'assignedTo','');
 elsif p_action in('note','contact','follow_up')then
 if length(coalesce(p_data->>'body',''))not between 3 and 4000 then raise exception'NOTE_REQUIRED';end if;if p_action='follow_up'then r.due_at:=nullif(p_data->>'dueAt','')::timestamptz;if r.due_at is null then raise exception'FOLLOW_UP_DATE_REQUIRED';end if;end if;
 elsif p_action='review'and r.status in('new','awaiting_information')then next_state:='review';
 elsif p_action='awaiting_information'and r.status in('new','review')then next_state:='awaiting_information';
 elsif p_action='approve'and r.status in('new','review','awaiting_information')then next_state:='approved';
 elsif p_action='reject'and r.status in('new','review','awaiting_information','approved')then next_state:='rejected';
 elsif p_action='cancel'and r.status not in('issued','closed')then next_state:='cancelled';
 elsif p_action='issue'and r.status='approved'then
 if nullif(p_data->>'documentId','')is null or length(coalesce(p_data->>'issuer',''))<2 then raise exception'ISSUED_DOCUMENT_REQUIRED';end if;next_state:='issued';r.issued_at:=now();r.issued_by:=p_actor;r.data:=r.data||jsonb_build_object('issuedDocument',p_data);
 elsif p_action='replace'and r.status in('issued','closed')then
 if nullif(p_data->>'documentId','')is null or length(coalesce(p_data->>'body',''))<12 then raise exception'REPLACEMENT_REASON_REQUIRED';end if;r.data:=r.data||jsonb_build_object('issuedDocument',p_data,'previousDocuments',coalesce(r.data->'previousDocuments','[]')||jsonb_build_array(r.data->'issuedDocument'));
 elsif p_action='close'and r.status in('issued','rejected','cancelled')then next_state:='closed';
 elsif p_action='reopen'and r.status in('closed','rejected','cancelled')then next_state:=case when r.issued_at is not null then'issued'else'review'end;
 else raise exception'INVALID_CERTIFICATE_TRANSITION';end if;
 if p_action in('reject','cancel','reopen','awaiting_information')and length(coalesce(p_data->>'body',''))<3 then raise exception'DECISION_REASON_REQUIRED';end if;
 update ac_dce_certificate_requests set status=next_state,assigned_to=r.assigned_to,due_at=r.due_at,data=r.data,issued_at=r.issued_at,issued_by=r.issued_by,revision=revision+1,updated_at=now()where id=r.id returning *into r;
 insert into ac_dce_certificate_history(request_id,actor_id,action,data)values(r.id,p_actor,p_action,p_data);reply:=jsonb_build_object('request',to_jsonb(r),'receipt',p_request);insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;
end $$;
create or replace function public.ac_dce_r6_expire_attempts(p_tenant text,p_territory text)returns int language plpgsql security definer set search_path=public,pg_temp as $$declare n int;begin with eligible as(select a.id from ac_dce_assessment_attempts a where a.tenant_id is not distinct from p_tenant and a.territory_id is not distinct from p_territory and a.expires_at<now()and not exists(select 1 from ac_dce_certificate_requests r where r.attempt_id=a.id)order by a.expires_at limit 100 for update skip locked),removed as(delete from ac_dce_assessment_attempts where id in(select id from eligible)returning id)select count(*)into n from removed;return n;end $$;
create or replace function public.ac_dce_r6_certificate_sync()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.data->>'privateCaseId'is not null and(new.assigned_to is distinct from old.assigned_to or new.status is distinct from old.status)then
 update ac_dce_records set data=data||jsonb_build_object('assignedTo',new.assigned_to,'certificateStatus',new.status),lifecycle=case when new.status='closed'then 'closed'when lifecycle='closed'then 'open'else lifecycle end,revision=revision+1,updated_at=now()where id=(new.data->>'privateCaseId')::uuid and kind='case'and data->>'certificateRequestId'=new.id::text and tenant_id is not distinct from new.tenant_id and territory_id is not distinct from new.territory_id;
 end if;return new;end $$;
drop trigger if exists ac_dce_r6_certificate_sync_trigger on ac_dce_certificate_requests;
create trigger ac_dce_r6_certificate_sync_trigger after update on ac_dce_certificate_requests for each row execute function ac_dce_r6_certificate_sync();
create or replace function public.ac_dce_r6_privacy_command(p_actor text,p_tenant text,p_territory text,p_request uuid,p_hash text,p_action text,p_id uuid default null,p_revision int default 0,p_data jsonb default '{}')returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare c ac_dce_commands;reply jsonb;begin
 perform pg_advisory_xact_lock(hashtextextended(p_actor||p_request::text,0));select *into c from ac_dce_commands where actor_id=p_actor and request_id=p_request;if found then if c.input_hash<>p_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return c.response;end if;
 if p_action='retention'then reply:=ac_dce_r6_retention(p_actor,p_tenant,p_territory,p_id,p_revision,p_data->>'operation',p_data);elsif p_action='expire_attempts'then reply:=jsonb_build_object('removed',ac_dce_r6_expire_attempts(p_tenant,p_territory));else raise exception 'UNKNOWN_PRIVACY_ACTION';end if;
 insert into ac_dce_commands values(p_request,p_actor,p_hash,reply,now());return reply;end $$;
do $$declare n text;f record;begin
 foreach n in array array['ac_dce_operator_batches','ac_dce_certificate_retention']loop execute format('alter table public.%I enable row level security',n);execute format('revoke all on public.%I from public,anon,authenticated',n);execute format('grant all on public.%I to service_role',n);end loop;
 for f in select oid::regprocedure sig from pg_proc where pronamespace='public'::regnamespace and proname like 'ac_dce_r6_%'loop execute format('comment on function %s is %L',f.sig,'ANGELCARE_DCE_OPERATOR_R6');execute format('revoke all on function %s from public,anon,authenticated',f.sig);execute format('grant execute on function %s to service_role',f.sig);end loop;end $$;
notify pgrst,'reload schema';commit;
