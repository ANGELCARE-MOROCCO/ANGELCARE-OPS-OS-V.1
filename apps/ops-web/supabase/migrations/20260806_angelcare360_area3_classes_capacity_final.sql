begin;

create extension if not exists pgcrypto;

alter table if exists public.angelcare360_governance_population_movements
  add column if not exists metadata_json jsonb not null default '{}'::jsonb;

create table if not exists public.angelcare360_capacity_policy_catalog (
  policy_key text primary key,
  customer_label text not null,
  explanation text not null,
  policy_type text not null check (policy_type in ('threshold','reservation','placement','capacity_change','temporary_exception','freeze','split_merge','projection','topup')),
  numeric_value numeric,
  text_value text,
  boolean_value boolean,
  scope text not null default 'tenant' check (scope in ('platform','tenant','institution','site','academic_year')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  version_number integer not null default 1,
  approval_state text not null default 'approved' check (approval_state in ('draft','review','approved','superseded','retired')),
  active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_capacity_seat_reservations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  student_id uuid references public.angelcare360_students(id) on delete set null,
  admission_application_id uuid references public.angelcare360_admission_applications(id) on delete set null,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete set null,
  starts_on date not null,
  expires_on date not null,
  state text not null default 'reserved' check (state in ('reserved','to_confirm','used','released','cancelled')),
  reason text,
  responsible_user_id uuid,
  responsible_label text,
  confirmed_at timestamptz,
  released_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid,
  updated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_on >= starts_on),
  check (student_id is not null or admission_application_id is not null)
);

create table if not exists public.angelcare360_capacity_enrollment_freezes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete cascade,
  state text not null default 'active' check (state in ('active','released','expired','cancelled')),
  reason text not null,
  effective_from timestamptz not null default now(),
  review_at timestamptz,
  requested_by uuid,
  released_by uuid,
  released_at timestamptz,
  release_reason text,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_capacity_temporary_exceptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  class_id uuid not null references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete cascade,
  previous_capacity integer not null,
  temporary_capacity integer not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  review_at timestamptz,
  reason text not null,
  state text not null default 'requested' check (state in ('requested','approved','rejected','expired','cancelled')),
  requested_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  expired_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (temporary_capacity >= 0),
  check (expires_at > starts_at)
);

create table if not exists public.angelcare360_capacity_movement_items (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  movement_run_id uuid not null references public.angelcare360_governance_population_movements(id) on delete cascade,
  student_id uuid not null references public.angelcare360_students(id) on delete cascade,
  source_class_id uuid references public.angelcare360_classes(id) on delete set null,
  source_section_id uuid references public.angelcare360_sections(id) on delete set null,
  target_class_id uuid not null references public.angelcare360_classes(id) on delete restrict,
  target_section_id uuid references public.angelcare360_sections(id) on delete set null,
  state text not null default 'proposed' check (state in ('proposed','approved','completed','failed','repaired','cancelled')),
  failure_reason text,
  reason text,
  executed_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (movement_run_id,student_id)
);

create table if not exists public.angelcare360_capacity_issues (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  issue_key text not null,
  class_id uuid references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  title text not null,
  explanation text not null,
  consequence text,
  severity text not null default 'warning' check (severity in ('blocking','warning','information')),
  state text not null default 'open' check (state in ('open','owned','in_progress','waiting','resolved','reopened','closed','cancelled')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  recommended_action_key text,
  recommended_action_label text,
  exact_href text,
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id,issue_key)
);

create table if not exists public.angelcare360_capacity_tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  class_id uuid references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete cascade,
  issue_id uuid references public.angelcare360_capacity_issues(id) on delete set null,
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
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_capacity_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  class_id uuid references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete cascade,
  issue_id uuid references public.angelcare360_capacity_issues(id) on delete set null,
  body text not null,
  important boolean not null default false,
  author_user_id uuid,
  author_label text not null,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_capacity_topup_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  subscription_id uuid,
  package_version_id uuid,
  meter_key text,
  quantity integer not null check (quantity > 0),
  state text not null default 'requested' check (state in ('requested','review','approved','activated','rejected','cancelled')),
  reason text not null,
  source_class_id uuid references public.angelcare360_classes(id) on delete set null,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  owner_label text,
  review_at timestamptz,
  exact_catalogue_href text not null,
  activated_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_capacity_action_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  class_id uuid references public.angelcare360_classes(id) on delete cascade,
  section_id uuid references public.angelcare360_sections(id) on delete cascade,
  reservation_id uuid references public.angelcare360_capacity_seat_reservations(id) on delete set null,
  movement_run_id uuid references public.angelcare360_governance_population_movements(id) on delete set null,
  issue_id uuid references public.angelcare360_capacity_issues(id) on delete set null,
  action_key text not null,
  idempotency_key text not null,
  message text not null,
  result_json jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  unique (school_id,idempotency_key)
);

