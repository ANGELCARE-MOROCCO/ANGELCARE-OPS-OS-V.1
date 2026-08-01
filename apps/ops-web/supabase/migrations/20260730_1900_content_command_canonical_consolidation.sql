-- ANGELCARE Content Command Center 360
-- Canonical runtime consolidation support tables.
-- Additive only: no legacy table is dropped and no existing premium route is changed.

create extension if not exists pgcrypto;

create table if not exists public.market_content_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  family text not null default 'digital',
  category text not null default 'Custom',
  status text not null default 'draft',
  owner_name text,
  dna jsonb not null default '{}'::jsonb,
  created_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_notes (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.market_content_dossiers(id) on delete cascade,
  mission_id uuid references public.market_content_missions(id) on delete cascade,
  task_id uuid references public.market_content_mission_tasks(id) on delete cascade,
  template_id uuid references public.market_content_templates(id) on delete set null,
  note_type text not null default 'comment',
  body text not null,
  status text not null default 'open',
  author_id uuid,
  author_name text not null default 'Utilisateur ANGELCARE',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_content_compatibility_links (
  id uuid primary key default gen_random_uuid(),
  legacy_system text not null,
  legacy_entity text not null,
  legacy_id text not null,
  canonical_entity text not null,
  canonical_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  migrated_at timestamptz not null default now(),
  unique(legacy_system, legacy_entity, legacy_id)
);

create index if not exists market_content_templates_family_status_idx
  on public.market_content_templates(family, status, updated_at desc);
create index if not exists market_content_notes_dossier_idx
  on public.market_content_notes(dossier_id, status, created_at desc);
create index if not exists market_content_notes_task_idx
  on public.market_content_notes(task_id, status, created_at desc);
create index if not exists market_content_compatibility_canonical_idx
  on public.market_content_compatibility_links(canonical_entity, canonical_id);

-- Reuse the existing shared touch function shipped with the platform.
drop trigger if exists market_content_templates_updated_at on public.market_content_templates;
create trigger market_content_templates_updated_at
before update on public.market_content_templates
for each row execute function public.set_updated_at();

drop trigger if exists market_content_notes_updated_at on public.market_content_notes;
create trigger market_content_notes_updated_at
before update on public.market_content_notes
for each row execute function public.set_updated_at();

alter table public.market_content_templates enable row level security;
alter table public.market_content_notes enable row level security;
alter table public.market_content_compatibility_links enable row level security;

-- These tables are intentionally server-mediated. The service role bypasses RLS;
-- browser clients receive no direct table policy and must use governed APIs.
revoke all on public.market_content_templates from anon, authenticated;
revoke all on public.market_content_notes from anon, authenticated;
revoke all on public.market_content_compatibility_links from anon, authenticated;

grant all on public.market_content_templates to service_role;
grant all on public.market_content_notes to service_role;
grant all on public.market_content_compatibility_links to service_role;

comment on table public.market_content_templates is 'Canonical Content Command template DNA registry. Replaces active content_command_templates writes.';
comment on table public.market_content_notes is 'Canonical operational notes, comments, approval requests, and version annotations.';
comment on table public.market_content_compatibility_links is 'Idempotent lineage between retired/local legacy identifiers and canonical Market Content records.';
