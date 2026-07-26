-- ANGELCARE SANILA MARKET OS — Marketing Operations Autopilot Phase 3
-- Canonical compilation, governed queue, internal tool execution, sync and recovery control plane.
begin;

create extension if not exists pgcrypto;

create table if not exists public.market_ai_compilations (
  id uuid primary key default gen_random_uuid(),
  compilation_key text not null unique,
  mission_id uuid not null references public.market_ai_mandates(id) on delete cascade,
  strategy_run_id uuid references public.market_ai_runs(id) on delete set null,
  title text not null,
  objective text not null,
  status text not null default 'awaiting_decision' check (status in ('draft','awaiting_decision','approved','executing','partially_executed','completed','blocked','failed','cancelled')),
  authority_mode text not null check (authority_mode in ('observe','advise','prepare','orchestrate_internal')),
  risk_level text not null default 'high' check (risk_level in ('low','medium','high','critical')),
  context_snapshot jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_by text not null,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.market_ai_compilation_items (
  id uuid primary key default gen_random_uuid(),
  compilation_id uuid not null references public.market_ai_compilations(id) on delete cascade,
  sequence integer not null,
  item_type text not null check (item_type in ('campaign','brief','content','task','asset_requirement','review','schedule','publishing_package','learning')),
  title text not null,
  description text not null,
  tool_name text not null,
  target_workspace text not null,
  payload jsonb not null default '{}'::jsonb,
  dependencies text[] not null default '{}',
  requires_approval boolean not null default true,
  status text not null default 'proposed' check (status in ('proposed','approved','queued','executing','materialized','linked','skipped','blocked','failed','rolled_back')),
  canonical_record_id text,
  canonical_table text,
  mirror_state text,
  error text,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(compilation_id,sequence)
);

create table if not exists public.market_ai_decisions (
  id uuid primary key default gen_random_uuid(),
  compilation_id uuid references public.market_ai_compilations(id) on delete set null,
  job_id uuid,
  mission_id uuid references public.market_ai_mandates(id) on delete set null,
  decision_type text not null check (decision_type in ('approve','approve_with_conditions','request_revision','restrict_scope','require_evidence','pause','reject','escalate','cancel')),
  reason text not null,
  conditions text[] not null default '{}',
  status text not null default 'effective' check (status in ('pending','effective','superseded','expired')),
  decided_by text not null,
  decided_by_name text not null,
  decided_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.market_ai_execution_jobs (
  id uuid primary key default gen_random_uuid(),
  compilation_id uuid references public.market_ai_compilations(id) on delete cascade,
  compilation_item_id uuid references public.market_ai_compilation_items(id) on delete cascade,
  mission_id uuid references public.market_ai_mandates(id) on delete set null,
  command_code text,
  job_type text not null,
  tool_name text,
  status text not null default 'queued' check (status in ('queued','claimed','running','awaiting_approval','retry_scheduled','completed','cancelled','dead_letter','blocked')),
  priority integer not null default 50,
  idempotency_key text not null unique,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 12),
  worker_id text,
  scheduled_at timestamptz not null default timezone('utc',now()),
  claimed_at timestamptz,
  heartbeat_at timestamptz,
  completed_at timestamptz,
  next_retry_at timestamptz,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  created_by text,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

alter table public.market_ai_decisions drop constraint if exists market_ai_decisions_job_id_fkey;
alter table public.market_ai_decisions add constraint market_ai_decisions_job_id_fkey foreign key(job_id) references public.market_ai_execution_jobs(id) on delete set null;

create table if not exists public.market_ai_execution_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.market_ai_execution_jobs(id) on delete cascade,
  step_key text not null,
  sequence integer not null,
  status text not null default 'pending' check (status in ('pending','running','completed','skipped','blocked','failed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  unique(job_id,step_key)
);

create table if not exists public.market_ai_tool_registry (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null unique,
  description text not null,
  authority_mode text not null check(authority_mode in ('observe','advise','prepare','orchestrate_internal')),
  requires_approval boolean not null default true,
  external_action boolean not null default false,
  enabled boolean not null default true,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.market_ai_tool_executions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.market_ai_execution_jobs(id) on delete set null,
  compilation_item_id uuid references public.market_ai_compilation_items(id) on delete set null,
  tool_name text not null,
  actor_id text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'running' check(status in ('running','completed','failed','blocked')),
  error text,
  idempotency_key text not null unique,
  started_at timestamptz not null default timezone('utc',now()),
  completed_at timestamptz
);

create table if not exists public.market_ai_sync_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  strategy text not null check(strategy in ('link','promote','reconcile','refresh')),
  status text not null default 'active' check(status in ('active','superseded','broken','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(source_type,source_id,target_type,target_id)
);

create table if not exists public.market_ai_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text,
  conflict_type text not null,
  source_snapshot jsonb not null default '{}'::jsonb,
  target_snapshot jsonb not null default '{}'::jsonb,
  proposed_resolution jsonb not null default '{}'::jsonb,
  status text not null default 'open' check(status in ('open','resolved','ignored','expired')),
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.market_ai_dead_letters (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.market_ai_execution_jobs(id) on delete cascade,
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'open' check(status in ('open','replayed','resolved','discarded')),
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.market_ai_bridge_versions (
  id uuid primary key default gen_random_uuid(),
  bridge_object_id uuid not null references public.market_ai_bridge_objects(id) on delete cascade,
  version_number integer not null,
  bridge_file_id text not null,
  storage_key text not null,
  sha256_hash text not null,
  size_bytes bigint not null default 0,
  change_summary text,
  status text not null default 'active' check(status in ('active','superseded','archived','failed')),
  created_by text,
  created_at timestamptz not null default timezone('utc',now()),
  unique(bridge_object_id,version_number)
);

create table if not exists public.market_ai_learning_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_key text not null unique,
  title text not null,
  category text not null,
  evidence_count integer not null default 0,
  positive_count integer not null default 0,
  negative_count integer not null default 0,
  confidence numeric(5,4) not null default 0 check(confidence between 0 and 1),
  recommendation text not null,
  status text not null default 'proposed' check(status in ('proposed','approved','rejected','applied','retired')),
  evidence jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc',now()),
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.market_ai_system_locks (
  lock_key text primary key,
  owner_id text not null,
  acquired_at timestamptz not null default timezone('utc',now()),
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create or replace function public.market_ai_phase3_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=timezone('utc',now()); return new; end $$;


drop trigger if exists trg_market_ai_compilations_updated_at on public.market_ai_compilations;
create trigger trg_market_ai_compilations_updated_at before update on public.market_ai_compilations for each row execute function public.market_ai_phase3_set_updated_at();
drop trigger if exists trg_market_ai_compilation_items_updated_at on public.market_ai_compilation_items;
create trigger trg_market_ai_compilation_items_updated_at before update on public.market_ai_compilation_items for each row execute function public.market_ai_phase3_set_updated_at();
drop trigger if exists trg_market_ai_execution_jobs_updated_at on public.market_ai_execution_jobs;
create trigger trg_market_ai_execution_jobs_updated_at before update on public.market_ai_execution_jobs for each row execute function public.market_ai_phase3_set_updated_at();
drop trigger if exists trg_market_ai_tool_registry_updated_at on public.market_ai_tool_registry;
create trigger trg_market_ai_tool_registry_updated_at before update on public.market_ai_tool_registry for each row execute function public.market_ai_phase3_set_updated_at();
drop trigger if exists trg_market_ai_sync_links_updated_at on public.market_ai_sync_links;
create trigger trg_market_ai_sync_links_updated_at before update on public.market_ai_sync_links for each row execute function public.market_ai_phase3_set_updated_at();
drop trigger if exists trg_market_ai_learning_patterns_updated_at on public.market_ai_learning_patterns;
create trigger trg_market_ai_learning_patterns_updated_at before update on public.market_ai_learning_patterns for each row execute function public.market_ai_phase3_set_updated_at();

create or replace function public.market_ai_claim_due_jobs(p_limit integer, p_worker_id text)
returns setof public.market_ai_execution_jobs
language plpgsql security definer set search_path=public as $$
declare v_job public.market_ai_execution_jobs%rowtype;
begin
  for v_job in
    select * from public.market_ai_execution_jobs
    where status in ('queued','retry_scheduled')
      and scheduled_at <= timezone('utc',now())
      and (next_retry_at is null or next_retry_at <= timezone('utc',now()))
    order by priority desc, scheduled_at asc
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,1),30))
  loop
    update public.market_ai_execution_jobs set status='claimed',worker_id=p_worker_id,claimed_at=timezone('utc',now()),heartbeat_at=timezone('utc',now()),updated_at=timezone('utc',now()) where id=v_job.id returning * into v_job;
    return next v_job;
  end loop;
end $$;

create index if not exists idx_market_ai_compilations_status on public.market_ai_compilations(status,created_at desc);
create index if not exists idx_market_ai_compilation_items_status on public.market_ai_compilation_items(compilation_id,status,sequence);
create index if not exists idx_market_ai_jobs_due on public.market_ai_execution_jobs(status,scheduled_at,next_retry_at,priority desc);
create index if not exists idx_market_ai_jobs_compilation on public.market_ai_execution_jobs(compilation_id,compilation_item_id);
create index if not exists idx_market_ai_decisions_compilation on public.market_ai_decisions(compilation_id,decided_at desc);
create index if not exists idx_market_ai_sync_links_source on public.market_ai_sync_links(source_type,source_id);
create index if not exists idx_market_ai_conflicts_status on public.market_ai_sync_conflicts(status,created_at desc);

insert into public.market_ai_tool_registry(tool_name,description,authority_mode,requires_approval,external_action,enabled)
values
('campaign.prepare','Préparer un plan campagne interne.','prepare',true,false,true),
('brief.create','Créer un brief stratégique interne.','orchestrate_internal',true,false,true),
('brief.update','Mettre à jour un brief interne.','orchestrate_internal',true,false,true),
('content.create_draft','Créer un brouillon de contenu interne.','orchestrate_internal',true,false,true),
('content.update_draft','Mettre à jour un brouillon de contenu interne.','orchestrate_internal',true,false,true),
('task.create','Créer une tâche interne gouvernée.','orchestrate_internal',true,false,true),
('task.assign','Préparer une affectation interne.','orchestrate_internal',true,false,true),
('task.link_dependency','Lier une dépendance de production.','orchestrate_internal',true,false,true),
('asset.requirement_create','Créer une exigence asset.','orchestrate_internal',true,false,true),
('asset.classify','Classifier un asset interne.','orchestrate_internal',false,false,true),
('asset.link','Lier un asset à un contenu.','orchestrate_internal',true,false,true),
('review.request','Créer une demande de révision.','orchestrate_internal',true,false,true),
('approval_package.prepare','Préparer un paquet d’approbation.','prepare',true,false,true),
('schedule.propose','Créer une proposition calendrier.','prepare',true,false,true),
('publishing_package.prepare','Préparer un paquet pour opérateur humain.','prepare',true,false,true),
('bridge.store','Préparer le stockage Bridge.','orchestrate_internal',true,false,true),
('bridge.version','Créer une version Bridge.','orchestrate_internal',true,false,true),
('bridge.archive','Préparer un archivage Bridge.','orchestrate_internal',true,false,true),
('learning.record','Enregistrer un apprentissage vérifié.','orchestrate_internal',false,false,true)
on conflict(tool_name) do update set description=excluded.description,authority_mode=excluded.authority_mode,requires_approval=excluded.requires_approval,external_action=false,enabled=true,updated_at=timezone('utc',now());

insert into public.market_ai_doctrine_entries(code,title,category,authority_state,content,version,source,effective_at)
values
('DOCTRINE-PHASE3-IDEMPOTENCY','Idempotence obligatoire','Gouvernance','canonical','Toute matérialisation interne doit posséder une clé idempotente, ne jamais dupliquer une écriture terminée et être récupérable après échec.','3.0.0','Phase 3 signed contract',timezone('utc',now())),
('DOCTRINE-PHASE3-CANONICAL','Vérité canonique et synchronisation','Gouvernance','canonical','Les enregistrements navigateur, IA, Content Command et Market OS sont distingués. Aucun écrasement silencieux; les conflits sont visibles, auditables et résolus sous autorité humaine.','3.0.0','Phase 3 signed contract',timezone('utc',now())),
('DOCTRINE-PHASE3-HUMAN-GATE','Autorité humaine de matérialisation','Gouvernance','canonical','Toute stratégie sensible, compilation à risque élevé, publication préparée ou action nécessitant approbation demeure bloquée jusqu’à décision humaine explicite.','3.0.0','Phase 3 signed contract',timezone('utc',now()))
on conflict(code) do update set title=excluded.title,category=excluded.category,authority_state=excluded.authority_state,content=excluded.content,version=excluded.version,source=excluded.source,effective_at=excluded.effective_at,updated_at=timezone('utc',now());

alter table public.market_ai_compilations enable row level security;
alter table public.market_ai_compilation_items enable row level security;
alter table public.market_ai_decisions enable row level security;
alter table public.market_ai_execution_jobs enable row level security;
alter table public.market_ai_execution_steps enable row level security;
alter table public.market_ai_tool_registry enable row level security;
alter table public.market_ai_tool_executions enable row level security;
alter table public.market_ai_sync_links enable row level security;
alter table public.market_ai_sync_conflicts enable row level security;
alter table public.market_ai_dead_letters enable row level security;
alter table public.market_ai_bridge_versions enable row level security;
alter table public.market_ai_learning_patterns enable row level security;
alter table public.market_ai_system_locks enable row level security;

revoke all on function public.market_ai_claim_due_jobs(integer,text) from public,anon,authenticated;
grant execute on function public.market_ai_claim_due_jobs(integer,text) to service_role;

revoke all on public.market_ai_compilations,public.market_ai_compilation_items,public.market_ai_decisions,public.market_ai_execution_jobs,public.market_ai_execution_steps,public.market_ai_tool_registry,public.market_ai_tool_executions,public.market_ai_sync_links,public.market_ai_sync_conflicts,public.market_ai_dead_letters,public.market_ai_bridge_versions,public.market_ai_learning_patterns,public.market_ai_system_locks from anon,authenticated;
grant select,insert,update,delete on public.market_ai_compilations,public.market_ai_compilation_items,public.market_ai_decisions,public.market_ai_execution_jobs,public.market_ai_execution_steps,public.market_ai_tool_registry,public.market_ai_tool_executions,public.market_ai_sync_links,public.market_ai_sync_conflicts,public.market_ai_dead_letters,public.market_ai_bridge_versions,public.market_ai_learning_patterns,public.market_ai_system_locks to service_role;

do $phase3_integrity$
declare tool_count integer; external_count integer;
begin
  select count(*) into tool_count from public.market_ai_tool_registry where enabled=true;
  select count(*) into external_count from public.market_ai_tool_registry where external_action=true or tool_name in ('email.send','whatsapp.send','social.publish','ads.activate','external_form.submit','external_contact.create','public_statement.issue');
  if tool_count <> 19 then raise exception 'Phase 3 tool registry integrity failed: expected 19, got %', tool_count; end if;
  if external_count <> 0 then raise exception 'Phase 3 external action integrity failed: % prohibited tools enabled', external_count; end if;
end $phase3_integrity$;

commit;