insert into public.angelcare360_capacity_policy_catalog
  (policy_key,customer_label,explanation,policy_type,numeric_value,text_value,boolean_value,scope,version_number,approval_state,active)
values
  ('near_capacity_threshold','Seuil presque complet','Une classe est signalée avant d’atteindre sa capacité prévue.','threshold',85,null,null,'platform',1,'approved',true),
  ('reservation_default_days','Durée normale d’une réservation','Nombre de jours proposé avant expiration d’une place réservée.','reservation',7,null,null,'platform',1,'approved',true),
  ('reservation_extension_requires_reason','Justification pour prolonger','Toute prolongation de réservation nécessite un motif.','reservation',null,null,true,'platform',1,'approved',true),
  ('capacity_change_approval','Validation des changements importants','Les changements de capacité nécessitent une validation selon l’autorité de l’utilisateur.','capacity_change',null,'direction',true,'platform',1,'approved',true),
  ('temporary_exception_expiry','Expiration obligatoire','Une autorisation temporaire doit toujours avoir une date de fin.','temporary_exception',null,null,true,'platform',1,'approved',true),
  ('topup_warning_threshold','Alerte formule presque utilisée','Avertit avant que toutes les places contractuelles soient utilisées.','topup',10,null,null,'platform',1,'approved',true)
on conflict (policy_key) do update set
  customer_label=excluded.customer_label,
  explanation=excluded.explanation,
  policy_type=excluded.policy_type,
  numeric_value=excluded.numeric_value,
  text_value=excluded.text_value,
  boolean_value=excluded.boolean_value,
  scope=excluded.scope,
  version_number=greatest(public.angelcare360_capacity_policy_catalog.version_number,excluded.version_number),
  approval_state=excluded.approval_state,
  active=excluded.active,
  updated_at=now();

insert into public.angelcare360_governance_operation_catalog
  (operation_key,label,permission_key,approval_required,active,metadata_json)
