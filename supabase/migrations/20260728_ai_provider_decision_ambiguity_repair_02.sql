begin;

-- AC CAPITAL OS Runtime Truth Repair 02
-- Resolves PL/pgSQL variable/column ambiguity inside the governed AI policy chain.

do $repair$
declare
  fn record;
  repaired text;
  target_count integer := 0;
  repaired_count integer := 0;
begin
  for fn in
    select
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_args,
      pg_get_functiondef(p.oid) as function_def
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    join pg_language l
      on l.oid = p.prolang
    where n.nspname = 'public'
      and l.lanname = 'plpgsql'
      and p.proname like 'ai_provider_%'
      and pg_get_functiondef(p.oid) ilike '%decision%'
      and (
        p.proname in (
          'ai_provider_preflight_governed_request',
          'ai_provider_begin_governed_request'
        )
        or pg_get_functiondef(p.oid) ilike '%ai_provider_command_policies%'
        or pg_get_functiondef(p.oid) ilike '%ai_provider_governed_requests%'
      )
  loop
    target_count := target_count + 1;

    if fn.function_def ilike '%#variable_conflict use_column%' then
      continue;
    end if;

    repaired := replace(
      fn.function_def,
      'AS $function$',
      'AS $function$' || E'\n#variable_conflict use_column'
    );

    if repaired = fn.function_def then
      repaired := regexp_replace(
        fn.function_def,
        E'(AS[[:space:]]+\\$[A-Za-z0-9_]*\\$)',
        E'\\1\n#variable_conflict use_column',
        'i'
      );
    end if;

    if repaired = fn.function_def then
      raise exception
        'AI_PROVIDER_FUNCTION_BODY_MARKER_NOT_FOUND: %(%)',
        fn.proname,
        fn.identity_args;
    end if;

    execute repaired;
    repaired_count := repaired_count + 1;
  end loop;

  if target_count = 0 then
    raise exception 'AI_PROVIDER_DECISION_REPAIR_TARGET_NOT_FOUND';
  end if;

  raise notice
    'AI provider decision repair inspected % function(s) and updated % function(s).',
    target_count,
    repaired_count;
end
$repair$;

do $verify$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    join pg_language l
      on l.oid = p.prolang
    where n.nspname = 'public'
      and l.lanname = 'plpgsql'
      and p.proname like 'ai_provider_%'
      and pg_get_functiondef(p.oid) ilike '%decision%'
      and (
        p.proname in (
          'ai_provider_preflight_governed_request',
          'ai_provider_begin_governed_request'
        )
        or pg_get_functiondef(p.oid) ilike '%ai_provider_command_policies%'
        or pg_get_functiondef(p.oid) ilike '%ai_provider_governed_requests%'
      )
      and pg_get_functiondef(p.oid)
          not ilike '%#variable_conflict use_column%'
  ) then
    raise exception 'AI_PROVIDER_DECISION_AMBIGUITY_REPAIR_INCOMPLETE';
  end if;
end
$verify$;

commit;
