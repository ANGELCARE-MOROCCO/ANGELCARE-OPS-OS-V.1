begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_academic_year_requirement_catalog (
  requirement_key text primary key,
  customer_label text not null,
  explanation text not null,
  requirement_scope text not null default 'activation' check (requirement_scope in ('activation','period_closure','year_closure','transition')),
  blocking boolean not null default true,
  responsible_role text,
  verification_method text not null default 'derived',
  source_type text,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  version_number integer not null default 1,
  active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_academic_year_preparation_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  run_type text not null default 'preparation' check (run_type in ('preparation','calendar','activation','closure')),
  state text not null default 'reviewing' check (state in ('reviewing','blocked','ready','completed','failed')),
  summary_json jsonb not null default '{}'::jsonb,
  reason text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_academic_structure_reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete cascade,
  period_id uuid references public.angelcare360_terms(id) on delete cascade,
  transition_run_id uuid references public.angelcare360_governance_rollover_runs(id) on delete cascade,
  review_type text not null check (review_type in ('activation','year_closure','year_reopen','period_closure','period_reopen','transition')),
  state text not null default 'approval_requested' check (state in ('draft','reviewing','blocked','ready','approval_requested','approved','rejected','completed','cancelled')),
  summary_json jsonb not null default '{}'::jsonb,
  reason text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (academic_year_id is not null or period_id is not null or transition_run_id is not null)
);

create table if not exists public.angelcare360_academic_period_closure_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  period_id uuid not null references public.angelcare360_terms(id) on delete cascade,
  action_type text not null check (action_type in ('activate','begin_closure','close','reopen','replace')),
  state text not null,
  reason text,
  effective_at timestamptz not null default now(),
  actor_user_id uuid,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_academic_year_closure_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  action_type text not null check (action_type in ('begin_closure','close','reopen','archive')),
  state text not null,
  reason text,
  effective_at timestamptz not null default now(),
  actor_user_id uuid,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_academic_structure_tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  period_id uuid references public.angelcare360_terms(id) on delete cascade,
  transition_run_id uuid references public.angelcare360_governance_rollover_runs(id) on delete cascade,
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

create table if not exists public.angelcare360_academic_structure_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid not null references public.angelcare360_academic_years(id) on delete cascade,
  period_id uuid references public.angelcare360_terms(id) on delete cascade,
  transition_run_id uuid references public.angelcare360_governance_rollover_runs(id) on delete cascade,
  body text not null,
  important boolean not null default false,
  author_user_id uuid,
  author_label text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_academic_structure_action_receipts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid references public.angelcare360_academic_years(id) on delete cascade,
  period_id uuid references public.angelcare360_terms(id) on delete cascade,
  transition_run_id uuid references public.angelcare360_governance_rollover_runs(id) on delete cascade,
  action_key text not null,
  idempotency_key text not null,
  message text not null,
  result_json jsonb not null default '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz not null default now(),
  unique (school_id,idempotency_key)
);

alter table public.angelcare360_academic_year_requirement_catalog enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='angelcare360_academic_year_requirement_catalog'
      and policyname='angelcare360_academic_year_requirement_catalog_read'
  ) then
    create policy angelcare360_academic_year_requirement_catalog_read
      on public.angelcare360_academic_year_requirement_catalog
      for select to authenticated
      using (active = true);
  end if;
end $$;

insert into public.angelcare360_academic_year_requirement_catalog
  (requirement_key,customer_label,explanation,requirement_scope,blocking,responsible_role,verification_method,source_type,version_number,active)
values
  ('identity','Informations générales','Le nom et les dates définissent le cadre officiel de l’année scolaire.','activation',true,'administration','derived','academic_year',1,true),
  ('periods','Périodes scolaires','Au moins une période doit organiser l’année scolaire.','activation',true,'administration','derived','term',1,true),
  ('calendar','Calendrier vérifié','Les périodes ne doivent pas se chevaucher ni dépasser les dates de l’année.','activation',true,'administration','derived','calendar',1,true),
  ('classes','Classes préparées','Au moins une classe doit être disponible dans cette année.','activation',true,'administration','derived','class',1,true),
  ('capacity','Capacité des classes','Chaque classe active doit avoir une capacité définie.','activation',true,'administration','derived','class',1,true),
  ('assignments','Affectations principales','Les affectations essentielles doivent être vérifiées avant le démarrage.','activation',false,'pedagogie','derived','assignment',1,true),
  ('users','Accès administratifs','Au moins un utilisateur autorisé doit pouvoir administrer l’année.','activation',true,'direction','derived','user',1,true),
  ('attendance','Présences terminées','Les feuilles de présence de la période doivent être clôturées.','period_closure',true,'administration','derived','attendance',1,true),
  ('report_cards','Bulletins publiés','Les bulletins attendus doivent être publiés avant la clôture.','period_closure',true,'pedagogie','derived','report_card',1,true),
  ('academic_validations','Validations terminées','Les résultats et corrections doivent être validés.','period_closure',true,'pedagogie','derived','academic_validation',1,true),
  ('periods_closed','Périodes clôturées','Toutes les périodes obligatoires doivent être clôturées.','year_closure',true,'direction','derived','term',1,true),
  ('transition_decisions','Destinations des enfants','Chaque enfant doit recevoir une décision explicite pour l’année suivante.','transition',true,'direction','derived','student',1,true),
  ('transition_capacity','Capacité des classes cibles','Les classes cibles doivent pouvoir accueillir les enfants proposés.','transition',true,'administration','derived','capacity',1,true),
  ('transition_failures','Passages réparés','Tout échec individuel doit être corrigé et vérifié.','transition',true,'administration','derived','rollover',1,true)
