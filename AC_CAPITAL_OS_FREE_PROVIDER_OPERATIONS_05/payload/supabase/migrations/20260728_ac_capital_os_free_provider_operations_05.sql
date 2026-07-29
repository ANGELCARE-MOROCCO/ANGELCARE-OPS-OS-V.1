begin;

-- AC CAPITAL OS Free Provider Operations Control Plane 05
-- Tavily = public web evidence retrieval
-- OpenRouter = free external evidence analysis
-- Gemini is disabled for AC CAPITAL OS by this migration.

do $$
begin
  if to_regclass('public.ai_provider_dossiers') is null
     or to_regclass('public.ai_provider_credentials') is null
     or to_regclass('public.ac_capital_radar_sources') is null
     or to_regclass('public.ac_capital_radar_opportunities') is null then
    raise exception 'AC_CAPITAL_FREE_PROVIDER_PREREQUISITES_MISSING';
  end if;
end $$;

create table if not exists public.ac_capital_ai_runtime_state (
  id uuid primary key default gen_random_uuid(),
  state_key text not null unique default 'primary',
  active_profile_key text not null default 'normal-operations',
  scheduler_enabled boolean not null default false,
  scheduler_poll_minutes integer not null default 15 check (scheduler_poll_minutes between 1 and 1440),
  internal_automation_enabled boolean not null default true,
  external_actions_locked boolean not null default true,
  global_pause boolean not null default false,
  max_parallel_runs integer not null default 1 check (max_parallel_runs between 1 and 20),
  timezone text not null default 'Africa/Casablanca',
  metadata jsonb not null default '{}'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_provider_configs (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique check (provider_key in ('tavily','openrouter')),
  display_name text not null,
  provider_role text not null check (provider_role in ('search','analysis')),
  enabled boolean not null default false,
  paused boolean not null default false,
  dossier_id uuid references public.ai_provider_dossiers(id) on delete set null,
  capacity_pool_id uuid references public.ai_provider_capacity_pools(id) on delete set null,
  credential_id uuid references public.ai_provider_credentials(id) on delete set null,
  endpoint text not null,
  model_code text,
  config jsonb not null default '{}'::jsonb,
  internal_limits jsonb not null default '{}'::jsonb,
  provider_usage jsonb not null default '{}'::jsonb,
  health_status text not null default 'not-configured',
  health_message text,
  last_health_check_at timestamptz,
  last_usage_sync_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_operating_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique,
  label text not null,
  description text,
  active boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_agents (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null unique,
  name text not null,
  description text,
  category text not null default 'external-research',
  status text not null default 'paused' check (status in ('active','paused','disabled')),
  search_provider_key text not null default 'tavily',
  analysis_provider_key text not null default 'openrouter',
  trigger_mode text not null default 'manual' check (trigger_mode in ('manual','scheduled','both')),
  frequency_key text not null default 'daily' check (frequency_key in ('hourly','daily','weekly','monthly','custom')),
  schedule jsonb not null default '{}'::jsonb,
  search_config jsonb not null default '{}'::jsonb,
  analysis_config jsonb not null default '{}'::jsonb,
  quota_config jsonb not null default '{}'::jsonb,
  action_permissions jsonb not null default '{}'::jsonb,
  prompt_doctrine text not null default '',
  failure_policy jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  consecutive_failures integer not null default 0,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.ac_capital_ai_agents(id) on delete set null,
  agent_key text not null,
  trigger_type text not null default 'manual',
  status text not null default 'queued' check (status in ('queued','running','completed','completed-with-warnings','failed','cancelled','blocked')),
  phase text not null default 'queued',
  research_query text,
  search_provider_key text,
  analysis_provider_key text,
  selected_analysis_model text,
  configuration_snapshot jsonb not null default '{}'::jsonb,
  search_request_id text,
  analysis_request_id text,
  search_http_status integer,
  analysis_http_status integer,
  search_latency_ms integer,
  analysis_latency_ms integer,
  tavily_credits numeric not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  sources_returned integer not null default 0,
  sources_persisted integer not null default 0,
  opportunities_created integer not null default 0,
  opportunities_rejected integer not null default 0,
  duplicates_detected integer not null default 0,
  internal_actions jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  provider_evidence jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  cancel_requested boolean not null default false,
  actor_id text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.ac_capital_ai_agent_runs(id) on delete set null,
  provider_key text not null,
  agent_key text not null,
  command_code text,
  request_count integer not null default 1,
  credits_consumed numeric not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  latency_ms integer,
  http_status integer,
  outcome text not null,
  error_code text,
  provider_request_id text,
  selected_model text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_configuration_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_name text,
  action_key text not null,
  entity_type text not null,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_ai_runtime_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null,
  provider_key text,
  agent_key text,
  severity text not null default 'warning',
  status text not null default 'open',
  title text not null,
  description text,
  evidence jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_capital_ai_agent_runs_agent_created_idx on public.ac_capital_ai_agent_runs(agent_key, created_at desc);
create index if not exists ac_capital_ai_agent_runs_status_idx on public.ac_capital_ai_agent_runs(status, created_at desc);
create index if not exists ac_capital_ai_usage_provider_time_idx on public.ac_capital_ai_usage_ledger(provider_key, occurred_at desc);
create index if not exists ac_capital_ai_usage_agent_time_idx on public.ac_capital_ai_usage_ledger(agent_key, occurred_at desc);
create index if not exists ac_capital_ai_agents_status_next_idx on public.ac_capital_ai_agents(status, next_run_at);

alter table public.ac_capital_ai_runtime_state enable row level security;
alter table public.ac_capital_ai_provider_configs enable row level security;
alter table public.ac_capital_ai_operating_profiles enable row level security;
alter table public.ac_capital_ai_agents enable row level security;
alter table public.ac_capital_ai_agent_runs enable row level security;
alter table public.ac_capital_ai_usage_ledger enable row level security;
alter table public.ac_capital_ai_configuration_audit enable row level security;
alter table public.ac_capital_ai_runtime_incidents enable row level security;

insert into public.ac_capital_ai_runtime_state
  (state_key, active_profile_key, scheduler_enabled, scheduler_poll_minutes, internal_automation_enabled, external_actions_locked, global_pause, max_parallel_runs, timezone, metadata)
values
  ('primary','normal-operations',false,15,true,true,false,1,'Africa/Casablanca',jsonb_build_object('source','AC_CAPITAL_FREE_PROVIDER_OPERATIONS_05'))
on conflict (state_key) do update set
  external_actions_locked=true,
  metadata=coalesce(public.ac_capital_ai_runtime_state.metadata,'{}'::jsonb)||excluded.metadata,
  updated_at=now();

insert into public.ac_capital_ai_provider_configs
  (provider_key,display_name,provider_role,enabled,paused,endpoint,model_code,config,internal_limits,health_status)
values
  ('tavily','Tavily Free Search','search',false,false,'https://api.tavily.com/search',null,
   jsonb_build_object('searchDepth','basic','maxResults',8,'topic','general','includeAnswer',false,'includeRawContent',false,'autoParameters',false,'timeoutMs',30000,'maxRetries',1,'country','morocco','includeDomains',jsonb_build_array(),'excludeDomains',jsonb_build_array()),
   jsonb_build_object('maxCreditsPerDay',40,'maxCreditsPerMonth',900,'reserveCredits',100,'maxRequestsPerMinute',4),
   'not-configured'),
  ('openrouter','OpenRouter Free Analysis','analysis',false,false,'https://openrouter.ai/api/v1/chat/completions','openrouter/free',
   jsonb_build_object('temperature',0.1,'maxOutputTokens',4500,'reasoningEffort','low','requireStructuredOutput',true,'timeoutMs',90000,'maxRetries',1,'allowAutomaticFreeRouting',true,'httpReferer','http://localhost:3000','appTitle','AngelCare AC Capital OS'),
   jsonb_build_object('maxRequestsPerDay',40,'maxRequestsPerMonth',1000,'reserveRequests',5,'maxInputTokensPerRun',80000,'maxOutputTokensPerRun',6000),
   'not-configured')
on conflict (provider_key) do update set
  display_name=excluded.display_name,
  provider_role=excluded.provider_role,
  endpoint=excluded.endpoint,
  config=excluded.config||coalesce(public.ac_capital_ai_provider_configs.config,'{}'::jsonb),
  internal_limits=excluded.internal_limits||coalesce(public.ac_capital_ai_provider_configs.internal_limits,'{}'::jsonb),
  updated_at=now();

insert into public.ac_capital_ai_operating_profiles (profile_key,label,description,active,configuration)
values
 ('paused','Paused','All outbound research agents paused.',false,jsonb_build_object('agentStatus','paused','activeAgentKeys',jsonb_build_array(),'frequencyMultiplier',0,'tavilyCreditsPerDay',0,'openrouterRequestsPerDay',0,'maxParallelRuns',1)),
 ('low-frequency','Low Frequency','Conservative daily scanning with strict free-provider preservation.',false,jsonb_build_object('agentStatus','active','activeAgentKeys',jsonb_build_array('funding-opportunity-radar'),'frequencyMultiplier',0.5,'tavilyCreditsPerDay',12,'openrouterRequestsPerDay',10,'maxParallelRuns',1)),
 ('normal-operations','Normal Operations','Balanced daily and weekly intelligence operation.',true,jsonb_build_object('agentStatus','active','activeAgentKeys',jsonb_build_array('funding-opportunity-radar','grant-public-program-scanner','deadline-closure-watch','executive-report-agent'),'frequencyMultiplier',1,'tavilyCreditsPerDay',30,'openrouterRequestsPerDay',30,'maxParallelRuns',1)),
 ('high-intensity','High-Intensity Campaign','Increased research frequency while respecting free provider reserves.',false,jsonb_build_object('agentStatus','active','activeAgentKeys',jsonb_build_array('funding-opportunity-radar','grant-public-program-scanner','investor-vc-scanner','bank-finance-scanner','accelerator-competition-scanner','strategic-partnership-scanner','market-intelligence-scanner','deadline-closure-watch','opportunity-revalidation-agent','executive-report-agent'),'frequencyMultiplier',2,'tavilyCreditsPerDay',45,'openrouterRequestsPerDay',40,'maxParallelRuns',2)),
 ('deadline-emergency','Deadline Emergency','Focused deadline and open-program revalidation.',false,jsonb_build_object('agentStatus','active','activeAgentKeys',jsonb_build_array('funding-opportunity-radar','deadline-closure-watch','opportunity-revalidation-agent'),'frequencyMultiplier',3,'tavilyCreditsPerDay',50,'openrouterRequestsPerDay',45,'maxParallelRuns',2))
on conflict (profile_key) do update set
 label=excluded.label,
 description=excluded.description,
 configuration=coalesce(public.ac_capital_ai_operating_profiles.configuration,'{}'::jsonb)||excluded.configuration,
 updated_at=now();

insert into public.ac_capital_ai_agents
(agent_key,name,description,category,status,trigger_mode,frequency_key,schedule,search_config,analysis_config,quota_config,action_permissions,prompt_doctrine,failure_policy)
values
('funding-opportunity-radar','Funding Opportunity Radar','Discovers active grants, finance, investors, accelerators and strategic capital opportunities.','capital-discovery','active','both','daily',
 jsonb_build_object('days',jsonb_build_array(1,2,3,4,5,6),'hour',8,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',3,'maxResultsPerSearch',8,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA','International'),'recencyDays',45,'minimumSourceScore',0.35,'duplicateWindowDays',60),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',4500,'requireStructuredOutput',true,'minimumRelevanceScore',55,'maximumOpportunitiesPerRun',20),
 jsonb_build_object('maxRunsPerDay',4,'maxRunsPerWeek',20,'maxRunsPerMonth',80,'maxTavilyCreditsPerRun',3,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',true,'rejectWeakCandidates',true,'detectDuplicates',true,'runInitialQualification',false,'createQualificationDossiers',false,'draftCases',false,'updatePipeline',false,'createInternalTasks',false,'generateReports',false,'refreshExistingOpportunities',true,'archiveExpiredOpportunities',false,'escalateCriticalDeadlines',true,'externalActions',false),
 'Find only currently active and verifiable capital opportunities relevant to AngelCare. Prefer authoritative sources. Never invent deadlines, amounts, eligibility or URLs.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',30,'suspendAfterFailures',5)),
('grant-public-program-scanner','Grant & Public Program Scanner','Scans public grants, women-founder programs, innovation schemes and institutional support.','public-funding','paused','both','daily',
 jsonb_build_object('days',jsonb_build_array(1,2,3,4,5),'hour',9,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',8,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA','EU'),'recencyDays',60),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',4000,'requireStructuredOutput',true,'minimumRelevanceScore',60,'maximumOpportunitiesPerRun',15),
 jsonb_build_object('maxRunsPerDay',2,'maxRunsPerWeek',10,'maxRunsPerMonth',40,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',true,'rejectWeakCandidates',true,'detectDuplicates',true,'runInitialQualification',false,'externalActions',false),
 'Prioritize official government, development agency, foundation and program-owner sources. Exclude expired calls.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',60,'suspendAfterFailures',4)),
('investor-vc-scanner','Investor & VC Scanner','Discovers investors, funds and strategic capital actors with relevant thesis.','investor-intelligence','paused','both','weekly',
 jsonb_build_object('days',jsonb_build_array(2,5),'hour',10,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',10,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA','International'),'recencyDays',120),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',4200,'requireStructuredOutput',true,'minimumRelevanceScore',58,'maximumOpportunitiesPerRun',15),
 jsonb_build_object('maxRunsPerDay',1,'maxRunsPerWeek',3,'maxRunsPerMonth',12,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',true,'rejectWeakCandidates',true,'detectDuplicates',true,'externalActions',false),
 'Identify investors with clear sector, geography and stage relevance. Distinguish active investment thesis from generic directory listings.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',120,'suspendAfterFailures',4)),
