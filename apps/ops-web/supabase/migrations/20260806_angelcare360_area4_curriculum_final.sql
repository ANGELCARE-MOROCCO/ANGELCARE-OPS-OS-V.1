begin;

create extension if not exists pgcrypto;

alter table if exists public.angelcare360_subjects
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

create table if not exists public.angelcare360_curriculum_frameworks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  curriculum_code text not null,
  name text not null,
  description text,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  institution_id uuid,
  site_id uuid,
  applicable_levels text[] not null default '{}'::text[],
  state text not null default 'draft' check (state in ('draft','review','ready','active','change_prepared','scheduled','replaced','retired','archived')),
  created_by uuid,
  updated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id,curriculum_code,academic_year_id,site_id)
);

create table if not exists public.angelcare360_curriculum_framework_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  curriculum_id uuid not null references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  version_label text not null,
  version_number integer not null,
  state text not null default 'draft' check (state in ('draft','review','ready','active','change_prepared','scheduled','replaced','retired','archived')),
  effective_from timestamptz,
  effective_to timestamptz,
  change_reason text,
  replaces_version_id uuid references public.angelcare360_curriculum_framework_versions(id) on delete set null,
  approved_by uuid,
  approved_by_label text,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curriculum_id,version_number)
);

create table if not exists public.angelcare360_subject_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  version_label text not null,
  version_number integer not null,
  state text not null default 'draft' check (state in ('draft','review','ready','active','change_prepared','scheduled','replaced','retired','archived')),
  effective_from timestamptz,
  effective_to timestamptz,
  applicable_levels text[] not null default '{}'::text[],
  expected_weekly_hours numeric,
  evaluation_policy_id uuid,
  resource_ids text[] not null default '{}'::text[],
  change_reason text,
  replaces_version_id uuid references public.angelcare360_subject_versions(id) on delete set null,
  approved_by uuid,
  approved_by_label text,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id,version_number)
);

create table if not exists public.angelcare360_curriculum_bindings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  subject_id uuid not null references public.angelcare360_subjects(id) on delete cascade,
  subject_version_id uuid references public.angelcare360_subject_versions(id) on delete set null,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  class_id uuid references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  level_label text,
  required boolean not null default true,
  expected_weekly_hours numeric,
  evaluation_policy_id uuid,
  state text not null default 'draft' check (state in ('draft','review','active','scheduled','retired','archived')),
  effective_from timestamptz,
  effective_to timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_learning_objectives (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  title text not null,
  description text,
  level_label text,
  expected_period_id uuid references public.angelcare360_terms(id) on delete set null,
  required boolean not null default true,
  observable_result text,
  competency_code text,
  sequence_order integer not null default 0,
  effective_from timestamptz,
  effective_to timestamptz,
  state text not null default 'draft' check (state in ('draft','review','ready','active','retired','archived')),
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subject_id is not null or curriculum_id is not null)
);

create table if not exists public.angelcare360_evaluation_policy_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  level_label text,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete set null,
  method text not null check (method in ('continuous_observation','competency_scale','numeric_grade','descriptive','portfolio','project','participation','none')),
  scale_code text,
  required_period_ids text[] not null default '{}'::text[],
  evidence_required boolean not null default false,
  report_card_mapping text,
  state text not null default 'draft' check (state in ('draft','review','ready','active','scheduled','replaced','retired','archived')),
  version_number integer not null default 1,
  effective_from timestamptz,
  effective_to timestamptz,
  approved_by uuid,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subject_id is not null or curriculum_id is not null)
);

alter table public.angelcare360_subject_versions
  drop constraint if exists angelcare360_subject_versions_evaluation_policy_id_fkey;
alter table public.angelcare360_subject_versions
  add constraint angelcare360_subject_versions_evaluation_policy_id_fkey foreign key (evaluation_policy_id) references public.angelcare360_evaluation_policy_versions(id) on delete set null;
