begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_governance_operation_catalog (
  operation_key text primary key,
  label text not null,
  permission_key text not null,
  approval_required boolean not null default false,
  active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_governance_sites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  site_code text not null,
  name text not null,
  site_type text not null default 'site',
  city text,
  country text not null default 'Maroc',
  timezone text not null default 'Africa/Casablanca',
  status text not null default 'draft' check (status in ('draft','inactive','active','suspended','closed','archived')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, site_code)
);

create table if not exists public.angelcare360_governance_executions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  operation_key text not null,
  entity_type text not null,
  entity_id text,
  idempotency_key text not null,
  state text not null default 'requested' check (state in ('requested','validating','executing','completed','blocked','failed','compensated')),
  request_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  reason text,
  effective_at timestamptz,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  retry_count integer not null default 0,
  error_message text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, idempotency_key)
);

create table if not exists public.angelcare360_governance_readiness_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null,
  run_code text not null,
  state text not null check (state in ('ready','ready_with_warnings','incomplete','blocked','expired')),
  passed_count integer not null default 0,
  required_count integer not null default 0,
  snapshot_json jsonb not null default '{}'::jsonb,
  requested_by uuid,
  executed_at timestamptz,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (school_id, run_code)
);

create table if not exists public.angelcare360_governance_readiness_findings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  readiness_run_id uuid not null references public.angelcare360_governance_readiness_runs(id) on delete cascade,
  institution_id uuid not null,
  requirement_key text not null,
  title text not null,
  detail text,
  status text not null default 'open' check (status in ('open','acknowledged','verified','accepted_warning','rejected','resolved','expired')),
  severity text not null default 'blocking' check (severity in ('blocking','warning','information')),
  source_entity_type text,
  source_entity_id text,
  owner_user_id uuid,
  evidence_json jsonb not null default '{}'::jsonb,
  verified_by uuid,
  verified_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_governance_matters (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  fingerprint text not null,
  title text not null,
  summary text not null,
  category_key text not null,
  source_entity_type text not null,
  source_entity_id text not null,
  source_label text,
  exact_href text not null,
  state text not null default 'new' check (state in ('new','acknowledged','owned','in_progress','waiting_evidence','decision_required','approved_execution','resolved','released','snoozed','reopened','cancelled')),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low','information')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  detected_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  verified_at timestamptz,
  verified_by uuid,
  evidence_requested_at timestamptz,
  evidence_requested_by uuid,
  snoozed_until timestamptz,
  snooze_reason text,
  escalated_at timestamptz,
  escalated_by uuid,
  escalation_reason text,
  resolved_at timestamptz,
  resolved_by uuid,
  released_at timestamptz,
  released_by uuid,
  resolution_reason text,
  reopened_at timestamptz,
  reopened_by uuid,
  reopen_reason text,
  impact_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, fingerprint)
);

create table if not exists public.angelcare360_governance_matter_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  matter_id uuid not null references public.angelcare360_governance_matters(id) on delete cascade,
  event_type text not null,
  label text not null,
  detail text,
  actor_user_id uuid,
  actor_label text,
  tone text not null default 'neutral' check (tone in ('critical','warning','active','verified','decision','neutral')),
  idempotency_key text not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (school_id, idempotency_key)
);

create table if not exists public.angelcare360_governance_institution_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null,
  from_state text,
  to_state text not null,
  effective_at timestamptz not null,
  reason text,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  actor_user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_governance_academic_structure_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  version_code text not null,
  version_number integer not null,
  state text not null default 'draft' check (state in ('draft','published','active','closed','superseded','archived')),
  effective_from timestamptz,
  effective_to timestamptz,
  structure_json jsonb not null default '{}'::jsonb,
  source_signature text not null,
  supersedes_version_id uuid references public.angelcare360_governance_academic_structure_versions(id) on delete set null,
  published_by uuid,
  published_at timestamptz,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (school_id, academic_year_id, version_number),
  unique (school_id, version_code)
);

create table if not exists public.angelcare360_governance_rollover_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  run_code text not null,
  source_academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  target_academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete restrict,
  state text not null default 'previewed' check (state in ('draft','previewed','review','approved','executing','completed','partially_failed','failed','cancelled')),
  idempotency_key text not null,
  summary_json jsonb not null default '{}'::jsonb,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  approved_by uuid,
  approved_at timestamptz,
  executed_by uuid,
  executed_at timestamptz,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, run_code),
  unique (school_id, idempotency_key)
);