('bank-finance-scanner','Bank Finance Scanner','Tracks Moroccan bank finance, guarantee and SME support instruments.','bank-finance','paused','both','weekly',
 jsonb_build_object('days',jsonb_build_array(1,4),'hour',11,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',8,'searchDepth','basic','countries',jsonb_build_array('Morocco'),'recencyDays',90),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',3800,'requireStructuredOutput',true,'minimumRelevanceScore',60,'maximumOpportunitiesPerRun',12),
 jsonb_build_object('maxRunsPerDay',1,'maxRunsPerWeek',3,'maxRunsPerMonth',12,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',true,'rejectWeakCandidates',true,'detectDuplicates',true,'externalActions',false),
 'Prefer bank, Tamwilcom, public guarantee and official finance-program sources. Capture conditions as previews requiring human confirmation.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',120,'suspendAfterFailures',4)),
('accelerator-competition-scanner','Accelerator & Competition Scanner','Finds accelerators, competitions, awards and founder programs.','accelerators','paused','both','weekly',
 jsonb_build_object('days',jsonb_build_array(3,6),'hour',9,'minute',30,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',8,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA','International'),'recencyDays',60),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',3800,'requireStructuredOutput',true,'minimumRelevanceScore',55,'maximumOpportunitiesPerRun',12),
 jsonb_build_object('maxRunsPerDay',1,'maxRunsPerWeek',3,'maxRunsPerMonth',12,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',true,'rejectWeakCandidates',true,'detectDuplicates',true,'externalActions',false),
 'Capture application windows, awards, acceleration benefits and official program pages only.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',120,'suspendAfterFailures',4)),
