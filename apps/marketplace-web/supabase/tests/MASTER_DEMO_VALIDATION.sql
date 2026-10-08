\set ON_ERROR_STOP on

-- Prepared read-only certification. Codex did not execute this file.
begin transaction read only;

-- A. Exact immutable identity chain. Every boolean must be true and count = 1.
select count(*)=1 as exact_identity_chain
from public.sanila_demo_configs c
join public.angelcare360_operator_tenants t on t.id=c.operator_tenant_id and t.school_id=c.school_id
join public.angelcare360_schools s on s.id=c.school_id
join public.app_users u on u.id=c.school_admin_app_user_id
join public.angelcare360_user_roles ur on ur.app_user_id=u.id and ur.school_id=s.id and ur.status='active'
where c.id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid
  and c.operator_tenant_id='85a655be-a92b-4b82-8e60-130f4e7c8e2f'::uuid
  and c.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
  and c.school_admin_app_user_id='25d16e25-2dd7-4c19-afb9-800609b3ba8a'::uuid
  and c.classification='master_demo' and c.active and c.billing_mode='non_billable' and c.safety_status='enforced'
  and t.tenant_slug='sanila-master-demo' and t.status='active'
  and s.school_code='SANILA-MASTER-DEMO' and s.name='SANILA INTERNATIONAL SCHOOL — DEMO' and s.status='active'
  and s.metadata_json->>'sanila_master_demo'='true' and u.status='active';

-- B. Ownership and scenario clock.
select
  count(*)=17714 as exact_registry_count,
  count(distinct table_name)=73 as exact_fixture_table_count,
  count(*) filter(where seed_version<>'SANILA_MASTER_DEMO_LIVING_SCHOOL_V1')=0 as one_seed_version
from public.sanila_demo_fixture_registry
where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid;

select
  c.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V1' as correct_seed_version,
  c.seed_health='healthy' as healthy,
  c.seed_counts->>'scenario_anchor'='2027-02-01' as correct_clock,
  (c.seed_counts->>'command_center_routes')::int=195 as route_contract,
  (c.seed_counts->>'forecast_total_fixture_rows')::int=17714 as forecast_contract
from public.sanila_demo_configs c
where c.id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid;

-- C. Core exact counts.
with c as (select '8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid school_id), actual as (
  select 'students' key,count(*) value from public.angelcare360_students,c where school_id=c.school_id
  union all select 'parents',count(*) from public.angelcare360_parents,c where school_id=c.school_id
  union all select 'staff',count(*) from public.angelcare360_staff,c where school_id=c.school_id
  union all select 'classes',count(*) from public.angelcare360_classes,c where school_id=c.school_id
  union all select 'enrollments',count(*) from public.angelcare360_class_enrollments,c where school_id=c.school_id
  union all select 'attendance_records',count(*) from public.angelcare360_attendance_records,c where school_id=c.school_id
  union all select 'invoices',count(*) from public.angelcare360_invoices,c where school_id=c.school_id
  union all select 'payments',count(*) from public.angelcare360_payments,c where school_id=c.school_id
  union all select 'transport_assignments',count(*) from public.angelcare360_transport_assignments,c where school_id=c.school_id
), expected(key,value) as (values ('students',600::bigint),('parents',450),('staff',72),('classes',36),('enrollments',600),('attendance_records',6000),('invoices',600),('payments',480),('transport_assignments',300))
select e.key,a.value actual,e.value expected,a.value=e.value as pass from expected e join actual a using(key) order by e.key;

-- D. Cross-domain referential integrity. Every bad count must be zero.
select 'student_enrollment_guardian' check_name,count(*) bad
from public.angelcare360_students s
left join public.angelcare360_class_enrollments e on e.student_id=s.id and e.school_id=s.school_id
left join public.angelcare360_student_parent_links l on l.student_id=s.id and l.school_id=s.school_id
where s.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (e.id is null or l.id is null or s.current_class_id<>e.class_id)
union all
select 'attendance_session_student',count(*) from public.angelcare360_attendance_records r
left join public.angelcare360_attendance_sessions se on se.id=r.attendance_session_id and se.school_id=r.school_id
left join public.angelcare360_students st on st.id=r.student_id and st.school_id=r.school_id
where r.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (se.id is null or st.id is null)
union all
select 'invoice_balance',count(*) from public.angelcare360_invoices i
where i.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (i.total_amount<0 or i.amount_paid<0 or i.amount_paid>i.total_amount or i.balance_due<>greatest(i.total_amount-i.amount_paid,0))
union all
select 'transport_scope',count(*) from public.angelcare360_transport_assignments a
left join public.angelcare360_students s on s.id=a.student_id and s.school_id=a.school_id
left join public.angelcare360_transport_routes r on r.id=a.route_id and r.school_id=a.school_id
where a.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (s.id is null or r.id is null)
union all
select 'library_scope',count(*) from public.angelcare360_library_loans l
left join public.angelcare360_library_copies cp on cp.id=l.copy_id and cp.school_id=l.school_id
left join public.angelcare360_library_books b on b.id=cp.book_id and b.school_id=l.school_id
where l.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (cp.id is null or b.id is null);

-- E. Synthetic-data and external-effect safety. Every bad count must be zero.
select 'contacts' check_name,
  (select count(*) from public.angelcare360_parents where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and ((email is not null and email not like '%@sanila-demo.invalid') or (phone is not null and phone not like '+212000%')))
 +(select count(*) from public.angelcare360_staff where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and ((email is not null and email not like '%@sanila-demo.invalid') or (phone is not null and phone not like '+212000%'))) bad
union all
select 'national_ids',count(*) from public.angelcare360_students where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and national_id is not null
union all
select 'external_reminder_success',count(*) from public.angelcare360_payment_reminders where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and metadata_json->>'demo'='true' and status not in ('blocked','cancelled','archived')
union all
select 'real_demo_file',count(*) from public.angelcare360_documents where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and metadata_json->>'demo'='true' and coalesce((metadata_json->>'placeholder_only')::boolean,false)=false;

-- F. Registry rows must resolve to real rows. Returned false rows are failures.
-- Run the generated per-table resolver in a controlled DBA client; PostgreSQL
-- cannot dynamically resolve arbitrary table names inside a plain read-only SELECT.
select table_name,count(*) registered,min(fixture_key) first_key,max(fixture_key) last_key
from public.sanila_demo_fixture_registry
where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'
group by table_name order by table_name;

rollback;
