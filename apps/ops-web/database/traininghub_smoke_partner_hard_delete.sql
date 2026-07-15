-- TrainingHub smoke/test partner permanent hard delete helper.
-- Run this once in Supabase SQL editor for the strongest FK-safe permanent deletion.
-- It dynamically deletes rows linked to the organization across known and discoverable tables.

create or replace function public.traininghub_delete_if_table_column_exists(
  p_table text,
  p_column text,
  p_value uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_count integer := 0;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table
      and column_name = p_column
  ) into v_exists;

  if not v_exists then
    return 0;
  end if;

  execute format('delete from public.%I where %I = $1', p_table, p_column) using p_value;
  get diagnostics v_count = row_count;
  return coalesce(v_count, 0);
exception when others then
  return 0;
end;
$$;

create or replace function public.traininghub_delete_child_ids_if_exists(
  p_child_table text,
  p_child_column text,
  p_parent_table text,
  p_parent_column text,
  p_value uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_exists boolean;
  v_parent_exists boolean;
  v_count integer := 0;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_child_table
      and column_name = p_child_column
  ) into v_child_exists;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_parent_table
      and column_name = p_parent_column
  ) into v_parent_exists;

  if not v_child_exists or not v_parent_exists then
    return 0;
  end if;

  execute format(
    'delete from public.%I where %I in (select id from public.%I where %I = $1)',
    p_child_table,
    p_child_column,
    p_parent_table,
    p_parent_column
  ) using p_value;

  get diagnostics v_count = row_count;
  return coalesce(v_count, 0);
exception when others then
  return 0;
end;
$$;

