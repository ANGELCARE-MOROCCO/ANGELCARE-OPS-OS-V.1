\set ON_ERROR_STOP on
-- Read-only runtime certification design. DO NOT EXECUTE in authoring mission.
-- Define SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION when embedded after the seed
-- in the installation dry run; standalone validation owns a read-only xact.
\if :{?SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION}
\else
begin transaction read only;
\endif

with exact_identity as (
 select c.* from public.sanila_demo_configs c join public.angelcare360_operator_tenants t on t.id=c.operator_tenant_id and t.school_id=c.school_id
 join public.angelcare360_schools s on s.id=c.school_id join public.app_users u on u.id=c.school_admin_app_user_id
 where c.id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and c.operator_tenant_id='85a655be-a92b-4b82-8e60-130f4e7c8e2f'
 and c.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and c.classification='master_demo' and c.active and c.billing_mode='non_billable'
 and c.safety_status='enforced' and t.tenant_slug='sanila-master-demo' and t.status='active' and s.school_code='SANILA-MASTER-DEMO' and u.status='active'
)
select 'MASTER_DEMO_IDENTITY_TENANT_NON_BILLABLE_SAFETY' assertion,count(*)=1 pass from exact_identity
union all select 'CANONICAL_SIMULATION_DATE_SINGLE_AUTHORITY',count(*)=1 from exact_identity where simulation_instant='2027-02-17T10:37:00Z' and simulation_timezone='Africa/Casablanca'
union all select 'BASELINE_DEPENDENCY_FROZEN',count(*)=1 from exact_identity where baseline_sha256='3a76db0f0e5e2fdb4f0ee6f18263fe0eb58f90aafbcf99c12e3ab79b796fbc9a'
union all select 'FIXTURE_CONTRACT_V2',count(*)=1 from exact_identity where fixture_contract_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
union all select 'BASELINE_CONTRACT',coalesce((public.sanila_master_demo_baseline_contract()->>'valid')::boolean,false);

with s as (select '8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid id),checks(assertion,actual,minimum) as (
 select 'STUDENTS',count(*),600 from public.angelcare360_students,s where school_id=s.id
 union all select 'HOUSEHOLDS',count(*),450 from public.angelcare360_area11_families,s where school_id=s.id
 union all select 'STAFF',count(*),72 from public.angelcare360_staff,s where school_id=s.id
 union all select 'TEACHERS',count(*),48 from public.angelcare360_staff,s where school_id=s.id and staff_type in('teacher','enseignant')
 union all select 'CLASSES',count(*),36 from public.angelcare360_classes,s where school_id=s.id
 union all select 'SUBJECTS',count(*),12 from public.angelcare360_subjects,s where school_id=s.id
 union all select 'TIMETABLE_SLOTS',count(*),1260 from public.angelcare360_timetable_slots,s where school_id=s.id
 union all select 'LESSONS',count(*),3456 from public.angelcare360_lessons,s where school_id=s.id
 union all select 'ASSIGNMENTS',count(*),1152 from public.angelcare360_assignments,s where school_id=s.id
 union all select 'MARKS',count(*),9600 from public.angelcare360_marks,s where school_id=s.id
 union all select 'REPORT_CARD_LINES',count(*),4800 from public.angelcare360_report_card_lines,s where school_id=s.id
 union all select 'STUDENT_ATTENDANCE',count(*),54000 from public.angelcare360_attendance_records,s where school_id=s.id
 union all select 'PAYROLL_PERIODS',count(*),6 from public.angelcare360_payroll_periods,s where school_id=s.id
 union all select 'PAYROLL_RECORDS',count(*),432 from public.angelcare360_payroll_records,s where school_id=s.id
 union all select 'PAYROLL_PAYMENT_HISTORY',count(*),288 from public.angelcare360_payroll_payment_items,s where school_id=s.id
 union all select 'PAYROLL_RECONCILIATION',count(*),4 from public.angelcare360_payroll_reconciliation_sessions,s where school_id=s.id
 union all select 'FINANCE_INVOICES',count(*),3600 from public.angelcare360_invoices,s where school_id=s.id
 union all select 'FINANCE_PARTIAL',count(*),300 from public.angelcare360_invoices,s where school_id=s.id and status='partially_paid'
 union all select 'FINANCE_OVERDUE',count(*),300 from public.angelcare360_invoices,s where school_id=s.id and status='overdue'
 union all select 'ADMISSIONS_MULTI_STAGE',count(distinct status),4 from public.angelcare360_admission_applications,s where school_id=s.id
 union all select 'LIBRARY_HISTORY',count(*),360 from public.angelcare360_library_loans,s where school_id=s.id
 union all select 'INVENTORY_MOVEMENTS',count(*),360 from public.angelcare360_inventory_movements,s where school_id=s.id
 union all select 'COMMUNICATION_HISTORY',count(*),60 from public.angelcare360_messages,s where school_id=s.id
 union all select 'COMPLAINTS',count(*),20 from public.angelcare360_reclamations,s where school_id=s.id
 union all select 'CALENDAR',count(*),30 from public.angelcare360_school_calendar_events,s where school_id=s.id
)
select assertion,actual,minimum,actual>=minimum pass from checks order by assertion;

