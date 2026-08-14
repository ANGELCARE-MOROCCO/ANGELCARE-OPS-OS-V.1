-- ANGELCARE AC WHATSAPP — SOVEREIGN COMMERCIAL COGNITION ENGINE 2040
-- Additive V2 cognition migration. Requires the Revenue Intelligence OS base migration.
-- NO DROP / TRUNCATE / DELETE. SQL is executed only after explicit operator review.

begin;

alter table public.ac_whatsapp_conversations
  add column if not exists cognition_last_at timestamptz,
  add column if not exists cognition_escalation_flag boolean not null default false,
  add column if not exists cognition_escalation_reason text,
  add column if not exists cognition_state_version integer not null default 1;

create table if not exists public.ac_whatsapp_cc_relationship_cognition (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.ac_whatsapp_conversations(id) on delete cascade,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete set null,
  account_id uuid references public.ac_whatsapp_accounts(id) on delete set null,
  customer_type text,
  service_line text,
  source text,
  cognition_state jsonb not null default '{}'::jsonb,
  memory jsonb not null default '{}'::jsonb,
  opportunity jsonb not null default '{}'::jsonb,
  current_goal text,
  current_action text,
  confidence jsonb not null default '{}'::jsonb,
  risk jsonb not null default '{}'::jsonb,
  eligibility text not null default 'blue' check (eligibility in ('green','blue','amber','red')),
  escalation_flag boolean not null default false,
  escalation_reason text,
  last_decision_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_stakeholders (
  id uuid primary key default gen_random_uuid(),
  organization_key text not null,
  stakeholder_key text not null,
  contact_id uuid references public.ac_whatsapp_contacts(id) on delete set null,
  name text,
  role text not null default 'unknown',
  authority numeric(6,5) not null default 0,
  influence numeric(6,5) not null default 0,
  support text not null default 'unknown' check (support in ('unknown','supporter','neutral','blocker')),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_key,stakeholder_key)
);

create table if not exists public.ac_whatsapp_cc_commitments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  commitment_key text not null,
  owner_type text not null check (owner_type in ('customer','angelcare')),
  commitment_text text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','fulfilled','overdue','cancelled')),
  source_message_id uuid references public.ac_whatsapp_messages(id) on delete set null,
  confidence numeric(6,5) not null default .5,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(conversation_id,commitment_key)
);

create table if not exists public.ac_whatsapp_cc_knowledge_entities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  entity_type text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  scope jsonb not null default '{}'::jsonb,
  truth_status text not null default 'validated' check (truth_status in ('draft','validated','review','blocked','deprecated')),
  source_kind text not null default 'manual',
  priority integer not null default 50,
  active boolean not null default true,
  version integer not null default 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_knowledge_edges (
  id uuid primary key default gen_random_uuid(),
  from_entity_id uuid not null references public.ac_whatsapp_cc_knowledge_entities(id) on delete cascade,
  to_entity_id uuid not null references public.ac_whatsapp_cc_knowledge_entities(id) on delete cascade,
  relation_type text not null,
  weight numeric(6,5) not null default .5,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(from_entity_id,to_entity_id,relation_type)
);

