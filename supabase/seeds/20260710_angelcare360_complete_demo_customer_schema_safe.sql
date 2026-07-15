-- AngelCare 360 v2 schema-safe demo customer seed
-- Runtime source of truth: live PostgreSQL table shape.
-- Uses pg_temp helper functions, jsonb_populate_record, and primary-key upserts.

begin;

create extension if not exists pgcrypto;

create temporary table if not exists _ac360_demo_seed_report (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  severity text not null,
  action text not null,
  object_name text,
  detail jsonb not null default '{}'::jsonb
) on commit preserve rows;

create or replace function pg_temp._ac360_demo_report(
  p_severity text,
  p_action text,
  p_object_name text,
  p_detail jsonb default '{}'::jsonb
) returns void
language plpgsql
as $$
begin
  insert into _ac360_demo_seed_report (severity, action, object_name, detail)
  values (p_severity, p_action, p_object_name, coalesce(p_detail, '{}'::jsonb));
end;
$$;

create or replace function pg_temp._ac360_demo_table_exists(p_table_name text)
returns boolean
language sql
stable
as $$
  select to_regclass('public.' || p_table_name) is not null;
$$;

create or replace function pg_temp._ac360_demo_has_column(
  p_table_name text,
  p_column_name text
) returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = p_table_name
      and c.column_name = p_column_name
  );
$$;

create or replace function pg_temp._ac360_demo_upsert(
  p_table_name text,
  p_payload jsonb,
  p_required boolean default true,
  p_label text default null
) returns void
language plpgsql
as $$
declare
  v_rel regclass;
  v_has_id boolean;
  v_missing_required text[];
  v_insert_cols text;
  v_select_cols text;
  v_update_set text;
  v_sql text;
  v_object_name text := coalesce(p_label, p_table_name);
begin
  v_rel := to_regclass('public.' || p_table_name);
  if v_rel is null then
    if p_required then
      raise exception 'required table "%" is missing', p_table_name;
    end if;
    perform pg_temp._ac360_demo_report(
      'skip',
      'table_missing',
      v_object_name,
      jsonb_build_object('table', p_table_name)
    );
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = p_table_name
      and c.column_name = 'id'
  )
  into v_has_id;

  if not v_has_id then
    if p_required then
      raise exception 'required table "%" has no id column', p_table_name;
    end if;
    perform pg_temp._ac360_demo_report(
      'skip',
      'table_no_id',
      v_object_name,
      jsonb_build_object('table', p_table_name)
    );
    return;
  end if;

  select array_agg(c.column_name order by c.ordinal_position)
  into v_missing_required
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = p_table_name
    and c.is_nullable = 'NO'
    and c.column_default is null
    and coalesce(c.is_generated, 'NEVER') = 'NEVER'
    and not (p_payload ? c.column_name);

  if coalesce(array_length(v_missing_required, 1), 0) > 0 then
    if p_required then
      raise exception
        'payload for "%" is missing required columns: %',
        p_table_name,
        array_to_string(v_missing_required, ', ');
    end if;
    perform pg_temp._ac360_demo_report(
      'skip',
      'missing_required_columns',
      v_object_name,
      jsonb_build_object('table', p_table_name, 'missing', to_jsonb(v_missing_required))
    );
    return;
  end if;

  select
    string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position),
    string_agg(format('r.%I', c.column_name), ', ' order by c.ordinal_position),
    string_agg(format('%I = excluded.%I', c.column_name, c.column_name), ', ' order by c.ordinal_position)
  into v_insert_cols, v_select_cols, v_update_set
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = p_table_name
    and p_payload ? c.column_name;

  if v_insert_cols is null then
    perform pg_temp._ac360_demo_report(
      'skip',
      'no_matching_columns',
      v_object_name,
      jsonb_build_object('table', p_table_name)
    );
    return;
  end if;

  if v_update_set is null or btrim(v_update_set) = '' then
    v_sql := format(
      'insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1) as r on conflict (id) do nothing',
      p_table_name,
      v_insert_cols,
      v_select_cols,
      p_table_name
    );
  else
    v_sql := format(
      'insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1) as r on conflict (id) do update set %s',
      p_table_name,
      v_insert_cols,
      v_select_cols,
      p_table_name,
      v_update_set
    );
  end if;

  execute v_sql using p_payload;

  perform pg_temp._ac360_demo_report(
    case when p_required then 'insert' else 'upsert' end,
    'ok',
    v_object_name,
    jsonb_build_object(
      'table', p_table_name,
      'id', coalesce(p_payload->>'id', ''),
      'code', coalesce(
        p_payload->>'client_code',
        p_payload->>'tenant_slug',
        p_payload->>'school_code',
        p_payload->>'subscription_code',
        p_payload->>'invoice_number',
        p_payload->>'payment_reference',
        p_payload->>'gate_code',
        p_payload->>'report_code',
        p_payload->>'export_code',
        ''
      )
    )
  );
end;
$$;

create or replace function pg_temp._ac360_demo_required_upsert(
  p_table_name text,
  p_payload jsonb,
  p_label text default null
) returns void
language plpgsql
as $$
begin
  perform pg_temp._ac360_demo_upsert(p_table_name, p_payload, true, p_label);
end;
$$;

create or replace function pg_temp._ac360_demo_optional_upsert(
  p_table_name text,
  p_payload jsonb,
  p_label text default null
) returns void
language plpgsql
as $$
begin
  perform pg_temp._ac360_demo_upsert(p_table_name, p_payload, false, p_label);
end;
$$;

create or replace function pg_temp._ac360_demo_delete_ids(
  p_table_name text,
  p_ids uuid[],
  p_required boolean default false
) returns void
language plpgsql
as $$
declare
  v_rel regclass;
  v_sql text;
begin
  v_rel := to_regclass('public.' || p_table_name);
  if v_rel is null then
    if p_required then
      raise exception 'required table "%" is missing', p_table_name;
    end if;
    perform pg_temp._ac360_demo_report('skip', 'delete_table_missing', p_table_name, jsonb_build_object('table', p_table_name));
    return;
  end if;

  if not pg_temp._ac360_demo_has_column(p_table_name, 'id') then
    if p_required then
      raise exception 'required table "%" has no id column', p_table_name;
    end if;
    perform pg_temp._ac360_demo_report('skip', 'delete_table_no_id', p_table_name, jsonb_build_object('table', p_table_name));
    return;
  end if;

  if p_ids is null or array_length(p_ids, 1) is null then
    return;
  end if;

  v_sql := format('delete from public.%I where id = any($1)', p_table_name);
  execute v_sql using p_ids;

  perform pg_temp._ac360_demo_report(
    'delete',
    'ok',
    p_table_name,
    jsonb_build_object('table', p_table_name, 'ids', to_jsonb(p_ids))
  );
end;
$$;

create or replace function pg_temp._ac360_demo_required_delete(p_table_name text, p_ids uuid[])
returns void
language plpgsql
as $$
begin
  perform pg_temp._ac360_demo_delete_ids(p_table_name, p_ids, true);
end;
$$;