select 'TIMETABLE_TEACHER_DOUBLE_BOOKING' assertion,count(*)=0 pass from(
 select day_of_week,start_time,staff_id,count(*) from public.angelcare360_timetable_slots
 where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and status='active' group by 1,2,3 having count(*)>1
)x
union all select 'TIMETABLE_ROOM_DOUBLE_BOOKING',count(*)=0 from(
 select day_of_week,start_time,room,count(*) from public.angelcare360_timetable_slots
 where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and status='active' group by 1,2,3 having count(*)>1
)x
union all select 'MULTI_SUBJECT_REPORT_CARDS',count(*)=600 from(
 select report_card_id from public.angelcare360_report_card_lines where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' group by report_card_id having count(distinct subject_id)>=8
)x
union all select 'ATTENDANCE_MULTI_MONTH',count(distinct session_date)>=90 from public.angelcare360_attendance_sessions where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad'
union all select 'STUDENT_ATTENDANCE_DAYS',count(distinct session_date)=90 from public.angelcare360_attendance_sessions where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad'
union all select 'TODAY_STUDENT_ATTENDANCE_SESSIONS',count(*)=36 from public.angelcare360_attendance_sessions where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and session_date=date '2027-02-17'
union all select 'TODAY_STUDENT_ATTENDANCE_RECORDS',count(*)=600 from public.angelcare360_attendance_records r join public.angelcare360_attendance_sessions s on s.id=r.attendance_session_id where r.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and s.session_date=date '2027-02-17'
union all select 'ACADEMIC_HISTORY_MULTI_MONTH',max(lesson_date)-min(lesson_date)>=120 from public.angelcare360_lessons where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad'
union all select 'ACADEMIC_TODAY_STATE',count(*)>0 from public.angelcare360_lessons where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and lesson_date=date '2027-02-17' and status in('delivered','completed','partially_delivered')
union all select 'ACADEMIC_UPCOMING_ASSIGNMENT',count(*)>0 from public.angelcare360_assignments where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and due_on between date '2027-02-18' and date '2027-02-21' and status in('published','active','due')
union all select 'ACADEMIC_UPCOMING_EXAM',count(*)>0 from public.angelcare360_exams e where e.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and e.scheduled_on>date '2027-02-17' and e.status='planned' and exists(select 1 from public.angelcare360_exam_sessions x where x.exam_id=e.id and x.starts_at>'2027-02-17T10:37:00Z'::timestamptz and x.status='planned')
union all select 'NO_PLANNED_EVENT_STRANDED_IN_PAST',not exists(
 select 1 from public.angelcare360_lessons where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and lesson_date<date '2027-02-17' and status in('planned','scheduled')
 union all select 1 from public.angelcare360_assignments where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and due_on<date '2027-02-17' and status in('planned','published','active','due')
 union all select 1 from public.angelcare360_exam_sessions where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and starts_at<'2027-02-17T10:37:00Z'::timestamptz and status in('planned','open')
 union all select 1 from public.angelcare360_school_calendar_events where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and ends_on<date '2027-02-17' and status='planned')
union all select 'PENDING_GRADING_CASES',count(*)>0 from public.angelcare360_marks where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and mark_state='pending'
union all select 'RETAKE_CASES',count(*)>0 from public.angelcare360_marks where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and metadata_json->>'retake'='true';

