-- AngelCare 360 Phase 2S - Phase 2 Runtime QA, Cross-Module Coverage, Hardening & Pre-UI Gate
-- Ref: AC360-PH2S-RUNTIME-QA-PRE-UI-GATE-2026-06-30
-- Scope: backend/system-only QA gate for Phase 2A-2R runtime. No AC360 school UI/front-end pages are introduced.
-- Doctrine: backend-first, guard-first, archive-not-delete, strict coverage before UI.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2R runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Phase 2 QA / coverage / pre-UI gate tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_phase2_runtime_qa_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  run_key text not null unique,
  run_type text not null default 'phase2_runtime_qa',
  status text not null default 'running',
  readiness_score numeric(5,2) not null default 0,
  critical_failures integer not null default 0,
  warning_count integer not null default 0,
  passed_count integer not null default 0,
  failed_count integer not null default 0,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (run_type in ('phase2_runtime_qa','cross_module_coverage','integrity_audit','pre_ui_gate','deployment_dry_run','custom')),
  check (status in ('running','passed','warning','failed','blocked','archived'))
);

create table if not exists public.ac360_phase2_runtime_qa_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  run_id uuid not null references public.ac360_phase2_runtime_qa_runs(id) on delete cascade,
  check_key text not null,
  check_group text not null,
  severity text not null default 'medium',
  status text not null default 'pending',
  message text not null,
  expected_json jsonb not null default '{}'::jsonb,
  actual_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  created_at timestamptz not null default now(),
  unique(run_id, check_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('pending','passed','warning','failed','blocked','skipped'))
);

create table if not exists public.ac360_phase2_module_coverage_matrix (
  module_key text primary key,
  phase_code text not null,
  label text not null,
  runtime_lib text not null,
  api_prefix text not null,
  owner_system text not null default 'angelcare_360_school_operations',
  required_tables text[] not null default '{}',
  required_actions text[] not null default '{}',
  depends_on_modules text[] not null default '{}',
  coverage_status text not null default 'expected',
  ui_build_status text not null default 'locked',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coverage_status in ('expected','partial','covered','warning','failed','archived')),
  check (ui_build_status in ('locked','pre_ui_gate','approved_for_design','ui_building','active','archived'))
);

create table if not exists public.ac360_phase2_action_contracts (
  id uuid primary key default gen_random_uuid(),
  module_key text not null references public.ac360_phase2_module_coverage_matrix(module_key) on delete cascade,
  action_key text not null,
  wiring_key text not null,
  route_path text not null,
  http_method text not null default 'POST',
  guard_required boolean not null default true,
  policy_required boolean not null default true,
  audit_required boolean not null default true,
  usage_record_required boolean not null default true,
  status text not null default 'expected',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(action_key, wiring_key),
  check (http_method in ('GET','POST','PATCH','PUT','DELETE')),
  check (status in ('expected','covered','warning','failed','archived'))
);

create table if not exists public.ac360_phase2_integrity_rules (
  rule_key text primary key,
  label text not null,
  source_module text not null,
  target_module text,
  severity text not null default 'medium',
  rule_type text not null default 'table_presence',
  expected_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('low','medium','high','critical')),
  check (rule_type in ('table_presence','action_presence','wiring_presence','module_presence','policy_presence','cross_module_link','runtime_contract','custom')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_phase2_integrity_findings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  run_id uuid references public.ac360_phase2_runtime_qa_runs(id) on delete set null,
  rule_key text references public.ac360_phase2_integrity_rules(rule_key) on delete set null,
  module_key text,
  severity text not null default 'medium',
  status text not null default 'open',
  message text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  remediation_hint text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','acknowledged','resolved','dismissed','archived'))
);

create table if not exists public.ac360_phase2_hardening_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  event_key text not null,
  event_type text not null default 'hardening',
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  module_key text,
  action_key text,
  evidence_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, event_key),
  check (event_type in ('hardening','qa','coverage','integrity','pre_ui_gate','deployment','typescript','sql','policy','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','in_review','resolved','dismissed','archived'))
);

create table if not exists public.ac360_phase2_pre_ui_gates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  gate_key text not null,
  gate_type text not null default 'phase2_pre_ui',
  status text not null default 'locked',
  ui_build_allowed boolean not null default false,
  readiness_score numeric(5,2) not null default 0,
  qa_run_id uuid references public.ac360_phase2_runtime_qa_runs(id) on delete set null,
  critical_failures integer not null default 0,
  warning_count integer not null default 0,
  decision_reason text,
  decision_by uuid,
  decision_at timestamptz,
  gate_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, gate_key),
  check (gate_type in ('phase2_pre_ui','module_pre_ui','deployment_pre_ui','custom')),
  check (status in ('locked','evaluating','ready_for_instruction','approved_for_ui_design','blocked','archived'))
);

create table if not exists public.ac360_phase2_runtime_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  alert_type text not null default 'qa',
  severity text not null default 'medium',
  status text not null default 'open',
  module_key text,
  title text not null,
  message text,
  related_run_id uuid references public.ac360_phase2_runtime_qa_runs(id) on delete set null,
  related_finding_id uuid references public.ac360_phase2_integrity_findings(id) on delete set null,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('qa','coverage','integrity','pre_ui_gate','hardening','deployment','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','acknowledged','resolved','dismissed','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Feature/action registry and guarded action wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,status,metadata_json)
values
('phase2_runtime_qa','phase2_runtime_qa','governance','Phase 2 Runtime QA, Coverage & Pre-UI Gate','Backend QA, cross-module coverage, hardening and UI readiness gate for AC360 Phase 2 runtime.','governance',true,false,false,'automation_credit',1,'active','{"phase":"phase_2s","uiBuildAllowed":false,"backendOnly":true}'::jsonb)
on conflict(feature_key) do update set
  module_key=excluded.module_key,
  family=excluded.family,
  label=excluded.label,
  description=excluded.description,
  billing_family=excluded.billing_family,
  is_core=excluded.is_core,
  is_billable=excluded.is_billable,
  is_enterprise_only=excluded.is_enterprise_only,
  default_meter_key=excluded.default_meter_key,
  default_credit_cost=excluded.default_credit_cost,
  status=excluded.status,
  metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,audit_required,metadata_json)
