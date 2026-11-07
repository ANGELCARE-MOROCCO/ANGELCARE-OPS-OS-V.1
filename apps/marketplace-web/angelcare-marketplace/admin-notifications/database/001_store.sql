-- AC-NOTIFY-PROMAX-R1 / 1. Isolated storage, no native business row rewrites.
begin;
do $$begin
 if to_regclass('public.ac_nc_sources')is not null and to_regclass('public.ac_nc_version')is null then raise exception 'UNRELATED_NOTIFICATION_SCHEMA';end if;
end $$;
create table if not exists public.ac_nc_version(revision text primary key,installed_at timestamptz not null default now());
insert into public.ac_nc_version values('AC-NOTIFY-PROMAX-R1',now()) on conflict do nothing;
create table if not exists public.ac_nc_sources(
 id text primary key,config jsonb not null,enabled boolean not null default true,
 state text not null default 'blocked' check(state in('connected','degraded','blocked','disabled')),
 reason text not null default 'NOT_INSTALLED',installed_at timestamptz,last_capture_at timestamptz,
 checked_at timestamptz not null default now(),observed_columns jsonb not null default '[]');
create table if not exists public.ac_nc_events(
 id bigint generated always as identity primary key,event_key text not null unique,
 source_id text not null references public.ac_nc_sources(id),object_key jsonb not null,
 thread_key text not null,safe jsonb not null,scope jsonb not null,world text not null,
 severity text not null check(severity in('info','positive','attention','critical')),
 actionable boolean not null,occurred_at timestamptz not null default now(),
 projected_at timestamptz,attempts int not null default 0,next_attempt_at timestamptz not null default now(),error_code text);
create index if not exists ac_nc_pending on public.ac_nc_events(next_attempt_at,id) where projected_at is null;
create table if not exists public.ac_nc_threads(
 id uuid primary key default gen_random_uuid(),source_id text not null references public.ac_nc_sources(id),
 thread_key text not null,object_key jsonb not null,safe jsonb not null,scope jsonb not null,world text not null,
 severity text not null,actionable boolean not null,version bigint not null default 1,
 event_count bigint not null default 1,last_event bigint not null,last_at timestamptz not null,
 unique(source_id,thread_key));
create index if not exists ac_nc_threads_page on public.ac_nc_threads(last_at desc,id desc);
create index if not exists ac_nc_threads_sources on public.ac_nc_threads(source_id,world,severity);
create table if not exists public.ac_nc_recipients(
 actor_id text not null,thread_id uuid not null references public.ac_nc_threads(id) on delete cascade,
 delivered_at timestamptz not null default now(),read_version bigint not null default 0,
 archive_version bigint not null default 0,snoozed_until timestamptz,pinned boolean not null default false,
 primary key(actor_id,thread_id));
create table if not exists public.ac_nc_preferences(
 actor_id text primary key,locale text not null default 'fr',muted_sources jsonb not null default '[]',
 quiet_start int,quiet_end int,updated_at timestamptz not null default now());
create table if not exists public.ac_nc_receipts(
 actor_id text not null,request_id uuid not null,command jsonb not null,result jsonb not null,
 created_at timestamptz not null default now(),primary key(actor_id,request_id));
create table if not exists public.ac_nc_read_batches(
 id uuid primary key default gen_random_uuid(),actor_id text not null,filter jsonb not null,
 versions jsonb not null,affected int not null,expires_at timestamptz not null default now()+interval '10 minutes',applied_at timestamptz);
create table if not exists public.ac_nc_worker_state(
 singleton boolean primary key default true check(singleton),last_started_at timestamptz,last_success_at timestamptz,
 processed bigint not null default 0,monitor_cursor text,backfill_cursor jsonb not null default '{}',last_error_code text);
insert into public.ac_nc_worker_state(singleton) values(true) on conflict do nothing;
create table if not exists public.ac_nc_policy_changes(
 id bigint generated always as identity primary key,actor_id text not null,request_id uuid not null,
 source_id text not null,action text not null,reason text not null,before_rule jsonb,after_rule jsonb,
 created_at timestamptz not null default now());
create table if not exists public.ac_nc_condition_state(
 source_id text not null,object_token text not null,kind text not null,fingerprint text not null,
 seen_at timestamptz not null default now(),primary key(source_id,object_token,kind));
-- No browser/custom-session identity is mapped to auth.uid(). API owns native actor authorization.
do $$declare t text;begin foreach t in array array['ac_nc_version','ac_nc_sources','ac_nc_events','ac_nc_threads','ac_nc_recipients','ac_nc_preferences','ac_nc_receipts','ac_nc_read_batches','ac_nc_worker_state','ac_nc_condition_state','ac_nc_policy_changes']loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;end $$;
commit;
