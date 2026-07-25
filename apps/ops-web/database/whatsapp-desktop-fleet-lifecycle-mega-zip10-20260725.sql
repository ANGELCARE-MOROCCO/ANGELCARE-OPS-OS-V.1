begin;

alter table public.whatsapp_desktop_devices
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid,
  add column if not exists suspension_reason text,
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid,
  add column if not exists rejection_reason text;

create table if not exists public.whatsapp_desktop_device_purge_ledger (
  id uuid primary key default gen_random_uuid(),
  original_device_id uuid not null,
  installation_id text not null,
  device_name text not null,
  actor_user_id uuid,
  reason text not null,
  forced boolean not null default false,
  confirmation_name text not null,
  device_snapshot jsonb not null,
  workspace_access_snapshot jsonb not null default '[]'::jsonb,
  sessions_snapshot jsonb not null default '[]'::jsonb,
  commands_snapshot jsonb not null default '[]'::jsonb,
  heartbeats_snapshot jsonb not null default '[]'::jsonb,
  request_ip inet,
  user_agent text,
  purged_at timestamptz not null default now()
);

create index if not exists whatsapp_desktop_purge_ledger_installation_idx
  on public.whatsapp_desktop_device_purge_ledger(installation_id, purged_at desc);
create index if not exists whatsapp_desktop_purge_ledger_device_idx
  on public.whatsapp_desktop_device_purge_ledger(original_device_id, purged_at desc);

alter table public.whatsapp_desktop_device_purge_ledger enable row level security;

comment on table public.whatsapp_desktop_device_purge_ledger is
  'Immutable administrative snapshot retained after a governed permanent device deletion. Contains no WhatsApp cookies or message content.';

create or replace function public.whatsapp_desktop_purge_device(
  p_device_id uuid,
  p_actor_user_id uuid,
  p_reason text,
  p_forced boolean default false,
  p_request_ip inet default null,
  p_user_agent text default null,
  p_confirmation_name text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.whatsapp_desktop_devices%rowtype;
  v_ledger_id uuid;
  v_online boolean;
  v_workspace_access jsonb;
  v_sessions jsonb;
  v_commands jsonb;
  v_heartbeats jsonb;
begin
  select * into v_device
  from public.whatsapp_desktop_devices
  where id = p_device_id
  for update;

  if v_device.id is null then
    raise exception 'DEVICE_NOT_FOUND';
  end if;

  if coalesce(trim(p_reason), '') = '' or length(trim(p_reason)) < 8 then
    raise exception 'DELETION_REASON_REQUIRED';
  end if;

  if coalesce(p_confirmation_name, '') <> v_device.device_name then
    raise exception 'DEVICE_NAME_CONFIRMATION_MISMATCH';
  end if;

  v_online := v_device.last_heartbeat_at is not null
    and v_device.last_heartbeat_at > now() - interval '3 minutes';

  if v_online and not p_forced then
    raise exception 'ONLINE_DEVICE_REQUIRES_FORCE_PURGE';
  end if;

  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc), '[]'::jsonb)
    into v_workspace_access
  from public.whatsapp_desktop_device_workspace_access row_data
  where row_data.device_id = p_device_id;

  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.issued_at desc), '[]'::jsonb)
    into v_sessions
  from public.whatsapp_desktop_device_sessions row_data
  where row_data.device_id = p_device_id;

  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.issued_at desc), '[]'::jsonb)
    into v_commands
  from public.whatsapp_desktop_commands row_data
  where row_data.device_id = p_device_id;

  select coalesce(jsonb_agg(to_jsonb(row_data) order by row_data.received_at desc), '[]'::jsonb)
    into v_heartbeats
  from (
    select * from public.whatsapp_desktop_heartbeats
    where device_id = p_device_id
    order by received_at desc
    limit 250
  ) row_data;

  insert into public.whatsapp_desktop_device_purge_ledger (
    original_device_id,
    installation_id,
    device_name,
    actor_user_id,
    reason,
    forced,
    confirmation_name,
    device_snapshot,
    workspace_access_snapshot,
    sessions_snapshot,
    commands_snapshot,
    heartbeats_snapshot,
    request_ip,
    user_agent
  ) values (
    v_device.id,
    v_device.installation_id,
    v_device.device_name,
    p_actor_user_id,
    trim(p_reason),
    p_forced,
    p_confirmation_name,
    to_jsonb(v_device),
    v_workspace_access,
    v_sessions,
    v_commands,
    v_heartbeats,
    p_request_ip,
    left(p_user_agent, 1000)
  ) returning id into v_ledger_id;

  update public.whatsapp_desktop_device_sessions
     set status = 'revoked',
         revoked_at = now(),
         revoked_by = p_actor_user_id,
         revoke_reason = trim(p_reason)
   where device_id = p_device_id
     and status in ('active','grace');

  update public.whatsapp_desktop_commands
     set status = 'cancelled',
         failure_reason = 'Device permanently deleted: ' || trim(p_reason)
   where device_id = p_device_id
     and status in ('created','delivered','received','executing');

  update public.whatsapp_desktop_device_workspace_access
     set status = 'revoked',
         revoked_at = now(),
         revoked_by = p_actor_user_id,
         reason = trim(p_reason)
   where device_id = p_device_id;

  insert into public.whatsapp_desktop_audit_events (
    actor_user_id,
    target_user_id,
    device_id,
    action,
    reason,
    previous_state,
    new_state,
    request_ip,
    user_agent
  ) values (
    p_actor_user_id,
    v_device.current_user_id,
    p_device_id,
    case when p_forced then 'device.force_purged' else 'device.purged' end,
    trim(p_reason),
    to_jsonb(v_device),
    jsonb_build_object('purge_ledger_id', v_ledger_id, 'installation_id_released', v_device.installation_id),
    p_request_ip,
    left(p_user_agent, 1000)
  );

  delete from public.whatsapp_desktop_devices where id = p_device_id;

  return v_ledger_id;
end;
$$;

revoke all on function public.whatsapp_desktop_purge_device(uuid, uuid, text, boolean, inet, text, text) from public;
grant execute on function public.whatsapp_desktop_purge_device(uuid, uuid, text, boolean, inet, text, text) to service_role;

commit;
