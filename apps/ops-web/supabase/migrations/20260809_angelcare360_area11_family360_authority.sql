-- ANGELCARE 360 AREA 11 — PARENTS, RESPONSABLES & FAMILLE 360
-- Canonical family identity, relationship, authority, pickup safety, emergency readiness,
-- households, billing responsibility and parent-access relationship.
-- Additive production migration. NO authentication/session mutation. NO Area 12 authority.
begin;

do $area11_preflight$
declare missing_columns text;
begin
  if to_regclass('public.angelcare360_parents') is null then raise exception 'AREA11 PREFLIGHT: angelcare360_parents is missing'; end if;
  if to_regclass('public.angelcare360_students') is null then raise exception 'AREA11 PREFLIGHT: angelcare360_students is missing'; end if;
  if to_regclass('public.angelcare360_student_parent_links') is null then raise exception 'AREA11 PREFLIGHT: angelcare360_student_parent_links is missing'; end if;
  if to_regclass('public.angelcare360_emergency_contacts') is null then raise exception 'AREA11 PREFLIGHT: angelcare360_emergency_contacts is missing'; end if;
  if to_regclass('public.angelcare360_documents') is null then raise exception 'AREA11 PREFLIGHT: angelcare360_documents is missing'; end if;
  if to_regclass('public.angelcare360_area9_handover_outcomes') is null then raise exception 'AREA11 PREFLIGHT: Area 9 handover authority is missing'; end if;
  if to_regclass('public.angelcare360_area10_student_profiles') is null then raise exception 'AREA11 PREFLIGHT: Area 10 Student 360 SQL is missing'; end if;
  if to_regclass('public.angelcare360_operator_product_operations') is null then raise exception 'AREA11 PREFLIGHT: Product Constitution operation registry is missing'; end if;
  select string_agg(required.column_name, ', ' order by required.column_name)
    into missing_columns
  from (values
    ('operation_key'),('route_path'),('feature_key'),('operation_name'),('permission_key'),
    ('audit_event'),('mutation_endpoints'),('source_confidence'),('status'),('updated_at')
  ) as required(column_name)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name='angelcare360_operator_product_operations'
      and c.column_name=required.column_name
  );
  if missing_columns is not null then
    raise exception 'AREA11 PREFLIGHT: Product Constitution schema incompatible; missing columns: %', missing_columns;
  end if;
end
$area11_preflight$;

create table if not exists public.angelcare360_area11_families (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  family_code text,
  display_name text not null,
  verification_state text not null default 'pending',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, family_code)
);
alter table public.angelcare360_area11_families enable row level security;
revoke all on table public.angelcare360_area11_families from anon, authenticated;
grant all on table public.angelcare360_area11_families to service_role;
create index if not exists angelcare360_area11_families_school_created_idx on public.angelcare360_area11_families(school_id, created_at desc);
create index if not exists angelcare360_area11_families_status_idx on public.angelcare360_area11_families(school_id, status);

create table if not exists public.angelcare360_area11_family_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  family_id uuid not null,
  member_type text not null check (member_type in ('person','student')),
  person_id uuid,
  student_id uuid,
  role_label text,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  status text not null default 'active',
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((member_type='person' and person_id is not null and student_id is null) or (member_type='student' and student_id is not null and person_id is null))
);
alter table public.angelcare360_area11_family_memberships enable row level security;
revoke all on table public.angelcare360_area11_family_memberships from anon, authenticated;
grant all on table public.angelcare360_area11_family_memberships to service_role;
create index if not exists angelcare360_area11_family_memberships_school_created_idx on public.angelcare360_area11_family_memberships(school_id, created_at desc);
create index if not exists angelcare360_area11_family_memberships_family_idx on public.angelcare360_area11_family_memberships(school_id, family_id);
create index if not exists angelcare360_area11_family_memberships_person_idx on public.angelcare360_area11_family_memberships(school_id, person_id);
create index if not exists angelcare360_area11_family_memberships_student_idx on public.angelcare360_area11_family_memberships(school_id, student_id);

