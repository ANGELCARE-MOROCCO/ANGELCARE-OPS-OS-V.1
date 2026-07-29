begin;

create extension if not exists pgcrypto;

create table if not exists public.ac_capital_command_activity (
  id uuid primary key default gen_random_uuid(),
  client_action_id text not null unique,
  title text not null,
  message text not null default '',
  status text not null check (
    status in (
      'running',
      'awaiting-approval',
      'completed',
      'completed-with-warnings',
      'blocked',
      'failed',
      'cancelled'
    )
  ),
  workspace_key text not null,
  route text not null,
  stage text not null default 'recorded',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  action_href text,
  audit_ref text,
  affected_records integer,
  detail_json jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ac_capital_command_activity_started_idx
  on public.ac_capital_command_activity(started_at desc);

create index if not exists ac_capital_command_activity_workspace_idx
  on public.ac_capital_command_activity(workspace_key, started_at desc);

create index if not exists ac_capital_command_activity_status_idx
  on public.ac_capital_command_activity(status, started_at desc);

alter table public.ac_capital_command_activity enable row level security;

drop policy if exists ac_capital_command_activity_authenticated_read
  on public.ac_capital_command_activity;
create policy ac_capital_command_activity_authenticated_read
  on public.ac_capital_command_activity
  for select
  using (auth.role() in ('authenticated', 'service_role'));

drop policy if exists ac_capital_command_activity_authenticated_write
  on public.ac_capital_command_activity;
create policy ac_capital_command_activity_authenticated_write
  on public.ac_capital_command_activity
  for all
  using (auth.role() in ('authenticated', 'service_role'))
  with check (auth.role() in ('authenticated', 'service_role'));

-- Compatibility repair for the policy decision ambiguity observed in the live governor.
-- Only functions whose source contains the exact ambiguous pattern are replaced.
do $repair$
declare
  fn record;
  repaired text;
begin
  for fn in
    select
      p.oid,
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_args,
      pg_get_functiondef(p.oid) as function_def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname ilike '%provider%'
        or p.proname ilike '%govern%'
        or p.proname ilike '%policy%'
      )
      and pg_get_functiondef(p.oid) ilike '%decision%'
  loop
    repaired := fn.function_def;

    -- Repair only the known PL/pgSQL ambiguity form: a local output variable named
    -- decision conflicting with a selected table column.
    repaired := regexp_replace(
      repaired,
      'select[[:space:]]+decision([[:space:]]+into[[:space:]]+decision)',
      'select policy_row.decision\1',
      'gi'
    );

    repaired := regexp_replace(
      repaired,
      'from[[:space:]]+public\.ai_provider_command_policies([[:space:]]+where)',
      'from public.ai_provider_command_policies policy_row\1',
      'gi'
    );

    if repaired is distinct from fn.function_def then
      execute repaired;
    end if;
  end loop;
end
$repair$;

commit;
