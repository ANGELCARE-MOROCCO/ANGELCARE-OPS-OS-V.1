-- SEO POWER R1 · additive migration for the existing Marketplace Supabase.
-- Run the complete file as the database owner. No existing publication table is changed.
begin;
create table if not exists public.ac_seo_power_projects (
 id uuid primary key default gen_random_uuid(), world text not null unique check(world in ('angelcare','kidflix','jobkix')),
 name text not null, origin text not null default 'https://my.angelcarehub.com' check(origin ~ '^https://[a-zA-Z0-9.-]+$'),
 enabled boolean not null default true, version integer not null default 1,
 policy jsonb not null default '{"crawlBudget":120,"linksPerPage":30,"timeoutSeconds":8,"intervalHours":24,"scheduleEnabled":false,"indexNowEnabled":false,"autoCanonical":false}',
 last_scheduled_at timestamptz, created_at timestamptz not null default now()
);
insert into public.ac_seo_power_projects(world,name) values ('angelcare','AngelCare Marketplace'),('kidflix','KidFlix'),('jobkix','JOBKIX') on conflict(world) do nothing;
create table if not exists public.ac_seo_power_pages (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ac_seo_power_projects(id),
 path text not null, locale text not null, kind text not null default 'native' check(kind in ('native','landing')),
 title text not null default '', description text not null default '', http_status integer, indexable boolean not null default false,
 content_hash text, facts jsonb, last_scanned_at timestamptz, published_change_id uuid, version integer not null default 1,
 created_at timestamptz not null default now(), unique(project_id,path)
);
create table if not exists public.ac_seo_power_jobs (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ac_seo_power_projects(id),
 page_id uuid not null references public.ac_seo_power_pages(id), kind text not null check(kind in ('crawl','links','verify','indexnow')),
 state text not null default 'queued' check(state in ('queued','running','succeeded','failed','cancelled')),
 payload jsonb not null default '{}', result jsonb, error text, attempts integer not null default 0,
 due_at timestamptz not null default now(), lease_until timestamptz, lease_token uuid,
 created_at timestamptz not null default now(), started_at timestamptz, finished_at timestamptz
);
create unique index if not exists ac_seo_power_active_job on public.ac_seo_power_jobs(page_id,kind) where state in ('queued','running');
create index if not exists ac_seo_power_due_job on public.ac_seo_power_jobs(state,due_at);
create table if not exists public.ac_seo_power_observations (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ac_seo_power_projects(id),
 page_id uuid not null references public.ac_seo_power_pages(id), job_id uuid references public.ac_seo_power_jobs(id),
 facts jsonb not null, observed_at timestamptz not null default now()
);
create table if not exists public.ac_seo_power_issues (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ac_seo_power_projects(id),
 page_id uuid not null references public.ac_seo_power_pages(id), code text not null, severity text not null,
 message text not null, evidence text not null default '', action text not null, state text not null default 'open' check(state in ('open','resolved','ignored')),
 first_seen timestamptz not null default now(), last_seen timestamptz not null default now(), unique(page_id,code)
);
create table if not exists public.ac_seo_power_changes (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.ac_seo_power_projects(id),
 page_id uuid not null references public.ac_seo_power_pages(id), patch jsonb not null, base_hash text,
 state text not null default 'draft' check(state in ('draft','approved','published','superseded','reverted')),
 version integer not null default 1, reason text not null, created_by uuid not null, reviewed_by uuid,
 previous_id uuid references public.ac_seo_power_changes(id), created_at timestamptz not null default now(), published_at timestamptz,
 verified_at timestamptz, verification jsonb
);
create table if not exists public.ac_seo_power_receipts (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null, request_key text not null, input_hash text not null,
 action text not null, result jsonb not null, created_at timestamptz not null default now(), unique(actor_id,request_key)
);
create table if not exists public.ac_seo_power_ci (
 id uuid primary key default gen_random_uuid(), source_sha text not null, run_id text not null, source text not null,
 results jsonb not null, created_at timestamptz not null default now(), unique(run_id,source)
);
create table if not exists public.ac_seo_power_runtime (
 singleton boolean primary key default true check(singleton), endpoint text, token_hash text, vault_secret_id uuid,
 enabled boolean not null default false, last_tick timestamptz, last_request_id bigint,
 indexnow_key text not null default replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')
);
insert into public.ac_seo_power_runtime(singleton) values(true) on conflict do nothing;

