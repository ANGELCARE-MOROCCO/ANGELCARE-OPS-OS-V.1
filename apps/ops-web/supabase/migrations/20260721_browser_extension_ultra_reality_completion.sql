begin;

create extension if not exists pgcrypto;

create or replace function public.browser_extension_ultra_normalize(value text)
returns text language sql immutable parallel safe as $$
  select trim(regexp_replace(lower(translate(coalesce(value,''),'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝŸýÿ','AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYYyy')), '[^a-z0-9]+', ' ', 'g'))
$$;

create table if not exists public.browser_extension_ultra_bridge_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('dry_run','backfill','rollback_check')),
  status text not null default 'running' check (status in ('running','completed','completed_with_conflicts','failed','rolled_back')),
  started_by uuid references public.app_users(id) on delete set null,
  source_snapshot jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  conflict_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_ultra_commercial_id_map (
  id uuid primary key default gen_random_uuid(),
  bridge_run_id uuid references public.browser_extension_ultra_bridge_runs(id) on delete set null,
  source_system text not null,
  source_table text not null,
  source_id uuid not null,
  entity_type text not null check (entity_type in ('account','prospect','opportunity','partner','parent','branch','site','contract','billing_account','renewal','tender','handoff','operations')),
  target_prospect_id uuid,
  target_opportunity_id uuid,
  target_partner_id uuid,
  target_entity_id uuid,
  match_method text not null,
  match_confidence numeric(5,4) not null default 1,
  match_signals jsonb not null default '[]'::jsonb,
  owner_id uuid,
  territory text,
  historical_ids jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','review','superseded','rolled_back')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_system, source_table, source_id, entity_type)
);
create index if not exists browser_ext_ultra_map_target_prospect_idx on public.browser_extension_ultra_commercial_id_map(target_prospect_id) where status='active';
create index if not exists browser_ext_ultra_map_target_opp_idx on public.browser_extension_ultra_commercial_id_map(target_opportunity_id) where status='active';
create index if not exists browser_ext_ultra_map_target_partner_idx on public.browser_extension_ultra_commercial_id_map(target_partner_id) where status='active';

create table if not exists public.browser_extension_ultra_bridge_conflicts (
  id uuid primary key default gen_random_uuid(),
  bridge_run_id uuid references public.browser_extension_ultra_bridge_runs(id) on delete cascade,
  conflict_key text not null,
  conflict_type text not null,
  severity text not null default 'high' check (severity in ('critical','high','medium','low')),
  source_records jsonb not null default '[]'::jsonb,
  candidate_targets jsonb not null default '[]'::jsonb,
  matching_signals jsonb not null default '[]'::jsonb,
  recommended_resolution text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolved_by uuid references public.app_users(id) on delete set null,
  resolution jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bridge_run_id, conflict_key)
);
create index if not exists browser_ext_ultra_conflict_open_idx on public.browser_extension_ultra_bridge_conflicts(status,severity,created_at desc);

create table if not exists public.browser_extension_ultra_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  device_id uuid not null references public.browser_extension_devices(id) on delete cascade,
  active_account_id uuid,
  active_opportunity_id uuid,
  active_contact_id uuid,
  active_partner_id uuid,
  active_contract_id uuid,
  active_site_id uuid,
  active_meeting_id uuid,
  active_proposal_id uuid,
  active_issue_id uuid,
  active_renewal_id uuid,
  active_scan_session_id uuid,
  source_url text,
  source_adapter text,
  context_version integer not null default 1,
  last_transition text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, device_id)
);
create index if not exists browser_ext_ultra_context_account_idx on public.browser_extension_ultra_contexts(active_account_id,updated_at desc);

create table if not exists public.browser_extension_ultra_data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null unique,
  prospect_id uuid,
  opportunity_id uuid,
  partner_id uuid,
  category text not null,
  severity text not null check (severity in ('critical','high','medium','low')),
  title text not null,
  details jsonb not null default '{}'::jsonb,
  suggested_correction text,
  owner_id uuid references public.app_users(id) on delete set null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','in_progress','resolved','accepted_exception','dismissed')),
  resolution_notes text,
  resolved_by uuid references public.app_users(id) on delete set null,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_ultra_quality_queue_idx on public.browser_extension_ultra_data_quality_issues(status,severity,due_at);
create index if not exists browser_ext_ultra_quality_account_idx on public.browser_extension_ultra_data_quality_issues(prospect_id,status);

create table if not exists public.browser_extension_ultra_data_quality_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.browser_extension_ultra_data_quality_issues(id) on delete cascade,
  actor_id uuid references public.app_users(id) on delete set null,
  from_status text,
  to_status text not null,
  notes text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_ultra_ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  device_id uuid references public.browser_extension_devices(id) on delete set null,
  prospect_id uuid,
  opportunity_id uuid,
  objective text not null,
  mode text not null check (mode in ('governed_ai','rules_fallback')),
  provider text,
  model text,
  configured boolean not null default false,
  used boolean not null default false,
  warning text,
  evidence_ids jsonb not null default '[]'::jsonb,
  request_snapshot jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_ultra_ai_account_idx on public.browser_extension_ultra_ai_runs(prospect_id,created_at desc);

