-- Native SEO Growth R3. Requires SEO POWER R1 and Operations R2 (bundled installer SQL includes R2).
begin;
create table if not exists public.ac_seo_growth_config(project_id uuid primary key references public.ac_seo_power_projects(id),policy jsonb not null default '{}',version integer not null default 1,updated_at timestamptz not null default now());
alter table public.ac_seo_growth_config add column if not exists build_cursor text not null default '';
alter table public.ac_seo_growth_config add column if not exists publish_after timestamptz;
alter table public.ac_seo_growth_config add column if not exists build_generation integer not null default 1;
alter table public.ac_seo_growth_config add column if not exists last_tick timestamptz;
alter table public.ac_seo_growth_config add column if not exists lease_token uuid;
alter table public.ac_seo_growth_config add column if not exists lease_until timestamptz;
create table if not exists public.ac_seo_growth_scans(project_id uuid references public.ac_seo_power_projects(id),locale text not null,page integer not null default 1,cycle uuid not null default gen_random_uuid(),total integer not null default 0,last_complete timestamptz,next_due timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(project_id,locale));
alter table public.ac_seo_growth_scans add column if not exists last_batch jsonb not null default '{}';
create table if not exists public.ac_seo_growth_inventory(project_id uuid references public.ac_seo_power_projects(id),locale text not null,item_id text not null,data jsonb not null,cycle uuid not null,active boolean not null default true,observed_at timestamptz not null default now(),primary key(project_id,locale,item_id));
create index if not exists ac_seo_growth_inventory_group on public.ac_seo_growth_inventory(project_id,locale,active);
create index if not exists ac_seo_growth_inventory_topic on public.ac_seo_growth_inventory(project_id,locale,(data->>'group'),(data->>'topic'),item_id)where active;
create table if not exists public.ac_seo_growth_opportunities(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.ac_seo_power_projects(id),key text not null,path text not null,locale text not null,data jsonb not null,source_hash text not null,version integer not null default 1,state text not null default 'candidate' check(state in ('candidate','ready','published','parked','stale')),page_id uuid references public.ac_seo_power_pages(id),change_id uuid references public.ac_seo_power_changes(id),updated_at timestamptz not null default now(),unique(project_id,key),unique(project_id,path));
alter table public.ac_seo_growth_opportunities add column if not exists published_data jsonb;
create table if not exists public.ac_seo_growth_activity(id uuid primary key default gen_random_uuid(),project_id uuid references public.ac_seo_power_projects(id),action text not null,state text not null,detail jsonb not null default '{}',created_at timestamptz not null default now());
create index if not exists ac_seo_growth_activity_recent on public.ac_seo_growth_activity(project_id,created_at desc);
create table if not exists public.ac_seo_growth_metrics(project_id uuid references public.ac_seo_power_projects(id),path text not null,day date not null default current_date,event text not null,channel text not null,hits bigint not null default 0,primary key(project_id,path,day,event,channel));
create index if not exists ac_seo_growth_metrics_period on public.ac_seo_growth_metrics(day,project_id,event,channel);
alter table public.ac_seo_growth_metrics add column if not exists last_received timestamptz not null default now();
create table if not exists public.ac_seo_growth_dedupe(key text primary key,created_at timestamptz not null default now());
insert into public.ac_seo_growth_config(project_id)select id from public.ac_seo_power_projects on conflict do nothing;
-- Mutations are service-only. Actor authorization stays at the native Marketplace API boundary.
create or replace function public.ac_seo_growth_command(p_action text,p_project uuid,p_payload jsonb,p_actor uuid,p_request text,p_hash text)returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare receipt public.ac_seo_power_receipts; cfg public.ac_seo_growth_config; scan public.ac_seo_growth_scans; op public.ac_seo_growth_opportunities; item jsonb; result jsonb; pgid uuid;
begin
 if p_actor is null or length(p_request) not between 8 and 160 or length(p_hash)<>64 then raise exception 'INVALID_COMMAND';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':'||p_request,0));
 select * into receipt from public.ac_seo_power_receipts where actor_id=p_actor and request_key=p_request;
 if found then if receipt.input_hash<>p_hash then raise exception 'REQUEST_REUSED';end if;return receipt.result;end if;
 select * into strict cfg from public.ac_seo_growth_config where project_id=p_project for update;
 if p_action='policy' then
  if cfg.version is distinct from (p_payload->>'version')::int then raise exception 'STALE_REVISION';end if;
  update public.ac_seo_growth_config set publish_after=null,policy=p_payload->'policy',version=version+1,updated_at=now() where project_id=p_project returning to_jsonb(ac_seo_growth_config.*) into result;
 elsif p_action='cursor' then
  if cfg.build_cursor is distinct from p_payload->>'expectedCursor' or cfg.build_generation is distinct from (p_payload->>'expectedGeneration')::int then raise exception 'STALE_GROWTH_CURSOR';end if;
  update public.ac_seo_growth_config set build_cursor=p_payload->>'nextCursor',build_generation=build_generation+case when p_payload->>'nextCursor'=''then 1 else 0 end where project_id=p_project returning to_jsonb(ac_seo_growth_config.*)into result;
 elsif p_action='inventory' then
  select * into strict scan from public.ac_seo_growth_scans where project_id=p_project and locale=p_payload->>'locale' for update;
  if scan.cycle is distinct from (p_payload->>'cycle')::uuid or scan.page is distinct from (p_payload->>'page')::int then raise exception 'STALE_INVENTORY_SCAN';end if;
  if jsonb_array_length(p_payload->'items')>240 then raise exception 'INVALID_BATCH';end if;
  for item in select value from jsonb_array_elements(p_payload->'items')loop
   if not public.ac_seo_power_path(item->>'path',(select world from public.ac_seo_power_projects where id=p_project)) or item->>'locale'<>scan.locale then raise exception 'INVENTORY_SCOPE';end if;
   insert into public.ac_seo_growth_inventory(project_id,locale,item_id,data,cycle)values(p_project,scan.locale,item->>'id',item,scan.cycle)on conflict(project_id,locale,item_id)do update set data=excluded.data,cycle=excluded.cycle,active=true,observed_at=now();
  end loop;
  update public.ac_seo_growth_scans set last_batch=coalesce(p_payload->'note','{}')where project_id=p_project and locale=scan.locale;
  if p_payload->>'done'='true' then
   update public.ac_seo_growth_inventory set active=false where project_id=p_project and locale=scan.locale and cycle<>scan.cycle;
   update public.ac_seo_growth_opportunities o set state='stale',data=jsonb_set(jsonb_set(o.data,'{ready}','false'),'{blocks}'::text[],'["NATIVE_INVENTORY_WITHDRAWN"]'::jsonb),updated_at=now()
   where o.project_id=p_project and o.locale=scan.locale and o.state<>'parked' and(select count(*)from jsonb_array_elements(coalesce(o.data->'items','[]'))el join public.ac_seo_growth_inventory i on i.project_id=o.project_id and i.locale=o.locale and i.item_id=el->>'id' and i.active)<coalesce((cfg.policy->>'minimumItems')::int,3);
   update public.ac_seo_growth_scans set page=1,cycle=gen_random_uuid(),last_complete=now(),total=(p_payload->>'total')::int,next_due=now()+make_interval(mins=>coalesce((cfg.policy->>'syncMinutes')::int,60)),updated_at=now() where project_id=p_project and locale=scan.locale;
  else update public.ac_seo_growth_scans set page=page+1,total=(p_payload->>'total')::int,next_due=now(),updated_at=now() where project_id=p_project and locale=scan.locale;end if;
  result=jsonb_build_object('items',jsonb_array_length(p_payload->'items'),'complete',p_payload->'done','locale',scan.locale);
 elsif p_action='opportunity' then
  insert into public.ac_seo_growth_opportunities(project_id,key,path,locale,data,source_hash,state)values(p_project,p_payload->>'key',p_payload->>'path',p_payload->>'locale',p_payload->'data',p_payload->>'sourceHash',case when p_payload->'data'->>'ready'='true' then 'ready' else 'candidate' end)
  on conflict(project_id,key)do update set data=case when ac_seo_growth_opportunities.state='parked' then ac_seo_growth_opportunities.data else excluded.data end,source_hash=case when ac_seo_growth_opportunities.state='parked' then ac_seo_growth_opportunities.source_hash else excluded.source_hash end,state=case when ac_seo_growth_opportunities.state='parked' then 'parked' when ac_seo_growth_opportunities.source_hash<>excluded.source_hash and ac_seo_growth_opportunities.change_id is not null then 'stale' when ac_seo_growth_opportunities.change_id is null then excluded.state else ac_seo_growth_opportunities.state end,version=case when ac_seo_growth_opportunities.state<>'parked' and ac_seo_growth_opportunities.source_hash<>excluded.source_hash then ac_seo_growth_opportunities.version+1 else ac_seo_growth_opportunities.version end,updated_at=now() returning to_jsonb(ac_seo_growth_opportunities.*) into result;
 elsif p_action='reserve' then
  if (select count(*) from public.ac_seo_growth_activity where project_id=p_project and action='reserve' and created_at>=date_trunc('day',now()))>=coalesce((cfg.policy->>'maxPagesPerDay')::int,3) then raise exception 'GROWTH_DAILY_BUDGET';end if;
  result=jsonb_build_object('reserved',true,'opportunityId',p_payload->>'id');
 elsif p_action='attach' then
  select * into strict op from public.ac_seo_growth_opportunities where id=(p_payload->>'id')::uuid and project_id=p_project for update;
  if op.version<>(p_payload->>'version')::int or op.source_hash<>p_payload->>'sourceHash' then raise exception 'STALE_REVISION';end if;
  pgid=(p_payload->>'pageId')::uuid;
  if not exists(select 1 from public.ac_seo_power_pages where id=pgid and project_id=p_project and path=op.path) then raise exception 'INVENTORY_SCOPE';end if;
  if not exists(select 1 from public.ac_seo_power_changes where id=(p_payload->>'changeId')::uuid and page_id=pgid and state='published') then raise exception 'PUBLICATION_REQUIRED';end if;
  update public.ac_seo_growth_opportunities set state='published',published_data=data,page_id=pgid,change_id=(p_payload->>'changeId')::uuid,version=version+1,updated_at=now()where id=op.id returning to_jsonb(ac_seo_growth_opportunities.*)into result;
 elsif p_action='withdraw' then
  select *into strict op from public.ac_seo_growth_opportunities where id=(p_payload->>'id')::uuid and project_id=p_project for update;
  if op.change_id is not null and exists(select 1 from public.ac_seo_power_pages where id=op.page_id and published_change_id=op.change_id)then raise exception 'NATIVE_ROLLBACK_REQUIRED';end if;
  update public.ac_seo_growth_opportunities set state='parked',change_id=null,page_id=null,version=version+1,updated_at=now()where id=(p_payload->>'id')::uuid and project_id=p_project and version=(p_payload->>'version')::int returning to_jsonb(ac_seo_growth_opportunities.*)into result;if result is null then raise exception 'STALE_REVISION';end if;
 elsif p_action='park' then
  update public.ac_seo_growth_opportunities set state=case when p_payload->>'parked'='true' then 'parked' else 'stale' end,version=version+1,updated_at=now()where id=(p_payload->>'id')::uuid and project_id=p_project and version=(p_payload->>'version')::int returning to_jsonb(ac_seo_growth_opportunities.*)into result;
  if result is null then raise exception 'STALE_REVISION';end if;
 else raise exception 'UNKNOWN_GROWTH_COMMAND';end if;
 insert into public.ac_seo_growth_activity(project_id,action,state,detail)values(p_project,p_action,'confirmed',jsonb_build_object('request',p_request,'resultId',result->>'id'));
 insert into public.ac_seo_power_receipts(actor_id,request_key,input_hash,action,result)values(p_actor,p_request,p_hash,'growth:'||p_action,coalesce(result,'{}'));
 return result;
