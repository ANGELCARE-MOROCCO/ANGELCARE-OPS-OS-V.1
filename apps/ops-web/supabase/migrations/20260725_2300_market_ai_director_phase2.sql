-- ANGELCARE SANILA MARKET OS — Marketing Director AI Phase 2
-- Additive, auditable, internal-only AI command and orchestration foundation.
begin;

create extension if not exists pgcrypto;

create or replace function public.market_ai_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end $$;

create table if not exists public.market_ai_skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  catalog_order integer not null default 0,
  name text not null,
  category text not null,
  description text not null,
  default_frequency text not null check (default_frequency in ('manual','hourly','every_4_hours','daily','weekdays','weekly','biweekly','monthly','quarterly')),
  mode text not null,
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  progressive_levels text[] not null default '{foundation,operational,advanced,executive,self_improving}',
  monthly_resource_update boolean not null default true,
  status text not null default 'active' check (status in ('active','paused','retired')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_commands (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  skill_code text not null references public.market_ai_skills(code) on update cascade,
  skill_name text not null,
  category text not null,
  objective text not null,
  instruction text not null,
  default_frequency text not null check (default_frequency in ('manual','hourly','every_4_hours','daily','weekdays','weekly','biweekly','monthly','quarterly')),
  authority_mode text not null check (authority_mode in ('observe','advise','prepare','orchestrate_internal')),
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  requires_human_review boolean not null default true,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  deployed boolean not null default false,
  tags text[] not null default '{}',
  source text not null default 'manual' check (source in ('system_catalog','csv_import','manual')),
  version text not null default '1.0.0',
  created_by text,
  updated_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_command_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  command_id uuid references public.market_ai_commands(id) on delete set null,
  command_code text not null,
  frequency text not null check (frequency in ('manual','hourly','every_4_hours','daily','weekdays','weekly','biweekly','monthly','quarterly')),
  timezone text not null default 'Africa/Casablanca',
  hour integer not null default 8 check (hour between 0 and 23),
  minute integer not null default 0 check (minute between 0 and 59),
  day_of_week integer check (day_of_week between 0 and 6),
  day_of_month integer check (day_of_month between 1 and 28),
  enabled boolean not null default true,
  authority_mode text not null default 'prepare' check (authority_mode in ('observe','advise','prepare','orchestrate_internal')),
  objective text not null,
  context jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_mandates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  objective text not null,
  sponsor text not null,
  sponsor_id text,
  authority_mode text not null check (authority_mode in ('observe','advise','prepare','orchestrate_internal')),
  status text not null default 'draft' check (status in ('draft','approved','running','paused','needs_review','completed','failed','cancelled')),
  priority text not null default 'high' check (priority in ('low','medium','high','critical')),
  command_codes text[] not null default '{}',
  context jsonb not null default '{}'::jsonb,
  restrictions text[] not null default '{}',
  expected_outcomes text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_runs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.market_ai_mandates(id) on delete set null,
  schedule_id uuid references public.market_ai_command_schedules(id) on delete set null,
  command_id uuid references public.market_ai_commands(id) on delete set null,
  command_code text not null,
  status text not null default 'queued' check (status in ('queued','running','needs_review','completed','failed','cancelled','blocked')),
  authority_mode text not null check (authority_mode in ('observe','advise','prepare','orchestrate_internal')),
  model text,
  objective text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  latency_ms integer not null default 0,
  grounded boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  created_by text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_action_queue (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.market_ai_runs(id) on delete cascade,
  mission_id uuid references public.market_ai_mandates(id) on delete set null,
  command_code text not null,
  action_type text not null check (action_type in ('create_brief','create_content_draft','create_task_plan','create_asset_requirement','request_review','propose_schedule','prepare_publishing_package','classify_content','record_learning','store_bridge_object')),
  title text not null,
  description text not null,
  requires_approval boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'awaiting_approval' check (status in ('awaiting_approval','prepared','approved','rejected','executed','failed')),
  created_by text,
  decided_by text,
  decided_at timestamptz,
  execution_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_bridge_objects (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.market_ai_runs(id) on delete set null,
  action_id uuid references public.market_ai_action_queue(id) on delete set null,
  content_id text,
  bridge_file_id text not null unique,
  entity_type text not null,
  original_filename text not null,
  safe_filename text not null,
  content_type text,
  size_bytes bigint not null default 0,
  sha256_hash text not null,
  storage_key text not null,
  classification jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','superseded','archived','failed')),
  created_by text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_learning_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.market_ai_runs(id) on delete set null,
  actor_id text,
  title text not null,
  evidence text[] not null default '{}',
  recommendation text not null,
  confidence numeric(5,4) not null default 0 check (confidence between 0 and 1),
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','applied','expired')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_resource_updates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.market_ai_runs(id) on delete set null,
  actor_id text,
  title text not null,
  domains text[] not null default '{}',
  summary text not null,
  sources jsonb not null default '[]'::jsonb,
  recommendations text[] not null default '{}',
  status text not null default 'review_required' check (status in ('review_required','approved','rejected','applied','archived')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_guardrail_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.market_ai_runs(id) on delete set null,
  actor_id text,
  command_code text,
  requested_action text not null,
  reason text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_csv_imports (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  filename text,
  checksum text,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.market_ai_doctrine_entries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  category text not null,
  authority_state text not null default 'provisional' check (authority_state in ('canonical','approved','provisional','external_evidence','historical','rejected')),
  content text not null,
  version text not null default '1.0.0',
  source text,
  effective_at timestamptz,
  expires_at timestamptz,
  approved_by text,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists market_ai_commands_skill_idx on public.market_ai_commands(skill_code);
create index if not exists market_ai_commands_status_idx on public.market_ai_commands(status, deployed);
create index if not exists market_ai_commands_category_idx on public.market_ai_commands(category);
create index if not exists market_ai_schedules_due_idx on public.market_ai_command_schedules(enabled, next_run_at);
create index if not exists market_ai_runs_created_idx on public.market_ai_runs(created_at desc);
create index if not exists market_ai_runs_actor_created_idx on public.market_ai_runs(created_by, created_at desc);
create index if not exists market_ai_runs_status_idx on public.market_ai_runs(status);
create index if not exists market_ai_bridge_objects_entity_idx on public.market_ai_bridge_objects(entity_type, created_at desc);
create index if not exists market_ai_actions_status_idx on public.market_ai_action_queue(status, created_at desc);

drop trigger if exists market_ai_skills_updated_at on public.market_ai_skills;
create trigger market_ai_skills_updated_at before update on public.market_ai_skills for each row execute function public.market_ai_set_updated_at();
drop trigger if exists market_ai_commands_updated_at on public.market_ai_commands;
create trigger market_ai_commands_updated_at before update on public.market_ai_commands for each row execute function public.market_ai_set_updated_at();
drop trigger if exists market_ai_command_schedules_updated_at on public.market_ai_command_schedules;
create trigger market_ai_command_schedules_updated_at before update on public.market_ai_command_schedules for each row execute function public.market_ai_set_updated_at();
drop trigger if exists market_ai_mandates_updated_at on public.market_ai_mandates;
create trigger market_ai_mandates_updated_at before update on public.market_ai_mandates for each row execute function public.market_ai_set_updated_at();
drop trigger if exists market_ai_doctrine_entries_updated_at on public.market_ai_doctrine_entries;
create trigger market_ai_doctrine_entries_updated_at before update on public.market_ai_doctrine_entries for each row execute function public.market_ai_set_updated_at();

alter table public.market_ai_skills add column if not exists catalog_order integer not null default 0;
create unique index if not exists market_ai_schedule_name_uidx on public.market_ai_command_schedules(name);

insert into public.market_ai_skills(code,catalog_order,name,category,description,default_frequency,mode,risk_level,progressive_levels,monthly_resource_update,status) values
  ('STRATEGY-01',1,'Executive Marketing Strategy','Stratégie exécutive','Transform company priorities into measurable marketing mandates.','monthly','executive','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('STRATEGY-02',2,'Portfolio Prioritization','Stratégie exécutive','Rank campaigns, audiences and content investments by strategic value, urgency and capacity.','weekly','executive','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('STRATEGY-03',3,'Scenario Planning','Stratégie exécutive','Build conservative, balanced and bold scenarios with risks, stop conditions and fallback routes.','monthly','executive','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('STRATEGY-04',4,'Market Positioning','Stratégie exécutive','Define premium differentiated positioning for AngelCare services and business lines.','monthly','executive','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('STRATEGY-05',5,'Executive Decision Intelligence','Stratégie exécutive','Prepare evidence-backed decision packages for leadership approval.','weekly','executive','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('STRATEGY-06',6,'Strategic Roadmapping','Stratégie exécutive','Translate annual and quarterly priorities into sequenced marketing programs.','monthly','executive','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('INTEL-01',7,'Trend Intelligence','Intelligence marché','Detect, validate and rank current market, cultural and platform trends.','daily','research','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('INTEL-02',8,'Competitor Intelligence','Intelligence marché','Monitor competitors, substitutes and category leaders without copying them.','weekly','research','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('INTEL-03',9,'Search Demand Intelligence','Intelligence marché','Analyze search intent, keyword demand and emerging questions.','weekly','research','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('INTEL-04',10,'Platform Innovation Watch','Intelligence marché','Track format, algorithm, policy and advertising changes across key platforms.','weekly','research','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('INTEL-05',11,'Moroccan Market Intelligence','Intelligence marché','Interpret Moroccan economic, social, geographic and family-service market signals.','weekly','research','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('INTEL-06',12,'Reputation & Risk Signals','Intelligence marché','Detect reputation threats, sensitive narratives and communication risks.','daily','research','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('AUDIENCE-01',13,'Family Audience Intelligence','Audience & culture','Understand parents, mothers, guardians and household decision drivers.','monthly','analysis','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('AUDIENCE-02',14,'B2B Decision-Maker Intelligence','Audience & culture','Model school, hotel, corporate, clinic and partner decision processes.','monthly','analysis','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('AUDIENCE-03',15,'Cultural Relevance','Audience & culture','Adapt strategy to Moroccan cultural, linguistic and regional realities.','monthly','analysis','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('AUDIENCE-04',16,'Persona Evolution','Audience & culture','Maintain evidence-backed audience personas and behavioral changes.','monthly','analysis','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('AUDIENCE-05',17,'Pain & Objection Mining','Audience & culture','Extract pains, anxieties, objections and trust requirements.','weekly','analysis','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('AUDIENCE-06',18,'Journey & Moment Mapping','Audience & culture','Map discovery, consideration, conversion, retention and advocacy moments.','monthly','analysis','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('BRAND-01',19,'AngelCare Brand Guardian','Marque & doctrine','Enforce official AngelCare identity, premium positioning and language.','daily','governance','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('BRAND-02',20,'Tone of Voice Governance','Marque & doctrine','Maintain authoritative, empathetic, premium and culturally appropriate voice.','weekly','governance','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('BRAND-03',21,'Visual Doctrine Governance','Marque & doctrine','Define visual briefs aligned with logo, color, photography and contrast rules.','weekly','governance','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('BRAND-04',22,'Claims & Evidence Governance','Marque & doctrine','Validate every claim against services, evidence and approval rules.','daily','governance','critical',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('BRAND-05',23,'Service Truth Protection','Marque & doctrine','Prevent promotion of unavailable, incomplete or unsupported service promises.','daily','governance','critical',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('BRAND-06',24,'Doctrine Evolution','Marque & doctrine','Propose controlled doctrine improvements without changing canonical doctrine automatically.','monthly','learning','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CAMPAIGN-01',25,'Campaign Architecture','Architecture campagne','Design complete campaign systems from objective to measurable outcome.','weekly','planning','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CAMPAIGN-02',26,'Content Pillar Design','Architecture campagne','Create distinct content pillars linked to audience, service and conversion goals.','monthly','planning','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CAMPAIGN-03',27,'Channel Orchestration','Architecture campagne','Assign clear roles, sequencing and dependencies to each channel.','weekly','planning','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CAMPAIGN-04',28,'Editorial Calendar Strategy','Architecture campagne','Build balanced, conflict-aware editorial calendars.','weekly','planning','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CAMPAIGN-05',29,'Launch & Momentum Planning','Architecture campagne','Design pre-launch, launch, reinforcement and follow-up waves.','weekly','planning','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CAMPAIGN-06',30,'Campaign Rescue & Recovery','Architecture campagne','Diagnose weak campaigns and compile recovery missions.','weekly','planning','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CONTENT-01',31,'Strategic Briefing','Contenu éditorial','Produce clear, complete and execution-ready strategic briefs.','daily','production','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CONTENT-02',32,'Editorial Direction','Contenu éditorial','Direct themes, narratives, series and content sequencing.','weekly','production','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CONTENT-03',33,'Premium Copywriting','Contenu éditorial','Prepare strong, clear, premium and conversion-aware copy drafts.','daily','production','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CONTENT-04',34,'Storytelling Architecture','Contenu éditorial','Build credible stories with tension, proof, trust and action.','weekly','production','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CONTENT-05',35,'Content Repurposing','Contenu éditorial','Transform approved source content into governed channel variants.','weekly','production','low',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CONTENT-06',36,'Multilingual Adaptation','Contenu éditorial','Prepare French, Arabic and English variants while preserving meaning and authority.','weekly','production','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CHANNEL-01',37,'Social Media Direction','Maîtrise canal','Prepare channel-native social concepts, captions, series and formats.','daily','channel','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CHANNEL-02',38,'SEO & Blog Direction','Maîtrise canal','Build search-led topics, structures, internal links and optimization plans.','weekly','channel','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CHANNEL-03',39,'Email Content Preparation','Maîtrise canal','Prepare governed email copy and sequences without sending externally.','weekly','channel','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CHANNEL-04',40,'WhatsApp Content Preparation','Maîtrise canal','Prepare concise WhatsApp content packages without sending externally.','weekly','channel','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CHANNEL-05',41,'PR & Reputation Content','Maîtrise canal','Prepare press, reputation and institutional communication drafts.','monthly','channel','critical',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('CHANNEL-06',42,'Sales Enablement Content','Maîtrise canal','Prepare decks, scripts, objections, proof assets and partner kits.','weekly','channel','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('GROWTH-01',43,'Conversion Strategy','Croissance & conversion','Connect content to measurable next actions and conversion stages.','weekly','growth','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('GROWTH-02',44,'CTA Architecture','Croissance & conversion','Design clear, ethical and audience-appropriate calls to action.','weekly','growth','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('GROWTH-03',45,'Lead Generation Content','Croissance & conversion','Prepare content systems that create qualified demand.','weekly','growth','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('GROWTH-04',46,'Retention & Loyalty Content','Croissance & conversion','Design content for trust, retention, renewal and advocacy.','monthly','growth','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('GROWTH-05',47,'Referral & RefferQ Enablement','Croissance & conversion','Prepare approved referral and ambassador enablement assets for RefferQ.','monthly','growth','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('GROWTH-06',48,'Experimentation & Optimization','Croissance & conversion','Design controlled tests, hypotheses, variants and learning criteria.','weekly','growth','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('OPS-01',49,'Production Orchestration','Production & gouvernance','Compile strategies into content records, tasks, owners and dependencies.','daily','operations','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('OPS-02',50,'Workload & Capacity Control','Production & gouvernance','Balance assignments, deadlines and contributor capacity.','daily','operations','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('OPS-03',51,'Asset Direction','Production & gouvernance','Specify creative assets, formats, variants, evidence and rights needs.','daily','operations','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('OPS-04',52,'Review & Approval Governance','Production & gouvernance','Prepare review packages, decisions, revision requests and evidence.','daily','operations','critical',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('OPS-05',53,'Publishing Readiness','Production & gouvernance','Validate internal readiness without performing external publication.','daily','operations','critical',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('OPS-06',54,'Content Library Governance','Production & gouvernance','Classify, version, deduplicate, link, archive and retrieve content.','weekly','operations','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('LEARN-01',55,'Content Performance Intelligence','Performance & apprentissage','Interpret confirmed content results and recommend actions.','weekly','learning','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('LEARN-02',56,'Campaign Attribution','Performance & apprentissage','Relate content contribution to campaigns, leads and business outcomes.','monthly','learning','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('LEARN-03',57,'Production Efficiency Learning','Performance & apprentissage','Analyze cycle time, revisions, bottlenecks and SLA performance.','weekly','learning','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('LEARN-04',58,'Winning Pattern Memory','Performance & apprentissage','Capture reusable successful patterns with evidence and context.','monthly','learning','medium',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('LEARN-05',59,'Weak Strategy Suppression','Performance & apprentissage','Detect repeated weak patterns and recommend suppression or redesign.','monthly','learning','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active'),
  ('LEARN-06',60,'Gemini & Marketing Resource Update','Performance & apprentissage','Run grounded monthly updates on Gemini capabilities and authoritative marketing resources.','monthly','research','high',ARRAY['foundation','operational','advanced','executive','self_improving']::text[],true,'active')
on conflict (code) do update set catalog_order=excluded.catalog_order,name=excluded.name,category=excluded.category,description=excluded.description,default_frequency=excluded.default_frequency,mode=excluded.mode,risk_level=excluded.risk_level,progressive_levels=excluded.progressive_levels,monthly_resource_update=excluded.monthly_resource_update,status=excluded.status;

with operations(sort_order,code,name,instruction,default_frequency) as (values
  (1,'OBSERVE','Observe current state','Inspect the available evidence and report the current operational state without changing records.','manual'),
  (2,'RESEARCH','Research evidence','Conduct grounded research and return dated sources, relevance and confidence.','weekly'),
  (3,'SCAN','Scan for signals','Scan configured sources for new signals, changes, opportunities and risks.','daily'),
  (4,'MAP','Map the system','Map actors, stages, relationships, dependencies and missing links.','monthly'),
  (5,'ANALYZE','Analyze deeply','Analyze causes, patterns, constraints and business implications.','weekly'),
  (6,'COMPARE','Compare alternatives','Compare alternatives using explicit criteria, evidence, tradeoffs and risks.','manual'),
  (7,'BENCHMARK','Benchmark excellence','Benchmark against authoritative standards and high-performing patterns.','monthly'),
  (8,'DIAGNOSE','Diagnose weaknesses','Diagnose structural weaknesses, blockers, inconsistencies and root causes.','weekly'),
  (9,'DETECT','Detect anomalies','Detect anomalies, stale assumptions, conflicts and unsupported claims.','daily'),
  (10,'SCORE','Score readiness','Score readiness with transparent dimensions, evidence and required corrections.','daily'),
  (11,'PRIORITIZE','Prioritize actions','Rank actions by impact, urgency, effort, risk and dependency.','daily'),
  (12,'FORECAST','Forecast outcomes','Forecast plausible outcomes with assumptions, scenarios and confidence ranges.','monthly'),
  (13,'SIMULATE','Simulate scenarios','Simulate conservative, balanced and bold scenarios with stop conditions.','manual'),
  (14,'PROPOSE','Propose direction','Propose a decisive direction with evidence, alternatives and human decision points.','manual'),
  (15,'DESIGN','Design architecture','Design a complete, structured operating architecture and acceptance criteria.','manual'),
  (16,'PLAN','Build plan','Create a sequenced, owner-based, deadline-aware execution plan.','weekly'),
  (17,'COMPILE','Compile execution','Compile approved strategy into internal records, tasks, assets and review gates.','manual'),
  (18,'SEQUENCE','Sequence actions','Sequence actions, channels, content and dependencies for maximum coherence.','weekly'),
  (19,'BRIEF','Prepare brief','Prepare an execution-ready strategic brief with missing-data warnings.','manual'),
  (20,'DRAFT','Prepare draft','Prepare an internal draft marked for human review and never external execution.','manual'),
  (21,'REWRITE','Rewrite premium','Rewrite content for clarity, authority, contrast, trust and premium corporate impact.','manual'),
  (22,'ADAPT','Adapt by channel','Adapt approved content for channel format, audience and constraints.','manual'),
  (23,'TRANSLATE','Translate governed','Translate while preserving doctrine, intent, claims and approval boundaries.','manual'),
  (24,'OPTIMIZE','Optimize performance','Optimize structure, message, CTA, discoverability and execution efficiency.','weekly'),
  (25,'VALIDATE','Validate truth','Validate facts, service truth, doctrine, readiness and required evidence.','daily'),
  (26,'AUDIT','Audit governance','Audit compliance, provenance, authority, evidence and workflow integrity.','monthly'),
  (27,'GUARD','Apply guardrails','Apply brand, claim, safety, privacy and external-action guardrails.','daily'),
  (28,'CLASSIFY','Classify records','Classify records using controlled taxonomy and visible confidence.','daily'),
  (29,'TAG','Recommend tags','Recommend precise searchable tags and controlled metadata.','daily'),
  (30,'LINK','Recommend links','Recommend content, campaign, service, task and asset relationships.','daily'),
  (31,'VERSION','Prepare version','Create a new governed version with change summary and impact notes.','manual'),
  (32,'ASSIGN','Recommend assignment','Recommend owner, reviewer and contributors based on role and capacity.','daily'),
  (33,'SCHEDULE','Propose schedule','Propose an internal schedule with conflicts, gates and rationale.','weekly'),
  (34,'MONITOR','Monitor state','Monitor due work, changes, failures, aging and intervention thresholds.','hourly'),
  (35,'ESCALATE','Prepare escalation','Prepare an evidence-backed escalation for human authority.','daily'),
  (36,'REVIEW','Prepare review','Prepare a review package with preview, checks, evidence and decision options.','daily'),
  (37,'SUMMARIZE','Summarize executive','Summarize the essential position, risks, decisions and next actions.','daily'),
  (38,'REPORT','Generate report','Generate a structured internal management report with sources and limits.','weekly'),
  (39,'MEASURE','Measure effectiveness','Measure confirmed effectiveness without converting missing data into zero.','weekly'),
  (40,'ATTRIBUTE','Analyze contribution','Analyze contribution and attribution with explicit uncertainty.','monthly'),
  (41,'LEARN','Capture learning','Capture outcome-backed learning and reusable patterns.','monthly'),
  (42,'UPDATE','Update knowledge','Prepare a controlled knowledge or resource update proposal.','monthly'),
  (43,'REUSE','Recommend reuse','Identify approved content that can be reused or adapted safely.','weekly'),
  (44,'SUPPRESS','Recommend suppression','Recommend pausing weak, stale or risky patterns with evidence.','monthly'),
  (45,'SCALE','Recommend scaling','Recommend scaling proven patterns with capacity and risk checks.','monthly'),
  (46,'RECOVER','Build recovery plan','Build a rescue plan for blocked, failed or underperforming work.','weekly'),
  (47,'RECONCILE','Reconcile conflicts','Reconcile conflicting records, statuses, claims or schedules.','weekly'),
  (48,'PREPARE','Prepare operator package','Prepare a complete internal package for a human operator.','manual'),
  (49,'EXPORT','Prepare export','Prepare a governed export with classification, version and audit metadata.','manual'),
  (50,'ARCHIVE','Recommend archive','Recommend archival with retention, supersession and retrieval metadata.','monthly')
), numbered as (
  select
    s.code as skill_code,
    s.name as skill_name,
    s.category,
    s.description,
    s.default_frequency as skill_frequency,
    s.risk_level,
    o.code as operation_code,
    o.name as operation_name,
    o.instruction as operation_instruction,
    o.default_frequency as operation_frequency,
    row_number() over(order by s.catalog_order, o.sort_order) as sequence
  from public.market_ai_skills s cross join operations o
), prepared as (
  select
    'MKT-AI-' || lpad(sequence::text,4,'0') as code,
    operation_name || ' · ' || skill_name as command_name,
    numbered.*
  from numbered
)
insert into public.market_ai_commands(code,name,skill_code,skill_name,category,objective,instruction,default_frequency,authority_mode,risk_level,requires_human_review,status,deployed,tags,source,version)
select code, command_name, prepared.skill_code, prepared.skill_name, prepared.category,
  operation_name || ' for ' || prepared.skill_name || ': ' || prepared.description,
  'Operate as the governed SANILA Marketing Director AI for ANGELCARE. ' || operation_instruction || ' Apply the core skill: ' || prepared.skill_name || '. ' || prepared.description || ' Be decisive, evidence-driven, commercially intelligent, culturally relevant to Morocco, premium corporate in tone, and explicit about assumptions. Use strong structure, precise next actions, named owners, deadlines, risks, stop conditions and human decision gates. Never perform external communication, external publication, ad activation, public statements or direct outreach. Treat missing data as unavailable, never as zero.',
  case when operation_frequency='manual' then prepared.skill_frequency else operation_frequency end,
  case
    when operation_code in ('OBSERVE','RESEARCH','SCAN','MAP','ANALYZE','COMPARE','BENCHMARK','DIAGNOSE','DETECT','SCORE','FORECAST','SIMULATE','MONITOR','MEASURE','ATTRIBUTE') then 'observe'
    when operation_code in ('PROPOSE','DESIGN','PLAN','PRIORITIZE','SUMMARIZE','REPORT','LEARN','UPDATE','SUPPRESS','SCALE','RECOVER','RECONCILE') then 'advise'
    when operation_code in ('COMPILE','BRIEF','DRAFT','REWRITE','ADAPT','TRANSLATE','OPTIMIZE','CLASSIFY','TAG','LINK','VERSION','SCHEDULE','REVIEW','PREPARE','EXPORT','ARCHIVE','REUSE') then 'prepare'
    else 'orchestrate_internal' end,
  prepared.risk_level,
  true, 'active', true, array[prepared.category,prepared.skill_code,operation_code,'angelcare','sanila','internal-only'], 'system_catalog', '2.0.0'
from prepared
on conflict (code) do update set name=excluded.name,skill_code=excluded.skill_code,skill_name=excluded.skill_name,category=excluded.category,objective=excluded.objective,instruction=excluded.instruction,default_frequency=excluded.default_frequency,authority_mode=excluded.authority_mode,risk_level=excluded.risk_level,requires_human_review=excluded.requires_human_review,tags=excluded.tags,version=excluded.version;

insert into public.market_ai_command_schedules(name,command_id,command_code,frequency,timezone,hour,minute,day_of_week,day_of_month,enabled,authority_mode,objective,next_run_at)
select 'Veille tendances quotidienne', id, code, 'daily','Africa/Casablanca',7,30,null,null,true,'observe','Scanner les tendances, signaux culturels, opportunités et risques pertinents pour ANGELCARE.', date_trunc('day',timezone('Africa/Casablanca',now())) + interval '1 day 7 hours 30 minutes'
from public.market_ai_commands where skill_code='INTEL-01' and tags @> array['SCAN'] limit 1
on conflict do nothing;

insert into public.market_ai_command_schedules(name,command_id,command_code,frequency,timezone,hour,minute,day_of_week,day_of_month,enabled,authority_mode,objective,next_run_at)
select 'Gouvernance marque quotidienne', id, code, 'daily','Africa/Casablanca',8,0,null,null,true,'observe','Auditer les contenus et dossiers nécessitant une protection de marque, de preuve ou de promesse service.', date_trunc('day',timezone('Africa/Casablanca',now())) + interval '1 day 8 hours'
from public.market_ai_commands where skill_code='BRAND-01' and tags @> array['GUARD'] limit 1
on conflict do nothing;

insert into public.market_ai_command_schedules(name,command_id,command_code,frequency,timezone,hour,minute,day_of_week,day_of_month,enabled,authority_mode,objective,next_run_at)
select 'Mise à jour mensuelle Gemini & ressources marketing', id, code, 'monthly','Africa/Casablanca',3,0,null,1,true,'advise','Rechercher les mises à jour officielles Gemini et les évolutions marketing majeures, puis préparer un dossier d’amélioration soumis à validation humaine.', date_trunc('month',timezone('Africa/Casablanca',now())) + interval '1 month 3 hours'
from public.market_ai_commands where skill_code='LEARN-06' and tags @> array['RESEARCH'] limit 1
on conflict do nothing;

insert into public.market_ai_doctrine_entries(code,title,category,authority_state,content,version,source,effective_at)
values
('DOCTRINE-EXTERNAL-BOUNDARY','Frontière absolue des actions externes','Gouvernance','canonical','Le Directeur IA peut observer, conseiller, préparer et orchestrer les flux internes. Il ne peut jamais envoyer un email ou WhatsApp, publier, activer une publicité, contacter une personne externe ou émettre une déclaration publique.','1.0.0','Phase 2 signed contract',timezone('utc',now())),
('DOCTRINE-CONTRAST','Contraste visuel SANILA','Design','canonical','Sur fond sombre, tous les textes et icônes essentiels sont blancs ou quasi blancs. Sur fond clair, les textes essentiels sont noirs ou bleu marine profond avec une graisse forte.','1.0.0','Phase 1 signed contract',timezone('utc',now())),
('DOCTRINE-TRUTH','Vérité opérationnelle','Gouvernance','canonical','Les données manquantes sont affichées comme indisponibles et jamais converties en zéro. Les brouillons IA restent identifiés et soumis à validation humaine.','1.0.0','Phase 2 signed contract',timezone('utc',now()))
on conflict (code) do nothing;

alter table public.market_ai_skills enable row level security;
alter table public.market_ai_commands enable row level security;
alter table public.market_ai_command_schedules enable row level security;
alter table public.market_ai_mandates enable row level security;
alter table public.market_ai_runs enable row level security;
alter table public.market_ai_action_queue enable row level security;
alter table public.market_ai_bridge_objects enable row level security;
alter table public.market_ai_learning_events enable row level security;
alter table public.market_ai_resource_updates enable row level security;
alter table public.market_ai_guardrail_events enable row level security;
alter table public.market_ai_csv_imports enable row level security;
alter table public.market_ai_doctrine_entries enable row level security;

comment on table public.market_ai_commands is '3000 governed internal Marketing Director AI brain commands. External execution is forbidden.';
comment on table public.market_ai_action_queue is 'Human-governed internal action proposals prepared by Marketing Director AI.';

commit;
