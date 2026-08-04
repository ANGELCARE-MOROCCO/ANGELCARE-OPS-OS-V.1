begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_direction_operation_catalog (
  operation_key text primary key,
  label text not null,
  description text not null,
  authority_class text not null check (authority_class in ('view','intervene','decide','admin')),
  idempotent boolean not null default true,
  active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_direction_matters (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  fingerprint text not null,
  title text not null,
  summary text not null,
  domain_key text not null,
  source_entity_type text not null,
  source_entity_id text not null,
  source_label text,
  exact_href text not null,
  state text not null default 'new' check (state in (
    'new','acknowledged','owned','in_progress','waiting_evidence','decision_required',
    'approved_execution','executing','resolved','released','snoozed','reopened','rejected','cancelled'
  )),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low','information')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  detected_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  checked_at timestamptz,
  checked_by uuid,
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
  financial_impact_minor bigint,
  people_count integer,
  family_count integer,
  impact_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, fingerprint)
);

create table if not exists public.angelcare360_direction_matter_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  matter_id uuid not null references public.angelcare360_direction_matters(id) on delete cascade,
  event_type text not null,
  label text not null,
  detail text,
  actor_user_id uuid,
  actor_label text,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  tone text not null default 'neutral' check (tone in ('critical','warning','active','verified','decision','neutral')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (school_id, idempotency_key)
);

create table if not exists public.angelcare360_direction_decisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  decision_code text not null,
  matter_id uuid references public.angelcare360_direction_matters(id) on delete set null,
  title text not null,
  question text not null,
  domain_key text not null,
  state text not null default 'draft' check (state in (
    'draft','submitted','evidence_required','approved','conditionally_approved','rejected','executing','executed','cancelled'
  )),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low','information')),
  owner_user_id uuid,
  owner_label text,
  due_at timestamptz,
  options_json jsonb not null default '[]'::jsonb,
  recommended_option_key text,
  selected_option_key text,
  conditions_json jsonb not null default '[]'::jsonb,
  evidence_ids jsonb not null default '[]'::jsonb,
  impact_json jsonb not null default '{}'::jsonb,
  financial_impact_minor bigint,
  people_count integer,
  family_count integer,
  decision_reason text,
  decided_by uuid,
  decided_at timestamptz,
  executed_by uuid,
  executed_at timestamptz,
  idempotency_key text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, decision_code),
  unique (school_id, idempotency_key)
);

create table if not exists public.angelcare360_direction_commitments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  commitment_code text not null,
  matter_id uuid references public.angelcare360_direction_matters(id) on delete set null,
  decision_id uuid references public.angelcare360_direction_decisions(id) on delete set null,
  title text not null,
  domain_key text not null,
  state text not null default 'open' check (state in ('open','acknowledged','in_progress','blocked','completed','cancelled')),
  owner_user_id uuid,
  owner_label text,
  collaborators_json jsonb not null default '[]'::jsonb,
  due_at timestamptz,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  blocker text,
  next_checkpoint text,
  evidence_required_json jsonb not null default '[]'::jsonb,
  exact_href text,
  completion_reason text,
  completed_by uuid,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, commitment_code)
);

create table if not exists public.angelcare360_direction_briefing_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  site_id uuid,
  briefing_type text not null check (briefing_type in ('morning','end_of_day','weekly','site','financial_risk','people_workforce')),
  title text not null,
  posture text not null,
  briefing_json jsonb not null default '{}'::jsonb,
  source_signature text not null,
  idempotency_key text not null,
  status text not null default 'generated' check (status in ('requested','generating','generated','failed','archived')),
  requested_by uuid,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, idempotency_key)
);

create table if not exists public.angelcare360_direction_saved_views (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  user_id uuid not null,
  view_code text not null,
  label text not null,
  plane_key text not null,
  filters_json jsonb not null default '{}'::jsonb,
  layout_json jsonb not null default '{}'::jsonb,
  density text not null default 'comfortable' check (density in ('compact','comfortable','expanded')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id, view_code)
);

