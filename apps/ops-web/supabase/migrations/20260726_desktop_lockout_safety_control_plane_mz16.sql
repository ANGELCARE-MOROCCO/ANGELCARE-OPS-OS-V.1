-- ANGELCARE MZ16 — Desktop Lockout Safety Control Plane
-- Web/API/Supabase only. Installed Desktop clients are not modified.
-- Idempotent and phased for Supabase SQL Editor.

set statement_timeout = '10min';
set lock_timeout = '8s';

alter table public.desktop_station_policies
  add column if not exists locked_mode_safety_gate boolean not null default true,
  add column if not exists minimum_locked_desktop_version text not null default '1.7.4',
  add column if not exists emergency_standard_fallback boolean not null default true,
  add column if not exists relock_requires_acknowledgement boolean not null default true;

alter table public.whatsapp_desktop_devices
  add column if not exists lock_safety_status text not null default 'unknown'
    check (lock_safety_status in ('unknown','ready','unsafe_client','lockout','rescue_queued','rescued','rescue_failed')),
  add column if not exists last_lock_rescue_at timestamptz,
  add column if not exists last_lock_rescue_correlation_id uuid;

create table if not exists public.desktop_station_lock_rescue_runs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.whatsapp_desktop_devices(id) on delete cascade,
  scope text not null default 'device' check (scope in ('device','fleet')),
  status text not null default 'queued' check (status in ('queued','delivered','acknowledged','completed','partial','failed','cancelled')),
  correlation_id uuid not null,
  reason text not null,
  requested_by uuid,
  previous_policy_id uuid references public.desktop_station_policies(id) on delete set null,
  rescue_policy_id uuid references public.desktop_station_policies(id) on delete set null,
  previous_assignment jsonb not null default '{}'::jsonb,
  previous_device_state jsonb not null default '{}'::jsonb,
  command_ids jsonb not null default '[]'::jsonb,
  request_ip inet,
  user_agent text,
  completed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists desktop_station_lock_rescue_device_idx on public.desktop_station_lock_rescue_runs(device_id, created_at desc);
create index if not exists desktop_station_lock_rescue_correlation_idx on public.desktop_station_lock_rescue_runs(correlation_id);

alter table public.desktop_station_lock_rescue_runs enable row level security;

do $$ begin
  begin
    create policy desktop_station_lock_rescue_service_role_all
      on public.desktop_station_lock_rescue_runs
      for all to service_role
      using (true) with check (true);
  exception when duplicate_object then null;
  end;
end $$;

create or replace trigger desktop_station_lock_rescue_touch
before update on public.desktop_station_lock_rescue_runs
for each row execute function public.desktop_station_touch_updated_at();

update public.desktop_station_policies
set locked_mode_safety_gate = true,
    minimum_locked_desktop_version = coalesce(nullif(minimum_locked_desktop_version,''),'1.7.4'),
    emergency_standard_fallback = true,
    relock_requires_acknowledgement = true
where active = true;

update public.whatsapp_desktop_devices
set lock_safety_status = case
  when station_lockout_until is not null and station_lockout_until > now() then 'lockout'
  when desktop_version is null or desktop_version !~ '^[0-9]+\.[0-9]+\.[0-9]+' then 'unsafe_client'
  when split_part(desktop_version,'.',1)::integer > 1 then 'ready'
  when split_part(desktop_version,'.',1)::integer = 1 and split_part(desktop_version,'.',2)::integer > 7 then 'ready'
  when split_part(desktop_version,'.',1)::integer = 1 and split_part(desktop_version,'.',2)::integer = 7 and split_part(desktop_version,'.',3)::integer >= 4 then 'ready'
  else 'unsafe_client'
end;

comment on table public.desktop_station_lock_rescue_runs is
  'Operational evidence for per-device and fleet anti-lockout rescue actions from /whatsapp-os/admin.';
