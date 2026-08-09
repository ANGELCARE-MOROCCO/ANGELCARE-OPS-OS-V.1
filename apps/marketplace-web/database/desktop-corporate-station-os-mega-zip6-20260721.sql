-- ANGELCARE Desktop Mega ZIP 6 — Corporate Station OS 1.5.0
-- Additive only. Do not execute automatically from the patch package.
create extension if not exists pgcrypto;

create or replace function public.desktop_station_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create table if not exists public.desktop_station_browser_policies (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  default_action text not null default 'deny' check (default_action in ('allow','deny')),
  allowed_domains text[] not null default '{}', blocked_domains text[] not null default '{}',
  allowed_schemes text[] not null default array['https:'], allowed_private_hosts text[] not null default '{}',
  allow_google_search boolean not null default true, allow_gmail boolean not null default true,
  allow_microsoft_365 boolean not null default false, allow_popups boolean not null default false,
  allow_downloads boolean not null default true, download_confirmation_required boolean not null default true,
  allow_uploads boolean not null default true, allow_camera boolean not null default false,
  allow_microphone boolean not null default false, allow_notifications boolean not null default true,
  allow_clipboard_read boolean not null default false, allow_clipboard_write boolean not null default true,
  allow_printing boolean not null default false, allow_external_open boolean not null default false,
  maximum_download_bytes bigint not null default 262144000 check (maximum_download_bytes >= 0),
  blocked_extensions text[] not null default array['.exe','.msi','.bat','.cmd','.com','.scr','.ps1','.app','.dmg','.pkg'],
  permission_overrides jsonb not null default '{}', browser_data_retention jsonb not null default '{}',
  active boolean not null default true, created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.desktop_station_policies (
  id uuid primary key default gen_random_uuid(), browser_policy_id uuid references public.desktop_station_browser_policies(id) on delete set null,
  name text not null, description text, mode text not null default 'standard' check (mode in ('standard','focus','locked')),
  start_at_login boolean not null default false, kiosk_enforcement boolean not null default false,
  always_on_top boolean not null default false, confirm_before_quit boolean not null default true,
  restore_after_crash boolean not null default true, relock_after_restart boolean not null default true,
  relock_after_inactivity_minutes integer not null default 0 check (relock_after_inactivity_minutes between 0 and 1440),
  pin_required boolean not null default true, exit_reason_required boolean not null default false,
  offline_unlock_permitted boolean not null default true,
  failed_attempt_threshold integer not null default 5 check (failed_attempt_threshold between 1 and 20),
  lockout_duration_minutes integer not null default 15 check (lockout_duration_minutes between 1 and 1440),
  auto_relock_minutes integer not null default 15 check (auto_relock_minutes between 1 and 1440),
  restore_tabs boolean not null default true, maximum_tabs integer not null default 8 check (maximum_tabs between 2 and 50),
  clear_browser_data_on_logout boolean not null default false,
  browser_history_retention_days integer not null default 30 check (browser_history_retention_days between 0 and 365),
  security_flags jsonb not null default '{}', policy_version bigint not null default 1 check (policy_version > 0),
  active boolean not null default true, created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.desktop_station_policy_assignments (
  id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.desktop_station_policies(id) on delete cascade,
  target_type text not null check (target_type in ('device','installation','user','department','workspace','fleet')),
  target_id text not null, precedence integer not null default 100 check (precedence between 0 and 1000),
  active boolean not null default true, assigned_by uuid, assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(target_type,target_id)
);

create table if not exists public.desktop_station_unlock_credentials (
  id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.desktop_station_policies(id) on delete cascade,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete cascade,
  credential_type text not null default 'pin' check (credential_type in ('pin','administrator_code')),
  secret_hash text not null, salt text not null, hash_algorithm text not null default 'scrypt', work_factor jsonb not null default '{}',
  credential_version bigint not null, status text not null default 'active' check (status in ('active','expired','revoked')),
  expires_at timestamptz, failed_attempt_threshold integer not null default 5 check (failed_attempt_threshold between 1 and 20),
  offline_verifier_eligible boolean not null default true, created_by uuid, updated_by uuid, revoked_by uuid,
  revoked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.desktop_station_recovery_codes (
  id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.desktop_station_policies(id) on delete cascade,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete cascade,
  code_hash text not null, salt text not null, hash_algorithm text not null default 'scrypt', work_factor jsonb not null default '{}',
  status text not null default 'active' check (status in ('active','used','expired','revoked')),
  expires_at timestamptz, used_at timestamptz, used_by uuid, revoked_at timestamptz, revoked_by uuid,
  created_by uuid, created_at timestamptz not null default now(), unique(code_hash,policy_id)
);

create table if not exists public.desktop_station_unlock_attempts (
  id bigint generated by default as identity primary key,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null, user_id uuid,
  policy_id uuid references public.desktop_station_policies(id) on delete set null,
  credential_id uuid references public.desktop_station_unlock_credentials(id) on delete set null,
  recovery_code_id uuid references public.desktop_station_recovery_codes(id) on delete set null,
  method text not null, success boolean not null, reason text, online boolean not null default true,
  request_ip inet, user_agent text, desktop_version text, lockout_applied boolean not null default false,
  metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create table if not exists public.desktop_station_commands (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  policy_id uuid references public.desktop_station_policies(id) on delete set null,
  workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null,
  command_type text not null check (command_type in (
    'ENTER_STANDARD_MODE','ENTER_FOCUS_MODE','ENTER_LOCKED_MODE','LOCK_NOW','UNLOCK_TEMPORARILY','RELOCK',
    'OPEN_URL','OPEN_TAB_TEMPLATE','CLOSE_CORPORATE_TABS','CLOSE_SPECIFIC_TAB','REFRESH_STATION_POLICY',
    'RELOAD_ACTIVE_TAB','RESTART_BROWSER_RUNTIME','RESTART_DESKTOP_RUNTIME','CLEAR_CORPORATE_BROWSER_CACHE',
    'CLEAR_CORPORATE_BROWSER_DATA','REQUEST_STATION_DIAGNOSTICS','SHOW_ADMINISTRATOR_MESSAGE',
    'ROTATE_STATION_CREDENTIAL','PROVISION_OFFLINE_RECOVERY')),
  payload jsonb not null default '{}', reason text not null,
  status text not null default 'created' check (status in ('created','delivered','received','executing','completed','failed','expired','cancelled')),
  issued_by uuid not null, issued_at timestamptz not null default now(), expires_at timestamptz not null default (now()+interval '24 hours'),
  delivered_at timestamptz, received_at timestamptz, executing_at timestamptz, completed_at timestamptz,
  failed_at timestamptz, failure_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.desktop_station_events (
  id bigint generated by default as identity primary key,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null, user_id uuid,
  policy_id uuid references public.desktop_station_policies(id) on delete set null,
  command_id uuid references public.desktop_station_commands(id) on delete set null,
  event_type text not null, outcome text not null default 'recorded', severity text not null default 'informational' check (severity in ('informational','attention','high','critical')),
  reason text, url text, policy_version bigint, metadata jsonb not null default '{}', resolved_at timestamptz, resolved_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.desktop_station_tab_templates (
  id uuid primary key default gen_random_uuid(), title text not null, normalized_url text not null check (normalized_url ~ '^https://'),
  icon_metadata jsonb not null default '{}', position integer not null default 0, pinned boolean not null default false,
  mandatory boolean not null default false, allowed_modes text[] not null default array['standard','focus','locked'],
  target_types text[] not null default '{}', target_ids text[] not null default '{}', active boolean not null default true,
  created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.desktop_station_tab_sessions (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  user_id uuid, active_tab_type text, tab_count integer not null default 0 check (tab_count between 0 and 50),
  safe_tab_metadata jsonb not null default '[]', policy_version bigint, last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(device_id)
);

create table if not exists public.desktop_station_policy_versions (
  id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.desktop_station_policies(id) on delete cascade,
  version bigint not null check (version > 0), snapshot jsonb not null, created_by uuid, created_at timestamptz not null default now(),
  unique(policy_id,version)
);

create table if not exists public.desktop_station_security_events (
  id bigint generated by default as identity primary key,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null, user_id uuid,
  event_type text not null, severity text not null default 'attention' check (severity in ('informational','attention','high','critical')),
  title text not null, description text, metadata jsonb not null default '{}', resolved_at timestamptz, resolved_by uuid,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_desktop_devices add column if not exists current_workspace_id uuid references public.whatsapp_desktop_workspaces(id) on delete set null;
alter table public.whatsapp_desktop_devices add column if not exists station_mode text default 'standard' check (station_mode in ('standard','focus','locked'));
alter table public.whatsapp_desktop_devices add column if not exists station_required_mode text default 'standard' check (station_required_mode in ('standard','focus','locked'));
alter table public.whatsapp_desktop_devices add column if not exists station_kiosk_state boolean not null default false;
alter table public.whatsapp_desktop_devices add column if not exists station_active_tab_type text;
alter table public.whatsapp_desktop_devices add column if not exists station_tab_count integer not null default 0;
alter table public.whatsapp_desktop_devices add column if not exists station_policy_version bigint not null default 0;
alter table public.whatsapp_desktop_devices add column if not exists station_policy_synced_at timestamptz;
alter table public.whatsapp_desktop_devices add column if not exists station_browser_health text;
alter table public.whatsapp_desktop_devices add column if not exists station_unlock_state jsonb not null default '{}';
alter table public.whatsapp_desktop_devices add column if not exists station_failed_unlock_attempts integer not null default 0;
alter table public.whatsapp_desktop_devices add column if not exists station_lockout_until timestamptz;
alter table public.whatsapp_desktop_devices add column if not exists station_last_unlock_at timestamptz;

create index if not exists desktop_station_assignments_resolution_idx on public.desktop_station_policy_assignments(active,target_type,target_id,precedence desc);
create index if not exists desktop_station_commands_pending_idx on public.desktop_station_commands(device_id,status,expires_at);
create index if not exists desktop_station_events_device_idx on public.desktop_station_events(device_id,created_at desc);
create index if not exists desktop_station_unlock_attempts_device_idx on public.desktop_station_unlock_attempts(device_id,created_at desc);
create index if not exists desktop_station_templates_active_idx on public.desktop_station_tab_templates(active,position);

create or replace function public.desktop_station_assignment_precedence(p_target_type text)
returns integer language sql immutable as $$ select case p_target_type when 'device' then 600 when 'installation' then 550 when 'user' then 500 when 'department' then 350 when 'workspace' then 300 when 'fleet' then 100 else 0 end $$;

create or replace function public.desktop_station_effective_policy_id(p_device_id uuid,p_installation_id text,p_user_id text,p_department text,p_workspace_id text)
returns uuid language sql stable as $$
  select a.policy_id from public.desktop_station_policy_assignments a
  join public.desktop_station_policies p on p.id=a.policy_id and p.active
  where a.active and ((a.target_type='device' and a.target_id=p_device_id::text)
    or (a.target_type='installation' and a.target_id=p_installation_id)
    or (a.target_type='user' and a.target_id=p_user_id)
    or (a.target_type='department' and a.target_id=p_department)
    or (a.target_type='workspace' and a.target_id=p_workspace_id)
    or (a.target_type='fleet' and a.target_id='fleet'))
  order by a.precedence desc, a.updated_at desc limit 1
$$;

-- Secure defaults. The authenticated application uses permission-checked server routes; service_role performs mutations.
do $$ declare t text; begin
  foreach t in array array[
    'desktop_station_browser_policies','desktop_station_policies','desktop_station_policy_assignments',
    'desktop_station_unlock_credentials','desktop_station_recovery_codes','desktop_station_unlock_attempts',
    'desktop_station_commands','desktop_station_events','desktop_station_tab_templates','desktop_station_tab_sessions',
    'desktop_station_policy_versions','desktop_station_security_events'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    begin execute format('create policy %I on public.%I for all to service_role using (true) with check (true)',t||'_service_role_all',t); exception when duplicate_object then null; end;
  end loop;
end $$;

-- Operators may read non-secret operational policy metadata only.
do $$ begin
  begin create policy desktop_station_policies_authenticated_read on public.desktop_station_policies for select to authenticated using (active); exception when duplicate_object then null; end;
  begin create policy desktop_station_browser_policies_authenticated_read on public.desktop_station_browser_policies for select to authenticated using (active); exception when duplicate_object then null; end;
  begin create policy desktop_station_templates_authenticated_read on public.desktop_station_tab_templates for select to authenticated using (active); exception when duplicate_object then null; end;
exception when others then raise; end $$;

create or replace trigger desktop_station_browser_policies_touch before update on public.desktop_station_browser_policies for each row execute function public.desktop_station_touch_updated_at();
create or replace trigger desktop_station_policies_touch before update on public.desktop_station_policies for each row execute function public.desktop_station_touch_updated_at();
create or replace trigger desktop_station_assignments_touch before update on public.desktop_station_policy_assignments for each row execute function public.desktop_station_touch_updated_at();
create or replace trigger desktop_station_credentials_touch before update on public.desktop_station_unlock_credentials for each row execute function public.desktop_station_touch_updated_at();
create or replace trigger desktop_station_commands_touch before update on public.desktop_station_commands for each row execute function public.desktop_station_touch_updated_at();
create or replace trigger desktop_station_templates_touch before update on public.desktop_station_tab_templates for each row execute function public.desktop_station_touch_updated_at();
create or replace trigger desktop_station_tab_sessions_touch before update on public.desktop_station_tab_sessions for each row execute function public.desktop_station_touch_updated_at();

insert into public.desktop_station_browser_policies(name,description,default_action,allowed_domains,allow_google_search,allow_gmail,allow_notifications,allow_downloads,download_confirmation_required)
select 'Navigation Corporate ANGELCARE','Politique navigateur initiale Mega ZIP 6','deny',array['opsmanagement.angelcarehub.com','angelcarehub.com','google.com','www.google.com','mail.google.com','accounts.google.com'],true,true,true,true,true
where not exists(select 1 from public.desktop_station_browser_policies where name='Navigation Corporate ANGELCARE');

insert into public.desktop_station_policies(browser_policy_id,name,description,mode,start_at_login,restore_after_crash,relock_after_restart,pin_required,maximum_tabs,policy_version)
select b.id,'Poste Corporate Standard','Politique flotte initiale Mega ZIP 6','standard',false,true,true,true,8,1 from public.desktop_station_browser_policies b
where b.name='Navigation Corporate ANGELCARE' and not exists(select 1 from public.desktop_station_policies where name='Poste Corporate Standard');

insert into public.desktop_station_policy_assignments(policy_id,target_type,target_id,precedence,active)
select p.id,'fleet','fleet',100,true from public.desktop_station_policies p where p.name='Poste Corporate Standard'
on conflict(target_type,target_id) do nothing;