('strategic-partnership-scanner','Strategic Partnership Scanner','Finds partnership channels, institutional alliances and distribution opportunities.','partnerships','paused','both','weekly',
 jsonb_build_object('days',jsonb_build_array(2,5),'hour',14,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',8,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA'),'recencyDays',120),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',3800,'requireStructuredOutput',true,'minimumRelevanceScore',58,'maximumOpportunitiesPerRun',12),
 jsonb_build_object('maxRunsPerDay',1,'maxRunsPerWeek',3,'maxRunsPerMonth',12,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',true,'rejectWeakCandidates',true,'detectDuplicates',true,'externalActions',false),
 'Focus on partnerships that can unlock capital, distribution, institutional proof or strategic access. No outreach is permitted.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',120,'suspendAfterFailures',4)),
('market-intelligence-scanner','Market Intelligence Scanner','Collects market, competitor, regulation and capital environment evidence.','market-intelligence','paused','both','weekly',
 jsonb_build_object('days',jsonb_build_array(1,4),'hour',15,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',3,'maxResultsPerSearch',10,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA'),'recencyDays',90),
 jsonb_build_object('model','openrouter/free','temperature',0.15,'maxOutputTokens',4500,'requireStructuredOutput',true,'minimumRelevanceScore',50,'maximumOpportunitiesPerRun',10),
 jsonb_build_object('maxRunsPerDay',1,'maxRunsPerWeek',3,'maxRunsPerMonth',12,'maxTavilyCreditsPerRun',3,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',false,'rejectWeakCandidates',true,'detectDuplicates',true,'externalActions',false),
 'Collect evidence that improves capital strategy, market sizing, competitor understanding and investor narratives.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',120,'suspendAfterFailures',4)),