create or replace function public.traininghub_hard_delete_partner_cascade(
  p_org_id uuid,
  p_confirm_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org record;
  v_haystack text;
  v_is_smoke boolean;
  v_ops jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_total integer := 0;
  v_table record;
  v_fk record;
  v_pass integer;
  v_confirm text := coalesce(p_confirm_text, '');
  v_org_deleted boolean := false;
begin
  select * into v_org from public.core_organizations where id = p_org_id;

  if not found then
    return jsonb_build_object(
      'ok', true,
      'alreadyDeleted', true,
      'organizationId', p_org_id,
      'message', 'Organization already deleted.'
    );
  end if;

  v_haystack := lower(
    coalesce(v_org.name::text, '') || ' ' ||
    coalesce(v_org.legal_name::text, '') || ' ' ||
    coalesce(v_org.display_name::text, '') || ' ' ||
    coalesce(v_org.segment::text, '') || ' ' ||
    coalesce(v_org.organization_type::text, '') || ' ' ||
    coalesce(v_org.partner_type::text, '') || ' ' ||
    coalesce(v_org.metadata::text, '')
  );

  v_is_smoke := v_haystack like '%smoke%'
    or v_haystack like '%test%'
    or v_haystack like '%demo%'
    or coalesce((v_org.metadata ->> 'is_smoke')::boolean, false)
    or coalesce((v_org.metadata ->> 'smoke_test')::boolean, false)
    or coalesce((v_org.metadata ->> 'test')::boolean, false);

  if not v_is_smoke and v_confirm <> 'I_UNDERSTAND_DELETE_PARTNER_PERMANENTLY' then
    return jsonb_build_object(
      'ok', false,
      'blocked', true,
      'smokeSafe', false,
      'organizationId', p_org_id,
      'message', 'Permanent delete blocked because this organization is not detected as smoke/test/demo. Archive it or pass the explicit confirmation text.'
    );
  end if;

  -- Known child-of-child tables first. These are harmless when tables/columns do not exist.
  perform public.traininghub_delete_child_ids_if_exists('bill_invoice_lines', 'invoice_id', 'bill_invoices', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('bill_invoice_items', 'invoice_id', 'bill_invoices', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('bill_payment_allocations', 'invoice_id', 'bill_invoices', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('bill_order_lines', 'order_id', 'bill_orders', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('bill_order_items', 'order_id', 'bill_orders', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('bill_proposal_lines', 'proposal_id', 'bill_proposals', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('bill_proposal_items', 'proposal_id', 'bill_proposals', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('trn_session_participants', 'session_id', 'trn_sessions', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('trn_session_attendance', 'session_id', 'trn_sessions', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('trn_attendance', 'session_id', 'trn_sessions', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('trn_certificates', 'session_id', 'trn_sessions', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('partner_document_versions', 'document_id', 'partner_documents', 'organization_id', p_org_id);
  perform public.traininghub_delete_child_ids_if_exists('partner_document_files', 'document_id', 'partner_documents', 'organization_id', p_org_id);

  -- Multiple passes allow unknown direct/child relations to clear in later passes.
  for v_pass in 1..6 loop
    -- Delete from all public tables that expose direct org columns. Skip core_organizations until the end.
    for v_table in
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and column_name in ('organization_id', 'partner_id', 'org_id')
        and table_name <> 'core_organizations'
      order by table_name desc
    loop
      begin
        execute format('delete from public.%I where %I = $1', v_table.table_name, v_table.column_name) using p_org_id;
        get diagnostics v_count = row_count;
        if v_count > 0 then
          v_total := v_total + v_count;
          v_ops := v_ops || jsonb_build_array(jsonb_build_object('table', v_table.table_name, 'column', v_table.column_name, 'deleted', v_count, 'pass', v_pass));
        end if;
      exception when others then
        -- Some tables may still be blocked by their own children; next passes / known child deletes may clear them.
        null;
      end;
    end loop;

    -- Also handle actual FK columns referencing core_organizations(id), even when not named organization_id.
    for v_fk in
      select
        conrelid::regclass::text as table_name,
        a.attname as column_name
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
      where c.contype = 'f'
        and c.confrelid = 'public.core_organizations'::regclass
    loop
      if v_fk.table_name <> 'core_organizations' then
        begin
          execute format('delete from %s where %I = $1', v_fk.table_name, v_fk.column_name) using p_org_id;
          get diagnostics v_count = row_count;
          if v_count > 0 then
            v_total := v_total + v_count;
            v_ops := v_ops || jsonb_build_array(jsonb_build_object('table', v_fk.table_name, 'column', v_fk.column_name, 'deleted', v_count, 'pass', v_pass, 'source', 'fk_discovery'));
          end if;
        exception when others then
          null;
        end;
      end if;
    end loop;
  end loop;

  begin
    delete from public.core_organizations where id = p_org_id;
    get diagnostics v_count = row_count;
    v_org_deleted := v_count > 0;
  exception when others then
    v_org_deleted := false;
  end;

  if v_org_deleted then
    return jsonb_build_object(
      'ok', true,
      'hardDeleted', true,
      'smokeSafe', v_is_smoke,
      'organizationId', p_org_id,
      'organizationName', coalesce(v_org.name::text, v_org.legal_name::text, v_org.display_name::text),
      'deletedLinkedRows', v_total,
      'operations', v_ops,
      'message', 'Partner permanently deleted.'
    );
  end if;

  return jsonb_build_object(
    'ok', false,
    'hardDeleted', false,
    'smokeSafe', v_is_smoke,
    'organizationId', p_org_id,
    'organizationName', coalesce(v_org.name::text, v_org.legal_name::text, v_org.display_name::text),
    'deletedLinkedRows', v_total,
    'operations', v_ops,
    'message', 'Could not delete core_organizations row. A remaining FK relation exists; inspect dependencies.'
  );
end;
$$;

grant execute on function public.traininghub_delete_if_table_column_exists(text,text,uuid) to authenticated, service_role;
grant execute on function public.traininghub_delete_child_ids_if_exists(text,text,text,text,uuid) to authenticated, service_role;
grant execute on function public.traininghub_hard_delete_partner_cascade(uuid,text) to authenticated, service_role;