values
  ('class.create','Créer une classe','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.update','Mettre à jour la classe','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.open','Ouvrir la classe','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.freeze_placements','Suspendre les nouvelles affectations','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.unfreeze_placements','Autoriser de nouveau les affectations','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.begin_closure','Préparer la fermeture','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.close','Fermer la classe','classes.manage',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class.archive','Archiver la classe','classes.manage',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.create','Créer une section','classes.sections',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.update','Mettre à jour la section','classes.sections',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.assign_responsible','Attribuer une responsable','classes.sections',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.freeze_placements','Suspendre les affectations de la section','classes.sections',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.unfreeze_placements','Réouvrir les affectations de la section','classes.sections',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.begin_closure','Préparer la fermeture de la section','classes.sections',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section.close','Fermer la section','classes.sections',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.preview_change','Simuler un nouveau nombre de places','classes.capacity',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.request_change','Préparer une modification de capacité','classes.capacity',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.approve_change','Valider la nouvelle capacité','classes.capacity',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.apply_change','Appliquer la nouvelle capacité','classes.capacity',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.request_exception','Demander une autorisation temporaire','classes.capacity',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.approve_exception','Valider l’autorisation temporaire','classes.capacity',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.expire_exception','Terminer l’autorisation temporaire','classes.capacity',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity.request_topup','Demander des places supplémentaires','classes.topups',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',true)),
  ('seat.reserve','Réserver une place','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('seat.confirm','Confirmer l’utilisation de la place','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('seat.extend','Prolonger la réservation','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('seat.release','Libérer la place','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('seat.cancel','Annuler la réservation','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('placement.preview','Vérifier la place disponible','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('placement.assign','Attribuer la place','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('placement.cancel','Terminer l’affectation','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('population_move.preview','Prévisualiser le déplacement','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('population_move.execute','Déplacer vers une autre classe','classes.placements',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('population_move.retry_item','Réessayer ce déplacement','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('population_move.cancel','Annuler le mouvement','classes.placements',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class_split.preview','Préparer une nouvelle section','classes.capacity',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('class_split.execute','Créer la section et répartir les enfants','classes.capacity',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section_merge.preview','Préparer la réunion des sections','classes.capacity',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('section_merge.execute','Réunir les sections','classes.capacity',true,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity_issue.assign','Attribuer ce point','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity_issue.resolve','Marquer comme réglé','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity_issue.reopen','Réouvrir ce point','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity_note.add','Ajouter une note interne','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false)),
  ('capacity_evidence.request','Demander un justificatif','classes.manage',false,true,jsonb_build_object('area','classes_capacity','customer_language',true,'product_reality',false))
on conflict (operation_key) do update set
  label=excluded.label,
  permission_key=excluded.permission_key,
  approval_required=excluded.approval_required,
  active=excluded.active,
  metadata_json=public.angelcare360_governance_operation_catalog.metadata_json || excluded.metadata_json,
  updated_at=now();

create index if not exists ac360_capacity_reservation_class_idx on public.angelcare360_capacity_seat_reservations(school_id,class_id,state,expires_on);
create index if not exists ac360_capacity_freeze_active_idx on public.angelcare360_capacity_enrollment_freezes(school_id,class_id,section_id,state);
create index if not exists ac360_capacity_exception_active_idx on public.angelcare360_capacity_temporary_exceptions(school_id,class_id,section_id,state,expires_at);
create index if not exists ac360_capacity_movement_item_run_idx on public.angelcare360_capacity_movement_items(school_id,movement_run_id,state);
create index if not exists ac360_capacity_issue_active_idx on public.angelcare360_capacity_issues(school_id,state,due_at,updated_at desc);
create index if not exists ac360_capacity_task_active_idx on public.angelcare360_capacity_tasks(school_id,state,due_at,updated_at desc);
create index if not exists ac360_capacity_note_timeline_idx on public.angelcare360_capacity_notes(school_id,class_id,section_id,created_at desc);
create index if not exists ac360_capacity_topup_state_idx on public.angelcare360_capacity_topup_requests(school_id,state,requested_at desc);
create index if not exists ac360_capacity_receipt_key_idx on public.angelcare360_capacity_action_receipts(school_id,idempotency_key);

alter table public.angelcare360_capacity_policy_catalog enable row level security;
alter table public.angelcare360_capacity_seat_reservations enable row level security;
alter table public.angelcare360_capacity_enrollment_freezes enable row level security;
alter table public.angelcare360_capacity_temporary_exceptions enable row level security;
alter table public.angelcare360_capacity_movement_items enable row level security;
alter table public.angelcare360_capacity_issues enable row level security;
alter table public.angelcare360_capacity_tasks enable row level security;
alter table public.angelcare360_capacity_notes enable row level security;
alter table public.angelcare360_capacity_topup_requests enable row level security;
alter table public.angelcare360_capacity_action_receipts enable row level security;

revoke all on table public.angelcare360_capacity_policy_catalog from anon,authenticated;
revoke all on table public.angelcare360_capacity_seat_reservations from anon,authenticated;
revoke all on table public.angelcare360_capacity_enrollment_freezes from anon,authenticated;
revoke all on table public.angelcare360_capacity_temporary_exceptions from anon,authenticated;
revoke all on table public.angelcare360_capacity_movement_items from anon,authenticated;
revoke all on table public.angelcare360_capacity_issues from anon,authenticated;
revoke all on table public.angelcare360_capacity_tasks from anon,authenticated;
revoke all on table public.angelcare360_capacity_notes from anon,authenticated;
revoke all on table public.angelcare360_capacity_topup_requests from anon,authenticated;
revoke all on table public.angelcare360_capacity_action_receipts from anon,authenticated;

grant select,insert,update,delete on table public.angelcare360_capacity_policy_catalog to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_seat_reservations to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_enrollment_freezes to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_temporary_exceptions to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_movement_items to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_issues to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_tasks to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_notes to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_topup_requests to service_role;
grant select,insert,update,delete on table public.angelcare360_capacity_action_receipts to service_role;

commit;