create or replace function public.ac_seo_power_path(p_path text,p_world text) returns boolean language sql immutable set search_path=pg_catalog as $$
 select p_path is not null and length(p_path) between 3 and 1800 and p_path !~ '[[:space:]\\?#]' and p_path !~* '%2f|%5c|%2e|%00' and p_path !~ '(^|/)\.\.?(/|$)'
 and p_path ~ ('^/' || case when p_world='angelcare' then 'angelcare-marketplace' else p_world end || '/' || case when p_world='jobkix' then '(en|fr|es|hi|tl|id|ar)' else '(en|fr|ar)' end || '(/|$)')
 and p_path !~* '/(admin|api|auth|login|logout|signin|signup|sign-in|sign-up|register|reset-password|callback|account|my-angelcare|my|saved|candidate|candidates|hirer|dashboard|workspace|applications|messages|profile|basket|checkout|quote-basket|quotation|subscription|enrollment|booking|preview|payment|payments)(/|$)';
$$;

create or replace function public.ac_seo_power_enqueue(p_page uuid,p_kind text,p_payload jsonb default '{}') returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_page public.ac_seo_power_pages; v_id uuid;
begin
 if p_kind not in ('crawl','links','verify','indexnow') then raise exception 'INVALID_JOB_KIND'; end if;
 select * into strict v_page from public.ac_seo_power_pages where id=p_page for update;
 if (select count(*) from public.ac_seo_power_jobs where project_id=v_page.project_id and state in ('queued','running'))>=1000 then raise exception 'QUEUE_BUDGET_EXCEEDED'; end if;
 if p_kind='verify' then
  update public.ac_seo_power_jobs set state='cancelled',lease_token=null,lease_until=null,finished_at=now(),error='Superseded publication verification' where page_id=p_page and kind='verify' and state in ('queued','running') and payload->>'changeId' is distinct from p_payload->>'changeId';
 end if;
 insert into public.ac_seo_power_jobs(project_id,page_id,kind,payload) values(v_page.project_id,p_page,p_kind,coalesce(p_payload,'{}'))
 on conflict(page_id,kind) where state in ('queued','running') do nothing returning id into v_id;
 if v_id is null then select id into v_id from public.ac_seo_power_jobs where page_id=p_page and kind=p_kind and state in ('queued','running'); end if;
 return v_id;
end $$;

