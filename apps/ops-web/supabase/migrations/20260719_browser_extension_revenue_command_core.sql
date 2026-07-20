begin;
create extension if not exists pgcrypto;
create table if not exists public.browser_extension_access_profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  enabled boolean not null default false,
  access_version integer not null default 1,
  default_autonomy text not null default 'USER_CONFIRMATION' check (default_autonomy in ('READ_ONLY','SUGGEST_ONLY','USER_CONFIRMATION','MANAGER_APPROVAL','SAFE_AUTOMATION','BLOCKED')),
  valid_from timestamptz not null default now(), valid_until timestamptz,
  notes text, assigned_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.browser_extension_devices (
  id uuid primary key default gen_random_uuid(), installation_id text not null unique, user_id uuid not null references public.app_users(id) on delete cascade,
  extension_id text, device_name text not null, platform text, browser_version text, extension_version text, public_key text,
  release_channel text not null default 'pilot', status text not null default 'active' check(status in ('active','revoked','suspended')),
  paired_at timestamptz not null default now(), last_seen_at timestamptz, last_ip text, revoked_at timestamptz, revoked_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.browser_extension_pairing_codes (
  id uuid primary key default gen_random_uuid(), code_hash text not null unique, user_id uuid not null references public.app_users(id) on delete cascade,
  installation_id text not null, extension_id text, device_name text, platform text, browser_version text, extension_version text, public_key text,
  expires_at timestamptz not null, consumed_at timestamptz, created_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.browser_extension_refresh_tokens (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.browser_extension_devices(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade, token_hash text not null unique, expires_at timestamptz not null,
  rotated_from uuid references public.browser_extension_refresh_tokens(id) on delete set null, revoked_at timestamptz, created_at timestamptz not null default now(), last_used_at timestamptz
);
create table if not exists public.browser_extension_module_grants (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, module_key text not null, enabled boolean not null default true,
  access_level text not null default 'VIEW' check(access_level in ('NONE','VIEW','SUGGEST','CREATE','EXECUTE','APPROVE','ADMINISTER')),
  valid_from timestamptz not null default now(), valid_until timestamptz, assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,module_key)
);
create table if not exists public.browser_extension_submodule_grants (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, module_key text not null, submodule_key text not null, enabled boolean not null default true,
  access_level text not null default 'VIEW', assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,module_key,submodule_key)
);
create table if not exists public.browser_extension_capability_grants (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, module_key text not null, capability_key text not null, enabled boolean not null default true,
  access_level text not null default 'EXECUTE', assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,capability_key)
);
create table if not exists public.browser_extension_adapter_grants (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, adapter_key text not null, enabled boolean not null default true,
  permission_mode text not null default 'ON_DEMAND', assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,adapter_key)
);
create table if not exists public.browser_extension_data_scopes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, scope_key text not null, scope_value jsonb not null default '{}'::jsonb,
  assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,scope_key)
);
create table if not exists public.browser_extension_autonomy_rules (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, action_pattern text not null, mode text not null check(mode in ('READ_ONLY','SUGGEST_ONLY','USER_CONFIRMATION','MANAGER_APPROVAL','SAFE_AUTOMATION','BLOCKED')),
  priority integer not null default 0, enabled boolean not null default true, assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,action_pattern)
);
create table if not exists public.browser_extension_approval_rules (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, command_pattern text not null, approval_level text not null default 'manager', approver_role text,
  enabled boolean not null default true, assigned_by uuid references public.app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,command_pattern)
);
create table if not exists public.browser_extension_command_requests (
  id uuid primary key default gen_random_uuid(), request_id uuid not null default gen_random_uuid(), idempotency_key text not null, device_id uuid references public.browser_extension_devices(id) on delete set null,
  user_id uuid references public.app_users(id) on delete set null, module_key text not null, command_key text not null, source_adapter text, source_origin text, target_type text, target_id text,
  autonomy_mode text, approval_status text not null default 'not_required', execution_status text not null default 'prepared', payload_hash text, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), executed_at timestamptz, unique(user_id,idempotency_key)
);
create table if not exists public.browser_extension_command_results (
  id uuid primary key default gen_random_uuid(), command_request_id uuid not null references public.browser_extension_command_requests(id) on delete cascade,
  result text not null, result_payload jsonb not null default '{}'::jsonb, error_code text, created_at timestamptz not null default now()
);
create table if not exists public.browser_extension_access_changes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, previous_version integer, new_version integer not null,
  changed_by uuid references public.app_users(id) on delete set null, change_summary jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.browser_extension_audit_logs (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.app_users(id) on delete set null, device_id uuid references public.browser_extension_devices(id) on delete set null,
  event_type text not null, module_key text, command_key text, target_type text, target_id text, result text not null default 'ok', severity text not null default 'info', source_origin text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.browser_extension_release_channels (
  channel_key text primary key, version text not null, minimum_version text, mandatory boolean not null default false, release_notes text, package_url text, enabled boolean not null default true, updated_at timestamptz not null default now()
);
insert into public.browser_extension_release_channels(channel_key,version,minimum_version,mandatory,release_notes) values ('pilot','0.1.0','0.1.0',false,'Mega ZIP 1 secure runtime foundation') on conflict(channel_key) do update set version=excluded.version,minimum_version=excluded.minimum_version,release_notes=excluded.release_notes,updated_at=now();
create index if not exists browser_ext_device_user_idx on public.browser_extension_devices(user_id,status);
create index if not exists browser_ext_pairing_expiry_idx on public.browser_extension_pairing_codes(expires_at,consumed_at);
create index if not exists browser_ext_refresh_device_idx on public.browser_extension_refresh_tokens(device_id,expires_at);
create index if not exists browser_ext_audit_actor_idx on public.browser_extension_audit_logs(actor_user_id,created_at desc);
create index if not exists browser_ext_command_user_idx on public.browser_extension_command_requests(user_id,created_at desc);

create or replace function public.browser_extension_replace_user_access(p_user_id uuid,p_assigned_by uuid,p_payload jsonb)
returns integer language plpgsql security definer set search_path=public as $$
declare v_previous integer; v_next integer; v_enabled boolean; v_default text;
begin
  select access_version into v_previous from browser_extension_access_profiles where user_id=p_user_id for update;
  v_previous:=coalesce(v_previous,0); v_next:=v_previous+1;
  v_enabled:=coalesce((p_payload->>'enabled')::boolean,false); v_default:=coalesce(p_payload->>'defaultAutonomy','USER_CONFIRMATION');
  insert into browser_extension_access_profiles(user_id,enabled,access_version,default_autonomy,valid_until,notes,assigned_by,updated_at)
  values(p_user_id,v_enabled,v_next,v_default,nullif(p_payload->>'validUntil','')::timestamptz,p_payload->>'notes',p_assigned_by,now())
  on conflict(user_id) do update set enabled=excluded.enabled,access_version=excluded.access_version,default_autonomy=excluded.default_autonomy,valid_until=excluded.valid_until,notes=excluded.notes,assigned_by=excluded.assigned_by,updated_at=now();
  delete from browser_extension_module_grants where user_id=p_user_id; delete from browser_extension_submodule_grants where user_id=p_user_id; delete from browser_extension_capability_grants where user_id=p_user_id; delete from browser_extension_adapter_grants where user_id=p_user_id; delete from browser_extension_data_scopes where user_id=p_user_id; delete from browser_extension_autonomy_rules where user_id=p_user_id; delete from browser_extension_approval_rules where user_id=p_user_id;
  insert into browser_extension_module_grants(user_id,module_key,enabled,access_level,assigned_by) select p_user_id,x->>'key',true,coalesce(x->>'accessLevel','VIEW'),p_assigned_by from jsonb_array_elements(coalesce(p_payload->'modules','[]'::jsonb)) x;
  insert into browser_extension_submodule_grants(user_id,module_key,submodule_key,enabled,access_level,assigned_by) select p_user_id,x->>'moduleKey',x->>'key',true,coalesce(x->>'accessLevel','VIEW'),p_assigned_by from jsonb_array_elements(coalesce(p_payload->'submodules','[]'::jsonb)) x;
  insert into browser_extension_capability_grants(user_id,module_key,capability_key,enabled,access_level,assigned_by) select p_user_id,coalesce(x->>'moduleKey','revenue_b2b'),x->>'key',true,coalesce(x->>'accessLevel','EXECUTE'),p_assigned_by from jsonb_array_elements(coalesce(p_payload->'capabilities','[]'::jsonb)) x;
  insert into browser_extension_adapter_grants(user_id,adapter_key,enabled,permission_mode,assigned_by) select p_user_id,x->>'key',true,coalesce(x->>'permissionMode','ON_DEMAND'),p_assigned_by from jsonb_array_elements(coalesce(p_payload->'adapters','[]'::jsonb)) x;
  insert into browser_extension_data_scopes(user_id,scope_key,scope_value,assigned_by) select p_user_id,key,value,p_assigned_by from jsonb_each(coalesce(p_payload->'scopes','{}'::jsonb));
  insert into browser_extension_autonomy_rules(user_id,action_pattern,mode,priority,enabled,assigned_by) select p_user_id,x->>'actionPattern',x->>'mode',coalesce((x->>'priority')::integer,0),true,p_assigned_by from jsonb_array_elements(coalesce(p_payload->'autonomy','[]'::jsonb)) x;
  insert into browser_extension_approval_rules(user_id,command_pattern,approval_level,approver_role,enabled,assigned_by) select p_user_id,x->>'commandPattern',coalesce(x->>'approvalLevel','manager'),x->>'approverRole',true,p_assigned_by from jsonb_array_elements(coalesce(p_payload->'approvals','[]'::jsonb)) x;
  insert into browser_extension_access_changes(user_id,previous_version,new_version,changed_by,change_summary) values(p_user_id,v_previous,v_next,p_assigned_by,p_payload);
  return v_next;
end $$;

alter table public.browser_extension_access_profiles enable row level security; alter table public.browser_extension_devices enable row level security; alter table public.browser_extension_pairing_codes enable row level security; alter table public.browser_extension_refresh_tokens enable row level security; alter table public.browser_extension_module_grants enable row level security; alter table public.browser_extension_submodule_grants enable row level security; alter table public.browser_extension_capability_grants enable row level security; alter table public.browser_extension_adapter_grants enable row level security; alter table public.browser_extension_data_scopes enable row level security; alter table public.browser_extension_autonomy_rules enable row level security; alter table public.browser_extension_approval_rules enable row level security; alter table public.browser_extension_command_requests enable row level security; alter table public.browser_extension_command_results enable row level security; alter table public.browser_extension_access_changes enable row level security; alter table public.browser_extension_audit_logs enable row level security; alter table public.browser_extension_release_channels enable row level security;
revoke all on function public.browser_extension_replace_user_access(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.browser_extension_replace_user_access(uuid,uuid,jsonb) to service_role;
commit;
