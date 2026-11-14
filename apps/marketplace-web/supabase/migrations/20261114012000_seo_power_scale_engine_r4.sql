-- SEO POWER SCALE ENGINE R4 / 2026-11-14
-- Additive, inert-by-default. Does not alter public pages, SEO changes, receipts or historical jobs.
-- Deploy code first or in the same release; activation REQUIRES a separate, explicit database opt-in.
begin;
do $$ begin
 if to_regclass('public.ac_seo_power_jobs') is null or to_regclass('public.ac_seo_power_projects') is null then
  raise exception 'SEO_POWER_R1_REQUIRED';
 end if;
 if to_regclass('public.ac_seo_power_executions') is null then raise exception 'SEO_POWER_R2_REQUIRED'; end if;
end $$;

create table if not exists public.ac_seo_power_r4_control (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 capacity jsonb not null default '{
  "globalConcurrency":16,"perProjectConcurrency":8,"perOriginConcurrency":8,
  "workersPerTick":4,"jobsPerWorker":1,"requestTimeoutSeconds":30,
  "leaseSeconds":240,"maxAttempts":6,"linkBatchSize":4,
  "linksPerPage":300,"maxPagesPerProject":250000,"discoveryBatchSize":120,
  "dailyJobsPerProject":20000,"queueLimitPerProject":100000,"scheduleBatchSize":250
 }'::jsonb,
 updated_at timestamptz not null default now()
);
insert into public.ac_seo_power_r4_control(singleton,enabled) values(true,false) on conflict(singleton) do nothing;

create table if not exists public.ac_seo_power_r4_attempts (
 job_id uuid not null references public.ac_seo_power_jobs(id) on delete restrict,
 lease_token uuid not null,
 attempt integer not null,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 state text not null default 'running',
 error text,
 result jsonb,
 primary key(job_id,lease_token)
);
create index if not exists ac_seo_power_r4_due_idx on public.ac_seo_power_jobs(project_id,due_at,id)
 where state='queued';
create index if not exists ac_seo_power_r4_budget_idx on public.ac_seo_power_jobs(project_id,started_at,page_id) where kind='crawl';
create index if not exists ac_seo_power_r4_claim_idx on public.ac_seo_power_jobs(project_id,kind,due_at)
 where state in ('queued','running');
create index if not exists ac_seo_power_r4_attempt_open_idx on public.ac_seo_power_r4_attempts(started_at)
 where finished_at is null;

create table if not exists public.ac_seo_power_r4_project_state(
 project_id uuid primary key references public.ac_seo_power_projects(id) on delete cascade,
 last_claim_at timestamptz
);
insert into public.ac_seo_power_r4_project_state(project_id)
 select id from public.ac_seo_power_projects on conflict(project_id) do nothing;

create or replace function public.ac_seo_power_r4_status() returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('enabled',enabled,'capacity',capacity,'updatedAt',updated_at)
 from public.ac_seo_power_r4_control where singleton
$$;

-- The new admission authority rejects impossible dependent work before it becomes failed.
-- If link facts are absent, it safely queues the crawl prerequisite instead.
create or replace function public.ac_seo_power_r4_enqueue(p_page uuid,p_kind text,p_payload jsonb default '{}') returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare pg public.ac_seo_power_pages;pr public.ac_seo_power_projects;c jsonb; v uuid; cap integer;
begin
 if p_kind not in ('crawl','links','verify','indexnow') then raise exception 'INVALID_JOB_KIND';end if;
 select * into strict pg from public.ac_seo_power_pages where id=p_page for update;
 select * into strict pr from public.ac_seo_power_projects where id=pg.project_id;
 if not pr.enabled then return null;end if;
 select capacity into c from public.ac_seo_power_r4_control where singleton;
 cap=least(500000,greatest(1000,coalesce((c->>'queueLimitPerProject')::int,100000)));
 if p_kind='links' and (pg.facts is null or jsonb_typeof(pg.facts->'links')<>'array') then
  perform public.ac_seo_power_r4_enqueue(pg.id,'crawl',jsonb_build_object('prerequisiteFor','links'));
  return null;
 end if;
 if p_kind='indexnow' and (coalesce((pr.policy->>'indexNowEnabled')::boolean,false)=false or pg.http_status is distinct from 200 or pg.indexable is distinct from true) then
  return null;
 end if;
 if p_kind='verify' then
  update public.ac_seo_power_jobs set state='cancelled',lease_token=null,lease_until=null,finished_at=now(),
   error='Superseded publication verification'
  where page_id=p_page and kind='verify' and state in ('queued','running')
  and payload->>'changeId' is distinct from p_payload->>'changeId';
 end if;
 select id into v from public.ac_seo_power_jobs where page_id=p_page and kind=p_kind
  and state in ('queued','running') order by created_at desc limit 1;
 if v is not null then return v;end if;
 if (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state in ('queued','running'))>=cap then
  raise exception 'R4_QUEUE_CAPACITY_REACHED';end if;
 insert into public.ac_seo_power_jobs(project_id,page_id,kind,payload) values(pr.id,p_page,p_kind,coalesce(p_payload,'{}'))
 on conflict(page_id,kind) where state in ('queued','running') do nothing returning id into v;
 if v is null then select id into v from public.ac_seo_power_jobs where page_id=p_page and kind=p_kind and state in ('queued','running');end if;
 return v;