alter table public.angelcare360_curriculum_bindings
  drop constraint if exists angelcare360_curriculum_bindings_evaluation_policy_id_fkey;
alter table public.angelcare360_curriculum_bindings
  add constraint angelcare360_curriculum_bindings_evaluation_policy_id_fkey foreign key (evaluation_policy_id) references public.angelcare360_evaluation_policy_versions(id) on delete set null;

create table if not exists public.angelcare360_curriculum_resource_bindings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  document_id uuid references public.angelcare360_documents(id) on delete set null,
  resource_code text not null,
  name text not null,
  category text,
  language text,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  applicable_levels text[] not null default '{}'::text[],
  state text not null default 'available' check (state in ('available','review','missing','restricted','expired','replaced','archived')),
  licence_code text,
  entitlement_code text,
  effective_from timestamptz,
  effective_to timestamptz,
  replacement_resource_id uuid references public.angelcare360_curriculum_resource_bindings(id) on delete set null,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subject_id is not null or curriculum_id is not null)
);

create table if not exists public.angelcare360_curriculum_variations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  curriculum_id uuid not null references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  site_id uuid,
  title text not null,
  reason text not null,
  state text not null default 'draft' check (state in ('draft','pending','approved','rejected','retired')),
  changes_json jsonb not null default '{}'::jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  approved_by uuid,
  approved_by_label text,
  decision_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_curriculum_coverage_findings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  finding_key text,
  source_type text not null,
  source_id text not null,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  evaluation_policy_id uuid references public.angelcare360_evaluation_policy_versions(id) on delete set null,
  title text not null,
  explanation text not null,
  consequence text,
  severity text not null default 'warning' check (severity in ('blocking','warning','information')),
  state text not null default 'open' check (state in ('open','assigned','in_progress','waiting','resolved','reopened','closed','cancelled')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  recommended_action_key text,
  recommended_action_label text,
  exact_href text,
  resolution_reason text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id,finding_key)
);

create table if not exists public.angelcare360_curriculum_tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  issue_id uuid references public.angelcare360_curriculum_coverage_findings(id) on delete set null,
  title text not null,
  description text,
  state text not null default 'open' check (state in ('open','owned','in_progress','completed','cancelled','reopened')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  completed_by uuid,
  completed_at timestamptz,
  completion_note text,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_curriculum_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  issue_id uuid references public.angelcare360_curriculum_coverage_findings(id) on delete set null,
  body text not null,
  important boolean not null default false,
  author_user_id uuid,
  author_label text not null,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_curriculum_approval_reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  evaluation_policy_id uuid references public.angelcare360_evaluation_policy_versions(id) on delete cascade,
  review_type text not null,
  state text not null default 'requested' check (state in ('requested','in_review','approved','rejected','cancelled')),
  reason text,
  requested_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subject_id is not null or curriculum_id is not null or evaluation_policy_id is not null)
);

create table if not exists public.angelcare360_curriculum_action_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  action_key text not null,
  idempotency_key text not null,
  entity_type text not null,
  entity_id uuid,
  state text not null,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (school_id,action_key,idempotency_key)
);

create table if not exists public.angelcare360_curriculum_access_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subscription_id uuid,
  package_version_id uuid,
  item_code text not null,
  state text not null default 'requested' check (state in ('requested','review','approved','activated','rejected','expired','cancelled')),
  reason text not null,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  exact_catalogue_href text not null,
  activated_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_curriculum_evidence_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subject_id uuid references public.angelcare360_subjects(id) on delete cascade,
  curriculum_id uuid references public.angelcare360_curriculum_frameworks(id) on delete cascade,
  issue_id uuid references public.angelcare360_curriculum_coverage_findings(id) on delete set null,
  title text not null,
  description text,
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  state text not null default 'requested' check (state in ('requested','received','verified','rejected','cancelled')),
  requested_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.angelcare360_governance_operation_catalog
  (operation_key,label,permission_key,approval_required,active,metadata_json)