end $$;
create or replace function public.ac_seo_growth_measure(p_project uuid,p_path text,p_event text,p_channel text,p_key text)returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if p_event not in ('pageview','resource_open','apply_intent','enquiry_intent','application_confirmed','file_response') or p_channel not in ('search','internal','direct','referral','native_unattributed') or length(p_key)<>64 then raise exception 'INVALID_METRIC';end if;
 if not exists(select 1 from public.ac_seo_growth_config c join public.ac_seo_power_projects p on p.id=c.project_id where p.id=p_project and p.enabled and c.policy->>'measurement'='true' and public.ac_seo_power_path(p_path,p.world))then return false;end if;
 insert into public.ac_seo_growth_dedupe(key)values(p_key)on conflict do nothing;if not found then return false;end if;
 insert into public.ac_seo_growth_metrics(project_id,path,event,channel,hits)values(p_project,p_path,p_event,p_channel,1)on conflict(project_id,path,day,event,channel)do update set hits=ac_seo_growth_metrics.hits+1,last_received=now();
 delete from public.ac_seo_growth_dedupe where key in(select key from public.ac_seo_growth_dedupe where created_at<now()-interval '8 days' limit 100);
 return true;
end $$;

create or replace function public.ac_seo_growth_native_outcomes(p_project uuid default null)returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare apps bigint=null;inquiries bigint=null;begin
 if (p_project is null or exists(select 1 from public.ac_seo_power_projects where id=p_project and world='jobkix'))and to_regclass('public.jobkix_applications')is not null then execute 'select count(*)from public.jobkix_applications where submitted_at>=now()-interval ''30 days'''into apps;end if;
 if (p_project is null or exists(select 1 from public.ac_seo_power_projects where id=p_project and world='angelcare'))and to_regclass('public.angelcare_marketplace_public_inquiries')is not null then execute 'select count(*)from public.angelcare_marketplace_public_inquiries where created_at>=now()-interval ''30 days'''into inquiries;end if;
 return jsonb_build_object('applications',apps,'inquiries',inquiries,'organicAttribution',null,'periodDays',30);