create table if not exists public.angelcare360_governance_rollover_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  rollover_run_id uuid not null references public.angelcare360_governance_rollover_runs(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete restrict,
  source_class_id uuid references public.angelcare360_classes(id) on delete set null,
  source_section_id uuid references public.angelcare360_sections(id) on delete set null,
  decision text not null default 'promote' check (decision in ('promote','repeat','transfer_class','transfer_section','transfer_institution','suspend','withdraw','graduate','alumni','reenroll')),
  target_class_id uuid references public.angelcare360_classes(id) on delete set null,
  target_section_id uuid references public.angelcare360_sections(id) on delete set null,
  state text not null default 'proposed' check (state in ('proposed','review','approved','excluded','executing','completed','failed','repaired')),
  blocker_reason text,
  proposal_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rollover_run_id, student_id)
);

create table if not exists public.angelcare360_governance_capacity_changes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  entity_type text not null check (entity_type in ('class','section','institution','site')),
  entity_id uuid not null,
  previous_capacity integer not null default 0,
  new_capacity integer not null check (new_capacity >= 0),
  effective_at timestamptz not null,
  reason text,
  impact_json jsonb not null default '{}'::jsonb,
  state text not null default 'applied' check (state in ('requested','approved','applied','rejected','rolled_back')),
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  requested_by uuid,
  approved_by uuid,
  applied_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_governance_population_movements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  movement_code text not null,
  student_ids uuid[] not null default '{}',
  source_class_id uuid references public.angelcare360_classes(id) on delete set null,
  source_section_id uuid references public.angelcare360_sections(id) on delete set null,
  target_class_id uuid not null references public.angelcare360_classes(id) on delete restrict,
  target_section_id uuid references public.angelcare360_sections(id) on delete set null,
  effective_at timestamptz not null,
  reason text,
  state text not null default 'requested' check (state in ('requested','approved','executing','completed','partially_failed','failed','rolled_back')),
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  requested_by uuid,
  executed_by uuid,
  executed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (school_id, movement_code)
);

create table if not exists public.angelcare360_governance_role_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  role_id uuid not null references public.angelcare360_roles(id) on delete cascade,
  version_number integer not null,
  version_code text not null,
  state text not null default 'draft' check (state in ('draft','security_review','approved','published','active','superseded','suspended','retired')),
  role_snapshot jsonb not null default '{}'::jsonb,
  permission_keys text[] not null default '{}',
  impact_json jsonb not null default '{}'::jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  supersedes_version_id uuid references public.angelcare360_governance_role_versions(id) on delete set null,
  published_by uuid,
  published_at timestamptz,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (school_id, role_id, version_number),
  unique (school_id, version_code)
);

create table if not exists public.angelcare360_governance_delegations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  delegation_code text not null,
  user_id uuid not null,
  user_label text not null,
  role_id uuid not null references public.angelcare360_roles(id) on delete restrict,
  role_label text not null,
  scope_type text not null default 'school',
  scope_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz,
  review_at timestamptz,
  restrictions_json jsonb not null default '{}'::jsonb,
  reason text,
  status text not null default 'active' check (status in ('draft','active','expired','revoked','suspended','closed')),
  delegated_by uuid,
  revoked_by uuid,
  revoked_at timestamptz,
  revoke_reason text,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, delegation_code)
);

create table if not exists public.angelcare360_governance_configuration_changesets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  changeset_code text not null,
  title text not null,
  configuration_key text not null,
  ownership text not null default 'tenant' check (ownership in ('operator','tenant','institution','policy','derived')),
  current_value jsonb not null default '{}'::jsonb,
  proposed_value jsonb not null default '{}'::jsonb,
  changes_json jsonb not null default '[]'::jsonb,
  change_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft','validated','submitted','approved','scheduled','published','rejected','rolled_back','superseded')),
  effective_at timestamptz,
  version_number integer,
  rollback_of_version_id uuid,
  submitted_by uuid,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, changeset_code)
);

create table if not exists public.angelcare360_governance_configuration_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  configuration_key text not null,
  version_code text not null,
  label text not null,
  ownership text not null check (ownership in ('operator','tenant','institution','policy','derived')),
  version_number integer not null,
  state text not null default 'published' check (state in ('draft','scheduled','published','superseded','suspended','archived')),
  value_json jsonb not null default '{}'::jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  supersedes_version_id uuid references public.angelcare360_governance_configuration_versions(id) on delete set null,
  source_changeset_id uuid references public.angelcare360_governance_configuration_changesets(id) on delete set null,
  source_signature text not null,
  published_by uuid,
  published_at timestamptz,
  execution_id uuid references public.angelcare360_governance_executions(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, configuration_key, version_number),
  unique (school_id, version_code)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'angelcare360_governance_changesets_rollback_fk'
      and conrelid = 'public.angelcare360_governance_configuration_changesets'::regclass
  ) then
    alter table public.angelcare360_governance_configuration_changesets
      add constraint angelcare360_governance_changesets_rollback_fk
      foreign key (rollback_of_version_id)
      references public.angelcare360_governance_configuration_versions(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.angelcare360_governance_briefing_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  briefing_type text not null check (briefing_type in ('readiness','academic_structure','capacity_risk','assignment_coverage','access','rollover','configuration','weekly')),
  title text not null,
  posture text not null,
  briefing_json jsonb not null default '{}'::jsonb,
  source_signature text not null,
  idempotency_key text not null,
  status text not null default 'generated' check (status in ('requested','generating','generated','failed','archived')),
  requested_by uuid,
  generated_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (school_id, idempotency_key)
);


