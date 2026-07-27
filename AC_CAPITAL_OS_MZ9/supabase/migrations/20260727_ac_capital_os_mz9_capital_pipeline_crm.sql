create extension if not exists pgcrypto;

create table if not exists public.ac_capital_pipeline_records (
  id uuid primary key default gen_random_uuid(),
  opportunity_id text,
  qualification_dossier_id text,
  funder_id text,
  case_id text,
  data_room_package_id text,
  title text not null,
  stage text not null,
  status text not null default 'Active',
  funding_type text,
  package_type text,
  estimated_amount_min numeric(14,2),
  estimated_amount_max numeric(14,2),
  currency_label text not null default 'Dh',
  weighted_value numeric(14,2),
  probability_percent numeric(5,2) check (probability_percent >= 0 and probability_percent <= 100),
  deadline date,
  next_action text,
  next_action_due_date date,
  owner text,
  priority text,
  relationship_temperature text,
  risk_level text,
  readiness_score numeric(5,2) check (readiness_score >= 0 and readiness_score <= 100),
  founder_approval_status text,
  data_room_readiness_score numeric(5,2) check (data_room_readiness_score >= 0 and data_room_readiness_score <= 100),
  last_contact_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_stage_events (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  previous_stage text,
  new_stage text not null,
  changed_by text,
  changed_at timestamptz not null default now(),
  reason text,
  evidence_reference text,
  comments text
);

create table if not exists public.ac_capital_pipeline_followups (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  followup_type text not null,
  channel text not null,
  recipient_name text,
  recipient_role text,
  due_date timestamptz,
  priority text,
  status text not null default 'Planned',
  script_available boolean not null default false,
  documents_needed text[] not null default '{}',
  risk_if_missed text,
  owner text,
  completion_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_tasks (
  id uuid primary key default gen_random_uuid(),
  task_title text not null,
  type text not null,
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete set null,
  case_id text,
  funder_id text,
  owner text,
  priority text,
  due_date date,
  status text not null default 'Open',
  instructions text,
  proof_required boolean not null default false,
  founder_approval_required boolean not null default false,
  related_documents text[] not null default '{}',
  completion_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_communications (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  channel text not null,
  contact_person text,
  subject text,
  summary text,
  outcome text,
  next_action text,
  proof_reference text,
  occurred_at timestamptz,
  logged_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_submissions (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  case_id text,
  package_id text,
  submitted_by text,
  submitted_at timestamptz,
  recipient text,
  method text,
  documents_included text[] not null default '{}',
  version_submitted text,
  proof_of_submission_reference text,
  confirmation_received boolean not null default false,
  followup_date date,
  result_status text not null default 'Prepared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_due_diligence_requests (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  request_title text not null,
  requested_by text,
  requested_date date,
  due_date date,
  required_document text,
  source_workspace text,
  responsible_owner text,
  status text not null default 'New Request',
  risk_if_late text,
  founder_approval_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_negotiations (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  amount_discussed text,
  instrument_type text,
  terms_requested text,
  repayment_terms text,
  equity_dilution_note text,
  guarantee_requirement text,
  documents_required text[] not null default '{}',
  founder_review_required boolean not null default false,
  risk_note text,
  negotiation_status text not null default 'Not Started',
  next_meeting timestamptz,
  decision_owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_outcomes (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  outcome text not null,
  reason text,
  funder_feedback text,
  missing_proof_identified text,
  objection_learned text,
  document_weakness text,
  next_improvement text,
  doctrine_update_needed boolean not null default false,
  data_room_update_needed boolean not null default false,
  qualification_score_adjustment_needed boolean not null default false,
  future_relationship_action text,
  status text not null default 'Recorded',
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_learning_items (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete cascade,
  outcome text,
  reason text,
  objection_learned text,
  missing_proof text,
  doctrine_update_needed boolean not null default false,
  data_room_update_needed boolean not null default false,
  qualification_update_needed boolean not null default false,
  next_recommendation text,
  status text not null default 'Pending Doctrine Review',
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_calendar_events (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete set null,
  event_type text not null,
  title text not null,
  event_date date,
  priority text,
  status text not null default 'Scheduled',
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_pipeline_audit_events (
  id uuid primary key default gen_random_uuid(),
  pipeline_record_id uuid references public.ac_capital_pipeline_records(id) on delete set null,
  actor text,
  action text not null,
  object_type text,
  object_id text,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.ac_capital_pipeline_records enable row level security;
alter table public.ac_capital_pipeline_stage_events enable row level security;
alter table public.ac_capital_pipeline_followups enable row level security;
alter table public.ac_capital_pipeline_tasks enable row level security;
alter table public.ac_capital_pipeline_communications enable row level security;
alter table public.ac_capital_pipeline_submissions enable row level security;
alter table public.ac_capital_pipeline_due_diligence_requests enable row level security;
alter table public.ac_capital_pipeline_negotiations enable row level security;
alter table public.ac_capital_pipeline_outcomes enable row level security;
alter table public.ac_capital_pipeline_learning_items enable row level security;
alter table public.ac_capital_pipeline_calendar_events enable row level security;
alter table public.ac_capital_pipeline_audit_events enable row level security;
