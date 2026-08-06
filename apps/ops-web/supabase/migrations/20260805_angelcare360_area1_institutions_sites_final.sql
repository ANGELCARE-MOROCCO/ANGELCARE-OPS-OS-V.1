begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_institution_requirement_catalog (
  requirement_key text primary key,
  customer_label text not null,
  explanation text not null,
  institution_kind text not null default 'all' check (institution_kind in ('all','school','site')),
  blocking boolean not null default true,
  evidence_required boolean not null default false,
  responsible_role text,
  verification_method text not null default 'derived',
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  version_number integer not null default 1,
  active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_institution_tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null,
  institution_kind text not null check (institution_kind in ('school','site')),
  title text not null,
  description text,
  state text not null default 'open' check (state in ('open','assigned','in_progress','waiting','completed','cancelled','reopened')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  source_type text,
  source_id text,
  completed_by uuid,
  completed_at timestamptz,
  completion_note text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_institution_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null,
  institution_kind text not null check (institution_kind in ('school','site')),
  body text not null,
  important boolean not null default false,
  author_user_id uuid,
  author_label text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_institution_reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null,
  institution_kind text not null check (institution_kind in ('school','site')),
  review_type text not null check (review_type in ('opening','suspension','reopening','closure')),
  state text not null default 'draft' check (state in ('draft','reviewing','blocked','ready','approval_requested','approved','rejected','completed','cancelled')),
  summary_json jsonb not null default '{}'::jsonb,
  reason text,
  requested_by uuid,
  requested_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_institution_action_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  institution_id uuid not null,
  institution_kind text not null check (institution_kind in ('school','site')),
  action_key text not null,
  idempotency_key text not null,
  message text not null,
  result_json jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  unique (school_id,idempotency_key)
);

insert into public.angelcare360_institution_requirement_catalog
  (requirement_key,customer_label,explanation,institution_kind,blocking,evidence_required,responsible_role,verification_method,version_number,active)
values
  ('identity','Informations de l’établissement','Le nom, le type et la ville identifient correctement l’établissement.','all',true,false,'administration','derived',1,true),
  ('contact','Coordonnées principales','Un téléphone et un e-mail sont nécessaires pour les échanges administratifs.','all',true,false,'administration','derived',1,true),
  ('responsible','Responsable administratif','Une personne doit être clairement responsable du suivi administratif.','all',true,false,'direction','derived',1,true),
  ('academic_year','Année scolaire active','Une année scolaire active est nécessaire pour accueillir les enfants.','school',true,false,'administration','derived',1,true),
  ('classes','Classes préparées','Au moins une classe doit être disponible avant l’ouverture opérationnelle.','school',true,false,'administration','derived',1,true),
  ('capacity','Capacité des classes','Chaque classe active doit avoir une capacité définie.','school',true,false,'administration','derived',1,true),
  ('users','Accès administratifs','Au moins un compte autorisé doit pouvoir administrer l’établissement.','all',true,false,'direction','derived',1,true),
  ('documents','Documents administratifs','Les documents nécessaires doivent être ajoutés et vérifiés.','all',false,true,'administration','document',1,true)
on conflict (requirement_key) do update set
  customer_label=excluded.customer_label,
  explanation=excluded.explanation,
  institution_kind=excluded.institution_kind,
  blocking=excluded.blocking,
  evidence_required=excluded.evidence_required,
  responsible_role=excluded.responsible_role,
  verification_method=excluded.verification_method,
  version_number=excluded.version_number,
  active=excluded.active,
  updated_at=now();

insert into public.angelcare360_governance_operation_catalog
  (operation_key,label,permission_key,approval_required,active,metadata_json)
values
  ('institution.create','Créer un établissement','angelcare360.governance.institution.create',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.update_information','Mettre à jour les informations','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.assign_responsible','Attribuer un responsable','angelcare360.governance.institution.assign',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.request_document','Demander un document','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.verify_document','Vérifier un document','angelcare360.governance.institution.verify',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.prepare_opening','Vérifier la préparation','angelcare360.governance.institution.review',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.request_opening_approval','Demander la validation de l’ouverture','angelcare360.governance.institution.review',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.open','Ouvrir l’établissement','angelcare360.governance.institution.activate',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.suspend','Suspendre temporairement','angelcare360.governance.institution.suspend',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.reopen','Rouvrir l’établissement','angelcare360.governance.institution.reactivate',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.begin_closure','Commencer la fermeture','angelcare360.governance.institution.close',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.close','Fermer l’établissement','angelcare360.governance.institution.close',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.archive','Archiver l’établissement','angelcare360.governance.institution.archive',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.create','Ajouter un site','angelcare360.governance.site.create',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.update_information','Mettre à jour un site','angelcare360.governance.site.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.assign_coordinator','Attribuer un coordinateur','angelcare360.governance.site.assign',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.open','Ouvrir un site','angelcare360.governance.site.activate',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.suspend','Suspendre un site','angelcare360.governance.site.suspend',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.reopen','Rouvrir un site','angelcare360.governance.site.reactivate',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.begin_closure','Commencer la fermeture d’un site','angelcare360.governance.site.close',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('site.close','Fermer un site','angelcare360.governance.site.close',true,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.task.assign','Attribuer une tâche','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.task.start','Commencer une tâche','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.task.complete','Terminer une tâche','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.task.reopen','Réouvrir une tâche','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true)),
  ('institution.note.add','Ajouter une note','angelcare360.governance.institution.update',false,true,jsonb_build_object('area','institutions_sites','customer_language',true))
on conflict (operation_key) do update set
  label=excluded.label,
  permission_key=excluded.permission_key,
  approval_required=excluded.approval_required,
  active=excluded.active,
  metadata_json=public.angelcare360_governance_operation_catalog.metadata_json || excluded.metadata_json,
  updated_at=now();

create index if not exists ac360_inst_tasks_active_idx on public.angelcare360_institution_tasks(school_id,institution_id,state,due_at);
create index if not exists ac360_inst_notes_timeline_idx on public.angelcare360_institution_notes(school_id,institution_id,created_at desc);
create index if not exists ac360_inst_reviews_state_idx on public.angelcare360_institution_reviews(school_id,institution_id,review_type,state,created_at desc);
create index if not exists ac360_inst_receipts_key_idx on public.angelcare360_institution_action_receipts(school_id,idempotency_key);

alter table public.angelcare360_institution_tasks enable row level security;
alter table public.angelcare360_institution_notes enable row level security;
alter table public.angelcare360_institution_reviews enable row level security;
alter table public.angelcare360_institution_action_receipts enable row level security;

revoke all on table public.angelcare360_institution_tasks from anon,authenticated;
revoke all on table public.angelcare360_institution_notes from anon,authenticated;
revoke all on table public.angelcare360_institution_reviews from anon,authenticated;
revoke all on table public.angelcare360_institution_action_receipts from anon,authenticated;

grant select,insert,update,delete on table public.angelcare360_institution_tasks to service_role;
grant select,insert,update,delete on table public.angelcare360_institution_notes to service_role;
grant select,insert,update,delete on table public.angelcare360_institution_reviews to service_role;
grant select,insert,update,delete on table public.angelcare360_institution_action_receipts to service_role;
grant select on table public.angelcare360_institution_requirement_catalog to authenticated,service_role;

commit;