with org as(select id from public.ac360_organizations where id='8bc47614-f16c-41c0-8d37-22fe78b08cad' or metadata_json->>'angelcare360_school_id'='8bc47614-f16c-41c0-8d37-22fe78b08cad' limit 1)
select 'TRANSPORT_RUNS' assertion,count(*)>=640 pass from public.ac360_school_transport_route_runs,org where org_id=org.id
union all select 'TRANSPORT_PICKUP_DROPOFF_EVENTS',count(*)>=12000 from public.ac360_school_transport_run_events,org where org_id=org.id and event_type in('student_boarded','student_dropped','student_absent')
union all select 'TRANSPORT_SAFETY',count(*)>=640 from public.ac360_school_transport_safety_checks,org where org_id=org.id
union all select 'TRANSPORT_DELAYS',count(*)>=40 from public.ac360_school_transport_run_events,org where org_id=org.id and event_type='delay'
union all select 'TRANSPORT_INCIDENTS',count(*)>=8 from public.ac360_school_transport_run_events,org where org_id=org.id and event_type='incident'
union all select 'TRANSPORT_ALERTS',count(*)>=32 from public.ac360_school_transport_alerts,org where org_id=org.id
union all select 'TODAY_PICKUP_RUNS_PRESENT',count(*)=8 from public.ac360_school_transport_route_runs,org where org_id=org.id and run_date=date '2027-02-17' and run_type='pickup'
union all select 'TODAY_PICKUP_MANIFEST_EVENTS_PRESENT',count(*)=300 from public.ac360_school_transport_run_events e join public.ac360_school_transport_route_runs r on r.id=e.route_run_id,org where e.org_id=org.id and r.run_date=date '2027-02-17' and r.run_type='pickup' and e.event_type in('student_boarded','student_absent') and e.occurred_at<='2027-02-17T10:37:00Z'::timestamptz
union all select 'TODAY_DROPOFF_RUNS_PRESENT',count(*)=8 from public.ac360_school_transport_route_runs,org where org_id=org.id and run_date=date '2027-02-17' and run_type='dropoff' and status='planned'
union all select 'TODAY_DROPOFF_FUTURE_RUNS_MARKED_COMPLETED',count(*)=0 from public.ac360_school_transport_route_runs,org where org_id=org.id and run_date=date '2027-02-17' and run_type='dropoff' and (status<>'planned' or started_at is not null or ended_at is not null)
union all select 'FUTURE_TRANSPORT_EVENTS_BEFORE_CLOCK',count(*)=0 from public.ac360_school_transport_run_events e join public.ac360_school_transport_route_runs r on r.id=e.route_run_id,org where e.org_id=org.id and r.run_date=date '2027-02-17' and e.occurred_at>'2027-02-17T10:37:00Z'::timestamptz
union all select 'FUTURE_POST_ROUTE_SAFETY_CHECKS_BEFORE_CLOCK',count(*)=0 from public.ac360_school_transport_safety_checks c join public.ac360_school_transport_route_runs r on r.id=c.route_run_id,org where c.org_id=org.id and r.run_date=date '2027-02-17' and r.run_type='dropoff';