insert into public.angelcare360_governance_operation_catalog(operation_key,label,permission_key,approval_required)
values
('governance.institution.create','Créer un établissement','parametres.create',false),
('governance.institution.review','Évaluer la readiness','parametres.update',false),
('governance.institution.activate','Activer un établissement','parametres.update',true),
('governance.institution.suspend','Suspendre un établissement','parametres.update',true),
('governance.institution.reactivate','Réactiver un établissement','parametres.update',true),
('governance.institution.close','Fermer un établissement','parametres.update',true),
('governance.institution.archive','Archiver un établissement','parametres.update',true),
('governance.academic_year.create','Créer une année scolaire','annees_scolaires.create',false),
('governance.academic_year.publish','Publier une année scolaire','annees_scolaires.update',true),
('governance.academic_year.activate','Activer une année scolaire','annees_scolaires.update',true),
('governance.academic_year.close','Clôturer une année scolaire','annees_scolaires.update',true),
('governance.academic_year.reopen','Réouvrir une année scolaire','annees_scolaires.update',true),
('governance.rollover.preview','Prévisualiser le rollover','annees_scolaires.update',false),
('governance.rollover.execute','Exécuter le rollover','annees_scolaires.update',true),
('governance.rollover.repair','Réparer le rollover','annees_scolaires.update',true),
('governance.period.create','Créer une période','annees_scolaires.update',false),
('governance.period.publish','Publier une période','annees_scolaires.update',true),
('governance.period.close','Clôturer une période','annees_scolaires.update',true),
('governance.period.reopen','Réouvrir une période','annees_scolaires.update',true),
('governance.class.create','Créer une classe','classes.create',false),
('governance.section.create','Créer une section','classes.create',false),
('governance.capacity.change','Modifier une capacité','classes.update',true),
('governance.population.move','Déplacer une population','classes.update',true),
('governance.enrollment.freeze','Geler les inscriptions','classes.update',true),
('governance.subject.create','Créer une matière','matieres.create',false),
('governance.subject.publish','Publier une matière','matieres.update',true),
('governance.subject.replace','Remplacer une matière','matieres.update',true),
('governance.subject.retire','Retirer une matière','matieres.update',true),
('governance.assignment.create','Créer une affectation','enseignants.assign',false),
('governance.assignment.change','Modifier une affectation','enseignants.assign',true),
('governance.assignment.replace','Remplacer un enseignant','enseignants.assign',true),
('governance.assignment.end','Terminer une affectation','enseignants.assign',true),
('governance.role.create','Créer un rôle','securite.configure',false),
('governance.role.publish','Publier un rôle','securite.configure',true),
('governance.role.assign','Affecter un rôle','securite.configure',true),
('governance.role.revoke','Révoquer un rôle','securite.configure',true),
('governance.delegation.create','Créer une délégation','securite.configure',true),
('governance.delegation.revoke','Révoquer une délégation','securite.configure',true),
('governance.configuration.publish','Publier une configuration','parametres.update',true),
('governance.configuration.rollback','Restaurer une configuration','parametres.update',true),
('governance.matter.action','Traiter un matter','parametres.update',false),
('governance.briefing.generate','Générer un briefing','parametres.view',false)
on conflict(operation_key) do update set
  label=excluded.label,
  permission_key=excluded.permission_key,
  approval_required=excluded.approval_required,
  active=true,
  updated_at=now();

