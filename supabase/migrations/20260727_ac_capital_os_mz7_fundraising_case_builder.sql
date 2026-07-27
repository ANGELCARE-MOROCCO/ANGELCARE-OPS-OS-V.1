-- AC CAPITAL OS MZ7 - Fundraising Case Builder + Capital Package Factory
-- Contract token: MZ7_AC_CAPITAL_OS_FUNDRAISING_CASE_BUILDER

create table if not exists public.ac_capital_cases (
  id uuid primary key default gen_random_uuid(),
  qualification_dossier_id uuid,
  funder_id uuid,
  opportunity_id uuid,
  case_title text not null,
  package_type text not null,
  funding_type text,
  requested_amount numeric,
  currency_label text default 'Dh',
  deadline date,
  total_readiness_score integer default 0,
  doctrine_alignment_score integer default 0,
  document_readiness_score integer default 0,
  financial_readiness_score integer default 0,
  risk_readiness_score integer default 0,
  founder_approval_status text default 'not_started',
  coordinator_handover_status text default 'not_started',
  status text default 'new_from_qualification',
  priority text default 'medium',
  owner text,
  next_action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_stages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  stage_label text not null,
  status text not null,
  readiness integer default 0,
  owner text,
  blockers text,
  ai_confidence integer,
  founder_approval_required boolean default false,
  action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  document_name text not null,
  category text,
  required_for_submission boolean default false,
  status text default 'missing',
  priority text default 'medium',
  owner text,
  source_workspace text,
  deadline date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_narratives (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  narrative_type text not null,
  headline text,
  opening_message text,
  proof_to_emphasize text,
  language_to_avoid text,
  required_annexes text,
  tone text,
  founder_review_required boolean default false,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_positioning_blocks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  block_label text not null,
  include_in_package boolean default true,
  recommended_emphasis text,
  tone text,
  risk_note text,
  proof_needed text,
  document_reference text,
  source_doctrine text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_financial_sections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  requested_amount numeric,
  currency_label text default 'Dh',
  funding_instrument_type text,
  use_of_funds jsonb default '[]'::jsonb,
  revenue_stream_mapping jsonb default '[]'::jsonb,
  conservative_scenario text,
  base_scenario text,
  upside_scenario text,
  bank_repayment_safe_explanation text,
  dilution_control_note text,
  status text default 'ai_draft_ready',
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_risk_plans (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  risk_type text not null,
  severity text not null,
  likelihood text,
  description text,
  mitigation text,
  plan_b text,
  plan_c text,
  plan_d text,
  owner text,
  founder_review_required boolean default false,
  related_proof text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_impact_sections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  impact_category text not null,
  statement text,
  measurable_indicator text,
  proof_needed text,
  risk_of_overclaiming text,
  recommended_wording text,
  relevant_funding_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_outreach_scripts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  script_type text not null,
  recipient_type text,
  subject text,
  body text,
  tone text,
  attachments_suggested jsonb default '[]'::jsonb,
  approval_required boolean default true,
  risk_notes text,
  coordinator_instruction text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_proof_packs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  proof_type text not null,
  available boolean default false,
  credibility_level text,
  source text,
  last_updated date,
  reusable boolean default true,
  required_for_case boolean default false,
  owner text,
  attach_to_package boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_founder_approvals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  approval_item text not null,
  status text default 'required',
  reason text,
  approver text,
  due_date date,
  comments text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_coordinator_handovers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  block text not null,
  instruction text,
  owner text,
  deadline date,
  proof_after_action text,
  escalation_condition text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ac_capital_case_audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ac_capital_cases(id) on delete cascade,
  actor_id uuid,
  action text not null,
  object_type text,
  object_id uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_ac_capital_cases_status on public.ac_capital_cases(status);
create index if not exists idx_ac_capital_cases_package_type on public.ac_capital_cases(package_type);
create index if not exists idx_ac_capital_case_documents_case on public.ac_capital_case_documents(case_id);
create index if not exists idx_ac_capital_case_risk_plans_case on public.ac_capital_case_risk_plans(case_id);