with org as(select id from public.ac360_organizations where id='8bc47614-f16c-41c0-8d37-22fe78b08cad' or metadata_json->>'angelcare360_school_id'='8bc47614-f16c-41c0-8d37-22fe78b08cad' limit 1)
select 'STAFF_ATTENDANCE_ROWS' assertion,count(*)=6480 pass from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff'
union all select 'STAFF_ATTENDANCE_DAYS',count(distinct recorded_at::date)=90 from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff'
union all select 'TODAY_STAFF_ATTENDANCE',count(*)=72 from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff' and recorded_at::date=date '2027-02-17'
union all select 'STAFF_ATTENDANCE_MULTI_MONTH',count(distinct date_trunc('month',recorded_at))=6 from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff'
union all select 'STAFF_ABSENCE_CASES',count(*)>0 from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff' and attendance_status in('absent','authorized_absence')
union all select 'STAFF_LATENESS_CASES',count(*)>0 from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff' and attendance_status='late'
union all select 'STAFF_LEAVE_COHERENCE',count(*)=18 from public.ac360_school_leave_requests l,org where l.org_id=org.id and exists(select 1 from public.ac360_school_attendance_records a where a.org_id=l.org_id and a.staff_profile_id=l.staff_profile_id and a.recorded_at::date=l.starts_on and a.attendance_status in('authorized_absence','absent'))
union all select 'STAFF_PAYROLL_COHERENCE',count(*)=1 from public.angelcare360_payroll_input_revisions where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and staff_id=(select fixture_id from public.sanila_demo_fixture_registry where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and table_name='angelcare360_staff' and fixture_key='staff:61') and evidence_json->>'attendance_anomaly'='true'
union all select 'TASKS_CURRENT_DAY',count(*)>0 from public.ac360_school_tasks,org where org_id=org.id and due_at::date='2027-02-17'
union all select 'TASKS_PENDING',count(*)>0 from public.ac360_school_tasks,org where org_id=org.id and status in('planned','in_progress')
union all select 'TASKS_OVERDUE',count(*)>0 from public.ac360_school_tasks,org where org_id=org.id and due_at<'2027-02-17T10:37:00Z' and status not in('done','cancelled','archived')
union all select 'TASKS_COMPLETED',count(*)>0 from public.ac360_school_tasks,org where org_id=org.id and status='done' and completed_at is not null
union all select 'MAINTENANCE_TASKS',count(*)>0 from public.ac360_school_tasks,org where org_id=org.id and (department='maintenance' or related_entity_type='maintenance')
union all select 'QUALITY_ACTIONS',count(*)>0 from public.ac360_school_tasks,org where org_id=org.id and department='quality'
union all select 'TASK_ASSIGNEES_VALID',count(*)=0 from public.ac360_school_tasks t,org where t.org_id=org.id and not exists(select 1 from public.ac360_school_staff_profiles p where p.id=t.assigned_staff_id and p.org_id=t.org_id)
union all select 'GENERAL_INCIDENTS',count(*)=24 from public.ac360_school_incident_reports,org where org_id=org.id
union all select 'HEALTH_SAFETY_CURRENT_CASES',count(*)>=6 from public.ac360_school_incident_reports,org where org_id=org.id and occurred_at::date='2027-02-17' and status='open'
union all select 'HEALTH_SAFETY_HISTORY',count(*)>=18 from public.ac360_school_incident_reports,org where org_id=org.id and occurred_at::date<'2027-02-17'
union all select 'HEALTH_SAFETY_FOLLOWUP',count(*)>=72 from public.ac360_school_incident_events,org where org_id=org.id
union all select 'HEALTH_SAFETY_RESOLUTION',count(*)>=12 from public.ac360_school_incident_reports,org where org_id=org.id and status in('resolved','closed')
union all select 'GENERAL_SAFETY_CHECK_TODAY_PRESENT',count(*)>0 from public.ac360_school_safety_checks,org where org_id=org.id and checked_at::date=date '2027-02-17' and checked_at<='2027-02-17T10:37:00Z'::timestamptz
union all select 'GENERAL_SAFETY_HISTORY_MULTI_MONTH',count(distinct date_trunc('month',checked_at))=6 from public.ac360_school_safety_checks,org where org_id=org.id;

select 'REGISTRY_EXACT_FORECAST' assertion,count(*)=127177 pass,count(*) actual from public.sanila_demo_fixture_registry
 where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
union all select 'REGISTRY_EXACT_TABLE_COUNT',count(distinct table_name)=111,count(distinct table_name) from public.sanila_demo_fixture_registry where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
union all select 'NO_UNTRACKED_DEMO_CREATED_ROWS',count(*)=0,count(*) from public.sanila_demo_mutation_journal where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'
union all select 'CANONICAL_CONTENT_MATCH',count(*)=127177,count(*) from public.sanila_demo_fixture_registry r where r.config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2' and r.canonical_content_hash=md5(r.canonical_payload::text) and public.sanila_master_demo_fixture_content_matches(r.table_name,r.fixture_id,r.canonical_payload);

with expected as(select unnest(public.sanila_master_demo_v2_mutable_tables()) table_name),coverage as(
 select e.table_name,
  bool_or(t.tgname='sanila_master_demo_mutation_insert' and pg_get_triggerdef(t.oid) like '% AFTER INSERT ON %') insert_ok,
  bool_or(t.tgname='sanila_master_demo_mutation_update' and pg_get_triggerdef(t.oid) like '% AFTER UPDATE ON %') update_ok,
  bool_or(t.tgname='sanila_master_demo_mutation_delete' and pg_get_triggerdef(t.oid) like '% AFTER DELETE ON %') delete_ok
 from expected e left join pg_namespace n on n.nspname='public' left join pg_class p on p.relnamespace=n.oid and p.relname=e.table_name
 left join pg_trigger t on t.tgrelid=p.oid and not t.tgisinternal group by e.table_name)