exception when undefined_column then return jsonb_build_object('applications',null,'inquiries',null,'organicAttribution',null,'schemaUnavailable',true);
end $$;
create or replace function public.ac_seo_growth_snapshot(p_project uuid default null,p_state text default 'all',p_page integer default 1)returns jsonb language sql security definer set search_path=pg_catalog,public as $$
select jsonb_build_object('observedAt',now(),'config',coalesce((select jsonb_agg(c)from public.ac_seo_growth_config c where p_project is null or project_id=p_project),'[]'),'scans',coalesce((select jsonb_agg(s)from public.ac_seo_growth_scans s where p_project is null or project_id=p_project),'[]'),
 'measurementLast',(select max(last_received)from public.ac_seo_growth_metrics where p_project is null or project_id=p_project),'nativeOutcomes',public.ac_seo_growth_native_outcomes(p_project),
 'inventory',(select count(*)from public.ac_seo_growth_inventory where active and(p_project is null or project_id=p_project)),
 'total',(select count(*)from public.ac_seo_growth_opportunities where(p_project is null or project_id=p_project)and(p_state='all' or state=p_state)),
 'opportunities',coalesce((select jsonb_agg(t)from(select o.*,ch.verified_at,ch.version change_version,(p.published_change_id=o.change_id)active_publication,(select coalesce(sum(hits),0)from public.ac_seo_growth_metrics m where m.project_id=o.project_id and m.path=o.path and m.event='pageview' and m.channel='search' and m.day>=current_date-29)search_entries,(select coalesce(sum(hits),0)from public.ac_seo_growth_metrics m where m.project_id=o.project_id and m.path=o.path and m.event='resource_open' and m.day>=current_date-29)resource_opens from public.ac_seo_growth_opportunities o left join public.ac_seo_power_changes ch on ch.id=o.change_id left join public.ac_seo_power_pages p on p.id=o.page_id where(p_project is null or o.project_id=p_project)and(p_state='all' or o.state=p_state)order by o.updated_at desc,o.id limit 30 offset (greatest(1,least(100000,p_page))-1)*30)t),'[]'),
 'metrics',coalesce((select jsonb_agg(t)from(select path,event,channel,sum(hits)::bigint hits from public.ac_seo_growth_metrics where day>=current_date-29 and(p_project is null or project_id=p_project)group by path,event,channel order by sum(hits)desc limit 200)t),'[]'),
 'daily',coalesce((select jsonb_agg(t)from(select day,event,channel,sum(hits)::bigint hits from public.ac_seo_growth_metrics where day>=current_date-29 and(p_project is null or project_id=p_project)group by day,event,channel order by day)t),'[]'),
 'activity',coalesce((select jsonb_agg(t)from(select * from public.ac_seo_growth_activity where p_project is null or project_id=p_project order by created_at desc limit 50)t),'[]'));
