-- ANGELCARE SOCIAL COMMAND MZ9 · FINAL PRODUCT EXCELLENCE / OPERATOR EXPERIENCE CLOSURE
-- Additive only. Persists operator saved views/preferences. No provider or relationship history is deleted.
begin;
create extension if not exists pgcrypto;

create table if not exists public.social_command_saved_views (
  id uuid primary key default gen_random_uuid(),
  actor_user_id text not null,
  name text not null,
  universe text not null check (universe in ('command','studio','publish','engage','automate','control')),
  view_key text not null default '',
  query jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_command_saved_views_actor_idx on public.social_command_saved_views(actor_user_id,updated_at desc);
create index if not exists social_command_saved_views_shared_idx on public.social_command_saved_views(is_shared,universe,updated_at desc) where is_shared=true;

create table if not exists public.social_command_operator_preferences (
  actor_user_id text primary key,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.social_command_saved_views enable row level security;
alter table public.social_command_operator_preferences enable row level security;
revoke all on table public.social_command_saved_views from anon, authenticated;
revoke all on table public.social_command_operator_preferences from anon, authenticated;

commit;