insert into public.angelcare360_direction_operation_catalog(operation_key,label,description,authority_class,idempotent)
values
('direction.matter.acknowledge','Accuser réception','Enregistre qui a vu et reconnu une matière exécutive.','intervene',true),
('direction.matter.take_ownership','Prendre en charge','Affecte la matière à l’utilisateur courant.','intervene',true),
('direction.matter.assign','Assigner','Affecte une matière à un responsable autorisé.','decide',true),
('direction.matter.mark_checked','Marquer vérifié','Enregistre la vérification explicite de la matière.','intervene',true),
('direction.matter.request_evidence','Demander une preuve','Suspend la résolution jusqu’à réception des éléments requis.','intervene',true),
('direction.matter.add_note','Ajouter une note','Ajoute une note immuable au matter.','intervene',true),
('direction.matter.snooze','Reporter','Reporte avec date et raison sans masquer l’historique.','intervene',true),
('direction.matter.escalate','Escalader','Place la matière devant le Conseil de décision.','decide',true),
('direction.matter.resolve','Résoudre','Clôt la matière avec raison et audit.','decide',true),
('direction.matter.release','Libérer de Direction','Retire la matière du périmètre exécutif sans supprimer sa source.','decide',true),
('direction.matter.reopen','Réouvrir','Restaure une matière précédemment résolue ou libérée.','decide',true),
('direction.decision.create','Créer une décision','Crée une décision structurée avec options et conséquences.','decide',true),
('direction.decision.submit','Soumettre une décision','Soumet une décision au Conseil.','decide',true),
('direction.decision.request_evidence','Demander une preuve décision','Demande des preuves avant arbitrage.','decide',true),
('direction.decision.approve','Approuver une décision','Autorise l’option sélectionnée.','decide',true),
('direction.decision.conditional_approval','Approuver sous conditions','Autorise sous conditions explicites.','decide',true),
('direction.decision.reject','Rejeter une décision','Rejette avec raison et préserve la proposition.','decide',true),
('direction.decision.execute','Exécuter une décision','Marque la conséquence comme exécutée.','decide',true),
('direction.commitment.create','Créer un engagement','Crée une obligation suivie issue d’une décision.','decide',true),
('direction.commitment.update','Mettre à jour un engagement','Met à jour progression, blocker et checkpoint.','intervene',true),
('direction.briefing.generate','Générer un briefing','Produit un brief déterministe depuis l’état autoritatif.','view',true),
('direction.saved_view.upsert','Enregistrer une vue','Persiste filtres, densité et layout par utilisateur.','intervene',true)
on conflict(operation_key) do update set
  label=excluded.label,
  description=excluded.description,
  authority_class=excluded.authority_class,
  idempotent=excluded.idempotent,
  active=true,
  updated_at=now();

create index if not exists ac360_direction_matters_school_state_idx
  on public.angelcare360_direction_matters(school_id,state,severity,updated_at desc);
create index if not exists ac360_direction_matters_school_domain_idx
  on public.angelcare360_direction_matters(school_id,domain_key,due_at);
create index if not exists ac360_direction_matters_source_idx
  on public.angelcare360_direction_matters(school_id,source_entity_type,source_entity_id);
create index if not exists ac360_direction_events_matter_idx
  on public.angelcare360_direction_matter_events(school_id,matter_id,created_at desc);
create index if not exists ac360_direction_decisions_state_idx
  on public.angelcare360_direction_decisions(school_id,state,due_at);
create index if not exists ac360_direction_commitments_state_idx
  on public.angelcare360_direction_commitments(school_id,state,due_at);
create index if not exists ac360_direction_briefings_type_idx
  on public.angelcare360_direction_briefing_runs(school_id,briefing_type,generated_at desc);
create index if not exists ac360_direction_saved_views_user_idx
  on public.angelcare360_direction_saved_views(school_id,user_id,is_default desc);

alter table public.angelcare360_direction_operation_catalog enable row level security;
alter table public.angelcare360_direction_matters enable row level security;
alter table public.angelcare360_direction_matter_events enable row level security;
alter table public.angelcare360_direction_decisions enable row level security;
alter table public.angelcare360_direction_commitments enable row level security;
alter table public.angelcare360_direction_briefing_runs enable row level security;
alter table public.angelcare360_direction_saved_views enable row level security;

revoke all on table public.angelcare360_direction_operation_catalog from anon, authenticated;
revoke all on table public.angelcare360_direction_matters from anon, authenticated;
revoke all on table public.angelcare360_direction_matter_events from anon, authenticated;
revoke all on table public.angelcare360_direction_decisions from anon, authenticated;
revoke all on table public.angelcare360_direction_commitments from anon, authenticated;
revoke all on table public.angelcare360_direction_briefing_runs from anon, authenticated;
revoke all on table public.angelcare360_direction_saved_views from anon, authenticated;

grant select,insert,update,delete on table public.angelcare360_direction_operation_catalog to service_role;
grant select,insert,update,delete on table public.angelcare360_direction_matters to service_role;
grant select,insert,update,delete on table public.angelcare360_direction_matter_events to service_role;
grant select,insert,update,delete on table public.angelcare360_direction_decisions to service_role;
grant select,insert,update,delete on table public.angelcare360_direction_commitments to service_role;
grant select,insert,update,delete on table public.angelcare360_direction_briefing_runs to service_role;
grant select,insert,update,delete on table public.angelcare360_direction_saved_views to service_role;

commit;
