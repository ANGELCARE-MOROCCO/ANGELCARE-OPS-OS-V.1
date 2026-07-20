begin;

create extension if not exists pgcrypto;

create table if not exists public.browser_extension_b2b_opportunities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  title text not null,
  opportunity_type text not null default 'strategic_partnership',
  stage text not null default 'new_target',
  stage_order integer not null default 10,
  status text not null default 'active' check (status in ('active','won','lost','nurture','archived')),
  program_key text,
  estimated_monthly_value numeric(14,2) not null default 0,
  estimated_annual_value numeric(14,2) not null default 0,
  probability numeric(5,2) not null default 10 check (probability between 0 and 100),
  expected_close_at timestamptz,
  launch_at timestamptz,
  decision_process text,
  scope_summary text,
  need_confirmed boolean not null default false,
  commercial_agreement_at timestamptz,
  contract_status text,
  payment_status text,
  activation_readiness text,
  source_context_id uuid,
  source_adapter text,
  source_url text,
  owner_id uuid not null,
  next_action text,
  next_action_due_at timestamptz,
  risk_level text not null default 'medium',
  stale_after_days integer not null default 7,
  last_activity_at timestamptz,
  created_by uuid not null,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists browser_ext_b2b_active_opportunity_idx
  on public.browser_extension_b2b_opportunities(prospect_id, status, updated_at desc);
create index if not exists browser_ext_b2b_opportunity_owner_idx on public.browser_extension_b2b_opportunities(owner_id,status,stage_order);
create index if not exists browser_ext_b2b_opportunity_due_idx on public.browser_extension_b2b_opportunities(next_action_due_at) where status='active';

create table if not exists public.browser_extension_b2b_opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  prospect_id uuid not null,
  from_stage text,
  to_stage text not null,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  requirements_snapshot jsonb not null default '{}'::jsonb,
  changed_by uuid not null,
  changed_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_stage_history_idx on public.browser_extension_b2b_opportunity_stage_history(opportunity_id,changed_at desc);

create table if not exists public.browser_extension_b2b_next_best_actions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  user_id uuid not null,
  action_type text not null,
  title text not null,
  objective text,
  reasoning jsonb not null default '[]'::jsonb,
  priority text not null default 'high',
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','completed','superseded','cancelled')),
  outcome text,
  source_version text not null default 'mega3-nba-v1',
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_nba_user_idx on public.browser_extension_b2b_next_best_actions(user_id,status,due_at);
create index if not exists browser_ext_b2b_nba_opportunity_idx on public.browser_extension_b2b_next_best_actions(opportunity_id,status);