create or replace function pg_temp._ac360_demo_optional_delete(p_table_name text, p_ids uuid[])
returns void
language plpgsql
as $$
begin
  perform pg_temp._ac360_demo_delete_ids(p_table_name, p_ids, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- Operator core
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_clients',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100001',
    'client_code', 'AC360-DEMO-PE-CASA',
    'display_name', 'École Les Petits Explorateurs Casablanca',
    'legal_name', 'Les Petits Explorateurs Casablanca SARL',
    'client_type', 'Crèche & préscolaire',
    'city', 'Casablanca',
    'country', 'Maroc',
    'address', 'Quartier Gauthier, Casablanca',
    'primary_contact_name', 'Mme Salma Bennani',
    'primary_contact_email', 'salma.bennani.demo@angelcarehub.ma',
    'primary_contact_phone', '+212 600 000 101',
    'status', 'active',
    'lifecycle_stage', 'live',
    'health_status', 'watch',
    'risk_level', 'medium',
    'notes', 'Demo schema-safe AngelCare 360'
  ),
  'operator client'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_tenants',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100002',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_slug', 'petits-explorateurs-casa-demo',
    'environment', 'production',
    'status', 'active',
    'provisioning_status', 'active',
    'command_center_url', '/angelcare-360-command-center',
    'go_live_date', '2026-07-01'
  ),
  'operator tenant'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_plans',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100011',
    'plan_code', 'AC360-START',
    'name', 'AC360 Start',
    'description', 'Entry plan for small crèches and preschools.',
    'monthly_price_mad', 3900,
    'annual_price_mad', 39000,
    'billing_cycle', 'monthly',
    'max_students', 50,
    'max_staff', 10,
    'max_users', 10,
    'max_sites', 1,
    'included_modules', to_jsonb(array['admissions','people','attendance','communication','reports']),
    'included_features', to_jsonb(array['online_payment_locked','whatsapp_locked','sms_locked']),
    'support_level', 'standard',
    'status', 'active'
  ),
  'operator plan start'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_plans',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100012',
    'plan_code', 'AC360-GROWTH',
    'name', 'AC360 Growth',
    'description', 'Default growth plan used for the Casablanca demo tenant.',
    'monthly_price_mad', 6900,
    'annual_price_mad', 69000,
    'billing_cycle', 'monthly',
    'max_students', 100,
    'max_staff', 25,
    'max_users', 20,
    'max_sites', 2,
    'included_modules', to_jsonb(array['admissions','people','attendance','academics','finance','transport','library','inventory','communication','reports','exports']),
    'included_features', to_jsonb(array['pdf_a4','xlsx_locked','online_payment_locked','whatsapp_locked','sms_locked']),
    'support_level', 'priority',
    'status', 'active'
  ),
  'operator plan growth'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_plans',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100013',
    'plan_code', 'AC360-SIGNATURE',
    'name', 'AC360 Signature',
    'description', 'Full-suite plan for larger institutions.',
    'monthly_price_mad', 9900,
    'annual_price_mad', 99000,
    'billing_cycle', 'monthly',
    'max_students', 250,
    'max_staff', 80,
    'max_users', 60,
    'max_sites', 4,
    'included_modules', to_jsonb(array['admissions','people','attendance','academics','finance','transport','library','inventory','communication','reports','exports']),
    'included_features', to_jsonb(array['pdf_a4','xlsx','online_payment','whatsapp','sms']),
    'support_level', 'premium',
    'status', 'active'
  ),
  'operator plan signature'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_subscriptions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100021',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'plan_id', '00000000-0000-0000-0000-000000100012',
    'subscription_code', 'SUB-AC360-DEMO-PE-CASA-001',
    'status', 'past_due',
    'start_date', '2026-07-01',
    'trial_ends_at', null,
    'current_period_start', '2026-07-01',
    'current_period_end', '2026-07-31',
    'billing_cycle', 'monthly',
    'billing_amount_mad', 6900,
    'discount_amount_mad', 0,
    'cancellation_reason', null,
    'suspended_reason', null
  ),
  'operator subscription'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_billing_accounts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100031',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'billing_name', 'Les Petits Explorateurs Casablanca SARL',
    'billing_email', 'billing.demo@angelcarehub.ma',
    'billing_phone', '+212 600 000 101',
    'billing_address', 'Quartier Gauthier, Casablanca, Maroc',
    'tax_identifier', 'MA-DEMO-PE-CASA-001',
    'payment_terms_days', 7,
    'status', 'active'
  ),
  'operator billing account'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_invoices',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100041',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'subscription_id', '00000000-0000-0000-0000-000000100021',
    'billing_account_id', '00000000-0000-0000-0000-000000100031',
    'invoice_number', 'AC360-INV-DEMO-0001',
    'issue_date', '2026-05-15',
    'due_date', '2026-05-22',
    'period_start', '2026-05-01',
    'period_end', '2026-05-31',
    'subtotal_mad', 6900,
    'discount_mad', 0,
    'total_mad', 6900,
    'amount_paid_mad', 6900,
    'balance_due_mad', 0,
    'status', 'paid',
    'notes', 'Paid invoice for May 2026 subscription.'
  ),
  'operator invoice 1'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_invoices',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100042',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'subscription_id', '00000000-0000-0000-0000-000000100021',
    'billing_account_id', '00000000-0000-0000-0000-000000100031',
    'invoice_number', 'AC360-INV-DEMO-0002',
    'issue_date', '2026-07-01',
    'due_date', '2026-07-08',
    'period_start', '2026-07-01',
    'period_end', '2026-07-31',
    'subtotal_mad', 6900,
    'discount_mad', 0,
    'total_mad', 6900,
    'amount_paid_mad', 0,
    'balance_due_mad', 6900,
    'status', 'issued',
    'notes', 'Current invoice awaiting settlement.'
  ),
  'operator invoice 2'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_invoices',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100043',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'subscription_id', '00000000-0000-0000-0000-000000100021',
    'billing_account_id', '00000000-0000-0000-0000-000000100031',
    'invoice_number', 'AC360-INV-DEMO-0003',
    'issue_date', '2026-06-15',
    'due_date', '2026-06-22',
    'period_start', '2026-06-01',
    'period_end', '2026-06-30',
    'subtotal_mad', 6900,
    'discount_mad', 0,
    'total_mad', 6900,
    'amount_paid_mad', 0,
    'balance_due_mad', 6900,
    'status', 'overdue',
    'notes', 'Overdue invoice used for dunning simulation.'
  ),
  'operator invoice 3'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_payments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100051',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'invoice_id', '00000000-0000-0000-0000-000000100041',
    'payment_reference', 'PAY-AC360-DEMO-0001',
    'payment_date', '2026-05-18',
    'amount_mad', 6900,
    'method', 'bank_transfer',
    'status', 'confirmed',
    'notes', 'Confirmed payment for invoice AC360-INV-DEMO-0001.'
  ),
  'operator payment 1'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_payments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100052',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'invoice_id', '00000000-0000-0000-0000-000000100042',
    'payment_reference', 'PAY-AC360-DEMO-0002',
    'payment_date', '2026-07-03',
    'amount_mad', 6900,
    'method', 'bank_transfer',
    'status', 'pending',
    'notes', 'Pending manual validation for current month payment.'
  ),
  'operator payment 2'
);

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_operator_payment_gates',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100061',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'invoice_id', '00000000-0000-0000-0000-000000100043',
    'subscription_id', '00000000-0000-0000-0000-000000100021',
    'gate_code', 'AC360-GATE-DEMO-PE-CASA-0001',
    'status', 'active',
    'amount_due_mad', 6900,
    'currency', 'MAD',
    'reason', 'Facture SaaS AngelCare 360 en attente de règlement.',
    'due_date', '2026-06-22',
    'blocking', true,
    'provider_key', null,
    'checkout_url', null,
    'online_payment_reference', null,
    'manual_processed_by', null,
    'manual_processed_at', null,
    'resolved_by', null,
    'resolved_at', null,
    'resolution_reason', null,
    'created_by', null
  ),
  'operator payment gate'
);

-- ---------------------------------------------------------------------------
-- Optional operator controls
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_feature_flags',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100071',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'feature_key', 'online_payment',
    'feature_label', 'Online payment',
    'module_key', 'finance',
    'status', 'enabled',
    'enabled', false,
    'locked_reason', 'Blocked until payment gate is resolved.',
    'scheduled_for', '2026-07-01',
    'activated_at', null,
    'activated_by', null
  ),
  'operator feature flag online payment'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_usage_limits',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100081',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'limit_key', 'max_students',
    'label', 'Maximum students',
    'allowed_value', 100,
    'current_value', 16,
    'unit', 'students',
    'status', 'active',
    'reset_cycle', 'monthly'
  ),
  'operator usage limit max_students'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_onboarding_tasks',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100091',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'title', 'Collect school logo and branding',
    'description', 'Done: brand assets uploaded for the demo tenant.',
    'status', 'done',
    'priority', 'normal',
    'due_date', '2026-07-02',
    'completed_at', '2026-07-02T09:15:00Z'
  ),
  'operator onboarding task'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_support_tickets',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100101',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'subject', 'Welcome email not received',
    'description', 'The school did not receive the initial onboarding email.',
    'category', 'onboarding',
    'priority', 'normal',
    'status', 'resolved',
    'resolution_summary', 'Re-sent the onboarding pack and confirmed delivery.',
    'resolved_at', '2026-07-04T11:30:00Z'
  ),
  'operator support ticket'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100111',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'subscription_id', '00000000-0000-0000-0000-000000100021',
    'contract_code', 'CTR-AC360-DEMO-PE-CASA-001',
    'status', 'active',
    'start_date', '2026-07-01',
    'end_date', '2027-06-30',
    'renewal_date', '2027-06-01',
    'signed_at', '2026-07-01T10:00:00Z',
    'notes', 'Active contract metadata for the demo tenant.'
  ),
  'operator contract'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_renewals',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100121',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'subscription_id', '00000000-0000-0000-0000-000000100021',
    'renewal_date', '2027-05-15',
    'status', 'upcoming',
    'probability', 70,
    'expected_amount_mad', 82800,
    'notes', 'Renewal forecast for the Casablanca demo school.'
  ),
  'operator renewal'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_service_requests',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100131',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'request_type', 'billing_follow_up',
    'title', 'Need invoice copy with A4 export',
    'description', 'School requested a clean printable invoice and an emailed copy for the billing contact.',
    'priority', 'normal',
    'status', 'new',
    'due_date', '2026-07-10'
  ),
  'operator service request'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_incidents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100141',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'severity', 'medium',
    'status', 'open',
    'title', 'Temporary delay in invoice reminder workflow',
    'description', 'Reminder routing is delayed while the payment-gate schema remains unavailable.',
    'started_at', '2026-07-08T08:30:00Z',
    'resolved_at', null
  ),
  'operator incident'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_tasks',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100151',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'title', 'Confirm invoice email recipient',
    'description', 'Check that billing.demo@angelcarehub.ma receives the current invoice copy.',
    'status', 'todo',
    'priority', 'high',
    'due_date', '2026-07-10',
    'completed_at', null
  ),
  'operator task'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_notes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100161',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'note_type', 'note',
    'body', 'Demo client kept intentionally on past_due to exercise the overlay.',
    'visibility', 'internal'
  ),
  'operator note'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_service_events',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100171',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'event_type', 'payment_gate.created',
    'severity', 'info',
    'title', 'Payment gate created',
    'description', 'Blocking payment gate created for the overdue invoice.',
    'status', 'open',
    'occurred_at', '2026-06-22T09:00:00Z'
  ),
  'operator service event'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_operator_audit_logs',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000100181',
    'actor_user_id', null,
    'actor_role', 'system',
    'client_id', '00000000-0000-0000-0000-000000100001',
    'tenant_id', '00000000-0000-0000-0000-000000100002',
    'module', 'operator',
    'action', 'client_created',
    'entity_type', 'client',
    'entity_id', '00000000-0000-0000-0000-000000100001',
    'severity', 'info',
    'before_data', '{}'::jsonb,
    'after_data', jsonb_build_object('client_code', 'AC360-DEMO-PE-CASA', 'status', 'active'),
    'metadata', jsonb_build_object('demo', true)
  ),
  'operator audit log'
);

