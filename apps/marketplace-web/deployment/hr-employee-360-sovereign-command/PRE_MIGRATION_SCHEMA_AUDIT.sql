-- ANGELCARE HR Employee 360 — production preflight
-- Read-only. Run before the Employee 360 migration.

select
  n.nspname as schema_name,
  c.relname as relation_name,
  c.relkind,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    else c.relkind::text
  end as relation_type
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'hr_staff_profiles';

select
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'hr_staff_profiles'
  and column_name in (
    'id', 'tenant_id', 'organization_id', 'full_name',
    'employment_status', 'status', 'version', 'updated_at'
  )
order by ordinal_position;

select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on kcu.constraint_schema = tc.constraint_schema
 and kcu.constraint_name = tc.constraint_name
 and kcu.table_name = tc.table_name
where tc.table_schema = 'public'
  and tc.table_name = 'hr_staff_profiles'
order by tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- Hard stop if the canonical identity is not a UUID-backed table.
do $preflight$
declare
  v_relkind "char";
  v_id_type text;
begin
  select c.relkind
  into v_relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'hr_staff_profiles';

  if v_relkind is null then
    raise notice 'hr_staff_profiles is absent; the additive migration will create it.';
    return;
  end if;

  if v_relkind not in ('r', 'p') then
    raise exception
      'Employee 360 requires public.hr_staff_profiles to be a table; detected relkind=%',
      v_relkind;
  end if;

  select c.udt_name
  into v_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'hr_staff_profiles'
    and c.column_name = 'id';

  if v_id_type <> 'uuid' then
    raise exception
      'Employee 360 requires hr_staff_profiles.id uuid; detected %',
      coalesce(v_id_type, 'missing');
  end if;
end;
$preflight$;