create index if not exists ac360_gov_sites_school_status_idx on public.angelcare360_governance_sites(school_id,status,updated_at desc);
create index if not exists ac360_gov_exec_school_state_idx on public.angelcare360_governance_executions(school_id,state,requested_at desc);
create index if not exists ac360_gov_readiness_runs_idx on public.angelcare360_governance_readiness_runs(school_id,institution_id,executed_at desc);
create index if not exists ac360_gov_readiness_findings_idx on public.angelcare360_governance_readiness_findings(school_id,institution_id,status,severity);
create index if not exists ac360_gov_matters_state_idx on public.angelcare360_governance_matters(school_id,state,severity,updated_at desc);
create index if not exists ac360_gov_matters_source_idx on public.angelcare360_governance_matters(school_id,source_entity_type,source_entity_id);
create index if not exists ac360_gov_events_matter_idx on public.angelcare360_governance_matter_events(school_id,matter_id,created_at desc);
create index if not exists ac360_gov_lifecycle_institution_idx on public.angelcare360_governance_institution_lifecycle_events(school_id,institution_id,effective_at desc);
create index if not exists ac360_gov_structure_year_idx on public.angelcare360_governance_academic_structure_versions(school_id,academic_year_id,version_number desc);
create index if not exists ac360_gov_rollover_state_idx on public.angelcare360_governance_rollover_runs(school_id,state,requested_at desc);
create index if not exists ac360_gov_rollover_items_idx on public.angelcare360_governance_rollover_items(rollover_run_id,state,student_id);
create index if not exists ac360_gov_capacity_entity_idx on public.angelcare360_governance_capacity_changes(school_id,entity_type,entity_id,effective_at desc);
create index if not exists ac360_gov_movements_state_idx on public.angelcare360_governance_population_movements(school_id,state,effective_at desc);
create index if not exists ac360_gov_role_versions_idx on public.angelcare360_governance_role_versions(school_id,role_id,version_number desc);
create index if not exists ac360_gov_delegations_idx on public.angelcare360_governance_delegations(school_id,status,ends_at);
create index if not exists ac360_gov_changesets_idx on public.angelcare360_governance_configuration_changesets(school_id,status,configuration_key,updated_at desc);
create index if not exists ac360_gov_config_versions_idx on public.angelcare360_governance_configuration_versions(school_id,configuration_key,version_number desc);
create index if not exists ac360_gov_briefings_idx on public.angelcare360_governance_briefing_runs(school_id,briefing_type,generated_at desc);

alter table public.angelcare360_governance_operation_catalog enable row level security;
alter table public.angelcare360_governance_sites enable row level security;
alter table public.angelcare360_governance_executions enable row level security;
alter table public.angelcare360_governance_readiness_runs enable row level security;
alter table public.angelcare360_governance_readiness_findings enable row level security;
alter table public.angelcare360_governance_matters enable row level security;
alter table public.angelcare360_governance_matter_events enable row level security;
alter table public.angelcare360_governance_institution_lifecycle_events enable row level security;
alter table public.angelcare360_governance_academic_structure_versions enable row level security;
alter table public.angelcare360_governance_rollover_runs enable row level security;
alter table public.angelcare360_governance_rollover_items enable row level security;
alter table public.angelcare360_governance_capacity_changes enable row level security;
alter table public.angelcare360_governance_population_movements enable row level security;
alter table public.angelcare360_governance_role_versions enable row level security;
alter table public.angelcare360_governance_delegations enable row level security;
alter table public.angelcare360_governance_configuration_changesets enable row level security;
alter table public.angelcare360_governance_configuration_versions enable row level security;
alter table public.angelcare360_governance_briefing_runs enable row level security;

revoke all on table public.angelcare360_governance_operation_catalog from anon, authenticated;
revoke all on table public.angelcare360_governance_sites from anon, authenticated;
revoke all on table public.angelcare360_governance_executions from anon, authenticated;
revoke all on table public.angelcare360_governance_readiness_runs from anon, authenticated;
revoke all on table public.angelcare360_governance_readiness_findings from anon, authenticated;
revoke all on table public.angelcare360_governance_matters from anon, authenticated;
revoke all on table public.angelcare360_governance_matter_events from anon, authenticated;
revoke all on table public.angelcare360_governance_institution_lifecycle_events from anon, authenticated;
revoke all on table public.angelcare360_governance_academic_structure_versions from anon, authenticated;
revoke all on table public.angelcare360_governance_rollover_runs from anon, authenticated;
revoke all on table public.angelcare360_governance_rollover_items from anon, authenticated;
revoke all on table public.angelcare360_governance_capacity_changes from anon, authenticated;
revoke all on table public.angelcare360_governance_population_movements from anon, authenticated;
revoke all on table public.angelcare360_governance_role_versions from anon, authenticated;
revoke all on table public.angelcare360_governance_delegations from anon, authenticated;
revoke all on table public.angelcare360_governance_configuration_changesets from anon, authenticated;
revoke all on table public.angelcare360_governance_configuration_versions from anon, authenticated;
revoke all on table public.angelcare360_governance_briefing_runs from anon, authenticated;

grant select,insert,update,delete on table public.angelcare360_governance_operation_catalog to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_sites to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_executions to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_readiness_runs to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_readiness_findings to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_matters to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_matter_events to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_institution_lifecycle_events to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_academic_structure_versions to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_rollover_runs to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_rollover_items to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_capacity_changes to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_population_movements to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_role_versions to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_delegations to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_configuration_changesets to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_configuration_versions to service_role;
grant select,insert,update,delete on table public.angelcare360_governance_briefing_runs to service_role;

commit;
