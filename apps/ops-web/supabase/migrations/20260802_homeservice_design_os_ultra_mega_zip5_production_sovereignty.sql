begin;
select pg_advisory_xact_lock(84746005);

do $$
begin
  if to_regclass('public.hsd_service_families') is null
     or to_regclass('public.hsd_planning_requests') is null
     or to_regclass('public.hsd_sellables') is null
     or to_regclass('public.hsd_handoff_requests') is null
     or to_regclass('public.missions') is null then
    raise exception 'UMZ1–UMZ4 and CARELINK baselines are required before UMZ5';
  end if;
end $$;

create extension if not exists pgcrypto;

create or replace function public.hsd_umz5_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

create or replace function public.hsd_umz5_reject_mutation()
returns trigger language plpgsql as $$
begin raise exception 'Immutable HomeService sovereignty record cannot be changed'; end $$;

create table if not exists public.hsd_performance_metric_definitions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, label text not null, description text, unit text not null default 'count', source_domain text not null, calculation_key text not null, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_performance_snapshots (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 snapshot_type text not null, period_start timestamptz, period_end timestamptz, status text not null default 'complete', source_refs jsonb not null default '{}'::jsonb, generated_by text, generated_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists public.hsd_performance_metric_values (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 snapshot_id uuid not null references public.hsd_performance_snapshots(id) on delete cascade, definition_id uuid not null references public.hsd_performance_metric_definitions(id), value numeric, numerator numeric, denominator numeric, status text not null default 'unknown', source text, measured_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(snapshot_id,definition_id)
);

create table if not exists public.hsd_mission_variance_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 handoff_id uuid references public.hsd_handoff_requests(id), carelink_parent_mission_id bigint, scope text not null default 'mission', status text not null default 'running', started_by text, started_at timestamptz not null default now(), completed_at timestamptz, summary jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_mission_variance_findings (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 run_id uuid not null references public.hsd_mission_variance_runs(id) on delete cascade, handoff_id uuid references public.hsd_handoff_requests(id), carelink_mission_id bigint not null, carelink_sub_mission_id bigint, domain text not null, planned_value jsonb, actual_value jsonb, variance_value numeric, classification text not null, severity text not null default 'warning', reason text, customer_impact text, quality_impact text, commercial_impact text, status text not null default 'open', created_at timestamptz not null default now(), resolved_at timestamptz
);

create table if not exists public.hsd_service_outcome_records (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 carelink_mission_id bigint not null, handoff_id uuid references public.hsd_handoff_requests(id), sellable_version_id uuid references public.hsd_sellable_versions(id), category_version_id uuid, outcome_domain text not null, status text not null default 'draft', recorded_by text, recorded_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists public.hsd_service_outcome_measurements (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 outcome_record_id uuid not null references public.hsd_service_outcome_records(id) on delete cascade, measure_code text not null, label text not null, target_value jsonb, actual_value jsonb, achieved boolean, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_customer_feedback (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 carelink_mission_id bigint, sellable_version_id uuid references public.hsd_sellable_versions(id), customer_ref text not null default '', rating smallint check(rating between 1 and 5), csat smallint check(csat between 1 and 5), nps smallint check(nps between 0 and 10), effort_score smallint check(effort_score between 1 and 5), outcome_score smallint check(outcome_score between 1 and 5), narrative text, consent_reference text, created_by text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_customer_experience_cases (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, case_type text not null, severity text not null default 'warning', status text not null default 'open', customer_ref text not null default '', beneficiary_ref text, carelink_mission_id bigint, sellable_version_id uuid references public.hsd_sellable_versions(id), technical_plan_version_id uuid, summary text, customer_statement text, customer_confirmed boolean not null default false, customer_confirmed_at timestamptz, owner_id text, due_at timestamptz, opened_at timestamptz not null default now(), closed_at timestamptz, created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code), check(status not in ('resolved','closed') or customer_confirmed=true)
);

create table if not exists public.hsd_customer_experience_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 case_id uuid not null references public.hsd_customer_experience_cases(id) on delete cascade, event_type text not null, from_status text, to_status text, detail text, evidence jsonb not null default '{}'::jsonb, actor_id text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_customer_recovery_actions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 case_id uuid not null references public.hsd_customer_experience_cases(id) on delete cascade, action_type text not null, status text not null default 'proposed', description text, commercial_consequence jsonb not null default '{}'::jsonb, owner_id text, due_at timestamptz, completed_at timestamptz, approved_by text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_customer_confirmation_records (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 case_id uuid not null references public.hsd_customer_experience_cases(id) on delete cascade, confirmation_type text not null, confirmed boolean not null, channel text, statement text, evidence jsonb not null default '{}'::jsonb, confirmed_at timestamptz not null default now(), recorded_by text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_quality_signals (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, signal_type text not null, severity text not null default 'warning', status text not null default 'open', title text not null, summary text, customer_impact text, operational_impact text, commercial_impact text, source_count integer not null default 0, owner_id text, due_at timestamptz, created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_quality_signal_sources (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 signal_id uuid not null references public.hsd_quality_signals(id) on delete cascade, source_type text not null, source_id text not null, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(signal_id,source_type,source_id)
);

create table if not exists public.hsd_quality_signal_impacts (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 signal_id uuid not null references public.hsd_quality_signals(id) on delete cascade, impact_domain text not null, severity text not null, detail text, estimated_value numeric, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_root_cause_analyses (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 signal_id uuid not null references public.hsd_quality_signals(id), status text not null default 'draft', symptom text not null, approved_cause text, method text not null default 'five_whys', approved_by text, approved_at timestamptz, created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.hsd_root_cause_factors (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 analysis_id uuid not null references public.hsd_root_cause_analyses(id) on delete cascade, factor_type text not null, sequence integer not null default 1, statement text not null, evidence jsonb not null default '{}'::jsonb, confirmed boolean not null default false, created_at timestamptz not null default now()
);

create table if not exists public.hsd_improvement_proposals (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, signal_id uuid references public.hsd_quality_signals(id), target_type text not null, target_id text not null, status text not null default 'draft', title text not null, hypothesis text, expected_benefit text, risk_summary text, safety_review_required boolean not null default true, pilot_required boolean not null default true, created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_improvement_impacts (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 proposal_id uuid not null references public.hsd_improvement_proposals(id) on delete cascade, domain text not null, current_state jsonb, proposed_state jsonb, expected_effect text, risk_level text, rollback_plan text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_improvement_reviews (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 proposal_id uuid not null references public.hsd_improvement_proposals(id) on delete cascade, discipline text not null, decision text not null, findings text, reviewer_id text not null, reviewed_at timestamptz not null default now(), unique(proposal_id,discipline,reviewer_id)
);

create table if not exists public.hsd_improvement_decisions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 proposal_id uuid not null references public.hsd_improvement_proposals(id), decision text not null, reason text not null, decided_by text not null, decided_at timestamptz not null default now(), snapshot jsonb not null default '{}'::jsonb
);

create table if not exists public.hsd_improvement_releases (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 proposal_id uuid not null references public.hsd_improvement_proposals(id), target_version_id text not null, release_status text not null default 'draft', pilot_id uuid, released_by text, released_at timestamptz, rollback_reference text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_quality_board_sessions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, title text not null, status text not null default 'scheduled', scheduled_at timestamptz, chair_id text, disciplines text[] not null default '{}', minutes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_quality_board_agenda (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 session_id uuid not null references public.hsd_quality_board_sessions(id) on delete cascade, source_type text not null, source_id text not null, title text not null, priority text not null default 'normal', owner_id text, sort_order integer not null default 0, created_at timestamptz not null default now()
);

create table if not exists public.hsd_quality_board_decisions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 session_id uuid not null references public.hsd_quality_board_sessions(id), agenda_id uuid references public.hsd_quality_board_agenda(id), decision text not null, reason text not null, consequence text, owner_id text, due_at timestamptz, decided_by text not null, decided_at timestamptz not null default now()
);

create table if not exists public.hsd_capacity_forecasts (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 forecast_type text not null, period_start date not null, period_end date not null, city text, service_category_id uuid, expected_mission_hours numeric, expected_caregiver_hours numeric, backup_hours numeric, transport_demand numeric, confidence numeric check(confidence between 0 and 1), status text not null default 'forecast', assumptions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_capacity_findings (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 forecast_id uuid references public.hsd_capacity_forecasts(id), finding_type text not null, severity text not null default 'warning', dimension text not null, gap_value numeric, detail text, recommendation text, status text not null default 'open', created_at timestamptz not null default now()
);

create table if not exists public.hsd_workforce_capability_findings (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 competency_code text not null, city text, required_hours numeric, available_hours numeric, gap_hours numeric, severity text not null default 'warning', finding_type text not null, recommendation text, status text not null default 'open', created_at timestamptz not null default now()
);

create table if not exists public.hsd_health_check_definitions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, label text not null, description text, domain text not null, blocking boolean not null default false, expected_cadence_minutes integer not null default 1440, active boolean not null default true, created_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_health_check_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 definition_id uuid not null references public.hsd_health_check_definitions(id), state text not null default 'unknown', verified boolean not null default false, detail text, evidence jsonb not null default '{}'::jsonb, checked_by text, checked_at timestamptz not null default now(), created_at timestamptz not null default now(), check(state<>'healthy' or verified=true)
);

create table if not exists public.hsd_alert_rules (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, title text not null, trigger_type text not null, source_domain text not null, severity text not null, conditions jsonb not null default '{}'::jsonb, escalation_route jsonb not null default '{}'::jsonb, owner_id text, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_alert_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 rule_id uuid references public.hsd_alert_rules(id), code text not null, severity text not null, status text not null default 'open', title text not null, source_type text not null, source_id text not null, owner_id text, due_at timestamptz, acknowledged_at timestamptz, resolved_at timestamptz, resolution_evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_enterprise_reconciliation_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 scope text not null default 'full', status text not null default 'running', correlation_id uuid not null default gen_random_uuid(), critical_count integer not null default 0, finding_count integer not null default 0, started_by text, started_at timestamptz not null default now(), completed_at timestamptz, summary jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_enterprise_reconciliation_findings (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 run_id uuid not null references public.hsd_enterprise_reconciliation_runs(id) on delete cascade, domain text not null, severity text not null default 'warning', status text not null default 'open', source_type text, source_id text, target_type text, target_id text, expected_value jsonb, actual_value jsonb, detail text, recovery_action text, created_at timestamptz not null default now(), resolved_at timestamptz
);

create table if not exists public.hsd_production_readiness_controls (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, label text not null, description text, sort_order integer not null, blocking boolean not null default true, status text not null default 'not_started', owner_id text, verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_production_readiness_evidence (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 control_id uuid not null references public.hsd_production_readiness_controls(id) on delete cascade, status text not null, evidence_type text not null, evidence jsonb not null default '{}'::jsonb, notes text, submitted_by text not null, submitted_at timestamptz not null default now(), verified_by text, verified_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.hsd_production_release_decisions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 release_code text not null, decision text not null, reason text not null, readiness_snapshot jsonb not null, decided_by text not null, decided_at timestamptz not null default now(), created_at timestamptz not null default now(), unique(tenant_id,release_code)
);

create table if not exists public.hsd_pilot_programmes (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, title text not null, business_purpose text, status text not null default 'draft', service_category_ids uuid[] not null default '{}', sellable_version_ids uuid[] not null default '{}', cities text[] not null default '{}', start_date date, end_date date, mission_limit integer not null default 0, commercial_exposure_limit numeric, success_criteria jsonb not null default '{}'::jsonb, stop_conditions jsonb not null default '{}'::jsonb, executive_owner_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_pilot_measurements (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 pilot_id uuid not null references public.hsd_pilot_programmes(id) on delete cascade, measure_code text not null, value numeric, unit text, evidence jsonb not null default '{}'::jsonb, measured_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists public.hsd_pilot_decisions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 pilot_id uuid not null references public.hsd_pilot_programmes(id), decision text not null, reason text not null, evidence jsonb not null default '{}'::jsonb, decided_by text not null, decided_at timestamptz not null default now()
);

create table if not exists public.hsd_system_incidents (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, incident_type text not null, severity text not null, status text not null default 'detected', title text not null, summary text, owner_id text, detected_at timestamptz not null default now(), resolved_at timestamptz, created_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_system_incident_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 incident_id uuid not null references public.hsd_system_incidents(id) on delete cascade, event_type text not null, from_status text, to_status text, detail text, evidence jsonb not null default '{}'::jsonb, actor_id text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_system_incident_reviews (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 incident_id uuid not null references public.hsd_system_incidents(id), root_cause text not null, lessons text, corrective_actions jsonb not null default '[]'::jsonb, approved_by text, approved_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.hsd_backup_registry (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 backup_type text not null, scope text not null, environment text not null, status text not null, started_at timestamptz, completed_at timestamptz, storage_reference text, retention_until date, encryption_verified boolean not null default false, operator_id text, verification_evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.hsd_restore_tests (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 backup_id uuid not null references public.hsd_backup_registry(id), test_environment text not null, status text not null default 'planned', started_at timestamptz, completed_at timestamptz, records_verified jsonb not null default '{}'::jsonb, application_smoke_status text, carelink_lineage_status text, rls_status text, failure text, corrective_action text, approved_by text, created_at timestamptz not null default now()
);

create table if not exists public.hsd_security_reviews (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, scope text not null, status text not null default 'open', reviewer_id text, started_at timestamptz not null default now(), completed_at timestamptz, summary text, created_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_security_findings (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 review_id uuid not null references public.hsd_security_reviews(id) on delete cascade, domain text not null, severity text not null, status text not null default 'open', title text not null, detail text, corrective_action text, owner_id text, due_at timestamptz, evidence jsonb not null default '{}'::jsonb, verified_by text, verified_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.hsd_retention_policies (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, data_category text not null, purpose text not null, retention_days integer not null, archival_rule text, deletion_rule text, hold_conditions jsonb not null default '{}'::jsonb, access_authority text[] not null default '{}', status text not null default 'draft', version_number integer not null default 1, effective_from date, approved_by text, approved_at timestamptz, created_at timestamptz not null default now(), unique(tenant_id,code,version_number)
);

create table if not exists public.hsd_runbooks (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 code text not null, title text not null, domain text not null, status text not null default 'draft', active_version_id uuid, owner_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,code)
);

create table if not exists public.hsd_runbook_versions (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 runbook_id uuid not null references public.hsd_runbooks(id) on delete cascade, version_number integer not null, procedure jsonb not null default '[]'::jsonb, rollback_steps jsonb not null default '[]'::jsonb, status text not null default 'draft', approved_by text, approved_at timestamptz, created_at timestamptz not null default now(), unique(runbook_id,version_number)
);

create table if not exists public.hsd_change_freezes (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 release_code text not null, status text not null default 'planned', freeze_start timestamptz not null, freeze_end timestamptz not null, allowed_emergency_changes jsonb not null default '[]'::jsonb, rollback_reference text, approver_id text, approved_at timestamptz, created_at timestamptz not null default now(), check(freeze_end>freeze_start)
);

create table if not exists public.hsd_release_records (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 release_code text not null, application_version text not null, migrations text[] not null default '{}', change_summary text, risk_classification text, status text not null default 'planned', deployment_evidence jsonb not null default '{}'::jsonb, smoke_evidence jsonb not null default '{}'::jsonb, rollback_reference text, released_by text, released_at timestamptz, created_at timestamptz not null default now(), unique(tenant_id,release_code)
);

create table if not exists public.hsd_intelligence_advisory_runs (
 id uuid primary key default gen_random_uuid(),
 tenant_id text not null default 'angelcare-main',
 task text not null, requested_route text not null default 'openrouter/free', actual_model text, provider_response_id text, status text not null default 'running', usage jsonb not null default '{}'::jsonb, duration_ms integer, input_snapshot jsonb not null default '{}'::jsonb, output jsonb, failure_message text, started_at timestamptz not null default now(), completed_at timestamptz, created_by text, created_at timestamptz not null default now(), check(requested_route='openrouter/free')
);

drop trigger if exists trg_hsd_performance_metric_definitions_updated_at on public.hsd_performance_metric_definitions;
create trigger trg_hsd_performance_metric_definitions_updated_at before update on public.hsd_performance_metric_definitions for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_customer_experience_cases_updated_at on public.hsd_customer_experience_cases;
create trigger trg_hsd_customer_experience_cases_updated_at before update on public.hsd_customer_experience_cases for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_quality_signals_updated_at on public.hsd_quality_signals;
create trigger trg_hsd_quality_signals_updated_at before update on public.hsd_quality_signals for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_root_cause_analyses_updated_at on public.hsd_root_cause_analyses;
create trigger trg_hsd_root_cause_analyses_updated_at before update on public.hsd_root_cause_analyses for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_improvement_proposals_updated_at on public.hsd_improvement_proposals;
create trigger trg_hsd_improvement_proposals_updated_at before update on public.hsd_improvement_proposals for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_quality_board_sessions_updated_at on public.hsd_quality_board_sessions;
create trigger trg_hsd_quality_board_sessions_updated_at before update on public.hsd_quality_board_sessions for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_alert_rules_updated_at on public.hsd_alert_rules;
create trigger trg_hsd_alert_rules_updated_at before update on public.hsd_alert_rules for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_production_readiness_controls_updated_at on public.hsd_production_readiness_controls;
create trigger trg_hsd_production_readiness_controls_updated_at before update on public.hsd_production_readiness_controls for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_pilot_programmes_updated_at on public.hsd_pilot_programmes;
create trigger trg_hsd_pilot_programmes_updated_at before update on public.hsd_pilot_programmes for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_system_incidents_updated_at on public.hsd_system_incidents;
create trigger trg_hsd_system_incidents_updated_at before update on public.hsd_system_incidents for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_runbooks_updated_at on public.hsd_runbooks;
create trigger trg_hsd_runbooks_updated_at before update on public.hsd_runbooks for each row execute function public.hsd_umz5_set_updated_at();

drop trigger if exists trg_hsd_performance_snapshots_immutable on public.hsd_performance_snapshots;
create trigger trg_hsd_performance_snapshots_immutable before update or delete on public.hsd_performance_snapshots for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_performance_metric_values_immutable on public.hsd_performance_metric_values;
create trigger trg_hsd_performance_metric_values_immutable before update or delete on public.hsd_performance_metric_values for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_customer_feedback_immutable on public.hsd_customer_feedback;
create trigger trg_hsd_customer_feedback_immutable before update or delete on public.hsd_customer_feedback for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_customer_confirmation_records_immutable on public.hsd_customer_confirmation_records;
create trigger trg_hsd_customer_confirmation_records_immutable before update or delete on public.hsd_customer_confirmation_records for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_improvement_decisions_immutable on public.hsd_improvement_decisions;
create trigger trg_hsd_improvement_decisions_immutable before update or delete on public.hsd_improvement_decisions for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_quality_board_decisions_immutable on public.hsd_quality_board_decisions;
create trigger trg_hsd_quality_board_decisions_immutable before update or delete on public.hsd_quality_board_decisions for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_production_release_decisions_immutable on public.hsd_production_release_decisions;
create trigger trg_hsd_production_release_decisions_immutable before update or delete on public.hsd_production_release_decisions for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_pilot_decisions_immutable on public.hsd_pilot_decisions;
create trigger trg_hsd_pilot_decisions_immutable before update or delete on public.hsd_pilot_decisions for each row execute function public.hsd_umz5_reject_mutation();

drop trigger if exists trg_hsd_system_incident_reviews_immutable on public.hsd_system_incident_reviews;
create trigger trg_hsd_system_incident_reviews_immutable before update or delete on public.hsd_system_incident_reviews for each row execute function public.hsd_umz5_reject_mutation();

alter table public.hsd_performance_metric_definitions enable row level security;
drop policy if exists hsd_performance_metric_definitions_tenant_select on public.hsd_performance_metric_definitions;
create policy hsd_performance_metric_definitions_tenant_select on public.hsd_performance_metric_definitions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_performance_metric_definitions to authenticated;
grant all on public.hsd_performance_metric_definitions to service_role;

alter table public.hsd_performance_snapshots enable row level security;
drop policy if exists hsd_performance_snapshots_tenant_select on public.hsd_performance_snapshots;
create policy hsd_performance_snapshots_tenant_select on public.hsd_performance_snapshots for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_performance_snapshots to authenticated;
grant all on public.hsd_performance_snapshots to service_role;

alter table public.hsd_performance_metric_values enable row level security;
drop policy if exists hsd_performance_metric_values_tenant_select on public.hsd_performance_metric_values;
create policy hsd_performance_metric_values_tenant_select on public.hsd_performance_metric_values for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_performance_metric_values to authenticated;
grant all on public.hsd_performance_metric_values to service_role;

alter table public.hsd_mission_variance_runs enable row level security;
drop policy if exists hsd_mission_variance_runs_tenant_select on public.hsd_mission_variance_runs;
create policy hsd_mission_variance_runs_tenant_select on public.hsd_mission_variance_runs for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_mission_variance_runs to authenticated;
grant all on public.hsd_mission_variance_runs to service_role;

alter table public.hsd_mission_variance_findings enable row level security;
drop policy if exists hsd_mission_variance_findings_tenant_select on public.hsd_mission_variance_findings;
create policy hsd_mission_variance_findings_tenant_select on public.hsd_mission_variance_findings for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_mission_variance_findings to authenticated;
grant all on public.hsd_mission_variance_findings to service_role;

alter table public.hsd_service_outcome_records enable row level security;
drop policy if exists hsd_service_outcome_records_tenant_select on public.hsd_service_outcome_records;
create policy hsd_service_outcome_records_tenant_select on public.hsd_service_outcome_records for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_service_outcome_records to authenticated;
grant all on public.hsd_service_outcome_records to service_role;

alter table public.hsd_service_outcome_measurements enable row level security;
drop policy if exists hsd_service_outcome_measurements_tenant_select on public.hsd_service_outcome_measurements;
create policy hsd_service_outcome_measurements_tenant_select on public.hsd_service_outcome_measurements for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_service_outcome_measurements to authenticated;
grant all on public.hsd_service_outcome_measurements to service_role;

alter table public.hsd_customer_feedback enable row level security;
drop policy if exists hsd_customer_feedback_tenant_select on public.hsd_customer_feedback;
create policy hsd_customer_feedback_tenant_select on public.hsd_customer_feedback for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_customer_feedback to authenticated;
grant all on public.hsd_customer_feedback to service_role;

alter table public.hsd_customer_experience_cases enable row level security;
drop policy if exists hsd_customer_experience_cases_tenant_select on public.hsd_customer_experience_cases;
create policy hsd_customer_experience_cases_tenant_select on public.hsd_customer_experience_cases for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_customer_experience_cases to authenticated;
grant all on public.hsd_customer_experience_cases to service_role;

alter table public.hsd_customer_experience_events enable row level security;
drop policy if exists hsd_customer_experience_events_tenant_select on public.hsd_customer_experience_events;
create policy hsd_customer_experience_events_tenant_select on public.hsd_customer_experience_events for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_customer_experience_events to authenticated;
grant all on public.hsd_customer_experience_events to service_role;

alter table public.hsd_customer_recovery_actions enable row level security;
drop policy if exists hsd_customer_recovery_actions_tenant_select on public.hsd_customer_recovery_actions;
create policy hsd_customer_recovery_actions_tenant_select on public.hsd_customer_recovery_actions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_customer_recovery_actions to authenticated;
grant all on public.hsd_customer_recovery_actions to service_role;

alter table public.hsd_customer_confirmation_records enable row level security;
drop policy if exists hsd_customer_confirmation_records_tenant_select on public.hsd_customer_confirmation_records;
create policy hsd_customer_confirmation_records_tenant_select on public.hsd_customer_confirmation_records for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_customer_confirmation_records to authenticated;
grant all on public.hsd_customer_confirmation_records to service_role;

alter table public.hsd_quality_signals enable row level security;
drop policy if exists hsd_quality_signals_tenant_select on public.hsd_quality_signals;
create policy hsd_quality_signals_tenant_select on public.hsd_quality_signals for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_quality_signals to authenticated;
grant all on public.hsd_quality_signals to service_role;

alter table public.hsd_quality_signal_sources enable row level security;
drop policy if exists hsd_quality_signal_sources_tenant_select on public.hsd_quality_signal_sources;
create policy hsd_quality_signal_sources_tenant_select on public.hsd_quality_signal_sources for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_quality_signal_sources to authenticated;
grant all on public.hsd_quality_signal_sources to service_role;

alter table public.hsd_quality_signal_impacts enable row level security;
drop policy if exists hsd_quality_signal_impacts_tenant_select on public.hsd_quality_signal_impacts;
create policy hsd_quality_signal_impacts_tenant_select on public.hsd_quality_signal_impacts for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_quality_signal_impacts to authenticated;
grant all on public.hsd_quality_signal_impacts to service_role;

alter table public.hsd_root_cause_analyses enable row level security;
drop policy if exists hsd_root_cause_analyses_tenant_select on public.hsd_root_cause_analyses;
create policy hsd_root_cause_analyses_tenant_select on public.hsd_root_cause_analyses for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_root_cause_analyses to authenticated;
grant all on public.hsd_root_cause_analyses to service_role;

alter table public.hsd_root_cause_factors enable row level security;
drop policy if exists hsd_root_cause_factors_tenant_select on public.hsd_root_cause_factors;
create policy hsd_root_cause_factors_tenant_select on public.hsd_root_cause_factors for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_root_cause_factors to authenticated;
grant all on public.hsd_root_cause_factors to service_role;

alter table public.hsd_improvement_proposals enable row level security;
drop policy if exists hsd_improvement_proposals_tenant_select on public.hsd_improvement_proposals;
create policy hsd_improvement_proposals_tenant_select on public.hsd_improvement_proposals for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_improvement_proposals to authenticated;
grant all on public.hsd_improvement_proposals to service_role;

alter table public.hsd_improvement_impacts enable row level security;
drop policy if exists hsd_improvement_impacts_tenant_select on public.hsd_improvement_impacts;
create policy hsd_improvement_impacts_tenant_select on public.hsd_improvement_impacts for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_improvement_impacts to authenticated;
grant all on public.hsd_improvement_impacts to service_role;

alter table public.hsd_improvement_reviews enable row level security;
drop policy if exists hsd_improvement_reviews_tenant_select on public.hsd_improvement_reviews;
create policy hsd_improvement_reviews_tenant_select on public.hsd_improvement_reviews for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_improvement_reviews to authenticated;
grant all on public.hsd_improvement_reviews to service_role;

alter table public.hsd_improvement_decisions enable row level security;
drop policy if exists hsd_improvement_decisions_tenant_select on public.hsd_improvement_decisions;
create policy hsd_improvement_decisions_tenant_select on public.hsd_improvement_decisions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_improvement_decisions to authenticated;
grant all on public.hsd_improvement_decisions to service_role;

alter table public.hsd_improvement_releases enable row level security;
drop policy if exists hsd_improvement_releases_tenant_select on public.hsd_improvement_releases;
create policy hsd_improvement_releases_tenant_select on public.hsd_improvement_releases for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_improvement_releases to authenticated;
grant all on public.hsd_improvement_releases to service_role;

alter table public.hsd_quality_board_sessions enable row level security;
drop policy if exists hsd_quality_board_sessions_tenant_select on public.hsd_quality_board_sessions;
create policy hsd_quality_board_sessions_tenant_select on public.hsd_quality_board_sessions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_quality_board_sessions to authenticated;
grant all on public.hsd_quality_board_sessions to service_role;

alter table public.hsd_quality_board_agenda enable row level security;
drop policy if exists hsd_quality_board_agenda_tenant_select on public.hsd_quality_board_agenda;
create policy hsd_quality_board_agenda_tenant_select on public.hsd_quality_board_agenda for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_quality_board_agenda to authenticated;
grant all on public.hsd_quality_board_agenda to service_role;

alter table public.hsd_quality_board_decisions enable row level security;
drop policy if exists hsd_quality_board_decisions_tenant_select on public.hsd_quality_board_decisions;
create policy hsd_quality_board_decisions_tenant_select on public.hsd_quality_board_decisions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_quality_board_decisions to authenticated;
grant all on public.hsd_quality_board_decisions to service_role;

alter table public.hsd_capacity_forecasts enable row level security;
drop policy if exists hsd_capacity_forecasts_tenant_select on public.hsd_capacity_forecasts;
create policy hsd_capacity_forecasts_tenant_select on public.hsd_capacity_forecasts for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_capacity_forecasts to authenticated;
grant all on public.hsd_capacity_forecasts to service_role;

alter table public.hsd_capacity_findings enable row level security;
drop policy if exists hsd_capacity_findings_tenant_select on public.hsd_capacity_findings;
create policy hsd_capacity_findings_tenant_select on public.hsd_capacity_findings for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_capacity_findings to authenticated;
grant all on public.hsd_capacity_findings to service_role;

alter table public.hsd_workforce_capability_findings enable row level security;
drop policy if exists hsd_workforce_capability_findings_tenant_select on public.hsd_workforce_capability_findings;
create policy hsd_workforce_capability_findings_tenant_select on public.hsd_workforce_capability_findings for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_workforce_capability_findings to authenticated;
grant all on public.hsd_workforce_capability_findings to service_role;

alter table public.hsd_health_check_definitions enable row level security;
drop policy if exists hsd_health_check_definitions_tenant_select on public.hsd_health_check_definitions;
create policy hsd_health_check_definitions_tenant_select on public.hsd_health_check_definitions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_health_check_definitions to authenticated;
grant all on public.hsd_health_check_definitions to service_role;

alter table public.hsd_health_check_runs enable row level security;
drop policy if exists hsd_health_check_runs_tenant_select on public.hsd_health_check_runs;
create policy hsd_health_check_runs_tenant_select on public.hsd_health_check_runs for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_health_check_runs to authenticated;
grant all on public.hsd_health_check_runs to service_role;

alter table public.hsd_alert_rules enable row level security;
drop policy if exists hsd_alert_rules_tenant_select on public.hsd_alert_rules;
create policy hsd_alert_rules_tenant_select on public.hsd_alert_rules for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_alert_rules to authenticated;
grant all on public.hsd_alert_rules to service_role;

alter table public.hsd_alert_events enable row level security;
drop policy if exists hsd_alert_events_tenant_select on public.hsd_alert_events;
create policy hsd_alert_events_tenant_select on public.hsd_alert_events for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_alert_events to authenticated;
grant all on public.hsd_alert_events to service_role;

alter table public.hsd_enterprise_reconciliation_runs enable row level security;
drop policy if exists hsd_enterprise_reconciliation_runs_tenant_select on public.hsd_enterprise_reconciliation_runs;
create policy hsd_enterprise_reconciliation_runs_tenant_select on public.hsd_enterprise_reconciliation_runs for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_enterprise_reconciliation_runs to authenticated;
grant all on public.hsd_enterprise_reconciliation_runs to service_role;

alter table public.hsd_enterprise_reconciliation_findings enable row level security;
drop policy if exists hsd_enterprise_reconciliation_findings_tenant_select on public.hsd_enterprise_reconciliation_findings;
create policy hsd_enterprise_reconciliation_findings_tenant_select on public.hsd_enterprise_reconciliation_findings for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_enterprise_reconciliation_findings to authenticated;
grant all on public.hsd_enterprise_reconciliation_findings to service_role;

alter table public.hsd_production_readiness_controls enable row level security;
drop policy if exists hsd_production_readiness_controls_tenant_select on public.hsd_production_readiness_controls;
create policy hsd_production_readiness_controls_tenant_select on public.hsd_production_readiness_controls for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_production_readiness_controls to authenticated;
grant all on public.hsd_production_readiness_controls to service_role;

alter table public.hsd_production_readiness_evidence enable row level security;
drop policy if exists hsd_production_readiness_evidence_tenant_select on public.hsd_production_readiness_evidence;
create policy hsd_production_readiness_evidence_tenant_select on public.hsd_production_readiness_evidence for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_production_readiness_evidence to authenticated;
grant all on public.hsd_production_readiness_evidence to service_role;

alter table public.hsd_production_release_decisions enable row level security;
drop policy if exists hsd_production_release_decisions_tenant_select on public.hsd_production_release_decisions;
create policy hsd_production_release_decisions_tenant_select on public.hsd_production_release_decisions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_production_release_decisions to authenticated;
grant all on public.hsd_production_release_decisions to service_role;

alter table public.hsd_pilot_programmes enable row level security;
drop policy if exists hsd_pilot_programmes_tenant_select on public.hsd_pilot_programmes;
create policy hsd_pilot_programmes_tenant_select on public.hsd_pilot_programmes for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_pilot_programmes to authenticated;
grant all on public.hsd_pilot_programmes to service_role;

alter table public.hsd_pilot_measurements enable row level security;
drop policy if exists hsd_pilot_measurements_tenant_select on public.hsd_pilot_measurements;
create policy hsd_pilot_measurements_tenant_select on public.hsd_pilot_measurements for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_pilot_measurements to authenticated;
grant all on public.hsd_pilot_measurements to service_role;

alter table public.hsd_pilot_decisions enable row level security;
drop policy if exists hsd_pilot_decisions_tenant_select on public.hsd_pilot_decisions;
create policy hsd_pilot_decisions_tenant_select on public.hsd_pilot_decisions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_pilot_decisions to authenticated;
grant all on public.hsd_pilot_decisions to service_role;

alter table public.hsd_system_incidents enable row level security;
drop policy if exists hsd_system_incidents_tenant_select on public.hsd_system_incidents;
create policy hsd_system_incidents_tenant_select on public.hsd_system_incidents for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_system_incidents to authenticated;
grant all on public.hsd_system_incidents to service_role;

alter table public.hsd_system_incident_events enable row level security;
drop policy if exists hsd_system_incident_events_tenant_select on public.hsd_system_incident_events;
create policy hsd_system_incident_events_tenant_select on public.hsd_system_incident_events for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_system_incident_events to authenticated;
grant all on public.hsd_system_incident_events to service_role;

alter table public.hsd_system_incident_reviews enable row level security;
drop policy if exists hsd_system_incident_reviews_tenant_select on public.hsd_system_incident_reviews;
create policy hsd_system_incident_reviews_tenant_select on public.hsd_system_incident_reviews for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_system_incident_reviews to authenticated;
grant all on public.hsd_system_incident_reviews to service_role;

alter table public.hsd_backup_registry enable row level security;
drop policy if exists hsd_backup_registry_tenant_select on public.hsd_backup_registry;
create policy hsd_backup_registry_tenant_select on public.hsd_backup_registry for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_backup_registry to authenticated;
grant all on public.hsd_backup_registry to service_role;

alter table public.hsd_restore_tests enable row level security;
drop policy if exists hsd_restore_tests_tenant_select on public.hsd_restore_tests;
create policy hsd_restore_tests_tenant_select on public.hsd_restore_tests for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_restore_tests to authenticated;
grant all on public.hsd_restore_tests to service_role;

alter table public.hsd_security_reviews enable row level security;
drop policy if exists hsd_security_reviews_tenant_select on public.hsd_security_reviews;
create policy hsd_security_reviews_tenant_select on public.hsd_security_reviews for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_security_reviews to authenticated;
grant all on public.hsd_security_reviews to service_role;

alter table public.hsd_security_findings enable row level security;
drop policy if exists hsd_security_findings_tenant_select on public.hsd_security_findings;
create policy hsd_security_findings_tenant_select on public.hsd_security_findings for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_security_findings to authenticated;
grant all on public.hsd_security_findings to service_role;

alter table public.hsd_retention_policies enable row level security;
drop policy if exists hsd_retention_policies_tenant_select on public.hsd_retention_policies;
create policy hsd_retention_policies_tenant_select on public.hsd_retention_policies for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_retention_policies to authenticated;
grant all on public.hsd_retention_policies to service_role;

alter table public.hsd_runbooks enable row level security;
drop policy if exists hsd_runbooks_tenant_select on public.hsd_runbooks;
create policy hsd_runbooks_tenant_select on public.hsd_runbooks for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_runbooks to authenticated;
grant all on public.hsd_runbooks to service_role;

alter table public.hsd_runbook_versions enable row level security;
drop policy if exists hsd_runbook_versions_tenant_select on public.hsd_runbook_versions;
create policy hsd_runbook_versions_tenant_select on public.hsd_runbook_versions for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_runbook_versions to authenticated;
grant all on public.hsd_runbook_versions to service_role;

alter table public.hsd_change_freezes enable row level security;
drop policy if exists hsd_change_freezes_tenant_select on public.hsd_change_freezes;
create policy hsd_change_freezes_tenant_select on public.hsd_change_freezes for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_change_freezes to authenticated;
grant all on public.hsd_change_freezes to service_role;

alter table public.hsd_release_records enable row level security;
drop policy if exists hsd_release_records_tenant_select on public.hsd_release_records;
create policy hsd_release_records_tenant_select on public.hsd_release_records for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_release_records to authenticated;
grant all on public.hsd_release_records to service_role;

alter table public.hsd_intelligence_advisory_runs enable row level security;
drop policy if exists hsd_intelligence_advisory_runs_tenant_select on public.hsd_intelligence_advisory_runs;
create policy hsd_intelligence_advisory_runs_tenant_select on public.hsd_intelligence_advisory_runs for select to authenticated using (
 tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
);
grant select on public.hsd_intelligence_advisory_runs to authenticated;
grant all on public.hsd_intelligence_advisory_runs to service_role;

create index if not exists idx_umz5_01 on public.hsd_performance_metric_values(snapshot_id,definition_id);

create index if not exists idx_umz5_02 on public.hsd_mission_variance_findings(tenant_id,carelink_mission_id,domain,status);

create index if not exists idx_umz5_03 on public.hsd_customer_feedback(tenant_id,carelink_mission_id,created_at desc);

create index if not exists idx_umz5_04 on public.hsd_customer_experience_cases(tenant_id,status,severity,updated_at desc);

create index if not exists idx_umz5_05 on public.hsd_quality_signals(tenant_id,status,severity,created_at desc);

create index if not exists idx_umz5_06 on public.hsd_improvement_proposals(tenant_id,status,target_type,created_at desc);

create index if not exists idx_umz5_07 on public.hsd_health_check_runs(tenant_id,definition_id,checked_at desc);

create index if not exists idx_umz5_08 on public.hsd_alert_events(tenant_id,status,severity,due_at);

create index if not exists idx_umz5_09 on public.hsd_enterprise_reconciliation_findings(tenant_id,status,severity,created_at desc);

create index if not exists idx_umz5_10 on public.hsd_production_readiness_evidence(tenant_id,control_id,submitted_at desc);

create index if not exists idx_umz5_11 on public.hsd_system_incidents(tenant_id,status,severity,detected_at desc);

create index if not exists idx_umz5_12 on public.hsd_security_findings(tenant_id,status,severity,due_at);


create or replace view public.hsd_performance_metric_latest_v as
select distinct on (d.tenant_id,d.id)
 d.tenant_id,d.code,d.label,d.unit,v.value,v.status,coalesce(v.source,d.source_domain) source,v.measured_at
from public.hsd_performance_metric_definitions d
left join public.hsd_performance_metric_values v on v.definition_id=d.id
order by d.tenant_id,d.id,v.measured_at desc nulls last;

create or replace view public.hsd_quality_signal_registry_v as
select s.*,
 (select count(*) from public.hsd_quality_signal_sources x where x.signal_id=s.id) source_count_actual,
 (select count(*) from public.hsd_improvement_proposals p where p.signal_id=s.id) improvement_count
from public.hsd_quality_signals s;

create or replace view public.hsd_operational_health_v as
select d.id,d.tenant_id,d.code,d.label,d.domain,d.blocking,
 coalesce(r.state,'unknown') state,coalesce(r.verified,false) verified,coalesce(r.detail,'Aucune preuve récente') detail,r.checked_at
from public.hsd_health_check_definitions d
left join lateral(
 select x.state,x.verified,x.detail,x.checked_at from public.hsd_health_check_runs x
 where x.definition_id=d.id order by x.checked_at desc limit 1
) r on true where d.active;

create or replace view public.hsd_production_readiness_v as
select c.id,c.tenant_id,c.code,c.label,c.description,c.sort_order,c.blocking,
 coalesce(e.status,c.status) status,c.owner_id,e.verified_at,
 coalesce((select count(*) from public.hsd_production_readiness_evidence z where z.control_id=c.id),0) evidence_count
from public.hsd_production_readiness_controls c
left join lateral(
 select x.status,x.verified_at from public.hsd_production_readiness_evidence x
 where x.control_id=c.id order by x.submitted_at desc limit 1
) e on true;

create or replace view public.hsd_executive_intervention_v as
select id,tenant_id,'quality_signal'::text source_type,id::text source_id,severity,title,
 coalesce(customer_impact,'')||case when operational_impact<>'' then ' · '||operational_impact else '' end consequence,
 'Décision Quality Board requise'::text required_action,owner_id,due_at
from public.hsd_quality_signals where status in('open','under_review','root_cause_required') and severity in('material','blocking','critical')
union all
select id,tenant_id,'system_incident',id::text,severity,title,coalesce(summary,''),'Piloter le cycle incident',owner_id,null
from public.hsd_system_incidents where status not in('resolved','reviewed','closed')
union all
select id,tenant_id,'reconciliation',id::text,severity,domain,coalesce(detail,''),coalesce(recovery_action,'Résoudre et réconcilier'),null,null
from public.hsd_enterprise_reconciliation_findings where status='open' and severity in('blocking','critical');

grant select on public.hsd_performance_metric_latest_v,public.hsd_quality_signal_registry_v,public.hsd_operational_health_v,public.hsd_production_readiness_v,public.hsd_executive_intervention_v to authenticated,service_role;


create or replace function public.hsd_refresh_production_readiness(p_tenant_id text)
returns table(passed_count integer,total_count integer,blocking_failed integer,status text)
language plpgsql security definer set search_path=public as $$
begin
 update public.hsd_production_readiness_controls c set status=coalesce((
  select e.status from public.hsd_production_readiness_evidence e where e.control_id=c.id order by e.submitted_at desc limit 1
 ),'not_started'),verified_at=(
  select e.verified_at from public.hsd_production_readiness_evidence e where e.control_id=c.id order by e.submitted_at desc limit 1
 ),updated_at=now() where c.tenant_id=p_tenant_id;
 return query select
  count(*) filter(where c.status='passed')::integer,
  count(*)::integer,
  count(*) filter(where c.blocking and c.status in('failed','blocked'))::integer,
  case when count(*) filter(where c.blocking and c.status in('failed','blocked'))>0 then 'blocked'
       when count(*) filter(where c.status='passed')=count(*) then 'ready' else 'not_ready' end
 from public.hsd_production_readiness_controls c where c.tenant_id=p_tenant_id;
end $$;

create or replace function public.hsd_evaluate_production_readiness(p_tenant_id text)
returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'total',count(*),'passed',count(*) filter(where status='passed'),
  'blockingFailed',count(*) filter(where blocking and status in('failed','blocked')),
  'status',case when count(*) filter(where blocking and status in('failed','blocked'))>0 then 'blocked'
                when count(*) filter(where status='passed')=count(*) then 'ready' else 'not_ready' end
 ) from public.hsd_production_readiness_controls where tenant_id=p_tenant_id
$$;

create or replace function public.hsd_run_enterprise_reconciliation(p_tenant_id text,p_scope text,p_actor_id text,p_correlation_id uuid)
returns table(run_id uuid,finding_count integer,critical_count integer,status text)
language plpgsql security definer set search_path=public as $$
declare r uuid:=gen_random_uuid(); findings integer:=0; critical integer:=0;
begin
 insert into public.hsd_enterprise_reconciliation_runs(id,tenant_id,scope,status,correlation_id,started_by)
 values(r,p_tenant_id,p_scope,'running',p_correlation_id,p_actor_id);

 insert into public.hsd_enterprise_reconciliation_findings(tenant_id,run_id,domain,severity,status,source_type,source_id,target_type,target_id,expected_value,actual_value,detail,recovery_action)
 select p_tenant_id,r,'handoff_sub_mission_count','critical','open','handoff',h.id::text,'carelink_parent',h.carelink_parent_mission_id::text,
        to_jsonb(h.mission_count),to_jsonb(count(l.id)),
        'Le nombre de sous-missions CARELINK diffère du snapshot handoff.','Ouvrir UMZ4 Reconciliation Control Room.'
 from public.hsd_handoff_requests h
 left join public.hsd_handoff_carelink_links l on l.handoff_id=h.id and l.target_type='sub_mission'
 where h.tenant_id=p_tenant_id and h.status in('committed','committed_with_projection_failure','reconciled')
 group by h.id having count(l.id)<>h.mission_count;

 insert into public.hsd_enterprise_reconciliation_findings(tenant_id,run_id,domain,severity,status,source_type,source_id,target_type,target_id,expected_value,actual_value,detail,recovery_action)
 select p_tenant_id,r,'active_sellable_plan_version','blocking','open','sellable',s.id::text,'technical_plan_version',coalesce(s.technical_plan_version_id::text,''),
        jsonb_build_object('required','approved technical plan'),jsonb_build_object('sellableStatus',s.status),
        'Une référence active ne possède plus une lignée technique valide.','Suspendre la publication et rétablir la lignée.'
 from public.hsd_sellables s
 left join public.hsd_technical_plan_versions p on p.id=s.technical_plan_version_id
 where s.tenant_id=p_tenant_id and s.status='published' and (p.id is null or p.status<>'approved');

 select count(*),count(*) filter(where severity='critical') into findings,critical
 from public.hsd_enterprise_reconciliation_findings where run_id=r;

 update public.hsd_enterprise_reconciliation_runs set finding_count=findings,critical_count=critical,
  status=case when critical>0 then 'failed' when findings>0 then 'findings' else 'passed' end,
  completed_at=now(),summary=jsonb_build_object('scope',p_scope,'findings',findings,'critical',critical)
 where id=r;

 return query select r,findings,critical,case when critical>0 then 'failed' when findings>0 then 'findings' else 'passed' end;
end $$;

grant execute on function public.hsd_refresh_production_readiness(text) to service_role;
grant execute on function public.hsd_evaluate_production_readiness(text) to authenticated,service_role;
grant execute on function public.hsd_run_enterprise_reconciliation(text,text,text,uuid) to service_role;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','mission_completion_rate','Taux de missions terminées','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','mission_completion_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','on_time_arrival_rate','Ponctualité d’arrivée','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','on_time_arrival_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','duration_adherence','Adhérence durée','Mesure déterministe attribuable; aucune valeur simulée.','percent','performance','duration_adherence')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','programme_adherence','Adhérence programme','Mesure déterministe attribuable; aucune valeur simulée.','percent','performance','programme_adherence')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','checklist_compliance','Conformité checklist','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','checklist_compliance')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','report_completion','Rapports complétés','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','report_completion')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','report_correction_rate','Taux de correction rapport','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','report_correction_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','incident_rate','Taux d’incident','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','incident_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','caregiver_substitution_rate','Substitution caregiver','Mesure déterministe attribuable; aucune valeur simulée.','percent','carelink','caregiver_substitution_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','customer_confirmation_rate','Confirmation client','Mesure déterministe attribuable; aucune valeur simulée.','percent','customer_experience','customer_confirmation_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','customer_satisfaction','Satisfaction client','Mesure déterministe attribuable; aucune valeur simulée.','score','customer_experience','customer_satisfaction')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','rebooking_rate','Taux de rebooking','Mesure déterministe attribuable; aucune valeur simulée.','percent','commercial','rebooking_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_performance_metric_definitions(tenant_id,code,label,description,unit,source_domain,calculation_key)
values('angelcare-main','gross_margin_rate','Marge brute HomeService','Mesure déterministe attribuable; aucune valeur simulée.','percent','commercial','gross_margin_rate')
on conflict(tenant_id,code) do update set label=excluded.label,unit=excluded.unit,source_domain=excluded.source_domain,calculation_key=excluded.calculation_key,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','database','Base de données','Contrôle probant UMZ5.','platform',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','rls','Row Level Security','Contrôle probant UMZ5.','security',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','audit','Journal d’audit','Contrôle probant UMZ5.','governance',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','outbox','Transactional outbox','Contrôle probant UMZ5.','integration',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','openrouter_free','OpenRouter Free','Contrôle probant UMZ5.','provider',false)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','carelink_handoffs','Handoffs CARELINK','Contrôle probant UMZ5.','integration',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','enterprise_reconciliation','Réconciliation entreprise','Contrôle probant UMZ5.','integrity',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','document_generation','Génération documentaire','Contrôle probant UMZ5.','documents',false)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','csv_imports','Imports CSV','Contrôle probant UMZ5.','configuration',false)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','background_jobs','Jobs de fond','Contrôle probant UMZ5.','operations',false)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_health_check_definitions(tenant_id,code,label,description,domain,blocking)
values('angelcare-main','permissions','Catalogue permissions','Contrôle probant UMZ5.','security',true)
on conflict(tenant_id,code) do update set label=excluded.label,domain=excluded.domain,blocking=excluded.blocking,active=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','migration_umz1','Migration UMZ1 confirmée','Preuve, propriétaire et vérification obligatoires.',1,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','migration_umz2','Migration UMZ2 confirmée','Preuve, propriétaire et vérification obligatoires.',2,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','migration_umz3','Migration UMZ3 confirmée','Preuve, propriétaire et vérification obligatoires.',3,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','migration_umz4','Migration UMZ4 confirmée','Preuve, propriétaire et vérification obligatoires.',4,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','migration_umz5','Migration UMZ5 confirmée','Preuve, propriétaire et vérification obligatoires.',5,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','typescript','Strict TypeScript passé','Preuve, propriétaire et vérification obligatoires.',6,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','production_build','Build production passé','Preuve, propriétaire et vérification obligatoires.',7,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','rls','RLS vérifié','Preuve, propriétaire et vérification obligatoires.',8,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','permissions','Matrice permissions vérifiée','Preuve, propriétaire et vérification obligatoires.',9,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','carelink_integration','Intégration CARELINK passée','Preuve, propriétaire et vérification obligatoires.',10,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','handoff_transaction','Test transaction handoff passé','Preuve, propriétaire et vérification obligatoires.',11,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','enterprise_reconciliation','Réconciliation entreprise passée','Preuve, propriétaire et vérification obligatoires.',12,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','backup','Sauvegarde confirmée','Preuve, propriétaire et vérification obligatoires.',13,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','restore_test','Test de restauration passé','Preuve, propriétaire et vérification obligatoires.',14,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','openrouter_configuration','OpenRouter Free configuré','Preuve, propriétaire et vérification obligatoires.',15,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','ai_transparency','Transparence IA vérifiée','Preuve, propriétaire et vérification obligatoires.',16,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','document_generation','Génération documentaire passée','Preuve, propriétaire et vérification obligatoires.',17,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','csv_import_rollback','Import CSV et rollback passés','Preuve, propriétaire et vérification obligatoires.',18,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','incident_workflow','Workflow incident passé','Preuve, propriétaire et vérification obligatoires.',19,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','controlled_pilot','Pilote contrôlé terminé','Preuve, propriétaire et vérification obligatoires.',20,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','security_findings','Findings sécurité résolus','Preuve, propriétaire et vérification obligatoires.',21,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','runbooks','Runbooks approuvés','Preuve, propriétaire et vérification obligatoires.',22,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','monitoring_alerts','Monitoring et alertes activés','Preuve, propriétaire et vérification obligatoires.',23,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_production_readiness_controls(tenant_id,code,label,description,sort_order,blocking,status)
values('angelcare-main','executive_release_approval','Approbation exécutive de release','Preuve, propriétaire et vérification obligatoires.',24,true,'not_started')
on conflict(tenant_id,code) do update set label=excluded.label,sort_order=excluded.sort_order,blocking=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','handoff_commit_failure','Échec commit handoff','handoff_failure','handoff','critical','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','projection_failure','Échec projection CARELINK','projection_failure','handoff','blocking','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','reconciliation_mismatch','Écart de réconciliation','reconciliation','integrity','critical','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','critical_safety_signal','Signal sécurité critique','quality_signal','quality','critical','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','cx_sla_breach','SLA dossier CX dépassé','case_due','customer_experience','material','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','missing_report','Rapport mission manquant','report_missing','carelink','material','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','mission_no_show','No-show mission','mission_no_show','carelink','critical','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','margin_below_floor','Marge sous seuil','margin_failure','commercial','blocking','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','capacity_exhaustion','Capacité épuisée','capacity_gap','capacity','material','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','audit_write_failure','Échec écriture audit','audit_failure','governance','critical','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','backup_overdue','Sauvegarde en retard','backup_due','operations','blocking','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_alert_rules(tenant_id,code,title,trigger_type,source_domain,severity,conditions,escalation_route,active)
values('angelcare-main','restore_test_overdue','Test restauration en retard','restore_due','operations','blocking','{}'::jsonb,'{"route":"executive_intervention"}'::jsonb,true)
on conflict(tenant_id,code) do update set title=excluded.title,severity=excluded.severity,active=true;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_performance','Voir la performance','Consulter les métriques et variances.','medium')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_executive_intelligence','Voir intelligence exécutive','Accéder au théâtre exécutif.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_customer_experience','Voir expérience client','Consulter feedback et dossiers CX.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_customer_experience_cases','Gérer dossiers CX','Créer et instruire les cas.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.close_customer_experience_cases','Clôturer dossiers CX','Clôture après confirmation client.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_quality_signals','Voir signaux qualité','Consulter les signaux sourcés.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.create_quality_signals','Créer signaux qualité','Formaliser un signal attribuable.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.review_quality_signals','Réviser signaux qualité','Qualifier et orienter les signaux.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_root_cause_analysis','Gérer causes racines','Conduire l’analyse formelle.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.create_improvement_proposals','Créer améliorations','Proposer une évolution contrôlée.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.approve_improvement_proposals','Approuver améliorations','Décider après revues.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_service_evolution','Gérer évolution service','Créer de nouvelles versions futures.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.suspend_sellables_for_quality','Suspendre sellables qualité','Suspendre pour motif qualité.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_quality_board','Gérer Quality Board','Décisions multi-disciplinaires.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_commercial_performance','Voir performance commerciale','Accès à la valeur commerciale.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_capacity_intelligence','Voir intelligence capacité','Consulter tensions et prévisions.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_workforce_intelligence','Voir intelligence workforce','Consulter gaps agrégés.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.view_operational_health','Voir santé opérationnelle','Contrôles et preuves.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_alerts','Gérer alertes','Configurer et résoudre les alertes.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_system_incidents','Gérer incidents système','Piloter le cycle incident.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.run_reconciliation','Exécuter réconciliation','Rapprocher UMZ1–UMZ4 et CARELINK.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_backups','Gérer sauvegardes','Enregistrer et vérifier les backups.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_restore_tests','Gérer tests restauration','Prouver la restaurabilité.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_security_reviews','Gérer revues sécurité','Ouvrir et fermer les findings.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_retention','Gérer rétention','Versionner les politiques.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_runbooks','Gérer runbooks','Versionner les procédures.','high')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_change_freezes','Gérer gels de changement','Contrôler les exceptions release.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.manage_pilots','Gérer pilotes','Périmètre, critères et décisions.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.review_production_readiness','Réviser readiness','Soumettre et vérifier les preuves.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.approve_production_release','Approuver release production','Décision finale de release.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.audit_final_system','Auditer système final','Accès à toute la lignée UMZ5.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;

insert into public.hsd_permissions(code,name_fr,description_fr,risk_level)
values('homeservice_design.admin_governance','Administrer gouvernance','Administration du domaine final.','critical')
on conflict(code) do update set name_fr=excluded.name_fr,description_fr=excluded.description_fr,risk_level=excluded.risk_level;


comment on function public.hsd_run_enterprise_reconciliation(text,text,text,uuid) is 'UMZ5 deterministic reconciliation across product, plan, sellable, handoff and CARELINK lineages.';
comment on function public.hsd_evaluate_production_readiness(text) is 'UMZ5 evidence-based release readiness. Missing or failed evidence never returns ready.';
commit;
