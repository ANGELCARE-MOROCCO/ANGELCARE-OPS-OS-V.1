begin;

create extension if not exists pgcrypto;

do $angelcare_brand_preflight$
declare
  missing_relations text[];
begin
  select array_agg(required_relation)
  into missing_relations
  from (values
    ('public.app_users'),
    ('public.angelcare360_operator_clients'),
    ('public.angelcare360_operator_tenants'),
    ('public.angelcare360_schools'),
    ('public.angelcare360_operator_tenant_entitlement_snapshots'),
    ('public.angelcare360_operator_tenant_entitlement_items'),
    ('public.angelcare_storage_files'),
    ('public.angelcare_storage_events')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if missing_relations is not null then
    raise exception 'Brand Governance prerequisites missing: %', array_to_string(missing_relations, ', ');
  end if;
end
$angelcare_brand_preflight$;

create table if not exists public.angelcare360_operator_brand_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete cascade,
  school_id uuid references public.angelcare360_schools(id) on delete set null,
  legacy_brand_profile_id uuid,
  profile_key text not null default 'default',
  label text not null default 'Identité client',
  brand_name text,
  legal_name text,
  display_mode text not null default 'angelcare_only' check (display_mode in ('angelcare_only','cobrand','customer_primary','white_label')),
  portal_title text,
  email_from_name text,
  footer_text text,
  primary_color text not null default '#0b1f4d',
  secondary_color text not null default '#ffffff',
  accent_color text not null default '#e31c4b',
  font_family text not null default 'Inter',
  language_default text not null default 'fr' check (language_default in ('fr','ar','en','mixed')),
  activation_scopes jsonb not null default '["customer_portal","login","email","documents"]'::jsonb,
  entitlement_keys jsonb not null default '["branding","customer_branding","white_label"]'::jsonb,
  requires_entitlement boolean not null default false,
  status text not null default 'draft' check (status in ('draft','review','approved','published','paused','archived')),
  effective_at timestamptz,
  expires_at timestamptz,
  public_version_token text not null default encode(gen_random_bytes(18),'hex'),
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  approved_by uuid references public.app_users(id) on delete set null,
  published_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  paused_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists angelcare360_operator_brand_profile_key_idx
  on public.angelcare360_operator_brand_profiles(client_id, coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), profile_key);

