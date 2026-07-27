-- AC CAPITAL OS MZ8 - Due Diligence Data Room + Capital Proof Vault
-- Foundation schema only. Live file storage, e-signature, export and submission automation are intentionally out of scope for MZ8.

create table if not exists ac_capital_data_room_categories (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  purpose text not null,
  readiness_score integer default 0 check (readiness_score between 0 and 100),
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  document_type text not null,
  readiness_level text not null,
  status text not null,
  version text not null default 'v1',
  language text not null default 'FR',
  owner text,
  source_workspace text,
  related_case_id uuid,
  related_funder_id uuid,
  related_opportunity_id uuid,
  approval_status text,
  founder_approval_required boolean not null default false,
  signature_required boolean not null default false,
  stamp_required boolean not null default false,
  expiry_date date,
  last_updated_at timestamptz,
  credibility_score integer default 0 check (credibility_score between 0 and 100),
  reusable boolean not null default false,
  sensitivity_level text not null default 'Internal',
  file_reference text,
  missing_dependencies text,
  next_action text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references ac_capital_data_room_documents(id) on delete cascade,
  version_label text not null,
  version_number integer not null default 1,
  status text not null,
  change_summary text,
  created_by text,
  approved_by text,
  submitted_to text,
  submitted_at timestamptz,
  replaced_by_version_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_readiness_scores (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  score integer not null check (score between 0 and 100),
  blockers_count integer not null default 0,
  next_action text,
  owner text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_missing_evidence (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  priority text not null,
  related_case_id uuid,
  related_funder_id uuid,
  owner text,
  due_date date,
  required_for_submission boolean not null default true,
  action text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_package_builders (
  id uuid primary key default gen_random_uuid(),
  package_name text not null,
  package_type text not null,
  related_case_id uuid,
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  missing_items_count integer not null default 0,
  outdated_items_count integer not null default 0,
  founder_approval_required boolean not null default false,
  status text not null,
  owner text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references ac_capital_data_room_package_builders(id) on delete cascade,
  document_id uuid references ac_capital_data_room_documents(id) on delete set null,
  required boolean not null default true,
  item_status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_case_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid,
  document_id uuid references ac_capital_data_room_documents(id) on delete cascade,
  link_type text not null default 'evidence',
  required boolean not null default false,
  founder_approval_needed boolean not null default false,
  coordinator_handover_readiness integer default 0 check (coordinator_handover_readiness between 0 and 100),
  action text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_submission_archive (
  id uuid primary key default gen_random_uuid(),
  package_id uuid,
  case_id uuid,
  funder_id uuid,
  submitted_by text,
  submitted_at timestamptz,
  recipient text,
  documents_included jsonb not null default '[]'::jsonb,
  version_submitted text,
  proof_of_submission_reference text,
  follow_up_date date,
  result_status text not null default 'prepared',
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_credibility_scores (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references ac_capital_data_room_documents(id) on delete cascade,
  source_reliability integer default 0,
  freshness integer default 0,
  founder_approval integer default 0,
  official_status integer default 0,
  relevance_to_case integer default 0,
  completeness integer default 0,
  doctrine_consistency integer default 0,
  sensitivity_handling integer default 0,
  total_score integer default 0 check (total_score between 0 and 100),
  score_label text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_approval_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references ac_capital_data_room_documents(id) on delete cascade,
  approval_type text not null,
  required_from text,
  status text not null default 'pending',
  comment text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_data_room_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  action text not null,
  object_type text not null,
  object_id uuid,
  severity text not null default 'medium',
  message text not null,
  created_at timestamptz not null default now()
);