create table if not exists public.browser_extension_ultra_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  user_id uuid references public.app_users(id) on delete set null,
  scope_type text not null,
  scope_reference text,
  version integer not null default 1,
  report_payload jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  missing_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_ultra_reports_idx on public.browser_extension_ultra_reports(report_type,created_at desc);

create table if not exists public.browser_extension_ultra_schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_key text not null unique,
  job_type text not null check (job_type in ('data_quality_scan','report_generate','stale_detection','renewal_milestone')),
  cron_expression text,
  interval_seconds integer,
  payload jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  requires_approval boolean not null default false,
  rate_limit_per_hour integer not null default 4,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cron_expression is not null or interval_seconds is not null)
);

create table if not exists public.browser_extension_ultra_jobs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.browser_extension_ultra_schedules(id) on delete set null,
  idempotency_key text not null unique,
  job_type text not null check (job_type in ('data_quality_scan','report_generate','stale_detection','renewal_milestone')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','paused','cancelled')),
  priority integer not null default 100,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  run_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  completed_at timestamptz,
  last_error text,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_ultra_jobs_claim_idx on public.browser_extension_ultra_jobs(status,run_at,priority) where status='queued';

create table if not exists public.browser_extension_ultra_scheduler_control (
  singleton boolean primary key default true check (singleton=true),
  paused boolean not null default false,
  kill_switch boolean not null default false,
  reason text,
  updated_by uuid references public.app_users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.browser_extension_ultra_scheduler_control(singleton) values (true) on conflict (singleton) do nothing;

create table if not exists public.browser_extension_ultra_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.browser_extension_ultra_jobs(id) on delete cascade,
  worker_id text not null,
  status text not null,
  result_payload jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists browser_ext_ultra_job_runs_idx on public.browser_extension_ultra_job_runs(job_id,started_at desc);

create or replace function public.browser_extension_ultra_claim_jobs(p_worker_id text, p_limit integer default 25)
returns setof public.browser_extension_ultra_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.browser_extension_ultra_scheduler_control where singleton=true and (paused=true or kill_switch=true)) then
    return;
  end if;
  return query
  with candidates as (
    select id from public.browser_extension_ultra_jobs
    where status='queued' and run_at <= now()
    order by priority asc, run_at asc
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,25),100))
  ), claimed as (
    update public.browser_extension_ultra_jobs j
    set status='running', locked_at=now(), locked_by=p_worker_id, updated_at=now()
    from candidates c where j.id=c.id
    returning j.*
  ) select * from claimed;
end $$;
revoke all on function public.browser_extension_ultra_claim_jobs(text,integer) from public;

create or replace function public.browser_extension_ultra_bridge_dry_run(p_actor_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'generatedAt', now(),
    'actorId', p_actor_id,
    'sourceCounts', jsonb_build_object(
      'b2b_prospects', case when to_regclass('public.b2b_prospects') is null then null else (select count(*) from public.b2b_prospects where archived_at is null) end,
      'revenue_accounts', case when to_regclass('public.revenue_accounts') is null then null else (select count(*) from public.revenue_accounts) end,
      'revenue_prospects', case when to_regclass('public.revenue_prospects') is null then null else (select count(*) from public.revenue_prospects) end,
      'revenue_opportunities', case when to_regclass('public.revenue_opportunities') is null then null else (select count(*) from public.revenue_opportunities) end,
      'revenue_partnerships', case when to_regclass('public.revenue_partnerships') is null then null else (select count(*) from public.revenue_partnerships) end
    ),
    'exactAccountMatches', case when to_regclass('public.revenue_accounts') is null or to_regclass('public.b2b_prospects') is null then 0 else (
      select count(*) from public.revenue_accounts ra join public.b2b_prospects bp
      on (nullif(public.browser_extension_ultra_normalize(ra.website),'') is not null and public.browser_extension_ultra_normalize(ra.website)=public.browser_extension_ultra_normalize(bp.website))
      or (public.browser_extension_ultra_normalize(ra.account_name)=public.browser_extension_ultra_normalize(bp.name) and public.browser_extension_ultra_normalize(ra.city)=public.browser_extension_ultra_normalize(bp.city))
    ) end,
    'unmappedRevenueAccounts', case when to_regclass('public.revenue_accounts') is null then 0 else (
      select count(*) from public.revenue_accounts ra where not exists (
        select 1 from public.browser_extension_ultra_commercial_id_map m where m.source_table='revenue_accounts' and m.source_id=ra.id and m.status='active'
      )
    ) end,
    'openConflicts', (select count(*) from public.browser_extension_ultra_bridge_conflicts where status in ('open','reviewing'))
  ) into result;
  return result;
