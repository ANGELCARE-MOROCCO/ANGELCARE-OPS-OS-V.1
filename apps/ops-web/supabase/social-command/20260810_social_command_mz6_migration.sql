-- ANGELCARE SOCIAL COMMAND MZ6 — ADDITIVE PRODUCTION MIGRATION
begin;
create extension if not exists pgcrypto;

create table if not exists public.social_command_contact_profiles (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'instagram' check (provider in ('instagram','facebook')),
  provider_scoped_user_id text not null,
  username text,
  display_name text,
  profile_picture_url text,
  follower_count integer check (follower_count is null or follower_count >= 0),
  is_verified_user boolean,
  is_user_follow_business boolean,
  is_business_follow_user boolean,
  consent_state text not null default 'message_initiated' check (consent_state in ('message_initiated','unknown','provider_limited')),
  refresh_state text not null default 'unknown' check (refresh_state in ('unknown','live','stale','provider_limited','failed')),
  last_refreshed_at timestamptz,
  last_error text,
  first_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_scoped_user_id)
);
create index if not exists social_command_contact_profiles_username_idx on public.social_command_contact_profiles(provider, username) where username is not null;
create index if not exists social_command_contact_profiles_refresh_idx on public.social_command_contact_profiles(refresh_state, last_refreshed_at desc);

alter table public.social_command_contact_profiles enable row level security;
revoke all on table public.social_command_contact_profiles from anon, authenticated;

comment on table public.social_command_contact_profiles is 'MZ6 provider-scoped contact intelligence cache. Populated only from provider evidence; no fabricated identity fields.';
comment on column public.social_command_contact_profiles.profile_picture_url is 'Provider URL may expire; refresh is bounded by server-side MZ6 profile cache logic.';

commit;
select 'SOCIAL_COMMAND_MZ6_DATABASE_APPLIED' as result, 1 as additive_tables;