select 'MUTABLE_TABLES_TOTAL' assertion,count(*)=110 pass,count(*) actual from coverage
union all select 'MUTABLE_TABLES_INSERT_CAPTURE',count(*) filter(where coalesce(insert_ok,false))=110,count(*) filter(where coalesce(insert_ok,false)) from coverage
union all select 'MUTABLE_TABLES_UPDATE_CAPTURE',count(*) filter(where coalesce(update_ok,false))=110,count(*) filter(where coalesce(update_ok,false)) from coverage
union all select 'MUTABLE_TABLES_DELETE_CAPTURE',count(*) filter(where coalesce(delete_ok,false))=110,count(*) filter(where coalesce(delete_ok,false)) from coverage
union all select 'MUTATION_INSERT_COVERAGE_MISSING',count(*) filter(where not coalesce(insert_ok,false))=0,count(*) filter(where not coalesce(insert_ok,false)) from coverage
union all select 'MUTATION_UPDATE_COVERAGE_MISSING',count(*) filter(where not coalesce(update_ok,false))=0,count(*) filter(where not coalesce(update_ok,false)) from coverage
union all select 'MUTATION_DELETE_COVERAGE_MISSING',count(*) filter(where not coalesce(delete_ok,false))=0,count(*) filter(where not coalesce(delete_ok,false)) from coverage;

