-- CARELINK Mobile Login Contract Lockdown
-- Unifies OPS mobile access, Supabase Auth email, optional username alias, and mobile login resolution.

alter table public.carelink_agent_app_access
  add column if not exists login_identifier text null,
  add column if not exists username text null;

update public.carelink_agent_app_access
set
  login_identifier = lower(coalesce(nullif(login_identifier, ''), nullif(username, ''), nullif(email, ''))),
  username = lower(coalesce(nullif(username, ''), nullif(login_identifier, ''), nullif(email, ''))),
  email = lower(email)
where email is not null or login_identifier is not null or username is not null;

create index if not exists idx_carelink_agent_app_access_login_identifier_lower
  on public.carelink_agent_app_access(lower(login_identifier));

create index if not exists idx_carelink_agent_app_access_username_lower
  on public.carelink_agent_app_access(lower(username));

create index if not exists idx_carelink_agent_app_access_email_lower_r3
  on public.carelink_agent_app_access(lower(email));

create index if not exists idx_carelink_agent_app_access_auth_user_id_r3
  on public.carelink_agent_app_access(auth_user_id);
