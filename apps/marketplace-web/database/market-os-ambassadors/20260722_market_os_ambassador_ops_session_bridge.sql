-- ANGELCARE Market OS Ambassadors — OpsOS Session Actor Bridge
-- Additive production migration. No user is auto-granted by this migration.
begin;

-- Fail early if the required identity and Ambassador hardening tables are absent.
do $$
begin
  if to_regclass('public.app_sessions') is null then
    raise exception 'Required table public.app_sessions is missing';
  end if;
  if to_regclass('public.app_users') is null then
    raise exception 'Required table public.app_users is missing';
  end if;
  if to_regclass('public.market_os_ambassador_actor_roles') is null then
    raise exception 'Apply the Ambassador production-hardening migration first';
  end if;
  if to_regclass('public.market_os_ambassador_role_permissions') is null then
    raise exception 'Required table public.market_os_ambassador_role_permissions is missing';
  end if;
end $$;

-- Preserve the existing Supabase-auth identity while allowing a reviewed OpsOS app user identity.
alter table public.market_os_ambassador_actor_roles
  add column if not exists app_user_id uuid;

alter table public.market_os_ambassador_actor_roles
  alter column auth_user_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.market_os_ambassador_actor_roles'::regclass
      and conname = 'market_os_ambassador_actor_roles_app_user_id_fkey'
  ) then
    alter table public.market_os_ambassador_actor_roles
      add constraint market_os_ambassador_actor_roles_app_user_id_fkey
      foreign key (app_user_id) references public.app_users(id) on delete cascade not valid;
  end if;
end $$;

alter table public.market_os_ambassador_actor_roles
  validate constraint market_os_ambassador_actor_roles_app_user_id_fkey;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.market_os_ambassador_actor_roles'::regclass
      and conname = 'market_os_ambassador_actor_identity_required'
  ) then
    alter table public.market_os_ambassador_actor_roles
      add constraint market_os_ambassador_actor_identity_required
      check (auth_user_id is not null or app_user_id is not null) not valid;
  end if;
end $$;

alter table public.market_os_ambassador_actor_roles
  validate constraint market_os_ambassador_actor_identity_required;

-- One reviewed role grant per OpsOS user/scope/role and only one active role per scope.
create unique index if not exists uq_market_os_ambassador_actor_app_user_role
  on public.market_os_ambassador_actor_roles(app_user_id, tenant_id, organization_id, role_key)
  where app_user_id is not null;

create unique index if not exists uq_market_os_ambassador_actor_app_user_active_scope
  on public.market_os_ambassador_actor_roles(app_user_id, tenant_id, organization_id)
  where app_user_id is not null and status = 'active';

create index if not exists idx_market_os_ambassador_actor_app_user_lookup
  on public.market_os_ambassador_actor_roles(app_user_id, status)
  where app_user_id is not null;

-- Keep the canonical administrator role available without inferring it from an OpsOS role.
insert into public.market_os_ambassador_role_permissions(role_key, permission_key, enabled)
values ('ambassador_admin', '*', true)
on conflict (role_key, permission_key)
do update set enabled = true, updated_at = now();

comment on column public.market_os_ambassador_actor_roles.app_user_id is
  'Explicit link to an authenticated AngelCare OpsOS app_users identity. Presence never implies a role; a reviewed actor-role row is required.';
comment on constraint market_os_ambassador_actor_identity_required on public.market_os_ambassador_actor_roles is
  'Every Ambassador actor role must be backed by Supabase Auth, an OpsOS app user, or both.';

commit;
