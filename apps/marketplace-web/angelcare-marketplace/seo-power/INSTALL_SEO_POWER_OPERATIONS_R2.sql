-- SEO POWER Operations R2. Run AFTER the existing R1 migration, before deploying R2.
-- No scheduler is enabled, token rotated, or page publication changed by this migration.
begin;
do $$ begin
 if to_regclass('public.ac_seo_power_jobs') is null then raise exception 'SEO_POWER_R1_REQUIRED'; end if;
end $$;
do $$ declare installed text;begin
 select prosrc into installed from pg_proc where oid=to_regprocedure('public.ac_seo_power_finish(uuid,uuid,jsonb,text)');
 if installed is null or regexp_replace(installed,'[[:space:]]','','g') not in (regexp_replace($baseline$
declare j public.ac_seo_power_jobs; pg public.ac_seo_power_pages; f jsonb; codes text[]='{}'; new_state text;
begin
 select * into strict j from public.ac_seo_power_jobs where id=p_id;
 select * into strict pg from public.ac_seo_power_pages where id=j.page_id for update;
 select * into strict j from public.ac_seo_power_jobs where id=p_id for update;
 if j.state<>'running' or j.lease_token is distinct from p_token or j.lease_until<now() then raise exception 'STALE_JOB_LEASE'; end if;
 if p_error is not null then
  new_state=case when j.attempts<3 then 'queued' else 'failed' end;
  update public.ac_seo_power_jobs set state=new_state,error=left(p_error,1000),result=p_result,due_at=now()+make_interval(mins=>power(2,j.attempts)::integer),lease_token=null,lease_until=null,finished_at=case when new_state='failed' then now() else null end where id=j.id;
  return jsonb_build_object('state',new_state);
 end if;
 if j.kind='crawl' then
  if jsonb_typeof(p_result->'facts')<>'object' then raise exception 'OBSERVATION_REQUIRED'; end if;
  f=p_result->'facts';
  update public.ac_seo_power_pages set title=coalesce(f->>'title',''),description=coalesce(f->>'description',''),http_status=(f->>'status')::int,indexable=(f->>'status')::int=200 and coalesce(f->>'robots','')!~* 'noindex',content_hash=f->>'contentHash',facts=f,last_scanned_at=now(),version=version+1 where id=pg.id;
  insert into public.ac_seo_power_observations(project_id,page_id,job_id,facts) values(j.project_id,pg.id,j.id,f);
  for f in select value from jsonb_array_elements(coalesce(p_result->'findings','[]')) loop
   codes=array_append(codes,f->>'code');
   insert into public.ac_seo_power_issues(project_id,page_id,code,severity,message,evidence,action) values(j.project_id,pg.id,f->>'code',f->>'severity',f->>'message',coalesce(f->>'evidence',''),f->>'action')
   on conflict(page_id,code) do update set severity=excluded.severity,message=excluded.message,evidence=excluded.evidence,last_seen=now(),state=case when ac_seo_power_issues.state='ignored' then 'ignored' else 'open' end;
  end loop;
  update public.ac_seo_power_issues set state='resolved',last_seen=now() where page_id=pg.id and state='open' and not(code=any(codes));
 elsif j.kind='verify' then
  if pg.published_change_id is distinct from (j.payload->>'changeId')::uuid then raise exception 'VERIFICATION_SUPERSEDED'; end if;
  update public.ac_seo_power_changes set verification=p_result,verified_at=case when p_result->>'verified'='true' then now() else null end where id=pg.published_change_id;
  if jsonb_typeof(p_result->'facts')='object' then
   f=p_result->'facts';
   update public.ac_seo_power_pages set http_status=(f->>'status')::int,indexable=(f->>'status')::int=200 and coalesce(f->>'robots','')!~* 'noindex',title=coalesce(f->>'title',''),description=coalesce(f->>'description',''),facts=f,content_hash=f->>'contentHash',last_scanned_at=now(),version=version+1 where id=pg.id;
   insert into public.ac_seo_power_observations(project_id,page_id,job_id,facts) values(j.project_id,pg.id,j.id,f);
  end if;
 end if;
 update public.ac_seo_power_jobs set state='succeeded',result=p_result,finished_at=now(),lease_token=null,lease_until=null where id=j.id;
 return jsonb_build_object('state','succeeded');
end $baseline$,'[[:space:]]','','g'),regexp_replace($operations$
declare j public.ac_seo_power_jobs; pg public.ac_seo_power_pages; f jsonb; codes text[]='{}'; new_state text;
begin
 select * into strict j from public.ac_seo_power_jobs where id=p_id;
 select * into strict pg from public.ac_seo_power_pages where id=j.page_id for update;
 select * into strict j from public.ac_seo_power_jobs where id=p_id for update;
 if j.state<>'running' or j.lease_token is distinct from p_token or j.lease_until<now() then raise exception 'STALE_JOB_LEASE'; end if;
 if p_error is not null then
  new_state=case when coalesce(p_result->>'recovery','retry')='retry' and j.attempts<3 then 'queued' else 'failed' end;
  update public.ac_seo_power_jobs set state=new_state,error=left(p_error,1000),result=p_result,due_at=now()+make_interval(mins=>power(2,j.attempts)::integer),lease_token=null,lease_until=null,finished_at=case when new_state='failed' then now() else null end where id=j.id;
  return jsonb_build_object('state',new_state);
 end if;
 if j.kind='crawl' then
  if jsonb_typeof(p_result->'facts')<>'object' then raise exception 'OBSERVATION_REQUIRED'; end if;
  f=p_result->'facts';
  update public.ac_seo_power_pages set title=coalesce(f->>'title',''),description=coalesce(f->>'description',''),http_status=(f->>'status')::int,indexable=(f->>'status')::int=200 and coalesce(f->>'robots','')!~* 'noindex',content_hash=f->>'contentHash',facts=f,last_scanned_at=now(),version=version+1 where id=pg.id;
  insert into public.ac_seo_power_observations(project_id,page_id,job_id,facts) values(j.project_id,pg.id,j.id,f);
  for f in select value from jsonb_array_elements(coalesce(p_result->'findings','[]')) loop
   codes=array_append(codes,f->>'code');
   insert into public.ac_seo_power_issues(project_id,page_id,code,severity,message,evidence,action) values(j.project_id,pg.id,f->>'code',f->>'severity',f->>'message',coalesce(f->>'evidence',''),f->>'action')
   on conflict(page_id,code) do update set severity=excluded.severity,message=excluded.message,evidence=excluded.evidence,last_seen=now(),state=case when ac_seo_power_issues.state='ignored' then 'ignored' else 'open' end;
  end loop;
  update public.ac_seo_power_issues set state='resolved',last_seen=now() where page_id=pg.id and state='open' and not(code=any(codes));
 elsif j.kind='verify' then
  if pg.published_change_id is distinct from (j.payload->>'changeId')::uuid then raise exception 'VERIFICATION_SUPERSEDED'; end if;
  update public.ac_seo_power_changes set verification=p_result,verified_at=case when p_result->>'verified'='true' then now() else null end where id=pg.published_change_id;
  if jsonb_typeof(p_result->'facts')='object' then
   f=p_result->'facts';
   update public.ac_seo_power_pages set http_status=(f->>'status')::int,indexable=(f->>'status')::int=200 and coalesce(f->>'robots','')!~* 'noindex',title=coalesce(f->>'title',''),description=coalesce(f->>'description',''),facts=f,content_hash=f->>'contentHash',last_scanned_at=now(),version=version+1 where id=pg.id;
   insert into public.ac_seo_power_observations(project_id,page_id,job_id,facts) values(j.project_id,pg.id,j.id,f);
  end if;
 end if;
 update public.ac_seo_power_jobs set state='succeeded',result=p_result,finished_at=now(),lease_token=null,lease_until=null where id=j.id;
 update public.ac_seo_power_jobs set recovered_at=now() where page_id=j.page_id and kind=j.kind and id<>j.id and recovered_at is null and (j.kind<>'verify' or p_result->>'verified'='true') and (state='failed' or result ? 'followup' or (kind='verify' and result->>'verified'='false'));
 return jsonb_build_object('state','succeeded');
end $operations$,'[[:space:]]','','g')) then raise exception 'SEO_POWER_FINISH_VERSION_REVIEW_REQUIRED';end if;
end $$;
alter table public.ac_seo_power_jobs add column if not exists recovered_at timestamptz;
create table if not exists public.ac_seo_power_executions (
 id uuid primary key default gen_random_uuid(), project_id uuid references public.ac_seo_power_projects(id),
 source text not null check(source in ('manual','scheduler')),
 state text not null default 'running' check(state in ('running','completed','degraded','failed')),
 started_at timestamptz not null default now(), finished_at timestamptz, result jsonb not null default '{}'
);
create index if not exists ac_seo_power_execution_recent on public.ac_seo_power_executions(started_at desc);
create or replace function public.ac_seo_power_execution(p_id uuid default null,p_project uuid default null,p_source text default 'manual',p_result jsonb default null) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v uuid;
begin
 if p_id is null then
  insert into public.ac_seo_power_executions(project_id,source) values(p_project,p_source) returning id into v; return v;
 end if;
 update public.ac_seo_power_executions set finished_at=now(),state=case when p_result->>'fatal' is not null then 'failed' when coalesce((p_result->>'problems')::int,0)>0 then 'degraded' else 'completed' end,result=coalesce(p_result,'{}') where id=p_id and state='running';
 if not found then raise exception 'EXECUTION_NOT_ACTIVE';end if;
 return p_id;