create table if not exists public.ac_whatsapp_cc_offer_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  service_line text not null default 'all',
  customer_type text not null default 'all',
  customer_types text[] not null default '{all}',
  journey_stages text[] not null default '{all}',
  cross_sell_keys text[] not null default '{}',
  constraints text[] not null default '{}',
  commercial_data jsonb not null default '{}'::jsonb,
  priority integer not null default 50,
  active boolean not null default true,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_action_registry (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  action_type text not null,
  title text not null,
  description text,
  authority_class text not null default 'autonomous',
  requires_message boolean not null default true,
  risk_class text not null default 'normal',
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_action_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  idempotency_key text not null,
  action_type text not null,
  status text not null,
  message_id uuid references public.ac_whatsapp_messages(id) on delete set null,
  goal text,
  confidence numeric(6,5),
  details jsonb not null default '{}'::jsonb,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ac_whatsapp_cc_action_runs_conv_idx on public.ac_whatsapp_cc_action_runs(conversation_id,created_at desc);
create unique index if not exists ac_whatsapp_cc_action_runs_idempotency_uq on public.ac_whatsapp_cc_action_runs(idempotency_key) where status in ('executed','queued');

create table if not exists public.ac_whatsapp_cc_event_queue (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  event_type text not null,
  run_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  status text not null default 'scheduled' check (status in ('scheduled','processing','done','failed','cancelled')),
  attempt_count integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ac_whatsapp_cc_event_queue_due_idx on public.ac_whatsapp_cc_event_queue(status,run_at);

create table if not exists public.ac_whatsapp_cc_idempotency (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete cascade,
  event_type text not null,
  status text not null default 'processing',
  result jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_learning_evidence (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete cascade,
  event_type text not null,
  outcome text,
  doctrine_node_ids uuid[] not null default '{}',
  action_type text,
  goal text,
  confidence numeric(6,5),
  commercial_intensity integer,
  customer_type text,
  service_line text,
  journey_stage text,
  intent_family text,
  human_correction jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_learning_candidates (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  candidate_type text not null,
  title text not null,
  status text not null default 'proposed' check (status in ('proposed','under_review','approved','rejected','implemented')),
  evidence_summary jsonb not null default '{}'::jsonb,
  proposed_change jsonb not null default '{}'::jsonb,
  risk_level text not null default 'medium',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_shadow_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  idempotency_key text not null,
  proposed_action text,
  proposed_response text,
  goal text,
  confidence numeric(6,5),
  risk jsonb not null default '{}'::jsonb,
  reasoning jsonb not null default '{}'::jsonb,
  human_action text,
  human_outcome text,
  comparison jsonb not null default '{}'::jsonb,
  status text not null default 'pending_comparison',
  created_at timestamptz not null default now(),
  compared_at timestamptz
);

create table if not exists public.ac_whatsapp_cc_outcomes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ac_whatsapp_conversations(id) on delete cascade,
  outcome text not null,
  commercial_value numeric(14,2),
  currency text not null default 'MAD',
  metadata jsonb not null default '{}'::jsonb,
  recorded_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_whatsapp_cc_maturity_dimensions (
  id uuid primary key default gen_random_uuid(),
  dimension_type text not null,
  dimension_key text not null,
  maturity_level text not null default 'L0' check (maturity_level in ('L0','L1','L2','L3','L4','L5','L6')),
  samples integer not null default 0,
  successes integer not null default 0,
  failures integer not null default 0,
  overrides integer not null default 0,
  risk_events integer not null default 0,
  score numeric(6,5) not null default 0,
  velocity numeric(8,5) not null default 0,
  last_evidence_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(dimension_type,dimension_key)
);

create table if not exists public.ac_whatsapp_cc_audit (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ac_whatsapp_conversations(id) on delete set null,
  event_type text not null,
  action_type text,
  goal text,
  eligibility text,
  doctrine_node_ids uuid[] not null default '{}',
  knowledge_entity_ids uuid[] not null default '{}',
  confidence jsonb not null default '{}'::jsonb,
  risk jsonb not null default '{}'::jsonb,
  reasoning jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ac_whatsapp_cc_relationship_cognition enable row level security;
alter table public.ac_whatsapp_cc_stakeholders enable row level security;
alter table public.ac_whatsapp_cc_commitments enable row level security;
alter table public.ac_whatsapp_cc_knowledge_entities enable row level security;
alter table public.ac_whatsapp_cc_knowledge_edges enable row level security;
alter table public.ac_whatsapp_cc_offer_catalog enable row level security;
alter table public.ac_whatsapp_cc_action_registry enable row level security;
alter table public.ac_whatsapp_cc_action_runs enable row level security;
alter table public.ac_whatsapp_cc_event_queue enable row level security;
alter table public.ac_whatsapp_cc_idempotency enable row level security;
alter table public.ac_whatsapp_cc_learning_evidence enable row level security;
alter table public.ac_whatsapp_cc_learning_candidates enable row level security;
alter table public.ac_whatsapp_cc_shadow_runs enable row level security;
alter table public.ac_whatsapp_cc_outcomes enable row level security;
alter table public.ac_whatsapp_cc_maturity_dimensions enable row level security;
alter table public.ac_whatsapp_cc_audit enable row level security;

insert into public.ac_whatsapp_cc_action_registry(code,action_type,title,description,authority_class,requires_message,risk_class)
values
 ('ASK','ask','Ask','Progressive discovery question','autonomous',true,'normal'),
 ('ANSWER','answer','Answer','Contextual answer that preserves commercial objective','autonomous',true,'normal'),
 ('CLARIFY','clarify','Clarify','Resolve uncertainty before commercial commitment','autonomous',true,'normal'),
 ('WAIT','wait','Wait','Deliberately wait','autonomous',false,'normal'),
 ('SILENCE','silence','Smart silence','Prevent over-contact and preserve relationship','autonomous',false,'normal'),
 ('FOLLOW_UP','follow_up','Follow-up','Contextual follow-up from memory','autonomous',true,'normal'),
 ('REASSURE','reassure','Reassure','Trust-building response','autonomous',true,'normal'),
 ('PROOF','provide_proof','Provide proof','Select relevant proof before pressure','autonomous',true,'normal'),
 ('QUALIFY','qualify','Qualify','Progressive qualification','autonomous',true,'normal'),
 ('DISCOVER_AUTHORITY','discover_authority','Discover authority','Map B2B buying committee','autonomous',true,'normal'),
 ('PROPOSE_MEETING','propose_meeting','Propose meeting','Secure B2B next commitment','autonomous',true,'normal'),
 ('PROPOSE_OFFER','propose_offer','Propose offer','Present best-fit offer','autonomous',true,'normal'),
 ('CLOSE','close','Close','Secure next valid commercial commitment','autonomous',true,'normal'),
 ('CROSS_SELL','cross_sell','Cross-sell','Introduce relevant adjacent value','autonomous',true,'normal'),
 ('UPSELL','upsell','Upsell','Expand value after sufficient fit/trust','autonomous',true,'normal'),
 ('REACTIVATE','reactivate','Reactivate','Reopen dormant value with context','autonomous',true,'normal'),
 ('RECOVER','recover','Recover relationship','Prioritize satisfaction/trust recovery','autonomous',true,'protected'),
 ('HANDOVER','handover','Human handover','Stop autonomy and request human expertise','human_required',false,'high'),
 ('STOP','stop_automation','Stop automation','Respect stop/opt-out/protection','human_or_policy',false,'high')
on conflict(code) do nothing;

insert into public.ac_whatsapp_cc_offer_catalog(code,title,service_line,customer_type,customer_types,journey_stages,cross_sell_keys,constraints,priority)
values
 ('B2B_EDUCATION_SOLUTIONS','AngelCare B2B Education Solutions','b2b_education','b2b',array['b2b'],array['aware','curious','engaged','qualified','solution_fit','evaluating','closing'],array['ACADEMY','CORPORATE'],'{}',95),
 ('HOME_CHILDCARE','Garde d''enfant à domicile','home_childcare','b2c',array['b2c'],array['aware','curious','engaged','qualified','closing'],array['ACADEMY'],array['availability_must_be_verified'],100),
 ('SPECIAL_CHILDCARE','Accompagnement enfant avec besoins spécifiques','special_childcare','b2c',array['b2c'],array['aware','curious','engaged','qualified'],array[]::text[],array['qualification_required','no_medical_claims'],100),
 ('POSTPARTUM_SUPPORT','Accompagnement post-partum / retour à domicile','postpartum','b2c',array['b2c'],array['aware','curious','engaged','qualified'],array['HOME_CHILDCARE'],array['gentle_commercial_intensity'],100),
 ('ACADEMY','AngelCare Academy','academy','all',array['b2b','b2c'],array['engaged','qualified','expansion'],array[]::text[],'{}',70),
 ('CORPORATE','AngelCare Corporate Solutions','corporate','b2b',array['b2b'],array['aware','curious','engaged','qualified'],array['ACADEMY'],'{}',80),
 ('HOSPITALITY','AngelCare Hospitality Kids-Friendly','hospitality','b2b',array['b2b'],array['aware','curious','engaged','qualified'],array['ACADEMY'],'{}',80)
on conflict(code) do nothing;

insert into public.ac_whatsapp_cc_knowledge_entities(code,entity_type,title,content,scope,truth_status,source_kind,priority)
values
 ('K_TRUTH_NO_INVENTED_PRICE','policy','No invented price','{"rule":"Never invent a price. Use approved pricing data or qualify and escalate."}','{"customer_types":["all"],"service_lines":["all"],"intent_families":["pricing"]}','validated','system',100),
 ('K_TRUTH_NO_INVENTED_AVAILABILITY','policy','No invented availability','{"rule":"Never claim capacity or staff availability without runtime/approved evidence."}','{"customer_types":["all"],"service_lines":["all"],"intent_families":["availability"]}','validated','system',100),
 ('K_B2B_ACCOUNT_REASONING','strategy','B2B account reasoning','{"rule":"Think at account and buying-committee level, not only current contact."}','{"customer_types":["b2b"],"service_lines":["all"],"intent_families":["all"]}','validated','system',95),
 ('K_B2C_TRUST_FIRST','strategy','B2C trust before pressure','{"rule":"For family services, build confidence and understand practical need before increasing sales intensity."}','{"customer_types":["b2c"],"service_lines":["all"],"intent_families":["all"]}','validated','system',95),
 ('K_SPECIAL_CARE_BOUNDARY','policy','Special-care qualification boundary','{"rule":"Qualify practical support needs carefully and never make medical diagnosis or treatment claims."}','{"customer_types":["b2c"],"service_lines":["special_childcare"],"intent_families":["all"]}','validated','system',100),
 ('K_POSTPARTUM_BOUNDARY','policy','Postpartum commercial care','{"rule":"Reduce cognitive load, remain gentle, avoid exploitative pressure, and escalate health-related questions."}','{"customer_types":["b2c"],"service_lines":["postpartum"],"intent_families":["all"]}','validated','system',100),
 ('K_COMPLAINT_RECOVERY','strategy','Relationship recovery before selling','{"rule":"When satisfaction risk is high, suspend upsell and close pressure until issue and trust are stabilized."}','{"customer_types":["all"],"service_lines":["all"],"intent_families":["complaint_recovery"]}','validated','system',100),
 ('K_SMART_SILENCE','strategy','Smart silence','{"rule":"Silence is a valid commercial action when fatigue or over-contact risk is high."}','{"customer_types":["all"],"service_lines":["all"],"intent_families":["all"]}','validated','system',90)
on conflict(code) do nothing;

-- Structured packaged knowledge/strategy seed generated from COMMERCIAL_COGNITION_KNOWLEDGE_SEED.csv
insert into public.ac_whatsapp_cc_knowledge_entities(code,entity_type,title,content,scope,truth_status,source_kind,priority)
values
 ('ONTO_B2B_EDUCATION_QUALIFICATION','strategy','Education B2B · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_TRUST','strategy','Education B2B · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_AUTHORITY','strategy','Education B2B · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_VALUE','strategy','Education B2B · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_PRICING','strategy','Education B2B · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_B2B_EDUCATION_OBJECTION','strategy','Education B2B · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_CLOSING','strategy','Education B2B · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_FOLLOWUP','strategy','Education B2B · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_RETENTION','strategy','Education B2B · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_EXPANSION','strategy','Education B2B · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_SILENCE','strategy','Education B2B · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_B2B_EDUCATION_HANDOFF','strategy','Education B2B · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["b2b_education"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_HOME_CHILDCARE_QUALIFICATION','strategy','Home Childcare · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_TRUST','strategy','Home Childcare · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_AUTHORITY','strategy','Home Childcare · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_VALUE','strategy','Home Childcare · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_PRICING','strategy','Home Childcare · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_HOME_CHILDCARE_OBJECTION','strategy','Home Childcare · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_CLOSING','strategy','Home Childcare · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_FOLLOWUP','strategy','Home Childcare · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_RETENTION','strategy','Home Childcare · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_EXPANSION','strategy','Home Childcare · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_SILENCE','strategy','Home Childcare · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOME_CHILDCARE_HANDOFF','strategy','Home Childcare · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["home_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_SPECIAL_CHILDCARE_QUALIFICATION','strategy','Special Childcare · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_TRUST','strategy','Special Childcare · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_AUTHORITY','strategy','Special Childcare · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_VALUE','strategy','Special Childcare · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_PRICING','strategy','Special Childcare · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_SPECIAL_CHILDCARE_OBJECTION','strategy','Special Childcare · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_CLOSING','strategy','Special Childcare · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_FOLLOWUP','strategy','Special Childcare · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_RETENTION','strategy','Special Childcare · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_EXPANSION','strategy','Special Childcare · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_SILENCE','strategy','Special Childcare · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_SPECIAL_CHILDCARE_HANDOFF','strategy','Special Childcare · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["special_childcare"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_POSTPARTUM_QUALIFICATION','strategy','Postpartum · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_TRUST','strategy','Postpartum · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_AUTHORITY','strategy','Postpartum · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_VALUE','strategy','Postpartum · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_PRICING','strategy','Postpartum · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_POSTPARTUM_OBJECTION','strategy','Postpartum · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_CLOSING','strategy','Postpartum · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_FOLLOWUP','strategy','Postpartum · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_RETENTION','strategy','Postpartum · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_EXPANSION','strategy','Postpartum · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_SILENCE','strategy','Postpartum · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_POSTPARTUM_HANDOFF','strategy','Postpartum · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["b2c"], "service_lines": ["postpartum"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_ACADEMY_QUALIFICATION','strategy','Academy · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_TRUST','strategy','Academy · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_AUTHORITY','strategy','Academy · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_VALUE','strategy','Academy · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_PRICING','strategy','Academy · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_ACADEMY_OBJECTION','strategy','Academy · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_CLOSING','strategy','Academy · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_FOLLOWUP','strategy','Academy · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_RETENTION','strategy','Academy · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_EXPANSION','strategy','Academy · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_SILENCE','strategy','Academy · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_ACADEMY_HANDOFF','strategy','Academy · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["academy"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_HOSPITALITY_QUALIFICATION','strategy','Hospitality · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_TRUST','strategy','Hospitality · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_AUTHORITY','strategy','Hospitality · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_VALUE','strategy','Hospitality · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_PRICING','strategy','Hospitality · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_HOSPITALITY_OBJECTION','strategy','Hospitality · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_CLOSING','strategy','Hospitality · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_FOLLOWUP','strategy','Hospitality · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_RETENTION','strategy','Hospitality · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_EXPANSION','strategy','Hospitality · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_SILENCE','strategy','Hospitality · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_HOSPITALITY_HANDOFF','strategy','Hospitality · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["hospitality"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_CORPORATE_QUALIFICATION','strategy','Corporate · Progressive qualification','{"rule": "Collect only the next information required to improve fit and progression."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_TRUST','strategy','Corporate · Trust building','{"rule": "Use relevant verifiable evidence before increasing pressure."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_AUTHORITY','strategy','Corporate · Decision authority','{"rule": "Identify who can approve and who influences the decision."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_VALUE','strategy','Corporate · Value articulation','{"rule": "Connect service value to the customer actual need rather than generic features."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_PRICING','strategy','Corporate · Pricing discipline','{"rule": "Never invent pricing; clarify scope and use approved commercial data."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('ONTO_CORPORATE_OBJECTION','strategy','Corporate · Objection root cause','{"rule": "Clarify the real cause before selecting a response strategy."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_CLOSING','strategy','Corporate · Closing progression','{"rule": "Convert buying signals into the smallest valid next commitment."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_FOLLOWUP','strategy','Corporate · Adaptive follow-up','{"rule": "Change follow-up angle according to momentum, commitment and fatigue."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_RETENTION','strategy','Corporate · Retention','{"rule": "Protect satisfaction and resolve issues before expansion."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_EXPANSION','strategy','Corporate · Expansion','{"rule": "Cross-sell only when fit, timing and relationship readiness are sufficient."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_SILENCE','strategy','Corporate · Smart silence','{"rule": "Do not over-contact; deliberate waiting can preserve commercial value."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',85),
 ('ONTO_CORPORATE_HANDOFF','strategy','Corporate · Escalation','{"rule": "Escalate when knowledge, authority, safety or relationship risk exceeds autonomy."}'::jsonb,'{"customer_types": ["b2b"], "service_lines": ["corporate"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',100),
 ('MOMENTUM_ADVANCING','strategy','Advancing momentum','{"rule": "Use stronger progression when replies become faster, more specific, and commitment-oriented."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('MOMENTUM_DECLINING','strategy','Declining momentum','{"rule": "Reduce pressure, diagnose barrier, and change follow-up angle."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('TRUST_FRAGILE','strategy','Fragile trust','{"rule": "Prioritize reassurance, proof, clarity, and non-pushy pacing."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('TRUST_STRONG','strategy','Strong trust','{"rule": "Avoid redundant reassurance; move toward concrete next commitment."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('READINESS_DECISION','strategy','Decision readiness','{"rule": "Use explicit next-step closing rather than more discovery."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('READINESS_EARLY','strategy','Early readiness','{"rule": "Do not overload with closing; discover need and fit."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('AUTHORITY_LOW','strategy','Low authority','{"rule": "Map buying committee without making current contact feel dismissed."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('FATIGUE_HIGH','strategy','High contact fatigue','{"rule": "Use smart silence or a materially different future reason to re-engage."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('PROMISE_CUSTOMER','strategy','Customer commitment','{"rule": "Treat customer promises and dates as structured follow-up obligations."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('PROMISE_ANGELCARE','strategy','AngelCare commitment','{"rule": "Track AngelCare promises and fulfill them before asking for more commitment."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('HIDDEN_INTENT','strategy','Hidden intent discipline','{"rule": "Treat hidden intent as probabilistic and evidence-backed, never as a certain fact."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('OFFER_TIMING','strategy','Offer timing','{"rule": "Separate offer relevance from offer timing so expansion does not distract the primary close."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('HUMAN_BY_EXCEPTION','strategy','Human by exception','{"rule": "Continue autonomy when confidence, authority and risk permit; escalate with explicit reason when they do not."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95),
 ('TRUTH_OVER_PRESSURE','strategy','Truth over commercial pressure','{"rule": "Product, service, price, availability and policy truth always outrank persuasion."}'::jsonb,'{"customer_types": ["all"], "service_lines": ["all"], "intent_families": ["all"]}'::jsonb,'validated','packaged_seed',95)
on conflict(code) do nothing;

commit;