('deadline-closure-watch','Deadline & Closure Watch','Revalidates deadlines and flags closing or expired opportunities.','deadline-control','paused','both','daily',
 jsonb_build_object('days',jsonb_build_array(1,2,3,4,5,6,7),'hour',7,'minute',30,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',6,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA','International'),'recencyDays',30),
 jsonb_build_object('model','openrouter/free','temperature',0,'maxOutputTokens',3200,'requireStructuredOutput',true,'minimumRelevanceScore',65,'maximumOpportunitiesPerRun',10),
 jsonb_build_object('maxRunsPerDay',2,'maxRunsPerWeek',14,'maxRunsPerMonth',60,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',false,'rejectWeakCandidates',true,'detectDuplicates',true,'refreshExistingOpportunities',true,'archiveExpiredOpportunities',true,'escalateCriticalDeadlines',true,'externalActions',false),
 'Revalidate only known or newly identified opportunity deadlines using authoritative pages. Flag uncertainty rather than guessing.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',60,'suspendAfterFailures',5)),
('opportunity-revalidation-agent','Opportunity Revalidation Agent','Refreshes source truth, status and eligibility evidence for existing opportunities.','revalidation','paused','both','weekly',
 jsonb_build_object('days',jsonb_build_array(3,6),'hour',13,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',2,'maxResultsPerSearch',8,'searchDepth','basic','countries',jsonb_build_array('Morocco','Africa','MENA','International'),'recencyDays',60),
 jsonb_build_object('model','openrouter/free','temperature',0,'maxOutputTokens',3600,'requireStructuredOutput',true,'minimumRelevanceScore',65,'maximumOpportunitiesPerRun',10),
 jsonb_build_object('maxRunsPerDay',1,'maxRunsPerWeek',3,'maxRunsPerMonth',12,'maxTavilyCreditsPerRun',2,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',true,'createOpportunities',false,'rejectWeakCandidates',true,'detectDuplicates',true,'refreshExistingOpportunities',true,'externalActions',false),
 'Verify whether existing opportunities remain active and whether key facts changed. Preserve audit history.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',120,'suspendAfterFailures',4)),
('executive-report-agent','Executive Report Agent','Composes internal evidence-bound capital intelligence reports from approved records.','reporting','active','manual','weekly',
 jsonb_build_object('days',jsonb_build_array(5),'hour',17,'minute',0,'timezone','Africa/Casablanca'),
 jsonb_build_object('maxSearchesPerRun',0,'maxResultsPerSearch',0,'searchDepth','basic','countries',jsonb_build_array(),'recencyDays',0),
 jsonb_build_object('model','openrouter/free','temperature',0.1,'maxOutputTokens',5000,'requireStructuredOutput',true,'minimumRelevanceScore',0,'maximumOpportunitiesPerRun',0),
 jsonb_build_object('maxRunsPerDay',2,'maxRunsPerWeek',5,'maxRunsPerMonth',20,'maxTavilyCreditsPerRun',0,'maxOpenRouterRequestsPerRun',1),
 jsonb_build_object('captureSources',false,'createOpportunities',false,'generateReports',true,'externalActions',false),
 'Compose internal reports from approved AC Capital records only. Clearly state missing evidence and keep external release human-controlled.',
 jsonb_build_object('maxRetries',1,'cooldownMinutes',60,'suspendAfterFailures',4))
on conflict (agent_key) do update set
 name=excluded.name,
 description=excluded.description,
 category=excluded.category,
 search_provider_key=excluded.search_provider_key,
 analysis_provider_key=excluded.analysis_provider_key,
 prompt_doctrine=case when public.ac_capital_ai_agents.prompt_doctrine='' then excluded.prompt_doctrine else public.ac_capital_ai_agents.prompt_doctrine end,
 updated_at=now();

-- Align initial agent status with the active Normal Operations profile.
update public.ac_capital_ai_agents
set status=case
  when agent_key in ('funding-opportunity-radar','grant-public-program-scanner','deadline-closure-watch','executive-report-agent') then 'active'
  when status='disabled' then 'disabled'
  else 'paused'
end,
updated_at=now();

-- Retire Gemini routing for AC Capital so there is no hidden fallback.
update public.ai_provider_module_assignments a
set enabled=false,
    metadata=coalesce(a.metadata,'{}'::jsonb)||jsonb_build_object('retiredForAcCapital',true,'replacement','tavily+openrouter','source','AC_CAPITAL_FREE_PROVIDER_OPERATIONS_05'),
    updated_at=now()
from public.ai_provider_dossiers d
where a.dossier_id=d.id
  and a.module_key='ac_capital_os'
  and lower(d.provider_type)='gemini';

update public.ai_provider_routing_rules
set enabled=false,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('retiredForAcCapital',true,'replacement','tavily+openrouter','source','AC_CAPITAL_FREE_PROVIDER_OPERATIONS_05'),
    updated_at=now()
where module_key='ac_capital_os';

update public.ai_provider_command_policies
set enabled=false,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('retiredForAcCapital',true,'replacement','tavily+openrouter','source','AC_CAPITAL_FREE_PROVIDER_OPERATIONS_05'),
    updated_at=now()
where module_key='ac_capital_os'
  and ('gemini'=any(coalesce(allowed_provider_types,'{}'::text[])) or command_code in ('AC_CAPITAL_RADAR_GROUNDED_RESEARCH','AC_CAPITAL_REPORT_COMPOSE'));

commit;
