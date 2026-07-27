create extension if not exists pgcrypto;

create table if not exists public.ac_capital_coordinator_tasks (
  id uuid primary key default gen_random_uuid(),
  task_title text not null,
  task_type text not null,
  related_case_id text,
  related_funder_id text,
  related_pipeline_record_id text,
  related_document_id text,
  priority text,
  status text not null default 'Ready',
  due_at timestamptz,
  owner text,
  ai_prepared boolean not null default false,
  human_action_required text,
  proof_required boolean not null default false,
  founder_approval_required boolean not null default false,
  risk_if_missed text,
  next_step_after_completion text,
  source_workspace text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_ai_prepared_tasks (
  id uuid primary key default gen_random_uuid(),
  prepared_by text,
  linked_case_id text,
  linked_pipeline_record_id text,
  linked_data_room_item_id text,
  linked_funder_id text,
  ai_confidence numeric(5,2) check (ai_confidence >= 0 and ai_confidence <= 100),
  doctrine_used text[] not null default '{}',
  script_or_document_prepared text,
  approval_required boolean not null default false,
  human_safety_check text,
  recommended_action text,
  rejection_reason text,
  regeneration_requested boolean not null default false,
  status text not null default 'Pending Human Review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_manual_emails (
  id uuid primary key default gen_random_uuid(),
  related_task_id text,
  related_case_id text,
  related_funder_id text,
  recipient text,
  subject text,
  body_draft text,
  suggested_attachments text[] not null default '{}',
  tone text,
  approval_required boolean not null default false,
  approval_status text,
  risk_notes text[] not null default '{}',
  send_instruction text,
  proof_required_after_sending boolean not null default true,
  followup_date date,
  status text not null default 'Prepared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_call_logs (
  id uuid primary key default gen_random_uuid(),
  related_task_id text,
  contact_person text,
  objective text,
  script text,
  questions_to_ask text[] not null default '{}',
  documents_to_reference text[] not null default '{}',
  risks_to_avoid text[] not null default '{}',
  call_status text not null default 'Planned',
  call_summary text,
  outcome text,
  next_action text,
  followup_date date,
  proof_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_proof_tasks (
  id uuid primary key default gen_random_uuid(),
  proof_required text not null,
  related_case_id text,
  related_funder_id text,
  required_document_type text,
  source_workspace text,
  urgency text,
  sensitivity text,
  founder_approval_required boolean not null default false,
  signature_required boolean not null default false,
  stamp_required boolean not null default false,
  data_room_target_category text,
  instructions text,
  status text not null default 'Waiting Proof',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_founder_approvals (
  id uuid primary key default gen_random_uuid(),
  approval_title text not null,
  approving_founder text,
  related_case_id text,
  related_document_id text,
  reason_required text,
  risk_if_unapproved text,
  due_at timestamptz,
  status text not null default 'Pending Founder Review',
  comments text[] not null default '{}',
  approval_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_submission_readiness (
  id uuid primary key default gen_random_uuid(),
  case_title text not null,
  funder text,
  package_type text,
  package_readiness numeric(5,2) check (package_readiness >= 0 and package_readiness <= 100),
  data_room_readiness numeric(5,2) check (data_room_readiness >= 0 and data_room_readiness <= 100),
  founder_approval_status text,
  required_documents_status text,
  scripts_ready boolean not null default false,
  submission_method text,
  deadline date,
  remaining_blockers text[] not null default '{}',
  final_coordinator_checklist text[] not null default '{}',
  status text not null default 'Preparing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_escalations (
  id uuid primary key default gen_random_uuid(),
  severity text not null,
  reason text not null,
  related_case_id text,
  related_funder_id text,
  recommended_target text,
  deadline timestamptz,
  status text not null default 'New',
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_handover_sheets (
  id uuid primary key default gen_random_uuid(),
  case_summary text not null,
  funder text,
  package_type text,
  deadline date,
  what_ai_prepared text[] not null default '{}',
  what_human_must_do text[] not null default '{}',
  documents_ready text[] not null default '{}',
  documents_missing text[] not null default '{}',
  founder_approvals text[] not null default '{}',
  email_call_scripts text[] not null default '{}',
  proof_to_upload_after_execution text[] not null default '{}',
  followup_date date,
  escalation_conditions text[] not null default '{}',
  final_checklist text[] not null default '{}',
  status text not null default 'Ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_safety_warnings (
  id uuid primary key default gen_random_uuid(),
  warning_label text not null,
  severity text,
  related_case_id text,
  related_task_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_completion_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  related_task_id text,
  completed_by text,
  completed_at timestamptz,
  proof_reference text,
  next_action_created boolean not null default false,
  pipeline_update_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_coordinator_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  object_type text,
  object_id text,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.ac_capital_coordinator_tasks enable row level security;
alter table public.ac_capital_coordinator_ai_prepared_tasks enable row level security;
alter table public.ac_capital_coordinator_manual_emails enable row level security;
alter table public.ac_capital_coordinator_call_logs enable row level security;
alter table public.ac_capital_coordinator_proof_tasks enable row level security;
alter table public.ac_capital_coordinator_founder_approvals enable row level security;
alter table public.ac_capital_coordinator_submission_readiness enable row level security;
alter table public.ac_capital_coordinator_escalations enable row level security;
alter table public.ac_capital_coordinator_handover_sheets enable row level security;
alter table public.ac_capital_coordinator_safety_warnings enable row level security;
alter table public.ac_capital_coordinator_completion_events enable row level security;
alter table public.ac_capital_coordinator_audit_events enable row level security;
