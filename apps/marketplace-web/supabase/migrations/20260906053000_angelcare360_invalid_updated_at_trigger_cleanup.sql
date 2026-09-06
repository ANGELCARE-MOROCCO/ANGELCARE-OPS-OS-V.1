begin;

do $$
declare
  v_total integer;
  v_broken integer;
begin
  select count(*)
  into v_total
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal
    and n.nspname = 'public'
    and p.proname = 'angelcare360_touch_updated_at';

  select count(*)
  into v_broken
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal
    and n.nspname = 'public'
    and p.proname = 'angelcare360_touch_updated_at'
    and not exists (
      select 1
      from pg_attribute a
      where a.attrelid = c.oid
        and a.attname = 'updated_at'
        and a.attnum > 0
        and not a.attisdropped
    );

  if v_total <> 83 then
    raise exception
      'UPDATED_AT_TRIGGER_PRECONDITION_TOTAL_MISMATCH expected=83 actual=%',
      v_total;
  end if;

  if v_broken <> 3 then
    raise exception
      'UPDATED_AT_TRIGGER_PRECONDITION_BROKEN_MISMATCH expected=3 actual=%',
      v_broken;
  end if;

  if exists (
    select 1
    from (
      values
        (
          'angelcare360_admission_status_history',
          'trg_angelcare360_admission_status_history_updated_at'
        ),
        (
          'angelcare360_attendance_status_history',
          'trg_angelcare360_attendance_status_history_updated_at'
        ),
        (
          'angelcare360_audit_logs',
          'trg_angelcare360_audit_logs_updated_at'
        )
    ) expected(table_name, trigger_name)
    where not exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal
        and n.nspname = 'public'
        and c.relname = expected.table_name
        and t.tgname = expected.trigger_name
    )
  ) then
    raise exception 'EXPECTED_INVALID_UPDATED_AT_TRIGGER_MISSING';
  end if;
end
$$;

drop trigger if exists
  trg_angelcare360_admission_status_history_updated_at
  on public.angelcare360_admission_status_history;

drop trigger if exists
  trg_angelcare360_attendance_status_history_updated_at
  on public.angelcare360_attendance_status_history;

drop trigger if exists
  trg_angelcare360_audit_logs_updated_at
  on public.angelcare360_audit_logs;

do $$
declare
  v_total integer;
  v_broken integer;
begin
  select count(*)
  into v_total
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal
    and n.nspname = 'public'
    and p.proname = 'angelcare360_touch_updated_at';

  select count(*)
  into v_broken
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal
    and n.nspname = 'public'
    and p.proname = 'angelcare360_touch_updated_at'
    and not exists (
      select 1
      from pg_attribute a
      where a.attrelid = c.oid
        and a.attname = 'updated_at'
        and a.attnum > 0
        and not a.attisdropped
    );

  if v_total <> 80 then
    raise exception
      'UPDATED_AT_TRIGGER_POSTCONDITION_TOTAL_MISMATCH expected=80 actual=%',
      v_total;
  end if;

  if v_broken <> 0 then
    raise exception
      'UPDATED_AT_TRIGGER_POSTCONDITION_BROKEN expected=0 actual=%',
      v_broken;
  end if;
end
$$;

commit;
