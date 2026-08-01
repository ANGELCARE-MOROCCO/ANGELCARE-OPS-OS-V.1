begin;

create extension if not exists pgcrypto;

do $angelcare_tenant_access_preflight$
declare
  missing_relations text[];
begin
  select array_agg(required_relation)
  into missing_relations
  from (values
    ('public.app_users'),
    ('public.app_sessions'),
    ('public.angelcare360_operator_clients'),
    ('public.angelcare360_operator_tenants'),
    ('public.angelcare360_schools'),
    ('public.angelcare360_permissions'),
    ('public.angelcare360_roles'),
    ('public.angelcare360_role_permissions'),
    ('public.angelcare360_user_roles')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if missing_relations is not null then
    raise exception 'Tenant Identity prerequisite relations missing: %', array_to_string(missing_relations, ', ');
  end if;
end
$angelcare_tenant_access_preflight$;

create table if not exists public.angelcare360_operator_tenant_role_templates (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  name text not null,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  denied_permissions jsonb not null default '[]'::jsonb,
  module_keys jsonb not null default '[]'::jsonb,
  require_mfa boolean not null default false,
  is_system boolean not null default true,
  status text not null default 'active' check (status in ('active','suspended','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_tenant_access_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  app_user_id uuid references public.app_users(id) on delete set null,
  membership_id uuid,
  school_user_role_id uuid references public.angelcare360_user_roles(id) on delete set null,
  school_id uuid references public.angelcare360_schools(id) on delete set null,
  organization_id uuid,
  campus_id uuid,
  full_name text not null,
  email text not null,
  phone text,
  job_title text,
  preferred_language text not null default 'fr',
  role_template text not null default 'school_admin',
  status text not null default 'draft' check (status in ('draft','invitation_pending','invited','activation_pending','active','locked','suspended','expired','revoked')),
  is_primary_owner boolean not null default false,
  scope_mode text not null default 'tenant' check (scope_mode in ('customer_group','institution','campus','tenant','custom')),
  module_keys jsonb not null default '[]'::jsonb,
  explicit_permissions jsonb not null default '[]'::jsonb,
  denied_permissions jsonb not null default '[]'::jsonb,
  security_policy jsonb not null default '{"require_mfa":false,"force_password_change":true,"session_duration_hours":12,"allowed_email_domains":[],"sensitive_action_approval":false}'::jsonb,
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  invited_at timestamptz,
  activated_at timestamptz,
  last_login_at timestamptz,
  last_security_event_at timestamptz,
  mfa_secret_encrypted text,
  mfa_enrolled_at timestamptz,
  mfa_last_verified_at timestamptz,
  mfa_recovery_codes jsonb not null default '[]'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create unique index if not exists angelcare360_operator_tenant_access_one_owner_idx
  on public.angelcare360_operator_tenant_access_accounts(tenant_id)
  where is_primary_owner = true and status not in ('revoked','expired');
create index if not exists angelcare360_operator_tenant_access_client_idx
  on public.angelcare360_operator_tenant_access_accounts(client_id, status);
create index if not exists angelcare360_operator_tenant_access_user_idx
  on public.angelcare360_operator_tenant_access_accounts(app_user_id)
  where app_user_id is not null;

create table if not exists public.angelcare360_operator_tenant_admin_invitations (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  status text not null default 'invited' check (status in ('draft','invited','opened','accepted','expired','cancelled','revoked')),
  delivery_status text not null default 'ready' check (delivery_status in ('ready','sent','failed','manual_link_ready')),
  expires_at timestamptz not null,
  sent_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists angelcare360_operator_tenant_admin_invites_account_idx
  on public.angelcare360_operator_tenant_admin_invitations(access_account_id, status, expires_at desc);

create table if not exists public.angelcare360_operator_tenant_access_scopes (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  scope_type text not null check (scope_type in ('customer_group','institution','campus','tenant','module','custom')),
  scope_id uuid,
  scope_label text not null,
  access_level text not null default 'manage' check (access_level in ('view','operate','manage','approve')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists angelcare360_operator_tenant_access_scopes_account_idx
  on public.angelcare360_operator_tenant_access_scopes(access_account_id, scope_type);

create table if not exists public.angelcare360_operator_tenant_access_events (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid references public.angelcare360_operator_tenant_access_accounts(id) on delete set null,
  client_id uuid references public.angelcare360_operator_clients(id) on delete set null,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  actor_user_id uuid references public.app_users(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','notice','warning','critical')),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists angelcare360_operator_tenant_access_events_lookup_idx
  on public.angelcare360_operator_tenant_access_events(tenant_id, created_at desc);

create table if not exists public.angelcare360_operator_tenant_password_resets (
  id uuid primary key default gen_random_uuid(),
  access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'requested' check (status in ('requested','opened','completed','expired','cancelled')),
  expires_at timestamptz not null,
  requested_by uuid references public.app_users(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.angelcare360_operator_tenant_support_access_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.angelcare360_operator_clients(id) on delete cascade,
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  operator_user_id uuid not null references public.app_users(id) on delete cascade,
  access_mode text not null default 'read_only' check (access_mode in ('read_only','guided_support','authorized_operate')),
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','active','ended','expired','revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  approved_by uuid references public.app_users(id) on delete set null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists angelcare360_operator_tenant_support_sessions_tenant_idx
  on public.angelcare360_operator_tenant_support_access_sessions(tenant_id, status, expires_at desc);

alter table public.app_sessions add column if not exists mfa_verified_at timestamptz;
alter table public.app_sessions add column if not exists mfa_challenge_at timestamptz;
alter table public.app_sessions add column if not exists device_label text;
alter table public.app_sessions add column if not exists ip_address text;
alter table public.app_sessions add column if not exists user_agent text;
alter table public.app_sessions add column if not exists last_seen_at timestamptz;

create table if not exists public.angelcare360_operator_tenant_owner_transfers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.angelcare360_operator_tenants(id) on delete cascade,
  from_access_account_id uuid references public.angelcare360_operator_tenant_access_accounts(id) on delete set null,
  to_access_account_id uuid not null references public.angelcare360_operator_tenant_access_accounts(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','approved','scheduled','completed','cancelled')),
  reason text not null,
  effective_at timestamptz,
  requested_by uuid references public.app_users(id) on delete set null,
  approved_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create or replace function public.angelcare360_operator_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger angelcare360_operator_tenant_role_templates_touch
before update on public.angelcare360_operator_tenant_role_templates
for each row execute function public.angelcare360_operator_touch_updated_at();

create or replace trigger angelcare360_operator_tenant_access_accounts_touch
before update on public.angelcare360_operator_tenant_access_accounts
for each row execute function public.angelcare360_operator_touch_updated_at();

insert into public.angelcare360_operator_tenant_role_templates
  (role_key, name, description, permissions, denied_permissions, module_keys, require_mfa, is_system, status)
values
  ('tenant_owner', 'Tenant Owner', 'Autorité principale du tenant avec gouvernance complète.', '["ac360.*","tenant.manage","users.manage","security.manage"]', '[]', '[]', true, true, 'active'),
  ('general_direction', 'Direction générale', 'Pilotage exécutif, lecture complète et approbations.', '["dashboard.view","reports.view","approvals.manage","users.view"]', '["security.impersonate"]', '[]', true, true, 'active'),
  ('school_admin', 'Administrateur établissement', 'Administration opérationnelle générale de l’établissement.', '["school.manage","people.manage","attendance.manage","communications.manage"]', '["billing.settings.manage"]', '[]', false, true, 'active'),
  ('finance_admin', 'Administrateur Finance', 'Factures, paiements, reçus, états et relances.', '["finance.*","reports.finance.view"]', '["payroll.manage","users.manage"]', '["finance","reports"]', true, true, 'active'),
  ('operations_admin', 'Administrateur Opérations', 'Présence, transport, incidents et opérations quotidiennes.', '["operations.*","attendance.*","transport.*","incidents.*"]', '["finance.manage","payroll.manage"]', '["attendance","transport","operations"]', false, true, 'active'),
  ('academic_admin', 'Administrateur Académique', 'Programmes, classes, matières, évaluations et calendrier.', '["academics.*","classes.*","timetable.*"]', '["finance.manage","users.manage"]', '["academics","administration"]', false, true, 'active'),
  ('hr_admin', 'Administrateur RH', 'Personnel, présence équipe et dossiers RH.', '["hr.*","staff.*","payroll.view"]', '["billing.manage","tenant.settings.manage"]', '["hr","payroll"]', true, true, 'active'),
  ('support_contact', 'Contact Support', 'Contact client habilité à suivre tickets et incidents.', '["support.create","support.view","incidents.view"]', '["tenant.manage","billing.manage"]', '["support"]', false, true, 'active'),
  ('auditor', 'Auditeur / Lecture seule', 'Lecture contrôlée, rapports et audit sans mutation.', '["*.view","audit.view","reports.view"]', '["*.manage","*.delete","*.approve"]', '[]', true, true, 'active'),
  ('custom', 'Rôle personnalisé', 'Rôle composé par AngelCare selon les permissions et exclusions choisies.', '[]', '[]', '[]', false, true, 'active')
on conflict (role_key) do update set
  name = excluded.name,
  description = excluded.description,
  permissions = excluded.permissions,
  denied_permissions = excluded.denied_permissions,
  module_keys = excluded.module_keys,
  require_mfa = excluded.require_mfa,
  status = excluded.status,
  updated_at = now();

alter table public.angelcare360_operator_tenant_role_templates enable row level security;
alter table public.angelcare360_operator_tenant_access_accounts enable row level security;
alter table public.angelcare360_operator_tenant_admin_invitations enable row level security;
alter table public.angelcare360_operator_tenant_access_scopes enable row level security;
alter table public.angelcare360_operator_tenant_access_events enable row level security;
alter table public.angelcare360_operator_tenant_password_resets enable row level security;
alter table public.angelcare360_operator_tenant_support_access_sessions enable row level security;
alter table public.angelcare360_operator_tenant_owner_transfers enable row level security;

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