-- ---------------------------------------------------------------------------
-- School core
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_required_upsert(
  'angelcare360_schools',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200001',
    'school_code', 'AC360-DEMO-PE-CASA-SCHOOL',
    'name', 'École Les Petits Explorateurs Casablanca',
    'legal_name', 'Les Petits Explorateurs Casablanca SARL',
    'school_type', 'creche_prescolaire',
    'country', 'Maroc',
    'city', 'Casablanca',
    'address', 'Quartier Gauthier, Casablanca, Maroc',
    'phone', '+212 5 22 00 01 01',
    'email', 'direction@petits-explorateurs-casa.demo',
    'website', 'https://petits-explorateurs-casa.demo',
    'language', 'fr',
    'currency', 'MAD',
    'timezone', 'Africa/Casablanca',
    'status', 'active',
    'metadata_json', jsonb_build_object(
      'demo', true,
      'tenant_slug', 'petits-explorateurs-casa-demo',
      'client_code', 'AC360-DEMO-PE-CASA'
    )
  ),
  'school core'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_school_settings',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200002',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'default_language', 'fr',
    'default_currency', 'MAD',
    'default_timezone', 'Africa/Casablanca',
    'academic_year_start_month', 7,
    'week_start_day', 1,
    'grading_scale', '0-20',
    'attendance_grace_minutes', 10,
    'allow_parent_portal', true,
    'allow_student_portal', true,
    'communication_sender_name', 'AngelCare 360 Demo',
    'school_year_label_format', 'YYYY-YYYY+1',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'tenant_slug', 'petits-explorateurs-casa-demo')
  ),
  'school settings'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_academic_years',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200003',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'year_code', '2026-2027',
    'label', '2026-2027',
    'starts_on', '2026-07-01',
    'ends_on', '2027-06-30',
    'is_current', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'academic year'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_terms',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200004',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'term_code', 'DEMO-T1',
    'label', 'Juillet - Octobre 2026',
    'starts_on', '2026-07-01',
    'ends_on', '2026-10-31',
    'order_index', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'term 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_terms',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200005',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'term_code', 'DEMO-T2',
    'label', 'Novembre 2026 - Février 2027',
    'starts_on', '2026-11-01',
    'ends_on', '2027-02-28',
    'order_index', 2,
    'status', 'planned',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'term 2'
);

-- ---------------------------------------------------------------------------
-- School structure
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_classes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200011',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_code', 'DEMO-PS-A',
    'name', 'Petite Section A',
    'level', 'petite_section',
    'capacity', 8,
    'order_index', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class PS'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_classes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200012',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_code', 'DEMO-MS-A',
    'name', 'Moyenne Section A',
    'level', 'moyenne_section',
    'capacity', 8,
    'order_index', 2,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class MS'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_classes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200013',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_code', 'DEMO-GS-A',
    'name', 'Grande Section A',
    'level', 'grande_section',
    'capacity', 8,
    'order_index', 3,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class GS'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_classes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200014',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_code', 'DEMO-PREP-A',
    'name', 'Préparatoire A',
    'level', 'preparatoire',
    'capacity', 8,
    'order_index', 4,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class PREP'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200021',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'subject_code', 'DEMO-SUB-LANGAGE',
    'name', 'Langage',
    'short_name', 'Langage',
    'department', 'Pédagogie',
    'credit_hours', 3,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'subject language'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200022',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'subject_code', 'DEMO-SUB-MATH',
    'name', 'Mathématiques',
    'short_name', 'Maths',
    'department', 'Pédagogie',
    'credit_hours', 3,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'subject math'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200023',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'subject_code', 'DEMO-SUB-EVEIL',
    'name', 'Éveil scientifique',
    'short_name', 'Éveil',
    'department', 'Pédagogie',
    'credit_hours', 2,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'subject éveil'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200024',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'subject_code', 'DEMO-SUB-ARTS',
    'name', 'Arts plastiques',
    'short_name', 'Arts',
    'department', 'Pédagogie',
    'credit_hours', 2,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'subject arts'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200025',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'subject_code', 'DEMO-SUB-MOTRICITE',
    'name', 'Motricité',
    'short_name', 'Motricité',
    'department', 'Pédagogie',
    'credit_hours', 2,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'subject motricity'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200031',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_code', 'DEMO-STF-001',
    'staff_type', 'direction',
    'first_name', 'Fatima Zahra',
    'last_name', 'Ait Ali',
    'full_name', 'Fatima Zahra Ait Ali',
    'email', 'fatima.zahra@petits-explorateurs-casa.demo',
    'phone', '+212 600 100 001',
    'hire_date', '2024-09-01',
    'department', 'Direction',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'role', 'director')
  ),
  'staff director'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200032',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_code', 'DEMO-STF-002',
    'staff_type', 'enseignant',
    'first_name', 'Amina',
    'last_name', 'El Fassi',
    'full_name', 'Amina El Fassi',
    'email', 'amina.el-fassi@petits-explorateurs-casa.demo',
    'phone', '+212 600 100 002',
    'hire_date', '2024-09-01',
    'department', 'Pédagogie',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'transport_coordinator', true)
  ),
  'staff teacher 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200033',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_code', 'DEMO-STF-003',
    'staff_type', 'enseignant',
    'first_name', 'Hicham',
    'last_name', 'El Idrissi',
    'full_name', 'Hicham El Idrissi',
    'email', 'hicham.el-idrissi@petits-explorateurs-casa.demo',
    'phone', '+212 600 100 003',
    'hire_date', '2024-09-01',
    'department', 'Pédagogie',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff teacher 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200034',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_code', 'DEMO-STF-004',
    'staff_type', 'enseignant',
    'first_name', 'Sara',
    'last_name', 'Benjelloun',
    'full_name', 'Sara Benjelloun',
    'email', 'sara.benjelloun@petits-explorateurs-casa.demo',
    'phone', '+212 600 100 004',
    'hire_date', '2024-09-01',
    'department', 'Pédagogie',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff teacher 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200035',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_code', 'DEMO-STF-005',
    'staff_type', 'enseignant',
    'first_name', 'Rachid',
    'last_name', 'Bekkali',
    'full_name', 'Rachid Bekkali',
    'email', 'rachid.bekkali@petits-explorateurs-casa.demo',
    'phone', '+212 600 100 005',
    'hire_date', '2024-09-01',
    'department', 'Pédagogie',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff teacher 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200036',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_code', 'DEMO-STF-006',
    'staff_type', 'comptabilite',
    'first_name', 'Nadia',
    'last_name', 'El Mansouri',
    'full_name', 'Nadia El Mansouri',
    'email', 'nadia.el-mansouri@petits-explorateurs-casa.demo',
    'phone', '+212 600 100 006',
    'hire_date', '2024-09-01',
    'department', 'Finance',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff finance'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200041',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-001',
    'first_name', 'Salma',
    'last_name', 'Bennani',
    'full_name', 'Salma Bennani',
    'email', 'salma.bennani@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 001',
    'whatsapp', '+212 600 200 001',
    'occupation', 'Médecin',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-01')
  ),
  'parent 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200042',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-002',
    'first_name', 'Mehdi',
    'last_name', 'El Idrissi',
    'full_name', 'Mehdi El Idrissi',
    'email', 'mehdi.el-idrissi@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 002',
    'whatsapp', '+212 600 200 002',
    'occupation', 'Ingénieur',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-02')
  ),
  'parent 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200043',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-003',
    'first_name', 'Karima',
    'last_name', 'Berrada',
    'full_name', 'Karima Berrada',
    'email', 'karima.berrada@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 003',
    'whatsapp', '+212 600 200 003',
    'occupation', 'Architecte',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-03')
  ),
  'parent 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200044',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-004',
    'first_name', 'Yassine',
    'last_name', 'El Amrani',
    'full_name', 'Yassine El Amrani',
    'email', 'yassine.el-amrani@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 004',
    'whatsapp', '+212 600 200 004',
    'occupation', 'Entrepreneur',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-04')
  ),
  'parent 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200045',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-005',
    'first_name', 'Nadia',
    'last_name', 'Tazi',
    'full_name', 'Nadia Tazi',
    'email', 'nadia.tazi@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 005',
    'whatsapp', '+212 600 200 005',
    'occupation', 'Pharmacienne',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-05')
  ),
  'parent 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200046',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-006',
    'first_name', 'Hamza',
    'last_name', 'Alaoui',
    'full_name', 'Hamza Alaoui',
    'email', 'hamza.alaoui@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 006',
    'whatsapp', '+212 600 200 006',
    'occupation', 'Commerçant',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-06')
  ),
  'parent 6'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200047',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-007',
    'first_name', 'Mouna',
    'last_name', 'Chraibi',
    'full_name', 'Mouna Chraibi',
    'email', 'mouna.chraibi@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 007',
    'whatsapp', '+212 600 200 007',
    'occupation', 'Consultante',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-07')
  ),
  'parent 7'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_parents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200048',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'parent_code', 'DEMO-PAR-008',
    'first_name', 'Hassan',
    'last_name', 'Fassi',
    'full_name', 'Hassan Fassi',
    'email', 'hassan.fassi@petits-explorateurs-casa.demo',
    'phone', '+212 600 200 008',
    'whatsapp', '+212 600 200 008',
    'occupation', 'Cadre',
    'address', 'Casablanca',
    'preferred_language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-08')
  ),
  'parent 8'
);

