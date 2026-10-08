begin;

-- Depends on 20260903_sanila_master_demo_foundation.sql and the existing app RBAC tables.
alter table public.sanila_demo_access_grants
  add column if not exists pin_lookup_digest text;

create unique index if not exists sanila_demo_grants_pin_lookup_idx
  on public.sanila_demo_access_grants(config_id, pin_lookup_digest)
  where pin_lookup_digest is not null and status <> 'revoked';

create table if not exists public.sanila_demo_pin_attempts (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  fingerprint_hash text not null,
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(config_id, fingerprint_hash)
);

create index if not exists sanila_demo_pin_attempts_lock_idx
  on public.sanila_demo_pin_attempts(config_id, locked_until)
  where locked_until is not null;

create or replace function public.sanila_register_demo_pin_failure(p_config_id uuid, p_fingerprint_hash text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.sanila_demo_pin_attempts%rowtype; current_attempts integer;
begin
  if length(coalesce(p_fingerprint_hash,'')) <> 64 then raise exception 'Invalid demo attempt fingerprint'; end if;
  insert into public.sanila_demo_pin_attempts(config_id,fingerprint_hash,attempts,window_started_at,last_attempt_at)
  values(p_config_id,p_fingerprint_hash,1,now(),now())
  on conflict(config_id,fingerprint_hash) do update set
    attempts=case when sanila_demo_pin_attempts.window_started_at < now()-interval '15 minutes' then 1 else sanila_demo_pin_attempts.attempts+1 end,
    window_started_at=case when sanila_demo_pin_attempts.window_started_at < now()-interval '15 minutes' then now() else sanila_demo_pin_attempts.window_started_at end,
    locked_until=case when (case when sanila_demo_pin_attempts.window_started_at < now()-interval '15 minutes' then 1 else sanila_demo_pin_attempts.attempts+1 end)>=5 then now()+interval '15 minutes' else sanila_demo_pin_attempts.locked_until end,
    last_attempt_at=now()
  returning * into r;
  current_attempts:=r.attempts;
  return jsonb_build_object('attempts',current_attempts,'locked',r.locked_until is not null and r.locked_until>now(),'locked_until',r.locked_until);
end $$;

create or replace function public.sanila_clear_demo_pin_failures(p_config_id uuid, p_fingerprint_hash text)
returns void language sql security definer set search_path=public as $$
  delete from public.sanila_demo_pin_attempts where config_id=p_config_id and fingerprint_hash=p_fingerprint_hash
$$;

alter table public.sanila_demo_pin_attempts enable row level security;
revoke all on public.sanila_demo_pin_attempts from anon, authenticated;
grant all on public.sanila_demo_pin_attempts to service_role;
revoke all on function public.sanila_register_demo_pin_failure(uuid,text) from public, anon, authenticated;
revoke all on function public.sanila_clear_demo_pin_failures(uuid,text) from public, anon, authenticated;
grant execute on function public.sanila_register_demo_pin_failure(uuid,text) to service_role;
grant execute on function public.sanila_clear_demo_pin_failures(uuid,text) to service_role;

insert into public.app_permissions(code,label,module_key)
values
  ('operator.demo.environment.view','Voir le SANILA Master Demo','angelcare360-operator'),
  ('operator.demo.environment.manage','Administrer le SANILA Master Demo','angelcare360-operator')
on conflict(code) do update set label=excluded.label,module_key=excluded.module_key;

insert into public.app_role_permissions(role_id,permission_id)
select r.id,p.id from public.app_roles r cross join public.app_permissions p
where r.code in ('super_admin','operator_admin') and p.code in ('operator.demo.environment.view','operator.demo.environment.manage')
on conflict(role_id,permission_id) do nothing;

commit;