values
  ('subject.create','Créer une matière ou un domaine','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.update','Mettre à jour la matière','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.prepare','Préparer la matière','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.request_approval','Demander la validation de la matière','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.activate','Rendre la matière active','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.prepare_version','Préparer une nouvelle version','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.publish_version','Rendre la version active','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.replace','Remplacer la matière','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.retire','Retirer du programme','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('subject.archive','Archiver la matière','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.create','Créer un programme pédagogique','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.update','Mettre à jour le programme','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.copy_from_previous_year','Préparer le programme de la nouvelle année','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.add_subject','Ajouter une matière au programme','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.remove_future_subject','Retirer d’un futur programme','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.bind_level','Ajouter à un niveau','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.bind_class','Ajouter à une classe','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.unbind_future_class','Retirer d’une classe future','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.preview','Simuler l’organisation pédagogique','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.request_approval','Demander la validation du programme','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.activate','Rendre le programme actif','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.prepare_replacement','Préparer un remplacement','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.replace','Remplacer le programme','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.retire','Retirer le programme','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum.archive','Archiver le programme','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('learning_objective.create','Ajouter un objectif d’apprentissage','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('learning_objective.update','Mettre à jour l’objectif','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('learning_objective.reorder','Réorganiser les objectifs','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('learning_objective.retire','Retirer l’objectif','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('evaluation_policy.create','Définir une méthode d’évaluation','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('evaluation_policy.update','Mettre à jour la méthode d’évaluation','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('evaluation_policy.request_approval','Demander la validation de l’évaluation','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('evaluation_policy.activate','Rendre la méthode active','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('evaluation_policy.replace','Remplacer la méthode d’évaluation','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('evaluation_policy.retire','Retirer la méthode d’évaluation','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_resource.link','Associer une ressource','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_resource.unlink_future','Retirer la ressource des futurs programmes','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_resource.replace','Remplacer la ressource','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_resource.request_access','Demander l’activation commerciale','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',true)),
  ('curriculum_variation.create','Créer une variation locale','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_variation.request_approval','Demander la validation de la variation','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_variation.approve','Approuver la variation locale','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_variation.reject','Refuser la variation locale','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_variation.retire','Retirer la variation locale','curriculum.manage',true,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_issue.assign','Attribuer ce point','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_issue.resolve','Marquer comme réglé','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_issue.reopen','Réouvrir ce point','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_task.assign','Attribuer une tâche','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_task.complete','Terminer la tâche','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_task.reopen','Réouvrir la tâche','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_note.add','Ajouter une note interne','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false)),
  ('curriculum_evidence.request','Demander un justificatif','curriculum.manage',false,true,jsonb_build_object('area','curriculum','customer_language',true,'product_reality',false))
on conflict (operation_key) do update set
  label=excluded.label,
  permission_key=excluded.permission_key,
  approval_required=excluded.approval_required,
  active=excluded.active,
  metadata_json=public.angelcare360_governance_operation_catalog.metadata_json || excluded.metadata_json,
  updated_at=now();

create index if not exists ac360_curriculum_framework_scope_idx on public.angelcare360_curriculum_frameworks(school_id,academic_year_id,site_id,state);
create index if not exists ac360_curriculum_version_idx on public.angelcare360_curriculum_framework_versions(school_id,curriculum_id,version_number desc);
create index if not exists ac360_subject_version_idx on public.angelcare360_subject_versions(school_id,subject_id,version_number desc);
create index if not exists ac360_curriculum_binding_matrix_idx on public.angelcare360_curriculum_bindings(school_id,academic_year_id,class_id,subject_id,state);
create index if not exists ac360_objective_scope_idx on public.angelcare360_learning_objectives(school_id,subject_id,curriculum_id,level_label,state);
create index if not exists ac360_evaluation_policy_scope_idx on public.angelcare360_evaluation_policy_versions(school_id,subject_id,curriculum_id,level_label,state);
create index if not exists ac360_resource_binding_scope_idx on public.angelcare360_curriculum_resource_bindings(school_id,subject_id,curriculum_id,state);
create index if not exists ac360_variation_scope_idx on public.angelcare360_curriculum_variations(school_id,curriculum_id,site_id,state);
create index if not exists ac360_curriculum_finding_active_idx on public.angelcare360_curriculum_coverage_findings(school_id,state,due_at,updated_at desc);
create index if not exists ac360_curriculum_task_active_idx on public.angelcare360_curriculum_tasks(school_id,state,due_at,updated_at desc);
create index if not exists ac360_curriculum_note_timeline_idx on public.angelcare360_curriculum_notes(school_id,subject_id,curriculum_id,created_at desc);
create index if not exists ac360_curriculum_receipt_key_idx on public.angelcare360_curriculum_action_receipts(school_id,action_key,idempotency_key);
create index if not exists ac360_curriculum_access_state_idx on public.angelcare360_curriculum_access_requests(school_id,item_code,state,requested_at desc);

alter table public.angelcare360_curriculum_frameworks enable row level security;
alter table public.angelcare360_curriculum_framework_versions enable row level security;
alter table public.angelcare360_subject_versions enable row level security;
alter table public.angelcare360_curriculum_bindings enable row level security;
alter table public.angelcare360_learning_objectives enable row level security;
alter table public.angelcare360_evaluation_policy_versions enable row level security;
alter table public.angelcare360_curriculum_resource_bindings enable row level security;
alter table public.angelcare360_curriculum_variations enable row level security;
alter table public.angelcare360_curriculum_coverage_findings enable row level security;
alter table public.angelcare360_curriculum_tasks enable row level security;
alter table public.angelcare360_curriculum_notes enable row level security;
alter table public.angelcare360_curriculum_approval_reviews enable row level security;
alter table public.angelcare360_curriculum_action_receipts enable row level security;
alter table public.angelcare360_curriculum_access_requests enable row level security;
alter table public.angelcare360_curriculum_evidence_requests enable row level security;

revoke all on table public.angelcare360_curriculum_frameworks from anon,authenticated;
revoke all on table public.angelcare360_curriculum_framework_versions from anon,authenticated;
revoke all on table public.angelcare360_subject_versions from anon,authenticated;
revoke all on table public.angelcare360_curriculum_bindings from anon,authenticated;
revoke all on table public.angelcare360_learning_objectives from anon,authenticated;
revoke all on table public.angelcare360_evaluation_policy_versions from anon,authenticated;
revoke all on table public.angelcare360_curriculum_resource_bindings from anon,authenticated;
revoke all on table public.angelcare360_curriculum_variations from anon,authenticated;
revoke all on table public.angelcare360_curriculum_coverage_findings from anon,authenticated;
revoke all on table public.angelcare360_curriculum_tasks from anon,authenticated;
revoke all on table public.angelcare360_curriculum_notes from anon,authenticated;
revoke all on table public.angelcare360_curriculum_approval_reviews from anon,authenticated;
revoke all on table public.angelcare360_curriculum_action_receipts from anon,authenticated;
revoke all on table public.angelcare360_curriculum_access_requests from anon,authenticated;
revoke all on table public.angelcare360_curriculum_evidence_requests from anon,authenticated;

grant select,insert,update,delete on table public.angelcare360_curriculum_frameworks to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_framework_versions to service_role;
grant select,insert,update,delete on table public.angelcare360_subject_versions to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_bindings to service_role;
grant select,insert,update,delete on table public.angelcare360_learning_objectives to service_role;
grant select,insert,update,delete on table public.angelcare360_evaluation_policy_versions to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_resource_bindings to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_variations to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_coverage_findings to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_tasks to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_notes to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_approval_reviews to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_action_receipts to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_access_requests to service_role;
grant select,insert,update,delete on table public.angelcare360_curriculum_evidence_requests to service_role;

commit;
