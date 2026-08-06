-- ANGELCARE 360 AREA 9 — ADMISSIONS: LEAD TO ENROLLMENT
-- Final additive customer authority. No authentication/session/global RLS mutation.
begin;
create extension if not exists pgcrypto;

-- Compatibility preflight: canonical foundations required by the signed Area 9 contract.
do $area9_preflight$
begin
  if to_regclass('public.angelcare360_schools') is null then
    raise exception 'AREA9_INCOMPATIBLE: angelcare360_schools is missing';
  end if;
  if to_regclass('public.angelcare360_admission_leads') is null then
    raise exception 'AREA9_INCOMPATIBLE: canonical admission leads are missing';
  end if;
  if to_regclass('public.angelcare360_admission_applications') is null then
    raise exception 'AREA9_INCOMPATIBLE: canonical admission applications are missing';
  end if;
  if to_regclass('public.angelcare360_operator_product_operations') is null then
    raise exception 'AREA9_INCOMPATIBLE: Product Constitution operation authority is missing';
  end if;
end;
$area9_preflight$;

create table if not exists public.angelcare360_area9_journeys (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_journeys_school_status on public.angelcare360_area9_journeys(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_journeys_application on public.angelcare360_area9_journeys(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_journeys_lead on public.angelcare360_area9_journeys(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_visits (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_visits_school_status on public.angelcare360_area9_visits(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_visits_application on public.angelcare360_area9_visits(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_visits_lead on public.angelcare360_area9_visits(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_document_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_document_requests_school_status on public.angelcare360_area9_document_requests(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_document_requests_application on public.angelcare360_area9_document_requests(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_document_requests_lead on public.angelcare360_area9_document_requests(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_evaluations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_evaluations_school_status on public.angelcare360_area9_evaluations(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_evaluations_application on public.angelcare360_area9_evaluations(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_evaluations_lead on public.angelcare360_area9_evaluations(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_waitlist_entries_school_status on public.angelcare360_area9_waitlist_entries(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_waitlist_entries_application on public.angelcare360_area9_waitlist_entries(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_waitlist_entries_lead on public.angelcare360_area9_waitlist_entries(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_decisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_decisions_school_status on public.angelcare360_area9_decisions(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_decisions_application on public.angelcare360_area9_decisions(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_decisions_lead on public.angelcare360_area9_decisions(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_offers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_offers_school_status on public.angelcare360_area9_offers(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_offers_application on public.angelcare360_area9_offers(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_offers_lead on public.angelcare360_area9_offers(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_reservations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_reservations_school_status on public.angelcare360_area9_reservations(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_reservations_application on public.angelcare360_area9_reservations(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_reservations_lead on public.angelcare360_area9_reservations(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_enrollment_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_enrollment_runs_school_status on public.angelcare360_area9_enrollment_runs(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_enrollment_runs_application on public.angelcare360_area9_enrollment_runs(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_enrollment_runs_lead on public.angelcare360_area9_enrollment_runs(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_onboarding_plans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_onboarding_plans_school_status on public.angelcare360_area9_onboarding_plans(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_onboarding_plans_application on public.angelcare360_area9_onboarding_plans(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_onboarding_plans_lead on public.angelcare360_area9_onboarding_plans(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_onboarding_tasks_school_status on public.angelcare360_area9_onboarding_tasks(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_onboarding_tasks_application on public.angelcare360_area9_onboarding_tasks(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_onboarding_tasks_lead on public.angelcare360_area9_onboarding_tasks(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_issues (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_issues_school_status on public.angelcare360_area9_issues(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_issues_application on public.angelcare360_area9_issues(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_issues_lead on public.angelcare360_area9_issues(school_id,lead_id) where lead_id is not null;

create table if not exists public.angelcare360_area9_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  reference_code text not null,
  lead_id uuid,
  application_id uuid,
  candidate_label text not null default 'Enfant candidat',
  contact_label text not null default 'Famille à confirmer',
  title text not null,
  subtitle text,
  owner_user_id uuid,
  programme_key text,
  intake_key text,
  source_channel text,
  preferred_channel text,
  next_action text,
  due_at timestamptz,
  completion_percent integer check (completion_percent is null or completion_percent between 0 and 100),
  missing_count integer check (missing_count is null or missing_count >= 0),
  flags text[] not null default '{}'::text[],
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, reference_code)
);
create index if not exists idx_angelcare360_area9_notes_school_status on public.angelcare360_area9_notes(school_id,status,updated_at desc);
create index if not exists idx_angelcare360_area9_notes_application on public.angelcare360_area9_notes(school_id,application_id) where application_id is not null;
create index if not exists idx_angelcare360_area9_notes_lead on public.angelcare360_area9_notes(school_id,lead_id) where lead_id is not null;


create table if not exists public.angelcare360_area9_handover_outcomes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  enrollment_run_id uuid not null,
  handover_domain text not null,
  status text not null default 'pending',
  target_reference text,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_run_id, handover_domain)
);
create index if not exists idx_angelcare360_area9_handover_school on public.angelcare360_area9_handover_outcomes(school_id,status,updated_at desc);

create table if not exists public.angelcare360_area9_history (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  academic_year_id uuid,
  operation_key text not null,
  actor_user_id uuid,
  target_type text not null,
  target_id text,
  title text not null,
  summary text not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_angelcare360_area9_history_school on public.angelcare360_area9_history(school_id,created_at desc);
create index if not exists idx_angelcare360_area9_history_target on public.angelcare360_area9_history(school_id,target_type,target_id,created_at desc);

create table if not exists public.angelcare360_area9_action_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  action_key text not null,
  idempotency_key text not null,
  target_id text,
  actor_user_id uuid,
  outcome text not null,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (school_id, action_key, idempotency_key)
);
create index if not exists idx_angelcare360_area9_receipts_target on public.angelcare360_area9_action_receipts(school_id,target_id,created_at desc);

-- Direct browser access is intentionally closed. Server-side operations use the
-- already accepted service-role boundary after actor, tenant and permission checks.
alter table public.angelcare360_area9_journeys enable row level security;
revoke all on table public.angelcare360_area9_journeys from anon, authenticated;
grant all on table public.angelcare360_area9_journeys to service_role;
alter table public.angelcare360_area9_visits enable row level security;
revoke all on table public.angelcare360_area9_visits from anon, authenticated;
grant all on table public.angelcare360_area9_visits to service_role;
alter table public.angelcare360_area9_document_requests enable row level security;
revoke all on table public.angelcare360_area9_document_requests from anon, authenticated;
grant all on table public.angelcare360_area9_document_requests to service_role;
alter table public.angelcare360_area9_evaluations enable row level security;
revoke all on table public.angelcare360_area9_evaluations from anon, authenticated;
grant all on table public.angelcare360_area9_evaluations to service_role;
alter table public.angelcare360_area9_waitlist_entries enable row level security;
revoke all on table public.angelcare360_area9_waitlist_entries from anon, authenticated;
grant all on table public.angelcare360_area9_waitlist_entries to service_role;
alter table public.angelcare360_area9_decisions enable row level security;
revoke all on table public.angelcare360_area9_decisions from anon, authenticated;
grant all on table public.angelcare360_area9_decisions to service_role;
alter table public.angelcare360_area9_offers enable row level security;
revoke all on table public.angelcare360_area9_offers from anon, authenticated;
grant all on table public.angelcare360_area9_offers to service_role;
alter table public.angelcare360_area9_reservations enable row level security;
revoke all on table public.angelcare360_area9_reservations from anon, authenticated;
grant all on table public.angelcare360_area9_reservations to service_role;
alter table public.angelcare360_area9_enrollment_runs enable row level security;
revoke all on table public.angelcare360_area9_enrollment_runs from anon, authenticated;
grant all on table public.angelcare360_area9_enrollment_runs to service_role;
alter table public.angelcare360_area9_onboarding_plans enable row level security;
revoke all on table public.angelcare360_area9_onboarding_plans from anon, authenticated;
grant all on table public.angelcare360_area9_onboarding_plans to service_role;
alter table public.angelcare360_area9_onboarding_tasks enable row level security;
revoke all on table public.angelcare360_area9_onboarding_tasks from anon, authenticated;
grant all on table public.angelcare360_area9_onboarding_tasks to service_role;
alter table public.angelcare360_area9_issues enable row level security;
revoke all on table public.angelcare360_area9_issues from anon, authenticated;
grant all on table public.angelcare360_area9_issues to service_role;
alter table public.angelcare360_area9_notes enable row level security;
revoke all on table public.angelcare360_area9_notes from anon, authenticated;
grant all on table public.angelcare360_area9_notes to service_role;
alter table public.angelcare360_area9_handover_outcomes enable row level security;
revoke all on table public.angelcare360_area9_handover_outcomes from anon, authenticated;
grant all on table public.angelcare360_area9_handover_outcomes to service_role;
alter table public.angelcare360_area9_history enable row level security;
revoke all on table public.angelcare360_area9_history from anon, authenticated;
grant all on table public.angelcare360_area9_history to service_role;
alter table public.angelcare360_area9_action_receipts enable row level security;
revoke all on table public.angelcare360_area9_action_receipts from anon, authenticated;
grant all on table public.angelcare360_area9_action_receipts to service_role;

-- Product Constitution registration using the exact canonical columns.
insert into public.angelcare360_operator_product_operations(
  operation_key,
  route_path,
  feature_key,
  operation_name,
  permission_key,
  audit_event,
  mutation_endpoints,
  source_confidence,
  status
) values
('admission_inquiry.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · create','admissions.create','admission_inquiry.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.update','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · update','admissions.update','admission_inquiry.update','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.assign','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · assign','admissions.assign','admission_inquiry.assign','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.contact','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · contact','admissions.update','admission_inquiry.contact','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.schedule_followup','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · schedule followup','admissions.update','admission_inquiry.schedule_followup','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.close','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · close','admissions.update','admission_inquiry.close','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.reactivate','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · reactivate','admissions.update','admission_inquiry.reactivate','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_inquiry.merge_review','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission inquiry · merge review','admissions.update','admission_inquiry.merge_review','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_family.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission family · create','admissions.create','admission_family.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_family.update','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission family · update','admissions.update','admission_family.update','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_family.link_contact','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission family · link contact','admissions.update','admission_family.link_contact','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_family.add_candidate','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission family · add candidate','admissions.update','admission_family.add_candidate','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_family.request_verification','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission family · request verification','admissions.update','admission_family.request_verification','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_candidate.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission candidate · create','admissions.create','admission_candidate.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_candidate.update','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission candidate · update','admissions.update','admission_candidate.update','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_candidate.match_existing','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission candidate · match existing','admissions.update','admission_candidate.match_existing','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_candidate.request_identity_review','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission candidate · request identity review','admissions.update','admission_candidate.request_identity_review','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · create','admissions.create','admission_visit.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.confirm','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · confirm','admissions.update','admission_visit.confirm','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.reschedule','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · reschedule','admissions.update','admission_visit.reschedule','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.remind','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · remind','admissions.notify','admission_visit.remind','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.check_in','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · check in','admissions.update','admission_visit.check_in','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.complete','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · complete','admissions.update','admission_visit.complete','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.cancel','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · cancel','admissions.update','admission_visit.cancel','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_visit.record_no_show','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission visit · record no show','admissions.update','admission_visit.record_no_show','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · create','admissions.create','admission_application.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.update','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · update','admissions.update','admission_application.update','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.submit','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · submit','admissions.update','admission_application.submit','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.assign','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · assign','admissions.assign','admission_application.assign','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.request_information','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · request information','admissions.update','admission_application.request_information','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.mark_ready','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · mark ready','admissions.update','admission_application.mark_ready','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.withdraw','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · withdraw','admissions.update','admission_application.withdraw','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.archive','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · archive','admissions.audit','admission_application.archive','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_application.reopen','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission application · reopen','admissions.update','admission_application.reopen','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_document.request','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission document · request','admissions.create','admission_document.request','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_document.receive','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission document · receive','admissions.update','admission_document.receive','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_document.verify','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission document · verify','admissions.update','admission_document.verify','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_document.reject','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission document · reject','admissions.approve','admission_document.reject','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_document.replace','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission document · replace','admissions.update','admission_document.replace','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_document.mark_not_applicable','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission document · mark not applicable','admissions.update','admission_document.mark_not_applicable','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evaluation.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evaluation · create','admissions.create','admission_evaluation.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evaluation.assign','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evaluation · assign','admissions.assign','admission_evaluation.assign','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evaluation.record','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evaluation · record','admissions.update','admission_evaluation.record','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evaluation.request_information','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evaluation · request information','admissions.update','admission_evaluation.request_information','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evaluation.complete','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evaluation · complete','admissions.update','admission_evaluation.complete','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evaluation.reopen','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evaluation · reopen','admissions.update','admission_evaluation.reopen','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_place.preview','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission place · preview','admissions.view','admission_place.preview','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_place.recommend','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission place · recommend','admissions.view','admission_place.recommend','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_place.request_exception','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission place · request exception','admissions.update','admission_place.request_exception','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.add','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · add','admissions.create','admission_waitlist.add','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.update','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · update','admissions.update','admission_waitlist.update','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.confirm_interest','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · confirm interest','admissions.update','admission_waitlist.confirm_interest','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.reorder','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · reorder','admissions.approve','admission_waitlist.reorder','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.offer_alternative','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · offer alternative','admissions.update','admission_waitlist.offer_alternative','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.remove','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · remove','admissions.update','admission_waitlist.remove','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_waitlist.reactivate','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission waitlist · reactivate','admissions.update','admission_waitlist.reactivate','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.prepare','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · prepare','admissions.create','admission_decision.prepare','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.request_review','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · request review','admissions.update','admission_decision.request_review','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.request_approval','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · request approval','admissions.approve','admission_decision.request_approval','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.approve','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · approve','admissions.approve','admission_decision.approve','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.condition','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · condition','admissions.approve','admission_decision.condition','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.waitlist','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · waitlist','admissions.approve','admission_decision.waitlist','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.defer','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · defer','admissions.update','admission_decision.defer','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.reject','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · reject','admissions.approve','admission_decision.reject','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_decision.withdraw','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission decision · withdraw','admissions.update','admission_decision.withdraw','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.prepare','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · prepare','admissions.create','admission_offer.prepare','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.review','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · review','admissions.update','admission_offer.review','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.approve','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · approve','admissions.approve','admission_offer.approve','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.send','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · send','admissions.notify','admission_offer.send','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.resend','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · resend','admissions.notify','admission_offer.resend','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.record_response','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · record response','admissions.update','admission_offer.record_response','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.expire','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · expire','admissions.update','admission_offer.expire','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_offer.withdraw','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission offer · withdraw','admissions.update','admission_offer.withdraw','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.preview','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · preview','admissions.view','admission_reservation.preview','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · create','admissions.create','admission_reservation.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.extend','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · extend','admissions.approve','admission_reservation.extend','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.confirm','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · confirm','admissions.update','admission_reservation.confirm','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.expire','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · expire','admissions.update','admission_reservation.expire','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.release','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · release','admissions.approve','admission_reservation.release','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_reservation.cancel','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission reservation · cancel','admissions.update','admission_reservation.cancel','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_enrollment.preview','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission enrollment · preview','admissions.view','admission_enrollment.preview','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_enrollment.validate','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission enrollment · validate','admissions.approve','admission_enrollment.validate','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_enrollment.request_approval','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission enrollment · request approval','admissions.approve','admission_enrollment.request_approval','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_enrollment.convert','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission enrollment · convert','admissions.approve','admission_enrollment.convert','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_enrollment.retry_handover','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission enrollment · retry handover','admissions.update','admission_enrollment.retry_handover','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_enrollment.cancel','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission enrollment · cancel','admissions.update','admission_enrollment.cancel','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_onboarding.create','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission onboarding · create','admissions.create','admission_onboarding.create','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_onboarding.assign','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission onboarding · assign','admissions.assign','admission_onboarding.assign','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_onboarding.complete_task','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission onboarding · complete task','admissions.update','admission_onboarding.complete_task','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_onboarding.reopen_task','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission onboarding · reopen task','admissions.update','admission_onboarding.reopen_task','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_onboarding.confirm_readiness','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission onboarding · confirm readiness','admissions.approve','admission_onboarding.confirm_readiness','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_issue.assign','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission issue · assign','admissions.assign','admission_issue.assign','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_issue.resolve','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission issue · resolve','admissions.update','admission_issue.resolve','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_issue.reopen','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission issue · reopen','admissions.update','admission_issue.reopen','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_note.add','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission note · add','admissions.create','admission_note.add','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_evidence.request','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission evidence · request','admissions.create','admission_evidence.request','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published'),
('admission_topup.request','/angelcare-360-command-center/admissions','admissions.area9.lead_to_enrollment','admission topup · request','admissions.create','admission_topup.request','["/api/angelcare360/admissions/area9"]'::jsonb,'signed_area9_contract','published')
on conflict (operation_key) do update set
  route_path=excluded.route_path,
  feature_key=excluded.feature_key,
  operation_name=excluded.operation_name,
  permission_key=excluded.permission_key,
  audit_event=excluded.audit_event,
  mutation_endpoints=excluded.mutation_endpoints,
  source_confidence=excluded.source_confidence,
  status=excluded.status,
  updated_at=now();

commit;

-- Supabase API gateway safety: refresh PostgREST only after the successful commit.
notify pgrst, 'reload schema';

select
  'AREA 9 ADMISSIONS LEAD TO ENROLLMENT APPLIED' as result,
  16 as protected_area9_tables,
  97 as canonical_operations,
  'authentication and global sessions untouched' as auth_safety;