$$;

create or replace function public.ac_seo_growth_groups(p_project uuid,p_after text default '',p_limit int default 12)returns jsonb language sql security definer set search_path=pg_catalog,public as $$
with g as(select locale,data->>'group' grp,data->>'topic' topic,count(*) total,locale||'|'||(data->>'group')||'|'||(data->>'topic') cursor from public.ac_seo_growth_inventory where project_id=p_project and active group by locale,data->>'group',data->>'topic'),chosen as(select * from g where cursor>p_after order by cursor limit greatest(1,least(12,p_limit)))
select coalesce(jsonb_agg(t),'[]')from(select chosen.*, (select jsonb_agg(x.data)from(select data from public.ac_seo_growth_inventory i where i.project_id=p_project and i.locale=chosen.locale and i.active and i.data->>'group'=chosen.grp and i.data->>'topic'=chosen.topic order by i.item_id limit 12)x) items from chosen)t;
$$;
create or replace function public.ac_seo_growth_lease(p_project uuid,p_token uuid)returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 update public.ac_seo_growth_config set lease_token=p_token,lease_until=now()+interval '2 minutes',last_tick=now() where project_id=p_project and policy->>'enabled'='true' and(lease_until is null or lease_until<now());return found;
end $$;
create or replace function public.ac_seo_growth_release(p_project uuid,p_token uuid,p_detail jsonb,p_error text default null)returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 update public.ac_seo_growth_config set lease_token=null,lease_until=null where project_id=p_project and lease_token=p_token;if not found then raise exception 'STALE_GROWTH_LEASE';end if;
 insert into public.ac_seo_growth_activity(project_id,action,state,detail)values(p_project,'tick',case when p_error is null then 'completed' else 'failed' end,p_detail);
