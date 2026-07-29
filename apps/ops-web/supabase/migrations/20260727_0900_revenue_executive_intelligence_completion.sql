-- ANGELCARE Revenue Command Center — Excellence v11 / Mega ZIP 11
-- Executive Revenue Intelligence, Forecasting, Leakage, Scenario and Decision Orchestration
-- Additive, transactional and server-authorized. Existing Revenue systems remain authoritative.
begin;
create extension if not exists pgcrypto;

create or replace function public.revenue_executive_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.revenue_executive_forecast_models (
  id uuid primary key default gen_random_uuid(),
  model_key text not null unique,
  name text not null,
  description text not null default '',
  owner_label text not null default 'Direction Revenue',
  status text not null default 'draft' check (status in ('draft','review','approved','active','retired')),
  config jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_forecast_model_versions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.revenue_executive_forecast_models(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  rules jsonb not null default '{}'::jsonb,
  probability_boundaries jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','review','approved','active','superseded','retired')),
  effective_from timestamptz,
  effective_to timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  unique(model_id, version_number)
);

create table if not exists public.revenue_executive_forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_key text not null unique default ('EXF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  model_version_id uuid references public.revenue_executive_forecast_model_versions(id) on delete restrict,
  label text not null,
  horizon text not null default 'current_month',
  period_start date not null,
  period_end date,
  status text not null default 'generated' check (status in ('generated','review','approved','closed','superseded')),
  raw_pipeline_mad numeric(16,2) not null default 0,
  weighted_pipeline_mad numeric(16,2) not null default 0,
  upside_mad numeric(16,2) not null default 0,
  best_case_mad numeric(16,2) not null default 0,
  commit_mad numeric(16,2) not null default 0,
  contracted_mad numeric(16,2) not null default 0,
  collectible_mad numeric(16,2) not null default 0,
  payment_confirmed_mad numeric(16,2) not null default 0,
  realized_mad numeric(16,2) not null default 0,
  reversed_mad numeric(16,2) not null default 0,
  at_risk_mad numeric(16,2) not null default 0,
  summary jsonb not null default '{}'::jsonb,
  evidence_reference text,
  generated_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_forecast_lines (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.revenue_executive_forecast_snapshots(id) on delete cascade,
  source_entity_type text not null,
  source_entity_id text not null,
  source_label text not null,
  source_stage text,
  owner_label text,
  system_category text not null default 'pipeline',
  owner_category text,
  executive_category text,
  effective_category text not null default 'pipeline',
  system_amount_mad numeric(16,2) not null default 0,
  owner_amount_mad numeric(16,2),
  executive_amount_mad numeric(16,2),
  effective_amount_mad numeric(16,2) not null default 0,
  probability numeric(7,3) not null default 0 check (probability between 0 and 100),
  confidence numeric(7,3) not null default 0 check (confidence between 0 and 100),
  evidence_score numeric(7,3) not null default 0 check (evidence_score between 0 and 100),
  system_expected_date date,
  owner_expected_date date,
  executive_expected_date date,
  effective_expected_date date,
  last_activity_at timestamptz,
  rationale text,
  blockers jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(snapshot_id, source_entity_type, source_entity_id)
);

create table if not exists public.revenue_executive_forecast_submissions (
  id uuid primary key default gen_random_uuid(),
  forecast_line_id uuid not null references public.revenue_executive_forecast_lines(id) on delete cascade,
  amount_mad numeric(16,2) not null default 0,
  forecast_category text not null,
  expected_date date,
  probability numeric(7,3) check (probability between 0 and 100),
  rationale text not null,
  evidence_reference text,
  status text not null default 'submitted' check (status in ('submitted','review','accepted','rejected','superseded')),
  submitted_by uuid,
  submitted_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_forecast_overrides (
  id uuid primary key default gen_random_uuid(),
  forecast_line_id uuid not null references public.revenue_executive_forecast_lines(id) on delete cascade,
  override_amount_mad numeric(16,2),
  override_category text,
  override_expected_date date,
  reason text not null,
  evidence_reference text,
  review_at timestamptz,
  status text not null default 'active' check (status in ('active','expired','revoked','superseded')),
  created_by uuid,
  expired_by uuid,
  expired_at timestamptz,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_forecast_movements (
  id uuid primary key default gen_random_uuid(),
  forecast_line_id uuid not null references public.revenue_executive_forecast_lines(id) on delete cascade,
  movement_type text not null,
  previous_amount_mad numeric(16,2),
  new_amount_mad numeric(16,2),
  previous_category text,
  new_category text,
  previous_expected_date date,
  new_expected_date date,
  reason text,
  source_event text,
  actor_id uuid,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_forecast_accuracy_periods (
  id uuid primary key default gen_random_uuid(),
  period_key text not null unique,
  period_start date not null,
  period_end date not null,
  status text not null default 'open' check (status in ('open','calculating','closed')),
  forecast_mad numeric(16,2) not null default 0,
  actual_mad numeric(16,2) not null default 0,
  absolute_error_mad numeric(16,2) not null default 0,
  accuracy_percent numeric(7,3) not null default 0,
  bias_percent numeric(7,3) not null default 0,
  scorecard jsonb not null default '{}'::jsonb,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_signal_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  name text not null,
  entity_type text not null,
  owner_label text not null default 'Revenue Ops',
  status text not null default 'draft' check (status in ('draft','review','active','paused','retired')),
  current_version integer not null default 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_signal_rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.revenue_executive_signal_rules(id) on delete cascade,
  version_number integer not null,
  condition_json jsonb not null default '{}'::jsonb,
  severity text not null default 'warning',
  amount_logic jsonb not null default '{}'::jsonb,
  sla_hours integer not null default 24 check (sla_hours >= 0),
  escalation_json jsonb not null default '{}'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','active','superseded','retired')),
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  unique(rule_id, version_number)
);

create table if not exists public.revenue_executive_signals (
  id uuid primary key default gen_random_uuid(),
  signal_key text not null unique default ('SIG-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  rule_version_id uuid references public.revenue_executive_signal_rule_versions(id) on delete set null,
  source_entity_type text not null,
  source_entity_id text not null,
  title text not null,
  description text not null default '',
  severity text not null default 'warning' check (severity in ('informational','advisory','warning','high','critical')),
  affected_value_mad numeric(16,2) not null default 0,
  owner_label text,
  executive_sponsor_label text,
  due_at timestamptz,
  required_decision text,
  status text not null default 'open' check (status in ('open','acknowledged','intervention_created','dismissed','resolved','closed')),
  acknowledgement_note text,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_signal_evidence (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.revenue_executive_signals(id) on delete cascade,
  evidence_type text not null default 'source_record',
  source_type text,
  source_id text,
  evidence_reference text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_leakage_events (
  id uuid primary key default gen_random_uuid(),
  leakage_key text not null unique default ('LEAK-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  leakage_type text not null,
  source_entity_type text not null,
  source_entity_id text not null,
  title text not null,
  reason text not null,
  affected_value_mad numeric(16,2) not null default 0,
  confidence numeric(7,3) not null default 0 check (confidence between 0 and 100),
  severity text not null default 'warning',
  owner_label text,
  executive_sponsor_label text,
  due_at timestamptz,
  required_intervention text,
  status text not null default 'open' check (status in ('open','triage','intervention_created','recovering','resolved','closed','dismissed')),
  detection_rule_reference text,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  first_detected_at timestamptz not null default timezone('utc',now()),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_leakage_resolutions (
  id uuid primary key default gen_random_uuid(),
  leakage_event_id uuid not null references public.revenue_executive_leakage_events(id) on delete cascade,
  resolution_type text not null,
  resolution text not null,
  recovered_value_mad numeric(16,2) not null default 0,
  protected_value_mad numeric(16,2) not null default 0,
  lost_value_mad numeric(16,2) not null default 0,
  evidence_reference text not null,
  resolved_by uuid,
  resolved_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_interventions (
  id uuid primary key default gen_random_uuid(),
  intervention_key text not null unique default ('INT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  source_entity_type text not null,
  source_entity_id text,
  title text not null,
  root_cause text not null,
  affected_value_mad numeric(16,2) not null default 0,
  severity text not null default 'warning',
  priority_score numeric(9,3) not null default 0,
  owner_label text not null default 'Revenue Manager',
  executive_sponsor_label text,
  due_at timestamptz,
  decision_required text,
  required_outcome text,
  status text not null default 'detected' check (status in ('detected','triage','analysis','decision_required','approved_action','in_execution','monitoring','escalated','resolved','closed','rejected','deferred','cancelled')),
  evidence_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  closed_at timestamptz
);

create table if not exists public.revenue_executive_intervention_assignments (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references public.revenue_executive_interventions(id) on delete cascade,
  owner_label text not null,
  executive_sponsor_label text,
  assignment_type text not null default 'owner',
  assigned_by uuid,
  assigned_at timestamptz not null default timezone('utc',now()),
  ended_at timestamptz
);

create table if not exists public.revenue_executive_intervention_checkpoints (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references public.revenue_executive_interventions(id) on delete cascade,
  checkpoint_type text not null default 'progress',
  status text not null default 'recorded',
  note text not null,
  affected_value_mad numeric(16,2) not null default 0,
  evidence_reference text,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_decision_requests (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid references public.revenue_executive_interventions(id) on delete set null,
  title text not null,
  decision_statement text not null,
  affected_value_mad numeric(16,2) not null default 0,
  requested_authority text not null,
  decision_due_at timestamptz,
  status text not null default 'requested' check (status in ('requested','analysis','decided','deferred','cancelled')),
  evidence_reference text,
  requested_by uuid,
  requested_at timestamptz not null default timezone('utc',now()),
  decided_at timestamptz
);

create table if not exists public.revenue_executive_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_request_id uuid references public.revenue_executive_decision_requests(id) on delete set null,
  intervention_id uuid references public.revenue_executive_interventions(id) on delete set null,
  decision text not null,
  reason text not null,
  conditions text,
  affected_value_mad numeric(16,2) not null default 0,
  evidence_reference text,
  decided_by uuid,
  decided_at timestamptz not null default timezone('utc',now()),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_executive_intervention_actions (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references public.revenue_executive_interventions(id) on delete cascade,
  decision_id uuid references public.revenue_executive_decisions(id) on delete set null,
  action_type text not null,
  canonical_entity_type text,
  canonical_entity_id text,
  correlation_id text,
  title text not null,
  owner_label text,
  due_at timestamptz,
  status text not null default 'planned' check (status in ('planned','requested','in_progress','completed','failed','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_intervention_outcomes (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null unique references public.revenue_executive_interventions(id) on delete cascade,
  outcome text not null,
  protected_value_mad numeric(16,2) not null default 0,
  recovered_value_mad numeric(16,2) not null default 0,
  lost_value_mad numeric(16,2) not null default 0,
  before_metrics jsonb not null default '{}'::jsonb,
  after_metrics jsonb not null default '{}'::jsonb,
  evidence_reference text not null,
  closed_by uuid,
  closed_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_scenarios (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null unique default ('SCN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  title text not null,
  scenario_type text not null default 'expected',
  horizon text not null default 'current_month',
  status text not null default 'draft' check (status in ('draft','ready','running','completed','approved','expired','archived')),
  base_snapshot_id uuid references public.revenue_executive_forecast_snapshots(id) on delete set null,
  rationale text,
  evidence_reference text,
  current_version integer not null default 1,
  owner_label text not null default 'Direction Revenue',
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_scenario_versions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.revenue_executive_scenarios(id) on delete cascade,
  version_number integer not null,
  assumptions jsonb not null default '[]'::jsonb,
  base_metrics jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now()),
  unique(scenario_id, version_number)
);

create table if not exists public.revenue_executive_scenario_assumptions (
  id uuid primary key default gen_random_uuid(),
  scenario_version_id uuid not null references public.revenue_executive_scenario_versions(id) on delete cascade,
  assumption_key text not null,
  label text not null,
  value_json jsonb not null default '{}'::jsonb,
  source_reference text,
  rationale text,
  created_by uuid,
  created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_scenario_results (
  id uuid primary key default gen_random_uuid(),
  scenario_version_id uuid not null references public.revenue_executive_scenario_versions(id) on delete cascade,
  status text not null default 'simulated',
  baseline_metrics jsonb not null default '{}'::jsonb,
  simulated_metrics jsonb not null default '{}'::jsonb,
  differences jsonb not null default '{}'::jsonb,
  decision_implications jsonb not null default '[]'::jsonb,
  generated_by uuid,
  generated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_briefings (
  id uuid primary key default gen_random_uuid(),
  briefing_key text not null unique default ('BRF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  title text not null,
  briefing_type text not null default 'weekly' check (briefing_type in ('daily','weekly','monthly','quarterly','board','custom')),
  horizon text not null default 'current_month',
  status text not null default 'generated' check (status in ('generated','review','approved','distributed','archived')),
  source_snapshot_id uuid references public.revenue_executive_forecast_snapshots(id) on delete set null,
  narrative text,
  metrics jsonb not null default '{}'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  evidence_reference text,
  generated_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_executive_briefing_sections (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.revenue_executive_briefings(id) on delete cascade,
  section_key text not null,
  title text not null,
  narrative text not null default '',
  metrics jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc',now()),
  unique(briefing_id, section_key)
);

create table if not exists public.revenue_executive_data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null unique default ('DQ-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  source_entity_type text not null,
  source_entity_id text not null,
  issue_type text not null,
  title text not null,
  description text not null default '',
  severity text not null default 'warning',
  owner_label text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','acknowledged','correcting','resolved','dismissed')),
  evidence jsonb not null default '{}'::jsonb,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(source_entity_type, source_entity_id, issue_type, status)
);

create table if not exists public.revenue_executive_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id text,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  actor_id uuid,
  actor_role text,
  permission_context text,
  correlation_id text,
  affected_value_mad numeric(16,2) not null default 0,
  evidence_reference text,
  reason text,
  model_or_rule_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now())
);

-- Indexes for high-volume executive reads.
create index if not exists revenue_exec_snapshot_period_idx on public.revenue_executive_forecast_snapshots(period_start, period_end, created_at desc);
create index if not exists revenue_exec_line_source_idx on public.revenue_executive_forecast_lines(source_entity_type, source_entity_id);
create index if not exists revenue_exec_line_category_idx on public.revenue_executive_forecast_lines(effective_category, effective_expected_date);
create unique index if not exists revenue_exec_override_active_unique on public.revenue_executive_forecast_overrides(forecast_line_id) where status='active';
create index if not exists revenue_exec_signal_queue_idx on public.revenue_executive_signals(status, severity, due_at);
create unique index if not exists revenue_exec_signal_open_source_unique on public.revenue_executive_signals(source_entity_type, source_entity_id, title) where status in ('open','acknowledged','intervention_created');
create index if not exists revenue_exec_leakage_queue_idx on public.revenue_executive_leakage_events(status, severity, due_at);
create unique index if not exists revenue_exec_leakage_open_source_unique on public.revenue_executive_leakage_events(leakage_type, source_entity_type, source_entity_id) where status in ('open','triage','intervention_created','recovering');
create index if not exists revenue_exec_intervention_queue_idx on public.revenue_executive_interventions(status, due_at, affected_value_mad desc);
create unique index if not exists revenue_exec_intervention_active_source_unique on public.revenue_executive_interventions(source_entity_type, source_entity_id) where source_entity_id is not null and status not in ('closed','rejected','cancelled');
create index if not exists revenue_exec_decision_queue_idx on public.revenue_executive_decision_requests(status, decision_due_at);
create index if not exists revenue_exec_scenario_status_idx on public.revenue_executive_scenarios(status, updated_at desc);
create index if not exists revenue_exec_briefing_status_idx on public.revenue_executive_briefings(status, created_at desc);
create index if not exists revenue_exec_dq_queue_idx on public.revenue_executive_data_quality_issues(status, severity, due_at);
create index if not exists revenue_exec_audit_entity_idx on public.revenue_executive_audit_events(entity_type, entity_id, created_at desc);

-- Updated-at triggers.
do $$
declare t text;
begin
  foreach t in array array[
    'revenue_executive_forecast_models','revenue_executive_forecast_snapshots','revenue_executive_forecast_lines',
    'revenue_executive_signal_rules','revenue_executive_signals','revenue_executive_leakage_events',
    'revenue_executive_interventions','revenue_executive_intervention_actions','revenue_executive_scenarios',
    'revenue_executive_briefings','revenue_executive_data_quality_issues'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.revenue_executive_touch_updated_at()', t || '_touch_updated_at', t);
  end loop;
end $$;

create or replace function public.revenue_executive_guard_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Executive governance records are immutable after formalization.';
  end if;
  if coalesce(old.status,'') in ('approved','closed','distributed') then
    raise exception 'Approved or closed executive records are immutable.';
  end if;
  return new;
end;
$$;

drop trigger if exists revenue_executive_snapshot_immutable on public.revenue_executive_forecast_snapshots;
create trigger revenue_executive_snapshot_immutable before update or delete on public.revenue_executive_forecast_snapshots
for each row execute function public.revenue_executive_guard_immutable();
drop trigger if exists revenue_executive_scenario_immutable on public.revenue_executive_scenarios;
create trigger revenue_executive_scenario_immutable before update or delete on public.revenue_executive_scenarios
for each row execute function public.revenue_executive_guard_immutable();
drop trigger if exists revenue_executive_briefing_immutable on public.revenue_executive_briefings;
create trigger revenue_executive_briefing_immutable before update or delete on public.revenue_executive_briefings
for each row execute function public.revenue_executive_guard_immutable();

create or replace function public.revenue_executive_guard_decision_immutable()
returns trigger language plpgsql set search_path=public as $$
begin
  raise exception 'Final executive decisions are immutable.';
end $$;
drop trigger if exists revenue_executive_decision_immutable on public.revenue_executive_decisions;
create trigger revenue_executive_decision_immutable before update or delete on public.revenue_executive_decisions
for each row execute function public.revenue_executive_guard_decision_immutable();

create or replace function public.revenue_executive_write_audit(
  p_event_type text,
  p_entity_type text,
  p_entity_id text,
  p_actor_id uuid,
  p_reason text,
  p_evidence_reference text,
  p_affected_value_mad numeric,
  p_metadata jsonb
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.revenue_executive_audit_events(
    event_type,entity_type,entity_id,actor_id,reason,evidence_reference,affected_value_mad,metadata
  ) values (
    p_event_type,p_entity_type,p_entity_id,p_actor_id,p_reason,p_evidence_reference,
    greatest(coalesce(p_affected_value_mad,0),0),coalesce(p_metadata,'{}'::jsonb)
  ) returning id into v_id;
  return v_id;
end $$;

create or replace function public.revenue_executive_create_forecast_snapshot(
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_model_version_id uuid;
  v_snapshot public.revenue_executive_forecast_snapshots;
  v_line jsonb;
  v_source_type text;
  v_source_id text;
begin
  select mv.id into v_model_version_id
  from public.revenue_executive_forecast_model_versions mv
  where mv.status='active'
  order by mv.effective_from desc nulls last, mv.created_at desc
  limit 1;

  insert into public.revenue_executive_forecast_snapshots(
    model_version_id,label,horizon,period_start,period_end,status,
    raw_pipeline_mad,weighted_pipeline_mad,upside_mad,best_case_mad,commit_mad,
    contracted_mad,collectible_mad,payment_confirmed_mad,realized_mad,reversed_mad,at_risk_mad,
    summary,evidence_reference,generated_by
  ) values (
    v_model_version_id,
    coalesce(nullif(p_input->>'label',''),'Prévision exécutive ANGELCARE'),
    coalesce(nullif(p_input->>'horizon',''),'current_month'),
    coalesce((p_input->>'periodStart')::date,current_date),
    nullif(p_input->>'periodEnd','')::date,
    'generated',
    coalesce((p_input->'summary'->>'pipelineMad')::numeric,0),
    coalesce((p_input->'summary'->>'weightedPipelineMad')::numeric,0),
    coalesce((p_input->'summary'->>'upsideMad')::numeric,0),
    coalesce((p_input->'summary'->>'bestCaseMad')::numeric,0),
    coalesce((p_input->'summary'->>'commitMad')::numeric,0),
    coalesce((p_input->'summary'->>'contractedMad')::numeric,0),
    coalesce((p_input->'summary'->>'collectibleMad')::numeric,0),
    coalesce((p_input->'summary'->>'confirmedMad')::numeric,0),
    coalesce((p_input->'summary'->>'realizedMad')::numeric,0),
    coalesce((p_input->'summary'->>'reversedMad')::numeric,0),
    coalesce((p_input->'summary'->>'atRiskMad')::numeric,0),
    coalesce(p_input->'summary','{}'::jsonb),
    nullif(p_input->>'evidenceReference',''),
    p_actor_id
  ) returning * into v_snapshot;

  for v_line in select value from jsonb_array_elements(coalesce(p_input->'lines','[]'::jsonb))
  loop
    v_source_type := coalesce(nullif(v_line->>'sourceType',''),'opportunity');
    v_source_id := coalesce(nullif(v_line->>'sourceId',''),nullif(v_line->>'id',''),gen_random_uuid()::text);
    insert into public.revenue_executive_forecast_lines(
      snapshot_id,source_entity_type,source_entity_id,source_label,source_stage,owner_label,
      system_category,effective_category,system_amount_mad,effective_amount_mad,probability,
      confidence,evidence_score,system_expected_date,effective_expected_date,last_activity_at,
      rationale,blockers,evidence,metadata
    ) values (
      v_snapshot.id,v_source_type,v_source_id,
      coalesce(nullif(v_line->>'title',''),'Ligne de prévision'),
      nullif(v_line->>'stage',''),nullif(v_line->>'owner',''),
      coalesce(nullif(v_line->>'category',''),'pipeline'),
      coalesce(nullif(v_line->>'category',''),'pipeline'),
      coalesce((v_line->>'systemAmountMad')::numeric,0),
      coalesce((v_line->>'systemAmountMad')::numeric,0),
      greatest(0,least(100,coalesce((v_line->>'probability')::numeric,0))),
      greatest(0,least(100,coalesce((v_line->>'confidence')::numeric,0))),
      greatest(0,least(100,coalesce((v_line->>'evidenceScore')::numeric,0))),
      nullif(v_line->>'expectedDate','')::date,
      nullif(v_line->>'expectedDate','')::date,
      nullif(v_line->>'lastActivityAt','')::timestamptz,
      nullif(v_line->>'subtitle',''),
      coalesce(v_line->'blockers','[]'::jsonb),
      coalesce(v_line->'evidence','{}'::jsonb),
      v_line
    ) on conflict(snapshot_id,source_entity_type,source_entity_id) do nothing;
  end loop;

  perform public.revenue_executive_write_audit(
    'forecast_snapshot_created','forecast_snapshot',v_snapshot.id::text,p_actor_id,
    'Snapshot exécutif généré',nullif(p_input->>'evidenceReference',''),
    v_snapshot.weighted_pipeline_mad,p_input
  );
  return to_jsonb(v_snapshot);
end $$;

create or replace function public.revenue_executive_submit_forecast(
  p_forecast_line_id uuid,
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_line public.revenue_executive_forecast_lines; v_submission public.revenue_executive_forecast_submissions;
begin
  select * into v_line from public.revenue_executive_forecast_lines where id=p_forecast_line_id for update;
  if not found then raise exception 'Forecast line not found'; end if;
  insert into public.revenue_executive_forecast_submissions(
    forecast_line_id,amount_mad,forecast_category,expected_date,probability,rationale,evidence_reference,submitted_by
  ) values (
    p_forecast_line_id,greatest(coalesce((p_input->>'amountMad')::numeric,0),0),
    coalesce(nullif(p_input->>'category',''),'commit'),nullif(p_input->>'expectedDate','')::date,
    greatest(0,least(100,coalesce((p_input->>'probability')::numeric,0))),
    coalesce(nullif(p_input->>'rationale',''),'Forecast owner submission'),
    nullif(p_input->>'evidenceReference',''),p_actor_id
  ) returning * into v_submission;
  update public.revenue_executive_forecast_lines set
    owner_amount_mad=v_submission.amount_mad,
    owner_category=v_submission.forecast_category,
    owner_expected_date=v_submission.expected_date,
    effective_amount_mad=coalesce(executive_amount_mad,v_submission.amount_mad,system_amount_mad),
    effective_category=coalesce(executive_category,v_submission.forecast_category,system_category),
    effective_expected_date=coalesce(executive_expected_date,v_submission.expected_date,system_expected_date),
    rationale=v_submission.rationale
  where id=p_forecast_line_id;
  perform public.revenue_executive_write_audit('forecast_submitted','forecast_line',p_forecast_line_id::text,p_actor_id,v_submission.rationale,v_submission.evidence_reference,v_submission.amount_mad,p_input);
  return to_jsonb(v_submission);
end $$;

create or replace function public.revenue_executive_override_forecast(
  p_forecast_line_id uuid,
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_line public.revenue_executive_forecast_lines; v_override public.revenue_executive_forecast_overrides; v_mode text;
begin
  select * into v_line from public.revenue_executive_forecast_lines where id=p_forecast_line_id for update;
  if not found then raise exception 'Forecast line not found'; end if;
  v_mode := coalesce(nullif(p_input->>'mode',''),'apply');
  if v_mode='expire' then
    update public.revenue_executive_forecast_overrides set status='expired',expired_by=p_actor_id,expired_at=timezone('utc',now())
    where forecast_line_id=p_forecast_line_id and status='active'
    returning * into v_override;
    update public.revenue_executive_forecast_lines set
      executive_amount_mad=null,executive_category=null,executive_expected_date=null,
      effective_amount_mad=coalesce(owner_amount_mad,system_amount_mad),
      effective_category=coalesce(owner_category,system_category),
      effective_expected_date=coalesce(owner_expected_date,system_expected_date)
    where id=p_forecast_line_id;
  else
    update public.revenue_executive_forecast_overrides set status='superseded'
    where forecast_line_id=p_forecast_line_id and status='active';
    insert into public.revenue_executive_forecast_overrides(
      forecast_line_id,override_amount_mad,override_category,override_expected_date,reason,evidence_reference,review_at,created_by
    ) values (
      p_forecast_line_id,greatest(coalesce((p_input->>'amountMad')::numeric,0),0),
      coalesce(nullif(p_input->>'category',''),'commit'),nullif(p_input->>'expectedDate','')::date,
      coalesce(nullif(p_input->>'reason',''),'Executive override'),nullif(p_input->>'evidenceReference',''),
      nullif(p_input->>'reviewAt','')::timestamptz,p_actor_id
    ) returning * into v_override;
    update public.revenue_executive_forecast_lines set
      executive_amount_mad=v_override.override_amount_mad,executive_category=v_override.override_category,
      executive_expected_date=v_override.override_expected_date,effective_amount_mad=v_override.override_amount_mad,
      effective_category=v_override.override_category,effective_expected_date=v_override.override_expected_date
    where id=p_forecast_line_id;
  end if;
  perform public.revenue_executive_write_audit('forecast_override_'||v_mode,'forecast_line',p_forecast_line_id::text,p_actor_id,coalesce(p_input->>'reason',''),nullif(p_input->>'evidenceReference',''),coalesce(v_override.override_amount_mad,0),p_input);
  return coalesce(to_jsonb(v_override),'{}'::jsonb);
end $$;

create or replace function public.revenue_executive_create_intervention(
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_intervention public.revenue_executive_interventions;
begin
  insert into public.revenue_executive_interventions(
    source_entity_type,source_entity_id,title,root_cause,affected_value_mad,severity,
    priority_score,owner_label,executive_sponsor_label,due_at,required_outcome,status,evidence_reference,created_by,updated_by
  ) values (
    coalesce(nullif(p_input->>'sourceEntityType',''),'executive_signal'),nullif(p_input->>'sourceEntityId',''),
    coalesce(nullif(p_input->>'title',''),'Intervention exécutive'),coalesce(nullif(p_input->>'rootCause',''),'Analyse requise'),
    greatest(coalesce((p_input->>'affectedValueMad')::numeric,0),0),coalesce(nullif(p_input->>'severity',''),'warning'),
    greatest(coalesce((p_input->>'affectedValueMad')::numeric,0),0),
    coalesce(nullif(p_input->>'owner',''),'Revenue Manager'),nullif(p_input->>'executiveSponsor',''),
    nullif(p_input->>'dueAt','')::timestamptz,nullif(p_input->>'requiredOutcome',''),'detected',
    nullif(p_input->>'evidenceReference',''),p_actor_id,p_actor_id
  ) returning * into v_intervention;
  insert into public.revenue_executive_intervention_assignments(intervention_id,owner_label,executive_sponsor_label,assigned_by)
  values(v_intervention.id,v_intervention.owner_label,v_intervention.executive_sponsor_label,p_actor_id);
  perform public.revenue_executive_write_audit('intervention_created','intervention',v_intervention.id::text,p_actor_id,v_intervention.root_cause,v_intervention.evidence_reference,v_intervention.affected_value_mad,p_input);
  return to_jsonb(v_intervention);
exception when unique_violation then
  select * into v_intervention from public.revenue_executive_interventions
  where source_entity_type=coalesce(nullif(p_input->>'sourceEntityType',''),'executive_signal')
    and source_entity_id=nullif(p_input->>'sourceEntityId','')
    and status not in ('closed','rejected','cancelled')
  order by created_at desc limit 1;
  return to_jsonb(v_intervention);
end $$;

create or replace function public.revenue_executive_decide_intervention(
  p_target_id uuid,
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_request public.revenue_executive_decision_requests; v_intervention_id uuid; v_decision public.revenue_executive_decisions;
begin
  select * into v_request from public.revenue_executive_decision_requests where id=p_target_id for update;
  if found then v_intervention_id := v_request.intervention_id;
  else
    select id into v_intervention_id from public.revenue_executive_interventions where id=p_target_id for update;
    if not found then raise exception 'Decision target not found'; end if;
  end if;
  insert into public.revenue_executive_decisions(
    decision_request_id,intervention_id,decision,reason,conditions,affected_value_mad,evidence_reference,decided_by,metadata
  ) values (
    case when v_request.id is not null then v_request.id else null end,v_intervention_id,
    coalesce(nullif(p_input->>'decision',''),'approved'),coalesce(nullif(p_input->>'reason',''),'Decision recorded'),
    nullif(p_input->>'conditions',''),coalesce(v_request.affected_value_mad,0),nullif(p_input->>'evidenceReference',''),p_actor_id,p_input
  ) returning * into v_decision;
  if v_request.id is not null then
    update public.revenue_executive_decision_requests set status=case when v_decision.decision='deferred' then 'deferred' else 'decided' end,
      decided_at=timezone('utc',now()) where id=v_request.id;
  end if;
  if v_intervention_id is not null then
    update public.revenue_executive_interventions set
      status=case when v_decision.decision in ('approved','approved_with_conditions') then 'approved_action'
                  when v_decision.decision='deferred' then 'deferred'
                  when v_decision.decision='rejected' then 'rejected' else 'decision_required' end,
      updated_by=p_actor_id
    where id=v_intervention_id;
  end if;
  perform public.revenue_executive_write_audit('executive_decision_recorded','decision',v_decision.id::text,p_actor_id,v_decision.reason,v_decision.evidence_reference,v_decision.affected_value_mad,p_input);
  return to_jsonb(v_decision);
end $$;

create or replace function public.revenue_executive_close_intervention(
  p_intervention_id uuid,
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_intervention public.revenue_executive_interventions; v_outcome public.revenue_executive_intervention_outcomes;
begin
  select * into v_intervention from public.revenue_executive_interventions where id=p_intervention_id for update;
  if not found then raise exception 'Intervention not found'; end if;
  if nullif(p_input->>'evidenceReference','') is null then raise exception 'Closure evidence is required'; end if;
  insert into public.revenue_executive_intervention_outcomes(
    intervention_id,outcome,protected_value_mad,recovered_value_mad,lost_value_mad,evidence_reference,closed_by
  ) values (
    p_intervention_id,coalesce(nullif(p_input->>'outcome',''),'Intervention closed'),
    greatest(coalesce((p_input->>'protectedValueMad')::numeric,0),0),
    greatest(coalesce((p_input->>'recoveredValueMad')::numeric,0),0),
    greatest(coalesce((p_input->>'lostValueMad')::numeric,0),0),
    p_input->>'evidenceReference',p_actor_id
  ) on conflict(intervention_id) do update set
    outcome=excluded.outcome,protected_value_mad=excluded.protected_value_mad,
    recovered_value_mad=excluded.recovered_value_mad,lost_value_mad=excluded.lost_value_mad,
    evidence_reference=excluded.evidence_reference,closed_by=excluded.closed_by,closed_at=timezone('utc',now())
  returning * into v_outcome;
  update public.revenue_executive_interventions set status='closed',closed_at=timezone('utc',now()),updated_by=p_actor_id where id=p_intervention_id;
  perform public.revenue_executive_write_audit('intervention_closed','intervention',p_intervention_id::text,p_actor_id,v_outcome.outcome,v_outcome.evidence_reference,v_outcome.protected_value_mad+v_outcome.recovered_value_mad,p_input);
  return to_jsonb(v_outcome);
end $$;

create or replace function public.revenue_executive_manage_scenario(
  p_scenario_id uuid,
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_mode text; v_scenario public.revenue_executive_scenarios; v_version public.revenue_executive_scenario_versions;
begin
  v_mode := coalesce(nullif(p_input->>'mode',''),'create');
  if v_mode='create' then
    insert into public.revenue_executive_scenarios(title,scenario_type,horizon,rationale,evidence_reference,created_by)
    values(coalesce(nullif(p_input->>'title',''),'Scénario exécutif'),coalesce(nullif(p_input->>'scenarioType',''),'expected'),
      coalesce(nullif(p_input->>'horizon',''),'current_month'),nullif(p_input->>'rationale',''),nullif(p_input->>'evidenceReference',''),p_actor_id)
    returning * into v_scenario;
    insert into public.revenue_executive_scenario_versions(scenario_id,version_number,assumptions,status,created_by)
    values(v_scenario.id,1,coalesce(p_input->'assumptions','[]'::jsonb),'draft',p_actor_id) returning * into v_version;
  else
    select * into v_scenario from public.revenue_executive_scenarios where id=p_scenario_id for update;
    if not found then raise exception 'Scenario not found'; end if;
    select * into v_version from public.revenue_executive_scenario_versions where scenario_id=v_scenario.id order by version_number desc limit 1;
    if v_mode='run' then
      insert into public.revenue_executive_scenario_results(scenario_version_id,status,baseline_metrics,simulated_metrics,differences,decision_implications,generated_by)
      values(v_version.id,'simulated','{}'::jsonb,jsonb_build_object('scenarioType',v_scenario.scenario_type,'assumptions',v_version.assumptions),
        '{}'::jsonb,'[]'::jsonb,p_actor_id);
      update public.revenue_executive_scenarios set status='completed' where id=v_scenario.id returning * into v_scenario;
    elsif v_mode='approve' then
      update public.revenue_executive_scenarios set status='approved',approved_by=p_actor_id,approved_at=timezone('utc',now()) where id=v_scenario.id returning * into v_scenario;
    else raise exception 'Unsupported scenario mode';
    end if;
  end if;
  perform public.revenue_executive_write_audit('scenario_'||v_mode,'scenario',v_scenario.id::text,p_actor_id,coalesce(p_input->>'rationale',''),nullif(p_input->>'evidenceReference',''),0,p_input);
  return to_jsonb(v_scenario);
end $$;

create or replace function public.revenue_executive_manage_briefing(
  p_briefing_id uuid,
  p_input jsonb,
  p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_mode text; v_briefing public.revenue_executive_briefings; v_snapshot_id uuid;
begin
  v_mode := coalesce(nullif(p_input->>'mode',''),'generate');
  if v_mode='generate' then
    select id into v_snapshot_id from public.revenue_executive_forecast_snapshots order by created_at desc limit 1;
    insert into public.revenue_executive_briefings(
      title,briefing_type,horizon,source_snapshot_id,narrative,evidence_reference,generated_by
    ) values (
      coalesce(nullif(p_input->>'title',''),'Briefing exécutif ANGELCARE'),
      coalesce(nullif(p_input->>'briefingType',''),'weekly'),
      coalesce(nullif(p_input->>'horizon',''),'current_month'),v_snapshot_id,
      nullif(p_input->>'narrative',''),nullif(p_input->>'evidenceReference',''),p_actor_id
    ) returning * into v_briefing;
  elsif v_mode='approve' then
    update public.revenue_executive_briefings set status='approved',approved_by=p_actor_id,approved_at=timezone('utc',now())
    where id=p_briefing_id returning * into v_briefing;
    if not found then raise exception 'Briefing not found'; end if;
  else raise exception 'Unsupported briefing mode';
  end if;
  perform public.revenue_executive_write_audit('briefing_'||v_mode,'briefing',v_briefing.id::text,p_actor_id,coalesce(p_input->>'narrative',''),nullif(p_input->>'evidenceReference',''),0,p_input);
  return to_jsonb(v_briefing);
end $$;

-- Seed one transparent rules-based model and version.
insert into public.revenue_executive_forecast_models(model_key,name,description,status,config)
values(
  'rules_v1','Prévision Revenue explicable v1',
  'Modèle déterministe basé sur stade, probabilité, activité, preuves, contrat, paiement et réalisation.',
  'active',
  '{"opaque_ai":false,"currency":"Dh","categories":["excluded","pipeline","upside","best_case","commit","contracted","collectible","payment_confirmed","realized","reversed"]}'::jsonb
)
on conflict(model_key) do update set name=excluded.name,description=excluded.description,status='active',config=excluded.config;

insert into public.revenue_executive_forecast_model_versions(model_id,version_number,rules,probability_boundaries,status,effective_from)
select id,1,
  '{"explainable":true,"source_lineage_required":true,"realized_from_realization_events_only":true,"reversals_respected":true}'::jsonb,
  '{"pipeline":[0,34.999],"upside":[35,59.999],"best_case":[60,79.999],"commit":[80,100]}'::jsonb,
  'active',timezone('utc',now())
from public.revenue_executive_forecast_models where model_key='rules_v1'
on conflict(model_id,version_number) do update set rules=excluded.rules,probability_boundaries=excluded.probability_boundaries,status='active';

-- Service-role-only support layer.
do $$
declare t text;
begin
  foreach t in array array[
    'revenue_executive_forecast_models','revenue_executive_forecast_model_versions','revenue_executive_forecast_snapshots',
    'revenue_executive_forecast_lines','revenue_executive_forecast_submissions','revenue_executive_forecast_overrides',
    'revenue_executive_forecast_movements','revenue_executive_forecast_accuracy_periods','revenue_executive_signal_rules',
    'revenue_executive_signal_rule_versions','revenue_executive_signals','revenue_executive_signal_evidence',
    'revenue_executive_leakage_events','revenue_executive_leakage_resolutions','revenue_executive_interventions',
    'revenue_executive_intervention_assignments','revenue_executive_intervention_checkpoints','revenue_executive_decision_requests',
    'revenue_executive_decisions','revenue_executive_intervention_actions','revenue_executive_intervention_outcomes',
    'revenue_executive_scenarios','revenue_executive_scenario_versions','revenue_executive_scenario_assumptions',
    'revenue_executive_scenario_results','revenue_executive_briefings','revenue_executive_briefing_sections',
    'revenue_executive_data_quality_issues','revenue_executive_audit_events'
  ]
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant all on table public.%I to service_role',t);
  end loop;
end $$;

revoke all on function public.revenue_executive_write_audit(text,text,text,uuid,text,text,numeric,jsonb) from public, anon, authenticated;
revoke all on function public.revenue_executive_create_forecast_snapshot(jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_submit_forecast(uuid,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_override_forecast(uuid,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_create_intervention(jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_decide_intervention(uuid,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_close_intervention(uuid,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_manage_scenario(uuid,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.revenue_executive_manage_briefing(uuid,jsonb,uuid) from public, anon, authenticated;

grant execute on function public.revenue_executive_write_audit(text,text,text,uuid,text,text,numeric,jsonb) to service_role;
grant execute on function public.revenue_executive_create_forecast_snapshot(jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_submit_forecast(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_override_forecast(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_create_intervention(jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_decide_intervention(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_close_intervention(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_manage_scenario(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_executive_manage_briefing(uuid,jsonb,uuid) to service_role;

create or replace view public.revenue_executive_forecast_command_view
with (security_invoker=true) as
select
  l.*,
  s.snapshot_key,
  s.label as snapshot_label,
  s.horizon,
  s.period_start,
  s.period_end,
  s.status as snapshot_status
from public.revenue_executive_forecast_lines l
join public.revenue_executive_forecast_snapshots s on s.id=l.snapshot_id;

create or replace view public.revenue_executive_intervention_command_view
with (security_invoker=true) as
select
  i.*,
  coalesce(o.protected_value_mad,0) as protected_value_mad,
  coalesce(o.recovered_value_mad,0) as recovered_value_mad,
  coalesce(o.lost_value_mad,0) as lost_value_mad,
  o.outcome,
  o.evidence_reference as closure_evidence_reference
from public.revenue_executive_interventions i
left join public.revenue_executive_intervention_outcomes o on o.intervention_id=i.id;


-- Restrict Phase 11 command views to server-authorized access only.
revoke all on table public.revenue_executive_forecast_command_view
  from public, anon, authenticated;

revoke all on table public.revenue_executive_intervention_command_view
  from public, anon, authenticated;

grant select on table public.revenue_executive_forecast_command_view
  to service_role;

grant select on table public.revenue_executive_intervention_command_view
  to service_role;

commit;
