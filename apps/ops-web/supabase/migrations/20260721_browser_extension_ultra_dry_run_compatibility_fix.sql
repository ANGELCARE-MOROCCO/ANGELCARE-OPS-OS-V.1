begin;

create or replace function public.browser_extension_ultra_bridge_dry_run(
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_relation text;
  v_count bigint;
  v_source_counts jsonb := '{}'::jsonb;
  v_missing_sources text[] := array[]::text[];
  v_missing_targets text[] := array[]::text[];
  v_exact_matches bigint := 0;
  v_unmapped_accounts bigint := 0;
  v_open_conflicts bigint := 0;
  v_backfill_ready boolean := false;
begin
  foreach v_relation in array array[
    'b2b_prospects',
    'revenue_accounts',
    'revenue_prospects',
    'revenue_opportunities',
    'revenue_partnerships'
  ]
  loop
    if to_regclass('public.' || v_relation) is null then
      v_missing_sources := array_append(v_missing_sources, v_relation);
      v_source_counts :=
        v_source_counts || jsonb_build_object(v_relation, null);
    else
      execute format(
        'select count(*) from public.%I',
        v_relation
      )
      into v_count;

      v_source_counts :=
        v_source_counts || jsonb_build_object(v_relation, v_count);
    end if;
  end loop;

  foreach v_relation in array array[
    'browser_extension_b2b_opportunities',
    'browser_extension_b2b_partners'
  ]
  loop
    if to_regclass('public.' || v_relation) is null then
      v_missing_targets := array_append(v_missing_targets, v_relation);
    end if;
  end loop;

  if to_regclass('public.revenue_accounts') is not null
     and to_regclass('public.b2b_prospects') is not null
  then
    execute $query$
      select count(*)
      from public.revenue_accounts ra
      join public.b2b_prospects bp
        on (
          nullif(
            public.browser_extension_ultra_normalize(ra.website),
            ''
          ) is not null
          and public.browser_extension_ultra_normalize(ra.website)
              =
              public.browser_extension_ultra_normalize(bp.website)
        )
        or (
          public.browser_extension_ultra_normalize(ra.account_name)
              =
              public.browser_extension_ultra_normalize(bp.name)
          and public.browser_extension_ultra_normalize(ra.city)
              =
              public.browser_extension_ultra_normalize(bp.city)
        )
    $query$
    into v_exact_matches;

    execute $query$
      select count(*)
      from public.revenue_accounts ra
      where not exists (
        select 1
        from public.browser_extension_ultra_commercial_id_map m
        where m.source_system = 'revenue_command_center'
          and m.source_table = 'revenue_accounts'
          and m.source_id = ra.id
          and m.status = 'active'
      )
    $query$
    into v_unmapped_accounts;
  end if;

  select count(*)
  into v_open_conflicts
  from public.browser_extension_ultra_bridge_conflicts
  where status in ('open', 'reviewing');

  v_backfill_ready :=
    cardinality(v_missing_sources) = 0
    and cardinality(v_missing_targets) = 0;

  return jsonb_build_object(
    'generatedAt', now(),
    'actorId', p_actor_id,
    'sourceCounts', v_source_counts,
    'missingSources', to_jsonb(v_missing_sources),
    'missingTargets', to_jsonb(v_missing_targets),
    'exactAccountMatches', v_exact_matches,
    'unmappedRevenueAccounts', v_unmapped_accounts,
    'openConflicts', v_open_conflicts,
    'backfillReady', v_backfill_ready,
    'nextAction',
      case
        when cardinality(v_missing_sources) > 0 then
          'Reconcile the missing Revenue Command source tables before backfill.'
        when cardinality(v_missing_targets) > 0 then
          'Apply the missing Browser OS B2B prerequisite migrations before backfill.'
        else
          'Review conflicts and exact matches before approved backfill.'
      end
  );
end;
$function$;

revoke all
on function public.browser_extension_ultra_bridge_dry_run(uuid)
from public;

commit;