comment on column public.desktop_station_policies.locked_mode_safety_gate is
  'Prevents Corporate Locked assignment to clients below minimum_locked_desktop_version unless an explicit elevated override is supplied.';


create or replace function public.desktop_station_queue_lock_rescue_mz16(
  p_device_id uuid,
  p_actor_user_id uuid,
  p_reason text,
  p_scope text default 'device',
  p_request_ip text default null,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.whatsapp_desktop_devices%rowtype;
  v_policy_id uuid;
  v_previous_policy_id uuid;
  v_previous_assignment jsonb := '{}'::jsonb;
  v_correlation_id uuid := gen_random_uuid();
  v_run_id uuid;
  v_command_id uuid;
  v_command_ids jsonb := '[]'::jsonb;
  v_command_type text;
  v_payload jsonb;
  v_now timestamptz := now();
begin
  if coalesce(trim(p_reason),'') = '' then raise exception 'LOCK_RESCUE_REASON_REQUIRED'; end if;
  if p_scope not in ('device','fleet') then raise exception 'INVALID_LOCK_RESCUE_SCOPE'; end if;

  select * into v_device from public.whatsapp_desktop_devices where id = p_device_id for update;
  if not found then raise exception 'DEVICE_NOT_FOUND'; end if;

  select id into v_policy_id
  from public.desktop_station_policies
  where name = 'MZ16 — Mode sûr de récupération' and active = true
  order by updated_at desc limit 1;

  if v_policy_id is null then
    insert into public.desktop_station_policies(
      name,description,mode,start_at_login,kiosk_enforcement,always_on_top,confirm_before_quit,
      restore_after_crash,relock_after_restart,relock_after_inactivity_minutes,pin_required,
      exit_reason_required,offline_unlock_permitted,failed_attempt_threshold,lockout_duration_minutes,
      auto_relock_minutes,restore_tabs,maximum_tabs,maximum_ac_plus_tabs,ac_plus_enabled,
      ac_plus_allowed_modes,split_enabled,split_allowed_modes,split_modes,clear_browser_data_on_logout,
      browser_history_retention_days,security_flags,policy_version,active,created_by,updated_by,
      locked_mode_safety_gate,minimum_locked_desktop_version,emergency_standard_fallback,relock_requires_acknowledgement
    ) values (
      'MZ16 — Mode sûr de récupération',
      'Politique de secours anti-verrouillage. Standard, sans relock au redémarrage.',
      'standard',false,false,false,true,true,false,0,false,true,true,20,1,1440,true,8,6,true,
      array['standard','focus','locked'],true,array['standard','focus','locked'],array[2,3,4],false,30,
      jsonb_build_object('mz16_emergency_recovery',true,'minimum_locked_desktop_version','1.7.4'),
      1,true,p_actor_user_id,p_actor_user_id,true,'1.7.4',true,true
    ) returning id into v_policy_id;
  end if;

  select policy_id,to_jsonb(a) into v_previous_policy_id,v_previous_assignment
  from public.desktop_station_policy_assignments a
  where target_type='device' and target_id=p_device_id::text
  limit 1;

  insert into public.desktop_station_policy_assignments(policy_id,target_type,target_id,precedence,active,assigned_by,assigned_at)
  values(v_policy_id,'device',p_device_id::text,1000,true,p_actor_user_id,v_now)
  on conflict(target_type,target_id) do update set
    policy_id=excluded.policy_id,precedence=1000,active=true,assigned_by=excluded.assigned_by,assigned_at=excluded.assigned_at,updated_at=v_now;

  insert into public.whatsapp_desktop_device_governance_state(
    device_id,desired_state,desired_revision,desired_policy_id,desired_policy_version,desired_mode,
    desired_whatsapp_enabled,desired_ac_plus_enabled,desired_split_enabled,desired_maximum_tabs,
    last_command_correlation_id,reason,updated_by
  ) values (
    p_device_id,jsonb_build_object('station_mode','standard','emergency_lock_rescue',true,'minimum_desktop_version','1.7.4'),
    1,v_policy_id,1,'standard',true,true,true,8,v_correlation_id,p_reason,p_actor_user_id
  ) on conflict(device_id) do update set
    desired_state=coalesce(whatsapp_desktop_device_governance_state.desired_state,'{}'::jsonb) || excluded.desired_state,
    desired_revision=whatsapp_desktop_device_governance_state.desired_revision+1,
    desired_policy_id=v_policy_id,desired_policy_version=1,desired_mode='standard',
    desired_whatsapp_enabled=true,desired_ac_plus_enabled=true,desired_split_enabled=true,desired_maximum_tabs=8,
    last_command_correlation_id=v_correlation_id,reason=p_reason,updated_by=p_actor_user_id,updated_at=v_now;

  foreach v_command_type in array array['ENTER_STANDARD_MODE','UNLOCK_TEMPORARILY','REFRESH_STATION_POLICY','SHOW_ADMINISTRATOR_MESSAGE'] loop
    v_payload := case
      when v_command_type='UNLOCK_TEMPORARILY' then jsonb_build_object('minutes',1440,'dismiss_unlock_surface',true,'reset_lockout',true)
      when v_command_type='SHOW_ADMINISTRATOR_MESSAGE' then jsonb_build_object('message','Le poste a été libéré par l’administration ANGELCARE. Mode Standard de sécurité appliqué.')
      else '{}'::jsonb end;
    insert into public.desktop_station_commands(
      device_id,policy_id,workspace_id,command_type,payload,reason,status,issued_by,expires_at,
      correlation_id,priority,max_retries,acknowledgement_deadline
    ) values (
      p_device_id,v_policy_id,v_device.current_workspace_id,v_command_type,v_payload,p_reason,'created',p_actor_user_id,
      v_now+interval '24 hours',v_correlation_id,'critical',5,v_now+interval '5 minutes'
    ) returning id into v_command_id;
    v_command_ids := v_command_ids || jsonb_build_array(v_command_id);
  end loop;

  update public.whatsapp_desktop_devices set
    station_failed_unlock_attempts=0,station_lockout_until=null,station_required_mode='standard',
    synchronization_status='pending',last_lock_rescue_at=v_now,last_lock_rescue_correlation_id=v_correlation_id,
    lock_safety_status='rescue_queued'
  where id=p_device_id;

  insert into public.desktop_station_lock_rescue_runs(
    device_id,scope,status,correlation_id,reason,requested_by,previous_policy_id,rescue_policy_id,
    previous_assignment,previous_device_state,command_ids,request_ip,user_agent
  ) values (
    p_device_id,p_scope,'queued',v_correlation_id,p_reason,p_actor_user_id,v_previous_policy_id,v_policy_id,
    coalesce(v_previous_assignment,'{}'::jsonb),to_jsonb(v_device),v_command_ids,nullif(p_request_ip,'')::inet,p_user_agent
  ) returning id into v_run_id;

  return jsonb_build_object(
    'rescue_run_id',v_run_id,'device_id',p_device_id,'correlation_id',v_correlation_id,
    'command_ids',v_command_ids,'rescue_policy_id',v_policy_id,'previous_policy_id',v_previous_policy_id,
    'previous_assignment',coalesce(v_previous_assignment,'{}'::jsonb),'status','queued'
  );
end;
$$;

grant execute on function public.desktop_station_queue_lock_rescue_mz16(uuid,uuid,text,text,text,text) to service_role;

select
  to_regclass('public.desktop_station_lock_rescue_runs') is not null as rescue_runs_ready,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='whatsapp_desktop_devices' and column_name='lock_safety_status') as device_lock_safety_ready,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='desktop_station_policies' and column_name='locked_mode_safety_gate') as policy_gate_ready,
  'MZ16_DESKTOP_LOCKOUT_SAFETY_CONTROL_PLANE_APPLIED' as marker;