create table if not exists public.angelcare360_area11_relationships (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid,
  student_id uuid not null, person_id uuid not null, relationship_type text not null,
  declared_source text not null default 'school', verification_state text not null default 'pending',
  evidence_document_id uuid, effective_from timestamptz not null default now(), effective_until timestamptz,
  verified_at timestamptz, verified_by_user_id uuid, status text not null default 'active', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_relationships enable row level security;
revoke all on table public.angelcare360_area11_relationships from anon, authenticated;
grant all on table public.angelcare360_area11_relationships to service_role;
create index if not exists angelcare360_area11_relationships_school_created_idx on public.angelcare360_area11_relationships(school_id, created_at desc);
create index if not exists angelcare360_area11_relationships_student_person_idx on public.angelcare360_area11_relationships(school_id, student_id, person_id);
create index if not exists angelcare360_area11_relationships_family_idx on public.angelcare360_area11_relationships(school_id, family_id);
create index if not exists angelcare360_area11_relationships_status_idx on public.angelcare360_area11_relationships(school_id, status);

create table if not exists public.angelcare360_area11_guardian_authorities (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid,
  student_id uuid not null, person_id uuid not null, authority_type text not null default 'guardian', authority_scope text not null default 'school',
  verification_state text not null default 'pending', evidence_document_id uuid, effective_from timestamptz not null default now(), effective_until timestamptz,
  verified_at timestamptz, verified_by_user_id uuid, review_required boolean not null default false, review_due_at timestamptz,
  status text not null default 'pending', created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_guardian_authorities enable row level security;
revoke all on table public.angelcare360_area11_guardian_authorities from anon, authenticated;
grant all on table public.angelcare360_area11_guardian_authorities to service_role;
create index if not exists angelcare360_area11_guardian_authorities_school_created_idx on public.angelcare360_area11_guardian_authorities(school_id, created_at desc);
create index if not exists angelcare360_area11_guardian_authorities_student_person_idx on public.angelcare360_area11_guardian_authorities(school_id, student_id, person_id);
create index if not exists angelcare360_area11_guardian_authorities_status_idx on public.angelcare360_area11_guardian_authorities(school_id, status);

create table if not exists public.angelcare360_area11_authority_restrictions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, student_id uuid not null, person_id uuid not null,
  restriction_type text not null, operational_instruction text not null, reason text, confidentiality_level text not null default 'restricted',
  evidence_document_id uuid, effective_from timestamptz not null default now(), effective_until timestamptz, approved_by_user_id uuid,
  status text not null default 'active', created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_authority_restrictions enable row level security;
revoke all on table public.angelcare360_area11_authority_restrictions from anon, authenticated;
grant all on table public.angelcare360_area11_authority_restrictions to service_role;
create index if not exists angelcare360_area11_authority_restrictions_school_created_idx on public.angelcare360_area11_authority_restrictions(school_id, created_at desc);
create index if not exists angelcare360_area11_authority_restrictions_student_person_idx on public.angelcare360_area11_authority_restrictions(school_id, student_id, person_id);
create index if not exists angelcare360_area11_authority_restrictions_status_idx on public.angelcare360_area11_authority_restrictions(school_id, status);

create table if not exists public.angelcare360_area11_pickup_authorizations (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, student_id uuid not null, person_id uuid not null,
  authorization_type text not null default 'recurring', valid_from timestamptz not null default now(), valid_until timestamptz,
  recurring_rules_json jsonb not null default '{}'::jsonb, verification_requirement text not null default 'identity_check', identity_evidence_document_id uuid,
  identity_check_required boolean not null default true, verified_at timestamptz, verified_by_user_id uuid, revoked_at timestamptz,
  status text not null default 'pending', created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_pickup_authorizations enable row level security;
revoke all on table public.angelcare360_area11_pickup_authorizations from anon, authenticated;
grant all on table public.angelcare360_area11_pickup_authorizations to service_role;
create index if not exists angelcare360_area11_pickup_authorizations_school_created_idx on public.angelcare360_area11_pickup_authorizations(school_id, created_at desc);
create index if not exists angelcare360_area11_pickup_authorizations_student_person_idx on public.angelcare360_area11_pickup_authorizations(school_id, student_id, person_id);
create index if not exists angelcare360_area11_pickup_authorizations_validity_idx on public.angelcare360_area11_pickup_authorizations(school_id, status, valid_until);

create table if not exists public.angelcare360_area11_emergency_rankings (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, student_id uuid not null,
  emergency_contact_id uuid not null, person_id uuid, priority integer not null default 1, availability_note text,
  verification_state text not null default 'pending', verified_at timestamptz, verified_by_user_id uuid, status text not null default 'active',
  created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_emergency_rankings enable row level security;
revoke all on table public.angelcare360_area11_emergency_rankings from anon, authenticated;
grant all on table public.angelcare360_area11_emergency_rankings to service_role;
create index if not exists angelcare360_area11_emergency_rankings_school_created_idx on public.angelcare360_area11_emergency_rankings(school_id, created_at desc);
create index if not exists angelcare360_area11_emergency_rankings_student_priority_idx on public.angelcare360_area11_emergency_rankings(school_id, student_id, priority);

create table if not exists public.angelcare360_area11_households (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid,
  household_name text not null, household_type text not null default 'primary', effective_from timestamptz not null default now(), effective_until timestamptz,
  status text not null default 'active', metadata_json jsonb not null default '{}'::jsonb, created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_households enable row level security;
revoke all on table public.angelcare360_area11_households from anon, authenticated;
grant all on table public.angelcare360_area11_households to service_role;
create index if not exists angelcare360_area11_households_school_created_idx on public.angelcare360_area11_households(school_id, created_at desc);
create index if not exists angelcare360_area11_households_family_idx on public.angelcare360_area11_households(school_id, family_id);
create index if not exists angelcare360_area11_households_status_idx on public.angelcare360_area11_households(school_id, status);

create table if not exists public.angelcare360_area11_household_memberships (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, household_id uuid not null,
  member_type text not null check (member_type in ('person','student')), person_id uuid, student_id uuid, residence_role text,
  effective_from timestamptz not null default now(), effective_until timestamptz, status text not null default 'active', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((member_type='person' and person_id is not null and student_id is null) or (member_type='student' and student_id is not null and person_id is null))
);
alter table public.angelcare360_area11_household_memberships enable row level security;
revoke all on table public.angelcare360_area11_household_memberships from anon, authenticated;
grant all on table public.angelcare360_area11_household_memberships to service_role;
create index if not exists angelcare360_area11_household_memberships_school_created_idx on public.angelcare360_area11_household_memberships(school_id, created_at desc);
create index if not exists angelcare360_area11_household_memberships_household_idx on public.angelcare360_area11_household_memberships(school_id, household_id);
create index if not exists angelcare360_area11_household_memberships_person_idx on public.angelcare360_area11_household_memberships(school_id, person_id);
create index if not exists angelcare360_area11_household_memberships_student_idx on public.angelcare360_area11_household_memberships(school_id, student_id);

create table if not exists public.angelcare360_area11_addresses (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, household_id uuid not null,
  address_line1 text not null, address_line2 text, city text, postal_code text, country text not null default 'Maroc', address_type text not null default 'home',
  effective_from timestamptz not null default now(), effective_until timestamptz, verification_state text not null default 'pending',
  transport_impact_state text not null default 'review_required', billing_impact_state text not null default 'review_required', evidence_document_id uuid,
  status text not null default 'active', created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_addresses enable row level security;
revoke all on table public.angelcare360_area11_addresses from anon, authenticated;
grant all on table public.angelcare360_area11_addresses to service_role;
create index if not exists angelcare360_area11_addresses_school_created_idx on public.angelcare360_area11_addresses(school_id, created_at desc);
create index if not exists angelcare360_area11_addresses_household_idx on public.angelcare360_area11_addresses(school_id, household_id);
create index if not exists angelcare360_area11_addresses_status_idx on public.angelcare360_area11_addresses(school_id, status);

create table if not exists public.angelcare360_area11_identity_verifications (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, person_id uuid not null,
  verification_type text not null default 'identity', evidence_document_id uuid, status text not null default 'pending', notes text,
  verified_at timestamptz, verified_by_user_id uuid, created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_identity_verifications enable row level security;
revoke all on table public.angelcare360_area11_identity_verifications from anon, authenticated;
grant all on table public.angelcare360_area11_identity_verifications to service_role;
create index if not exists angelcare360_area11_identity_verifications_school_created_idx on public.angelcare360_area11_identity_verifications(school_id, created_at desc);
create index if not exists angelcare360_area11_identity_verifications_person_idx on public.angelcare360_area11_identity_verifications(school_id, person_id);
create index if not exists angelcare360_area11_identity_verifications_status_idx on public.angelcare360_area11_identity_verifications(school_id, status);

create table if not exists public.angelcare360_area11_document_links (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, person_id uuid, student_id uuid,
  document_id uuid not null, evidence_role text not null, sensitivity text not null default 'standard', effective_from timestamptz not null default now(), effective_until timestamptz,
  status text not null default 'active', created_by_user_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_document_links enable row level security;
revoke all on table public.angelcare360_area11_document_links from anon, authenticated;
grant all on table public.angelcare360_area11_document_links to service_role;
create index if not exists angelcare360_area11_document_links_school_created_idx on public.angelcare360_area11_document_links(school_id, created_at desc);
create index if not exists angelcare360_area11_document_links_person_idx on public.angelcare360_area11_document_links(school_id, person_id);
create index if not exists angelcare360_area11_document_links_student_idx on public.angelcare360_area11_document_links(school_id, student_id);
create index if not exists angelcare360_area11_document_links_document_idx on public.angelcare360_area11_document_links(school_id, document_id);

create table if not exists public.angelcare360_area11_billing_responsibilities (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, student_id uuid, person_id uuid not null,
  responsibility_type text not null default 'primary_payer', share_percent numeric, invoice_recipient boolean not null default true, statement_recipient boolean not null default true,
  effective_from timestamptz not null default now(), effective_until timestamptz, status text not null default 'active', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_billing_responsibilities enable row level security;
revoke all on table public.angelcare360_area11_billing_responsibilities from anon, authenticated;
grant all on table public.angelcare360_area11_billing_responsibilities to service_role;
create index if not exists angelcare360_area11_billing_responsibilities_school_created_idx on public.angelcare360_area11_billing_responsibilities(school_id, created_at desc);
create index if not exists angelcare360_area11_billing_responsibilities_person_idx on public.angelcare360_area11_billing_responsibilities(school_id, person_id);
create index if not exists angelcare360_area11_billing_responsibilities_student_idx on public.angelcare360_area11_billing_responsibilities(school_id, student_id);
create index if not exists angelcare360_area11_billing_responsibilities_status_idx on public.angelcare360_area11_billing_responsibilities(school_id, status);

create table if not exists public.angelcare360_area11_portal_relationships (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, person_id uuid not null,
  portal_app_user_id uuid, access_state text not null default 'not_invited', visibility_json jsonb not null default '{}'::jsonb,
  restriction_reason text, effective_from timestamptz not null default now(), effective_until timestamptz, status text not null default 'active', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_portal_relationships enable row level security;
revoke all on table public.angelcare360_area11_portal_relationships from anon, authenticated;
grant all on table public.angelcare360_area11_portal_relationships to service_role;
create index if not exists angelcare360_area11_portal_relationships_school_created_idx on public.angelcare360_area11_portal_relationships(school_id, created_at desc);
create index if not exists angelcare360_area11_portal_relationships_person_idx on public.angelcare360_area11_portal_relationships(school_id, person_id);
create index if not exists angelcare360_area11_portal_relationships_status_idx on public.angelcare360_area11_portal_relationships(school_id, status);

create table if not exists public.angelcare360_area11_transitions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, person_id uuid, student_id uuid,
  transition_type text not null, reason text, effective_at timestamptz, impact_json jsonb not null default '{}'::jsonb,
  approval_state text not null default 'not_required', approved_by_user_id uuid, status text not null default 'prepared', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_transitions enable row level security;
revoke all on table public.angelcare360_area11_transitions from anon, authenticated;
grant all on table public.angelcare360_area11_transitions to service_role;
create index if not exists angelcare360_area11_transitions_school_created_idx on public.angelcare360_area11_transitions(school_id, created_at desc);
create index if not exists angelcare360_area11_transitions_family_idx on public.angelcare360_area11_transitions(school_id, family_id);
create index if not exists angelcare360_area11_transitions_status_idx on public.angelcare360_area11_transitions(school_id, status);

create table if not exists public.angelcare360_area11_tasks (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, person_id uuid, student_id uuid,
  category text not null default 'family', title text not null, detail text, subject_label text, owner_user_id uuid, due_at timestamptz, deep_link text,
  status text not null default 'open', completion_note text, completed_at timestamptz, created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_tasks enable row level security;
revoke all on table public.angelcare360_area11_tasks from anon, authenticated;
grant all on table public.angelcare360_area11_tasks to service_role;
create index if not exists angelcare360_area11_tasks_school_created_idx on public.angelcare360_area11_tasks(school_id, created_at desc);
create index if not exists angelcare360_area11_tasks_family_idx on public.angelcare360_area11_tasks(school_id, family_id);
create index if not exists angelcare360_area11_tasks_person_idx on public.angelcare360_area11_tasks(school_id, person_id);
create index if not exists angelcare360_area11_tasks_status_idx on public.angelcare360_area11_tasks(school_id, status);

create table if not exists public.angelcare360_area11_notes (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, family_id uuid, person_id uuid, student_id uuid,
  note_kind text not null default 'operational', title text, body text not null, visibility text not null default 'internal', created_by_user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.angelcare360_area11_notes enable row level security;
revoke all on table public.angelcare360_area11_notes from anon, authenticated;
grant all on table public.angelcare360_area11_notes to service_role;
create index if not exists angelcare360_area11_notes_school_created_idx on public.angelcare360_area11_notes(school_id, created_at desc);
create index if not exists angelcare360_area11_notes_family_idx on public.angelcare360_area11_notes(school_id, family_id);
create index if not exists angelcare360_area11_notes_person_idx on public.angelcare360_area11_notes(school_id, person_id);

create table if not exists public.angelcare360_area11_action_receipts (
  id uuid primary key default gen_random_uuid(), school_id uuid not null, operation_key text not null, idempotency_key text not null,
  subject_kind text not null, subject_id text not null, actor_user_id uuid, result_json jsonb not null default '{}'::jsonb,
  status text not null default 'completed', created_at timestamptz not null default now(), unique (school_id, operation_key, idempotency_key)
);
alter table public.angelcare360_area11_action_receipts enable row level security;
revoke all on table public.angelcare360_area11_action_receipts from anon, authenticated;
grant all on table public.angelcare360_area11_action_receipts to service_role;
create index if not exists angelcare360_area11_action_receipts_school_created_idx on public.angelcare360_area11_action_receipts(school_id, created_at desc);
create index if not exists angelcare360_area11_action_receipts_subject_idx on public.angelcare360_area11_action_receipts(school_id, subject_kind, subject_id);

-- Product Constitution registration uses the live canonical schema verified by the preflight.
insert into public.angelcare360_operator_product_operations
  (operation_key, route_path, feature_key, operation_name, permission_key, audit_event, mutation_endpoints, source_confidence, status)
values
  ('family.view', '/angelcare-360-command-center/familles', 'family360.authority', 'family · view', 'angelcare360.people.view', 'family360.family.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.view_sensitive', '/angelcare-360-command-center/familles', 'family360.authority', 'family · view sensitive', 'angelcare360.people.update', 'family360.family.view_sensitive', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.create', '/angelcare-360-command-center/familles', 'family360.authority', 'family · create', 'angelcare360.people.create', 'family360.family.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'family · verify', 'angelcare360.people.update', 'family360.family.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.update', '/angelcare-360-command-center/familles', 'family360.authority', 'family · update', 'angelcare360.people.update', 'family360.family.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.request_verification', '/angelcare-360-command-center/familles', 'family360.authority', 'family · request verification', 'angelcare360.people.update', 'family360.family.request_verification', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.merge_preview', '/angelcare-360-command-center/familles', 'family360.authority', 'family · merge preview', 'angelcare360.people.view', 'family360.family.merge_preview', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.merge', '/angelcare-360-command-center/familles', 'family360.authority', 'family · merge', 'angelcare360.people.update', 'family360.family.merge', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.split_preview', '/angelcare-360-command-center/familles', 'family360.authority', 'family · split preview', 'angelcare360.people.view', 'family360.family.split_preview', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.split', '/angelcare-360-command-center/familles', 'family360.authority', 'family · split', 'angelcare360.people.update', 'family360.family.split', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family.archive', '/angelcare-360-command-center/familles', 'family360.authority', 'family · archive', 'angelcare360.people.update', 'family360.family.archive', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.view', '/angelcare-360-command-center/familles', 'family360.authority', 'person · view', 'angelcare360.people.view', 'family360.person.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.view_sensitive', '/angelcare-360-command-center/familles', 'family360.authority', 'person · view sensitive', 'angelcare360.people.update', 'family360.person.view_sensitive', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.create', '/angelcare-360-command-center/familles', 'family360.authority', 'person · create', 'angelcare360.people.create', 'family360.person.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.update', '/angelcare-360-command-center/familles', 'family360.authority', 'person · update', 'angelcare360.people.update', 'family360.person.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'person · verify', 'angelcare360.people.update', 'family360.person.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.request_verification', '/angelcare-360-command-center/familles', 'family360.authority', 'person · request verification', 'angelcare360.people.update', 'family360.person.request_verification', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.merge_review', '/angelcare-360-command-center/familles', 'family360.authority', 'person · merge review', 'angelcare360.people.update', 'family360.person.merge_review', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('person.archive', '/angelcare-360-command-center/familles', 'family360.authority', 'person · archive', 'angelcare360.people.update', 'family360.person.archive', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.view', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · view', 'angelcare360.people.view', 'family360.relationship.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.create', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · create', 'angelcare360.people.create', 'family360.relationship.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · verify', 'angelcare360.people.update', 'family360.relationship.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.update', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · update', 'angelcare360.people.update', 'family360.relationship.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.end', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · end', 'angelcare360.people.update', 'family360.relationship.end', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.reopen', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · reopen', 'angelcare360.people.update', 'family360.relationship.reopen', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('relationship.request_evidence', '/angelcare-360-command-center/familles', 'family360.authority', 'relationship · request evidence', 'angelcare360.people.update', 'family360.relationship.request_evidence', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.view', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · view', 'angelcare360.people.view', 'family360.guardian_authority.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.create', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · create', 'angelcare360.people.create', 'family360.guardian_authority.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · verify', 'angelcare360.people.update', 'family360.guardian_authority.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.update', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · update', 'angelcare360.people.update', 'family360.guardian_authority.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.restrict', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · restrict', 'angelcare360.people.update', 'family360.guardian_authority.restrict', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.restore', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · restore', 'angelcare360.people.update', 'family360.guardian_authority.restore', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.end', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · end', 'angelcare360.people.update', 'family360.guardian_authority.end', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('guardian_authority.request_review', '/angelcare-360-command-center/familles', 'family360.authority', 'guardian authority · request review', 'angelcare360.people.update', 'family360.guardian_authority.request_review', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.view', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · view', 'angelcare360.people.view', 'family360.pickup_authorization.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.create', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · create', 'angelcare360.people.create', 'family360.pickup_authorization.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · verify', 'angelcare360.people.update', 'family360.pickup_authorization.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.extend', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · extend', 'angelcare360.people.update', 'family360.pickup_authorization.extend', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.suspend', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · suspend', 'angelcare360.people.update', 'family360.pickup_authorization.suspend', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.revoke', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · revoke', 'angelcare360.people.update', 'family360.pickup_authorization.revoke', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.expire', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · expire', 'angelcare360.people.update', 'family360.pickup_authorization.expire', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('pickup_authorization.request_identity_check', '/angelcare-360-command-center/familles', 'family360.authority', 'pickup authorization · request identity check', 'angelcare360.people.update', 'family360.pickup_authorization.request_identity_check', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.view', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · view', 'angelcare360.people.view', 'family360.emergency_contact.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.create', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · create', 'angelcare360.people.create', 'family360.emergency_contact.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · verify', 'angelcare360.people.update', 'family360.emergency_contact.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.update', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · update', 'angelcare360.people.update', 'family360.emergency_contact.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.reorder', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · reorder', 'angelcare360.people.update', 'family360.emergency_contact.reorder', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.remove', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · remove', 'angelcare360.people.update', 'family360.emergency_contact.remove', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('emergency_contact.request_verification', '/angelcare-360-command-center/familles', 'family360.authority', 'emergency contact · request verification', 'angelcare360.people.update', 'family360.emergency_contact.request_verification', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.view', '/angelcare-360-command-center/familles', 'family360.authority', 'household · view', 'angelcare360.people.view', 'family360.household.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.create', '/angelcare-360-command-center/familles', 'family360.authority', 'household · create', 'angelcare360.people.create', 'family360.household.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.update', '/angelcare-360-command-center/familles', 'family360.authority', 'household · update', 'angelcare360.people.update', 'family360.household.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.add_member', '/angelcare-360-command-center/familles', 'family360.authority', 'household · add member', 'angelcare360.people.update', 'family360.household.add_member', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.remove_member', '/angelcare-360-command-center/familles', 'family360.authority', 'household · remove member', 'angelcare360.people.update', 'family360.household.remove_member', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.close', '/angelcare-360-command-center/familles', 'family360.authority', 'household · close', 'angelcare360.people.update', 'family360.household.close', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('household.split_preview', '/angelcare-360-command-center/familles', 'family360.authority', 'household · split preview', 'angelcare360.people.view', 'family360.household.split_preview', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.view', '/angelcare-360-command-center/familles', 'family360.authority', 'address · view', 'angelcare360.people.view', 'family360.address.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.create', '/angelcare-360-command-center/familles', 'family360.authority', 'address · create', 'angelcare360.people.create', 'family360.address.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'address · verify', 'angelcare360.people.update', 'family360.address.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.change', '/angelcare-360-command-center/familles', 'family360.authority', 'address · change', 'angelcare360.people.update', 'family360.address.change', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.end', '/angelcare-360-command-center/familles', 'family360.authority', 'address · end', 'angelcare360.people.update', 'family360.address.end', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.impact_preview', '/angelcare-360-command-center/familles', 'family360.authority', 'address · impact preview', 'angelcare360.people.view', 'family360.address.impact_preview', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('address.request_transport_review', '/angelcare-360-command-center/familles', 'family360.authority', 'address · request transport review', 'angelcare360.people.update', 'family360.address.request_transport_review', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.view', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · view', 'angelcare360.people.view', 'family360.family_document.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.request', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · request', 'angelcare360.people.update', 'family360.family_document.request', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.receive', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · receive', 'angelcare360.people.update', 'family360.family_document.receive', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.verify', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · verify', 'angelcare360.people.update', 'family360.family_document.verify', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.reject', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · reject', 'angelcare360.people.update', 'family360.family_document.reject', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.replace', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · replace', 'angelcare360.people.update', 'family360.family_document.replace', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.restrict', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · restrict', 'angelcare360.people.update', 'family360.family_document.restrict', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_document.archive', '/angelcare-360-command-center/familles', 'family360.authority', 'family document · archive', 'angelcare360.people.update', 'family360.family_document.archive', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('billing_responsibility.view', '/angelcare-360-command-center/familles', 'family360.authority', 'billing responsibility · view', 'angelcare360.people.view', 'family360.billing_responsibility.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('billing_responsibility.create', '/angelcare-360-command-center/familles', 'family360.authority', 'billing responsibility · create', 'angelcare360.people.update', 'family360.billing_responsibility.create', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('billing_responsibility.update', '/angelcare-360-command-center/familles', 'family360.authority', 'billing responsibility · update', 'angelcare360.people.update', 'family360.billing_responsibility.update', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('billing_responsibility.end', '/angelcare-360-command-center/familles', 'family360.authority', 'billing responsibility · end', 'angelcare360.people.update', 'family360.billing_responsibility.end', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('billing_responsibility.request_finance_review', '/angelcare-360-command-center/familles', 'family360.authority', 'billing responsibility · request finance review', 'angelcare360.people.update', 'family360.billing_responsibility.request_finance_review', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.view', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · view', 'angelcare360.people.view', 'family360.portal_access.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.preview', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · preview', 'angelcare360.people.view', 'family360.portal_access.preview', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.invite', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · invite', 'angelcare360.people.update', 'family360.portal_access.invite', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.activate', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · activate', 'angelcare360.people.update', 'family360.portal_access.activate', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.restrict', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · restrict', 'angelcare360.people.update', 'family360.portal_access.restrict', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.suspend', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · suspend', 'angelcare360.people.update', 'family360.portal_access.suspend', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.revoke', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · revoke', 'angelcare360.people.update', 'family360.portal_access.revoke', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('portal_access.request_review', '/angelcare-360-command-center/familles', 'family360.authority', 'portal access · request review', 'angelcare360.people.update', 'family360.portal_access.request_review', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_transition.prepare', '/angelcare-360-command-center/familles', 'family360.authority', 'family transition · prepare', 'angelcare360.people.create', 'family360.family_transition.prepare', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_transition.validate', '/angelcare-360-command-center/familles', 'family360.authority', 'family transition · validate', 'angelcare360.people.update', 'family360.family_transition.validate', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_transition.request_approval', '/angelcare-360-command-center/familles', 'family360.authority', 'family transition · request approval', 'angelcare360.people.update', 'family360.family_transition.request_approval', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_transition.execute', '/angelcare-360-command-center/familles', 'family360.authority', 'family transition · execute', 'angelcare360.people.update', 'family360.family_transition.execute', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_transition.cancel', '/angelcare-360-command-center/familles', 'family360.authority', 'family transition · cancel', 'angelcare360.people.update', 'family360.family_transition.cancel', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_task.assign', '/angelcare-360-command-center/familles', 'family360.authority', 'family task · assign', 'angelcare360.people.create', 'family360.family_task.assign', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_task.complete', '/angelcare-360-command-center/familles', 'family360.authority', 'family task · complete', 'angelcare360.people.update', 'family360.family_task.complete', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_task.reopen', '/angelcare-360-command-center/familles', 'family360.authority', 'family task · reopen', 'angelcare360.people.update', 'family360.family_task.reopen', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_note.add', '/angelcare-360-command-center/familles', 'family360.authority', 'family note · add', 'angelcare360.people.create', 'family360.family_note.add', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_evidence.request', '/angelcare-360-command-center/familles', 'family360.authority', 'family evidence · request', 'angelcare360.people.update', 'family360.family_evidence.request', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_history.view', '/angelcare-360-command-center/familles', 'family360.authority', 'family history · view', 'angelcare360.people.view', 'family360.family_history.view', '[]'::jsonb, 'canonical-source-backed', 'published'),
  ('family_topup.request', '/angelcare-360-command-center/familles', 'family360.authority', 'family topup · request', 'angelcare360.people.update', 'family360.family_topup.request', '["/api/angelcare360/families/area11"]'::jsonb, 'canonical-source-backed', 'published')
on conflict (operation_key) do update set
  route_path=excluded.route_path, feature_key=excluded.feature_key, operation_name=excluded.operation_name, permission_key=excluded.permission_key,
  audit_event=excluded.audit_event, mutation_endpoints=excluded.mutation_endpoints, source_confidence=excluded.source_confidence, status=excluded.status, updated_at=now();

commit;

-- Refresh PostgREST only after the complete transaction is committed.
notify pgrst, 'reload schema';

select
  'AREA 11 FAMILY 360 AUTHORITY APPLIED' as result,
  18 as protected_area11_tables,
  96 as canonical_operations,
  'UNTOUCHED' as authentication_and_global_sessions,
  'RESERVED' as area12_parent_relationship_authority,
  'REQUESTED_AFTER_COMMIT' as postgrest_schema_reload;