end $$;
revoke all on function public.browser_extension_ultra_bridge_dry_run(uuid) from public;

create or replace function public.browser_extension_ultra_enqueue_due_schedules()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare inserted_count integer;
begin
  if exists (select 1 from public.browser_extension_ultra_scheduler_control where singleton=true and (paused=true or kill_switch=true)) then
    return 0;
  end if;
  insert into public.browser_extension_ultra_jobs(schedule_id,idempotency_key,job_type,payload,run_at)
  select s.id, s.schedule_key || ':' || to_char(date_trunc('hour',coalesce(s.next_run_at,now())),'YYYYMMDDHH24MI'), s.job_type, s.payload, coalesce(s.next_run_at,now())
  from public.browser_extension_ultra_schedules s
  where s.enabled=true
    and (s.next_run_at is null or s.next_run_at<=now())
    and (not s.requires_approval or s.approved_at is not null)
    and (
      select count(*) from public.browser_extension_ultra_jobs j
      where j.schedule_id=s.id and j.created_at >= now()-interval '1 hour'
    ) < greatest(1,s.rate_limit_per_hour)
  on conflict (idempotency_key) do nothing;
  get diagnostics inserted_count = row_count;
  update public.browser_extension_ultra_schedules
  set last_run_at=now(), next_run_at=case when interval_seconds is not null then now()+make_interval(secs=>interval_seconds) else now()+interval '1 day' end, updated_at=now()
  where enabled=true and (next_run_at is null or next_run_at<=now()) and (not requires_approval or approved_at is not null);
  return inserted_count;
end $$;
revoke all on function public.browser_extension_ultra_enqueue_due_schedules() from public;

insert into public.browser_extension_ultra_schedules(schedule_key,job_type,interval_seconds,payload,enabled,requires_approval,rate_limit_per_hour)
values
 ('ultra:data-quality-daily','data_quality_scan',86400,'{}'::jsonb,false,false,2),
 ('ultra:daily-revenue-brief','report_generate',86400,'{"reportType":"daily_revenue_brief"}'::jsonb,false,false,2),
 ('ultra:stale-detection','stale_detection',21600,'{}'::jsonb,false,false,4),
 ('ultra:renewal-milestones','renewal_milestone',86400,'{}'::jsonb,false,false,2)
on conflict (schedule_key) do nothing;

alter table public.browser_extension_ultra_bridge_runs enable row level security;
alter table public.browser_extension_ultra_commercial_id_map enable row level security;
alter table public.browser_extension_ultra_bridge_conflicts enable row level security;
alter table public.browser_extension_ultra_contexts enable row level security;
alter table public.browser_extension_ultra_data_quality_issues enable row level security;
alter table public.browser_extension_ultra_data_quality_history enable row level security;
alter table public.browser_extension_ultra_ai_runs enable row level security;
alter table public.browser_extension_ultra_reports enable row level security;
alter table public.browser_extension_ultra_schedules enable row level security;
alter table public.browser_extension_ultra_jobs enable row level security;
alter table public.browser_extension_ultra_job_runs enable row level security;
alter table public.browser_extension_ultra_scheduler_control enable row level security;

revoke all on public.browser_extension_ultra_bridge_runs from anon, authenticated;
revoke all on public.browser_extension_ultra_commercial_id_map from anon, authenticated;
revoke all on public.browser_extension_ultra_bridge_conflicts from anon, authenticated;
revoke all on public.browser_extension_ultra_contexts from anon, authenticated;
revoke all on public.browser_extension_ultra_data_quality_issues from anon, authenticated;
revoke all on public.browser_extension_ultra_data_quality_history from anon, authenticated;
revoke all on public.browser_extension_ultra_ai_runs from anon, authenticated;
revoke all on public.browser_extension_ultra_reports from anon, authenticated;
revoke all on public.browser_extension_ultra_schedules from anon, authenticated;
revoke all on public.browser_extension_ultra_jobs from anon, authenticated;
revoke all on public.browser_extension_ultra_job_runs from anon, authenticated;
revoke all on public.browser_extension_ultra_scheduler_control from anon, authenticated;

comment on table public.browser_extension_ultra_commercial_id_map is 'Mapping-only bridge across existing ANGELCARE commercial domains; not a replacement CRM.';
comment on table public.browser_extension_ultra_contexts is 'Persistent server authority for Browser OS active commercial context.';
comment on table public.browser_extension_ultra_ai_runs is 'Evidence-bound governed AI/rules execution ledger. AI output is never verified fact automatically.';
comment on table public.browser_extension_ultra_jobs is 'Low-risk internal scheduler queue. High-risk external/business commitments are forbidden job types.';
comment on table public.browser_extension_ultra_scheduler_control is 'Global pause and kill switch for the Ultra scheduler; clear-kill requires an explicitly authorized command.';

commit;