create unique index if not exists angelcare360_operator_brand_one_published_tenant_idx
  on public.angelcare360_operator_brand_profiles(client_id, coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'published';
create index if not exists angelcare360_operator_brand_profiles_lookup_idx
  on public.angelcare360_operator_brand_profiles(client_id, tenant_id, status, updated_at desc);

create table if not exists public.angelcare360_operator_brand_assets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.angelcare360_operator_brand_profiles(id) on delete cascade,
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete cascade,
  school_id uuid references public.angelcare360_schools(id) on delete set null,
  storage_file_id text not null,
  asset_key text not null,
  asset_type text not null default 'logo' check (asset_type in ('logo','favicon','email_header','pdf_header','portal_banner','login_background','signature','other')),
  file_name text not null,
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 500000),
  width_px integer check (width_px is null or width_px between 1 and 1600),
  height_px integer check (height_px is null or height_px between 1 and 1600),
  sha256_hash text not null,
  public_token text not null default encode(gen_random_bytes(18),'hex'),
  status text not null default 'active' check (status in ('active','review','published','archived','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, asset_key)
);
create index if not exists angelcare360_operator_brand_assets_profile_idx
  on public.angelcare360_operator_brand_assets(profile_id, asset_type, status);
create index if not exists angelcare360_operator_brand_assets_public_idx
  on public.angelcare360_operator_brand_assets(public_token)
  where status = 'published';

create table if not exists public.angelcare360_operator_brand_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.angelcare360_operator_brand_profiles(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  reason text not null,
  status text not null default 'created' check (status in ('created','published','superseded','rolled_back')),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (profile_id, version_number)
);

create table if not exists public.angelcare360_operator_brand_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.angelcare360_operator_brand_profiles(id) on delete set null,
  asset_id uuid references public.angelcare360_operator_brand_assets(id) on delete set null,
  client_id uuid references public.angelcare360_operator_clients(id) on delete set null,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  actor_user_id uuid references public.app_users(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','notice','warning','critical')),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists angelcare360_operator_brand_events_lookup_idx
  on public.angelcare360_operator_brand_events(client_id, created_at desc);

create table if not exists public.angelcare360_official_brand_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  label text not null,
  public_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 500000),
  sha256_hash text not null,
  status text not null default 'active' check (status in ('active','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_brand_runtime_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.angelcare360_operator_brand_profiles(id) on delete cascade,
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete cascade,
  requested_mode text not null,
  resolved_mode text not null,
  entitlement_ok boolean not null default true,
  asset_ok boolean not null default true,
  storage_ok boolean not null default true,
  fallback_reason text,
  runtime_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.angelcare360_operator_brand_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger angelcare360_operator_brand_profiles_touch
before update on public.angelcare360_operator_brand_profiles
for each row execute function public.angelcare360_operator_brand_touch_updated_at();

create or replace trigger angelcare360_operator_brand_assets_touch
before update on public.angelcare360_operator_brand_assets
for each row execute function public.angelcare360_operator_brand_touch_updated_at();

create or replace trigger angelcare360_official_brand_assets_touch
before update on public.angelcare360_official_brand_assets
for each row execute function public.angelcare360_operator_brand_touch_updated_at();

insert into public.angelcare360_official_brand_assets
  (asset_key,label,public_path,mime_type,size_bytes,sha256_hash,status,metadata)
values
  ('angelcare_official_logo','AngelCare Official Logo','/brand/angelcare-official.webp','image/webp',12646,'2c2fddfba197a2bab332e63aa515e926a903ca3b3cd92a45bd3938b7dceaf38b','active','{"source":"approved AngelCare logo library asset","max_bytes":500000}'::jsonb),
  ('angelcare_legacy_logo','AngelCare Official Logo PNG','/logo.png','image/png',97215,'4374a7627400eedf971592d61b58f94be1d58eb7d01207d287636b5022dbc124','active','{"compatibility":true,"max_bytes":500000}'::jsonb)
on conflict (asset_key) do update set
  label = excluded.label,
  public_path = excluded.public_path,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  sha256_hash = excluded.sha256_hash,
  status = 'active',
  metadata = public.angelcare360_official_brand_assets.metadata || excluded.metadata,
  updated_at = now();

alter table if exists public.ac360_school_brand_assets add column if not exists storage_file_id text;
alter table if exists public.ac360_school_brand_assets add column if not exists width_px integer;
alter table if exists public.ac360_school_brand_assets add column if not exists height_px integer;
alter table if exists public.ac360_school_brand_assets add column if not exists public_token text;

alter table public.angelcare360_operator_brand_profiles enable row level security;
alter table public.angelcare360_operator_brand_assets enable row level security;
alter table public.angelcare360_operator_brand_versions enable row level security;
alter table public.angelcare360_operator_brand_events enable row level security;
alter table public.angelcare360_official_brand_assets enable row level security;
alter table public.angelcare360_operator_brand_runtime_snapshots enable row level security;

revoke all on table public.angelcare360_operator_brand_profiles from public, anon, authenticated;
revoke all on table public.angelcare360_operator_brand_assets from public, anon, authenticated;
revoke all on table public.angelcare360_operator_brand_versions from public, anon, authenticated;
revoke all on table public.angelcare360_operator_brand_events from public, anon, authenticated;
revoke all on table public.angelcare360_official_brand_assets from public, anon, authenticated;
revoke all on table public.angelcare360_operator_brand_runtime_snapshots from public, anon, authenticated;

grant all on table public.angelcare360_operator_brand_profiles to service_role;
grant all on table public.angelcare360_operator_brand_assets to service_role;
grant all on table public.angelcare360_operator_brand_versions to service_role;
grant all on table public.angelcare360_operator_brand_events to service_role;
grant all on table public.angelcare360_official_brand_assets to service_role;
grant all on table public.angelcare360_operator_brand_runtime_snapshots to service_role;

commit;
