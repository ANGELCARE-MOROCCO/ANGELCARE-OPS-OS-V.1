-- TrainingHub smoke/test/demo partner hard delete v2
-- Run this once in Supabase SQL editor.
-- Purpose: permanently delete smoke/test/demo partner organizations and their linked rows.
-- Safety: refuses non-smoke/non-test/non-demo organizations unless p_allow_non_smoke = true.

create or replace function public.traininghub_force_delete_partner_v2(
  p_organization_id text,
  p_allow_non_smoke boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org record;
  v_haystack text;
  v_is_smoke boolean := false;
  v_pass integer;
  r record;
  v_sql text;
  v_deleted integer := 0;
  v_total_deleted integer := 0;
  v_deleted_log jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_parent_table text;
begin
  select *
    into v_org
    from public.core_organizations
   where id::text = p_organization_id
   limit 1;

  if not found then
    return jsonb_build_object(
      'ok', true,
      'alreadyDeleted', true,
      'organizationId', p_organization_id,
      'message', 'Organization already deleted or not found.'
    );
  end if;

  v_haystack := lower(
    coalesce(v_org.name::text, '') || ' ' ||
    coalesce(v_org.legal_name::text, '') || ' ' ||
    coalesce(v_org.display_name::text, '') || ' ' ||
    coalesce(v_org.email::text, '') || ' ' ||
    coalesce(v_org.primary_contact_email::text, '') || ' ' ||
    coalesce(v_org.billing_email::text, '') || ' ' ||
    coalesce(v_org.metadata::text, '')
  );

  v_is_smoke := (
    v_haystack like '%smoke%' or
    v_haystack like '%test%' or
    v_haystack like '%demo%' or
    v_haystack like '%sandbox%'
  );

  if not v_is_smoke and not p_allow_non_smoke then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_SMOKE_REFUSED',
      'organizationId', p_organization_id,
      'organizationName', coalesce(v_org.name::text, v_org.legal_name::text, v_org.display_name::text, p_organization_id),
      'message', 'Hard delete refused: this partner is not detected as smoke/test/demo. Archive/suspend instead or call with p_allow_non_smoke=true.'
    );
  end if;

  -- Multiple passes allow deleting leaf rows first, then parent rows.
  for v_pass in 1..10 loop

    -- Delete rows that reference commercial/delivery/proof rows linked to this organization.
    for r in
      select table_schema, table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and column_name in (
          'proposal_id','offer_id','order_id','invoice_id','subscription_id','account_id',
          'credit_id','training_credit_id','session_id','participant_id','certificate_id',
          'document_id','request_id','membership_id','role_assignment_id'
        )
      order by table_name, column_name
    loop
      v_parent_table :=
        case
          when r.column_name in ('proposal_id','offer_id') then 'bill_proposals'
          when r.column_name = 'order_id' then 'bill_orders'
          when r.column_name = 'invoice_id' then 'bill_invoices'
          when r.column_name = 'subscription_id' then 'bill_subscriptions'
          when r.column_name = 'account_id' then 'bill_accounts'
          when r.column_name in ('credit_id','training_credit_id') then 'bill_training_credits'
          when r.column_name = 'session_id' then 'trn_sessions'
          when r.column_name = 'participant_id' then 'trn_session_participants'
          when r.column_name = 'certificate_id' then 'trn_certificates'
          when r.column_name = 'document_id' then 'partner_documents'
          when r.column_name = 'request_id' then 'partner_requests'
          when r.column_name = 'membership_id' then 'core_memberships'
          when r.column_name = 'role_assignment_id' then 'authz_user_role_assignments'
          else null
        end;

      if v_parent_table is not null and to_regclass('public.' || v_parent_table) is not null then
        begin
          v_sql := format(
            'delete from %I.%I where %I::text in (select id::text from public.%I where organization_id::text = $1)',
            r.table_schema, r.table_name, r.column_name, v_parent_table
          );
          execute v_sql using p_organization_id;
          get diagnostics v_deleted = row_count;
          if v_deleted > 0 then
            v_total_deleted := v_total_deleted + v_deleted;
            v_deleted_log := v_deleted_log || jsonb_build_object('pass', v_pass, 'table', r.table_name, 'column', r.column_name, 'deleted', v_deleted, 'via', v_parent_table || '.organization_id');
          end if;
        exception when others then
          begin
            v_sql := format(
              'delete from %I.%I where %I::text in (select id::text from public.%I where partner_id::text = $1)',
              r.table_schema, r.table_name, r.column_name, v_parent_table
            );
            execute v_sql using p_organization_id;
            get diagnostics v_deleted = row_count;
            if v_deleted > 0 then
              v_total_deleted := v_total_deleted + v_deleted;
              v_deleted_log := v_deleted_log || jsonb_build_object('pass', v_pass, 'table', r.table_name, 'column', r.column_name, 'deleted', v_deleted, 'via', v_parent_table || '.partner_id');
            end if;
          exception when others then
            v_errors := v_errors || jsonb_build_object('pass', v_pass, 'table', r.table_name, 'column', r.column_name, 'error', SQLERRM);
          end;
        end;
      end if;
    end loop;

    -- Delete any row in any table that directly carries this org id.
    for r in
      select table_schema, table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name <> 'core_organizations'
        and column_name in (
          'organization_id','partner_id','org_id','tenant_id','client_organization_id',
          'school_id','institution_id','partner_organization_id'
        )
      order by table_name, column_name
    loop
      begin
        v_sql := format('delete from %I.%I where %I::text = $1', r.table_schema, r.table_name, r.column_name);
        execute v_sql using p_organization_id;
        get diagnostics v_deleted = row_count;
        if v_deleted > 0 then
          v_total_deleted := v_total_deleted + v_deleted;
          v_deleted_log := v_deleted_log || jsonb_build_object('pass', v_pass, 'table', r.table_name, 'column', r.column_name, 'deleted', v_deleted, 'via', 'direct_org_column');
        end if;
      exception when others then
        v_errors := v_errors || jsonb_build_object('pass', v_pass, 'table', r.table_name, 'column', r.column_name, 'error', SQLERRM);
      end;
    end loop;

  end loop;

  begin
    delete from public.core_organizations where id::text = p_organization_id;
    get diagnostics v_deleted = row_count;
    v_total_deleted := v_total_deleted + v_deleted;
    v_deleted_log := v_deleted_log || jsonb_build_object('table', 'core_organizations', 'column', 'id', 'deleted', v_deleted);
  exception when others then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_DELETE_BLOCKED',
      'organizationId', p_organization_id,
      'organizationName', coalesce(v_org.name::text, v_org.legal_name::text, v_org.display_name::text, p_organization_id),
      'isSmoke', v_is_smoke,
      'deletedTotal', v_total_deleted,
      'deletedLog', v_deleted_log,
      'errors', v_errors,
      'finalError', SQLERRM,
      'message', 'Organization still blocked by FK/reference after dynamic cleanup. Check finalError and errors.'
    );
  end;

  return jsonb_build_object(
    'ok', true,
    'organizationId', p_organization_id,
    'organizationName', coalesce(v_org.name::text, v_org.legal_name::text, v_org.display_name::text, p_organization_id),
    'isSmoke', v_is_smoke,
    'deletedTotal', v_total_deleted,
    'deletedLog', v_deleted_log,
    'errors', v_errors,
    'message', 'Smoke/test/demo partner permanently deleted.'
  );
end;
$$;

grant execute on function public.traininghub_force_delete_partner_v2(text, boolean) to authenticated;
grant execute on function public.traininghub_force_delete_partner_v2(text, boolean) to service_role;