-- ---------------------------------------------------------------------------
-- Customer dossier
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_sections',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200051',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_code', 'PS-A',
    'name', 'Petite Section A',
    'capacity', 8,
    'room', 'Salle 1',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'section ps a'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_sections',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200052',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_code', 'MS-A',
    'name', 'Moyenne Section A',
    'capacity', 8,
    'room', 'Salle 2',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'section ms a'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_sections',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200053',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'section_code', 'GS-A',
    'name', 'Grande Section A',
    'capacity', 8,
    'room', 'Salle 3',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'section gs a'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_sections',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200054',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_code', 'PREP-A',
    'name', 'Préparatoire A',
    'capacity', 8,
    'room', 'Salle 4',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'section prep a'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200491',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'document_code', 'DOC-DEMO-SCHOOL-BRAND-001',
    'documentable_type', 'school',
    'documentable_id', '00000000-0000-0000-0000-000000200001',
    'category', 'branding',
    'title', 'School branding kit',
    'file_name', 'school-branding-kit.pdf',
    'file_path', 'angelcare360/demo/school-branding-kit.pdf',
    'storage_provider', 'supabase',
    'mime_type', 'application/pdf',
    'visibility', 'school',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'kind', 'branding')
  ),
  'document school branding'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200492',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'document_code', 'DOC-DEMO-ADMISSION-001',
    'documentable_type', 'application',
    'documentable_id', '00000000-0000-0000-0000-000000200821',
    'category', 'admissions',
    'title', 'Acte de naissance',
    'file_name', 'acte-naissance-demo.pdf',
    'file_path', 'angelcare360/demo/admissions/acte-naissance-demo.pdf',
    'storage_provider', 'supabase',
    'mime_type', 'application/pdf',
    'visibility', 'private',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true, 'kind', 'admission')
  ),
  'document admission support'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200101',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-001',
    'first_name', 'Yasmine',
    'last_name', 'Alaoui',
    'full_name', 'Yasmine Alaoui',
    'gender', 'f',
    'date_of_birth', '2021-03-14',
    'current_class_id', '00000000-0000-0000-0000-000000200011',
    'current_section_id', '00000000-0000-0000-0000-000000200051',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-01')
  ),
  'student 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200102',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-002',
    'first_name', 'Ilyas',
    'last_name', 'Bennani',
    'full_name', 'Ilyas Bennani',
    'gender', 'm',
    'date_of_birth', '2021-05-02',
    'current_class_id', '00000000-0000-0000-0000-000000200011',
    'current_section_id', '00000000-0000-0000-0000-000000200051',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-01')
  ),
  'student 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200103',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-003',
    'first_name', 'Adam',
    'last_name', 'Berrada',
    'full_name', 'Adam Berrada',
    'gender', 'm',
    'date_of_birth', '2021-06-11',
    'current_class_id', '00000000-0000-0000-0000-000000200011',
    'current_section_id', '00000000-0000-0000-0000-000000200051',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', true,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-02')
  ),
  'student 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200104',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-004',
    'first_name', 'Ines',
    'last_name', 'Mansouri',
    'full_name', 'Ines Mansouri',
    'gender', 'f',
    'date_of_birth', '2020-09-21',
    'current_class_id', '00000000-0000-0000-0000-000000200012',
    'current_section_id', '00000000-0000-0000-0000-000000200052',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-02')
  ),
  'student 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200105',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-005',
    'first_name', 'Sara',
    'last_name', 'Ziani',
    'full_name', 'Sara Ziani',
    'gender', 'f',
    'date_of_birth', '2020-10-03',
    'current_class_id', '00000000-0000-0000-0000-000000200012',
    'current_section_id', '00000000-0000-0000-0000-000000200052',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', true,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-03')
  ),
  'student 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200106',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-006',
    'first_name', 'Meryem',
    'last_name', 'Rami',
    'full_name', 'Meryem Rami',
    'gender', 'f',
    'date_of_birth', '2020-11-18',
    'current_class_id', '00000000-0000-0000-0000-000000200012',
    'current_section_id', '00000000-0000-0000-0000-000000200052',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-03')
  ),
  'student 6'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200107',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-007',
    'first_name', 'Amine',
    'last_name', 'Ait Bihi',
    'full_name', 'Amine Ait Bihi',
    'gender', 'm',
    'date_of_birth', '2020-12-07',
    'current_class_id', '00000000-0000-0000-0000-000000200013',
    'current_section_id', '00000000-0000-0000-0000-000000200053',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', true,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-04')
  ),
  'student 7'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200108',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-008',
    'first_name', 'Hana',
    'last_name', 'Lahlou',
    'full_name', 'Hana Lahlou',
    'gender', 'f',
    'date_of_birth', '2021-01-25',
    'current_class_id', '00000000-0000-0000-0000-000000200013',
    'current_section_id', '00000000-0000-0000-0000-000000200053',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-04')
  ),
  'student 8'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200109',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-009',
    'first_name', 'Aya',
    'last_name', 'Mekouar',
    'full_name', 'Aya Mekouar',
    'gender', 'f',
    'date_of_birth', '2019-09-12',
    'current_class_id', '00000000-0000-0000-0000-000000200014',
    'current_section_id', '00000000-0000-0000-0000-000000200054',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', true,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-05')
  ),
  'student 9'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200110',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-010',
    'first_name', 'Lina',
    'last_name', 'Bouziane',
    'full_name', 'Lina Bouziane',
    'gender', 'f',
    'date_of_birth', '2019-10-19',
    'current_class_id', '00000000-0000-0000-0000-000000200014',
    'current_section_id', '00000000-0000-0000-0000-000000200054',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-05')
  ),
  'student 10'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200111',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-011',
    'first_name', 'Omar',
    'last_name', 'Kettani',
    'full_name', 'Omar Kettani',
    'gender', 'm',
    'date_of_birth', '2019-12-05',
    'current_class_id', '00000000-0000-0000-0000-000000200014',
    'current_section_id', '00000000-0000-0000-0000-000000200054',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', true,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-06')
  ),
  'student 11'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_students',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200112',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_code', 'DEMO-STU-012',
    'first_name', 'Nour',
    'last_name', 'El Harrak',
    'full_name', 'Nour El Harrak',
    'gender', 'f',
    'date_of_birth', '2019-11-22',
    'current_class_id', '00000000-0000-0000-0000-000000200014',
    'current_section_id', '00000000-0000-0000-0000-000000200054',
    'admission_status', 'enrolled',
    'status', 'active',
    'admission_date', '2026-07-01',
    'transport_required', false,
    'metadata_json', jsonb_build_object('demo', true, 'family_code', 'DEMO-FAM-06')
  ),
  'student 12'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200201',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200101',
    'parent_id', '00000000-0000-0000-0000-000000200041',
    'relationship_type', 'mother',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200202',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200102',
    'parent_id', '00000000-0000-0000-0000-000000200042',
    'relationship_type', 'father',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200203',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200103',
    'parent_id', '00000000-0000-0000-0000-000000200043',
    'relationship_type', 'mother',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200204',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200104',
    'parent_id', '00000000-0000-0000-0000-000000200044',
    'relationship_type', 'father',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200205',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200105',
    'parent_id', '00000000-0000-0000-0000-000000200045',
    'relationship_type', 'mother',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200206',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200106',
    'parent_id', '00000000-0000-0000-0000-000000200046',
    'relationship_type', 'father',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 6'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200207',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200107',
    'parent_id', '00000000-0000-0000-0000-000000200047',
    'relationship_type', 'mother',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 7'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200208',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200108',
    'parent_id', '00000000-0000-0000-0000-000000200048',
    'relationship_type', 'father',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 8'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200209',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200109',
    'parent_id', '00000000-0000-0000-0000-000000200041',
    'relationship_type', 'mother',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 9'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200210',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200110',
    'parent_id', '00000000-0000-0000-0000-000000200042',
    'relationship_type', 'father',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 10'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200211',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200111',
    'parent_id', '00000000-0000-0000-0000-000000200043',
    'relationship_type', 'mother',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 11'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_student_parent_links',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200212',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'student_id', '00000000-0000-0000-0000-000000200112',
    'parent_id', '00000000-0000-0000-0000-000000200044',
    'relationship_type', 'father',
    'is_primary', true,
    'is_guardian', true,
    'can_pickup', true,
    'can_receive_messages', true,
    'can_pay_fees', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'student-parent link 12'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_emergency_contacts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200301',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'contactable_type', 'student',
    'contactable_id', '00000000-0000-0000-0000-000000200101',
    'contact_name', 'Saad Alaoui',
    'relationship_type', 'father',
    'phone', '+212 600 300 001',
    'email', 'saad.alaoui@petits-explorateurs-casa.demo',
    'priority', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'emergency contact 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_emergency_contacts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200302',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'contactable_type', 'student',
    'contactable_id', '00000000-0000-0000-0000-000000200104',
    'contact_name', 'Meryem Mansouri',
    'relationship_type', 'mother',
    'phone', '+212 600 300 002',
    'email', 'meryem.mansouri@petits-explorateurs-casa.demo',
    'priority', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'emergency contact 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_emergency_contacts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200303',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'contactable_type', 'student',
    'contactable_id', '00000000-0000-0000-0000-000000200107',
    'contact_name', 'Karim Ait Bihi',
    'relationship_type', 'father',
    'phone', '+212 600 300 003',
    'email', 'karim.aitbihi@petits-explorateurs-casa.demo',
    'priority', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'emergency contact 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_emergency_contacts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200304',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'contactable_type', 'student',
    'contactable_id', '00000000-0000-0000-0000-000000200110',
    'contact_name', 'Mounia Bouziane',
    'relationship_type', 'mother',
    'phone', '+212 600 300 004',
    'email', 'mounia.bouziane@petits-explorateurs-casa.demo',
    'priority', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'emergency contact 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200401',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200031',
    'contract_number', 'CTR-AC360-DEMO-PE-CASA-001',
    'contract_type', 'direction',
    'starts_on', '2024-09-01',
    'ends_on', '2027-06-30',
    'employment_type', 'full_time',
    'salary_amount', 28000,
    'currency', 'MAD',
    'workload_percent', 100,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff contract director'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200402',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200032',
    'contract_number', 'CTR-AC360-DEMO-PE-CASA-002',
    'contract_type', 'enseignant',
    'starts_on', '2024-09-01',
    'ends_on', '2027-06-30',
    'employment_type', 'full_time',
    'salary_amount', 12000,
    'currency', 'MAD',
    'workload_percent', 100,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff contract teacher 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200403',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200033',
    'contract_number', 'CTR-AC360-DEMO-PE-CASA-003',
    'contract_type', 'enseignant',
    'starts_on', '2024-09-01',
    'ends_on', '2027-06-30',
    'employment_type', 'full_time',
    'salary_amount', 11800,
    'currency', 'MAD',
    'workload_percent', 100,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff contract teacher 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200404',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200034',
    'contract_number', 'CTR-AC360-DEMO-PE-CASA-004',
    'contract_type', 'enseignant',
    'starts_on', '2024-09-01',
    'ends_on', '2027-06-30',
    'employment_type', 'full_time',
    'salary_amount', 11800,
    'currency', 'MAD',
    'workload_percent', 100,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff contract teacher 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200405',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200035',
    'contract_number', 'CTR-AC360-DEMO-PE-CASA-005',
    'contract_type', 'enseignant',
    'starts_on', '2024-09-01',
    'ends_on', '2027-06-30',
    'employment_type', 'full_time',
    'salary_amount', 11800,
    'currency', 'MAD',
    'workload_percent', 100,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff contract teacher 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_contracts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200406',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200036',
    'contract_number', 'CTR-AC360-DEMO-PE-CASA-006',
    'contract_type', 'comptabilite',
    'starts_on', '2024-09-01',
    'ends_on', '2027-06-30',
    'employment_type', 'full_time',
    'salary_amount', 10500,
    'currency', 'MAD',
    'workload_percent', 100,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff contract finance'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200501',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200031',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'assignment_type', 'administration',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff assignment director'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200502',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200032',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'subject_id', '00000000-0000-0000-0000-000000200021',
    'assignment_type', 'teaching',
    'assigned_from', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff assignment 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200503',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200033',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'subject_id', '00000000-0000-0000-0000-000000200022',
    'assignment_type', 'teaching',
    'assigned_from', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff assignment 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200504',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200034',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'section_id', '00000000-0000-0000-0000-000000200053',
    'subject_id', '00000000-0000-0000-0000-000000200023',
    'assignment_type', 'teaching',
    'assigned_from', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff assignment 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200505',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200035',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'subject_id', '00000000-0000-0000-0000-000000200024',
    'assignment_type', 'teaching',
    'assigned_from', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff assignment 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_staff_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200506',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'staff_id', '00000000-0000-0000-0000-000000200036',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'assignment_type', 'administration',
    'assigned_from', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'staff assignment 6'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200601',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'subject_id', '00000000-0000-0000-0000-000000200021',
    'teacher_id', '00000000-0000-0000-0000-000000200032',
    'coefficient', 1,
    'is_required', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class subject 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200602',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'subject_id', '00000000-0000-0000-0000-000000200022',
    'teacher_id', '00000000-0000-0000-0000-000000200033',
    'coefficient', 1,
    'is_required', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class subject 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200603',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'subject_id', '00000000-0000-0000-0000-000000200023',
    'teacher_id', '00000000-0000-0000-0000-000000200034',
    'coefficient', 1,
    'is_required', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class subject 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_subjects',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200604',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'subject_id', '00000000-0000-0000-0000-000000200024',
    'teacher_id', '00000000-0000-0000-0000-000000200035',
    'coefficient', 1,
    'is_required', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class subject 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200701',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200101',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'enrollment_number', 'ENR-001',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200702',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200102',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'enrollment_number', 'ENR-002',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200703',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200103',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'enrollment_number', 'ENR-003',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200704',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200104',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'enrollment_number', 'ENR-004',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200705',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200105',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'enrollment_number', 'ENR-005',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200706',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200106',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'enrollment_number', 'ENR-006',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 6'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200707',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200107',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'section_id', '00000000-0000-0000-0000-000000200053',
    'enrollment_number', 'ENR-007',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 7'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200708',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200108',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'section_id', '00000000-0000-0000-0000-000000200053',
    'enrollment_number', 'ENR-008',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 8'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200709',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200109',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'enrollment_number', 'ENR-009',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 9'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200710',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200110',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'enrollment_number', 'ENR-010',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 10'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200711',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200111',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'enrollment_number', 'ENR-011',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 11'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_class_enrollments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200712',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'student_id', '00000000-0000-0000-0000-000000200112',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'enrollment_number', 'ENR-012',
    'enrollment_status', 'enrolled',
    'enrolled_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'class enrollment 12'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_leads',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200801',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'lead_code', 'LEAD-DEMO-001',
    'parent_name', 'Fatima Alaoui',
    'parent_phone', '+212 600 400 001',
    'parent_email', 'fatima.alaoui@petits-explorateurs-casa.demo',
    'student_full_name', 'Nour Alaoui',
    'desired_level', 'petite_section',
    'source_channel', 'website',
    'assigned_staff_id', '00000000-0000-0000-0000-000000200031',
    'status', 'converted',
    'contacted_at', '2026-06-28T10:00:00Z',
    'converted_at', '2026-07-01T08:30:00Z',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission lead 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_leads',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200802',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'lead_code', 'LEAD-DEMO-002',
    'parent_name', 'Hajar El Idrissi',
    'parent_phone', '+212 600 400 002',
    'parent_email', 'hajar.elidrissi@petits-explorateurs-casa.demo',
    'student_full_name', 'Amine El Idrissi',
    'desired_level', 'moyenne_section',
    'source_channel', 'referral',
    'assigned_staff_id', '00000000-0000-0000-0000-000000200031',
    'status', 'contacted',
    'contacted_at', '2026-07-03T14:00:00Z',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission lead 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_required_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200811',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'document_key', 'acte-naissance',
    'title', 'Acte de naissance',
    'description', 'Required birth certificate for admission review.',
    'required_for_stage', 'application',
    'sort_order', 1,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission required doc 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_required_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200812',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'document_key', 'photo',
    'title', 'Photo de l’enfant',
    'description', 'Passport style photograph.',
    'required_for_stage', 'application',
    'sort_order', 2,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission required doc 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_required_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200813',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'document_key', 'vaccination',
    'title', 'Carnet de vaccination',
    'description', 'Vaccination record required at enrollment.',
    'required_for_stage', 'enrollment',
    'sort_order', 3,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission required doc 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_required_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200814',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'document_key', 'medical',
    'title', 'Certificat médical',
    'description', 'Medical certificate for school health record.',
    'required_for_stage', 'enrollment',
    'sort_order', 4,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission required doc 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_applications',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200821',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'application_code', 'APP-DEMO-001',
    'lead_id', '00000000-0000-0000-0000-000000200801',
    'parent_id', '00000000-0000-0000-0000-000000200041',
    'student_id', '00000000-0000-0000-0000-000000200101',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'application_stage', 'review',
    'application_date', '2026-07-01',
    'decision_date', '2026-07-03',
    'decision_reason', 'Accepted after interview and document review.',
    'status', 'approved',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission application 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_applications',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200822',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'application_code', 'APP-DEMO-002',
    'lead_id', '00000000-0000-0000-0000-000000200802',
    'parent_id', '00000000-0000-0000-0000-000000200042',
    'student_id', '00000000-0000-0000-0000-000000200104',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'application_stage', 'review',
    'application_date', '2026-07-03',
    'status', 'in_review',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission application 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_status_history',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200831',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'application_id', '00000000-0000-0000-0000-000000200821',
    'from_status', 'in_review',
    'to_status', 'approved',
    'note', 'Application approved after document validation.',
    'changed_at', '2026-07-03T10:30:00Z',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission status history 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_status_history',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200832',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'application_id', '00000000-0000-0000-0000-000000200822',
    'from_status', 'draft',
    'to_status', 'in_review',
    'note', 'Application moved into review queue.',
    'changed_at', '2026-07-04T08:15:00Z',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission status history 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_document_submissions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200841',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'application_id', '00000000-0000-0000-0000-000000200821',
    'required_document_id', '00000000-0000-0000-0000-000000200811',
    'document_id', '00000000-0000-0000-0000-000000200492',
    'submitted_at', '2026-07-02T09:00:00Z',
    'verification_status', 'complete',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission document submission 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_admission_document_submissions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200842',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'application_id', '00000000-0000-0000-0000-000000200822',
    'required_document_id', '00000000-0000-0000-0000-000000200812',
    'document_id', null,
    'submitted_at', '2026-07-03T09:00:00Z',
    'verification_status', 'pending',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'admission document submission 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_sessions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200851',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'session_date', '2026-07-06',
    'session_type', 'daily',
    'taken_by', null,
    'source', 'manual',
    'total_expected', 3,
    'total_present', 2,
    'total_absent', 1,
    'total_late', 0,
    'total_excused', 0,
    'notes', 'Morning attendance for Petite Section A.',
    'status', 'closed',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance session 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_sessions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200852',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'session_date', '2026-07-06',
    'session_type', 'daily',
    'taken_by', null,
    'source', 'manual',
    'total_expected', 3,
    'total_present', 3,
    'total_absent', 0,
    'total_late', 0,
    'total_excused', 0,
    'notes', 'Morning attendance for Moyenne Section A.',
    'status', 'closed',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance session 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_sessions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200853',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'section_id', '00000000-0000-0000-0000-000000200053',
    'session_date', '2026-07-06',
    'session_type', 'daily',
    'taken_by', null,
    'source', 'manual',
    'total_expected', 3,
    'total_present', 2,
    'total_absent', 1,
    'total_late', 1,
    'total_excused', 0,
    'notes', 'Morning attendance for Grande Section A.',
    'status', 'closed',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance session 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_sessions',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200854',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'session_date', '2026-07-06',
    'session_type', 'daily',
    'taken_by', null,
    'source', 'manual',
    'total_expected', 3,
    'total_present', 3,
    'total_absent', 0,
    'total_late', 0,
    'total_excused', 0,
    'notes', 'Morning attendance for Préparatoire A.',
    'status', 'closed',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance session 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200901',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200851',
    'student_id', '00000000-0000-0000-0000-000000200101',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:15:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200902',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200851',
    'student_id', '00000000-0000-0000-0000-000000200102',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:18:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200903',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200851',
    'student_id', '00000000-0000-0000-0000-000000200103',
    'attendance_status', 'absent',
    'mark_source', 'manual',
    'justification_required', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200904',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200852',
    'student_id', '00000000-0000-0000-0000-000000200104',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:10:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200905',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200852',
    'student_id', '00000000-0000-0000-0000-000000200105',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:12:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 5'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200906',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200852',
    'student_id', '00000000-0000-0000-0000-000000200106',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:13:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 6'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200907',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200853',
    'student_id', '00000000-0000-0000-0000-000000200107',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:11:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 7'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200908',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200853',
    'student_id', '00000000-0000-0000-0000-000000200108',
    'attendance_status', 'late',
    'check_in_at', '2026-07-06T08:27:00Z',
    'minutes_late', 12,
    'mark_source', 'manual',
    'justification_required', true,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 8'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200909',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200853',
    'student_id', '00000000-0000-0000-0000-000000200109',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:08:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 9'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200910',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200854',
    'student_id', '00000000-0000-0000-0000-000000200110',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:15:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 10'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200911',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200854',
    'student_id', '00000000-0000-0000-0000-000000200111',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:16:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 11'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_records',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200912',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_session_id', '00000000-0000-0000-0000-000000200854',
    'student_id', '00000000-0000-0000-0000-000000200112',
    'attendance_status', 'present',
    'check_in_at', '2026-07-06T08:17:00Z',
    'mark_source', 'manual',
    'justification_required', false,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance record 12'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_attendance_justifications',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200921',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'attendance_record_id', '00000000-0000-0000-0000-000000200903',
    'justification_code', 'JUS-DEMO-001',
    'reason_category', 'medical',
    'description', 'Parent reported a medical appointment.',
    'submitted_at', '2026-07-06T12:00:00Z',
    'decision', 'pending',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'attendance justification 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_school_calendar_events',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200931',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'event_code', 'CAL-DEMO-001',
    'title', 'Rentrée scolaire',
    'description', 'Opening event for the Casablanca demo school year.',
    'event_type', 'school_opening',
    'starts_on', '2026-07-01',
    'ends_on', '2026-07-01',
    'all_day', true,
    'audience', 'all',
    'status', 'published',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'calendar event 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_school_calendar_events',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200932',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'event_code', 'CAL-DEMO-002',
    'title', 'Réunion parents-professeurs',
    'description', 'Parent meeting for the demo classes.',
    'event_type', 'parent_meeting',
    'starts_on', '2026-07-15',
    'ends_on', '2026-07-15',
    'all_day', true,
    'audience', 'parents',
    'status', 'planned',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'calendar event 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_timetable_slots',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200941',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200011',
    'section_id', '00000000-0000-0000-0000-000000200051',
    'subject_id', '00000000-0000-0000-0000-000000200021',
    'staff_id', '00000000-0000-0000-0000-000000200032',
    'day_of_week', 1,
    'start_time', '08:30',
    'end_time', '09:15',
    'room', 'Salle 1',
    'slot_type', 'regular',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'timetable slot 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_timetable_slots',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200942',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200012',
    'section_id', '00000000-0000-0000-0000-000000200052',
    'subject_id', '00000000-0000-0000-0000-000000200022',
    'staff_id', '00000000-0000-0000-0000-000000200033',
    'day_of_week', 1,
    'start_time', '09:15',
    'end_time', '10:00',
    'room', 'Salle 2',
    'slot_type', 'regular',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'timetable slot 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_timetable_slots',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200943',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200013',
    'section_id', '00000000-0000-0000-0000-000000200053',
    'subject_id', '00000000-0000-0000-0000-000000200023',
    'staff_id', '00000000-0000-0000-0000-000000200034',
    'day_of_week', 1,
    'start_time', '10:15',
    'end_time', '11:00',
    'room', 'Salle 3',
    'slot_type', 'regular',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'timetable slot 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_timetable_slots',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200944',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'class_id', '00000000-0000-0000-0000-000000200014',
    'section_id', '00000000-0000-0000-0000-000000200054',
    'subject_id', '00000000-0000-0000-0000-000000200024',
    'staff_id', '00000000-0000-0000-0000-000000200035',
    'day_of_week', 1,
    'start_time', '11:15',
    'end_time', '12:00',
    'room', 'Salle 4',
    'slot_type', 'regular',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'timetable slot 4'
);

