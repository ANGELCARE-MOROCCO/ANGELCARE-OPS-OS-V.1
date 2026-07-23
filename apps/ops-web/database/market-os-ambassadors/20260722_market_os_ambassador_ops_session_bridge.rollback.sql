-- Preferred rollback: restore the previous application code and retain this additive schema.
-- Destructive cleanup is guarded and refuses to run while any OpsOS-linked actor exists.
begin;

do $$
begin
  if coalesce(current_setting('app.ambassador_session_bridge_allow_destructive_rollback', true), '') <> 'true' then
    raise exception 'Destructive bridge rollback blocked. Set app.ambassador_session_bridge_allow_destructive_rollback=true only after approval.';
  end if;

  if exists (
    select 1 from public.market_os_ambassador_actor_roles where app_user_id is not null
  ) then
    raise exception 'Destructive bridge rollback blocked: OpsOS-linked Ambassador actor rows still exist. Revoke/export/remove them explicitly first.';
  end if;
end $$;

drop index if exists public.idx_market_os_ambassador_actor_app_user_lookup;
drop index if exists public.uq_market_os_ambassador_actor_app_user_active_scope;
drop index if exists public.uq_market_os_ambassador_actor_app_user_role;

alter table public.market_os_ambassador_actor_roles
  drop constraint if exists market_os_ambassador_actor_identity_required;
alter table public.market_os_ambassador_actor_roles
  drop constraint if exists market_os_ambassador_actor_roles_app_user_id_fkey;
alter table public.market_os_ambassador_actor_roles
  drop column if exists app_user_id;

-- This succeeds only when every remaining actor is backed by Supabase Auth.
alter table public.market_os_ambassador_actor_roles
  alter column auth_user_id set not null;

commit;
