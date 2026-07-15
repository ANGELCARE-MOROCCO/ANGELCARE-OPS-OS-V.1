-- AngelCare 360 v2 schema-safe demo customer cleanup
-- Deletes only v2 demo rows by stable UUIDs in reverse dependency order.

begin;

create temporary table if not exists _ac360_demo_cleanup_report (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  severity text not null,
  action text not null,
  object_name text,
  detail jsonb not null default '{}'::jsonb
) on commit preserve rows;

create or replace function pg_temp._ac360_demo_cleanup_report(
  p_severity text,
  p_action text,
  p_object_name text,
  p_detail jsonb default '{}'::jsonb
) returns void
language plpgsql
as $$
begin
  insert into _ac360_demo_cleanup_report (severity, action, object_name, detail)
  values (p_severity, p_action, p_object_name, coalesce(p_detail, '{}'::jsonb));
end;
$$;

create or replace function pg_temp._ac360_demo_cleanup_delete(
  p_table_name text,
  p_ids uuid[]
) returns void
language plpgsql
as $$
declare
  v_rel regclass;
  v_sql text;
begin
  v_rel := to_regclass('public.' || p_table_name);
  if v_rel is null then
    perform pg_temp._ac360_demo_cleanup_report(
      'skip',
      'table_missing',
      p_table_name,
      jsonb_build_object('table', p_table_name)
    );
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = p_table_name
      and c.column_name = 'id'
  ) then
    perform pg_temp._ac360_demo_cleanup_report(
      'skip',
      'table_no_id',
      p_table_name,
      jsonb_build_object('table', p_table_name)
    );
    return;
  end if;

  if p_ids is null or array_length(p_ids, 1) is null then
    return;
  end if;

  v_sql := format('delete from public.%I where id = any($1)', p_table_name);
  execute v_sql using p_ids;

  perform pg_temp._ac360_demo_cleanup_report(
    'delete',
    'ok',
    p_table_name,
    jsonb_build_object('table', p_table_name, 'ids', to_jsonb(p_ids))
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Delete child rows first
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_cleanup_delete('angelcare360_attendance_justifications', array['00000000-0000-0000-0000-000000200921'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_attendance_records', array[
  '00000000-0000-0000-0000-000000200901'::uuid,
  '00000000-0000-0000-0000-000000200902'::uuid,
  '00000000-0000-0000-0000-000000200903'::uuid,
  '00000000-0000-0000-0000-000000200904'::uuid,
  '00000000-0000-0000-0000-000000200905'::uuid,
  '00000000-0000-0000-0000-000000200906'::uuid,
  '00000000-0000-0000-0000-000000200907'::uuid,
  '00000000-0000-0000-0000-000000200908'::uuid,
  '00000000-0000-0000-0000-000000200909'::uuid,
  '00000000-0000-0000-0000-000000200910'::uuid,
  '00000000-0000-0000-0000-000000200911'::uuid,
  '00000000-0000-0000-0000-000000200912'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_attendance_sessions', array[
  '00000000-0000-0000-0000-000000200851'::uuid,
  '00000000-0000-0000-0000-000000200852'::uuid,
  '00000000-0000-0000-0000-000000200853'::uuid,
  '00000000-0000-0000-0000-000000200854'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_admission_document_submissions', array[
  '00000000-0000-0000-0000-000000200841'::uuid,
  '00000000-0000-0000-0000-000000200842'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_admission_status_history', array[
  '00000000-0000-0000-0000-000000200831'::uuid,
  '00000000-0000-0000-0000-000000200832'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_admission_applications', array[
  '00000000-0000-0000-0000-000000200821'::uuid,
  '00000000-0000-0000-0000-000000200822'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_admission_required_documents', array[
  '00000000-0000-0000-0000-000000200811'::uuid,
  '00000000-0000-0000-0000-000000200812'::uuid,
  '00000000-0000-0000-0000-000000200813'::uuid,
  '00000000-0000-0000-0000-000000200814'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_admission_leads', array[
  '00000000-0000-0000-0000-000000200801'::uuid,
  '00000000-0000-0000-0000-000000200802'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_message_recipients', array[
  '00000000-0000-0000-0000-000000201081'::uuid,
  '00000000-0000-0000-0000-000000201082'::uuid,
  '00000000-0000-0000-0000-000000201083'::uuid,
  '00000000-0000-0000-0000-000000201084'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_messages', array[
  '00000000-0000-0000-0000-000000201071'::uuid,
  '00000000-0000-0000-0000-000000201072'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_notifications', array[
  '00000000-0000-0000-0000-000000201091'::uuid,
  '00000000-0000-0000-0000-000000201092'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_announcements', array[
  '00000000-0000-0000-0000-000000201101'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_reclamations', array[
  '00000000-0000-0000-0000-000000201111'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_report_requests', array[
  '00000000-0000-0000-0000-000000201151'::uuid,
  '00000000-0000-0000-0000-000000201152'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_report_exports', array[
  '00000000-0000-0000-0000-000000201161'::uuid,
  '00000000-0000-0000-0000-000000201162'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_export_files', array[
  '00000000-0000-0000-0000-000000201171'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_report_templates', array[
  '00000000-0000-0000-0000-000000201141'::uuid,
  '00000000-0000-0000-0000-000000201142'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_document_templates', array[
  '00000000-0000-0000-0000-000000201181'::uuid,
  '00000000-0000-0000-0000-000000201182'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_documents', array[
  '00000000-0000-0000-0000-000000200491'::uuid,
  '00000000-0000-0000-0000-000000200492'::uuid,
  '00000000-0000-0000-0000-000000200493'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_reports', array[
  '00000000-0000-0000-0000-000000201131'::uuid,
  '00000000-0000-0000-0000-000000201132'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_inventory_movements', array[
  '00000000-0000-0000-0000-000000201061'::uuid,
  '00000000-0000-0000-0000-000000201062'::uuid,
  '00000000-0000-0000-0000-000000201063'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_inventory_items', array[
  '00000000-0000-0000-0000-000000201051'::uuid,
  '00000000-0000-0000-0000-000000201052'::uuid,
  '00000000-0000-0000-0000-000000201053'::uuid,
  '00000000-0000-0000-0000-000000201054'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_inventory_categories', array[
  '00000000-0000-0000-0000-000000201041'::uuid,
  '00000000-0000-0000-0000-000000201042'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_library_loans', array[
  '00000000-0000-0000-0000-000000201031'::uuid,
  '00000000-0000-0000-0000-000000201032'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_library_copies', array[
  '00000000-0000-0000-0000-000000201021'::uuid,
  '00000000-0000-0000-0000-000000201022'::uuid,
  '00000000-0000-0000-0000-000000201023'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_library_books', array[
  '00000000-0000-0000-0000-000000201011'::uuid,
  '00000000-0000-0000-0000-000000201012'::uuid,
  '00000000-0000-0000-0000-000000201013'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_transport_assignments', array[
  '00000000-0000-0000-0000-000000201001'::uuid,
  '00000000-0000-0000-0000-000000201002'::uuid,
  '00000000-0000-0000-0000-000000201003'::uuid,
  '00000000-0000-0000-0000-000000201004'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_transport_stops', array[
  '00000000-0000-0000-0000-000000200981'::uuid,
  '00000000-0000-0000-0000-000000200982'::uuid,
  '00000000-0000-0000-0000-000000200983'::uuid,
  '00000000-0000-0000-0000-000000200984'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_transport_vehicles', array[
  '00000000-0000-0000-0000-000000200991'::uuid,
  '00000000-0000-0000-0000-000000200992'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_transport_routes', array[
  '00000000-0000-0000-0000-000000200971'::uuid,
  '00000000-0000-0000-0000-000000200972'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_expenses', array[
  '00000000-0000-0000-0000-000000200961'::uuid,
  '00000000-0000-0000-0000-000000200962'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_finance_accounts', array[
  '00000000-0000-0000-0000-000000200951'::uuid,
  '00000000-0000-0000-0000-000000200952'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_attendance_sessions', array[
  '00000000-0000-0000-0000-000000200851'::uuid,
  '00000000-0000-0000-0000-000000200852'::uuid,
  '00000000-0000-0000-0000-000000200853'::uuid,
  '00000000-0000-0000-0000-000000200854'::uuid
]);

select pg_temp._ac360_demo_cleanup_delete('angelcare360_class_enrollments', array[
  '00000000-0000-0000-0000-000000200701'::uuid,
  '00000000-0000-0000-0000-000000200702'::uuid,
  '00000000-0000-0000-0000-000000200703'::uuid,
  '00000000-0000-0000-0000-000000200704'::uuid,
  '00000000-0000-0000-0000-000000200705'::uuid,
  '00000000-0000-0000-0000-000000200706'::uuid,
  '00000000-0000-0000-0000-000000200707'::uuid,
  '00000000-0000-0000-0000-000000200708'::uuid,
  '00000000-0000-0000-0000-000000200709'::uuid,
  '00000000-0000-0000-0000-000000200710'::uuid,
  '00000000-0000-0000-0000-000000200711'::uuid,
  '00000000-0000-0000-0000-000000200712'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_class_subjects', array[
  '00000000-0000-0000-0000-000000200601'::uuid,
  '00000000-0000-0000-0000-000000200602'::uuid,
  '00000000-0000-0000-0000-000000200603'::uuid,
  '00000000-0000-0000-0000-000000200604'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_staff_assignments', array[
  '00000000-0000-0000-0000-000000200501'::uuid,
  '00000000-0000-0000-0000-000000200502'::uuid,
  '00000000-0000-0000-0000-000000200503'::uuid,
  '00000000-0000-0000-0000-000000200504'::uuid,
  '00000000-0000-0000-0000-000000200505'::uuid,
  '00000000-0000-0000-0000-000000200506'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_staff_contracts', array[
  '00000000-0000-0000-0000-000000200401'::uuid,
  '00000000-0000-0000-0000-000000200402'::uuid,
  '00000000-0000-0000-0000-000000200403'::uuid,
  '00000000-0000-0000-0000-000000200404'::uuid,
  '00000000-0000-0000-0000-000000200405'::uuid,
  '00000000-0000-0000-0000-000000200406'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_emergency_contacts', array[
  '00000000-0000-0000-0000-000000200301'::uuid,
  '00000000-0000-0000-0000-000000200302'::uuid,
  '00000000-0000-0000-0000-000000200303'::uuid,
  '00000000-0000-0000-0000-000000200304'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_student_parent_links', array[
  '00000000-0000-0000-0000-000000200201'::uuid,
  '00000000-0000-0000-0000-000000200202'::uuid,
  '00000000-0000-0000-0000-000000200203'::uuid,
  '00000000-0000-0000-0000-000000200204'::uuid,
  '00000000-0000-0000-0000-000000200205'::uuid,
  '00000000-0000-0000-0000-000000200206'::uuid,
  '00000000-0000-0000-0000-000000200207'::uuid,
  '00000000-0000-0000-0000-000000200208'::uuid,
  '00000000-0000-0000-0000-000000200209'::uuid,
  '00000000-0000-0000-0000-000000200210'::uuid,
  '00000000-0000-0000-0000-000000200211'::uuid,
  '00000000-0000-0000-0000-000000200212'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_students', array[
  '00000000-0000-0000-0000-000000200101'::uuid,
  '00000000-0000-0000-0000-000000200102'::uuid,
  '00000000-0000-0000-0000-000000200103'::uuid,
  '00000000-0000-0000-0000-000000200104'::uuid,
  '00000000-0000-0000-0000-000000200105'::uuid,
  '00000000-0000-0000-0000-000000200106'::uuid,
  '00000000-0000-0000-0000-000000200107'::uuid,
  '00000000-0000-0000-0000-000000200108'::uuid,
  '00000000-0000-0000-0000-000000200109'::uuid,
  '00000000-0000-0000-0000-000000200110'::uuid,
  '00000000-0000-0000-0000-000000200111'::uuid,
  '00000000-0000-0000-0000-000000200112'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_sections', array[
  '00000000-0000-0000-0000-000000200051'::uuid,
  '00000000-0000-0000-0000-000000200052'::uuid,
  '00000000-0000-0000-0000-000000200053'::uuid,
  '00000000-0000-0000-0000-000000200054'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_classes', array[
  '00000000-0000-0000-0000-000000200011'::uuid,
  '00000000-0000-0000-0000-000000200012'::uuid,
  '00000000-0000-0000-0000-000000200013'::uuid,
  '00000000-0000-0000-0000-000000200014'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_subjects', array[
  '00000000-0000-0000-0000-000000200021'::uuid,
  '00000000-0000-0000-0000-000000200022'::uuid,
  '00000000-0000-0000-0000-000000200023'::uuid,
  '00000000-0000-0000-0000-000000200024'::uuid,
  '00000000-0000-0000-0000-000000200025'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_staff', array[
  '00000000-0000-0000-0000-000000200031'::uuid,
  '00000000-0000-0000-0000-000000200032'::uuid,
  '00000000-0000-0000-0000-000000200033'::uuid,
  '00000000-0000-0000-0000-000000200034'::uuid,
  '00000000-0000-0000-0000-000000200035'::uuid,
  '00000000-0000-0000-0000-000000200036'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_school_calendar_events', array[
  '00000000-0000-0000-0000-000000200931'::uuid,
  '00000000-0000-0000-0000-000000200932'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_timetable_slots', array[
  '00000000-0000-0000-0000-000000200941'::uuid,
  '00000000-0000-0000-0000-000000200942'::uuid,
  '00000000-0000-0000-0000-000000200943'::uuid,
  '00000000-0000-0000-0000-000000200944'::uuid
]);

-- ---------------------------------------------------------------------------
-- Delete operator rows last among dependent resources
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_service_events', array['00000000-0000-0000-0000-000000100171'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_audit_logs', array['00000000-0000-0000-0000-000000100181'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_notes', array['00000000-0000-0000-0000-000000100161'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_tasks', array['00000000-0000-0000-0000-000000100151'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_incidents', array['00000000-0000-0000-0000-000000100141'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_service_requests', array['00000000-0000-0000-0000-000000100131'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_renewals', array['00000000-0000-0000-0000-000000100121'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_contracts', array['00000000-0000-0000-0000-000000100111'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_support_tickets', array['00000000-0000-0000-0000-000000100101'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_onboarding_tasks', array['00000000-0000-0000-0000-000000100091'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_usage_limits', array['00000000-0000-0000-0000-000000100081'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_feature_flags', array['00000000-0000-0000-0000-000000100071'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_payment_gates', array['00000000-0000-0000-0000-000000100061'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_payments', array[
  '00000000-0000-0000-0000-000000100051'::uuid,
  '00000000-0000-0000-0000-000000100052'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_invoices', array[
  '00000000-0000-0000-0000-000000100041'::uuid,
  '00000000-0000-0000-0000-000000100042'::uuid,
  '00000000-0000-0000-0000-000000100043'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_billing_accounts', array['00000000-0000-0000-0000-000000100031'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_subscriptions', array['00000000-0000-0000-0000-000000100021'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_plans', array[
  '00000000-0000-0000-0000-000000100011'::uuid,
  '00000000-0000-0000-0000-000000100012'::uuid,
  '00000000-0000-0000-0000-000000100013'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_tenants', array['00000000-0000-0000-0000-000000100002'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_operator_clients', array['00000000-0000-0000-0000-000000100001'::uuid]);

-- ---------------------------------------------------------------------------
-- Parent/core rows last
-- ---------------------------------------------------------------------------

select pg_temp._ac360_demo_cleanup_delete('angelcare360_parents', array[
  '00000000-0000-0000-0000-000000200041'::uuid,
  '00000000-0000-0000-0000-000000200042'::uuid,
  '00000000-0000-0000-0000-000000200043'::uuid,
  '00000000-0000-0000-0000-000000200044'::uuid,
  '00000000-0000-0000-0000-000000200045'::uuid,
  '00000000-0000-0000-0000-000000200046'::uuid,
  '00000000-0000-0000-0000-000000200047'::uuid,
  '00000000-0000-0000-0000-000000200048'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_school_settings', array['00000000-0000-0000-0000-000000200002'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_terms', array[
  '00000000-0000-0000-0000-000000200004'::uuid,
  '00000000-0000-0000-0000-000000200005'::uuid
]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_academic_years', array['00000000-0000-0000-0000-000000200003'::uuid]);
select pg_temp._ac360_demo_cleanup_delete('angelcare360_schools', array['00000000-0000-0000-0000-000000200001'::uuid]);

select pg_temp._ac360_demo_cleanup_report(
  'info',
  'demo_identifiers',
  'v2 demo dossier',
  jsonb_build_object(
    'client_code', 'AC360-DEMO-PE-CASA',
    'tenant_slug', 'petits-explorateurs-casa-demo',
    'gate_code', 'AC360-GATE-DEMO-PE-CASA-0001',
    'subscription_code', 'SUB-AC360-DEMO-PE-CASA-001',
    'contract_code', 'CTR-AC360-DEMO-PE-CASA-001',
    'invoice_codes', jsonb_build_array('AC360-INV-DEMO-0001', 'AC360-INV-DEMO-0002', 'AC360-INV-DEMO-0003')
  )
);

select * from _ac360_demo_cleanup_report order by created_at, id;

commit;