-- ---------------------------------------------------------------------------
-- School finance, transport, library, inventory
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_finance_accounts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200951',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'account_code', 'ACC-DEMO-CASH',
    'label', 'Caisse principale',
    'account_type', 'cash',
    'currency', 'MAD',
    'opening_balance', 1500,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'finance account cash'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_finance_accounts',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200952',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'account_code', 'ACC-DEMO-BANK',
    'label', 'Compte bancaire',
    'account_type', 'bank',
    'currency', 'MAD',
    'opening_balance', 12500,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'finance account bank'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_expenses',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200961',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'expense_code', 'EXP-DEMO-001',
    'expense_date', '2026-07-05',
    'category', 'supplies',
    'vendor_name', 'Librairie Casablanca',
    'account_id', '00000000-0000-0000-0000-000000200952',
    'amount', 980,
    'currency', 'MAD',
    'payment_method', 'bank_transfer',
    'status', 'approved',
    'notes', 'Stationery and classroom consumables.',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'expense 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_expenses',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200962',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'expense_code', 'EXP-DEMO-002',
    'expense_date', '2026-07-06',
    'category', 'snacks',
    'vendor_name', 'Snack Time Casablanca',
    'account_id', '00000000-0000-0000-0000-000000200951',
    'amount', 420,
    'currency', 'MAD',
    'payment_method', 'cash',
    'status', 'paid',
    'notes', 'Class snack allocation.',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'expense 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_routes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200971',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'route_code', 'ROUTE-DEMO-001',
    'label', 'Casablanca Centre',
    'route_type', 'school_bus',
    'responsible_staff_id', '00000000-0000-0000-0000-000000200032',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport route 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_routes',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200972',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'route_code', 'ROUTE-DEMO-002',
    'label', 'Anfa - Gauthier',
    'route_type', 'school_bus',
    'responsible_staff_id', '00000000-0000-0000-0000-000000200033',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport route 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_stops',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200981',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'route_id', '00000000-0000-0000-0000-000000200971',
    'stop_code', 'STOP-DEMO-001',
    'label', 'Parking Casablanca Centre',
    'order_index', 1,
    'planned_time', '07:15',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport stop 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_stops',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200982',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'route_id', '00000000-0000-0000-0000-000000200971',
    'stop_code', 'STOP-DEMO-002',
    'label', 'Boulevard Zerktouni',
    'order_index', 2,
    'planned_time', '07:25',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport stop 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_stops',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200983',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'route_id', '00000000-0000-0000-0000-000000200972',
    'stop_code', 'STOP-DEMO-003',
    'label', 'Avenue Moulay Youssef',
    'order_index', 1,
    'planned_time', '07:10',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport stop 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_stops',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200984',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'route_id', '00000000-0000-0000-0000-000000200972',
    'stop_code', 'STOP-DEMO-004',
    'label', 'Rue d''Anfa',
    'order_index', 2,
    'planned_time', '07:22',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport stop 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_vehicles',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200991',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'vehicle_code', 'VH-DEMO-001',
    'plate_number', 'MAR-AC360-001',
    'model', 'Mercedes Sprinter',
    'capacity_seats', 16,
    'assigned_driver_staff_id', '00000000-0000-0000-0000-000000200032',
    'insurance_expires_on', '2027-06-30',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport vehicle 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_vehicles',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200992',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'vehicle_code', 'VH-DEMO-002',
    'plate_number', 'MAR-AC360-002',
    'model', 'Toyota Hiace',
    'capacity_seats', 12,
    'assigned_driver_staff_id', '00000000-0000-0000-0000-000000200033',
    'insurance_expires_on', '2027-06-30',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport vehicle 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201001',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'route_id', '00000000-0000-0000-0000-000000200971',
    'student_id', '00000000-0000-0000-0000-000000200103',
    'vehicle_id', '00000000-0000-0000-0000-000000200991',
    'pickup_stop_id', '00000000-0000-0000-0000-000000200981',
    'dropoff_stop_id', '00000000-0000-0000-0000-000000200982',
    'assigned_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport assignment 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201002',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'route_id', '00000000-0000-0000-0000-000000200971',
    'student_id', '00000000-0000-0000-0000-000000200105',
    'vehicle_id', '00000000-0000-0000-0000-000000200991',
    'pickup_stop_id', '00000000-0000-0000-0000-000000200981',
    'dropoff_stop_id', '00000000-0000-0000-0000-000000200982',
    'assigned_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport assignment 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201003',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'route_id', '00000000-0000-0000-0000-000000200972',
    'student_id', '00000000-0000-0000-0000-000000200107',
    'vehicle_id', '00000000-0000-0000-0000-000000200992',
    'pickup_stop_id', '00000000-0000-0000-0000-000000200983',
    'dropoff_stop_id', '00000000-0000-0000-0000-000000200984',
    'assigned_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport assignment 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_transport_assignments',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201004',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'route_id', '00000000-0000-0000-0000-000000200972',
    'student_id', '00000000-0000-0000-0000-000000200109',
    'vehicle_id', '00000000-0000-0000-0000-000000200992',
    'pickup_stop_id', '00000000-0000-0000-0000-000000200983',
    'dropoff_stop_id', '00000000-0000-0000-0000-000000200984',
    'assigned_on', '2026-07-01',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'transport assignment 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_books',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201011',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'book_code', 'LIB-DEMO-001',
    'isbn', '9789999999001',
    'title', 'Petits Explorateurs - Lecture 1',
    'author', 'Équipe pédagogique',
    'publisher', 'AngelCare Press',
    'category', 'reading',
    'language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library book 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_books',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201012',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'book_code', 'LIB-DEMO-002',
    'isbn', '9789999999002',
    'title', 'Petits Explorateurs - Mathématiques',
    'author', 'Équipe pédagogique',
    'publisher', 'AngelCare Press',
    'category', 'math',
    'language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library book 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_books',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201013',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'book_code', 'LIB-DEMO-003',
    'isbn', '9789999999003',
    'title', 'Petits Explorateurs - Découverte',
    'author', 'Équipe pédagogique',
    'publisher', 'AngelCare Press',
    'category', 'discovery',
    'language', 'fr',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library book 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_copies',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201021',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'book_id', '00000000-0000-0000-0000-000000201011',
    'copy_code', 'COPY-DEMO-001',
    'barcode', 'BARCODE-DEMO-001',
    'acquisition_date', '2026-07-01',
    'shelf_location', 'A-1',
    'condition', 'good',
    'status', 'available',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library copy 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_copies',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201022',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'book_id', '00000000-0000-0000-0000-000000201012',
    'copy_code', 'COPY-DEMO-002',
    'barcode', 'BARCODE-DEMO-002',
    'acquisition_date', '2026-07-01',
    'shelf_location', 'A-2',
    'condition', 'good',
    'status', 'available',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library copy 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_copies',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201023',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'book_id', '00000000-0000-0000-0000-000000201013',
    'copy_code', 'COPY-DEMO-003',
    'barcode', 'BARCODE-DEMO-003',
    'acquisition_date', '2026-07-01',
    'shelf_location', 'A-3',
    'condition', 'good',
    'status', 'available',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library copy 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_loans',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201031',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'copy_id', '00000000-0000-0000-0000-000000201021',
    'borrower_type', 'student',
    'borrower_student_id', '00000000-0000-0000-0000-000000200101',
    'loaned_at', '2026-07-06T09:00:00Z',
    'due_at', '2026-07-20T09:00:00Z',
    'fine_amount', 0,
    'status', 'open',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library loan 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_library_loans',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201032',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'copy_id', '00000000-0000-0000-0000-000000201022',
    'borrower_type', 'student',
    'borrower_student_id', '00000000-0000-0000-0000-000000200104',
    'loaned_at', '2026-07-06T09:00:00Z',
    'due_at', '2026-07-20T09:00:00Z',
    'fine_amount', 0,
    'status', 'open',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'library loan 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_categories',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201041',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'category_code', 'INV-CAT-001',
    'label', 'Classroom supplies',
    'description', 'Materials used in class activities.',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory category 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_categories',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201042',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'category_code', 'INV-CAT-002',
    'label', 'Office supplies',
    'description', 'Materials used for administration.',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory category 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_items',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201051',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'category_id', '00000000-0000-0000-0000-000000201041',
    'item_code', 'INV-ITEM-001',
    'label', 'Crayons',
    'unit_of_measure', 'box',
    'current_stock', 24,
    'reorder_level', 10,
    'purchase_price', 45,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory item 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_items',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201052',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'category_id', '00000000-0000-0000-0000-000000201041',
    'item_code', 'INV-ITEM-002',
    'label', 'Painting paper',
    'unit_of_measure', 'pack',
    'current_stock', 18,
    'reorder_level', 8,
    'purchase_price', 62,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory item 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_items',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201053',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'category_id', '00000000-0000-0000-0000-000000201042',
    'item_code', 'INV-ITEM-003',
    'label', 'Printer paper',
    'unit_of_measure', 'ream',
    'current_stock', 32,
    'reorder_level', 12,
    'purchase_price', 78,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory item 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_items',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201054',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'category_id', '00000000-0000-0000-0000-000000201042',
    'item_code', 'INV-ITEM-004',
    'label', 'File folders',
    'unit_of_measure', 'pack',
    'current_stock', 20,
    'reorder_level', 10,
    'purchase_price', 36,
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory item 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_movements',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201061',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'item_id', '00000000-0000-0000-0000-000000201051',
    'movement_code', 'MOVE-DEMO-001',
    'movement_type', 'in',
    'quantity', 24,
    'movement_date', '2026-07-01',
    'reference_type', 'purchase',
    'performed_by', null,
    'notes', 'Initial stock load.',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory movement 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_movements',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201062',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'item_id', '00000000-0000-0000-0000-000000201052',
    'movement_code', 'MOVE-DEMO-002',
    'movement_type', 'in',
    'quantity', 18,
    'movement_date', '2026-07-01',
    'reference_type', 'purchase',
    'performed_by', null,
    'notes', 'Initial stock load.',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory movement 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_inventory_movements',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201063',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'item_id', '00000000-0000-0000-0000-000000201053',
    'movement_code', 'MOVE-DEMO-003',
    'movement_type', 'in',
    'quantity', 32,
    'movement_date', '2026-07-01',
    'reference_type', 'purchase',
    'performed_by', null,
    'notes', 'Initial stock load.',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'inventory movement 3'
);