values
('phase2.runtime_qa.run','phase2_runtime_qa','AC360-ENG-10','Run Phase 2 runtime QA','Run backend-only Phase 2 runtime QA across modules, tables, actions and wiring.','phase2.runtime_qa.run','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb),
('phase2.coverage.refresh','phase2_runtime_qa','AC360-ENG-26','Refresh Phase 2 coverage','Refresh/check module coverage matrix and action contracts.','phase2.coverage.refresh','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb),
('phase2.integrity.run','phase2_runtime_qa','AC360-ENG-10','Run Phase 2 integrity checks','Run cross-module integrity checks and record findings.','phase2.integrity.run','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb),
('phase2.pre_ui_gate.evaluate','phase2_runtime_qa','AC360-ENG-26','Evaluate Phase 2 pre-UI gate','Evaluate whether backend runtime is ready to ask for UI instructions.','phase2.pre_ui_gate.evaluate','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb),
('phase2.pre_ui_gate.decide','phase2_runtime_qa','AC360-ENG-10','Decide Phase 2 pre-UI gate','Lock/block/approve pre-UI gate after QA evidence.','phase2.pre_ui_gate.decide','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb),
('phase2.hardening_event.record','phase2_runtime_qa','AC360-ENG-10','Record Phase 2 hardening event','Record backend hardening/QA/deployment event.','phase2.hardening_event.record','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb),
('phase2.alert.resolve','phase2_runtime_qa','AC360-ENG-27','Resolve Phase 2 runtime alert','Resolve QA/coverage/pre-UI runtime alerts.','phase2.alert.resolve','automation_credit',1,'block',true,'{"phase":"phase_2s"}'::jsonb)
on conflict(action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  audit_required=excluded.audit_required,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,status,description,metadata_json)
values
('ac360.phase2s.runtime_qa.run','/api/ac360/phase2-runtime-qa/run','POST','phase2.runtime_qa.run','phase2_runtime_qa','AC360-ENG-10','angelcare_360_phase2_runtime_qa','ac360_phase2_runtime_qa_runs','strict','fixed_1','request_or_generated','active','Run Phase 2 runtime QA with strict guard.','{"phase":"phase_2s"}'::jsonb),
('ac360.phase2s.coverage.refresh','/api/ac360/phase2-runtime-qa/coverage/refresh','POST','phase2.coverage.refresh','phase2_runtime_qa','AC360-ENG-26','angelcare_360_phase2_runtime_qa','ac360_phase2_module_coverage_matrix','strict','fixed_1','request_or_generated','active','Refresh Phase 2 coverage matrix.','{"phase":"phase_2s"}'::jsonb),
('ac360.phase2s.integrity.run','/api/ac360/phase2-runtime-qa/integrity/run','POST','phase2.integrity.run','phase2_runtime_qa','AC360-ENG-10','angelcare_360_phase2_runtime_qa','ac360_phase2_integrity_findings','strict','fixed_1','request_or_generated','active','Run Phase 2 cross-module integrity checks.','{"phase":"phase_2s"}'::jsonb),
('ac360.phase2s.pre_ui_gate.evaluate','/api/ac360/phase2-runtime-qa/pre-ui-gate/evaluate','POST','phase2.pre_ui_gate.evaluate','phase2_runtime_qa','AC360-ENG-26','angelcare_360_phase2_runtime_qa','ac360_phase2_pre_ui_gates','strict','fixed_1','request_or_generated','active','Evaluate Phase 2 pre-UI gate.','{"phase":"phase_2s"}'::jsonb),
('ac360.phase2s.pre_ui_gate.decide','/api/ac360/phase2-runtime-qa/pre-ui-gate/decision','POST','phase2.pre_ui_gate.decide','phase2_runtime_qa','AC360-ENG-10','angelcare_360_phase2_runtime_qa','ac360_phase2_pre_ui_gates','strict','fixed_1','request_or_generated','active','Decide Phase 2 pre-UI gate.','{"phase":"phase_2s"}'::jsonb),
('ac360.phase2s.hardening_event.record','/api/ac360/phase2-runtime-qa/hardening/events','POST','phase2.hardening_event.record','phase2_runtime_qa','AC360-ENG-10','angelcare_360_phase2_runtime_qa','ac360_phase2_hardening_events','strict','fixed_1','request_or_generated','active','Record Phase 2 hardening event.','{"phase":"phase_2s"}'::jsonb),
('ac360.phase2s.alert.resolve','/api/ac360/phase2-runtime-qa/alerts/resolve','POST','phase2.alert.resolve','phase2_runtime_qa','AC360-ENG-27','angelcare_360_phase2_runtime_qa','ac360_phase2_runtime_alerts','strict','fixed_1','request_or_generated','active','Resolve Phase 2 runtime alert.','{"phase":"phase_2s"}'::jsonb)
on conflict(wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

-- Keep compatibility with Phase 2 module registry.
insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values
('phase2_runtime_qa_pre_ui_gate','AC360-ENG-10','phase2_runtime_qa','Phase 2 Runtime QA, Cross-Module Coverage, Hardening & Pre-UI Gate','phase_2s_runtime_qa_pre_ui_gate','guarded',array['ac360_phase2_runtime_qa_runs','ac360_phase2_runtime_qa_results','ac360_phase2_module_coverage_matrix','ac360_phase2_action_contracts','ac360_phase2_pre_ui_gates'],array['phase2.runtime_qa.run','phase2.coverage.refresh','phase2.integrity.run','phase2.pre_ui_gate.evaluate','phase2.pre_ui_gate.decide','phase2.hardening_event.record','phase2.alert.resolve'],'{"phase":"phase_2s","uiBuildAllowed":false,"backendOnly":true,"preUiGate":true}'::jsonb)
on conflict(module_key) do update set
  engine_code=excluded.engine_code,
  feature_key=excluded.feature_key,
  label=excluded.label,
  phase=excluded.phase,
  status=excluded.status,
  data_tables=excluded.data_tables,
  guarded_actions=excluded.guarded_actions,
  metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 3. Coverage matrix seeds for Phase 2A-2S
-- -----------------------------------------------------------------------------
insert into public.ac360_phase2_module_coverage_matrix(module_key,phase_code,label,runtime_lib,api_prefix,owner_system,required_tables,required_actions,depends_on_modules,coverage_status,ui_build_status,metadata_json)
values
('core_school_ops_skeleton','phase_2a','Core School Operations Skeleton','lib/ac360/school-ops.ts','/api/ac360/school-ops','school_operations',array['ac360_school_students','ac360_school_guardians','ac360_school_staff_profiles','ac360_school_classes','ac360_school_tuition_invoices','ac360_school_tasks'],array['school.student.create','school.guardian.create','school.staff.create','school.class.create','school.invoice.create','school.task.create'],array[]::text[],'expected','locked','{"backendOnly":true}'::jsonb),
('student_parent_class_lifecycle','phase_2b','Student, Parent & Class Lifecycle Runtime','lib/ac360/school-lifecycle.ts','/api/ac360/school-lifecycle','school_operations',array['ac360_school_lifecycle_events','ac360_school_class_transfer_events','ac360_school_integrity_runs','ac360_school_integrity_findings'],array['school.student.transition','school.student.archive','school.guardian.link','school.class.transfer_student','school.lifecycle.integrity_check'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('attendance_presence_daily_ops','phase_2c','Attendance, Presence & Daily Operations Runtime','lib/ac360/school-attendance.ts','/api/ac360/school-attendance','school_operations',array['ac360_school_attendance_daybooks','ac360_school_attendance_events','ac360_school_attendance_corrections','ac360_school_daily_ops_alerts'],array['school.attendance.session.open','school.attendance.event.record','school.attendance.correction.request','school.attendance.correction.decide','school.daily_ops.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('finance_invoicing_receivables','phase_2d','Finance, Invoicing, Payments & Receivables Runtime','lib/ac360/school-finance.ts','/api/ac360/school-finance','school_operations',array['ac360_school_fee_catalog','ac360_school_billing_cycles','ac360_school_invoice_batches','ac360_school_fee_payments','ac360_school_receivable_snapshots','ac360_school_finance_alerts'],array['school.finance.fee_catalog.upsert','school.finance.invoice_batch.generate','school.finance.invoice.issue','school.finance.payment.record','school.finance.receivables.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('communication_messaging_notifications','phase_2e','Communication, Messaging, Templates & Parent Notification Runtime','lib/ac360/school-communication.ts','/api/ac360/school-communication','school_operations',array['ac360_school_message_templates','ac360_school_message_campaigns','ac360_school_message_recipients','ac360_school_delivery_jobs','ac360_school_communication_threads','ac360_school_communication_alerts'],array['school.communication.template.upsert','school.communication.campaign.create','school.communication.email.dispatch','school.communication.whatsapp.dispatch','school.communication.sms.dispatch','school.communication.thread.reply'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('documents_reports_storage_exports','phase_2f','Documents, Reports, Storage & Export Runtime','lib/ac360/school-documents.ts','/api/ac360/school-documents','school_operations',array['ac360_school_document_folders','ac360_school_document_versions','ac360_school_report_templates','ac360_school_report_artifacts','ac360_school_export_jobs','ac360_school_storage_snapshots'],array['school.document.register','school.document.version.create','school.report.job.queue','school.report.artifact.record','school.export.job.queue','school.storage.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('tasks_approvals_workflows_operations','phase_2g','Tasks, Approvals, Workflows & Operations Runtime','lib/ac360/school-workflows.ts','/api/ac360/school-workflows','school_operations',array['ac360_school_task_boards','ac360_school_task_comments','ac360_school_approval_requests','ac360_school_workflow_instances','ac360_school_operations_tickets','ac360_school_operations_alerts'],array['school.task.board.upsert','school.task.status.update','school.approval.request','school.approval.decide','school.workflow.instance.start','school.operations.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('admissions_crm_conversion','phase_2h','Admissions CRM, Leads, Visits & Enrollment Conversion Runtime','lib/ac360/school-admissions.ts','/api/ac360/school-admissions','growth_modules',array['ac360_school_admissions_sources','ac360_school_admission_pipelines','ac360_school_admission_leads','ac360_school_admission_visits','ac360_school_admission_offers','ac360_school_admission_alerts'],array['school.admissions.lead.create','school.admissions.lead.stage.update','school.admissions.visit.schedule','school.admissions.offer.generate','school.admissions.convert_to_student','school.admissions.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('hr_staffing_scheduling_leave','phase_2i','HR, Staff Scheduling, Leave & Staffing Runtime','lib/ac360/school-hr.ts','/api/ac360/school-hr','growth_modules',array['ac360_school_hr_departments','ac360_school_staff_contracts','ac360_school_shift_profiles','ac360_school_staff_shift_assignments','ac360_school_leave_requests','ac360_school_hr_alerts'],array['school.hr.department.upsert','school.hr.contract.upsert','school.hr.shift.assign','school.hr.leave_request.create','school.hr.staffing_request.open','school.hr.compliance.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('health_safety_incidents_pickup','phase_2j','Health, Safety, Incidents, Medical & Authorized Pickup Runtime','lib/ac360/school-health-safety.ts','/api/ac360/school-health-safety','growth_modules',array['ac360_school_health_profiles','ac360_school_emergency_contacts','ac360_school_medication_plans','ac360_school_authorized_pickups','ac360_school_incident_reports','ac360_school_health_safety_alerts'],array['school.health.profile.upsert','school.health.emergency_contact.upsert','school.safety.authorized_pickup.upsert','school.safety.pickup.record','school.safety.incident.report','school.safety.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('transport_routes_vehicles_drivers','phase_2k','Transport, Routes, Vehicles, Drivers & Pickup/Drop-off Runtime','lib/ac360/school-transport.ts','/api/ac360/school-transport','growth_modules',array['ac360_school_transport_vehicles','ac360_school_transport_drivers','ac360_school_transport_routes','ac360_school_transport_route_stops','ac360_school_transport_route_runs','ac360_school_transport_alerts'],array['school.transport.vehicle.upsert','school.transport.driver.upsert','school.transport.route.upsert','school.transport.route_run.open','school.transport.route_run.event.record','school.transport.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('parenttrust_surveys_complaints_reputation','phase_2l','ParentTrust, Surveys, Complaints, Appointments & Reputation Runtime','lib/ac360/school-parenttrust.ts','/api/ac360/school-parenttrust','growth_modules',array['ac360_school_parenttrust_survey_templates','ac360_school_parenttrust_surveys','ac360_school_parenttrust_complaints','ac360_school_parenttrust_appointments','ac360_school_parenttrust_testimonials','ac360_school_parenttrust_alerts'],array['school.parenttrust.survey_template.upsert','school.parenttrust.survey.launch','school.parenttrust.complaint.open','school.parenttrust.appointment.book','school.parenttrust.testimonial.record','school.parenttrust.reconcile'],array['core_school_ops_skeleton','communication_messaging_notifications'],'expected','locked','{"backendOnly":true}'::jsonb),
('academy_training_assessments_certificates','phase_2m','Academy Training, Staff Courses, Assessments & Certificates Runtime','lib/ac360/school-academy.ts','/api/ac360/school-academy','growth_modules',array['ac360_school_academy_programs','ac360_school_academy_courses','ac360_school_academy_sessions','ac360_school_academy_enrollments','ac360_school_academy_certificates','ac360_school_academy_alerts'],array['school.academy.program.upsert','school.academy.course.upsert','school.academy.session.schedule','school.academy.staff.enroll','school.academy.certificate.issue','school.academy.reconcile'],array['core_school_ops_skeleton','hr_staffing_scheduling_leave'],'expected','locked','{"backendOnly":true}'::jsonb),
('ai_automation_smart_alerts_jobs','phase_2n','AI, Automation Builder, Smart Alerts & Scheduled Jobs Runtime','lib/ac360/school-automation.ts','/api/ac360/school-automation','automation_systems',array['ac360_school_ai_prompt_templates','ac360_school_ai_jobs','ac360_school_automation_blueprints','ac360_school_automation_runs','ac360_school_scheduled_jobs','ac360_school_smart_alerts'],array['school.ai.prompt.upsert','school.ai.job.queue','school.automation.rule.upsert','school.automation.run.trigger','school.scheduled_job.run','school.smart_alert.emit','school.ai_automation.reconcile'],array['communication_messaging_notifications','documents_reports_storage_exports'],'expected','locked','{"backendOnly":true}'::jsonb),
('public_forms_intake','phase_2o','Public Forms, Lead Capture, Parent Requests & External Intake Runtime','lib/ac360/school-intake.ts','/api/ac360/school-intake','growth_modules',array['ac360_school_intake_forms','ac360_school_intake_form_fields','ac360_school_external_intake_sources','ac360_school_intake_submissions','ac360_school_parent_requests','ac360_school_intake_alerts'],array['school.intake.form.upsert','school.intake.form.publish','school.intake.submission.create','school.intake.lead_capture.process','school.intake.parent_request.create','school.intake.reconcile'],array['admissions_crm_conversion'],'expected','locked','{"backendOnly":true}'::jsonb),
('branding_domains_integrations_api','phase_2p','White Label, Branding, Custom Domains, Integrations & API Runtime','lib/ac360/school-branding.ts','/api/ac360/school-branding','platform_systems',array['ac360_school_brand_profiles','ac360_school_brand_assets','ac360_school_custom_domains','ac360_school_integration_connectors','ac360_school_api_keys','ac360_school_webhooks'],array['school.branding.profile.upsert','school.branding.asset.register','school.domain.request','school.integration.connector.upsert','school.api_key.issue','school.webhook.upsert','school.branding_integrations.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('migration_onboarding_client_success','phase_2q','Data Migration, Onboarding, Setup & Client Success Runtime','lib/ac360/school-onboarding.ts','/api/ac360/school-onboarding','client_success_systems',array['ac360_school_migration_projects','ac360_school_migration_sources','ac360_school_migration_records','ac360_school_onboarding_projects','ac360_school_client_success_accounts','ac360_school_onboarding_success_alerts'],array['school.migration.project.create','school.migration.record.process','school.onboarding.project.open','school.setup.item.complete','school.client_success.health_score.compute','school.onboarding.reconcile'],array['core_school_ops_skeleton'],'expected','locked','{"backendOnly":true}'::jsonb),
('internal_admin_nationwide_success','phase_2r','Internal AngelCare Admin, Portfolio, Support, Deployment & Nationwide Success Runtime','lib/ac360/internal-admin.ts','/api/ac360/internal-admin','internal_operations',array['ac360_internal_portfolio_accounts','ac360_internal_support_tickets','ac360_internal_deployment_releases','ac360_internal_city_markets','ac360_internal_admin_tasks','ac360_internal_admin_alerts'],array['internal.portfolio_account.upsert','internal.support_ticket.open','internal.deployment_release.create','internal.city_market.upsert','internal.admin_task.create','internal.admin.reconcile'],array['migration_onboarding_client_success'],'expected','locked','{"backendOnly":true,"internalOnly":true}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase_2s','Phase 2 Runtime QA, Cross-Module Coverage, Hardening & Pre-UI Gate','lib/ac360/phase2-runtime-qa.ts','/api/ac360/phase2-runtime-qa','qa_governance',array['ac360_phase2_runtime_qa_runs','ac360_phase2_runtime_qa_results','ac360_phase2_module_coverage_matrix','ac360_phase2_action_contracts','ac360_phase2_pre_ui_gates','ac360_phase2_runtime_alerts'],array['phase2.runtime_qa.run','phase2.coverage.refresh','phase2.integrity.run','phase2.pre_ui_gate.evaluate','phase2.pre_ui_gate.decide','phase2.hardening_event.record','phase2.alert.resolve'],array['internal_admin_nationwide_success'],'expected','locked','{"backendOnly":true,"preUiGate":true}'::jsonb)
on conflict(module_key) do update set
  phase_code=excluded.phase_code,
  label=excluded.label,
  runtime_lib=excluded.runtime_lib,
  api_prefix=excluded.api_prefix,
  owner_system=excluded.owner_system,
  required_tables=excluded.required_tables,
  required_actions=excluded.required_actions,
  depends_on_modules=excluded.depends_on_modules,
  coverage_status=excluded.coverage_status,
  ui_build_status=excluded.ui_build_status,
  metadata_json=public.ac360_phase2_module_coverage_matrix.metadata_json || excluded.metadata_json,
  updated_at=now();

-- Action contract seeds for Phase 2S actions. Historical actions are validated through required_actions and app_action_wiring.
insert into public.ac360_phase2_action_contracts(module_key,action_key,wiring_key,route_path,http_method,guard_required,policy_required,audit_required,usage_record_required,status,metadata_json)
values
('phase2_runtime_qa_pre_ui_gate','phase2.runtime_qa.run','ac360.phase2s.runtime_qa.run','/api/ac360/phase2-runtime-qa/run','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase2.coverage.refresh','ac360.phase2s.coverage.refresh','/api/ac360/phase2-runtime-qa/coverage/refresh','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase2.integrity.run','ac360.phase2s.integrity.run','/api/ac360/phase2-runtime-qa/integrity/run','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase2.pre_ui_gate.evaluate','ac360.phase2s.pre_ui_gate.evaluate','/api/ac360/phase2-runtime-qa/pre-ui-gate/evaluate','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase2.pre_ui_gate.decide','ac360.phase2s.pre_ui_gate.decide','/api/ac360/phase2-runtime-qa/pre-ui-gate/decision','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase2.hardening_event.record','ac360.phase2s.hardening_event.record','/api/ac360/phase2-runtime-qa/hardening/events','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb),
('phase2_runtime_qa_pre_ui_gate','phase2.alert.resolve','ac360.phase2s.alert.resolve','/api/ac360/phase2-runtime-qa/alerts/resolve','POST',true,true,true,true,'expected','{"phase":"phase_2s"}'::jsonb)
on conflict(action_key,wiring_key) do update set
  module_key=excluded.module_key,
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  guard_required=excluded.guard_required,
  policy_required=excluded.policy_required,
  audit_required=excluded.audit_required,
  usage_record_required=excluded.usage_record_required,
  status=excluded.status,
  metadata_json=public.ac360_phase2_action_contracts.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_phase2_integrity_rules(rule_key,label,source_module,target_module,severity,rule_type,expected_json,status,metadata_json)
values
('phase2.required_tables.present','All Phase 2 required tables exist','phase2_runtime_qa_pre_ui_gate',null,'critical','table_presence','{"source":"coverage_matrix.required_tables"}'::jsonb,'active','{"phase":"phase_2s"}'::jsonb),
('phase2.required_actions.registered','All Phase 2 required actions are registered','phase2_runtime_qa_pre_ui_gate',null,'critical','action_presence','{"source":"coverage_matrix.required_actions"}'::jsonb,'active','{"phase":"phase_2s"}'::jsonb),
('phase2.required_actions.wired','All Phase 2 required actions have strict route wiring','phase2_runtime_qa_pre_ui_gate',null,'critical','wiring_presence','{"source":"ac360_app_action_wiring"}'::jsonb,'active','{"phase":"phase_2s"}'::jsonb),
('phase2.ui.locked.until_instruction','UI build stays locked until user gives instructions','phase2_runtime_qa_pre_ui_gate',null,'critical','policy_presence','{"uiBuildAllowed":false}'::jsonb,'active','{"phase":"phase_2s"}'::jsonb),
('phase2.archive_not_delete.doctrine','Archive-not-delete doctrine stays enforced','phase2_runtime_qa_pre_ui_gate',null,'high','runtime_contract','{"archiveNotDelete":true}'::jsonb,'active','{"phase":"phase_2s"}'::jsonb)
on conflict(rule_key) do update set
  label=excluded.label,
  source_module=excluded.source_module,
  target_module=excluded.target_module,
  severity=excluded.severity,
  rule_type=excluded.rule_type,
  expected_json=excluded.expected_json,
  status=excluded.status,
  metadata_json=public.ac360_phase2_integrity_rules.metadata_json || excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. Functions
-- -----------------------------------------------------------------------------
create or replace function public.ac360_phase2_record_qa_result(
  p_run_id uuid,
  p_org_id uuid,
  p_check_key text,
  p_check_group text,
  p_severity text,
  p_status text,
  p_message text,
  p_expected jsonb default '{}'::jsonb,
  p_actual jsonb default '{}'::jsonb,
  p_remediation text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.ac360_phase2_runtime_qa_results(run_id,org_id,check_key,check_group,severity,status,message,expected_json,actual_json,remediation_hint)
  values(p_run_id,p_org_id,p_check_key,p_check_group,p_severity,p_status,p_message,coalesce(p_expected,'{}'::jsonb),coalesce(p_actual,'{}'::jsonb),p_remediation)
  on conflict(run_id,check_key) do update set
    check_group=excluded.check_group,
    severity=excluded.severity,
    status=excluded.status,
    message=excluded.message,
    expected_json=excluded.expected_json,
    actual_json=excluded.actual_json,
    remediation_hint=excluded.remediation_hint
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.ac360_run_phase2_runtime_qa(
  p_org_id uuid,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_run_key text := 'PH2S-QA-' || to_char(now(),'YYYYMMDDHH24MISSMS');
  m record;
  t text;
  a text;
  v_exists boolean;
  v_total integer := 0;
  v_passed integer := 0;
  v_failed integer := 0;
  v_warning integer := 0;
  v_critical integer := 0;
  v_score numeric(5,2) := 0;
begin
  insert into public.ac360_phase2_runtime_qa_runs(org_id,run_key,run_type,status,metadata_json,created_by)
  values(p_org_id,v_run_key,'phase2_runtime_qa','running',coalesce(p_metadata,'{}'::jsonb) || '{"phase":"phase_2s","uiBuildAllowed":false}'::jsonb,p_actor_app_user_id)
  returning id into v_run_id;

  for m in select * from public.ac360_phase2_module_coverage_matrix where phase_code like 'phase_2%' order by phase_code, module_key loop
    v_total := v_total + 1;
    perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'module.'||m.module_key,'module_coverage','high','passed','Module registered in Phase 2 coverage matrix.',jsonb_build_object('module_key',m.module_key),jsonb_build_object('phase_code',m.phase_code,'ui_build_status',m.ui_build_status),null);
    v_passed := v_passed + 1;

    if m.ui_build_status <> 'locked' then
      v_total := v_total + 1;
      perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'ui_lock.'||m.module_key,'ui_lock','critical','failed','UI build lock is not strict for module '||m.module_key,jsonb_build_object('expected','locked'),jsonb_build_object('actual',m.ui_build_status),'Reset ui_build_status to locked before pre-UI gate.');
      v_failed := v_failed + 1; v_critical := v_critical + 1;
    else
      v_total := v_total + 1;
      perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'ui_lock.'||m.module_key,'ui_lock','critical','passed','UI build remains locked for module '||m.module_key,jsonb_build_object('expected','locked'),jsonb_build_object('actual',m.ui_build_status),null);
      v_passed := v_passed + 1;
    end if;

    foreach t in array coalesce(m.required_tables,'{}'::text[]) loop
      v_exists := to_regclass('public.' || t) is not null;
      v_total := v_total + 1;
      if v_exists then
        perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'table.'||t,'table_presence','critical','passed','Required table exists: '||t,jsonb_build_object('table',t),jsonb_build_object('exists',true),null);
        v_passed := v_passed + 1;
      else
        perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'table.'||t,'table_presence','critical','failed','Required table missing: '||t,jsonb_build_object('table',t),jsonb_build_object('exists',false),'Apply the missing phase migration or repair table naming compatibility.');
        v_failed := v_failed + 1; v_critical := v_critical + 1;
        insert into public.ac360_phase2_integrity_findings(org_id,run_id,rule_key,module_key,severity,status,message,evidence_json,remediation_hint)
        values(p_org_id,v_run_id,'phase2.required_tables.present',m.module_key,'critical','open','Missing required table '||t,jsonb_build_object('table',t,'module_key',m.module_key),'Apply/re-run the owning migration for '||m.phase_code||'.');
      end if;
    end loop;

    foreach a in array coalesce(m.required_actions,'{}'::text[]) loop
      v_total := v_total + 1;
      select exists(select 1 from public.ac360_action_registry where action_key = a) into v_exists;
      if v_exists then
        perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'action.'||a,'action_registry','critical','passed','Required action registered: '||a,jsonb_build_object('action_key',a),jsonb_build_object('exists',true),null);
        v_passed := v_passed + 1;
      else
        perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'action.'||a,'action_registry','critical','failed','Required action missing from action registry: '||a,jsonb_build_object('action_key',a),jsonb_build_object('exists',false),'Patch action registry seed for the owning phase.');
        v_failed := v_failed + 1; v_critical := v_critical + 1;
      end if;

      v_total := v_total + 1;
      select exists(select 1 from public.ac360_app_action_wiring where action_key = a and status = 'active' and enforcement_mode = 'strict') into v_exists;
      if v_exists then
        perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'wiring.'||a,'action_wiring','critical','passed','Required action has strict app wiring: '||a,jsonb_build_object('action_key',a),jsonb_build_object('strict_wiring',true),null);
        v_passed := v_passed + 1;
      else
        perform public.ac360_phase2_record_qa_result(v_run_id,p_org_id,'wiring.'||a,'action_wiring','critical','failed','Required action missing strict app wiring: '||a,jsonb_build_object('action_key',a),jsonb_build_object('strict_wiring',false),'Patch lib/ac360/action-wiring.ts and ac360_app_action_wiring seeds.');
        v_failed := v_failed + 1; v_critical := v_critical + 1;
      end if;
    end loop;
  end loop;

  v_score := case when v_total = 0 then 0 else round((v_passed::numeric / v_total::numeric) * 100, 2) end;

  update public.ac360_phase2_runtime_qa_runs
  set status = case when v_critical > 0 then 'failed' when v_warning > 0 then 'warning' else 'passed' end,
      readiness_score = v_score,
      critical_failures = v_critical,
      warning_count = v_warning,
      passed_count = v_passed,
      failed_count = v_failed,
      completed_at = now(),
      updated_at = now(),
      summary_json = jsonb_build_object('total_checks',v_total,'passed',v_passed,'failed',v_failed,'critical_failures',v_critical,'warnings',v_warning,'readiness_score',v_score,'uiBuildAllowed',false,'nextGate','phase2_pre_ui_gate')
  where id = v_run_id;

  if v_critical > 0 then
    insert into public.ac360_phase2_runtime_alerts(org_id,alert_key,alert_type,severity,status,module_key,title,message,related_run_id,metadata_json)
    values(p_org_id,'PH2S-QA-CRITICAL-'||v_run_id,'qa','critical','open','phase2_runtime_qa_pre_ui_gate','Phase 2 runtime QA has critical failures','Critical failures must be repaired before any UI build.',v_run_id,jsonb_build_object('critical_failures',v_critical,'readiness_score',v_score))
    on conflict(org_id,alert_key) do nothing;
  end if;

  return jsonb_build_object('ok',true,'run_id',v_run_id,'run_key',v_run_key,'status',case when v_critical > 0 then 'failed' when v_warning > 0 then 'warning' else 'passed' end,'readiness_score',v_score,'critical_failures',v_critical,'warning_count',v_warning,'passed_count',v_passed,'failed_count',v_failed,'uiBuildAllowed',false);
end $$;

create or replace function public.ac360_phase2_runtime_dashboard(p_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_latest record;
  v_modules integer := 0;
  v_tables integer := 0;
  v_actions integer := 0;
  v_strict_wiring integer := 0;
  v_open_alerts integer := 0;
  v_gate record;
begin
  select * into v_latest from public.ac360_phase2_runtime_qa_runs where org_id = p_org_id order by created_at desc limit 1;
  select count(*) into v_modules from public.ac360_phase2_module_coverage_matrix where phase_code like 'phase_2%';
  select coalesce(sum(cardinality(required_tables)),0) into v_tables from public.ac360_phase2_module_coverage_matrix where phase_code like 'phase_2%';
  select coalesce(sum(cardinality(required_actions)),0) into v_actions from public.ac360_phase2_module_coverage_matrix where phase_code like 'phase_2%';
  select count(*) into v_strict_wiring from public.ac360_app_action_wiring where status='active' and enforcement_mode='strict' and (target_module like 'angelcare_360%' or target_module like 'email_os%' or target_module like 'capital%');
  select count(*) into v_open_alerts from public.ac360_phase2_runtime_alerts where org_id = p_org_id and status in ('open','acknowledged');
  select * into v_gate from public.ac360_phase2_pre_ui_gates where org_id = p_org_id and gate_key = 'phase2-pre-ui-master-gate' order by created_at desc limit 1;

  return jsonb_build_object(
    'ok',true,
    'phase','phase_2s_runtime_qa_pre_ui_gate',
    'uiBuildAllowed',false,
    'modules_tracked',v_modules,
    'required_tables_tracked',v_tables,
    'required_actions_tracked',v_actions,
    'strict_wiring_rows',v_strict_wiring,
    'open_alerts',v_open_alerts,
    'latest_run',case when v_latest.id is null then null else jsonb_build_object('id',v_latest.id,'run_key',v_latest.run_key,'status',v_latest.status,'readiness_score',v_latest.readiness_score,'critical_failures',v_latest.critical_failures,'warning_count',v_latest.warning_count,'created_at',v_latest.created_at,'completed_at',v_latest.completed_at) end,
    'pre_ui_gate',case when v_gate.id is null then jsonb_build_object('status','locked','uiBuildAllowed',false,'message','Gate not evaluated yet.') else jsonb_build_object('id',v_gate.id,'status',v_gate.status,'uiBuildAllowed',v_gate.ui_build_allowed,'readiness_score',v_gate.readiness_score,'critical_failures',v_gate.critical_failures,'warning_count',v_gate.warning_count,'decision_reason',v_gate.decision_reason,'decision_at',v_gate.decision_at) end
  );
end $$;

create or replace function public.ac360_refresh_phase2_coverage_matrix(p_org_id uuid, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modules integer;
  v_actions integer;
begin
  update public.ac360_phase2_module_coverage_matrix
  set coverage_status = 'covered', updated_at = now()
  where phase_code like 'phase_2%'
    and not exists (
      select 1 from unnest(required_tables) t where to_regclass('public.'||t) is null
    );

  update public.ac360_phase2_module_coverage_matrix
  set coverage_status = 'partial', updated_at = now()
  where phase_code like 'phase_2%'
    and exists (
      select 1 from unnest(required_tables) t where to_regclass('public.'||t) is null
    );

  select count(*) into v_modules from public.ac360_phase2_module_coverage_matrix where phase_code like 'phase_2%';
  select count(*) into v_actions from public.ac360_app_action_wiring where status='active' and enforcement_mode='strict';

  insert into public.ac360_phase2_hardening_events(org_id,event_key,event_type,severity,status,title,message,module_key,evidence_json,created_by,metadata_json)
  values(p_org_id,'PH2S-COVERAGE-REFRESH-'||to_char(now(),'YYYYMMDDHH24MISSMS'),'coverage','medium','resolved','Phase 2 coverage matrix refreshed','Coverage matrix refreshed from database state.','phase2_runtime_qa_pre_ui_gate',jsonb_build_object('modules',v_modules,'strict_wiring',v_actions),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,event_key) do nothing;

  return jsonb_build_object('ok',true,'modules',v_modules,'strict_wiring',v_actions,'uiBuildAllowed',false);
end $$;

create or replace function public.ac360_run_phase2_integrity(p_org_id uuid, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run jsonb;
  v_run_id uuid;
  v_open_findings integer;
begin
  v_run := public.ac360_run_phase2_runtime_qa(p_org_id,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb) || '{"integrityRun":true}'::jsonb);
  v_run_id := (v_run->>'run_id')::uuid;
  select count(*) into v_open_findings from public.ac360_phase2_integrity_findings where org_id = p_org_id and status = 'open';
  return v_run || jsonb_build_object('integrity_findings_open',v_open_findings);
end $$;

create or replace function public.ac360_evaluate_phase2_pre_ui_gate(p_org_id uuid, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run jsonb;
  v_run_id uuid;
  v_score numeric;
  v_critical integer;
  v_warning integer;
  v_status text;
begin
  v_run := public.ac360_run_phase2_runtime_qa(p_org_id,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb) || '{"preUiGateEvaluation":true}'::jsonb);
  v_run_id := (v_run->>'run_id')::uuid;
  v_score := coalesce((v_run->>'readiness_score')::numeric,0);
  v_critical := coalesce((v_run->>'critical_failures')::integer,0);
  v_warning := coalesce((v_run->>'warning_count')::integer,0);
  v_status := case when v_critical > 0 then 'blocked' when v_score >= 98 then 'ready_for_instruction' else 'locked' end;

  insert into public.ac360_phase2_pre_ui_gates(org_id,gate_key,gate_type,status,ui_build_allowed,readiness_score,qa_run_id,critical_failures,warning_count,decision_reason,decision_by,decision_at,gate_json,metadata_json)
  values(p_org_id,'phase2-pre-ui-master-gate','phase2_pre_ui',v_status,false,v_score,v_run_id,v_critical,v_warning,
         case when v_status='ready_for_instruction' then 'Backend runtime is ready for user UI/UX instructions, but UI build remains locked until explicit instruction.' else 'Backend runtime is not ready for UI instructions yet.' end,
         p_actor_app_user_id,now(),jsonb_build_object('phase','phase_2s','uiBuildAllowed',false,'mustAskUserForUiInstructions',true,'run',v_run),coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,gate_key) do update set
    status=excluded.status,
    ui_build_allowed=false,
    readiness_score=excluded.readiness_score,
    qa_run_id=excluded.qa_run_id,
    critical_failures=excluded.critical_failures,
    warning_count=excluded.warning_count,
    decision_reason=excluded.decision_reason,
    decision_by=excluded.decision_by,
    decision_at=excluded.decision_at,
    gate_json=excluded.gate_json,
    metadata_json=public.ac360_phase2_pre_ui_gates.metadata_json || excluded.metadata_json,
    updated_at=now();

  return jsonb_build_object('ok',true,'gate_key','phase2-pre-ui-master-gate','status',v_status,'uiBuildAllowed',false,'readiness_score',v_score,'critical_failures',v_critical,'warning_count',v_warning,'mustAskUserForUiInstructions',v_status='ready_for_instruction');
end $$;

create or replace function public.ac360_decide_phase2_pre_ui_gate(p_org_id uuid, p_decision text, p_reason text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_allow boolean := false;
begin
  v_status := case
    when p_decision in ('lock','locked') then 'locked'
    when p_decision in ('block','blocked') then 'blocked'
    when p_decision in ('ready','ready_for_instruction') then 'ready_for_instruction'
    when p_decision in ('approve_ui_design','approved_for_ui_design') then 'approved_for_ui_design'
    else 'locked'
  end;

  -- Safety doctrine: even approved_for_ui_design does not start building UI; it only records permission to request user instructions.
  v_allow := false;

  insert into public.ac360_phase2_pre_ui_gates(org_id,gate_key,gate_type,status,ui_build_allowed,readiness_score,critical_failures,warning_count,decision_reason,decision_by,decision_at,gate_json,metadata_json)
  values(p_org_id,'phase2-pre-ui-master-gate','phase2_pre_ui',v_status,v_allow,0,0,0,coalesce(p_reason,'Manual Phase 2 pre-UI gate decision.'),p_actor_app_user_id,now(),jsonb_build_object('manualDecision',p_decision,'uiBuildAllowed',v_allow,'mustAskUserForUiInstructions',true),coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,gate_key) do update set
    status=excluded.status,
    ui_build_allowed=excluded.ui_build_allowed,
    decision_reason=excluded.decision_reason,
    decision_by=excluded.decision_by,
    decision_at=excluded.decision_at,
    gate_json=public.ac360_phase2_pre_ui_gates.gate_json || excluded.gate_json,
    metadata_json=public.ac360_phase2_pre_ui_gates.metadata_json || excluded.metadata_json,
    updated_at=now();

  return jsonb_build_object('ok',true,'gate_key','phase2-pre-ui-master-gate','status',v_status,'uiBuildAllowed',v_allow,'mustAskUserForUiInstructions',true);
end $$;

create or replace function public.ac360_record_phase2_hardening_event(p_org_id uuid, p_event_type text, p_title text, p_message text default null, p_severity text default 'medium', p_module_key text default null, p_action_key text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text := 'PH2S-HARDEN-' || to_char(now(),'YYYYMMDDHH24MISSMS');
begin
  insert into public.ac360_phase2_hardening_events(org_id,event_key,event_type,severity,status,title,message,module_key,action_key,evidence_json,created_by,metadata_json)
  values(p_org_id,v_key,coalesce(nullif(p_event_type,''),'hardening'),coalesce(nullif(p_severity,''),'medium'),'open',coalesce(nullif(p_title,''),'Phase 2 hardening event'),p_message,p_module_key,p_action_key,coalesce(p_metadata,'{}'::jsonb),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return jsonb_build_object('ok',true,'event_id',v_id,'event_key',v_key);
end $$;

create or replace function public.ac360_resolve_phase2_runtime_alert(p_org_id uuid, p_alert_id uuid default null, p_alert_key text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.ac360_phase2_runtime_alerts
  set status='resolved', resolved_at=now(), resolved_by=p_actor_app_user_id, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where org_id=p_org_id and status in ('open','acknowledged') and (id=p_alert_id or alert_key=p_alert_key);
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok',true,'resolved_count',v_count);
end $$;

-- -----------------------------------------------------------------------------
-- 5. RLS and service-role policy
-- -----------------------------------------------------------------------------
alter table public.ac360_phase2_runtime_qa_runs enable row level security;
alter table public.ac360_phase2_runtime_qa_results enable row level security;
alter table public.ac360_phase2_module_coverage_matrix enable row level security;
alter table public.ac360_phase2_action_contracts enable row level security;
alter table public.ac360_phase2_integrity_rules enable row level security;
alter table public.ac360_phase2_integrity_findings enable row level security;
alter table public.ac360_phase2_hardening_events enable row level security;
alter table public.ac360_phase2_pre_ui_gates enable row level security;
alter table public.ac360_phase2_runtime_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_phase2_runtime_qa_runs','ac360_phase2_runtime_qa_results','ac360_phase2_module_coverage_matrix','ac360_phase2_action_contracts','ac360_phase2_integrity_rules','ac360_phase2_integrity_findings','ac360_phase2_hardening_events','ac360_phase2_pre_ui_gates','ac360_phase2_runtime_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