end $$;
create or replace function public.ac_seo_power_followup(p_id uuid,p_warning jsonb) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 update public.ac_seo_power_jobs set result=coalesce(result,'{}')||jsonb_build_object('followup',p_warning) where id=p_id and state='succeeded';
 if not found then raise exception 'FOLLOWUP_NOT_APPLICABLE';end if;
end $$;
create or replace function public.ac_seo_power_finish(p_id uuid,p_token uuid,p_result jsonb,p_error text default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare j public.ac_seo_power_jobs; pg public.ac_seo_power_pages; f jsonb; codes text[]='{}'; new_state text;
begin
 select * into strict j from public.ac_seo_power_jobs where id=p_id;
 select * into strict pg from public.ac_seo_power_pages where id=j.page_id for update;
 select * into strict j from public.ac_seo_power_jobs where id=p_id for update;
 if j.state<>'running' or j.lease_token is distinct from p_token or j.lease_until<now() then raise exception 'STALE_JOB_LEASE'; end if;
 if p_error is not null then
  new_state=case when coalesce(p_result->>'recovery','retry')='retry' and j.attempts<3 then 'queued' else 'failed' end;
  update public.ac_seo_power_jobs set state=new_state,error=left(p_error,1000),result=p_result,due_at=now()+make_interval(mins=>power(2,j.attempts)::integer),lease_token=null,lease_until=null,finished_at=case when new_state='failed' then now() else null end where id=j.id;
  return jsonb_build_object('state',new_state);
 end if;
 if j.kind='crawl' then
  if jsonb_typeof(p_result->'facts')<>'object' then raise exception 'OBSERVATION_REQUIRED'; end if;
  f=p_result->'facts';
  update public.ac_seo_power_pages set title=coalesce(f->>'title',''),description=coalesce(f->>'description',''),http_status=(f->>'status')::int,indexable=(f->>'status')::int=200 and coalesce(f->>'robots','')!~* 'noindex',content_hash=f->>'contentHash',facts=f,last_scanned_at=now(),version=version+1 where id=pg.id;
  insert into public.ac_seo_power_observations(project_id,page_id,job_id,facts) values(j.project_id,pg.id,j.id,f);
  for f in select value from jsonb_array_elements(coalesce(p_result->'findings','[]')) loop
   codes=array_append(codes,f->>'code');
   insert into public.ac_seo_power_issues(project_id,page_id,code,severity,message,evidence,action) values(j.project_id,pg.id,f->>'code',f->>'severity',f->>'message',coalesce(f->>'evidence',''),f->>'action')
   on conflict(page_id,code) do update set severity=excluded.severity,message=excluded.message,evidence=excluded.evidence,last_seen=now(),state=case when ac_seo_power_issues.state='ignored' then 'ignored' else 'open' end;
  end loop;
  update public.ac_seo_power_issues set state='resolved',last_seen=now() where page_id=pg.id and state='open' and not(code=any(codes));
 elsif j.kind='verify' then
  if pg.published_change_id is distinct from (j.payload->>'changeId')::uuid then raise exception 'VERIFICATION_SUPERSEDED'; end if;
  update public.ac_seo_power_changes set verification=p_result,verified_at=case when p_result->>'verified'='true' then now() else null end where id=pg.published_change_id;
  if jsonb_typeof(p_result->'facts')='object' then
   f=p_result->'facts';
   update public.ac_seo_power_pages set http_status=(f->>'status')::int,indexable=(f->>'status')::int=200 and coalesce(f->>'robots','')!~* 'noindex',title=coalesce(f->>'title',''),description=coalesce(f->>'description',''),facts=f,content_hash=f->>'contentHash',last_scanned_at=now(),version=version+1 where id=pg.id;
   insert into public.ac_seo_power_observations(project_id,page_id,job_id,facts) values(j.project_id,pg.id,j.id,f);
  end if;
 end if;
 update public.ac_seo_power_jobs set state='succeeded',result=p_result,finished_at=now(),lease_token=null,lease_until=null where id=j.id;
 update public.ac_seo_power_jobs set recovered_at=now() where page_id=j.page_id and kind=j.kind and id<>j.id and recovered_at is null and (j.kind<>'verify' or p_result->>'verified'='true') and (state='failed' or result ? 'followup' or (kind='verify' and result->>'verified'='false'));
 return jsonb_build_object('state','succeeded');
end $$;


-- Full scoped inventory and queue aggregates; not inferred from a truncated UI list.
create or replace function public.ac_seo_power_operations(p_project uuid default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare worlds jsonb; runtime jsonb; response jsonb;
begin
 select coalesce(jsonb_agg(x),'[]') into worlds from (
 select pr.id,pr.world,pr.enabled,pr.policy,pr.last_scheduled_at,
  (select count(*) from public.ac_seo_power_pages where project_id=pr.id) as pages,
  (select count(*) from public.ac_seo_power_pages where project_id=pr.id and last_scanned_at is null) as unscanned,
  (select count(*) from public.ac_seo_power_pages where project_id=pr.id and last_scanned_at<now()-make_interval(hours=>coalesce((pr.policy->>'intervalHours')::int,24))) as stale,
  (select max(last_scanned_at) from public.ac_seo_power_pages where project_id=pr.id) as last_observation,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='queued') as waiting,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='queued' and due_at<=now()) as due,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='running' and lease_until>now()) as running,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='running' and lease_until<=now()) as expired,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='failed' and recovered_at is null) as failed,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and result ? 'followup' and recovered_at is null) as followup,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='succeeded' and kind='verify' and result->>'verified'='false' and recovered_at is null) as mismatches,
  (select min(created_at) from public.ac_seo_power_jobs where project_id=pr.id and state='queued') as oldest_waiting,
  (select min(due_at) from public.ac_seo_power_jobs where project_id=pr.id and state='queued') as next_due,
  (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and started_at>=date_trunc('day',now())) as used,
  (select count(*) from public.ac_seo_power_issues where project_id=pr.id and state='open') as issues,
  (select count(*) from public.ac_seo_power_changes where project_id=pr.id and state='published' and verified_at is not null) as verified,
  (select count(*) from public.ac_seo_power_changes where project_id=pr.id and state='published' and verified_at is null) as awaiting_verification,
  (select to_jsonb(e) from public.ac_seo_power_executions e where e.project_id=pr.id or (e.project_id is null and exists(select 1 from jsonb_array_elements(coalesce(e.result->'results','[]')) z where z->>'projectId'=pr.id::text)) order by e.started_at desc limit 1) as execution
 from public.ac_seo_power_projects pr where p_project is null or pr.id=p_project order by pr.world
 ) x;
 runtime=public.ac_seo_power_runtime_status();
 if to_regclass('net._http_response') is not null and runtime->>'lastRequestId' is not null then
  execute 'select jsonb_build_object(''status'',status_code,''timedOut'',timed_out,''createdAt'',created) from net._http_response where id=$1' into response using (runtime->>'lastRequestId')::bigint;
 end if;
 return jsonb_build_object('version',2,'observedAt',now(),'projects',worlds,'dispatchResponse',response,
  'executions',coalesce((select jsonb_agg(e) from(select * from public.ac_seo_power_executions where p_project is null or project_id=p_project or project_id is null order by started_at desc limit 30)e),'[]'),
  'globalRunning',(select count(*) from public.ac_seo_power_jobs where state='running' and lease_until>now()));
