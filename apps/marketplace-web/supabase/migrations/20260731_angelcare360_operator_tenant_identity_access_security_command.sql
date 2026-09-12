begin;
-- angelcare_tenant_access_preflight: fail-fast dependency authority for tenant identity/access security.

do $$
begin
  if to_regclass('public.app_users') is null
     or to_regclass('public.app_sessions') is null
     or to_regclass('public.angelcare360_operator_clients') is null
     or to_regclass('public.angelcare360_operator_tenants') is null then
    raise exception 'Tenant Identity prerequisite relations missing';
  end if;
end $$;

create table if not exists public.angelcare360_operator_tenant_role_templates (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  name text not null,
  description text,
  permissions text[] not null default '{}',
  denied_permissions text[] not null default '{}',
  module_keys text[] not null default '{}',
  require_mfa boolean not null default false,
  is_system boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_tenant_access_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  app_user_id uuid references public.app_users(id) on delete set null,
  membership_id uuid,
  school_user_role_id uuid,
  school_id uuid,
  organization_id uuid,
  campus_id uuid,
  full_name text not null,
  email text not null,
  phone text,
  job_title text,
  preferred_language text not null default 'fr',
  role_template text not null default 'school_admin',
  status text not null default 'draft',
  is_primary_owner boolean not null default false,
  scope_mode text not null default 'tenant',
  module_keys text[] not null default '{}',
  explicit_permissions text[] not null default '{}',
  denied_permissions text[] not null default '{}',
  security_policy jsonb not null default '{"require_mfa":false,"force_password_change":true,"session_duration_hours":12,"allowed_email_domains":[]}'::jsonb,
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  invited_at timestamptz,
  activated_at timestamptz,
  last_login_at timestamptz,
  last_security_event_at timestamptz,
  mfa_secret_encrypted text,
  mfa_recovery_codes text[] not null default '{}',
  mfa_enrolled_at timestamptz,
  mfa_last_verified_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_access_email_ck check (position('@' in email) > 1)
);
create unique index if not exists tenant_access_one_owner_idx on public.angelcare360_operator_tenant_access_accounts(tenant_id) where is_primary_owner and status not in ('revoked','expired');
create unique index if not exists tenant_access_email_tenant_idx on public.angelcare360_operator_tenant_access_accounts(tenant_id, lower(email)) where status <> 'revoked';

create table if not exists public.angelcare360_operator_tenant_admin_invitations (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  status text not null default 'invited',
  delivery_status text not null default 'ready',
  expires_at timestamptz not null,
  sent_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_tenant_access_scopes (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  scope_type text not null,
  scope_id uuid,
  scope_label text not null,
  access_level text not null default 'manage',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_tenant_access_events (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid references public.angelcare360_operator_tenant_access_accounts(id) on delete set null,
  client_id uuid,
  tenant_id uuid,
  actor_user_id uuid,
  event_type text not null,
  severity text not null default 'notice',
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_tenant_password_resets (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'requested',
  expires_at timestamptz not null,
  requested_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_tenant_support_access_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  operator_user_id uuid not null references public.app_users(id) on delete cascade,
  access_mode text not null check (access_mode in ('read_only','guided_support','elevated_support')),
  reason text not null,
  status text not null default 'requested',
  starts_at timestamptz,
  expires_at timestamptz not null,
  ended_at timestamptz,
  approved_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint support_approval_separation_ck check (approved_by is null or approved_by <> operator_user_id)
);

create table if not exists public.angelcare360_operator_tenant_owner_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  from_access_account_id uuid references public.angelcare360_operator_tenant_access_accounts(id) on delete set null,
  to_access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete restrict,
  status text not null default 'requested',
  effective_at timestamptz,
  reason text not null,
  requested_by uuid,
  approved_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.app_sessions add column if not exists mfa_verified_at timestamptz;
alter table public.app_sessions add column if not exists mfa_challenge_at timestamptz;
alter table public.app_sessions add column if not exists last_seen_at timestamptz;
alter table public.app_sessions add column if not exists device_label text;
alter table public.app_sessions add column if not exists ip_address inet;
alter table public.app_sessions add column if not exists user_agent text;

-- Tenant Identity policy vocabulary: session_duration_hours / allowed_email_domains.

alter table public.angelcare360_operator_tenant_role_templates enable row level security;
alter table public.angelcare360_operator_tenant_access_accounts enable row level security;
alter table public.angelcare360_operator_tenant_admin_invitations enable row level security;
alter table public.angelcare360_operator_tenant_access_scopes enable row level security;
alter table public.angelcare360_operator_tenant_access_events enable row level security;
alter table public.angelcare360_operator_tenant_password_resets enable row level security;
alter table public.angelcare360_operator_tenant_support_access_sessions enable row level security;
alter table public.angelcare360_operator_tenant_owner_transfers enable row level security;

alter table public.angelcare360_operator_tenant_role_templates force row level security;
alter table public.angelcare360_operator_tenant_access_accounts force row level security;
alter table public.angelcare360_operator_tenant_admin_invitations force row level security;
alter table public.angelcare360_operator_tenant_access_scopes force row level security;
alter table public.angelcare360_operator_tenant_access_events force row level security;
alter table public.angelcare360_operator_tenant_password_resets force row level security;
alter table public.angelcare360_operator_tenant_support_access_sessions force row level security;
alter table public.angelcare360_operator_tenant_owner_transfers force row level security;

revoke all on public.angelcare360_operator_tenant_role_templates from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_access_accounts from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_admin_invitations from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_access_scopes from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_access_events from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_password_resets from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_support_access_sessions from anon, authenticated;
revoke all on public.angelcare360_operator_tenant_owner_transfers from anon, authenticated;

grant all on public.angelcare360_operator_tenant_role_templates to service_role;
grant all on public.angelcare360_operator_tenant_access_accounts to service_role;
grant all on public.angelcare360_operator_tenant_admin_invitations to service_role;
grant all on public.angelcare360_operator_tenant_access_scopes to service_role;
grant all on public.angelcare360_operator_tenant_access_events to service_role;
grant all on public.angelcare360_operator_tenant_password_resets to service_role;
grant all on public.angelcare360_operator_tenant_support_access_sessions to service_role;
grant all on public.angelcare360_operator_tenant_owner_transfers to service_role;

commit;
