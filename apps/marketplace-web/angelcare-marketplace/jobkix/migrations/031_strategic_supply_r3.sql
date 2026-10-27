-- JOBKIX Strategic Supply R3. Review and execute manually AFTER successful code deployment planning.
-- Additive only, existing public.jobkix_supply_* preserved. No scheduler is enabled by default.
begin;
alter table public.jobkix_supply_sources add column if not exists archived_at timestamptz;
alter table public.jobkix_supply_sources add column if not exists archived_by text;
create table if not exists public.jobkix_supply_r3_control(
 id integer primary key default 1 check (id=1), scheduler_enabled boolean not null default false,
 rss_enabled boolean not null default false, csv_enabled boolean not null default false,
 vacancy_csv_enabled boolean not null default false, global_pause boolean not null default true,
 max_concurrency integer not null default 1 check(max_concurrency between 1 and 3),
 heartbeat_at timestamptz, heartbeat_instance text, updated_at timestamptz not null default now(),updated_by text
);
insert into public.jobkix_supply_r3_control(id) values(1) on conflict (id) do nothing;
create table if not exists public.jobkix_supply_r3_schedules(
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.jobkix_supply_sources(id) on delete restrict,
 title text not null default '', enabled boolean not null default false,
 spec jsonb not null default '{}'::jsonb, next_run_at timestamptz, last_run_at timestamptz,
 last_due_at timestamptz, last_status text not null default 'idle', failure_count integer not null default 0,
 claimed_by text, lease_until timestamptz, attempts integer not null default 0,
 version integer not null default 1, created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(source_id)
);
create index if not exists jobkix_r3_due_idx on public.jobkix_supply_r3_schedules(next_run_at) where enabled=true;
create table if not exists public.jobkix_supply_r3_runs(
 id uuid primary key default gen_random_uuid(),schedule_id uuid not null references public.jobkix_supply_r3_schedules(id) on delete restrict,
 due_at timestamptz not null,mission_id uuid references public.jobkix_supply_missions(id) on delete set null,
 state text not null default 'running', started_at timestamptz not null default now(),ended_at timestamptz,
 result jsonb not null default '{}'::jsonb,error_message text,
 unique(schedule_id,due_at)
);
create index if not exists jobkix_r3_runs_schedule_idx on public.jobkix_supply_r3_runs(schedule_id,started_at desc);
create table if not exists public.jobkix_supply_r3_feed_cache(
 source_id uuid primary key references public.jobkix_supply_sources(id) on delete cascade,
 etag text,last_modified text,last_checked_at timestamptz, last_changed_at timestamptz
);
create table if not exists public.jobkix_supply_r3_imports(
 id uuid primary key default gen_random_uuid(),import_type text not null check(import_type in('sources','vacancies')),
 checksum text not null,filename text not null,schema_version integer not null default 3,
 mode text not null,operator_id text not null,state text not null default 'validated',
 total_rows integer not null,created_count integer not null default 0,updated_count integer not null default 0,
 rejected_count integer not null default 0,report jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),committed_at timestamptz
);
create index if not exists jobkix_r3_imports_created_idx on public.jobkix_supply_r3_imports(created_at desc);
create table if not exists public.jobkix_supply_r3_profiles(
 id uuid primary key default gen_random_uuid(),name text not null,config jsonb not null default '{}'::jsonb,
 version integer not null default 1,created_by text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.jobkix_supply_r3_control enable row level security;
alter table public.jobkix_supply_r3_schedules enable row level security;
alter table public.jobkix_supply_r3_runs enable row level security;
alter table public.jobkix_supply_r3_feed_cache enable row level security;
alter table public.jobkix_supply_r3_imports enable row level security;
alter table public.jobkix_supply_r3_profiles enable row level security;
revoke all on public.jobkix_supply_r3_control,public.jobkix_supply_r3_schedules,public.jobkix_supply_r3_runs,public.jobkix_supply_r3_feed_cache,public.jobkix_supply_r3_imports,public.jobkix_supply_r3_profiles from anon,authenticated;
grant all on public.jobkix_supply_r3_control,public.jobkix_supply_r3_schedules,public.jobkix_supply_r3_runs,public.jobkix_supply_r3_feed_cache,public.jobkix_supply_r3_imports,public.jobkix_supply_r3_profiles to service_role;
-- Atomic, multi-process-safe due job claim; no privileges for public users.
create or replace function public.jobkix_supply_r3_claim(p_instance text)
returns setof public.jobkix_supply_r3_schedules language plpgsql security definer set search_path=public as $$
declare picked uuid; maximum integer;
begin
 if length(p_instance)<5 or length(p_instance)>120 then raise exception 'INVALID_INSTANCE';end if;
 if not pg_try_advisory_xact_lock(915202603) then return;end if;
 update public.jobkix_supply_missions set state='failed',ended_at=now(),error_message='Internal API execution lease expired',updated_at=now()
 where state='running' and lease_until<now() and worker_id like 'internal-api-%';
 select max_concurrency into maximum from public.jobkix_supply_r3_control where id=1 and scheduler_enabled=true and global_pause=false;
 if maximum is null then return;end if;
 if (select count(*) from public.jobkix_supply_r3_schedules where lease_until>now())>=maximum then return;end if;
 select sc.id into picked from public.jobkix_supply_r3_schedules sc
 join public.jobkix_supply_sources so on so.id=sc.source_id
 where sc.enabled=true and sc.next_run_at<=now() and (sc.lease_until is null or sc.lease_until<now())
 and so.enabled=true and so.approved=true and so.kind='api'
 and (coalesce(so.config->>'format','json')='json' or
 (coalesce(so.config->>'format','json')='rss' and (select rss_enabled from public.jobkix_supply_r3_control where id=1)))
 and not exists(select 1 from public.jobkix_supply_missions m where m.source_id=sc.source_id and m.state='running')
 order by sc.next_run_at asc for update of sc skip locked limit 1;
 if picked is null then return;end if;
 return query update public.jobkix_supply_r3_schedules set claimed_by=p_instance,lease_until=now()+interval '4 minutes',
 last_due_at=next_run_at,last_status='running', attempts=attempts+1,updated_at=now()
 where id=picked returning *;
end;$$;
revoke all on function public.jobkix_supply_r3_claim(text) from public,anon,authenticated;
grant execute on function public.jobkix_supply_r3_claim(text) to service_role;

-- Bulk source transaction. Entire call is a transaction; per-row savepoints are enabled for valid_only.
create or replace function public.jobkix_supply_r3_apply_sources(p_rows jsonb,p_actor text,p_atomic boolean default true)
returns jsonb language plpgsql security definer set search_path=public as $$
declare item jsonb; src jsonb; sch jsonb; found_id uuid; expected integer; actual integer;
 idx integer:=0; created integer:=0; updated integer:=0; rejected integer:=0;
 changed uuid; next_at timestamptz; output jsonb:='[]'::jsonb; op text;
begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>500 then raise exception 'INVALID_CSV_BATCH';end if;
 if length(p_actor)<3 then raise exception 'INVALID_ACTOR';end if;
 for item in select value from jsonb_array_elements(p_rows) loop
  idx:=idx+1;
  begin
   src:=item->'source';sch:=item->'schedule';op:=coalesce(item->>'operation','create');
   if op not in('create','update','upsert') then raise exception 'INVALID_IMPORT_OPERATION';end if;
   if coalesce(src->>'kind','')<>'api' or coalesce(src->>'name','')='' or
      coalesce(src->>'endpoint','') not like 'https://%' or length(coalesce(src->>'country',''))<>2
      then raise exception 'INVALID_SOURCE_CONFIG';end if;
   if coalesce((src->>'enabled')::boolean,false) and not coalesce((src->>'approved')::boolean,false) then raise exception 'SOURCE_UNAUTHORIZED';end if;
   found_id:=null;
   if coalesce(src->>'id','')~*'^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$' then
    select id into found_id from public.jobkix_supply_sources where id=(src->>'id')::uuid for update;
   end if;
   if found_id is null then
    select id into found_id from public.jobkix_supply_sources where endpoint=src->>'endpoint' and country=src->>'country' and kind='api' order by created_at limit 1 for update;
   end if;
   if found_id is null then
    if op='update' then raise exception 'SOURCE_NOT_FOUND_FOR_UPDATE';end if;
    insert into public.jobkix_supply_sources(name,kind,country,endpoint,config,approved,enabled,publication_mode,created_by,updated_by)
    values(src->>'name','api',src->>'country',src->>'endpoint',src->'config',coalesce((src->>'approved')::boolean,false),
           coalesce((src->>'enabled')::boolean,false),coalesce(src->>'publicationMode','none'),p_actor::uuid,p_actor::uuid)
    returning id into changed;
    -- Counter is advanced only after any schedule insert completes.
   else
    if op='create' then raise exception 'SOURCE_ALREADY_EXISTS';end if;
    select version into actual from public.jobkix_supply_sources where id=found_id;
    expected:=coalesce((src->>'expectedVersion')::integer,0);
    if expected<>actual then raise exception 'VERSION_CONFLICT: expected %, actual %',expected,actual;end if;
    update public.jobkix_supply_sources set name=src->>'name',country=src->>'country',endpoint=src->>'endpoint',config=src->'config',
    approved=coalesce((src->>'approved')::boolean,false),enabled=coalesce((src->>'enabled')::boolean,false),
    publication_mode=coalesce(src->>'publicationMode','none'),version=version+1,updated_by=p_actor::uuid,updated_at=now()
    where id=found_id returning id into changed;
    -- Counter is advanced only after any schedule insert completes.
   end if;
   if sch is not null and jsonb_typeof(sch)='object' then
    next_at:=nullif(sch->>'nextRunAt','')::timestamptz;
    insert into public.jobkix_supply_r3_schedules(source_id,title,enabled,spec,next_run_at)
    values(changed,src->>'name',coalesce((sch->>'enabled')::boolean,false),sch->'spec',next_at)
    on conflict(source_id)do update set enabled=excluded.enabled,spec=excluded.spec,next_run_at=excluded.next_run_at,
     title=excluded.title,updated_at=now(),version=jobkix_supply_r3_schedules.version+1;
   end if;
   if found_id is null then created:=created+1;else updated:=updated+1;end if;
   output:=output||jsonb_build_array(jsonb_build_object('line',item->'line','id',changed,'status',case when found_id is null then 'created' else 'updated' end));
  exception when others then
   if p_atomic then raise;end if;
   rejected:=rejected+1;
   output:=output||jsonb_build_array(jsonb_build_object('line',item->'line','status','rejected','error',left(SQLERRM,300)));
  end;
 end loop;
 return jsonb_build_object('created',created,'updated',updated,'rejected',rejected,'rows',output);
end;$$;
revoke all on function public.jobkix_supply_r3_apply_sources(jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.jobkix_supply_r3_apply_sources(jsonb,text,boolean) to service_role;

commit;
