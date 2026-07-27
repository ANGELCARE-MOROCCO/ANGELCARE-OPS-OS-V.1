-- AC CAPITAL OS · Mega ZIP 04 · Qualification Engine foundation
-- Contract marker: MZ4_AC_CAPITAL_OS_QUALIFICATION_ENGINE
-- Purpose: score Capital Radar opportunities into AngelCare-specific pursuit dossiers.

create table if not exists public.ac_capital_qualification_dossiers (
  id uuid primary key default gen_random_uuid(),
  radar_opportunity_id uuid,
  title text not null,
  opportunity_type text not null,
  country text,
  region text,
  source_confidence integer default 0,
  total_score integer default 0,
  decision_label text not null,
  ai_confidence integer default 0,
  status text not null default 'new-from-radar',
  priority text not null default 'medium',
  deadline text,
  deadline_risk text,
  documentation_readiness integer default 0,
  founder_review_required boolean not null default false,
  recommended_owner text,
  next_action text,
  executive_summary text,
  eligibility_summary text,
  angelcare_match_summary text,
  strategic_exception text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac_capital_qualification_criteria (
  id uuid primary key default gen_random_uuid(),
  criterion_key text not null unique,
  criterion_label text not null,
  purpose text,
  default_weight integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_qualification_scores (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ac_capital_qualification_dossiers(id) on delete cascade,
  criterion_key text not null,
  criterion_label text not null,
  weight integer not null default 0,
  score integer not null default 0,
  weighted_score numeric(8,2) not null default 0,
  explanation text,
  evidence_status text,
  confidence integer default 0,
  missing_evidence text,
  risk_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_qualification_decisions (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ac_capital_qualification_dossiers(id) on delete cascade,
  decision_label text not null,
  decision_reason text,
  decided_by text default 'ai-seeded-contract',
  founder_review_required boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_qualification_risks (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ac_capital_qualification_dossiers(id) on delete cascade,
  risk_type text not null,
  severity text not null,
  description text not null,
  mitigation text,
  owner text,
  founder_review_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_qualification_missing_documents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ac_capital_qualification_dossiers(id) on delete cascade,
  document_name text not null,
  document_category text,
  status text not null default 'Missing',
  priority text not null default 'medium',
  required_for_submission boolean not null default true,
  owner text,
  due_date text,
  created_at timestamptz not null default now()
);

create table if not exists public.ac_capital_qualification_next_actions (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.ac_capital_qualification_dossiers(id) on delete cascade,
  action_label text not null,
  why text,
  owner text,
  priority text not null default 'medium',
  deadline text,
  expected_output text,
  related_workspace text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists idx_ac_capital_qualification_dossiers_status on public.ac_capital_qualification_dossiers(status);
create index if not exists idx_ac_capital_qualification_dossiers_score on public.ac_capital_qualification_dossiers(total_score desc);
create index if not exists idx_ac_capital_qualification_scores_dossier on public.ac_capital_qualification_scores(dossier_id);
create index if not exists idx_ac_capital_qualification_risks_dossier on public.ac_capital_qualification_risks(dossier_id);
create index if not exists idx_ac_capital_qualification_docs_dossier on public.ac_capital_qualification_missing_documents(dossier_id);
