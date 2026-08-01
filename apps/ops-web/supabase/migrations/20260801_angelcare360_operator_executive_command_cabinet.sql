begin;

create extension if not exists pgcrypto;

do $angelcare_executive_preflight$
declare
  missing_relations text[];
begin
  select array_agg(required_relation)
  into missing_relations
  from (values
    ('public.app_users'),
    ('public.angelcare360_operator_clients'),
    ('public.angelcare360_operator_tenants')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if missing_relations is not null then
    raise exception 'Executive Command prerequisites missing: %', array_to_string(missing_relations, ', ');
  end if;
end
$angelcare_executive_preflight$;

create table if not exists public.angelcare360_operator_executive_priorities (
  id uuid primary key default gen_random_uuid(),
  priority_code text not null unique default ('EX-P-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  summary text not null default '',
  status text not null default 'active' check (status in ('draft','active','attention','blocked','critical','completed','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  authority_level text not null default 'Direction Générale',
  owner_name text not null default 'À assigner',
  sponsor_name text,
  due_at timestamptz,
  impact text not null default '',
  evidence_state text not null default 'partial' check (evidence_state in ('missing','partial','complete','verified')),
  source_type text,
  source_id text,
  next_action text,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_code text not null unique default ('EX-D-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  statement text not null,
  decision_type text not null default 'executive',
  status text not null default 'proposed' check (status in ('draft','proposed','under_review','evidence_required','scenario_review','approved','rejected','deferred','mandated','executing','verified','archived')),
  authority_level text not null default 'Direction Générale',
  owner_name text not null default 'À assigner',
  sponsor_name text,
  due_at timestamptz,
  financial_impact_mad numeric(16,2) not null default 0,
  customer_impact text not null default 'À évaluer',
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high','critical')),
  evidence_state text not null default 'partial' check (evidence_state in ('missing','partial','complete','verified')),
  conditions jsonb not null default '[]'::jsonb,
  rationale text,
  outcome text,
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_agenda_streams (
  id uuid primary key default gen_random_uuid(),
  stream_code text not null unique default ('EX-A-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  strategic_pillar text not null,
  horizon text not null default 'Quarter',
  status text not null default 'planned' check (status in ('draft','planned','active','attention','blocked','completed','paused','archived')),
  executive_sponsor text not null default 'Direction Générale',
  owner_name text not null default 'À assigner',
  objective text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  confidence integer not null default 50 check (confidence between 0 and 100),
  due_at timestamptz,
  dependencies jsonb not null default '[]'::jsonb,
  pressure text not null default 'normal',
  expected_outcome text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_objectives (
  id uuid primary key default gen_random_uuid(),
  objective_code text not null unique default ('EX-O-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  domain text not null default 'Company',
  status text not null default 'active' check (status in ('draft','active','attention','blocked','achieved','missed','paused','archived')),
  owner_name text not null default 'À assigner',
  target_value numeric(18,4) not null default 100,
  actual_value numeric(18,4) not null default 0,
  unit text not null default '%',
  confidence integer not null default 50 check (confidence between 0 and 100),
  trend text not null default 'stable' check (trend in ('up','down','stable')),
  due_at timestamptz,
  evidence_state text not null default 'partial' check (evidence_state in ('missing','partial','complete','verified')),
  corrective_action text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_initiatives (
  id uuid primary key default gen_random_uuid(),
  initiative_code text not null unique default ('EX-I-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  program_type text not null default 'transformation',
  status text not null default 'planned' check (status in ('draft','planned','active','attention','blocked','paused','completed','archived')),
  sponsor_name text not null default 'Direction Générale',
  owner_name text not null default 'À assigner',
  progress integer not null default 0 check (progress between 0 and 100),
  confidence integer not null default 50 check (confidence between 0 and 100),
  expected_value text not null default '',
  current_milestone text not null default 'Initialisation',
  next_milestone text,
  due_at timestamptz,
  dependencies jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_risks (
  id uuid primary key default gen_random_uuid(),
  risk_code text not null unique default ('EX-R-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  domain text not null default 'Strategic',
  status text not null default 'watch' check (status in ('draft','watch','active','mitigating','crisis','contained','closed','archived')),
  likelihood integer not null default 3 check (likelihood between 1 and 5),
  impact integer not null default 3 check (impact between 1 and 5),
  exposure integer not null default 36 check (exposure between 0 and 100),
  owner_name text not null default 'À assigner',
  sponsor_name text,
  early_signals jsonb not null default '[]'::jsonb,
  plan_a text not null default '',
  plan_b text,
  plan_c text,
  escalation_threshold text not null default '',
  current_response text,
  next_review_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_board_sessions (
  id uuid primary key default gen_random_uuid(),
  session_code text not null unique default ('EX-B-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  session_type text not null default 'executive_review',
  status text not null default 'planned' check (status in ('draft','planned','preparing','ready','in_session','completed','cancelled','archived')),
  scheduled_at timestamptz,
  chair_name text not null default 'Managing Director',
  secretary_name text,
  agenda_count integer not null default 0,
  resolution_count integer not null default 0,
  open_commitments integer not null default 0,
  evidence_state text not null default 'partial' check (evidence_state in ('missing','partial','complete','verified')),
  agenda jsonb not null default '[]'::jsonb,
  participants jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_papers (
  id uuid primary key default gen_random_uuid(),
  paper_code text not null unique default ('EX-PAP-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  paper_type text not null default 'executive_brief',
  status text not null default 'draft' check (status in ('draft','review','approved','published','superseded','archived')),
  audience text not null default 'Executive Committee',
  owner_name text not null default 'À assigner',
  approval_state text not null default 'draft',
  due_at timestamptz,
  version_number integer not null default 1,
  confidentiality text not null default 'restricted' check (confidentiality in ('internal','restricted','board_only','confidential')),
  content jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_mandates (
  id uuid primary key default gen_random_uuid(),
  mandate_code text not null unique default ('EX-M-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  title text not null,
  status text not null default 'mandated' check (status in ('draft','mandated','executing','attention','blocked','completed','verified','archived')),
  owner_name text not null default 'À assigner',
  sponsor_name text,
  due_at timestamptz,
  progress integer not null default 0 check (progress between 0 and 100),
  expected_outcome text not null default '',
  outcome_state text,
  source_type text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.angelcare360_operator_executive_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  actor_user_id uuid references public.app_users(id) on delete set null,
  summary text not null,
  previous_state jsonb,
  next_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.angelcare360_operator_executive_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger angelcare360_operator_executive_priorities_touch before update on public.angelcare360_operator_executive_priorities for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_decisions_touch before update on public.angelcare360_operator_executive_decisions for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_agenda_touch before update on public.angelcare360_operator_executive_agenda_streams for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_objectives_touch before update on public.angelcare360_operator_executive_objectives for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_initiatives_touch before update on public.angelcare360_operator_executive_initiatives for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_risks_touch before update on public.angelcare360_operator_executive_risks for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_board_touch before update on public.angelcare360_operator_executive_board_sessions for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_papers_touch before update on public.angelcare360_operator_executive_papers for each row execute function public.angelcare360_operator_executive_touch_updated_at();
create or replace trigger angelcare360_operator_executive_mandates_touch before update on public.angelcare360_operator_executive_mandates for each row execute function public.angelcare360_operator_executive_touch_updated_at();

create index if not exists angelcare360_operator_executive_priorities_status_idx on public.angelcare360_operator_executive_priorities(status, priority, due_at);
create index if not exists angelcare360_operator_executive_decisions_status_idx on public.angelcare360_operator_executive_decisions(status, authority_level, due_at);
create index if not exists angelcare360_operator_executive_agenda_status_idx on public.angelcare360_operator_executive_agenda_streams(status, strategic_pillar, due_at);
create index if not exists angelcare360_operator_executive_objectives_status_idx on public.angelcare360_operator_executive_objectives(status, domain, due_at);
create index if not exists angelcare360_operator_executive_initiatives_status_idx on public.angelcare360_operator_executive_initiatives(status, program_type, due_at);
create index if not exists angelcare360_operator_executive_risks_status_idx on public.angelcare360_operator_executive_risks(status, exposure desc, next_review_at);
create index if not exists angelcare360_operator_executive_board_status_idx on public.angelcare360_operator_executive_board_sessions(status, scheduled_at);
create index if not exists angelcare360_operator_executive_papers_status_idx on public.angelcare360_operator_executive_papers(status, paper_type, due_at);
create index if not exists angelcare360_operator_executive_mandates_status_idx on public.angelcare360_operator_executive_mandates(status, due_at);
create index if not exists angelcare360_operator_executive_events_entity_idx on public.angelcare360_operator_executive_events(entity_type, entity_id, created_at desc);

alter table public.angelcare360_operator_executive_priorities enable row level security;
alter table public.angelcare360_operator_executive_decisions enable row level security;
alter table public.angelcare360_operator_executive_agenda_streams enable row level security;
alter table public.angelcare360_operator_executive_objectives enable row level security;
alter table public.angelcare360_operator_executive_initiatives enable row level security;
alter table public.angelcare360_operator_executive_risks enable row level security;
alter table public.angelcare360_operator_executive_board_sessions enable row level security;
alter table public.angelcare360_operator_executive_papers enable row level security;
alter table public.angelcare360_operator_executive_mandates enable row level security;
alter table public.angelcare360_operator_executive_events enable row level security;

revoke all on table public.angelcare360_operator_executive_priorities from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_decisions from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_agenda_streams from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_objectives from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_initiatives from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_risks from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_board_sessions from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_papers from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_mandates from public, anon, authenticated;
revoke all on table public.angelcare360_operator_executive_events from public, anon, authenticated;

grant all on table public.angelcare360_operator_executive_priorities to service_role;
grant all on table public.angelcare360_operator_executive_decisions to service_role;
grant all on table public.angelcare360_operator_executive_agenda_streams to service_role;
grant all on table public.angelcare360_operator_executive_objectives to service_role;
grant all on table public.angelcare360_operator_executive_initiatives to service_role;
grant all on table public.angelcare360_operator_executive_risks to service_role;
grant all on table public.angelcare360_operator_executive_board_sessions to service_role;
grant all on table public.angelcare360_operator_executive_papers to service_role;
grant all on table public.angelcare360_operator_executive_mandates to service_role;
grant all on table public.angelcare360_operator_executive_events to service_role;

commit;
