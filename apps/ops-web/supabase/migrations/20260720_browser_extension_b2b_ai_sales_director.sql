begin;
create extension if not exists pgcrypto;

create table if not exists public.browser_extension_b2b_ai_recommendations (
  id uuid primary key default gen_random_uuid(), subject_type text not null, subject_id text not null,
  prospect_id uuid, opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  partner_id uuid references public.browser_extension_b2b_partners(id) on delete cascade,
  recommendation_type text not null, finding text not null, commercial_significance text,
  recommended_action text not null, expected_outcome text, revenue_impact numeric(14,2) not null default 0,
  risk_level text not null default 'medium', confidence numeric(7,4) not null default 0.5,
  truth_classification text not null default 'ai_recommendation', missing_evidence jsonb not null default '[]'::jsonb,
  status text not null default 'generated', model_key text not null, policy_version text not null,
  expires_at timestamptz, generated_by uuid not null, owner_id uuid, deadline timestamptz,
  approval_required boolean not null default false, disposition_reason text, disposed_by uuid, disposed_at timestamptz,
  superseded_by uuid, superseded_at timestamptz, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_ai_recommendation_subject_idx on public.browser_extension_b2b_ai_recommendations(subject_type,subject_id,status,created_at desc);
create index if not exists browser_ext_b2b_ai_recommendation_queue_idx on public.browser_extension_b2b_ai_recommendations(status,risk_level,deadline);

create table if not exists public.browser_extension_b2b_ai_recommendation_evidence (
  id uuid primary key default gen_random_uuid(), recommendation_id uuid not null references public.browser_extension_b2b_ai_recommendations(id) on delete cascade,
  evidence_type text not null, evidence_reference text, statement text not null, truth_classification text not null,
  source_timestamp timestamptz, metadata jsonb not null default '{}'::jsonb, created_by uuid not null, created_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_ai_evidence_recommendation_idx on public.browser_extension_b2b_ai_recommendation_evidence(recommendation_id,created_at);

create table if not exists public.browser_extension_b2b_pipeline_truth_assessments (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.browser_extension_b2b_opportunities(id) on delete cascade,
  prospect_id uuid not null, reported_stage text not null, recommended_stage text not null, stage_valid boolean not null,
  forecast_category text not null, confidence numeric(7,4) not null, evidence jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb, stale_days integer not null default 0,
  correction_applied boolean not null default false, correction_applied_by uuid, correction_applied_at timestamptz,
  assessed_by uuid not null, ruleset_version text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_pipeline_truth_opp_idx on public.browser_extension_b2b_pipeline_truth_assessments(opportunity_id,created_at desc);

create table if not exists public.browser_extension_b2b_forecast_snapshots (
  id uuid primary key default gen_random_uuid(), scope_type text not null, scope_reference text not null,
  forecast_period_start date not null, forecast_period_end date not null,
  total_pipeline_value numeric(14,2) not null default 0, weighted_forecast_value numeric(14,2) not null default 0,
  committed_value numeric(14,2) not null default 0, probable_value numeric(14,2) not null default 0,
  possible_value numeric(14,2) not null default 0, at_risk_value numeric(14,2) not null default 0,
  stale_value numeric(14,2) not null default 0, confidence numeric(7,4) not null default 0,
  evidence jsonb not null default '{}'::jsonb, missing_data jsonb not null default '[]'::jsonb,
  status text not null default 'generated', ruleset_version text not null, generated_by uuid not null,
  approved_by uuid, approved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_forecast_scope_idx on public.browser_extension_b2b_forecast_snapshots(scope_reference,forecast_period_end,created_at desc);

create table if not exists public.browser_extension_b2b_forecast_overrides (
  id uuid primary key default gen_random_uuid(), forecast_snapshot_id uuid references public.browser_extension_b2b_forecast_snapshots(id) on delete cascade,
  opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  requested_category text, requested_value numeric(14,2), reason text not null, evidence jsonb not null default '{}'::jsonb,
  status text not null default 'pending', requested_by uuid not null, decision_reason text, decided_by uuid, decided_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_revenue_risks (
  id uuid primary key default gen_random_uuid(), queue_key text not null, risk_type text not null,
  subject_type text not null, subject_id text not null, prospect_id uuid,
  opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  partner_id uuid references public.browser_extension_b2b_partners(id) on delete cascade,
  renewal_id uuid references public.browser_extension_b2b_renewals(id) on delete cascade,
  reason text not null, revenue_at_risk numeric(14,2) not null default 0, deadline timestamptz,
  owner_id uuid, recommended_action text, escalation_path text, evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open', detected_by uuid not null, assigned_by uuid, assigned_at timestamptz,
  escalated_by uuid, escalated_at timestamptz, resolution text, resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_revenue_risk_queue_idx on public.browser_extension_b2b_revenue_risks(queue_key,status,deadline);
create unique index if not exists browser_ext_b2b_revenue_risk_open_unique on public.browser_extension_b2b_revenue_risks(risk_type,subject_id) where status in ('open','assigned','escalated');

create table if not exists public.browser_extension_b2b_management_interventions (
  id uuid primary key default gen_random_uuid(), intervention_type text not null, subject_type text not null, subject_id text not null,
  prospect_id uuid, opportunity_id uuid references public.browser_extension_b2b_opportunities(id) on delete cascade,
  partner_id uuid references public.browser_extension_b2b_partners(id) on delete cascade,
  renewal_id uuid references public.browser_extension_b2b_renewals(id) on delete cascade,
  title text not null, blocker text, recommended_intervention text, required_outcome text,
  prohibited_commitments jsonb not null default '[]'::jsonb, revenue_at_risk numeric(14,2) not null default 0,
  owner_id uuid, executive_owner_id uuid, deadline timestamptz, status text not null default 'open', outcome text,
  created_by uuid not null, closed_by uuid, closed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_management_intervention_idx on public.browser_extension_b2b_management_interventions(status,deadline,created_at desc);

create table if not exists public.browser_extension_b2b_execution_quality_assessments (
  id uuid primary key default gen_random_uuid(), staff_user_id uuid not null, period_start timestamptz not null, period_end timestamptz not null,
  overall_score integer not null, dimensions jsonb not null default '{}'::jsonb, missing_data jsonb not null default '[]'::jsonb,
  evidence_summary jsonb not null default '{}'::jsonb, explanation text not null,
  assessed_by uuid not null, ruleset_version text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_execution_quality_staff_idx on public.browser_extension_b2b_execution_quality_assessments(staff_user_id,period_end desc);

create table if not exists public.browser_extension_b2b_execution_quality_patterns (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.browser_extension_b2b_execution_quality_assessments(id) on delete cascade,
  staff_user_id uuid not null, pattern_key text not null, title text not null, evidence jsonb not null default '{}'::jsonb,
  expected_behavior text not null, severity text not null default 'medium', status text not null default 'open',
  detected_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_coaching_missions (
  id uuid primary key default gen_random_uuid(), staff_user_id uuid not null, manager_id uuid not null,
  pattern_id uuid references public.browser_extension_b2b_execution_quality_patterns(id) on delete set null,
  skill_gap text not null, evidence jsonb not null default '{}'::jsonb, business_consequence text,
  expected_behavior text not null, required_action text not null, subject_type text, subject_id text,
  start_at timestamptz not null, due_at timestamptz not null, status text not null default 'created',
  completion_proof jsonb not null default '{}'::jsonb, commercial_outcome jsonb not null default '{}'::jsonb,
  assigned_at timestamptz, completed_by uuid, completed_at timestamptz, review_result text,
  reviewed_by uuid, reviewed_at timestamptz, followup_at timestamptz,
  created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_coaching_staff_idx on public.browser_extension_b2b_coaching_missions(staff_user_id,status,due_at);

create table if not exists public.browser_extension_b2b_territory_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(), scope_owner_id uuid not null,
  territory_scope jsonb not null default '[]'::jsonb, vertical_scope jsonb not null default '[]'::jsonb,
  by_city jsonb not null default '{}'::jsonb, by_vertical jsonb not null default '{}'::jsonb,
  account_count integer not null default 0, opportunity_count integer not null default 0,
  pipeline_value numeric(14,2) not null default 0, missing_data jsonb not null default '[]'::jsonb,
  calculated_by uuid not null, ruleset_version text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_territory_snapshot_scope_idx on public.browser_extension_b2b_territory_intelligence_snapshots(scope_owner_id,created_at desc);

create table if not exists public.browser_extension_b2b_executive_reports (
  id uuid primary key default gen_random_uuid(), report_type text not null, title text not null,
  period_start timestamptz, period_end timestamptz, scope_owner_id uuid not null,
  report_payload jsonb not null default '{}'::jsonb, missing_data jsonb not null default '[]'::jsonb,
  status text not null default 'generated', version_number integer not null default 1,
  generated_by uuid not null, evidence_count integer not null default 0, export_format text not null default 'workspace',
  approved_by uuid, approved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_executive_report_idx on public.browser_extension_b2b_executive_reports(scope_owner_id,report_type,created_at desc);

create table if not exists public.browser_extension_b2b_automation_definitions (
  id uuid primary key default gen_random_uuid(), name text not null, automation_type text not null,
  trigger_type text not null, trigger_config jsonb not null default '{}'::jsonb, conditions jsonb not null default '[]'::jsonb,
  data_scope jsonb not null default '{}'::jsonb, territory_scope jsonb not null default '{}'::jsonb,
  account_scope jsonb not null default '{}'::jsonb, autonomy_mode text not null default 'SUGGEST_ONLY',
  approval_rule jsonb not null default '{}'::jsonb, max_frequency_minutes integer not null default 60,
  deduplication_policy text not null default 'subject_and_window', execution_window jsonb not null default '{}'::jsonb,
  stop_conditions jsonb not null default '[]'::jsonb, status text not null default 'disabled', owner_id uuid not null,
  version_number integer not null default 1, created_by uuid not null, updated_by uuid,
  enabled_by uuid, enabled_at timestamptz, paused_by uuid, paused_at timestamptz, pause_reason text,
  suspended_by uuid, suspended_at timestamptz, suspension_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_automation_status_idx on public.browser_extension_b2b_automation_definitions(status,automation_type,updated_at desc);

create table if not exists public.browser_extension_b2b_automation_approvals (
  id uuid primary key default gen_random_uuid(), automation_id uuid not null references public.browser_extension_b2b_automation_definitions(id) on delete cascade,
  requested_action text not null, requested_payload jsonb not null default '{}'::jsonb, reason text,
  status text not null default 'pending', requested_by uuid not null, approver_role text,
  decision_reason text, decided_by uuid, decided_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_automation_runs (
  id uuid primary key default gen_random_uuid(), automation_id uuid not null references public.browser_extension_b2b_automation_definitions(id) on delete cascade,
  trigger_type text not null, trigger_payload jsonb not null default '{}'::jsonb, idempotency_key text not null,
  status text not null default 'running', started_by uuid not null, started_at timestamptz not null,
  attempt_number integer not null default 1, result_payload jsonb not null default '{}'::jsonb,
  error_code text, error_details jsonb not null default '{}'::jsonb, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(automation_id,idempotency_key)
);
create index if not exists browser_ext_b2b_automation_run_idx on public.browser_extension_b2b_automation_runs(automation_id,status,created_at desc);

create table if not exists public.browser_extension_b2b_automation_kill_switches (
  id uuid primary key default gen_random_uuid(), automation_id uuid references public.browser_extension_b2b_automation_definitions(id) on delete cascade,
  scope_type text not null, scope_reference text not null, reason text not null, active boolean not null default true,
  activated_by uuid not null, activated_at timestamptz not null, deactivated_by uuid, deactivated_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists browser_ext_b2b_kill_switch_active_idx on public.browser_extension_b2b_automation_kill_switches(active,scope_type,scope_reference);

create table if not exists public.browser_extension_b2b_ai_policy_versions (
  id uuid primary key default gen_random_uuid(), policy_key text not null, version text not null,
  rules jsonb not null default '{}'::jsonb, high_risk_actions jsonb not null default '[]'::jsonb,
  truth_classifications jsonb not null default '[]'::jsonb, status text not null default 'active',
  created_by uuid, created_at timestamptz not null default now(), unique(policy_key,version)
);
insert into public.browser_extension_b2b_ai_policy_versions(policy_key,version,rules,high_risk_actions,truth_classifications,status)
values ('angelcare_revenue_director','mega6-v1',
  '{"never_fabricate":true,"cite_evidence":true,"label_inference":true,"respect_permissions":true,"no_secret_surveillance":true}'::jsonb,
  '["external_communication","discounts","proposal_approval","contract_changes","payment_confirmation","partner_launch","tender_submission","opportunity_won","renewal_approval","executive_commitment","client_facing_promise"]'::jsonb,
  '["verified_fact","evidence_backed_inference","commercial_hypothesis","missing_information","user_reported_statement","client_reported_statement","ai_recommendation","approved_management_decision"]'::jsonb,
  'active')
on conflict (policy_key,version) do nothing;

alter table public.browser_extension_b2b_ai_recommendations enable row level security;
alter table public.browser_extension_b2b_ai_recommendation_evidence enable row level security;
alter table public.browser_extension_b2b_pipeline_truth_assessments enable row level security;
alter table public.browser_extension_b2b_forecast_snapshots enable row level security;
alter table public.browser_extension_b2b_forecast_overrides enable row level security;
alter table public.browser_extension_b2b_revenue_risks enable row level security;
alter table public.browser_extension_b2b_management_interventions enable row level security;
alter table public.browser_extension_b2b_execution_quality_assessments enable row level security;
alter table public.browser_extension_b2b_execution_quality_patterns enable row level security;
alter table public.browser_extension_b2b_coaching_missions enable row level security;
alter table public.browser_extension_b2b_territory_intelligence_snapshots enable row level security;
alter table public.browser_extension_b2b_executive_reports enable row level security;
alter table public.browser_extension_b2b_automation_definitions enable row level security;
alter table public.browser_extension_b2b_automation_approvals enable row level security;
alter table public.browser_extension_b2b_automation_runs enable row level security;
alter table public.browser_extension_b2b_automation_kill_switches enable row level security;
alter table public.browser_extension_b2b_ai_policy_versions enable row level security;

update public.browser_extension_release_channels
set version='0.6.0', minimum_version='0.1.0', release_notes='Mega ZIP 6 AI Sales Director, Management Command and Controlled Automation', updated_at=now()
where channel_key='pilot';

commit;