end $$;

-- The scheduler scans only stale public inventory, skips active jobs and continues at each tick.
create or replace function public.ac_seo_power_r4_schedule_due() returns integer
language plpgsql security definer set search_path=pg_catalog,public as $$
declare pr public.ac_seo_power_projects;pg public.ac_seo_power_pages;c jsonb;lim integer;total integer=0;queued integer;max_due integer;
begin
 select capacity into c from public.ac_seo_power_r4_control where singleton and enabled=true;
 if not found then return 0;end if;
 lim=least(1000,greatest(1,coalesce((c->>'scheduleBatchSize')::int,250)));
 for pr in select * from public.ac_seo_power_projects where enabled and policy->>'scheduleEnabled'='true' loop
  select count(*) into queued from public.ac_seo_power_jobs where project_id=pr.id and state in ('queued','running');
  max_due=greatest(lim,least(least(500000,greatest(1000,coalesce((c->>'queueLimitPerProject')::int,100000))),lim*4));
  if queued>=max_due then continue;end if;
  for pg in
    select p.* from public.ac_seo_power_pages p
    where p.project_id=pr.id
    and (p.last_scanned_at is null or p.last_scanned_at<now()-make_interval(hours=>greatest(1,least(168,coalesce((pr.policy->>'intervalHours')::int,24)))))
    and not exists(select 1 from public.ac_seo_power_jobs j where j.page_id=p.id and j.kind='crawl' and j.state in ('queued','running'))
    order by p.last_scanned_at nulls first,p.id limit least(lim,max_due-queued)
  loop
   perform public.ac_seo_power_r4_enqueue(pg.id,'crawl','{}');
   total=total+1;
  end loop;
 end loop;
 return total;
end $$;

-- Claim is serialized globally (advisory lock), then bounded by global, project and hostname resources.
-- Existing R1 claim is preserved, and remains the only active path until BOTH flags are enabled.
create or replace function public.ac_seo_power_r4_claim(p_project uuid default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c jsonb;pr public.ac_seo_power_projects;j public.ac_seo_power_jobs;
 token uuid; gc int;pc int;oc int;lb int;attempt_cap int;budget int; used_pages bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended('seo-power-r4-claim',0));
 select capacity into c from public.ac_seo_power_r4_control where singleton and enabled=true;
 if not found then return null;end if;
 gc=least(64,greatest(1,coalesce((c->>'globalConcurrency')::int,16)));
 pc=least(32,greatest(1,coalesce((c->>'perProjectConcurrency')::int,8)));
 oc=least(32,greatest(1,coalesce((c->>'perOriginConcurrency')::int,8)));
 lb=least(600,greatest(90,coalesce((c->>'leaseSeconds')::int,240)));
 attempt_cap=least(12,greatest(1,coalesce((c->>'maxAttempts')::int,6)));
 budget=least(100000,greatest(120,coalesce((c->>'dailyJobsPerProject')::int,20000)));

 update public.ac_seo_power_r4_attempts a set finished_at=now(),state='lease_expired',error='R4_LEASE_EXPIRED'
 from public.ac_seo_power_jobs old where old.id=a.job_id and old.state='running'
 and old.lease_until<now() and a.lease_token=old.lease_token and a.finished_at is null;
 update public.ac_seo_power_jobs j set
  state=case when attempts>=attempt_cap then 'failed' else 'queued' end,
  lease_token=null,lease_until=null,
  error='R4_LEASE_EXPIRED',
  result=jsonb_build_object('code','R4_LEASE_EXPIRED','recovery','retry'),
  due_at=now()+make_interval(secs=>least(3600,(2^least(attempts,10))::int*30)),
  finished_at=case when attempts>=attempt_cap then now() else null end
 where j.state='running' and j.lease_until<now();
 if (select count(*) from public.ac_seo_power_jobs where state='running' and lease_until>=now())>=gc then return null;end if;

 insert into public.ac_seo_power_r4_project_state(project_id)
 select id from public.ac_seo_power_projects on conflict(project_id) do nothing;
 for pr in select p.* from public.ac_seo_power_projects p
  join public.ac_seo_power_r4_project_state ps on ps.project_id=p.id
  where p.enabled and (p_project is null or p.id=p_project)
  order by ps.last_claim_at nulls first,p.id for update of p skip locked
 loop
  if (select count(*) from public.ac_seo_power_jobs where project_id=pr.id and state='running' and lease_until>=now())>=pc then continue;end if;
  if (select count(*) from public.ac_seo_power_jobs x join public.ac_seo_power_projects pp on pp.id=x.project_id
      where pp.origin=pr.origin and x.state='running' and x.lease_until>=now())>=oc then continue;end if;
  -- Budget counts unique crawl pages rather than every auxiliary task or repeated network attempt.
  select count(distinct page_id) into used_pages from public.ac_seo_power_jobs where
    project_id=pr.id and kind='crawl' and started_at>=date_trunc('day',now());
  select * into j from public.ac_seo_power_jobs where project_id=pr.id and state='queued' and due_at<=now()
    and (kind<>'crawl' or used_pages<budget)
    order by case kind when 'verify' then 0 when 'crawl' then 1 when 'links' then 2 else 3 end,
    due_at,created_at for update skip locked limit 1;
  if not found then continue;end if;
  if j.kind='links' and not exists(select 1 from public.ac_seo_power_pages p where p.id=j.page_id and jsonb_typeof(p.facts->'links')='array') then
    update public.ac_seo_power_jobs set state='cancelled',error='R4_DEPENDENCY_CRAWL_REQUIRED',finished_at=now() where id=j.id;
    -- Do not acquire page locks while holding a claimed job lock; the next scheduler tick queues the prerequisite.
    continue;
  end if;
  if j.kind='indexnow' and not exists(select 1 from public.ac_seo_power_pages p
      where p.id=j.page_id and p.http_status=200 and p.indexable=true
      and coalesce((pr.policy->>'indexNowEnabled')::boolean,false)) then
    update public.ac_seo_power_jobs set state='cancelled',error='R4_INDEXNOW_INELIGIBLE',finished_at=now() where id=j.id;
    continue;
  end if;
  token=gen_random_uuid();
  update public.ac_seo_power_jobs set state='running',attempts=attempts+1,lease_token=token,
    lease_until=now()+make_interval(secs=>lb),started_at=now(),finished_at=null,error=null
   where id=j.id returning * into j;
  insert into public.ac_seo_power_r4_attempts(job_id,lease_token,attempt) values(j.id,token,j.attempts);
  update public.ac_seo_power_r4_project_state set last_claim_at=now() where project_id=pr.id;
  return to_jsonb(j)||jsonb_build_object('project',to_jsonb(pr),'page',(select to_jsonb(p) from public.ac_seo_power_pages p where p.id=j.page_id));
 end loop;
 return null;