end $$;
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
  (select to_jsonb(e) from public.ac_seo_power_executions e where e.project_id=pr.id or e.result->'growth'->>'projectId'=pr.id::text or (e.project_id is null and exists(select 1 from jsonb_array_elements(coalesce(e.result->'results','[]')) z where z->>'projectId'=pr.id::text)) order by e.started_at desc limit 1) as execution
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


create or replace function public.ac_seo_growth_sitemap_paths(p_project uuid)returns jsonb language sql security definer set search_path=pg_catalog,public as $$
select coalesce(jsonb_agg(jsonb_build_object('path',o.path,'eligible',coalesce((o.published_data->>'ready')::boolean,false)
 and coalesce((o.published_data->'evidence'->>'words')::int,0)>=coalesce((c.policy->>'minimumWords')::int,180)
 and exists(select 1 from public.ac_seo_growth_scans s where s.project_id=o.project_id and s.locale=o.locale and s.last_complete>now()-make_interval(mins=>greatest(60,coalesce((c.policy->>'syncMinutes')::int,60)*3)))
 and(select count(*)from jsonb_array_elements(coalesce(o.published_data->'items','[]'))el join public.ac_seo_growth_inventory i on i.project_id=o.project_id and i.locale=o.locale and i.item_id=el->>'id' and i.active and (i.data->>'revision')is not distinct from(el->>'revision'))>=coalesce((c.policy->>'minimumItems')::int,3))),'[]')
from public.ac_seo_growth_opportunities o join public.ac_seo_growth_config c on c.project_id=o.project_id where o.project_id=p_project and o.change_id is not null;
$$;

do $$declare t text;f record;begin
 foreach t in array array['config','scans','inventory','opportunities','activity','metrics','dedupe']loop execute format('alter table public.ac_seo_growth_%I enable row level security',t);execute format('revoke all on public.ac_seo_growth_%I from public,anon,authenticated',t);execute format('grant all on public.ac_seo_growth_%I to service_role',t);end loop;
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'ac_seo_growth_%' loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);execute format('grant execute on function %s to service_role',f.signature);end loop;
end $$;
commit;
select public.ac_seo_growth_snapshot();