-- ---------------------------------------------------------------------------
-- Messaging, notifications, reclamations, documents, reports
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_messages',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201071',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'message_code', 'MSG-DEMO-001',
    'sender_role', 'direction',
    'subject', 'Bienvenue dans AngelCare 360',
    'body', 'Bienvenue dans le dossier démo de l’école Les Petits Explorateurs Casablanca.',
    'message_type', 'internal',
    'sent_at', '2026-07-01T08:00:00Z',
    'status', 'sent',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'message 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_messages',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201072',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'message_code', 'MSG-DEMO-002',
    'sender_role', 'comptabilite',
    'subject', 'Facture en attente',
    'body', 'Merci de régler la facture en attente avant la date d’échéance.',
    'message_type', 'internal',
    'status', 'draft',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'message 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_message_recipients',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201081',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'message_id', '00000000-0000-0000-0000-000000201071',
    'recipient_parent_id', '00000000-0000-0000-0000-000000200041',
    'delivery_status', 'delivered',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'message recipient 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_message_recipients',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201082',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'message_id', '00000000-0000-0000-0000-000000201071',
    'recipient_staff_id', '00000000-0000-0000-0000-000000200031',
    'delivery_status', 'read',
    'read_at', '2026-07-01T09:10:00Z',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'message recipient 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_message_recipients',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201083',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'message_id', '00000000-0000-0000-0000-000000201072',
    'recipient_parent_id', '00000000-0000-0000-0000-000000200042',
    'delivery_status', 'pending',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'message recipient 3'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_message_recipients',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201084',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'message_id', '00000000-0000-0000-0000-000000201072',
    'recipient_staff_id', '00000000-0000-0000-0000-000000200036',
    'delivery_status', 'pending',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'message recipient 4'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_notifications',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201091',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'notification_code', 'NOTIF-DEMO-001',
    'recipient_parent_id', '00000000-0000-0000-0000-000000200041',
    'recipient_role', 'parent',
    'channel', 'in_app',
    'title', 'Nouvelle facture disponible',
    'body', 'La facture du mois est disponible dans votre espace.',
    'scheduled_for', '2026-07-06T07:30:00Z',
    'status', 'scheduled',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'notification 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_notifications',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201092',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'notification_code', 'NOTIF-DEMO-002',
    'recipient_role', 'staff',
    'channel', 'in_app',
    'title', 'Réunion direction',
    'body', 'Réunion de suivi prévue cet après-midi.',
    'scheduled_for', '2026-07-06T12:00:00Z',
    'status', 'scheduled',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'notification 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_announcements',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201101',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'academic_year_id', '00000000-0000-0000-0000-000000200003',
    'announcement_code', 'ANN-DEMO-001',
    'title', 'Rentrée et consignes',
    'body', 'Bienvenue au nouveau cycle scolaire.',
    'audience', 'all',
    'published_at', '2026-07-01T08:00:00Z',
    'status', 'published',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'announcement 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_reclamations',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201111',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'reclamation_code', 'RECL-DEMO-001',
    'submitted_by_app_user_id', null,
    'reporter_role', 'parent',
    'subject', 'Demande de clarification sur les horaires',
    'description', 'Parent wants a schedule clarification.',
    'related_entity_type', 'attendance',
    'priority', 'medium',
    'status', 'open',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'reclamation 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_reports',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201131',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_code', 'RPT-DEMO-ATT-001',
    'report_family', 'attendance',
    'label', 'Attendance snapshot',
    'description', 'Snapshot of the demo attendance data.',
    'owner_role', 'direction',
    'status', 'active',
    'config_json', jsonb_build_object('demo', true, 'scope', 'attendance'),
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_reports',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201132',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_code', 'RPT-DEMO-FIN-001',
    'report_family', 'finance',
    'label', 'Finance snapshot',
    'description', 'Snapshot of the demo finance data.',
    'owner_role', 'comptabilite',
    'status', 'active',
    'config_json', jsonb_build_object('demo', true, 'scope', 'finance'),
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_report_templates',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201141',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_id', '00000000-0000-0000-0000-000000201131',
    'template_code', 'TPL-DEMO-ATT-001',
    'label', 'Attendance PDF A4',
    'module_key', 'rapports',
    'report_family', 'attendance',
    'output_format', 'pdf_a4',
    'description', 'PDF layout for attendance snapshot.',
    'config_json', jsonb_build_object('demo', true),
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report template 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_report_templates',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201142',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_id', '00000000-0000-0000-0000-000000201132',
    'template_code', 'TPL-DEMO-FIN-001',
    'label', 'Finance PDF A4',
    'module_key', 'rapports',
    'report_family', 'finance',
    'output_format', 'pdf_a4',
    'description', 'PDF layout for finance snapshot.',
    'config_json', jsonb_build_object('demo', true),
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report template 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_report_requests',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201151',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_id', '00000000-0000-0000-0000-000000201131',
    'report_template_id', '00000000-0000-0000-0000-000000201141',
    'request_code', 'REQ-DEMO-ATT-001',
    'report_code', 'RPT-DEMO-ATT-001',
    'report_family', 'attendance',
    'module_key', 'rapports',
    'date_from', '2026-07-01',
    'date_to', '2026-07-06',
    'filters_json', jsonb_build_object('demo', true),
    'status', 'ready',
    'requested_at', '2026-07-06T10:00:00Z',
    'completed_at', '2026-07-06T10:05:00Z',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report request 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_report_requests',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201152',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_id', '00000000-0000-0000-0000-000000201132',
    'report_template_id', '00000000-0000-0000-0000-000000201142',
    'request_code', 'REQ-DEMO-FIN-001',
    'report_code', 'RPT-DEMO-FIN-001',
    'report_family', 'finance',
    'module_key', 'rapports',
    'date_from', '2026-07-01',
    'date_to', '2026-07-06',
    'filters_json', jsonb_build_object('demo', true),
    'status', 'requested',
    'requested_at', '2026-07-06T10:10:00Z',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report request 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_documents',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000200493',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'document_code', 'DOC-DEMO-REPORT-001',
    'documentable_type', 'report',
    'documentable_id', '00000000-0000-0000-0000-000000201131',
    'category', 'reports',
    'title', 'Attendance snapshot PDF',
    'file_name', 'attendance-snapshot-demo.pdf',
    'file_path', 'angelcare360/demo/reports/attendance-snapshot-demo.pdf',
    'storage_provider', 'supabase',
    'mime_type', 'application/pdf',
    'visibility', 'private',
    'status', 'active',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'document report pdf'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_report_exports',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201161',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_id', '00000000-0000-0000-0000-000000201131',
    'export_code', 'EXP-REP-DEMO-001',
    'export_format', 'pdf',
    'requested_by', null,
    'requested_at', '2026-07-06T10:00:00Z',
    'completed_at', '2026-07-06T10:05:00Z',
    'file_document_id', '00000000-0000-0000-0000-000000200493',
    'status', 'completed',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report export 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_report_exports',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201162',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_id', '00000000-0000-0000-0000-000000201132',
    'export_code', 'EXP-REP-DEMO-002',
    'export_format', 'xlsx',
    'requested_by', null,
    'requested_at', '2026-07-06T10:12:00Z',
    'status', 'requested',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'report export 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_export_files',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201171',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'report_export_id', '00000000-0000-0000-0000-000000201161',
    'export_code', 'EXP-REP-DEMO-001',
    'file_code', 'FILE-REP-DEMO-001',
    'file_name', 'attendance-snapshot-demo.pdf',
    'file_path', 'angelcare360/demo/exports/attendance-snapshot-demo.pdf',
    'storage_provider', 'supabase',
    'mime_type', 'application/pdf',
    'file_size_bytes', 245120,
    'export_format', 'pdf_a4',
    'status', 'ready',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'export file 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_document_templates',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201181',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'template_code', 'DOC-TPL-DEMO-001',
    'label', 'Letterhead A4',
    'document_type', 'general',
    'output_format', 'pdf_a4',
    'description', 'General printable document template.',
    'retention_days', 365,
    'config_json', jsonb_build_object('demo', true),
    'status', 'ready',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'document template 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_document_templates',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201182',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'template_code', 'DOC-TPL-DEMO-002',
    'label', 'Report cover',
    'document_type', 'report',
    'output_format', 'pdf_a4',
    'description', 'Report cover document template.',
    'retention_days', 365,
    'config_json', jsonb_build_object('demo', true),
    'status', 'ready',
    'metadata_json', jsonb_build_object('demo', true)
  ),
  'document template 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_audit_logs',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201191',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'actor_role', 'system',
    'module', 'operator',
    'action', 'client_created',
    'entity_type', 'client',
    'entity_id', '00000000-0000-0000-0000-000000100001',
    'severity', 'info',
    'before_data', '{}'::jsonb,
    'after_data', jsonb_build_object('client_code', 'AC360-DEMO-PE-CASA', 'status', 'active'),
    'metadata', jsonb_build_object('demo', true)
  ),
  'audit log 1'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_audit_logs',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201192',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'actor_role', 'system',
    'module', 'operator',
    'action', 'payment_gate.created',
    'entity_type', 'payment_gate',
    'entity_id', '00000000-0000-0000-0000-000000100061',
    'severity', 'info',
    'before_data', '{}'::jsonb,
    'after_data', jsonb_build_object('gate_code', 'AC360-GATE-DEMO-PE-CASA-0001', 'blocking', true),
    'metadata', jsonb_build_object('demo', true)
  ),
  'audit log 2'
);

select pg_temp._ac360_demo_optional_upsert(
  'angelcare360_audit_logs',
  jsonb_build_object(
    'id', '00000000-0000-0000-0000-000000201193',
    'school_id', '00000000-0000-0000-0000-000000200001',
    'actor_role', 'system',
    'module', 'seed',
    'action', 'completed',
    'entity_type', 'seed_run',
    'entity_id', null,
    'severity', 'info',
    'before_data', '{}'::jsonb,
    'after_data', jsonb_build_object('result', 'success'),
    'metadata', jsonb_build_object('demo', true)
  ),
  'audit log 3'
);

select * from _ac360_demo_seed_report order by created_at, id;

commit;
