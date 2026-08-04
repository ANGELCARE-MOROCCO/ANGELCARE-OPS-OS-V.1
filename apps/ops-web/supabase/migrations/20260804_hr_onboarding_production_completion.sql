begin;

create extension if not exists pgcrypto;

create or replace function public.hr_onboarding_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.hr_onboarding_journeys (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  status text not null default 'required',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_activity (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  type text not null default 'note',
  created_at timestamptz not null default now()
);

create table if not exists public.hr_onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hr_onboarding_journeys
  add column if not exists journey_key text,
  add column if not exists tenant_key text,
  add column if not exists organization_key text,
  add column if not exists candidate_key text,
  add column if not exists staff_key text,
  add column if not exists candidate_id uuid,
  add column if not exists staff_id uuid,
  add column if not exists position text,
  add column if not exists department text,
  add column if not exists phase text not null default 'offer_accepted',
  add column if not exists stage text,
  add column if not exists start_date date,
  add column if not exists manager text,
  add column if not exists manager_key text,
  add column if not exists location text,
  add column if not exists employment_type text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists owner text,
  add column if not exists owner_key text,
  add column if not exists priority text not null default 'normal',
  add column if not exists risk_level text not null default 'normal',
  add column if not exists risk_notes text,
  add column if not exists progress integer not null default 0,
  add column if not exists completion_rate numeric not null default 0,
  add column if not exists checklist_assignment_key text,
  add column if not exists version bigint not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists paused_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.hr_onboarding_tasks
  add column if not exists task_key text,
  add column if not exists journey_key text,
  add column if not exists tenant_key text,
  add column if not exists organization_key text,
  add column if not exists group_name text not null default 'Général',
  add column if not exists category text,
  add column if not exists phase text not null default 'preboarding',
  add column if not exists stage text,
  add column if not exists owner text,
  add column if not exists owner_key text,
  add column if not exists priority text not null default 'normal',
  add column if not exists due_at_ts timestamptz,
  add column if not exists due_date date,
  add column if not exists completed_at timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocker_reason text,
  add column if not exists evidence_url text,
  add column if not exists notes text,
  add column if not exists required boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version bigint not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists idempotency_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.hr_onboarding_documents
  add column if not exists document_key text,
  add column if not exists journey_key text,
  add column if not exists tenant_key text,
  add column if not exists organization_key text,
  add column if not exists category text not null default 'Général',
  add column if not exists document_type text,
  add column if not exists owner text,
  add column if not exists owner_key text,
  add column if not exists required boolean not null default true,
  add column if not exists due_date date,
  add column if not exists file_url text,
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists verified_by text,
  add column if not exists verified_at timestamptz,
  add column if not exists rejected_reason text,
  add column if not exists expires_at timestamptz,
  add column if not exists waived_at timestamptz,
  add column if not exists notes text,
  add column if not exists version bigint not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists idempotency_key text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

alter table public.hr_onboarding_activity
  add column if not exists activity_key text,
  add column if not exists journey_key text,
  add column if not exists tenant_key text,
  add column if not exists organization_key text,
  add column if not exists status text not null default 'recorded',
  add column if not exists body text,
  add column if not exists notes text,
  add column if not exists actor_key text,
  add column if not exists actor_name text,
  add column if not exists immutable boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

alter table public.hr_onboarding_checklists
  add column if not exists checklist_key text,
  add column if not exists family_key text,
  add column if not exists tenant_key text,
  add column if not exists organization_key text,
  add column if not exists role_key text,
  add column if not exists department_key text,
  add column if not exists lifecycle_status text not null default 'draft',
  add column if not exists version integer not null default 1,
  add column if not exists is_published boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists notes text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.hr_onboarding_checklist_assignments (
  id uuid primary key default gen_random_uuid(),
  assignment_key text not null unique default gen_random_uuid()::text,
  journey_key text not null,
  checklist_key text not null,
  checklist_version integer not null,
  checklist_name text not null,
  items_snapshot jsonb not null default '[]'::jsonb,
  tenant_key text,
  organization_key text,
  status text not null default 'active',
  assigned_by text,
  assigned_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hr_onboarding_idempotency (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  operation text not null,
  tenant_key text,
  organization_key text,
  status text not null default 'processing',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

update public.hr_onboarding_journeys
set journey_key = coalesce(nullif(journey_key, ''), id::text),
    phase = case
      when phase in ('offer_accepted','preboarding','documents','orientation','training_setup','integration','probation','completed') then phase
      when lower(coalesce(stage, status, '')) like '%document%' then 'documents'
      when lower(coalesce(stage, status, '')) like '%orientation%' then 'orientation'
      when lower(coalesce(stage, status, '')) like '%training%' then 'training_setup'
      when lower(coalesce(stage, status, '')) like '%integration%' then 'integration'
      when lower(coalesce(stage, status, '')) like '%probation%' then 'probation'
      when lower(coalesce(stage, status, '')) like '%complete%' then 'completed'
      else 'preboarding'
    end,
    status = case
      when lower(coalesce(status, '')) like '%archive%' then 'archived'
      when lower(coalesce(status, '')) like '%cancel%' then 'cancelled'
      when lower(coalesce(status, '')) like '%pause%' then 'paused'
      when lower(coalesce(status, '')) like '%complete%' then 'completed'
      when lower(coalesce(status, '')) = 'draft' then 'draft'
      else 'active'
    end,
    progress = greatest(0, least(100, coalesce(progress, completion_rate::integer, 0))),
    version = greatest(1, coalesce(version, 1));

update public.hr_onboarding_tasks
set task_key = coalesce(nullif(task_key, ''), id::text),
    journey_key = coalesce(nullif(journey_key, ''), nullif(to_jsonb(hr_onboarding_tasks)->>'journey_id', ''), nullif(to_jsonb(hr_onboarding_tasks)->>'onboarding_id', '')),
    group_name = coalesce(nullif(group_name, ''), nullif(to_jsonb(hr_onboarding_tasks)->>'group_name', ''), nullif(to_jsonb(hr_onboarding_tasks)->>'group', ''), nullif(category, ''), 'Général'),
    phase = case when phase in ('offer_accepted','preboarding','documents','orientation','training_setup','integration','probation','completed') then phase else coalesce(nullif(stage, ''), 'preboarding') end,
    status = case
      when lower(coalesce(status, '')) like '%complete%' then 'completed'
      when lower(coalesce(status, '')) like '%progress%' then 'in_progress'
      when lower(coalesce(status, '')) like '%block%' then 'blocked'
      when lower(coalesce(status, '')) like '%waiv%' then 'waived'
      when lower(coalesce(status, '')) like '%archive%' then 'archived'
      else 'pending'
    end,
    version = greatest(1, coalesce(version, 1));

update public.hr_onboarding_documents
set document_key = coalesce(nullif(document_key, ''), id::text),
    journey_key = coalesce(nullif(journey_key, ''), nullif(to_jsonb(hr_onboarding_documents)->>'journey_id', ''), nullif(to_jsonb(hr_onboarding_documents)->>'onboarding_id', '')),
    category = coalesce(nullif(category, ''), nullif(document_type, ''), 'Général'),
    status = case
      when lower(coalesce(status, '')) in ('validated','valid','approved') then 'validated'
      when lower(coalesce(status, '')) like '%upload%' then 'uploaded'
      when lower(coalesce(status, '')) like '%reject%' then 'rejected'
      when lower(coalesce(status, '')) like '%waiv%' then 'waived'
      when lower(coalesce(status, '')) like '%archive%' then 'archived'
      when lower(coalesce(status, '')) like '%request%' then 'requested'
      else 'required'
    end,
    version = greatest(1, coalesce(version, 1));

update public.hr_onboarding_activity
set activity_key = coalesce(nullif(activity_key, ''), id::text),
    journey_key = coalesce(nullif(journey_key, ''), nullif(to_jsonb(hr_onboarding_activity)->>'journey_id', ''), nullif(to_jsonb(hr_onboarding_activity)->>'onboarding_id', '')),
    body = coalesce(body, notes),
    status = coalesce(nullif(status, ''), 'recorded');

update public.hr_onboarding_checklists
set checklist_key = coalesce(nullif(checklist_key, ''), id::text),
    family_key = coalesce(nullif(family_key, ''), checklist_key, id::text),
    lifecycle_status = case
      when is_published then 'published'
      when lower(coalesce(lifecycle_status, status, '')) like '%archive%' then 'archived'
      when lower(coalesce(lifecycle_status, status, '')) like '%inactive%' then 'inactive'
      else 'draft'
    end,
    items = case when jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0 then items else coalesce(checklist, '[]'::jsonb) end,
    version = greatest(1, coalesce(version, 1));

create unique index if not exists hr_onboarding_journeys_journey_key_uq on public.hr_onboarding_journeys(journey_key);
create unique index if not exists hr_onboarding_tasks_task_key_uq on public.hr_onboarding_tasks(task_key);
create unique index if not exists hr_onboarding_documents_document_key_uq on public.hr_onboarding_documents(document_key);
create unique index if not exists hr_onboarding_activity_activity_key_uq on public.hr_onboarding_activity(activity_key);
create unique index if not exists hr_onboarding_checklists_checklist_key_uq on public.hr_onboarding_checklists(checklist_key);
create unique index if not exists hr_onboarding_idempotency_scope_uq on public.hr_onboarding_idempotency(idempotency_key, operation, coalesce(tenant_key, ''), coalesce(organization_key, ''));
create unique index if not exists hr_onboarding_tasks_idempotency_uq on public.hr_onboarding_tasks(journey_key, idempotency_key) where idempotency_key is not null;
create unique index if not exists hr_onboarding_documents_idempotency_uq on public.hr_onboarding_documents(journey_key, idempotency_key) where idempotency_key is not null;
create index if not exists hr_onboarding_journeys_scope_idx on public.hr_onboarding_journeys(tenant_key, organization_key, status, updated_at desc);
create index if not exists hr_onboarding_tasks_journey_idx on public.hr_onboarding_tasks(journey_key, archived_at, phase, sort_order);
create index if not exists hr_onboarding_documents_journey_idx on public.hr_onboarding_documents(journey_key, archived_at, status);
create index if not exists hr_onboarding_activity_journey_idx on public.hr_onboarding_activity(journey_key, created_at desc);
create index if not exists hr_onboarding_assignments_journey_idx on public.hr_onboarding_checklist_assignments(journey_key, status);

drop trigger if exists hr_onboarding_journeys_touch_updated_at on public.hr_onboarding_journeys;
create trigger hr_onboarding_journeys_touch_updated_at
before update on public.hr_onboarding_journeys
for each row execute function public.hr_onboarding_touch_updated_at();

drop trigger if exists hr_onboarding_tasks_touch_updated_at on public.hr_onboarding_tasks;
create trigger hr_onboarding_tasks_touch_updated_at
before update on public.hr_onboarding_tasks
for each row execute function public.hr_onboarding_touch_updated_at();

drop trigger if exists hr_onboarding_documents_touch_updated_at on public.hr_onboarding_documents;
create trigger hr_onboarding_documents_touch_updated_at
before update on public.hr_onboarding_documents
for each row execute function public.hr_onboarding_touch_updated_at();

drop trigger if exists hr_onboarding_checklists_touch_updated_at on public.hr_onboarding_checklists;
create trigger hr_onboarding_checklists_touch_updated_at
before update on public.hr_onboarding_checklists
for each row execute function public.hr_onboarding_touch_updated_at();

create or replace function public.hr_onboarding_prevent_activity_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ONBOARDING_ACTIVITY_IMMUTABLE';
end;
$$;

drop trigger if exists hr_onboarding_activity_immutable on public.hr_onboarding_activity;
create trigger hr_onboarding_activity_immutable
before update or delete on public.hr_onboarding_activity
for each row execute function public.hr_onboarding_prevent_activity_mutation();

insert into public.hr_onboarding_checklists (
  checklist_key, family_key, name, lifecycle_status, status, version, is_published, published_at, items, checklist, notes, metadata, created_by, updated_by
)
select
  'angelcare-standard-onboarding-v1',
  'angelcare-standard-onboarding',
  'Standard AngelCare — Parcours complet',
  'published',
  'active',
  1,
  true,
  now(),
  '[
    {"key":"identity","title":"Valider identité et coordonnées","groupName":"Informations personnelles","phase":"preboarding","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":1},
    {"key":"emergency","title":"Collecter le contact d’urgence","groupName":"Informations personnelles","phase":"preboarding","ownerRole":"hr","priority":"normal","required":true,"dueOffsetDays":1},
    {"key":"id-document","title":"Collecter CIN / pièce d’identité","groupName":"Documents contractuels","phase":"documents","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":2,"documentRequirement":true,"documentType":"identity"},
    {"key":"contract","title":"Préparer et signer le contrat","groupName":"Documents contractuels","phase":"documents","ownerRole":"hr","priority":"critical","required":true,"dueOffsetDays":3,"documentRequirement":true,"documentType":"employment_contract"},
    {"key":"policies","title":"Faire signer les politiques internes","groupName":"Documents contractuels","phase":"documents","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":3,"documentRequirement":true,"documentType":"company_policies"},
    {"key":"equipment","title":"Préparer les équipements IT","groupName":"Mise en place entreprise","phase":"orientation","ownerRole":"it","priority":"high","required":true,"dueOffsetDays":4},
    {"key":"access","title":"Provisionner les accès systèmes","groupName":"Mise en place entreprise","phase":"orientation","ownerRole":"it","priority":"critical","required":true,"dueOffsetDays":4},
    {"key":"email","title":"Activer email et communication","groupName":"Mise en place entreprise","phase":"orientation","ownerRole":"it","priority":"high","required":true,"dueOffsetDays":4},
    {"key":"compliance","title":"Finaliser la formation conformité","groupName":"Formation & conformité","phase":"training_setup","ownerRole":"academy","priority":"high","required":true,"dueOffsetDays":7},
    {"key":"role-training","title":"Finaliser la formation métier","groupName":"Formation & conformité","phase":"training_setup","ownerRole":"manager","priority":"high","required":true,"dueOffsetDays":10},
    {"key":"integration-review","title":"Effectuer le point d’intégration","groupName":"Intégration","phase":"integration","ownerRole":"manager","priority":"normal","required":true,"dueOffsetDays":21},
    {"key":"probation-review","title":"Clôturer la revue de période d’essai","groupName":"Période d’essai","phase":"probation","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":90}
  ]'::jsonb,
  '[
    {"key":"identity","title":"Valider identité et coordonnées","groupName":"Informations personnelles","phase":"preboarding","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":1},
    {"key":"emergency","title":"Collecter le contact d’urgence","groupName":"Informations personnelles","phase":"preboarding","ownerRole":"hr","priority":"normal","required":true,"dueOffsetDays":1},
    {"key":"id-document","title":"Collecter CIN / pièce d’identité","groupName":"Documents contractuels","phase":"documents","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":2,"documentRequirement":true,"documentType":"identity"},
    {"key":"contract","title":"Préparer et signer le contrat","groupName":"Documents contractuels","phase":"documents","ownerRole":"hr","priority":"critical","required":true,"dueOffsetDays":3,"documentRequirement":true,"documentType":"employment_contract"},
    {"key":"policies","title":"Faire signer les politiques internes","groupName":"Documents contractuels","phase":"documents","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":3,"documentRequirement":true,"documentType":"company_policies"},
    {"key":"equipment","title":"Préparer les équipements IT","groupName":"Mise en place entreprise","phase":"orientation","ownerRole":"it","priority":"high","required":true,"dueOffsetDays":4},
    {"key":"access","title":"Provisionner les accès systèmes","groupName":"Mise en place entreprise","phase":"orientation","ownerRole":"it","priority":"critical","required":true,"dueOffsetDays":4},
    {"key":"email","title":"Activer email et communication","groupName":"Mise en place entreprise","phase":"orientation","ownerRole":"it","priority":"high","required":true,"dueOffsetDays":4},
    {"key":"compliance","title":"Finaliser la formation conformité","groupName":"Formation & conformité","phase":"training_setup","ownerRole":"academy","priority":"high","required":true,"dueOffsetDays":7},
    {"key":"role-training","title":"Finaliser la formation métier","groupName":"Formation & conformité","phase":"training_setup","ownerRole":"manager","priority":"high","required":true,"dueOffsetDays":10},
    {"key":"integration-review","title":"Effectuer le point d’intégration","groupName":"Intégration","phase":"integration","ownerRole":"manager","priority":"normal","required":true,"dueOffsetDays":21},
    {"key":"probation-review","title":"Clôturer la revue de période d’essai","groupName":"Période d’essai","phase":"probation","ownerRole":"hr","priority":"high","required":true,"dueOffsetDays":90}
  ]'::jsonb,
  'Checklist de production créée par la migration Onboarding Production Completion.',
  'migration',
  'migration'
where not exists (
  select 1 from public.hr_onboarding_checklists where checklist_key = 'angelcare-standard-onboarding-v1'
);

create or replace function public.hr_onboarding_phase_rank(p_phase text)
returns integer
language sql
immutable
as $$
  select case p_phase
    when 'offer_accepted' then 1
    when 'preboarding' then 2
    when 'documents' then 3
    when 'orientation' then 4
    when 'training_setup' then 5
    when 'integration' then 6
    when 'probation' then 7
    when 'completed' then 8
    else 0
  end;
$$;

create or replace function public.hr_onboarding_phase_from_rank(p_rank integer)
returns text
language sql
immutable
as $$
  select case p_rank
    when 1 then 'offer_accepted'
    when 2 then 'preboarding'
    when 3 then 'documents'
    when 4 then 'orientation'
    when 5 then 'training_setup'
    when 6 then 'integration'
    when 7 then 'probation'
    when 8 then 'completed'
    else 'completed'
  end;
$$;

create or replace function public.hr_onboarding_recalculate_progress(p_journey_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required integer := 0;
  v_completed integer := 0;
  v_progress integer := 0;
begin
  select
    count(*) filter (where required and archived_at is null),
    count(*) filter (where required and archived_at is null and status in ('completed','waived'))
  into v_required, v_completed
  from public.hr_onboarding_tasks
  where journey_key = p_journey_key;

  select
    v_required + count(*) filter (where required and archived_at is null),
    v_completed + count(*) filter (where required and archived_at is null and status in ('validated','waived'))
  into v_required, v_completed
  from public.hr_onboarding_documents
  where journey_key = p_journey_key;

  v_progress := case when v_required = 0 then 0 else least(100, greatest(0, round((v_completed::numeric / v_required::numeric) * 100)::integer)) end;

  update public.hr_onboarding_journeys
  set progress = v_progress,
      completion_rate = v_progress,
      updated_at = now()
  where journey_key = p_journey_key;

  return v_progress;
end;
$$;

create or replace function public.hr_onboarding_gate_ready(p_journey_key text, p_phase text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rank integer := public.hr_onboarding_phase_rank(p_phase);
  v_incomplete_tasks integer;
  v_incomplete_documents integer;
begin
  select count(*) into v_incomplete_tasks
  from public.hr_onboarding_tasks
  where journey_key = p_journey_key
    and required
    and archived_at is null
    and public.hr_onboarding_phase_rank(phase) <= v_rank
    and status not in ('completed','waived');

  select count(*) into v_incomplete_documents
  from public.hr_onboarding_documents
  where journey_key = p_journey_key
    and required
    and archived_at is null
    and status not in ('validated','waived')
    and coalesce((metadata->>'phase'), p_phase) = p_phase;

  return v_incomplete_tasks = 0 and v_incomplete_documents = 0;
end;
$$;

create or replace function public.hr_onboarding_write_activity(
  p_journey_key text,
  p_type text,
  p_title text,
  p_body text,
  p_status text,
  p_actor jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := gen_random_uuid()::text;
  v_tenant text;
  v_organization text;
begin
  select tenant_key, organization_key into v_tenant, v_organization
  from public.hr_onboarding_journeys where journey_key = p_journey_key;

  insert into public.hr_onboarding_activity (
    activity_key, journey_key, tenant_key, organization_key, type, status, title, body, notes,
    actor_key, actor_name, immutable, metadata, created_at
  ) values (
    v_key, p_journey_key, v_tenant, v_organization, coalesce(nullif(p_type,''),'note'), coalesce(nullif(p_status,''),'recorded'),
    coalesce(nullif(p_title,''),'Événement onboarding'), p_body, p_body,
    nullif(p_actor->>'userId',''), nullif(p_actor->>'fullName',''), true, coalesce(p_metadata,'{}'::jsonb), now()
  );
  return v_key;
end;
$$;

create or replace function public.hr_onboarding_instantiate_checklist(
  p_journey_key text,
  p_checklist_key text,
  p_actor jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checklist record;
  v_journey record;
  v_item jsonb;
  v_assignment_key text := gen_random_uuid()::text;
  v_item_key text;
  v_task_count integer := 0;
  v_document_count integer := 0;
begin
  select * into v_journey from public.hr_onboarding_journeys where journey_key = p_journey_key for update;
  if not found then raise exception 'ONBOARDING_JOURNEY_NOT_FOUND'; end if;

  select * into v_checklist
  from public.hr_onboarding_checklists
  where checklist_key = p_checklist_key and is_published and lifecycle_status = 'published' and archived_at is null;
  if not found then raise exception 'ONBOARDING_CHECKLIST_NOT_PUBLISHED'; end if;

  update public.hr_onboarding_checklist_assignments set status = 'superseded', archived_at = now()
  where journey_key = p_journey_key and status = 'active';

  insert into public.hr_onboarding_checklist_assignments (
    assignment_key, journey_key, checklist_key, checklist_version, checklist_name, items_snapshot,
    tenant_key, organization_key, status, assigned_by, assigned_at
  ) values (
    v_assignment_key, p_journey_key, v_checklist.checklist_key, v_checklist.version, v_checklist.name, v_checklist.items,
    v_journey.tenant_key, v_journey.organization_key, 'active', nullif(p_actor->>'userId',''), now()
  );

  update public.hr_onboarding_journeys
  set checklist_assignment_key = v_assignment_key, version = version + 1, updated_by = nullif(p_actor->>'userId',''), updated_at = now()
  where journey_key = p_journey_key;

  for v_item in select value from jsonb_array_elements(v_checklist.items)
  loop
    v_item_key := coalesce(nullif(v_item->>'key',''), gen_random_uuid()::text);
    insert into public.hr_onboarding_tasks (
      task_key, journey_key, tenant_key, organization_key, title, group_name, category, phase, stage,
      status, owner, priority, due_at_ts, due_date, required, sort_order, version, idempotency_key,
      metadata, created_by, updated_by, created_at, updated_at
    ) values (
      gen_random_uuid()::text, p_journey_key, v_journey.tenant_key, v_journey.organization_key,
      coalesce(nullif(v_item->>'title',''),'Étape onboarding'),
      coalesce(nullif(v_item->>'groupName',''), nullif(v_item->>'group_name',''), 'Général'),
      coalesce(nullif(v_item->>'groupName',''), nullif(v_item->>'group_name',''), 'Général'),
      coalesce(nullif(v_item->>'phase',''),'preboarding'),
      coalesce(nullif(v_item->>'phase',''),'preboarding'),
      'pending', nullif(v_item->>'ownerRole',''), coalesce(nullif(v_item->>'priority',''),'normal'),
      case when v_journey.start_date is not null then (v_journey.start_date::timestamp + make_interval(days => coalesce((v_item->>'dueOffsetDays')::integer, 0))) at time zone 'Africa/Casablanca' else null end,
      case when v_journey.start_date is not null then v_journey.start_date + coalesce((v_item->>'dueOffsetDays')::integer, 0) else null end,
      coalesce((v_item->>'required')::boolean, true), v_task_count,
      1, 'checklist:' || v_checklist.checklist_key || ':' || v_item_key,
      jsonb_build_object('checklistKey', v_checklist.checklist_key, 'checklistVersion', v_checklist.version, 'itemKey', v_item_key),
      nullif(p_actor->>'userId',''), nullif(p_actor->>'userId',''), now(), now()
    ) on conflict (journey_key, idempotency_key) where idempotency_key is not null do nothing;
    v_task_count := v_task_count + 1;

    if coalesce((v_item->>'documentRequirement')::boolean, false) then
      insert into public.hr_onboarding_documents (
        document_key, journey_key, tenant_key, organization_key, title, category, document_type, status,
        owner, required, due_date, version, idempotency_key, metadata, created_by, updated_by, created_at, updated_at
      ) values (
        gen_random_uuid()::text, p_journey_key, v_journey.tenant_key, v_journey.organization_key,
        coalesce(nullif(v_item->>'title',''),'Document onboarding'),
        coalesce(nullif(v_item->>'groupName',''), 'Documents'),
        nullif(v_item->>'documentType',''), 'requested', nullif(v_item->>'ownerRole',''),
        coalesce((v_item->>'required')::boolean, true),
        case when v_journey.start_date is not null then v_journey.start_date + coalesce((v_item->>'dueOffsetDays')::integer, 0) else null end,
        1, 'checklist:' || v_checklist.checklist_key || ':' || v_item_key,
        jsonb_build_object('phase', coalesce(nullif(v_item->>'phase',''),'documents'), 'checklistKey', v_checklist.checklist_key, 'itemKey', v_item_key),
        nullif(p_actor->>'userId',''), nullif(p_actor->>'userId',''), now(), now()
      ) on conflict (journey_key, idempotency_key) where idempotency_key is not null do nothing;
      v_document_count := v_document_count + 1;
    end if;
  end loop;

  perform public.hr_onboarding_write_activity(
    p_journey_key, 'checklist_assigned', 'Checklist affectée',
    v_checklist.name || ' · v' || v_checklist.version,
    'recorded', p_actor,
    jsonb_build_object('checklistKey', v_checklist.checklist_key, 'assignmentKey', v_assignment_key, 'taskCount', v_task_count, 'documentCount', v_document_count)
  );
  perform public.hr_onboarding_recalculate_progress(p_journey_key);

  return jsonb_build_object('ok', true, 'assignmentKey', v_assignment_key, 'taskCount', v_task_count, 'documentCount', v_document_count);
end;
$$;

create or replace function public.hr_onboarding_execute(
  p_operation text,
  p_payload jsonb,
  p_actor jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_actor_key text := nullif(p_actor->>'userId','');
  v_actor_name text := coalesce(nullif(p_actor->>'fullName',''),'Opérateur RH');
  v_tenant text := nullif(p_actor->>'tenantKey','');
  v_organization text := nullif(p_actor->>'organizationKey','');
  v_sovereign boolean := coalesce((p_actor->>'sovereign')::boolean, false);
  v_journey_key text := nullif(p_payload->>'journeyKey','');
  v_task_key text := nullif(p_payload->>'taskKey','');
  v_document_key text := nullif(p_payload->>'documentKey','');
  v_checklist_key text := nullif(p_payload->>'checklistKey','');
  v_idempotency text := nullif(p_payload->>'idempotencyKey','');
  v_version bigint;
  v_current record;
  v_result jsonb;
  v_next_phase text;
  v_current_rank integer;
  v_key text;
  v_items jsonb;
  v_progress integer;
  v_existing_result jsonb;
  v_bundle jsonb := '{}'::jsonb;
begin
  if p_operation is null or btrim(p_operation) = '' then raise exception 'ONBOARDING_OPERATION_REQUIRED'; end if;
  if v_actor_key is null then raise exception 'ONBOARDING_ACTOR_REQUIRED'; end if;

  if v_idempotency is not null then
    perform pg_advisory_xact_lock(hashtext(coalesce(v_tenant,'') || '|' || coalesce(v_organization,'') || '|' || p_operation || '|' || v_idempotency));
    select result into v_existing_result
    from public.hr_onboarding_idempotency
    where idempotency_key = v_idempotency and operation = p_operation
      and coalesce(tenant_key,'') = coalesce(v_tenant,'')
      and coalesce(organization_key,'') = coalesce(v_organization,'')
      and status = 'completed';
    if found then return v_existing_result; end if;

    insert into public.hr_onboarding_idempotency(idempotency_key, operation, tenant_key, organization_key, status)
    values (v_idempotency, p_operation, v_tenant, v_organization, 'processing')
    on conflict do nothing;
  end if;

  if p_operation = 'journey.create' then
    perform pg_advisory_xact_lock(hashtext(coalesce(v_tenant,'') || '|' || coalesce(v_organization,'') || '|journey|' || coalesce(nullif(p_payload->>'staffKey',''), nullif(p_payload->>'candidateKey',''), lower(coalesce(nullif(p_payload->>'email',''), p_payload->>'title', gen_random_uuid()::text)))));
    if exists (
      select 1 from public.hr_onboarding_journeys
      where archived_at is null and status not in ('archived','cancelled')
        and (v_sovereign or ((v_tenant is null or tenant_key = v_tenant) and (v_organization is null or organization_key = v_organization)))
        and ((nullif(p_payload->>'candidateKey','') is not null and candidate_key = nullif(p_payload->>'candidateKey',''))
          or (nullif(p_payload->>'staffKey','') is not null and staff_key = nullif(p_payload->>'staffKey','')))
    ) then
      raise exception 'ONBOARDING_ACTIVE_JOURNEY_ALREADY_EXISTS';
    end if;

    v_journey_key := gen_random_uuid()::text;
    insert into public.hr_onboarding_journeys (
      journey_key, tenant_key, organization_key, candidate_key, staff_key, title, position, department,
      status, phase, stage, start_date, manager, manager_key, location, employment_type, email, phone,
      owner, owner_key, priority, risk_level, risk_notes, progress, completion_rate, version, metadata,
      created_by, updated_by, created_at, updated_at
    ) values (
      v_journey_key, v_tenant, v_organization, nullif(p_payload->>'candidateKey',''), nullif(p_payload->>'staffKey',''),
      coalesce(nullif(p_payload->>'title',''),'Parcours onboarding'), nullif(p_payload->>'position',''), nullif(p_payload->>'department',''),
      'active', 'offer_accepted', 'offer_accepted', nullif(p_payload->>'startDate','')::date,
      nullif(p_payload->>'manager',''), nullif(p_payload->>'managerKey',''), nullif(p_payload->>'location',''), nullif(p_payload->>'employmentType',''),
      nullif(p_payload->>'email',''), nullif(p_payload->>'phone',''), nullif(p_payload->>'owner',''), nullif(p_payload->>'ownerKey',''),
      coalesce(nullif(p_payload->>'priority',''),'normal'), coalesce(nullif(p_payload->>'riskLevel',''),'normal'), nullif(p_payload->>'riskNotes',''),
      0, 0, 1, jsonb_build_object('creationNotes', nullif(p_payload->>'notes',''), 'idempotencyKey', v_idempotency),
      v_actor_key, v_actor_key, v_now, v_now
    );

    if v_checklist_key is null then
      select checklist_key into v_checklist_key
      from public.hr_onboarding_checklists
      where is_published and lifecycle_status = 'published' and archived_at is null
        and (tenant_key is null or tenant_key = v_tenant)
        and (organization_key is null or organization_key = v_organization)
      order by case when checklist_key = 'angelcare-standard-onboarding-v1' then 0 else 1 end, updated_at desc
      limit 1;
    end if;
    if v_checklist_key is not null then
      v_bundle := public.hr_onboarding_instantiate_checklist(v_journey_key, v_checklist_key, p_actor);
    end if;

    perform public.hr_onboarding_write_activity(v_journey_key, 'journey_created', 'Parcours onboarding créé', nullif(p_payload->>'notes',''), 'recorded', p_actor, jsonb_build_object('source','onboarding_command'));
    v_progress := public.hr_onboarding_recalculate_progress(v_journey_key);
    v_result := jsonb_build_object(
      'ok', true,
      'message', 'Parcours et bundle onboarding créés transactionnellement.',
      'journeyKey', v_journey_key,
      'progress', v_progress,
      'taskCount', coalesce((v_bundle->>'taskCount')::integer, 0),
      'documentCount', coalesce((v_bundle->>'documentCount')::integer, 0),
      'assignmentKey', v_bundle->>'assignmentKey'
    );

  elsif p_operation = 'journey.update' then
    v_version := (p_payload->>'version')::bigint;
    update public.hr_onboarding_journeys set
      title = coalesce(nullif(p_payload->>'title',''), title),
      position = case when p_payload ? 'position' then nullif(p_payload->>'position','') else position end,
      department = case when p_payload ? 'department' then nullif(p_payload->>'department','') else department end,
      start_date = case when p_payload ? 'startDate' then nullif(p_payload->>'startDate','')::date else start_date end,
      manager = case when p_payload ? 'manager' then nullif(p_payload->>'manager','') else manager end,
      manager_key = case when p_payload ? 'managerKey' then nullif(p_payload->>'managerKey','') else manager_key end,
      location = case when p_payload ? 'location' then nullif(p_payload->>'location','') else location end,
      employment_type = case when p_payload ? 'employmentType' then nullif(p_payload->>'employmentType','') else employment_type end,
      email = case when p_payload ? 'email' then nullif(p_payload->>'email','') else email end,
      phone = case when p_payload ? 'phone' then nullif(p_payload->>'phone','') else phone end,
      owner = case when p_payload ? 'owner' then nullif(p_payload->>'owner','') else owner end,
      owner_key = case when p_payload ? 'ownerKey' then nullif(p_payload->>'ownerKey','') else owner_key end,
      priority = coalesce(nullif(p_payload->>'priority',''), priority),
      risk_level = coalesce(nullif(p_payload->>'riskLevel',''), risk_level),
      risk_notes = case when p_payload ? 'riskNotes' then nullif(p_payload->>'riskNotes','') else risk_notes end,
      metadata = metadata || jsonb_build_object('lastEditNotes', nullif(p_payload->>'notes','')),
      version = version + 1, updated_by = v_actor_key, updated_at = v_now
    where journey_key = v_journey_key and version = v_version
      and (v_sovereign or ((v_tenant is null or tenant_key = v_tenant) and (v_organization is null or organization_key = v_organization)))
    returning * into v_current;
    if not found then raise exception 'ONBOARDING_VERSION_CONFLICT'; end if;
    perform public.hr_onboarding_write_activity(v_journey_key, 'journey_updated', 'Parcours onboarding mis à jour', nullif(p_payload->>'notes',''), 'recorded', p_actor, '{}'::jsonb);
    v_result := jsonb_build_object('ok', true, 'message', 'Parcours mis à jour.', 'journeyKey', v_journey_key, 'version', v_current.version);

  elsif p_operation in ('journey.advance','journey.pause','journey.resume','journey.complete','journey.cancel','journey.archive','journey.restore','journey.reassign','journey.override_progress','journey.assign_checklist') then
    v_version := (p_payload->>'version')::bigint;
    select * into v_current from public.hr_onboarding_journeys
    where journey_key = v_journey_key and version = v_version
      and (v_sovereign or ((v_tenant is null or tenant_key = v_tenant) and (v_organization is null or organization_key = v_organization)))
    for update;
    if not found then raise exception 'ONBOARDING_VERSION_CONFLICT'; end if;

    if p_operation = 'journey.advance' then
      if v_current.status not in ('active','paused') then raise exception 'ONBOARDING_JOURNEY_NOT_ADVANCEABLE'; end if;
      if not public.hr_onboarding_gate_ready(v_journey_key, v_current.phase) and not coalesce((p_payload->>'force')::boolean, false) then raise exception 'ONBOARDING_PHASE_GATES_INCOMPLETE'; end if;
      v_current_rank := public.hr_onboarding_phase_rank(v_current.phase);
      v_next_phase := public.hr_onboarding_phase_from_rank(least(8, v_current_rank + 1));
      update public.hr_onboarding_journeys set phase = v_next_phase, stage = v_next_phase,
        status = case when v_next_phase = 'completed' then 'completed' else 'active' end,
        completed_at = case when v_next_phase = 'completed' then v_now else completed_at end,
        version = version + 1, updated_by = v_actor_key, updated_at = v_now
      where journey_key = v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key, 'phase_advanced', 'Phase avancée vers ' || v_next_phase, nullif(p_payload->>'reason',''), 'recorded', p_actor, jsonb_build_object('from',v_current.phase,'to',v_next_phase));
      v_result := jsonb_build_object('ok', true, 'message', 'Phase avancée et synchronisée.', 'phase', v_next_phase);
    elsif p_operation = 'journey.pause' then
      update public.hr_onboarding_journeys set status='paused', paused_at=v_now, version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_paused','Parcours mis en pause',nullif(p_payload->>'reason',''),'recorded',p_actor,'{}'::jsonb);
      v_result := jsonb_build_object('ok',true,'message','Parcours mis en pause.');
    elsif p_operation = 'journey.resume' then
      update public.hr_onboarding_journeys set status='active', paused_at=null, version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_resumed','Parcours repris',nullif(p_payload->>'reason',''),'recorded',p_actor,'{}'::jsonb);
      v_result := jsonb_build_object('ok',true,'message','Parcours repris.');
    elsif p_operation = 'journey.complete' then
      if not public.hr_onboarding_gate_ready(v_journey_key,'probation') and not coalesce((p_payload->>'force')::boolean,false) then raise exception 'ONBOARDING_COMPLETION_GATES_INCOMPLETE'; end if;
      update public.hr_onboarding_journeys set status='completed', phase='completed', stage='completed', progress=100, completion_rate=100, completed_at=v_now, version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_completed','Parcours onboarding terminé',nullif(p_payload->>'reason',''),'recorded',p_actor,'{}'::jsonb);
      v_result := jsonb_build_object('ok',true,'message','Parcours terminé.');
    elsif p_operation = 'journey.cancel' then
      if nullif(p_payload->>'reason','') is null then raise exception 'ONBOARDING_REASON_REQUIRED'; end if;
      update public.hr_onboarding_journeys set status='cancelled', cancelled_at=v_now, cancellation_reason=p_payload->>'reason', version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_cancelled','Parcours annulé',p_payload->>'reason','recorded',p_actor,'{}'::jsonb);
      v_result := jsonb_build_object('ok',true,'message','Parcours annulé avec historique conservé.');
    elsif p_operation = 'journey.archive' then
      if nullif(p_payload->>'reason','') is null then raise exception 'ONBOARDING_REASON_REQUIRED'; end if;
      update public.hr_onboarding_journeys set status='archived', archived_at=v_now, archive_reason=p_payload->>'reason', version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_archived','Parcours archivé',p_payload->>'reason','recorded',p_actor,'{}'::jsonb);
      v_result := jsonb_build_object('ok',true,'message','Parcours archivé sans suppression.');
    elsif p_operation = 'journey.restore' then
      update public.hr_onboarding_journeys set status='active', archived_at=null, archive_reason=null, version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_restored','Parcours restauré',nullif(p_payload->>'reason',''),'recorded',p_actor,'{}'::jsonb);
      v_result := jsonb_build_object('ok',true,'message','Parcours restauré.');
    elsif p_operation = 'journey.reassign' then
      update public.hr_onboarding_journeys set owner=coalesce(nullif(p_payload->>'owner',''),owner), owner_key=case when p_payload ? 'ownerKey' then nullif(p_payload->>'ownerKey','') else owner_key end,
        manager=coalesce(nullif(p_payload->>'manager',''),manager), manager_key=case when p_payload ? 'managerKey' then nullif(p_payload->>'managerKey','') else manager_key end,
        version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'journey_reassigned','Responsabilités réaffectées',nullif(p_payload->>'reason',''),'recorded',p_actor,jsonb_build_object('owner',p_payload->>'owner','manager',p_payload->>'manager'));
      v_result := jsonb_build_object('ok',true,'message','Responsabilités réaffectées.');
    elsif p_operation = 'journey.override_progress' then
      if nullif(p_payload->>'reason','') is null then raise exception 'ONBOARDING_OVERRIDE_REASON_REQUIRED'; end if;
      update public.hr_onboarding_journeys set progress=greatest(0,least(100,(p_payload->>'progress')::integer)), completion_rate=greatest(0,least(100,(p_payload->>'progress')::integer)),
        metadata=metadata || jsonb_build_object('manualProgressOverride',true,'overrideReason',p_payload->>'reason','overrideAt',v_now), version=version+1, updated_by=v_actor_key, updated_at=v_now where journey_key=v_journey_key;
      perform public.hr_onboarding_write_activity(v_journey_key,'progress_override','Progression forcée',p_payload->>'reason','recorded',p_actor,jsonb_build_object('progress',(p_payload->>'progress')::integer));
      v_result := jsonb_build_object('ok',true,'message','Override enregistré et audité.');
    else
      if v_checklist_key is null then raise exception 'ONBOARDING_CHECKLIST_REQUIRED'; end if;
      v_result := public.hr_onboarding_instantiate_checklist(v_journey_key,v_checklist_key,p_actor) || jsonb_build_object('message','Checklist affectée et exigences instanciées.');
    end if;

  elsif p_operation = 'task.create' then
    v_task_key := gen_random_uuid()::text;
    insert into public.hr_onboarding_tasks (
      task_key, journey_key, tenant_key, organization_key, title, group_name, category, phase, stage, status,
      owner, owner_key, priority, due_at_ts, due_date, notes, required, sort_order, version, idempotency_key,
      metadata, created_by, updated_by, created_at, updated_at
    )
    select v_task_key, j.journey_key, j.tenant_key, j.organization_key, coalesce(nullif(p_payload->>'title',''),'Tâche onboarding'),
      coalesce(nullif(p_payload->>'groupName',''),'Général'), coalesce(nullif(p_payload->>'groupName',''),'Général'),
      coalesce(nullif(p_payload->>'phase',''),'preboarding'), coalesce(nullif(p_payload->>'phase',''),'preboarding'),
      coalesce(nullif(p_payload->>'status',''),'pending'), nullif(p_payload->>'owner',''), nullif(p_payload->>'ownerKey',''),
      coalesce(nullif(p_payload->>'priority',''),'normal'), nullif(p_payload->>'dueAt','')::timestamptz, nullif(p_payload->>'dueAt','')::date,
      nullif(p_payload->>'notes',''), coalesce((p_payload->>'required')::boolean,true), coalesce((p_payload->>'sortOrder')::integer,0), 1,
      v_idempotency, '{}'::jsonb, v_actor_key, v_actor_key, v_now, v_now
    from public.hr_onboarding_journeys j
    where j.journey_key=v_journey_key
      and (v_sovereign or ((v_tenant is null or j.tenant_key = v_tenant) and (v_organization is null or j.organization_key = v_organization)));
    if not found then raise exception 'ONBOARDING_JOURNEY_NOT_FOUND'; end if;
    perform public.hr_onboarding_write_activity(v_journey_key,'task_created','Tâche créée',p_payload->>'title','recorded',p_actor,jsonb_build_object('taskKey',v_task_key));
    v_progress := public.hr_onboarding_recalculate_progress(v_journey_key);
    v_result := jsonb_build_object('ok',true,'message','Tâche créée.','taskKey',v_task_key,'progress',v_progress);

  elsif p_operation in ('task.update','task.archive') then
    v_version := (p_payload->>'version')::bigint;
    select * into v_current from public.hr_onboarding_tasks
    where task_key=v_task_key and version=v_version
      and (v_sovereign or ((v_tenant is null or tenant_key = v_tenant) and (v_organization is null or organization_key = v_organization)))
    for update;
    if not found then raise exception 'ONBOARDING_VERSION_CONFLICT'; end if;
    if p_operation='task.archive' then
      if nullif(p_payload->>'reason','') is null then raise exception 'ONBOARDING_REASON_REQUIRED'; end if;
      update public.hr_onboarding_tasks set status='archived',archived_at=v_now,archive_reason=p_payload->>'reason',version=version+1,updated_by=v_actor_key,updated_at=v_now where task_key=v_task_key;
      perform public.hr_onboarding_write_activity(v_current.journey_key,'task_archived','Tâche archivée',p_payload->>'reason','recorded',p_actor,jsonb_build_object('taskKey',v_task_key));
      v_result := jsonb_build_object('ok',true,'message','Tâche archivée.');
    else
      update public.hr_onboarding_tasks set
        title=coalesce(nullif(p_payload->>'title',''),title),
        group_name=coalesce(nullif(p_payload->>'groupName',''),group_name),
        category=coalesce(nullif(p_payload->>'groupName',''),category),
        phase=coalesce(nullif(p_payload->>'phase',''),phase), stage=coalesce(nullif(p_payload->>'phase',''),stage),
        status=coalesce(nullif(p_payload->>'status',''),status), owner=case when p_payload ? 'owner' then nullif(p_payload->>'owner','') else owner end,
        owner_key=case when p_payload ? 'ownerKey' then nullif(p_payload->>'ownerKey','') else owner_key end,
        priority=coalesce(nullif(p_payload->>'priority',''),priority), due_at_ts=case when p_payload ? 'dueAt' then nullif(p_payload->>'dueAt','')::timestamptz else due_at_ts end,
        due_date=case when p_payload ? 'dueAt' then nullif(p_payload->>'dueAt','')::date else due_date end,
        notes=case when p_payload ? 'notes' then nullif(p_payload->>'notes','') else notes end,
        required=coalesce((p_payload->>'required')::boolean,required), blocker_reason=case when p_payload ? 'blockerReason' then nullif(p_payload->>'blockerReason','') else blocker_reason end,
        evidence_url=case when p_payload ? 'evidenceUrl' then nullif(p_payload->>'evidenceUrl','') else evidence_url end,
        completed_at=case when coalesce(nullif(p_payload->>'status',''),status)='completed' then coalesce(completed_at,v_now) else null end,
        blocked_at=case when coalesce(nullif(p_payload->>'status',''),status)='blocked' then coalesce(blocked_at,v_now) else null end,
        version=version+1,updated_by=v_actor_key,updated_at=v_now
      where task_key=v_task_key;
      perform public.hr_onboarding_write_activity(v_current.journey_key,'task_updated','Tâche mise à jour',coalesce(p_payload->>'title',v_current.title),'recorded',p_actor,jsonb_build_object('taskKey',v_task_key,'status',p_payload->>'status'));
      v_result := jsonb_build_object('ok',true,'message','Tâche mise à jour.');
    end if;
    v_progress := public.hr_onboarding_recalculate_progress(v_current.journey_key);
    v_result := v_result || jsonb_build_object('progress',v_progress);

  elsif p_operation = 'document.create' then
    v_document_key := gen_random_uuid()::text;
    insert into public.hr_onboarding_documents (
      document_key,journey_key,tenant_key,organization_key,title,category,document_type,status,owner,owner_key,required,due_date,expires_at,notes,version,idempotency_key,metadata,created_by,updated_by,created_at,updated_at
    )
    select v_document_key,j.journey_key,j.tenant_key,j.organization_key,coalesce(nullif(p_payload->>'title',''),'Document onboarding'),coalesce(nullif(p_payload->>'category',''),'Général'),nullif(p_payload->>'documentType',''),
      coalesce(nullif(p_payload->>'status',''),'requested'),nullif(p_payload->>'owner',''),nullif(p_payload->>'ownerKey',''),coalesce((p_payload->>'required')::boolean,true),nullif(p_payload->>'dueDate','')::date,
      nullif(p_payload->>'expiresAt','')::timestamptz,nullif(p_payload->>'notes',''),1,v_idempotency,'{}'::jsonb,v_actor_key,v_actor_key,v_now,v_now
    from public.hr_onboarding_journeys j
    where j.journey_key=v_journey_key
      and (v_sovereign or ((v_tenant is null or j.tenant_key = v_tenant) and (v_organization is null or j.organization_key = v_organization)));
    if not found then raise exception 'ONBOARDING_JOURNEY_NOT_FOUND'; end if;
    perform public.hr_onboarding_write_activity(v_journey_key,'document_requested','Document demandé',p_payload->>'title','recorded',p_actor,jsonb_build_object('documentKey',v_document_key));
    v_progress := public.hr_onboarding_recalculate_progress(v_journey_key);
    v_result := jsonb_build_object('ok',true,'message','Demande documentaire créée.','documentKey',v_document_key,'progress',v_progress);

  elsif p_operation in ('document.update','document.archive','document.upload') then
    v_version := (p_payload->>'version')::bigint;
    select * into v_current from public.hr_onboarding_documents
    where document_key=v_document_key and version=v_version
      and (v_sovereign or ((v_tenant is null or tenant_key = v_tenant) and (v_organization is null or organization_key = v_organization)))
    for update;
    if not found then raise exception 'ONBOARDING_VERSION_CONFLICT'; end if;
    if p_operation='document.archive' then
      if nullif(p_payload->>'reason','') is null then raise exception 'ONBOARDING_REASON_REQUIRED'; end if;
      update public.hr_onboarding_documents set status='archived',archived_at=v_now,archive_reason=p_payload->>'reason',version=version+1,updated_by=v_actor_key,updated_at=v_now where document_key=v_document_key;
      perform public.hr_onboarding_write_activity(v_current.journey_key,'document_archived','Document archivé',p_payload->>'reason','recorded',p_actor,jsonb_build_object('documentKey',v_document_key));
      v_result := jsonb_build_object('ok',true,'message','Document archivé.');
    elsif p_operation='document.upload' then
      update public.hr_onboarding_documents set status='uploaded',storage_bucket=p_payload->>'storageBucket',storage_path=p_payload->>'storagePath',mime_type=p_payload->>'mimeType',file_size=(p_payload->>'fileSize')::bigint,
        file_url=null,metadata=metadata || jsonb_build_object('originalName',p_payload->>'originalName','uploadedAt',v_now),version=version+1,updated_by=v_actor_key,updated_at=v_now where document_key=v_document_key;
      perform public.hr_onboarding_write_activity(v_current.journey_key,'document_uploaded','Fichier téléversé',p_payload->>'originalName','recorded',p_actor,jsonb_build_object('documentKey',v_document_key,'mimeType',p_payload->>'mimeType','fileSize',(p_payload->>'fileSize')::bigint));
      v_result := jsonb_build_object('ok',true,'message','Fichier téléversé et lié au dossier.');
    else
      update public.hr_onboarding_documents set
        title=coalesce(nullif(p_payload->>'title',''),title),category=coalesce(nullif(p_payload->>'category',''),category),
        document_type=case when p_payload ? 'documentType' then nullif(p_payload->>'documentType','') else document_type end,
        status=coalesce(nullif(p_payload->>'status',''),status),owner=case when p_payload ? 'owner' then nullif(p_payload->>'owner','') else owner end,
        owner_key=case when p_payload ? 'ownerKey' then nullif(p_payload->>'ownerKey','') else owner_key end,
        required=coalesce((p_payload->>'required')::boolean,required),due_date=case when p_payload ? 'dueDate' then nullif(p_payload->>'dueDate','')::date else due_date end,
        expires_at=case when p_payload ? 'expiresAt' then nullif(p_payload->>'expiresAt','')::timestamptz else expires_at end,
        rejected_reason=case when p_payload ? 'rejectedReason' then nullif(p_payload->>'rejectedReason','') else rejected_reason end,
        notes=case when p_payload ? 'notes' then nullif(p_payload->>'notes','') else notes end,
        verified_by=case when coalesce(nullif(p_payload->>'status',''),status)='validated' then v_actor_key else verified_by end,
        verified_at=case when coalesce(nullif(p_payload->>'status',''),status)='validated' then v_now else verified_at end,
        waived_at=case when coalesce(nullif(p_payload->>'status',''),status)='waived' then v_now else waived_at end,
        version=version+1,updated_by=v_actor_key,updated_at=v_now
      where document_key=v_document_key;
      perform public.hr_onboarding_write_activity(v_current.journey_key,'document_updated','Document mis à jour',coalesce(p_payload->>'title',v_current.title),'recorded',p_actor,jsonb_build_object('documentKey',v_document_key,'status',p_payload->>'status'));
      v_result := jsonb_build_object('ok',true,'message','Document mis à jour.');
    end if;
    v_progress := public.hr_onboarding_recalculate_progress(v_current.journey_key);
    v_result := v_result || jsonb_build_object('progress',v_progress);

  elsif p_operation = 'activity.create' then
    if not exists (
      select 1 from public.hr_onboarding_journeys j
      where j.journey_key = v_journey_key
        and (v_sovereign or ((v_tenant is null or j.tenant_key = v_tenant) and (v_organization is null or j.organization_key = v_organization)))
    ) then raise exception 'ONBOARDING_JOURNEY_NOT_FOUND'; end if;
    v_key := public.hr_onboarding_write_activity(v_journey_key,coalesce(nullif(p_payload->>'type',''),'note'),coalesce(nullif(p_payload->>'title',''),'Note onboarding'),nullif(p_payload->>'body',''),coalesce(nullif(p_payload->>'status',''),'recorded'),p_actor,coalesce(p_payload->'metadata','{}'::jsonb));
    v_result := jsonb_build_object('ok',true,'message','Événement ajouté à la timeline.','activityKey',v_key);

  elsif p_operation in ('checklist.create','checklist.update','checklist.publish','checklist.archive') then
    if p_operation='checklist.create' then
      v_checklist_key := gen_random_uuid()::text;
      insert into public.hr_onboarding_checklists(checklist_key,family_key,tenant_key,organization_key,name,role_key,department_key,lifecycle_status,status,version,is_published,items,checklist,notes,metadata,created_by,updated_by,created_at,updated_at)
      values(v_checklist_key,v_checklist_key,v_tenant,v_organization,coalesce(nullif(p_payload->>'name',''),'Checklist onboarding'),nullif(p_payload->>'roleKey',''),nullif(p_payload->>'departmentKey',''),'draft','active',1,false,coalesce(p_payload->'items','[]'::jsonb),coalesce(p_payload->'items','[]'::jsonb),nullif(p_payload->>'notes',''),'{}'::jsonb,v_actor_key,v_actor_key,v_now,v_now);
      v_result := jsonb_build_object('ok',true,'message','Checklist brouillon créée.','checklistKey',v_checklist_key);
    else
      v_version := (p_payload->>'version')::bigint;
      select * into v_current from public.hr_onboarding_checklists
      where checklist_key=v_checklist_key and version=v_version
        and (v_sovereign or ((v_tenant is null or tenant_key is null or tenant_key = v_tenant) and (v_organization is null or organization_key is null or organization_key = v_organization)))
      for update;
      if not found then raise exception 'ONBOARDING_VERSION_CONFLICT'; end if;
      if p_operation='checklist.update' and v_current.is_published then
        v_key := gen_random_uuid()::text;
        insert into public.hr_onboarding_checklists(checklist_key,family_key,tenant_key,organization_key,name,role_key,department_key,lifecycle_status,status,version,is_published,items,checklist,notes,metadata,created_by,updated_by,created_at,updated_at)
        values(v_key,v_current.family_key,v_current.tenant_key,v_current.organization_key,coalesce(nullif(p_payload->>'name',''),v_current.name),case when p_payload ? 'roleKey' then nullif(p_payload->>'roleKey','') else v_current.role_key end,case when p_payload ? 'departmentKey' then nullif(p_payload->>'departmentKey','') else v_current.department_key end,'draft','active',v_current.version+1,false,coalesce(p_payload->'items',v_current.items),coalesce(p_payload->'items',v_current.items),case when p_payload ? 'notes' then nullif(p_payload->>'notes','') else v_current.notes end,jsonb_build_object('derivedFrom',v_current.checklist_key),v_actor_key,v_actor_key,v_now,v_now);
        v_result := jsonb_build_object('ok',true,'message','Nouvelle version brouillon créée.','checklistKey',v_key);
      elsif p_operation='checklist.update' then
        update public.hr_onboarding_checklists set name=coalesce(nullif(p_payload->>'name',''),name),role_key=case when p_payload ? 'roleKey' then nullif(p_payload->>'roleKey','') else role_key end,department_key=case when p_payload ? 'departmentKey' then nullif(p_payload->>'departmentKey','') else department_key end,
          items=coalesce(p_payload->'items',items),checklist=coalesce(p_payload->'items',checklist),notes=case when p_payload ? 'notes' then nullif(p_payload->>'notes','') else notes end,updated_by=v_actor_key,updated_at=v_now where checklist_key=v_checklist_key;
        v_result := jsonb_build_object('ok',true,'message','Checklist brouillon mise à jour.','checklistKey',v_checklist_key);
      elsif p_operation='checklist.publish' then
        if jsonb_array_length(v_current.items)=0 then raise exception 'ONBOARDING_EMPTY_CHECKLIST'; end if;
        update public.hr_onboarding_checklists set lifecycle_status='published',status='active',is_published=true,published_at=v_now,updated_by=v_actor_key,updated_at=v_now where checklist_key=v_checklist_key;
        v_result := jsonb_build_object('ok',true,'message','Checklist publiée et figée.','checklistKey',v_checklist_key);
      else
        update public.hr_onboarding_checklists set lifecycle_status='archived',status='archived',is_published=false,archived_at=v_now,updated_by=v_actor_key,updated_at=v_now where checklist_key=v_checklist_key;
        v_result := jsonb_build_object('ok',true,'message','Checklist archivée.','checklistKey',v_checklist_key);
      end if;
    end if;
  else
    raise exception 'ONBOARDING_UNKNOWN_OPERATION:%', p_operation;
  end if;

  if v_idempotency is not null then
    update public.hr_onboarding_idempotency set status='completed',result=v_result,completed_at=now()
    where idempotency_key=v_idempotency and operation=p_operation
      and coalesce(tenant_key,'')=coalesce(v_tenant,'') and coalesce(organization_key,'')=coalesce(v_organization,'');
  end if;
  return v_result;
exception
  when others then
    if v_idempotency is not null then
      update public.hr_onboarding_idempotency set status='failed',result=jsonb_build_object('ok',false,'error',sqlerrm),completed_at=now()
      where idempotency_key=v_idempotency and operation=p_operation
        and coalesce(tenant_key,'')=coalesce(v_tenant,'') and coalesce(organization_key,'')=coalesce(v_organization,'');
    end if;
    raise;
end;
$$;

create or replace function public.hr_onboarding_ensure_journey(
  p_candidate_key text,
  p_staff_key text,
  p_payload jsonb,
  p_actor jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_payload jsonb;
  v_tenant text := nullif(p_actor->>'tenantKey','');
  v_organization text := nullif(p_actor->>'organizationKey','');
  v_sovereign boolean := coalesce((p_actor->>'sovereign')::boolean, false);
begin
  select journey_key into v_existing
  from public.hr_onboarding_journeys
  where archived_at is null and status not in ('archived','cancelled')
    and (v_sovereign or ((v_tenant is null or tenant_key = v_tenant) and (v_organization is null or organization_key = v_organization)))
    and ((p_candidate_key is not null and candidate_key=p_candidate_key) or (p_staff_key is not null and staff_key=p_staff_key))
  order by updated_at desc limit 1;
  if v_existing is not null then return jsonb_build_object('ok',true,'alreadyExists',true,'journeyKey',v_existing); end if;

  v_payload := coalesce(p_payload,'{}'::jsonb) || jsonb_build_object(
    'candidateKey',p_candidate_key,
    'staffKey',p_staff_key,
    'idempotencyKey',coalesce(nullif(p_payload->>'idempotencyKey',''),'lifecycle:'||coalesce(p_staff_key,p_candidate_key,gen_random_uuid()::text))
  );
  return public.hr_onboarding_execute('journey.create',v_payload,p_actor);
end;
$$;

alter table public.hr_onboarding_journeys enable row level security;
alter table public.hr_onboarding_tasks enable row level security;
alter table public.hr_onboarding_documents enable row level security;
alter table public.hr_onboarding_activity enable row level security;
alter table public.hr_onboarding_checklists enable row level security;
alter table public.hr_onboarding_checklist_assignments enable row level security;
alter table public.hr_onboarding_idempotency enable row level security;

drop policy if exists authenticated_hr_onboarding_journeys_all on public.hr_onboarding_journeys;
drop policy if exists authenticated_hr_onboarding_tasks_all on public.hr_onboarding_tasks;
drop policy if exists authenticated_hr_onboarding_documents_all on public.hr_onboarding_documents;
drop policy if exists authenticated_hr_onboarding_activity_all on public.hr_onboarding_activity;

revoke all on public.hr_onboarding_journeys from anon, authenticated;
revoke all on public.hr_onboarding_tasks from anon, authenticated;
revoke all on public.hr_onboarding_documents from anon, authenticated;
revoke all on public.hr_onboarding_activity from anon, authenticated;
revoke all on public.hr_onboarding_checklists from anon, authenticated;
revoke all on public.hr_onboarding_checklist_assignments from anon, authenticated;
revoke all on public.hr_onboarding_idempotency from anon, authenticated;

grant select, insert, update, delete on public.hr_onboarding_journeys to service_role;
grant select, insert, update, delete on public.hr_onboarding_tasks to service_role;
grant select, insert, update, delete on public.hr_onboarding_documents to service_role;
grant select, insert on public.hr_onboarding_activity to service_role;
grant select, insert, update on public.hr_onboarding_checklists to service_role;
grant select, insert, update on public.hr_onboarding_checklist_assignments to service_role;
grant select, insert, update on public.hr_onboarding_idempotency to service_role;
grant execute on function public.hr_onboarding_execute(text,jsonb,jsonb) to service_role;
grant execute on function public.hr_onboarding_ensure_journey(text,text,jsonb,jsonb) to service_role;
grant execute on function public.hr_onboarding_recalculate_progress(text) to service_role;
grant execute on function public.hr_onboarding_gate_ready(text,text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'hr-onboarding-documents', 'hr-onboarding-documents', false, 20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
where to_regclass('storage.buckets') is not null
  and not exists (select 1 from storage.buckets where id='hr-onboarding-documents');

commit;