end $$;

create or replace function public.ac_seo_power_r4_heartbeat(p_id uuid,p_token uuid) returns boolean
language plpgsql security definer set search_path=pg_catalog,public as $$
declare seconds int;changed int;
begin
 select least(600,greatest(90,coalesce((capacity->>'leaseSeconds')::int,240))) into seconds
 from public.ac_seo_power_r4_control where singleton and enabled=true;
 if seconds is null then return false;end if;
 update public.ac_seo_power_jobs set lease_until=now()+make_interval(secs=>seconds)
 where id=p_id and state='running' and lease_token=p_token and lease_until>now();
 get diagnostics changed=row_count;
 return changed=1;
end $$;

-- R2 finish semantics are retained (observations, findings, verified publication, historical recovery),
-- while R4 uses its own maxAttempts policy and immutable per-attempt evidence.
create or replace function public.ac_seo_power_r4_finish(p_id uuid,p_token uuid,p_result jsonb,p_error text default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare j public.ac_seo_power_jobs; pg public.ac_seo_power_pages; f jsonb; codes text[]='{}'; new_state text;
begin
 select * into strict j from public.ac_seo_power_jobs where id=p_id;
 select * into strict pg from public.ac_seo_power_pages where id=j.page_id for update;
 select * into strict j from public.ac_seo_power_jobs where id=p_id for update;
 if j.state<>'running' or j.lease_token is distinct from p_token or j.lease_until<now() then raise exception 'STALE_JOB_LEASE'; end if;
 if p_error is not null then
  new_state=case when coalesce(p_result->>'recovery','retry')='retry' and j.attempts<(select least(12,greatest(1,coalesce((capacity->>'maxAttempts')::int,6))) from public.ac_seo_power_r4_control where singleton) then 'queued' else 'failed' end;
  update public.ac_seo_power_jobs set state=new_state,error=left(p_error,1000),result=p_result,due_at=now()+make_interval(mins=>power(2,j.attempts)::integer),lease_token=null,lease_until=null,finished_at=case when new_state='failed' then now() else null end where id=j.id;
  update public.ac_seo_power_r4_attempts set finished_at=now(),state=new_state,error=left(p_error,1000),result=p_result where job_id=p_id and lease_token=p_token and finished_at is null;
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
 update public.ac_seo_power_r4_attempts set finished_at=now(),state='succeeded',result=p_result where job_id=p_id and lease_token=p_token and finished_at is null;
 return jsonb_build_object('state','succeeded');
end $$;

-- No old scheduler override until activation: existing scheduler and UI remain intact.
alter table public.ac_seo_power_r4_control enable row level security;
alter table public.ac_seo_power_r4_attempts enable row level security;
alter table public.ac_seo_power_r4_project_state enable row level security;
revoke all on public.ac_seo_power_r4_control,public.ac_seo_power_r4_attempts,public.ac_seo_power_r4_project_state from public,anon,authenticated;
grant all on public.ac_seo_power_r4_control,public.ac_seo_power_r4_attempts,public.ac_seo_power_r4_project_state to service_role;
do $$ declare f record;begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname like 'ac_seo_power_r4_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
commit;
-- Deliberately no enabling update. Activation is a separate, reversible operator action.