on conflict (requirement_key) do update set
  customer_label=excluded.customer_label,
  explanation=excluded.explanation,
  requirement_scope=excluded.requirement_scope,
  blocking=excluded.blocking,
  responsible_role=excluded.responsible_role,
  verification_method=excluded.verification_method,
  source_type=excluded.source_type,
  version_number=excluded.version_number,
  active=excluded.active,
  updated_at=now();

insert into public.angelcare360_governance_operation_catalog
  (operation_key,label,permission_key,approval_required,active,metadata_json)
values
  ('academic_year.create','Créer une année scolaire','annees_scolaires.create',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.update','Mettre à jour l’année scolaire','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.prepare','Vérifier la préparation','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.request_activation','Demander la validation de la mise en service','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.activate','Rendre l’année scolaire active','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.begin_closure','Préparer la clôture de l’année','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.request_closure','Demander la validation de la clôture','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.request_reopen','Demander la réouverture de l’année','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.close','Clôturer l’année scolaire','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.reopen','Réouvrir l’année scolaire','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_year.archive','Archiver l’année scolaire','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.create','Ajouter une période','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.update','Corriger une période','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.reorder','Réorganiser les périodes','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.verify_calendar','Vérifier le calendrier','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.activate','Rendre une période active','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.begin_closure','Préparer la clôture de la période','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.request_closure','Demander la clôture de la période','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.close','Clôturer la période','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.reopen','Réouvrir la période','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.request_reopen','Demander la réouverture de la période','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_period.replace','Remplacer une période','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.prepare_target','Préparer l’année suivante','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.copy_structure','Reprendre la structure utile','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.generate_proposals','Préparer les propositions de passage','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.update_decision','Modifier la destination d’un enfant','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.bulk_approve','Valider les propositions sans conflit','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.request_approval','Demander la validation du passage','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.execute','Effectuer le passage à l’année suivante','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.retry_item','Réessayer un passage corrigé','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.verify','Vérifier le passage','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_transition.complete','Terminer le passage','annees_scolaires.update',true,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_exception.assign','Attribuer un élément à vérifier','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_exception.resolve','Marquer un élément comme réglé','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_exception.reopen','Réouvrir un élément à vérifier','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_task.assign','Attribuer une tâche','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_task.start','Commencer une tâche','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_task.complete','Terminer une tâche','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_task.reopen','Réouvrir une tâche','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_note.add','Ajouter une note interne','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true)),
  ('academic_evidence.request','Demander un justificatif','annees_scolaires.update',false,true,jsonb_build_object('area','academic_structure','customer_language',true))
on conflict (operation_key) do update set
  label=excluded.label,
  permission_key=excluded.permission_key,
  approval_required=excluded.approval_required,
  active=excluded.active,
  metadata_json=public.angelcare360_governance_operation_catalog.metadata_json || excluded.metadata_json,
  updated_at=now();

create index if not exists ac360_academic_prep_year_idx on public.angelcare360_academic_year_preparation_runs(school_id,academic_year_id,requested_at desc);
create index if not exists ac360_academic_reviews_state_idx on public.angelcare360_academic_structure_reviews(school_id,review_type,state,created_at desc);
create index if not exists ac360_academic_period_closure_idx on public.angelcare360_academic_period_closure_runs(school_id,period_id,created_at desc);
create index if not exists ac360_academic_year_closure_idx on public.angelcare360_academic_year_closure_runs(school_id,academic_year_id,created_at desc);
create index if not exists ac360_academic_tasks_active_idx on public.angelcare360_academic_structure_tasks(school_id,academic_year_id,state,due_at);
create index if not exists ac360_academic_notes_timeline_idx on public.angelcare360_academic_structure_notes(school_id,academic_year_id,created_at desc);
create index if not exists ac360_academic_receipts_key_idx on public.angelcare360_academic_structure_action_receipts(school_id,idempotency_key);

alter table public.angelcare360_academic_year_preparation_runs enable row level security;
alter table public.angelcare360_academic_structure_reviews enable row level security;
alter table public.angelcare360_academic_period_closure_runs enable row level security;
alter table public.angelcare360_academic_year_closure_runs enable row level security;
alter table public.angelcare360_academic_structure_tasks enable row level security;
alter table public.angelcare360_academic_structure_notes enable row level security;
alter table public.angelcare360_academic_structure_action_receipts enable row level security;

revoke all on table public.angelcare360_academic_year_preparation_runs from anon,authenticated;
revoke all on table public.angelcare360_academic_structure_reviews from anon,authenticated;
revoke all on table public.angelcare360_academic_period_closure_runs from anon,authenticated;
revoke all on table public.angelcare360_academic_year_closure_runs from anon,authenticated;
revoke all on table public.angelcare360_academic_structure_tasks from anon,authenticated;
revoke all on table public.angelcare360_academic_structure_notes from anon,authenticated;
revoke all on table public.angelcare360_academic_structure_action_receipts from anon,authenticated;

grant select,insert,update,delete on table public.angelcare360_academic_year_preparation_runs to service_role;
grant select,insert,update,delete on table public.angelcare360_academic_structure_reviews to service_role;
grant select,insert,update,delete on table public.angelcare360_academic_period_closure_runs to service_role;
grant select,insert,update,delete on table public.angelcare360_academic_year_closure_runs to service_role;
grant select,insert,update,delete on table public.angelcare360_academic_structure_tasks to service_role;
grant select,insert,update,delete on table public.angelcare360_academic_structure_notes to service_role;
grant select,insert,update,delete on table public.angelcare360_academic_structure_action_receipts to service_role;
grant select on table public.angelcare360_academic_year_requirement_catalog to authenticated,service_role;

commit;
