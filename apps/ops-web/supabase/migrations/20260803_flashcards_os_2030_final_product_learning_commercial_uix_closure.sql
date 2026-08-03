-- ANGELCARE FLASHCARDS OS 2030 — FINAL PRODUCT, LEARNING, COMMERCIAL & UIX CLOSURE
-- Persistent direct-manipulation workbenches, personal productivity, contextual collaboration,
-- scenario lineage and generated-document registry. Additive, bounded and non-destructive.

begin;
select pg_advisory_xact_lock(84732030);

create extension if not exists pgcrypto;
create schema if not exists flashcards_os;

create or replace function flashcards_os.px_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists flashcards_os.px_workbenches (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  kind text not null check (kind in ('collection','package','journey','command','document')),
  source_id text null,
  source_type text null,
  title text not null,
  status text not null default 'active' check (status in ('draft','active','completed')),
  universe text not null default 'internal' check (universe in ('b2c','b2b','internal')),
  version_no integer not null default 1 check (version_no > 0),
  payload jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fc_px_workbenches_actor on flashcards_os.px_workbenches(tenant_key,created_by,updated_at desc);
create index if not exists idx_fc_px_workbenches_source on flashcards_os.px_workbenches(tenant_key,source_type,source_id);

drop trigger if exists trg_fc_px_workbenches_updated_at on flashcards_os.px_workbenches;
create trigger trg_fc_px_workbenches_updated_at before update on flashcards_os.px_workbenches
for each row execute function flashcards_os.px_touch_updated_at();

create table if not exists flashcards_os.px_workbench_items (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  workbench_id uuid not null references flashcards_os.px_workbenches(id) on delete cascade,
  parent_id uuid null references flashcards_os.px_workbench_items(id) on delete cascade,
  item_kind text not null check (item_kind in ('collection','tier','day','session','activity','section','note')),
  source_ref text null,
  source_version text null,
  title text not null default '',
  sort_order integer not null default 100,
  start_minute integer null check (start_minute is null or start_minute >= 0),
  duration_minutes integer null check (duration_minutes is null or duration_minutes > 0),
  quantity integer not null default 1 check (quantity > 0),
  locked boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fc_px_items_workbench on flashcards_os.px_workbench_items(tenant_key,workbench_id,parent_id,sort_order);
drop trigger if exists trg_fc_px_workbench_items_updated_at on flashcards_os.px_workbench_items;
create trigger trg_fc_px_workbench_items_updated_at before update on flashcards_os.px_workbench_items
for each row execute function flashcards_os.px_touch_updated_at();

create table if not exists flashcards_os.px_scenario_compositions (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  workbench_id uuid not null references flashcards_os.px_workbenches(id) on delete cascade,
  composition_kind text not null check (composition_kind in ('merge','transformation','duplicate')),
  source_scenario_ids text[] not null default '{}',
  transformation_key text null,
  before_snapshot jsonb not null default '{}'::jsonb,
  proposed_snapshot jsonb not null default '{}'::jsonb,
  applied_snapshot jsonb null,
  provider_route text null,
  actual_model text null,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_fc_px_compositions_workbench on flashcards_os.px_scenario_compositions(tenant_key,workbench_id,created_at desc);

create table if not exists flashcards_os.px_favorites (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  actor_id text not null,
  entity_type text not null,
  entity_id text not null,
  label text not null,
  href text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(tenant_key,actor_id,entity_type,entity_id)
);
create index if not exists idx_fc_px_favorites_actor on flashcards_os.px_favorites(tenant_key,actor_id,created_at desc);

create table if not exists flashcards_os.px_saved_views (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  actor_id text not null,
  name text not null,
  workspace text not null,
  query jsonb not null default '{}'::jsonb,
  display jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fc_px_saved_views_actor on flashcards_os.px_saved_views(tenant_key,actor_id,workspace,updated_at desc);
drop trigger if exists trg_fc_px_saved_views_updated_at on flashcards_os.px_saved_views;
create trigger trg_fc_px_saved_views_updated_at before update on flashcards_os.px_saved_views
for each row execute function flashcards_os.px_touch_updated_at();

create table if not exists flashcards_os.px_recent_items (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  actor_id text not null,
  entity_type text not null,
  entity_id text not null,
  label text not null,
  href text not null,
  metadata jsonb not null default '{}'::jsonb,
  last_opened_at timestamptz not null default now(),
  unique(tenant_key,actor_id,entity_type,entity_id)
);
create index if not exists idx_fc_px_recent_actor on flashcards_os.px_recent_items(tenant_key,actor_id,last_opened_at desc);

create table if not exists flashcards_os.px_annotations (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  entity_type text not null,
  entity_id text not null,
  anchor text null,
  body text not null,
  resolved boolean not null default false,
  created_by text not null,
  created_by_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fc_px_annotations_entity on flashcards_os.px_annotations(tenant_key,entity_type,entity_id,resolved,created_at);
drop trigger if exists trg_fc_px_annotations_updated_at on flashcards_os.px_annotations;
create trigger trg_fc_px_annotations_updated_at before update on flashcards_os.px_annotations
for each row execute function flashcards_os.px_touch_updated_at();

create table if not exists flashcards_os.px_document_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  source_type text not null,
  source_id text not null,
  template_code text not null,
  title text not null,
  file_name text not null,
  checksum_sha256 text not null,
  audience text not null default 'operations',
  confidentiality text not null default 'internal',
  orientation text not null default 'portrait' check (orientation in ('portrait','landscape')),
  density text not null default 'standard' check (density in ('compact','standard','detailed')),
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_fc_px_documents_source on flashcards_os.px_document_registry(tenant_key,source_type,source_id,created_at desc);
create index if not exists idx_fc_px_documents_actor on flashcards_os.px_document_registry(tenant_key,created_by,created_at desc);

create table if not exists flashcards_os.px_workspace_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  actor_id text not null,
  preference_key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(tenant_key,actor_id,preference_key)
);

create table if not exists flashcards_os.px_operation_history (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'angelcare-internal',
  actor_id text not null,
  actor_name text not null,
  operation text not null,
  entity_type text not null,
  entity_id text not null,
  before_payload jsonb null,
  after_payload jsonb null,
  created_at timestamptz not null default now()
);
create index if not exists idx_fc_px_history_entity on flashcards_os.px_operation_history(tenant_key,entity_type,entity_id,created_at desc);

-- Direct table access is intentionally service-role-only. The application API remains the authority.
do $$
declare t text;
begin
  foreach t in array array[
    'px_workbenches','px_workbench_items','px_scenario_compositions','px_favorites','px_saved_views',
    'px_recent_items','px_annotations','px_document_registry','px_workspace_preferences','px_operation_history'
  ] loop
    execute format('alter table flashcards_os.%I enable row level security',t);
    execute format('drop policy if exists tenant_read on flashcards_os.%I',t);
    execute format('create policy tenant_read on flashcards_os.%I for select to authenticated using (tenant_key=coalesce(auth.jwt()->>''tenant_key'',''''))',t);
    execute format('grant all on flashcards_os.%I to service_role',t);
  end loop;
end $$;

-- Public service-role views preserve the repository convention used by Flashcards OS.
create or replace view public.fc_os_px_workbenches as select * from flashcards_os.px_workbenches;
create or replace view public.fc_os_px_workbench_items as select * from flashcards_os.px_workbench_items;
create or replace view public.fc_os_px_scenario_compositions as select * from flashcards_os.px_scenario_compositions;
create or replace view public.fc_os_px_favorites as select * from flashcards_os.px_favorites;
create or replace view public.fc_os_px_saved_views as select * from flashcards_os.px_saved_views;
create or replace view public.fc_os_px_recent_items as select * from flashcards_os.px_recent_items;
create or replace view public.fc_os_px_annotations as select * from flashcards_os.px_annotations;
create or replace view public.fc_os_px_document_registry as select * from flashcards_os.px_document_registry;
create or replace view public.fc_os_px_workspace_preferences as select * from flashcards_os.px_workspace_preferences;
create or replace view public.fc_os_px_operation_history as select * from flashcards_os.px_operation_history;

revoke all on
  public.fc_os_px_workbenches, public.fc_os_px_workbench_items, public.fc_os_px_scenario_compositions,
  public.fc_os_px_favorites, public.fc_os_px_saved_views, public.fc_os_px_recent_items,
  public.fc_os_px_annotations, public.fc_os_px_document_registry, public.fc_os_px_workspace_preferences,
  public.fc_os_px_operation_history
from authenticated, anon;

grant all on
  public.fc_os_px_workbenches, public.fc_os_px_workbench_items, public.fc_os_px_scenario_compositions,
  public.fc_os_px_favorites, public.fc_os_px_saved_views, public.fc_os_px_recent_items,
  public.fc_os_px_annotations, public.fc_os_px_document_registry, public.fc_os_px_workspace_preferences,
  public.fc_os_px_operation_history
to service_role;

comment on table flashcards_os.px_workbenches is 'Autosaved direct-manipulation workbenches for collections, packages, learning journeys, commands and documents.';
comment on table flashcards_os.px_workbench_items is 'Editable collection, tier, day, session, activity and section items belonging to a Flashcards OS workbench.';
comment on table flashcards_os.px_document_registry is 'Metadata and checksum registry for generated Flashcards OS A4/PDF documents; file bytes are returned directly and not stored in this table.';

commit;