end $$;
create or replace function public.ac_seo_power_queue_page(p_project uuid default null,p_state text default 'all',p_page integer default 1) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare items jsonb; total bigint;
begin
 if p_state not in ('all','queued','running','failed','succeeded','cancelled','attention') or p_page not between 1 and 100000 then raise exception 'INVALID_QUEUE_QUERY';end if;
 select count(*) into total from public.ac_seo_power_jobs j where (p_project is null or project_id=p_project) and (p_state='all' or state=p_state or (p_state='attention' and recovered_at is null and (state='failed' or result ? 'followup' or (kind='verify' and result->>'verified'='false'))));
 select coalesce(jsonb_agg(t),'[]') into items from (
 select j.*,p.path from public.ac_seo_power_jobs j join public.ac_seo_power_pages p on p.id=j.page_id
 where (p_project is null or j.project_id=p_project) and (p_state='all' or j.state=p_state or (p_state='attention' and j.recovered_at is null and (j.state='failed' or j.result ? 'followup' or (j.kind='verify' and j.result->>'verified'='false'))))
 order by j.created_at desc,j.id desc offset (p_page-1)*40 limit 40)t;
 return jsonb_build_object('items',items,'total',total,'page',p_page,'pageSize',40);
end $$;
-- Explicit, idempotent operator retry. Active duplicate jobs remain protected.
create or replace function public.ac_seo_power_retry(p_id uuid,p_actor uuid,p_request text,p_hash text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare j public.ac_seo_power_jobs; receipt public.ac_seo_power_receipts; v uuid; answer jsonb;
begin
 if p_actor is null or length(p_request) not between 8 and 120 or length(p_hash)<>64 then raise exception 'INVALID_COMMAND';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':'||p_request,0));
 select * into receipt from public.ac_seo_power_receipts where actor_id=p_actor and request_key=p_request;
 if found then if receipt.input_hash<>p_hash then raise exception 'REQUEST_REUSED';end if;return receipt.result;end if;
 select * into strict j from public.ac_seo_power_jobs where id=p_id for update;
 if j.state not in ('failed','cancelled','succeeded') then raise exception 'JOB_NOT_RETRYABLE';end if;
 if j.state='succeeded' and not(coalesce(j.result,'{}') ? 'followup') and not(coalesce(j.kind='verify' and j.result->>'verified'='false',false)) then raise exception 'JOB_NOT_RETRYABLE';end if;
 if not(select enabled from public.ac_seo_power_projects where id=j.project_id) then raise exception 'PROJECT_PAUSED';end if;
 if j.kind='verify' and (select published_change_id from public.ac_seo_power_pages where id=j.page_id) is distinct from (j.payload->>'changeId')::uuid then raise exception 'VERIFICATION_SUPERSEDED';end if;
 v=public.ac_seo_power_enqueue(j.page_id,j.kind,j.payload);
 answer=jsonb_build_object('jobId',v,'previousJobId',j.id);
 insert into public.ac_seo_power_receipts(actor_id,request_key,input_hash,action,result) values(p_actor,p_request,p_hash,'retry',answer);
 return answer;
end $$;
create or replace function public.ac_seo_power_summary(p_project uuid default null) returns jsonb
language sql security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object(
  'pages',(select count(*) from public.ac_seo_power_pages where p_project is null or project_id=p_project),
  'indexable',(select count(*) from public.ac_seo_power_pages where (p_project is null or project_id=p_project) and indexable and http_status=200),
  'issues',(select count(*) from public.ac_seo_power_issues where (p_project is null or project_id=p_project) and state='open'),
  'queued',(select count(*) from public.ac_seo_power_jobs where (p_project is null or project_id=p_project) and state='queued'),
  'running',(select count(*) from public.ac_seo_power_jobs where (p_project is null or project_id=p_project) and state='running'),
  'published',(select count(*) from public.ac_seo_power_changes where (p_project is null or project_id=p_project) and state='published'),
  'verified',(select count(*) from public.ac_seo_power_changes where (p_project is null or project_id=p_project) and state='published' and verified_at is not null)
 );
$$;

do $$ declare f record;begin
 alter table public.ac_seo_power_executions enable row level security;
 revoke all on public.ac_seo_power_executions from public,anon,authenticated;
 grant all on public.ac_seo_power_executions to service_role;
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ac_seo_power_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
commit;
select public.ac_seo_power_operations();