with expected as(select key table_name,value::bigint expected_count from jsonb_each_text(public.sanila_master_demo_v2_expected_fixture_counts())),
actual as(select table_name,count(*) actual_count from public.sanila_demo_fixture_registry where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2' group by table_name)
select 'REGISTRY_EXACT_FAMILY_COUNTS' assertion,count(*)=0 pass,count(*) actual from expected full join actual using(table_name) where expected_count is distinct from actual_count;

select 'SYNTHETIC_CONTACTS_ONLY' assertion,
 not exists(select 1 from public.angelcare360_parents where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (email not like '%@sanila-demo.invalid' or phone not like '+212000%')) pass
union all select 'NO_REAL_STUDENT_NATIONAL_IDS',not exists(select 1 from public.angelcare360_students where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and national_id is not null)
union all select 'EXTERNAL_SIDE_EFFECTS_BLOCKED',not exists(select 1 from public.sanila_demo_side_effect_events where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and outcome not in('blocked','simulated'));

-- Reset-twice acceptance authority: identity is reported separately, while the
-- authoritative comparison includes normalized canonical content for every row.
select md5(string_agg(table_name||':'||fixture_key||':'||fixture_id::text,'|' order by table_name,fixture_key)) as canonical_identity_fingerprint,
 md5(string_agg(table_name||':'||fixture_key||':'||fixture_id::text||':'||canonical_content_hash,'|' order by table_name,fixture_key)) as canonical_content_fingerprint
from public.sanila_demo_fixture_registry where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2';

-- Process-level hard gate. This SELECT is read-only; psql exits 3 on any false
-- critical certification and returns zero only after every predicate passes.
with org as(select id from public.ac360_organizations where id='8bc47614-f16c-41c0-8d37-22fe78b08cad' or metadata_json->>'angelcare360_school_id'='8bc47614-f16c-41c0-8d37-22fe78b08cad' limit 1),
expected as(select unnest(public.sanila_master_demo_v2_mutable_tables()) table_name),coverage as(
 select e.table_name,
  bool_or(t.tgname='sanila_master_demo_mutation_insert' and pg_get_triggerdef(t.oid) like '% AFTER INSERT ON %') insert_ok,
  bool_or(t.tgname='sanila_master_demo_mutation_update' and pg_get_triggerdef(t.oid) like '% AFTER UPDATE ON %') update_ok,
  bool_or(t.tgname='sanila_master_demo_mutation_delete' and pg_get_triggerdef(t.oid) like '% AFTER DELETE ON %') delete_ok
 from expected e left join pg_namespace n on n.nspname='public' left join pg_class p on p.relnamespace=n.oid and p.relname=e.table_name
 left join pg_trigger t on t.tgrelid=p.oid and not t.tgisinternal group by e.table_name),critical(pass) as(
 select exists(select 1 from public.sanila_demo_configs c join public.angelcare360_operator_tenants t on t.id=c.operator_tenant_id and t.school_id=c.school_id join public.angelcare360_schools s on s.id=c.school_id join public.app_users u on u.id=c.school_admin_app_user_id where c.id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and c.operator_tenant_id='85a655be-a92b-4b82-8e60-130f4e7c8e2f' and c.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and c.school_admin_app_user_id='25d16e25-2dd7-4c19-afb9-800609b3ba8a' and c.classification='master_demo' and c.active and c.billing_mode='non_billable' and c.safety_status='enforced' and c.simulation_instant='2027-02-17T10:37:00Z' and c.simulation_timezone='Africa/Casablanca' and t.tenant_slug='sanila-master-demo' and t.status='active' and s.school_code='SANILA-MASTER-DEMO' and u.status='active')
 union all select coalesce((public.sanila_master_demo_baseline_contract()->>'valid')::boolean,false)
 union all select (select count(*)=127177 and count(distinct table_name)=111 from public.sanila_demo_fixture_registry where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2')
 union all select not exists(with e as(select key table_name,value::bigint expected_count from jsonb_each_text(public.sanila_master_demo_v2_expected_fixture_counts())),a as(select table_name,count(*) actual_count from public.sanila_demo_fixture_registry where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2' group by table_name) select 1 from e full join a using(table_name) where expected_count is distinct from actual_count)
 union all select (select count(*)=110 and bool_and(coalesce(insert_ok,false) and coalesce(update_ok,false) and coalesce(delete_ok,false)) from coverage)
 union all select not exists(select 1 from public.sanila_demo_fixture_registry r where r.config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and (r.canonical_content_hash<>md5(r.canonical_payload::text) or not public.sanila_master_demo_fixture_content_matches(r.table_name,r.fixture_id,r.canonical_payload)))
 union all select (select count(*)=36 from public.angelcare360_attendance_sessions where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and session_date=date '2027-02-17')
 union all select (select count(*)=600 from public.angelcare360_attendance_records r join public.angelcare360_attendance_sessions s on s.id=r.attendance_session_id where r.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and s.session_date=date '2027-02-17')
 union all select (select count(*)=72 from public.ac360_school_attendance_records,org where org_id=org.id and attendance_type='staff' and recorded_at::date=date '2027-02-17')
 union all select exists(select 1 from public.angelcare360_lessons where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and lesson_date=date '2027-02-17' and status in('delivered','completed','partially_delivered'))
 union all select exists(select 1 from public.angelcare360_assignments where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and due_on between date '2027-02-18' and date '2027-02-21' and status in('published','active','due'))
 union all select exists(select 1 from public.angelcare360_exams where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and scheduled_on>date '2027-02-17' and status='planned')
 union all select (select count(*)=8 from public.ac360_school_transport_route_runs,org where org_id=org.id and run_date=date '2027-02-17' and run_type='pickup')
 union all select (select count(*)=300 from public.ac360_school_transport_run_events e join public.ac360_school_transport_route_runs r on r.id=e.route_run_id,org where e.org_id=org.id and r.run_date=date '2027-02-17' and r.run_type='pickup' and e.event_type in('student_boarded','student_absent') and e.occurred_at<='2027-02-17T10:37:00Z')
 union all select (select count(*)=8 from public.ac360_school_transport_route_runs,org where org_id=org.id and run_date=date '2027-02-17' and run_type='dropoff' and status='planned' and started_at is null and ended_at is null)
 union all select not exists(select 1 from public.ac360_school_transport_run_events e join public.ac360_school_transport_route_runs r on r.id=e.route_run_id,org where e.org_id=org.id and r.run_date=date '2027-02-17' and e.occurred_at>'2027-02-17T10:37:00Z')
 union all select not exists(select 1 from public.ac360_school_transport_safety_checks c join public.ac360_school_transport_route_runs r on r.id=c.route_run_id,org where c.org_id=org.id and r.run_date=date '2027-02-17' and r.run_type='dropoff')
 union all select exists(select 1 from public.ac360_school_safety_checks,org where org_id=org.id and checked_at::date=date '2027-02-17' and checked_at<='2027-02-17T10:37:00Z')
 union all select not exists(select 1 from public.sanila_demo_side_effect_events where config_id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a' and outcome not in('blocked','simulated'))
 union all select not exists(select 1 from public.angelcare360_parents where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (email not like '%@sanila-demo.invalid' or phone not like '+212000%'))
  and not exists(select 1 from public.angelcare360_staff where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and (email not like '%@sanila-demo.invalid' or phone not like '+212000%'))
  and not exists(select 1 from public.angelcare360_students where school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad' and national_id is not null)
)
select coalesce(bool_and(pass),false) all_critical_pass from critical
\gset sanila_validation_
\if :sanila_validation_all_critical_pass
\else
rollback;
\quit 3
\endif

\if :{?SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION}
\else
rollback;
\endif