create or replace function public.ac_seo_power_command(p_action text,p_payload jsonb,p_actor uuid,p_request text,p_hash text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare pr public.ac_seo_power_projects; pg public.ac_seo_power_pages; ch public.ac_seo_power_changes; rc public.ac_seo_power_receipts;
 result jsonb; item jsonb; pid uuid; jid uuid; previous uuid; expected integer;
begin
 if p_actor is null or length(p_request) not between 8 and 160 or length(p_hash)<>64 then raise exception 'INVALID_COMMAND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':'||p_request,0));
 select * into rc from public.ac_seo_power_receipts where actor_id=p_actor and request_key=p_request;
 if found then if rc.input_hash<>p_hash then raise exception 'REQUEST_REUSED'; end if; return rc.result; end if;
 if p_action='project' then
  select * into strict pr from public.ac_seo_power_projects where id=(p_payload->>'id')::uuid for update;
  if pr.version is distinct from (p_payload->>'version')::int then raise exception 'STALE_REVISION'; end if;
  if p_payload->>'origin' !~ '^https://[a-zA-Z0-9.-]+$' then raise exception 'INVALID_ORIGIN'; end if;
  update public.ac_seo_power_projects set origin=p_payload->>'origin',enabled=coalesce((p_payload->>'enabled')::boolean,true),policy=p_payload->'policy',version=version+1 where id=pr.id returning to_jsonb(ac_seo_power_projects.*) into result;
 elsif p_action='register' then
  select * into strict pr from public.ac_seo_power_projects where id=(p_payload->>'projectId')::uuid;
  if jsonb_array_length(p_payload->'paths') not between 1 and 100 then raise exception 'INVALID_BATCH'; end if;
  result='[]';
  for item in select value from jsonb_array_elements(p_payload->'paths') loop
   if not public.ac_seo_power_path(item#>>'{}',pr.world) then raise exception 'PRIVATE_OR_WRONG_WORLD_PATH'; end if;
   insert into public.ac_seo_power_pages(project_id,path,locale,kind) values(pr.id,item#>>'{}',split_part(item#>>'{}','/',3),case when coalesce(p_payload->>'kind','native')='landing' then 'landing' else 'native' end)
   on conflict(project_id,path) do update set path=excluded.path returning id into pid;
   result=result||jsonb_build_array(pid);
  end loop;
 elsif p_action='queue' then
  result='[]';
  if jsonb_array_length(p_payload->'pageIds') not between 1 and 100 then raise exception 'INVALID_BATCH'; end if;
  for item in select value from jsonb_array_elements(p_payload->'pageIds') loop
   jid=public.ac_seo_power_enqueue((item#>>'{}')::uuid,p_payload->>'kind',coalesce(p_payload->'options','{}'));
   result=result||jsonb_build_array(jid);
  end loop;
 elsif p_action='cancel' then
  update public.ac_seo_power_jobs set state='cancelled',lease_token=null,lease_until=null,finished_at=now() where id=(p_payload->>'id')::uuid and state in ('queued','running') returning to_jsonb(ac_seo_power_jobs.*) into result;
  if result is null then raise exception 'JOB_NOT_CANCELLABLE'; end if;
 elsif p_action='issue' then
  if p_payload->>'state' not in ('open','ignored') then raise exception 'INVALID_ISSUE_STATE'; end if;
  update public.ac_seo_power_issues set state=p_payload->>'state' where id=(p_payload->>'id')::uuid returning to_jsonb(ac_seo_power_issues.*) into result;
  if result is null then raise exception 'ISSUE_NOT_FOUND'; end if;
 elsif p_action='propose' then
  select * into strict pg from public.ac_seo_power_pages where id=(p_payload->>'pageId')::uuid for update;
  if pg.content_hash is distinct from nullif(p_payload->>'baseHash','') then raise exception 'STALE_SOURCE'; end if;
  if length(coalesce(p_payload->>'reason','')) not between 8 and 2000 or jsonb_typeof(p_payload->'patch')<>'object' then raise exception 'CHANGE_REASON_REQUIRED'; end if;
  insert into public.ac_seo_power_changes(project_id,page_id,patch,base_hash,reason,created_by) values(pg.project_id,pg.id,p_payload->'patch',pg.content_hash,p_payload->>'reason',p_actor) returning to_jsonb(ac_seo_power_changes.*) into result;
 elsif p_action='revise' then
  select * into strict ch from public.ac_seo_power_changes where id=(p_payload->>'id')::uuid;
  select * into strict pg from public.ac_seo_power_pages where id=ch.page_id for update;
  select * into strict ch from public.ac_seo_power_changes where id=(p_payload->>'id')::uuid for update;
  if ch.version is distinct from (p_payload->>'version')::int then raise exception 'STALE_REVISION'; end if;
  if ch.state<>'draft' then raise exception 'CHANGE_NOT_DRAFT'; end if;
  if pg.content_hash is distinct from nullif(p_payload->>'baseHash','') then raise exception 'STALE_SOURCE'; end if;
  if length(coalesce(p_payload->>'reason','')) not between 8 and 2000 then raise exception 'CHANGE_REASON_REQUIRED'; end if;
  update public.ac_seo_power_changes set patch=p_payload->'patch',reason=p_payload->>'reason',base_hash=pg.content_hash,version=version+1 where id=ch.id returning to_jsonb(ac_seo_power_changes.*) into result;
 elsif p_action in ('approve','publish','rollback') then
  select * into strict ch from public.ac_seo_power_changes where id=(p_payload->>'id')::uuid;
  select * into strict pg from public.ac_seo_power_pages where id=ch.page_id for update;
  select * into strict ch from public.ac_seo_power_changes where id=(p_payload->>'id')::uuid for update;
  if ch.version is distinct from (p_payload->>'version')::int then raise exception 'STALE_REVISION'; end if;
  if p_action='approve' then
   if ch.state<>'draft' then raise exception 'CHANGE_NOT_DRAFT'; end if;
   update public.ac_seo_power_changes set state='approved',reviewed_by=p_actor,version=version+1 where id=ch.id returning to_jsonb(ac_seo_power_changes.*) into result;
  elsif p_action='publish' then
   if ch.state<>'approved' then raise exception 'REVIEW_REQUIRED'; end if;
   if pg.kind<>'landing' and (ch.base_hash is null or ch.base_hash is distinct from pg.content_hash or ch.base_hash is distinct from p_payload->>'liveHash') then raise exception 'STALE_SOURCE'; end if;
   select * into strict pr from public.ac_seo_power_projects where id=pg.project_id;
   if not pr.enabled or not public.ac_seo_power_path(pg.path,pr.world) then raise exception 'PUBLICATION_BLOCKED'; end if;
   if pg.kind='landing' and (length(coalesce(ch.patch->>'body',''))<150 or length(coalesce(ch.patch->>'title',''))=0) then raise exception 'INCOMPLETE_CONTENT'; end if;
   if pg.kind<>'landing' and (not pg.indexable or pg.http_status<>200) then raise exception 'NATIVE_PAGE_NOT_PUBLIC'; end if;
   previous=pg.published_change_id;
   update public.ac_seo_power_changes set state='superseded' where id=previous and state='published';
   update public.ac_seo_power_changes set state='published',previous_id=previous,published_at=now(),version=version+1 where id=ch.id returning to_jsonb(ac_seo_power_changes.*) into result;
   update public.ac_seo_power_pages set published_change_id=ch.id,version=version+1 where id=pg.id;
   perform public.ac_seo_power_enqueue(pg.id,'verify',jsonb_build_object('changeId',ch.id));
  else
   if length(coalesce(p_payload->>'reason','')) not between 8 and 2000 then raise exception 'CHANGE_REASON_REQUIRED'; end if;
   if pg.published_change_id is distinct from ch.id or ch.state<>'published' then raise exception 'LATER_PUBLICATION_PROTECTED'; end if;
   update public.ac_seo_power_pages set published_change_id=ch.previous_id,version=version+1 where id=pg.id;
   update public.ac_seo_power_changes set state='reverted',version=version+1 where id=ch.id returning to_jsonb(ac_seo_power_changes.*) into result;
   update public.ac_seo_power_changes set state='published',version=version+1 where id=ch.previous_id and state='superseded';
   perform public.ac_seo_power_enqueue(pg.id,'crawl');
  end if;
 else raise exception 'UNKNOWN_COMMAND';
 end if;
 if p_action='rollback' then result=result||jsonb_build_object('rollbackReason',p_payload->>'reason'); end if;
 insert into public.ac_seo_power_receipts(actor_id,request_key,input_hash,action,result) values(p_actor,p_request,p_hash,p_action,coalesce(result,'null'));
 return coalesce(result,'null');
end $$;

create or replace function public.ac_seo_power_claim(p_project uuid default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare pr public.ac_seo_power_projects; j public.ac_seo_power_jobs; token uuid; used integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('seo-power-claim-budget',0));
 update public.ac_seo_power_jobs set state=case when attempts>=3 then 'failed' else 'queued' end,lease_token=null,lease_until=null,error='Lease expired; retry scheduled',due_at=now()+interval '1 minute' where state='running' and lease_until<now();
 if (select count(*) from public.ac_seo_power_jobs where state='running' and lease_until>=now())>=3 then return null; end if;
 for pr in select * from public.ac_seo_power_projects where enabled and (p_project is null or id=p_project) order by id for update skip locked loop
  select count(*) into used from public.ac_seo_power_jobs where project_id=pr.id and started_at>=date_trunc('day',now());
  if used>=least(1000,greatest(5,coalesce((pr.policy->>'crawlBudget')::int,120))) then continue; end if;
  select * into j from public.ac_seo_power_jobs where project_id=pr.id and state='queued' and due_at<=now() order by due_at,created_at for update skip locked limit 1;
  if found then
   token=gen_random_uuid();
   update public.ac_seo_power_jobs set state='running',attempts=attempts+1,lease_token=token,lease_until=now()+interval '90 seconds',started_at=now(),error=null where id=j.id returning * into j;
   return to_jsonb(j)||jsonb_build_object('project',to_jsonb(pr),'page',(select to_jsonb(p) from public.ac_seo_power_pages p where p.id=j.page_id));
  end if;
 end loop;
 return null;
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
end $$;

create or replace function public.ac_seo_power_schedule_due() returns integer
language plpgsql security definer set search_path=pg_catalog,public as $$
declare pr public.ac_seo_power_projects; pg public.ac_seo_power_pages; total integer=0;
begin
 for pr in select * from public.ac_seo_power_projects where enabled and policy->>'scheduleEnabled'='true' and (last_scheduled_at is null or last_scheduled_at<now()-make_interval(hours=>greatest(1,least(168,coalesce((policy->>'intervalHours')::int,24))))) for update skip locked loop
  for pg in select * from public.ac_seo_power_pages where project_id=pr.id order by last_scanned_at nulls first,id limit least(1000,greatest(5,coalesce((pr.policy->>'crawlBudget')::int,120))) loop
   perform public.ac_seo_power_enqueue(pg.id,'crawl'); total=total+1;
  end loop;
  update public.ac_seo_power_projects set last_scheduled_at=now() where id=pr.id;
 end loop;
 return total;
end $$;

create or replace function public.ac_seo_power_runtime_status() returns jsonb
language sql security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('cron',exists(select 1 from pg_extension where extname='pg_cron'),'net',exists(select 1 from pg_extension where extname='pg_net'),'vault',exists(select 1 from pg_extension where extname='supabase_vault'),'enabled',r.enabled,'endpoint',r.endpoint,'lastTick',r.last_tick,'lastRequestId',r.last_request_id) from public.ac_seo_power_runtime r where singleton;
$$;

create or replace function public.ac_seo_power_tick() returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare r public.ac_seo_power_runtime; secret text; request_id bigint;
begin
 select * into r from public.ac_seo_power_runtime where singleton;
 if not r.enabled or r.endpoint is null then return; end if;
 execute 'select decrypted_secret from vault.decrypted_secrets where id=$1' into secret using r.vault_secret_id;
 if secret is null then raise exception 'SCHEDULER_SECRET_UNAVAILABLE'; end if;
 perform public.ac_seo_power_schedule_due();
 execute 'select net.http_post(url := $1, headers := $2, body := $3, timeout_milliseconds := 55000)' into request_id using r.endpoint,jsonb_build_object('Content-Type','application/json','x-seo-power-run-key',secret),'{}'::jsonb;
 update public.ac_seo_power_runtime set last_tick=now(),last_request_id=request_id where singleton;
end $$;

create or replace function public.ac_seo_power_scheduler(p_endpoint text,p_secret text,p_hash text,p_enabled boolean,p_actor uuid default null,p_request text default null,p_input_hash text default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare secret_id uuid; job bigint; receipt public.ac_seo_power_receipts; result jsonb;
begin
 if p_actor is not null then
  if length(p_request)<8 or length(p_input_hash)<>64 then raise exception 'INVALID_COMMAND'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':'||p_request,0));
  select * into receipt from public.ac_seo_power_receipts where actor_id=p_actor and request_key=p_request;
  if found then if receipt.input_hash<>p_input_hash then raise exception 'REQUEST_REUSED'; end if;return receipt.result;end if;
 end if;
 if p_enabled then
  if not exists(select 1 from pg_extension where extname='pg_cron') or not exists(select 1 from pg_extension where extname='pg_net') or not exists(select 1 from pg_extension where extname='supabase_vault') then raise exception 'SCHEDULER_EXTENSIONS_REQUIRED'; end if;
  if p_endpoint !~ '^https://[a-zA-Z0-9.-]+/api/angelcare-marketplace/admin/seo-power/run$' or length(p_secret)<40 or length(p_hash)<>64 then raise exception 'SCHEDULER_INPUT_INVALID'; end if;
  execute 'select vault.create_secret($1,$2,$3)' into secret_id using p_secret,'seo-power-'||gen_random_uuid()::text,'SEO POWER scheduler token';
  update public.ac_seo_power_runtime set endpoint=p_endpoint,token_hash=p_hash,vault_secret_id=secret_id,enabled=true where singleton;
  execute 'select jobid from cron.job where jobname=$1' into job using 'angelcare-seo-power-r1';
  if job is not null then execute 'select cron.unschedule($1)' using job; end if;
  execute 'select cron.schedule($1,$2,$3)' using 'angelcare-seo-power-r1','* * * * *','select public.ac_seo_power_tick();';
 else
  update public.ac_seo_power_runtime set enabled=false,token_hash=null where singleton;
  if exists(select 1 from pg_extension where extname='pg_cron') then
   execute 'select jobid from cron.job where jobname=$1' into job using 'angelcare-seo-power-r1';
   if job is not null then execute 'select cron.unschedule($1)' using job; end if;
  end if;
 end if;
 result=public.ac_seo_power_runtime_status();
 if p_actor is not null then insert into public.ac_seo_power_receipts(actor_id,request_key,input_hash,action,result) values(p_actor,p_request,p_input_hash,'scheduler',result);end if;
 return result;
end $$;

-- Only the application service client can read/write SEO authority or invoke RPCs.
create or replace function public.ac_seo_power_summary(p_project uuid default null) returns jsonb
language sql security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object(
  'pages',(select count(*) from public.ac_seo_power_pages where p_project is null or project_id=p_project),
  'indexable',(select count(*) from public.ac_seo_power_pages where (p_project is null or project_id=p_project) and indexable and http_status=200),
  'issues',(select count(*) from public.ac_seo_power_issues where (p_project is null or project_id=p_project) and state='open'),
  'queued',(select count(*) from public.ac_seo_power_jobs where (p_project is null or project_id=p_project) and state in ('queued','running')),
  'published',(select count(*) from public.ac_seo_power_changes where (p_project is null or project_id=p_project) and state='published'),
  'verified',(select count(*) from public.ac_seo_power_changes where (p_project is null or project_id=p_project) and state='published' and verified_at is not null)
 );
$$;
do $$ declare t text; f record; begin
 foreach t in array array['projects','pages','jobs','observations','issues','changes','receipts','ci','runtime'] loop
  execute format('alter table public.ac_seo_power_%I enable row level security',t);
  execute format('revoke all on public.ac_seo_power_%I from public,anon,authenticated',t);
  execute format('grant all on public.ac_seo_power_%I to service_role',t);
 end loop;
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ac_seo_power_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
comment on table public.ac_seo_power_projects is 'AngelCare SEO POWER R1; native actions, not ranking guarantees.';
commit;

-- Capability check: enable extensions using your existing Supabase controls if needed.
select public.ac_seo_power_runtime_status();