create table if not exists public.browser_extension_b2b_outreach_strategies (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  contact_id uuid,
  user_id uuid not null,
  channel text not null,
  purpose text not null,
  vertical text,
  subject text,
  body text,
  call_opening text,
  discovery_questions jsonb not null default '[]'::jsonb,
  reasoning jsonb not null default '[]'::jsonb,
  status text not null default 'prepared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_communication_contexts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid,
  opportunity_id uuid,
  user_id uuid not null,
  device_id uuid,
  adapter_key text not null,
  source_url text,
  thread_key text,
  participants jsonb not null default '[]'::jsonb,
  context_payload jsonb not null default '{}'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  status text not null default 'resolved',
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_comm_context_idx on public.browser_extension_b2b_communication_contexts(user_id,adapter_key,created_at desc);

create table if not exists public.browser_extension_b2b_communication_drafts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  contact_id uuid,
  strategy_id uuid references public.browser_extension_b2b_outreach_strategies(id) on delete set null,
  user_id uuid not null,
  channel text not null,
  subject text,
  body text not null,
  status text not null default 'prepared' check (status in ('prepared','copied','sent','cancelled')),
  requires_confirmation boolean not null default true,
  source_adapter text,
  source_context_id uuid,
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  logged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_call_briefs (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  contact_id uuid,
  user_id uuid not null,
  objective text not null,
  account_summary text,
  questions jsonb not null default '[]'::jsonb,
  known_objections jsonb not null default '[]'::jsonb,
  pricing_boundaries jsonb not null default '{}'::jsonb,
  desired_outcome text,
  minimum_next_step text,
  status text not null default 'prepared',
  outcome text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_field_visits (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  assigned_to uuid not null,
  created_by uuid not null,
  visit_objective text not null,
  planned_at timestamptz,
  location text,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled','missed')),
  checked_in_at timestamptz,
  completed_at timestamptz,
  person_met text,
  contact_id uuid,
  outcome text,
  notes text,
  evidence_requirements jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  next_step text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_field_visit_idx on public.browser_extension_b2b_field_visits(assigned_to,status,planned_at);

create table if not exists public.browser_extension_b2b_meeting_briefs (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  meeting_id uuid,
  user_id uuid not null,
  meeting_type text not null default 'discovery',
  objective text not null,
  account_summary text,
  commercial_history jsonb not null default '{}'::jsonb,
  stakeholder_map jsonb not null default '{}'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  likely_objections jsonb not null default '[]'::jsonb,
  pricing_restrictions jsonb not null default '{}'::jsonb,
  desired_commitment text,
  minimum_next_step text,
  status text not null default 'prepared',
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_meeting_live_notes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  meeting_id uuid,
  user_id uuid not null,
  checklist jsonb not null default '{}'::jsonb,
  consent_confirmed boolean not null default false,
  recording_used boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_meeting_outcomes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  meeting_id uuid,
  user_id uuid not null,
  summary jsonb not null default '{}'::jsonb,
  confirmed_needs jsonb not null default '[]'::jsonb,
  scope_summary text,
  budget_summary text,
  timing_summary text,
  decision_process text,
  stakeholders jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  commitments jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  status text not null default 'prepared' check (status in ('prepared','applied','rejected')),
  applied_by uuid,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_followups (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  contact_id uuid,
  user_id uuid not null,
  assigned_to uuid not null,
  channel text not null default 'internal',
  followup_type text not null default 'commercial_followup',
  title text not null,
  objective text,
  due_at timestamptz not null,
  priority text not null default 'high',
  status text not null default 'open' check (status in ('open','completed','cancelled','missed')),
  escalation_rule jsonb not null default '{}'::jsonb,
  source_event_id uuid,
  outcome text,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_followup_assignee_idx on public.browser_extension_b2b_followups(assigned_to,status,due_at);

create table if not exists public.browser_extension_b2b_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vertical text,
  objective text,
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  stop_rules jsonb not null default '[]'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.browser_extension_b2b_sequences(id) on delete cascade,
  step_order integer not null,
  day_offset integer not null default 0,
  channel text not null,
  purpose text not null,
  template_key text,
  requires_confirmation boolean not null default true,
  status text not null default 'active',
  unique(sequence_id,step_order)
);

create table if not exists public.browser_extension_b2b_sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.browser_extension_b2b_sequences(id) on delete cascade,
  prospect_id uuid not null,
  opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  contact_id uuid,
  user_id uuid not null,
  status text not null default 'active' check (status in ('active','paused','stopped','completed')),
  current_step_order integer not null default 0,
  next_run_at timestamptz,
  channel_state jsonb not null default '{}'::jsonb,
  stop_reason text,
  stopped_at timestamptz,
  enrolled_by uuid not null,
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_sequence_enrollment_idx on public.browser_extension_b2b_sequence_enrollments(user_id,status,next_run_at);

create table if not exists public.browser_extension_b2b_sequence_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.browser_extension_b2b_sequence_enrollments(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_attribution (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  campaign_id uuid,
  campaign_key text,
  source_type text not null,
  source_label text,
  source_url text,
  first_touch boolean not null default false,
  last_touch boolean not null default false,
  attributed_value numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_attribution_idx on public.browser_extension_b2b_attribution(prospect_id,created_at desc);

create table if not exists public.browser_extension_b2b_referral_sources (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  source_type text not null,
  source_entity_id uuid,
  source_name text,
  is_primary boolean not null default true,
  attribution_status text not null default 'recorded',
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists browser_ext_b2b_primary_referral_unique on public.browser_extension_b2b_referral_sources(prospect_id) where is_primary=true;

create table if not exists public.browser_extension_b2b_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  snapshot_date date not null,
  snapshot jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  unique(user_id,snapshot_date,generated_at)
);
create index if not exists browser_ext_b2b_daily_snapshot_idx on public.browser_extension_b2b_daily_snapshots(user_id,snapshot_date desc);

create table if not exists public.browser_extension_b2b_timeline_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid,
  opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  contact_id uuid,
  user_id uuid not null,
  event_type text not null,
  title text not null,
  description text,
  outcome text,
  source_adapter text,
  source_url text,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_timeline_prospect_idx on public.browser_extension_b2b_timeline_events(prospect_id,occurred_at desc);
create index if not exists browser_ext_b2b_timeline_opportunity_idx on public.browser_extension_b2b_timeline_events(opportunity_id,occurred_at desc);

alter table public.browser_extension_b2b_opportunities enable row level security;
alter table public.browser_extension_b2b_opportunity_stage_history enable row level security;
alter table public.browser_extension_b2b_next_best_actions enable row level security;
alter table public.browser_extension_b2b_outreach_strategies enable row level security;
alter table public.browser_extension_b2b_communication_contexts enable row level security;
alter table public.browser_extension_b2b_communication_drafts enable row level security;
alter table public.browser_extension_b2b_call_briefs enable row level security;
alter table public.browser_extension_b2b_field_visits enable row level security;
alter table public.browser_extension_b2b_meeting_briefs enable row level security;
alter table public.browser_extension_b2b_meeting_live_notes enable row level security;
alter table public.browser_extension_b2b_meeting_outcomes enable row level security;
alter table public.browser_extension_b2b_followups enable row level security;
alter table public.browser_extension_b2b_sequences enable row level security;
alter table public.browser_extension_b2b_sequence_steps enable row level security;
alter table public.browser_extension_b2b_sequence_enrollments enable row level security;
alter table public.browser_extension_b2b_sequence_events enable row level security;
alter table public.browser_extension_b2b_attribution enable row level security;
alter table public.browser_extension_b2b_referral_sources enable row level security;
alter table public.browser_extension_b2b_daily_snapshots enable row level security;
alter table public.browser_extension_b2b_timeline_events enable row level security;

update public.browser_extension_release_channels
set version='0.3.0', minimum_version='0.1.0', release_notes='Mega ZIP 3 B2B outreach, pipeline, meetings and daily revenue execution', updated_at=now()
where channel_key='pilot';

commit;
