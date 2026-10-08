\set ON_ERROR_STOP on
-- SANILA_MASTER_DEMO_LIVING_SCHOOL_DIGITAL_TWIN_V2
-- DATA ONLY. Requires 20260905120000_sanila_master_demo_v2_infrastructure.sql.
-- Canonical instant: 2027-02-17 10:37 Africa/Casablanca (UTC+00 on this date). DO NOT EXECUTE.
\if :{?SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION}
\else
begin;
\endif
select set_config('sanila.demo_fixture_write','on',true);

do $$
declare
 c public.sanila_demo_configs%rowtype;y uuid;term2 uuid;class_id uuid;section_id uuid;student_id uuid;staff_id uuid;
 subject_id uuid;assignment_id uuid;exam_id uuid;period_id uuid;record_id uuid;invoice_id uuid;payment_id uuid;
 org_id uuid;route_id uuid;vehicle_id uuid;driver_id uuid;stop_id uuid;run_id uuid;d date;
 i int;j int;k int;m int;baseline jsonb;baseline_contract jsonb;amount numeric;paid numeric;
 registry_rows bigint;registry_tables integer;registry_mismatches integer;content_mismatches bigint;
 mutable_tables integer;insert_coverage_missing integer;update_coverage_missing integer;delete_coverage_missing integer;
 months date[]:=array['2026-10-01','2026-11-01','2026-12-01','2027-01-01','2027-02-01']::date[];
begin
 select * into c from public.sanila_demo_configs where id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid for update;
 if not found or c.operator_tenant_id<>'85a655be-a92b-4b82-8e60-130f4e7c8e2f'::uuid
  or c.school_id<>'8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
  or c.school_admin_app_user_id<>'25d16e25-2dd7-4c19-afb9-800609b3ba8a'::uuid
  or c.classification<>'master_demo' or not c.active or c.billing_mode<>'non_billable' or c.safety_status<>'enforced'
 then raise exception 'REFUSED: exact Master Demo identity/safety chain mismatch';end if;
 if not exists(select 1 from public.angelcare360_operator_tenants where id=c.operator_tenant_id and school_id=c.school_id and tenant_slug='sanila-master-demo' and status='active')
 then raise exception 'REFUSED: exact active tenant link missing';end if;
 if not pg_try_advisory_xact_lock(hashtextextended('sanila-master-demo-v2:'||c.id::text,0)) then raise exception 'Master Demo seed/reset already running';end if;

 -- Frozen V1 baseline contract: migration source SHA-256 3a76db0f...b796fbc9a.
 if to_regprocedure('public.sanila_seed_master_demo(uuid)') is null or to_regprocedure('public.sanila_master_demo_baseline_contract()') is null then raise exception 'FROZEN_BASELINE_MISSING';end if;
 baseline_contract:=public.sanila_master_demo_baseline_contract();
 if not coalesce((baseline_contract->>'valid')::boolean,false)
  or baseline_contract->>'source_sha256'<>'3a76db0f0e5e2fdb4f0ee6f18263fe0eb58f90aafbcf99c12e3ab79b796fbc9a'
 then raise exception 'WRONG_BASELINE_REFUSED: %',baseline_contract;end if;
 baseline:=public.sanila_seed_master_demo(c.id);
 if not coalesce((baseline->>'ok')::boolean,false) then raise exception 'FROZEN_BASELINE_FAILED: %',baseline;end if;
 y:=public.sanila_master_demo_fixture_uuid(c.id,'academic-year:2026-2027');
 term2:=public.sanila_master_demo_fixture_uuid(c.id,'term:2');

 update public.sanila_demo_configs set simulation_instant='2027-02-17T10:37:00Z',simulation_timezone='Africa/Casablanca',
  fixture_contract_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2',baseline_sha256='3a76db0f0e5e2fdb4f0ee6f18263fe0eb58f90aafbcf99c12e3ab79b796fbc9a',
  seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2',seed_health='degraded',updated_at=clock_timestamp() where id=c.id;
 update public.angelcare360_terms set status=case when id=public.sanila_master_demo_fixture_uuid(c.id,'term:1') then 'closed' when id=term2 then 'active' else 'planned' end where school_id=c.school_id;
 update public.angelcare360_lessons set status='delivered' where school_id=c.school_id and lesson_date<date '2027-02-17' and status in('planned','scheduled');
 update public.angelcare360_assignments set status='closed' where school_id=c.school_id and due_on<date '2027-02-17' and status in('planned','published','active','due');
 update public.angelcare360_exam_sessions set status='closed' where school_id=c.school_id and starts_at<'2027-02-17T10:37:00Z'::timestamptz and status in('planned','open');
 update public.angelcare360_school_calendar_events set status='completed' where school_id=c.school_id and ends_on<date '2027-02-17' and status='planned';

 -- Commercially required V1 forecast families that the frozen baseline does
 -- not materialize itself. They are explicit required upserts: none may skip.
 for i in 1..5 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_school_day_rules','school-day-rule:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'day_of_week',i,'is_operational',true,'starts_at','08:00','ends_at','16:30','status','active'));end loop;
 for i in 1..60 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_emergency_contacts','emergency-contact:'||i,jsonb_build_object('school_id',c.school_id,'contactable_type','student','contactable_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'contact_name','Contact urgence fictif '||i,'relationship_type','guardian','phone','+2120007'||lpad(i::text,5,'0'),'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..450 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_area11_families','family:'||i,jsonb_build_object('school_id',c.school_id,'family_code','DEMO-FAM-'||lpad(i::text,4,'0'),'display_name','Famille Démo '||i,'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..600 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_area11_family_memberships','family-membership:'||i,jsonb_build_object('school_id',c.school_id,'family_id',public.sanila_master_demo_fixture_uuid(c.id,'family:'||(1+((i-1)%450))),'member_type','student','student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'status','active'));end loop;
 for i in 1..600 loop
  student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i);class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||(1+((i-1)%36)));
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_teacher_comments','teacher-comment:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'student_id',student_id,'staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i-1)%48))),'comment_text','Appréciation pédagogique synthétique.','comment_type','appreciation','status','active','metadata_json',jsonb_build_object('demo',true)));
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_cards','report-card:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'class_id',class_id,'term_id',term2,'report_card_code','DEMO-RC-'||lpad(i::text,4,'0'),'overall_average',7+(i%14),'status',case when i%7=0 then 'draft' else 'published' end,'metadata_json',jsonb_build_object('demo',true)));
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_student_fee_assignments','student-fee-assignment:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'fee_structure_id',public.sanila_master_demo_fixture_uuid(c.id,'fee-structure:1'),'assigned_on','2026-09-01','status','active','metadata_json',jsonb_build_object('demo',true)));
 end loop;
 for i in 1..60 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_payment_reminders','payment-reminder:'||i,jsonb_build_object('school_id',c.school_id,'invoice_id',public.sanila_master_demo_fixture_uuid(c.id,'invoice:'||i),'student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'reminder_code','DEMO-REM-'||lpad(i::text,3,'0'),'reminder_type','payment_due','scheduled_for','2027-02-18T09:00:00Z','status','scheduled','metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')));end loop;
 for i in 1..8 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_message_templates','message-template:'||i,jsonb_build_object('school_id',c.school_id,'template_code','DEMO-MTPL-'||i,'name','Modèle communication '||i,'channel','in_app','content','Contenu synthétique de démonstration.','status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..12 loop
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_conversations','conversation:'||i,jsonb_build_object('school_id',c.school_id,'conversation_code','DEMO-CONV-'||i,'subject','Conversation interne fictive '||i,'conversation_type','internal','status',case when i<=4 then 'open' else 'archived' end,'metadata_json',jsonb_build_object('demo',true)));
  for j in 1..2 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_conversation_participants','conversation-participant:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'conversation_id',public.sanila_master_demo_fixture_uuid(c.id,'conversation:'||i),'participant_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(1+((i+j-2)%72))),'participant_role','staff','status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 end loop;
 for i in 1..6 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_document_templates','document-template:'||i,jsonb_build_object('school_id',c.school_id,'template_code','DEMO-DTPL-'||i,'label','Modèle document '||i,'document_type','internal','description','Document synthétique de démonstration.','status','ready','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..24 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_documents','document:'||i,jsonb_build_object('school_id',c.school_id,'document_code','DEMO-DOC-'||lpad(i::text,3,'0'),'documentable_type','student','documentable_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'category','school_record','title','Document fictif '||i,'file_name','demo-'||i||'.pdf','file_path','demo/non-downloadable/'||i||'.pdf','mime_type','application/pdf','status','active','metadata_json',jsonb_build_object('demo',true,'external_storage','blocked')));end loop;
 for i in 1..4 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_templates','report-template:'||i,jsonb_build_object('school_id',c.school_id,'report_id',public.sanila_master_demo_fixture_uuid(c.id,'report:'||i),'template_code','DEMO-RPT-TPL-'||i,'label','Modèle rapport '||i,'output_format','pdf_a4','status','active','config_json',jsonb_build_object('demo',true),'metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..8 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_requests','report-request:'||i,jsonb_build_object('school_id',c.school_id,'report_id',public.sanila_master_demo_fixture_uuid(c.id,'report:'||(1+((i-1)%4))),'report_template_id',public.sanila_master_demo_fixture_uuid(c.id,'report-template:'||(1+((i-1)%4))),'request_code','DEMO-RREQ-'||i,'report_code','DEMO-RPT-'||(1+((i-1)%4)),'filters_json',jsonb_build_object('demo',true),'status',case when i<=4 then 'ready' else 'requested' end,'metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..4 loop
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_exports','report-export:'||i,jsonb_build_object('school_id',c.school_id,'report_id',public.sanila_master_demo_fixture_uuid(c.id,'report:'||i),'export_code','DEMO-REXP-'||i,'export_format','pdf','status','completed','metadata_json',jsonb_build_object('demo',true,'external_storage','blocked')));
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_export_files','export-file:'||i,jsonb_build_object('school_id',c.school_id,'report_export_id',public.sanila_master_demo_fixture_uuid(c.id,'report-export:'||i),'export_code','DEMO-REXP-'||i,'file_code','DEMO-EFILE-'||i,'file_name','rapport-demo-'||i||'.pdf','file_path','demo/non-downloadable/report-'||i||'.pdf','mime_type','application/pdf','status','ready','metadata_json',jsonb_build_object('demo',true,'external_storage','blocked')));
 end loop;

 -- Complete frozen-baseline diagnostic exam/session parity.
 -- The V1 baseline owns 36 diagnostic exams but no exam-session rows.
 -- V2 adds exactly one historical closed session per baseline exam so every
 -- one of the 612 canonical exams has a materially inspectable session.
 for i in 1..36 loop
  exam_id:=public.sanila_master_demo_fixture_uuid(c.id,'exam:'||i);
  perform public.sanila_master_demo_upsert(
   c.id,
   'angelcare360_exam_sessions',
   'v2-baseline-exam-session:'||i,
   jsonb_build_object(
    'school_id',c.school_id,
    'exam_id',exam_id,
    'session_code','V2-BASE-ES-'||lpad(i::text,2,'0'),
    'starts_at','2026-09-10T09:00:00+01:00'::timestamptz,
    'ends_at','2026-09-10T10:00:00+01:00'::timestamptz,
    'room','Salle '||lpad(i::text,2,'0'),
    'invigilator_staff_id',
      public.sanila_master_demo_fixture_uuid(
       c.id,
       'staff:'||(7+((i-1)%48))
      ),
    'status','closed',
    'metadata_json',
      jsonb_build_object(
       'demo',true,
       'historical',true,
       'baseline_exam_session',true
      )
   )
  );
 end loop;

 -- Full five-day timetable: seven structured periods/class/day = 1,260 total with baseline rows replaced/adopted.
 delete from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_timetable_slots';
 delete from public.angelcare360_timetable_slots where school_id=c.school_id and metadata_json->>'demo'='true';
 for i in 1..36 loop
  class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||i);section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||i);
  for j in 1..5 loop for k in 1..7 loop
   subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((i+k+j-3)%12)));
   staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i*7+j+k-3)%48)));
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_timetable_slots','v2-slot:'||i||':'||j||':'||k,
    jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,
    'day_of_week',j,'staff_id',staff_id,'start_time',(time '08:00'+((k-1)*interval '55 minutes'))::text,'end_time',(time '08:50'+((k-1)*interval '55 minutes'))::text,
    'room','Salle '||lpad(i::text,2,'0'),'status','active','metadata_json',jsonb_build_object('demo',true,'period_index',k,'conflict_key',j||':'||k||':'||i)));
  end loop;end loop;
 end loop;

 -- Replace shallow baseline allocations/lines, then build eight subjects/class and eight report lines/student.
 delete from public.sanila_demo_fixture_registry where config_id=c.id and table_name in('angelcare360_teacher_assignments','angelcare360_class_subjects','angelcare360_report_card_lines');
 delete from public.angelcare360_teacher_assignments where school_id=c.school_id and metadata_json->>'demo'='true';
 delete from public.angelcare360_class_subjects where school_id=c.school_id and metadata_json->>'demo'='true';
 delete from public.angelcare360_report_card_lines where school_id=c.school_id and metadata_json->>'demo'='true';
 -- Eight subjects/class, repeated lessons/assessments, four submissions/student, 16 marks/student and eight report lines/student.
 for i in 1..36 loop
  class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||i);section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||i);
  for j in 1..8 loop
   subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||j);staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i+j-2)%48)));
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_class_subjects','v2-class-subject:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'subject_id',subject_id,'teacher_id',staff_id,'coefficient',1,'is_required',true,'status','active','metadata_json',jsonb_build_object('demo',true)));
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_teacher_assignments','v2-teacher-assignment:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'staff_id',staff_id,'assignment_role','teacher','weekly_hours',3,'status','active','metadata_json',jsonb_build_object('demo',true)));
   for k in 1..12 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_lessons','v2-lesson:'||i||':'||j||':'||k,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'staff_id',staff_id,'lesson_code','V2-L-'||i||'-'||j||'-'||k,'topic','Séquence '||k||' — progression différenciée','objectives','Compétences disciplinaires et consolidation','lesson_date',case when k=11 then date '2027-02-17' when k=12 then date '2027-02-22' else (date '2026-09-07'+((k-1)*interval '14 days'))::date end,'status',case when k=12 then 'planned' when k=11 then 'delivered' else 'completed' end,'metadata_json',jsonb_build_object('demo',true,'term',case when k<7 then 1 else 2 end)));
   end loop;
   for k in 1..4 loop
    assignment_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-assignment:'||i||':'||j||':'||k);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_assignments','v2-assignment:'||i||':'||j||':'||k,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'created_by_staff_id',staff_id,'assignment_code','V2-A-'||i||'-'||j||'-'||k,'title','Travail '||k,'description','Travail différencié fictif','due_on',case when k=4 then date '2027-02-19' else (date '2026-09-21'+((k-1)*interval '35 days'))::date end,'max_score',20,'status',case when k=4 then 'published' else 'closed' end,'metadata_json',jsonb_build_object('demo',true,'assigned_on',case when k=4 then date '2027-02-15' else (date '2026-09-14'+((k-1)*interval '35 days'))::date end,'term',case when k<3 then 1 else 2 end)));
   end loop;
   for k in 1..2 loop
    exam_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-exam:'||i||':'||j||':'||k);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_exams','v2-exam:'||i||':'||j||':'||k,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'exam_code','V2-E-'||i||'-'||j||'-'||k,'title','Évaluation '||k,'exam_type',case when k=1 then 'test' else 'exam' end,'scheduled_on',case when k=1 then '2026-11-23'::date else '2027-02-22'::date end,'max_score',20,'status',case when k=1 then 'graded' else 'planned' end,'metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_exam_sessions','v2-exam-session:'||i||':'||j||':'||k,jsonb_build_object('school_id',c.school_id,'exam_id',exam_id,'session_code','V2-ES-'||i||'-'||j||'-'||k,'starts_at',case when k=1 then '2026-11-23T09:00:00+01:00'::timestamptz else '2027-02-22T09:00:00Z'::timestamptz end,'ends_at',case when k=1 then '2026-11-23T10:00:00+01:00'::timestamptz else '2027-02-22T10:00:00Z'::timestamptz end,'room','Salle '||i,'invigilator_staff_id',staff_id,'status',case when k=1 then 'closed' else 'planned' end,'metadata_json',jsonb_build_object('demo',true)));
   end loop;
  end loop;
 end loop;
 for i in 1..600 loop
  student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i);class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||(1+((i-1)%36)));
  for j in 1..4 loop
   assignment_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-assignment:'||(1+((i-1)%36))||':'||(1+((i+j-2)%8))||':'||j);
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_assignment_submissions','v2-submission:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'assignment_id',assignment_id,'student_id',student_id,'submitted_at',case when (i+j)%17=0 then null else '2027-01-20T17:00:00+01:00'::timestamptz end,'score',case when (i+j)%17=0 then null else 8+((i+j)%13) end,'status',case when (i+j)%17=0 then 'not_submitted' when (i+j)%11=0 then 'late' else 'submitted' end,'metadata_json',jsonb_build_object('demo',true)));
  end loop;
  for j in 1..15 loop
   exam_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-exam:'||(1+((i-1)%36))||':'||(1+((j-1)%8))||':1');
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_marks','v2-mark:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'exam_id',exam_id,'student_id',student_id,'subject_id',public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((j-1)%8))),'assessment_type',case when (i+j)%31=0 then 'retake' else 'exam' end,'score',case when (i+j)%29=0 then 0 else 6+((i*3+j*2)%15) end,'max_score',20,'mark_state',case when (i+j)%29=0 then 'absent' when (i+j)%23=0 then 'pending' else 'present' end,'recorded_at','2027-02-10T16:00:00+01:00','status','active','metadata_json',jsonb_build_object('demo',true,'retake',(i+j)%31=0)));
  end loop;
  for j in 1..8 loop
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_card_lines','v2-report-line:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'report_card_id',public.sanila_master_demo_fixture_uuid(c.id,'report-card:'||i),'subject_id',public.sanila_master_demo_fixture_uuid(c.id,'subject:'||j),'mark_average',7+((i+j)%14),'coefficient',case when j<=2 then 2 else 1 end,'remarks',case when (i+j)%13=0 then 'Efforts réguliers à poursuivre.' else 'Progression satisfaisante.' end,'status','active','metadata_json',jsonb_build_object('demo',true)));
  end loop;
 end loop;

 -- Ninety representative teaching days total: replace baseline ten-day attendance with a coherent 90-day set.
 delete from public.sanila_demo_fixture_registry where config_id=c.id and table_name in('angelcare360_attendance_justifications','angelcare360_attendance_records','angelcare360_attendance_sessions');
 delete from public.angelcare360_attendance_justifications where school_id=c.school_id and metadata_json->>'demo'='true';
 delete from public.angelcare360_attendance_records where school_id=c.school_id and metadata_json->>'demo'='true';
 delete from public.angelcare360_attendance_sessions where school_id=c.school_id and metadata_json->>'demo'='true';
 k:=0;
 for d in select business_date from public.sanila_master_demo_representative_days() order by day_index loop
  k:=k+1;
  for i in 1..36 loop
   class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||i);section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||i);
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_attendance_sessions','v2-attendance-session:'||k||':'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'session_date',d,'session_type','daily','source','manual','status',case when d=date '2027-02-17' then 'open' else 'closed' end,'metadata_json',jsonb_build_object('demo',true)));
  end loop;
  for i in 1..600 loop
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_attendance_records','v2-attendance:'||k||':'||i,jsonb_build_object('school_id',c.school_id,'attendance_session_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-attendance-session:'||k||':'||(1+((i-1)%36))),'student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'attendance_status',case when i in(7,43,219) and k%3=0 then 'absent' when (i+k)%47=0 then 'excused' when (i+k)%29=0 then 'late' when (i+k)%101=0 then 'left_early' else 'present' end,'check_in_at',case when i in(7,43,219) and k%3=0 then null else d+time '07:55' end,'minutes_late',case when (i+k)%29=0 then 18 else 0 end,'justification_required',(i+k)%47=0,'status','active','metadata_json',jsonb_build_object('demo',true,'day_index',k)));
  end loop;
 end loop;
 for i in 1..200 loop
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_attendance_justifications','v2-attendance-justification:'||i,jsonb_build_object('school_id',c.school_id,'attendance_record_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-attendance:'||(1+((i-1)%90))||':'||(1+((i*47-1)%600))),'justification_code','V2-JUST-'||lpad(i::text,3,'0'),'reason_category',case when i%3=0 then 'medical' else 'family' end,'description','Justification synthétique de démonstration.','submitted_at','2027-02-10T09:00:00+01:00','reviewed_at',case when i%5=0 then null else '2027-02-11T11:00:00+01:00'::timestamptz end,'decision',case when i%5=0 then 'pending' when i%7=0 then 'rejected' else 'accepted' end,'decision_reason','Décision fictive sans document réel.','status','active','metadata_json',jsonb_build_object('demo',true)));
 end loop;

 -- Six payroll periods (baseline September plus October-February), full staff history and governed cases.
 for m in 1..5 loop
  period_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-period:'||m);
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_periods','v2-payroll-period:'||m,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'period_code','DEMO-PAYROLL-'||to_char(months[m],'YYYY-MM'),'label','Paie '||to_char(months[m],'TMMonth YYYY'),'starts_on',months[m],'ends_on',(months[m]+interval '1 month'-interval '1 day')::date,'payment_date',(months[m]+interval '27 days')::date,'status',case when m=5 then 'review' else 'closed' end,'metadata_json',jsonb_build_object('demo',true)));
  for i in 1..72 loop
   staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i);record_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-record:'||m||':'||i);
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_records','v2-payroll-record:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'payroll_period_id',period_id,'staff_id',staff_id,'payroll_number','V2-PR-'||m||'-'||lpad(i::text,3,'0'),'base_salary',6500+(i%9)*450,'gross_amount',6800+(i%9)*450+(case when i%13=0 then 500 else 0 end),'deductions_total',case when i%11=0 then 450 else 200 end,'bonuses_total',case when i%13=0 then 500 else 300 end,'net_amount',6600+(i%9)*450+(case when i%13=0 then 500 else 0 end)-(case when i%11=0 then 250 else 0 end),'payment_status',case when m=5 and i%9=0 then 'pending' else 'paid' end,'paid_at',case when m=5 and i%9=0 then null else (months[m]+interval '27 days 12 hours') end,'status',case when m=5 and i%9=0 then 'approved' else 'paid' end,'metadata_json',jsonb_build_object('demo',true,'reimbursement',i%17=0,'corrected',i%19=0)));
   for j in 1..3 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_items','v2-payroll-item:'||m||':'||i||':'||j,jsonb_build_object('school_id',c.school_id,'payroll_record_id',record_id,'item_code','V2-PI-'||m||'-'||i||'-'||j,'item_type',case when j=1 then 'earning' when j=2 then 'bonus' else 'deduction' end,'label',case when j=1 then 'Salaire de base' when j=2 then 'Prime pédagogique' else 'Retenue absence' end,'amount',case when j=1 then 6500+(i%9)*450 when j=2 then case when i%13=0 then 500 else 300 end else case when i%11=0 then 450 else 200 end end,'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
  end loop;
 end loop;
 for i in 1..12 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_advances_sovereign','v2-payroll-advance:'||i,jsonb_build_object('school_id',c.school_id,'staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i),'advance_code','V2-ADV-'||lpad(i::text,2,'0'),'principal_minor',300000,'recovered_minor',100000,'remaining_minor',200000,'installment_minor',50000,'installment_count',6,'recovery_start_period_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-period:1'),'status',case when i<10 then 'recovering' else 'requested' end,'reason','Avance fictive Master Demo'),true);end loop;
 for m in 1..5 loop
  period_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-period:'||m);
  run_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-run:'||m);
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_run_executions','v2-payroll-run:'||m,jsonb_build_object('school_id',c.school_id,'payroll_period_id',period_id,'run_code','V2-RUN-'||m,'run_type','regular','status',case when m=5 then 'validated' else 'finalized' end,'input_hash',md5('v2-payroll-run:'||m),'input_snapshot',jsonb_build_object('demo',true),'totals_json',jsonb_build_object('employees',72),'idempotency_key','v2-payroll-run-'||m,'started_at',months[m]+interval '24 days','completed_at',months[m]+interval '25 days','validated_at',months[m]+interval '26 days','finalized_at',case when m=5 then null else months[m]+interval '27 days' end));
  for i in 1..72 loop
   staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i);
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_employee_results','v2-payroll-result:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'payroll_run_id',run_id,'payroll_period_id',period_id,'staff_id',staff_id,'base_minor',650000+(i%9)*45000,'earnings_minor',case when i%13=0 then 50000 else 30000 end,'gross_minor',680000+(i%9)*45000+(case when i%13=0 then 20000 else 0 end),'employee_contributions_minor',20000,'employer_contributions_minor',30000,'deductions_minor',case when i%11=0 then 25000 else 0 end,'reimbursements_minor',case when i%17=0 then 18000 else 0 end,'net_payable_minor',660000+(i%9)*45000+(case when i%13=0 then 20000 else 0 end)+(case when i%17=0 then 18000 else 0 end)-(case when i%11=0 then 25000 else 0 end),'employer_cost_minor',710000+(i%9)*45000+(case when i%13=0 then 20000 else 0 end)+(case when i%17=0 then 18000 else 0 end),'status',case when m=5 then 'calculated' else 'finalized' end,'calculation_json',jsonb_build_object('demo',true),'calculation_hash',md5('v2-result:'||m||':'||i),'finalized_at',case when m=5 then null else months[m]+interval '27 days' end),true);
  end loop;
  if m<5 then
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_payment_batches','v2-payroll-batch:'||m,jsonb_build_object('school_id',c.school_id,'payroll_run_id',run_id,'batch_code','V2-BATCH-'||m,'payment_method','bank_transfer','currency','MAD','payment_date',(months[m]+interval '27 days')::date,'total_minor',60502000,'status','paid','approved_at',months[m]+interval '26 days','reconciled_at',months[m]+interval '28 days'),true);
   for i in 1..72 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_payment_items','v2-payroll-payment:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'payment_batch_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-batch:'||m),'payroll_employee_result_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-result:'||m||':'||i),'staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i),'amount_minor',660000+(i%9)*45000+(case when i%13=0 then 20000 else 0 end)+(case when i%17=0 then 18000 else 0 end)-(case when i%11=0 then 25000 else 0 end),'status',case when i%29=0 then 'failed' else 'paid' end,'provider_reference','SIMULATED-NO-PROVIDER-'||m||'-'||i,'paid_at',case when i%29=0 then null else months[m]+interval '27 days 12 hours' end,'failure_reason',case when i%29=0 then 'Anomalie fictive à corriger' else null end),true);end loop;
   perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_reconciliation_sessions','v2-payroll-reconciliation:'||m,jsonb_build_object('school_id',c.school_id,'payment_batch_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-batch:'||m),'status',case when m=4 then 'review' else 'reconciled' end,'expected_minor',60502000,'paid_minor',case when m=4 then 59702000 else 60502000 end,'failed_count',case when m=4 then 2 else 0 end,'pending_count',case when m=4 then 1 else 0 end,'resolved_at',case when m=4 then null else months[m]+interval '28 days' end),true);
  end if;
 end loop;
 for i in 1..72 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_payroll_input_revisions','v2-payroll-input:'||i,jsonb_build_object('school_id',c.school_id,'payroll_period_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-payroll-period:5'),'staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i),'component_code',case when i%3=0 then 'REIMBURSEMENT' when i%2=0 then 'BONUS' else 'DEDUCTION' end,'input_type',case when i%3=0 then 'reimbursement' when i%2=0 then 'bonus' else 'deduction' end,'amount_minor',10000+(i%5)*5000,'source_type','manual_demo','evidence_json',jsonb_build_object('synthetic',true,'attendance_anomaly',i=61,'attendance_dates',case when i=61 then jsonb_build_array('2026-10-21','2026-10-22') else '[]'::jsonb end),'status',case when i%7=0 then 'submitted' else 'approved' end,'idempotency_key','v2-payroll-input-'||i,'approved_at',case when i%7=0 then null else '2027-02-15T10:00:00+01:00'::timestamptz end),true);end loop;

 -- Six-month household finance: five additional monthly invoice/payment cohorts.
 for m in 1..5 loop for i in 1..600 loop
  student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i);amount:=3200;paid:=case when i%10=0 then 1600 when i%7=0 then 0 else 3200 end;
  invoice_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-invoice:'||m||':'||i);
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_invoices','v2-invoice:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'invoice_number','V2-INV-'||m||'-'||lpad(i::text,4,'0'),'invoice_type','tuition','invoice_date',months[m],'due_date',(months[m]+interval '7 days')::date,'currency','MAD','subtotal_amount',amount,'discount_total',case when i%15=0 then 200 else 0 end,'tax_total',0,'total_amount',amount,'amount_paid',paid,'status',case when paid=amount then 'paid' when paid>0 then 'partially_paid' else 'overdue' end,'metadata_json',jsonb_build_object('demo',true,'sibling_household',i%15=0)));
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_invoice_lines','v2-invoice-line:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'invoice_id',invoice_id,'fee_item_id',public.sanila_master_demo_fixture_uuid(c.id,'fee-item:1'),'line_code','V2-LINE-'||m||'-'||i,'label','Scolarité '||to_char(months[m],'TMMonth'),'quantity',1,'unit_amount',amount,'line_total',amount,'status','active','metadata_json',jsonb_build_object('demo',true)));
  if paid>0 then payment_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-payment:'||m||':'||i);perform public.sanila_master_demo_upsert(c.id,'angelcare360_payments','v2-payment:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'invoice_id',invoice_id,'student_id',student_id,'payment_number','V2-PAY-'||m||'-'||i,'payment_date',(months[m]+interval '5 days')::date,'method','bank_transfer','amount',paid,'allocated_amount',paid,'reference','SIMULATED-'||m||'-'||i,'status','allocated','metadata_json',jsonb_build_object('demo',true,'provider_side_effect','blocked')));perform public.sanila_master_demo_upsert(c.id,'angelcare360_receipts','v2-receipt:'||m||':'||i,jsonb_build_object('school_id',c.school_id,'payment_id',payment_id,'receipt_number','V2-REC-'||m||'-'||i,'issued_at',months[m]+interval '5 days 10 hours','status','issued','metadata_json',jsonb_build_object('demo',true,'file_side_effect','blocked')),true);end if;
 end loop;end loop;
 for i in 1..84 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_expenses','v2-expense:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'expense_code','V2-EXP-'||lpad(i::text,3,'0'),'expense_date',(date '2026-09-10'+((i%150)*interval '1 day'))::date,'category',(array['maintenance','supplies','transport','activities'])[1+((i-1)%4)],'vendor_name','Fournisseur fictif '||(1+((i-1)%12)),'amount',400+(i%12)*175,'currency','MAD','payment_method','bank_transfer','status',case when i%5=0 then 'draft' when i%4=0 then 'approved' else 'paid' end,'metadata_json',jsonb_build_object('demo',true)));end loop;

 -- Multi-stage admissions with visits/interviews/documents/status history.
 for i in 1..60 loop
  perform public.sanila_master_demo_upsert(c.id,'angelcare360_admission_leads','v2-admission-lead:'||i,jsonb_build_object('school_id',c.school_id,'lead_code','V2-LEAD-'||lpad(i::text,3,'0'),'parent_name','Famille prospective fictive '||i,'parent_phone','+2120009'||lpad(i::text,5,'0'),'parent_email','prospect.'||i||'@sanila-demo.invalid','student_full_name','Enfant prospect '||i,'desired_level','Niveau '||(1+((i-1)%12)),'source_channel',(array['open_day','website','referral','visit'])[1+((i-1)%4)],'assigned_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(2+((i-1)%5))),'status',(array['new','contacted','qualified','application_open','converted'])[1+((i-1)%5)],'metadata_json',jsonb_build_object('demo',true)));
  for j in 1..4 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_admission_status_history','v2-admission-history:'||i||':'||j,jsonb_build_object('school_id',c.school_id,'application_id',public.sanila_master_demo_fixture_uuid(c.id,'admission:'||i),'from_status',case when j=1 then null else (array['open','in_review','waitlisted'])[j-1] end,'to_status',(array['open','in_review','waitlisted','approved'])[j],'note','Étape fictive '||j,'changed_at',date '2026-10-01'+((i+j*12)%120)*interval '1 day','metadata_json',jsonb_build_object('demo',true)),true);end loop;
 end loop;

 -- Advanced transport execution authority. Refuse false coverage if the canonical org projection is absent.
 select o.id into org_id from public.ac360_organizations o where o.id=c.school_id or o.metadata_json->>'angelcare360_school_id'=c.school_id::text order by(o.id=c.school_id) desc limit 1;
 if org_id is null then raise exception 'ADVANCED_TRANSPORT_ORG_PROJECTION_MISSING: live run routes cannot be truthfully seeded';end if;
 for i in 1..600 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_students','student:'||i,jsonb_build_object('org_id',org_id,'student_code','DEMO-STU-'||lpad(i::text,4,'0'),'first_name','Élève','last_name','Démo '||i,'enrollment_status','active','status','active','joined_on','2026-09-01','billing_status','non_billable','metadata_json',jsonb_build_object('demo',true,'angelcare360_school_id',c.school_id)));end loop;
 for i in 1..72 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_staff_profiles','staff:'||i,jsonb_build_object('org_id',org_id,'staff_code','DEMO-STAFF-'||lpad(i::text,3,'0'),'full_name','Personnel Démo '||i,'email','staff.'||i||'@sanila-demo.invalid','phone','+2120008'||lpad(i::text,5,'0'),'staff_type',case when i<=48 then 'teacher' else 'staff' end,'department',case when i<=48 then 'Teaching' when i<=56 then 'Administration' when i<=64 then 'Transport' else 'Operations' end,'employment_status','active','status','active','started_on','2026-08-24','metadata_json',jsonb_build_object('demo',true)));end loop;

 -- Staff attendance: 72 people x 90 representative weekdays, linked leave and payroll exceptions.
 k:=0;
for d in select business_date from public.sanila_master_demo_representative_days() order by day_index loop
  k:=k+1;
  for i in 1..72 loop
   staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||i);
   perform public.sanila_master_demo_upsert(c.id,'ac360_school_attendance_records','v2-staff-attendance:'||k||':'||i,jsonb_build_object(
    'org_id',org_id,'staff_profile_id',staff_id,'attendance_type','staff',
    'attendance_status',case when i in(9,27) and k%11=0 then 'authorized_absence' when i=61 and k in(37,38) then 'absent' when i=14 and k%9=0 then 'late' when (i+k)%173=0 then 'early_out' else 'present' end,
    'recorded_at',d+time '08:00','check_in_at',case when (i in(9,27) and k%11=0) or (i=61 and k in(37,38)) then null when i=14 and k%9=0 then d+time '08:24' else d+time '07:52' end,
    'check_out_at',case when (i+k)%173=0 then d+time '14:20' when (i in(9,27) and k%11=0) or (i=61 and k in(37,38)) then null else d+time '16:30' end,
    'reason',case when i in(9,27) and k%11=0 then 'Congé autorisé lié au dossier démo' when i=61 and k in(37,38) then 'Absence non planifiée — anomalie de rapprochement paie' when i=14 and k%9=0 then 'Retards récurrents — suivi opérationnel' else null end,
    'source','demo_fixture','correction_status','none','metadata_json',jsonb_build_object('demo',true,'day_index',k,'perfect_attendance',i=1,'payroll_relevant',i=61 and k in(37,38))));
   if k<=5 then perform public.sanila_master_demo_upsert(c.id,'ac360_school_attendance_events','v2-staff-attendance-event:'||k||':'||i,jsonb_build_object('org_id',org_id,'staff_profile_id',staff_id,'attendance_type','staff','event_type',case when i=14 and k=5 then 'mark_late' else 'staff_check_in' end,'attendance_status',case when i=14 and k=5 then 'late' else 'present' end,'event_at',d+case when i=14 and k=5 then time '08:24' else time '07:52' end,'source','demo_fixture','metadata_json',jsonb_build_object('demo',true)));end if;
  end loop;
 end loop;
 for i in 1..3 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_leave_policies','v2-leave-policy:'||i,jsonb_build_object('org_id',org_id,'policy_key','DEMO-LEAVE-'||i,'label',(array['Congé annuel','Absence autorisée','Formation'])[i],'leave_type',(array['annual','authorized_absence','training'])[i],'yearly_allowance_days',case when i=1 then 20 else 5 end,'paid',true,'requires_approval',true,'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..18 loop
  if i<=16 then k:=11*((i+1)/2);staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(case when i%2=1 then 9 else 27 end));else k:=37+(i-17);staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:61');end if;
  select business_date into d from public.sanila_master_demo_representative_days() where day_index=k;
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_leave_requests','v2-leave-request:'||i,jsonb_build_object('org_id',org_id,'staff_profile_id',staff_id,'policy_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-leave-policy:2'),'request_code','DEMO-LR-'||lpad(i::text,3,'0'),'leave_type','authorized_absence','starts_on',d,'ends_on',d,'total_days',1,'status',case when i<=16 then 'approved' else 'pending' end,'reason',case when i<=16 then 'Congé autorisé relié à la présence du jour' else 'Anomalie d’absence soumise à rapprochement paie' end,'decided_at',case when i<=16 then d-interval '3 days' else null end,'decision_note',case when i<=16 then 'Approuvée et rapprochée avec la présence' else null end,'metadata_json',jsonb_build_object('demo',true,'attendance_day_index',k,'payroll_relevant',i>16)));
 end loop;

 -- Cross-department operational task authority with current, overdue, completed and unresolved work.
 for i in 1..5 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_task_boards','v2-task-board:'||i,jsonb_build_object('org_id',org_id,'board_key','DEMO-BOARD-'||i,'label',(array['Opérations quotidiennes','Maintenance','Qualité','Admissions','Finance'])[i],'department',(array['operations','maintenance','quality','admissions','finance'])[i],'board_type',(array['operations','maintenance','compliance','admissions','finance'])[i],'status','active','owner_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(48+i)),'metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..48 loop
  record_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-task:'||i);
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_tasks','v2-task:'||i,jsonb_build_object('org_id',org_id,'task_code','DEMO-TASK-'||lpad(i::text,3,'0'),'title',(array['Routine ouverture','Routine fermeture','Contrôle salle','Maintenance équipement','Remplacement enseignant','Suivi exception transport','Action inspection qualité','Relance admissions','Relance finance','Exception opérationnelle non résolue'])[1+((i-1)%10)],'description','Tâche opérationnelle synthétique reliée au scénario Master Demo.','department',(array['operations','operations','classroom','maintenance','hr','transport','quality','admissions','finance','operations'])[1+((i-1)%10)],'status',case when i<=12 then 'done' when i<=24 then 'in_progress' when i<=36 then 'planned' else 'blocked' end,'priority',case when i%8=0 then 'high' else 'medium' end,'assigned_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(1+((i+47)%72))),'related_entity_type',case when i%10=4 then 'maintenance' when i%10=5 then 'staffing' when i%10=6 then 'transport' else 'school_operation' end,'due_at',case when i<=12 then '2027-02-15T16:00:00Z'::timestamptz when i<=30 then '2027-02-17T16:00:00Z'::timestamptz else '2027-02-10T16:00:00Z'::timestamptz end,'completed_at',case when i<=12 then '2027-02-15T15:30:00Z'::timestamptz else null end,'board_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-task-board:'||(1+((i-1)%5))),'start_at','2027-02-17T07:30:00Z','blocked_reason',case when i>36 then 'Justificatif ou intervention attendu' else null end,'metadata_json',jsonb_build_object('demo',true,'current_day',i between 13 and 30,'opening_closing',i%10 in(1,2))));
  for j in 1..2 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_task_checklist_items','v2-task-check:'||i||':'||j,jsonb_build_object('org_id',org_id,'task_id',record_id,'item_key','STEP-'||j,'label',case when j=1 then 'Vérifier et documenter' else 'Confirmer la clôture' end,'status',case when i<=12 then 'done' when j=1 then 'done' else 'open' end,'position',j*100,'completed_at',case when i<=12 or j=1 then '2027-02-17T09:00:00Z'::timestamptz else null end,'metadata_json',jsonb_build_object('demo',true)));end loop;
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_task_status_transitions','v2-task-transition:'||i,jsonb_build_object('org_id',org_id,'task_id',record_id,'from_status','planned','to_status',case when i<=12 then 'done' when i<=24 then 'in_progress' when i<=36 then 'planned' else 'blocked' end,'reason','Progression canonique de démonstration','changed_at',case when i<=12 then '2027-02-15T15:30:00Z'::timestamptz else '2027-02-17T08:00:00Z'::timestamptz end,'metadata_json',jsonb_build_object('demo',true)),true);
  if i<=24 then perform public.sanila_master_demo_upsert(c.id,'ac360_school_task_comments','v2-task-comment:'||i,jsonb_build_object('org_id',org_id,'task_id',record_id,'comment_type',case when i<=12 then 'resolution' else 'status_update' end,'body','Suivi interne synthétique, sans communication externe.','visibility','internal','metadata_json',jsonb_build_object('demo',true)),true);end if;
 end loop;
 for i in 1..6 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_recurring_task_rules','v2-task-rule:'||i,jsonb_build_object('org_id',org_id,'rule_key','DEMO-RULE-'||i,'label',(array['Ouverture quotidienne','Fermeture quotidienne','Inspection hebdomadaire','Suivi admissions','Suivi finance','Contrôle transport'])[i],'department',(array['operations','operations','quality','admissions','finance','transport'])[i],'cadence',case when i<=2 then 'daily' else 'weekly' end,'next_run_on','2027-02-17','last_run_on','2027-02-16','task_template_json',jsonb_build_object('demo',true),'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;

 -- General school health/safety: normal incidents, follow-up, resolution and internal notification proof.
 for i in 1..24 loop
  record_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-general-incident:'||i);
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_incident_reports','v2-general-incident:'||i,jsonb_build_object('org_id',org_id,'student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||(1+((i*23-1)%600))),'incident_code','DEMO-INC-'||lpad(i::text,3,'0'),'incident_type',(array['injury','illness','behavior','safety','pickup','other'])[1+((i-1)%6)],'severity',case when i%8=0 then 'medium' else 'low' end,'occurred_at',case when i<=6 then '2027-02-17T09:20:00Z'::timestamptz else date '2026-09-15'+i*interval '6 days'+time '10:15' end,'location',(array['Cour','Infirmerie','Salle de classe','Couloir','Accueil','Réfectoire'])[1+((i-1)%6)],'description',(array['Égratignure mineure pendant la récréation','Malaise léger pris en charge par premiers soins','Incident comportemental sans blessure','Signalement préventif d’un obstacle','Retard de prise en charge à la sortie','Anomalie opérationnelle mineure'])[1+((i-1)%6)],'immediate_action','Mise en sécurité, premiers gestes simples et suivi interne.','parent_notification_status',case when i<=6 then 'pending' when i%2=0 then 'acknowledged' else 'not_required' end,'status',case when i<=6 then 'open' when i<=12 then 'under_review' when i<=20 then 'resolved' else 'closed' end,'reported_by_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(49+((i-1)%8))),'closed_at',case when i>20 then '2027-02-12T15:00:00Z'::timestamptz else null end,'metadata_json',jsonb_build_object('demo',true,'external_notification','blocked','follow_up_required',i<=12)));
  for j in 1..3 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_incident_events','v2-general-incident-event:'||i||':'||j,jsonb_build_object('org_id',org_id,'incident_id',record_id,'event_key','DEMO-INC-'||i||'-EV-'||j,'event_type',case when j=1 then 'reported' when j=2 then 'follow_up' else 'status' end,'status_from',case when j=1 then null when j=2 then 'open' else 'under_review' end,'status_to',case when j=1 then 'open' when j=2 then 'under_review' when i<=12 then 'under_review' else 'resolved' end,'severity','info','message',case when j=1 then 'Incident enregistré' when j=2 then 'Responsable affecté et suivi documenté' else 'État canonique confirmé' end,'metadata_json',jsonb_build_object('demo',true,'responsible_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(49+((i-1)%8))))),true);end loop;
  if i>12 then perform public.sanila_master_demo_upsert(c.id,'ac360_school_incident_acknowledgements','v2-general-incident-ack:'||i,jsonb_build_object('org_id',org_id,'incident_id',record_id,'acknowledged_by_name','Responsable familial fictif','acknowledged_at','2027-02-12T14:30:00Z','channel','manual','status','acknowledged','notes','Notification simulée en interne; aucun fournisseur externe.','metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')),true);end if;
 end loop;
 for i in 1..12 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_health_safety_alerts','v2-health-alert:'||i,jsonb_build_object('org_id',org_id,'student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||(i*23)),'incident_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-general-incident:'||i),'alert_key','DEMO-HS-'||i,'alert_type',case when i%3=0 then 'follow_up' else 'incident' end,'severity','medium','title','Suivi santé/sécurité '||i,'message','Alerte interne synthétique.','status',case when i<=6 then 'open' else 'resolved' end,'resolved_at',case when i<=6 then null else '2027-02-12T15:00:00Z'::timestamptz end,'metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')));end loop;
 for i in 1..6 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_health_safety_snapshots','v2-health-snapshot:'||i,jsonb_build_object('org_id',org_id,'snapshot_date',(date '2026-09-30'+(i-1)*interval '28 days')::date,'active_health_profiles',0,'active_medication_plans',0,'authorized_pickups',0,'open_incidents',case when i=6 then 6 else 2 end,'critical_incidents',0,'safety_checks_today',15,'metadata_json',jsonb_build_object('demo',true)),true);end loop;
 for i in 1..4 loop
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_safety_checklists','v2-safety-checklist:'||i,jsonb_build_object('org_id',org_id,'checklist_key','DEMO-SAFE-'||i,'label',(array['Ouverture école','Cour de récréation','Salles de classe','Sortie sécurisée'])[i],'checklist_type',(array['daily_safety','playground','classroom','pickup'])[i],'frequency',case when i=1 then 'daily' else 'weekly' end,'status','active','metadata_json',jsonb_build_object('demo',true)));
  for j in 1..4 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_safety_checklist_items','v2-safety-item:'||i||':'||j,jsonb_build_object('org_id',org_id,'checklist_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-safety-checklist:'||i),'item_key','ITEM-'||j,'label','Point de contrôle '||j,'required',true,'sort_order',j*100,'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 end loop;
	 for i in 1..90 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_safety_checks','v2-general-safety-check:'||i,jsonb_build_object('org_id',org_id,'checklist_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-safety-checklist:'||(1+((i-1)%4))),'checked_at',(select business_date+time '07:30' from public.sanila_master_demo_representative_days() where day_index=i),'checked_by_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(49+((i-1)%8))),'status',case when i%29=0 then 'needs_action' else 'completed' end,'score',case when i%29=0 then 82 else 100 end,'findings',case when i%29=0 then 'Obstacle mineur transmis à la maintenance.' else 'Contrôle conforme.' end,'metadata_json',jsonb_build_object('demo',true)));end loop;

 for i in 1..8 loop
  vehicle_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-vehicle:'||i);driver_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-driver:'||i);route_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-route:'||i);
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_vehicles','v2-transport-vehicle:'||i,jsonb_build_object('org_id',org_id,'vehicle_code','V2-BUS-'||i,'label','Bus scolaire fictif '||i,'vehicle_type','bus','plate_number','DEMO-'||lpad(i::text,4,'0'),'capacity',45,'seatbelt_count',45,'insurance_expiry','2027-06-30','inspection_expiry','2027-04-30','status',case when i=8 then 'maintenance' else 'active' end,'metadata_json',jsonb_build_object('demo',true)));
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_drivers','v2-transport-driver:'||i,jsonb_build_object('org_id',org_id,'staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(57+i)),'driver_code','V2-DRV-'||i,'full_name','Chauffeur Démo '||i,'phone','+21200070'||lpad(i::text,4,'0'),'license_number',null,'license_expiry','2027-08-31','status','active','metadata_json',jsonb_build_object('demo',true)));
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_routes','v2-transport-route:'||i,jsonb_build_object('org_id',org_id,'route_code','V2-ROUTE-'||i,'label','Circuit Casablanca '||i,'direction','round_trip','route_type','regular','default_vehicle_id',vehicle_id,'default_driver_id',driver_id,'status',case when i=8 then 'paused' else 'active' end,'metadata_json',jsonb_build_object('demo',true)));
  for j in 1..6 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_route_stops','v2-transport-stop:'||i||':'||j,jsonb_build_object('org_id',org_id,'route_id',route_id,'stop_order',j,'stop_label',(array['Maarif','Racine','Bourgogne','Anfa','Oasis','Gauthier'])[j]||' — fictif','zone','Casablanca Démo','address','Adresse fictive non routable','planned_time',(time '07:00'+j*interval '8 minutes')::text,'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 end loop;
 for i in 1..300 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_student_assignments','v2-transport-assignment:'||i,jsonb_build_object('org_id',org_id,'student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'route_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-route:'||(1+((i-1)%8))),'stop_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-stop:'||(1+((i-1)%8))||':'||(1+((i-1)%6))),'service_direction','round_trip','monthly_fee_mad',700,'starts_on','2026-09-01','status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 k:=0;
 for d in select x::date from generate_series(date '2026-12-24',date '2027-02-17',interval '1 day') x where extract(isodow from x)<=5 order by x loop
  k:=k+1;
  for i in 1..8 loop for j in 1..2 loop
   run_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-run:'||k||':'||i||':'||j);
	   perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_route_runs','v2-transport-run:'||k||':'||i||':'||j,jsonb_build_object('org_id',org_id,'route_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-route:'||i),'vehicle_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-vehicle:'||i),'driver_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-driver:'||i),'run_date',d,'run_type',case when j=1 then 'pickup' else 'dropoff' end,'planned_start_at',d+case when j=1 then time '06:55' else time '15:45' end,'started_at',case when k=40 and j=2 then null else d+case when j=1 then time '06:57' else time '15:47' end end,'ended_at',case when k=40 and j=2 then null else d+case when j=1 then time '08:02' else time '17:02' end end,'status',case when k=40 and j=2 then 'planned' when k=40 and j=1 and i=3 then 'incident' else 'completed' end,'metadata_json',jsonb_build_object('demo',true,'delay_minutes',case when k=40 and j=2 then 0 when (k+i)%9=0 then 12 else 0 end)));
	   perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_safety_checks','v2-safety:'||k||':'||i||':'||j,jsonb_build_object('org_id',org_id,'vehicle_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-vehicle:'||i),'driver_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-driver:'||i),'route_run_id',case when k=40 and j=2 then public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-run:40:'||i||':1') else run_id end,'check_type',case when j=1 or k=40 then 'pre_route' else 'post_route' end,'result',case when k=40 and i=8 and j=1 then 'warning' else 'passed' end,'checked_at',d+case when j=1 then time '06:45' when k=40 then time '06:50' else time '17:10' end,'notes',case when k=40 and j=2 then 'Contrôle de renfort matinal fictif; aucun contrôle après trajet futur.' else 'Contrôle sécurité fictif' end,'metadata_json',jsonb_build_object('demo',true)));
  end loop;end loop;
 end loop;
 for k in 1..20 loop for i in 1..300 loop for j in 1..2 loop
	  m:=case when k=20 and j=1 then 40 when k=20 and j=2 then 39 else k end;
	  run_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-run:'||m||':'||(1+((i-1)%8))||':'||j);
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_run_events','v2-transport-student-event:'||k||':'||i||':'||j,jsonb_build_object('org_id',org_id,'route_run_id',run_id,'student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'stop_id',public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-stop:'||(1+((i-1)%8))||':'||(1+((i-1)%6))),'event_type',case when (i+k)%97=0 then 'student_absent' when j=1 then 'student_boarded' else 'student_dropped' end,'occurred_at',(select rr.run_date+case when j=1 then time '07:25' else time '16:20' end from public.ac360_school_transport_route_runs rr where rr.id=run_id),'status','confirmed','metadata_json',jsonb_build_object('demo',true)));
 end loop;end loop;end loop;
 for i in 1..40 loop
  run_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-run:'||i||':'||(1+((i-1)%8))||':1');
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_run_events','v2-transport-delay:'||i,jsonb_build_object('org_id',org_id,'route_run_id',run_id,'event_type','delay','occurred_at',(select rr.run_date+time '07:10' from public.ac360_school_transport_route_runs rr where rr.id=run_id),'status','confirmed','notes','Retard fictif de '||(5+(i%15))||' minutes','metadata_json',jsonb_build_object('demo',true,'external_notification','blocked')));
 end loop;
 for i in 1..8 loop
	  run_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-run:39:'||i||':2');
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_run_events','v2-transport-incident:'||i,jsonb_build_object('org_id',org_id,'route_run_id',run_id,'event_type','incident','occurred_at',(select rr.run_date+time '16:05' from public.ac360_school_transport_route_runs rr where rr.id=run_id),'status','confirmed','notes','Incident opérationnel mineur fictif, suivi ouvert.','metadata_json',jsonb_build_object('demo',true,'severity','low')));
 end loop;
 for i in 1..32 loop
  run_id:=public.sanila_master_demo_fixture_uuid(c.id,'v2-transport-run:'||(8+i)||':'||(1+((i-1)%8))||':1');
  perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_run_events','v2-transport-parent-alert:'||i,jsonb_build_object('org_id',org_id,'route_run_id',run_id,'event_type','parent_notified','occurred_at',(select rr.run_date+time '07:15' from public.ac360_school_transport_route_runs rr where rr.id=run_id),'status','confirmed','notes','Alerte parent simulée; aucun fournisseur externe appelé.','metadata_json',jsonb_build_object('demo',true,'delivery','blocked')));
 end loop;
 for i in 1..32 loop perform public.sanila_master_demo_upsert(c.id,'ac360_school_transport_alerts','v2-transport-alert:'||i,jsonb_build_object('org_id',org_id,'alert_key','V2-ALERT-'||i,'severity',case when i%8=0 then 'high' else 'medium' end,'entity_type',case when i%2=0 then 'route_run' else 'vehicle' end,'title',case when i%3=0 then 'Retard transport fictif' else 'Suivi opérationnel fictif' end,'message','Alerte interne; notification externe bloquée.','status',case when i<=8 then 'open' else 'resolved' end,'resolved_at',case when i<=8 then null else '2027-02-10T12:00:00+01:00'::timestamptz end,'metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')));end loop;

 -- V2 current library circulation authority.
 -- The frozen baseline owns exactly 45 active physical-copy loans.
 -- V2 preserves them as the current circulation set and adds only returned history.
 for i in 1..45 loop
  update public.angelcare360_library_loans
  set
   loaned_at='2027-02-03T10:00:00Z'::timestamptz,
   due_at=case
    when i<=5 then '2027-02-10T17:00:00Z'::timestamptz
    else '2027-02-26T17:00:00Z'::timestamptz
   end,
   returned_at=null,
   fine_amount=case when i<=5 then 10 else 0 end,
   status=case when i<=5 then 'overdue' else 'open' end,
   metadata_json=coalesce(metadata_json,'{}'::jsonb)
    || jsonb_build_object(
      'demo',true,
      'current_circulation',true,
      'simulation_date','2027-02-17'
    )
  where school_id=c.school_id
   and id=public.sanila_master_demo_fixture_uuid(
     c.id,
     'library-loan:'||i
   );
 end loop;


 -- V2 canonical registry synchronization for intentional baseline normalization.
 --
 -- Frozen V1 rows are deliberately converted to the canonical 2027-02-17
 -- business state above. Their registry payload must describe that FINAL state,
 -- not the historical V1 state that existed before normalization.
 --
 -- Exact expected divergences:
 --   terms        = 2
 --   lessons      = 5
 --   assignments  = 36
 --   library      = 45
 --   TOTAL        = 88
 --
 -- This changes registry authority only. It does not fabricate new fixtures.

 -- 2 terms: T1 active -> closed, T2 planned -> active.
 update public.sanila_demo_fixture_registry r
 set
  canonical_payload =
   r.canonical_payload
   || jsonb_build_object(
      'status',t.status
   ),
  canonical_content_hash =
   md5((
    r.canonical_payload
    || jsonb_build_object(
       'status',t.status
    )
   )::text),
  updated_at=clock_timestamp()
 from public.angelcare360_terms t
 where r.config_id=c.id
  and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
  and r.table_name='angelcare360_terms'
  and r.fixture_id=t.id
  and t.school_id=c.school_id
  and r.fixture_key in('term:1','term:2')
  and r.canonical_payload->>'status' is distinct from t.status;

 -- 5 baseline lessons: old planned lessons are now delivered.
 update public.sanila_demo_fixture_registry r
 set
  canonical_payload =
   r.canonical_payload
   || jsonb_build_object(
      'status',l.status
   ),
  canonical_content_hash =
   md5((
    r.canonical_payload
    || jsonb_build_object(
       'status',l.status
    )
   )::text),
  updated_at=clock_timestamp()
 from public.angelcare360_lessons l
 where r.config_id=c.id
  and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
  and r.table_name='angelcare360_lessons'
  and r.fixture_id=l.id
  and l.school_id=c.school_id
  and r.fixture_key like 'lesson:%'
  and r.canonical_payload->>'status' is distinct from l.status;

 -- 36 baseline assignments: historical due/published work is now closed.
 update public.sanila_demo_fixture_registry r
 set
  canonical_payload =
   r.canonical_payload
   || jsonb_build_object(
      'status',a.status
   ),
  canonical_content_hash =
   md5((
    r.canonical_payload
    || jsonb_build_object(
       'status',a.status
    )
   )::text),
  updated_at=clock_timestamp()
 from public.angelcare360_assignments a
 where r.config_id=c.id
  and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
  and r.table_name='angelcare360_assignments'
  and r.fixture_id=a.id
  and a.school_id=c.school_id
  and r.fixture_key like 'assignment:%'
  and r.canonical_payload->>'status' is distinct from a.status;

 -- 45 frozen-baseline active library loans normalized to Feb-17 current state.
 update public.sanila_demo_fixture_registry r
 set
  canonical_payload =
   r.canonical_payload
   || jsonb_build_object(
      'loaned_at',l.loaned_at,
      'due_at',l.due_at,
      'returned_at',l.returned_at,
      'fine_amount',l.fine_amount,
      'status',l.status,
      'metadata_json',l.metadata_json
   ),
  canonical_content_hash =
   md5((
    r.canonical_payload
    || jsonb_build_object(
       'loaned_at',l.loaned_at,
       'due_at',l.due_at,
       'returned_at',l.returned_at,
       'fine_amount',l.fine_amount,
       'status',l.status,
       'metadata_json',l.metadata_json
    )
   )::text),
  updated_at=clock_timestamp()
 from public.angelcare360_library_loans l
 where r.config_id=c.id
  and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
  and r.table_name='angelcare360_library_loans'
  and r.fixture_id=l.id
  and l.school_id=c.school_id
  and r.fixture_key like 'library-loan:%';

 -- Additional circulation, stock, communication, complaints and institutional calendar history.
 for i in 1..315 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_library_loans','v2-library-loan:'||i,jsonb_build_object('school_id',c.school_id,'copy_id',public.sanila_master_demo_fixture_uuid(c.id,'library-copy:'||(1+((i-1)%120))),'borrower_type','student','borrower_student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||(1+((i-1)%600))),'loaned_at',date '2026-09-07'+((i%145)*interval '1 day'),'due_at',date '2026-09-21'+((i%145)*interval '1 day'),'returned_at',case when i%37=0 then date '2026-09-28'+((i%145)*interval '1 day') else date '2026-09-18'+((i%145)*interval '1 day') end,'fine_amount',case when i%37=0 then 25 else 0 end,'status','returned','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..320 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_inventory_movements','v2-inventory-movement:'||i,jsonb_build_object('school_id',c.school_id,'item_id',public.sanila_master_demo_fixture_uuid(c.id,'inventory-item:'||(1+((i-1)%40))),'movement_code','V2-MOVE-'||lpad(i::text,4,'0'),'movement_type',case when i%3=0 then 'out' else 'in' end,'quantity',1+(i%8),'movement_date',(date '2026-09-07'+((i%155)*interval '1 day'))::date,'reference_type','demo_operation','notes',case when i%41=0 then 'Article endommagé — cas fictif' else 'Mouvement canonique' end,'status','active','metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..48 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_messages','v2-message:'||i,jsonb_build_object('school_id',c.school_id,'message_code','V2-MSG-'||i,'sender_role',(array['direction','enseignant','finance','transport'])[1+((i-1)%4)],'subject','Communication institutionnelle '||i,'body','Message interne fictif; aucune livraison externe.','message_type','internal','sent_at',date '2026-09-07'+((i*3)%155)*interval '1 day','status','sent','metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')));end loop;
 for i in 1..30 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_announcements','v2-announcement:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'announcement_code','V2-ANN-'||i,'title','Annonce école '||i,'body','Annonce fictive SANILA.','audience',(array['all','parents','students','staff'])[1+((i-1)%4)],'published_at',date '2026-09-07'+((i*8)%155)*interval '1 day','expires_at','2027-03-31','status','published_internal','metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')));end loop;
 for i in 1..12 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_reclamations','v2-complaint:'||i,jsonb_build_object('school_id',c.school_id,'reclamation_code','V2-RECL-'||i,'reporter_role','parent','subject','Dossier de suivi fictif '||i,'description','Réclamation normale de démonstration.','related_entity_type',(array['attendance','transport','finance','operations'])[1+((i-1)%4)],'priority',case when i%5=0 then 'high' else 'medium' end,'status',case when i<=4 then 'open' else 'resolved' end,'resolved_at',case when i<=4 then null else '2027-02-10T14:00:00+01:00'::timestamptz end,'resolution_notes',case when i<=4 then null else 'Suivi achevé et famille informée en interne.' end,'submitted_by_parent_id',public.sanila_master_demo_fixture_uuid(c.id,'parent:'||i),'metadata_json',jsonb_build_object('demo',true)));end loop;
 for i in 1..30 loop perform public.sanila_master_demo_upsert(c.id,'angelcare360_school_calendar_events','v2-calendar:'||i,jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'event_code','V2-CAL-'||i,'title',(array['Cours et activités','Briefing équipe','Rendez-vous admissions','Réunion parents','Club scientifique','Départ transport','Évaluation','Échéance paiement'])[1+((i-1)%8)],'event_type',(array['academic','staff','admissions','meeting','activity','transport','assessment','finance'])[1+((i-1)%8)],'starts_on',case when i<=7 then date '2027-02-17' when i<=14 then date '2027-02-18'+(i-8) else date '2027-03-01'+((i-15)*7) end,'ends_on',case when i<=7 then date '2027-02-17' when i<=14 then date '2027-02-18'+(i-8) else date '2027-03-01'+((i-15)*7) end,'all_day',false,'audience','all','status','planned','metadata_json',jsonb_build_object('demo',true,'start_time',(time '08:00'+((i-1)%7)*interval '90 minutes')::text,'horizon',case when i<=7 then 'today' when i<=14 then 'this_week' else 'upcoming' end)),true);end loop;

 -- This is the commit gate: all 111 commercially required families and their
 -- exact row counts must exist. Any missing/extra/mis-counted family raises in
 -- this transaction, so neither a standalone seed nor reset can partially land.
 select count(*),count(distinct table_name) into registry_rows,registry_tables
 from public.sanila_demo_fixture_registry where config_id=c.id and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2';
 with expected as(select key table_name,value::bigint expected_count from jsonb_each_text(public.sanila_master_demo_v2_expected_fixture_counts())),
 actual as(select table_name,count(*) actual_count from public.sanila_demo_fixture_registry where config_id=c.id and seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2' group by table_name)
 select count(*) into registry_mismatches from expected full join actual using(table_name)
 where expected_count is distinct from actual_count;
	 if registry_rows<>127177 or registry_tables<>111 or registry_mismatches<>0 then
  raise exception 'SEED_PRECOMMIT_REGISTRY_ASSERTION_FAILED rows=%/127177 tables=%/111 mismatches=%',registry_rows,registry_tables,registry_mismatches;
	 end if;
	 select count(*) into content_mismatches from public.sanila_demo_fixture_registry r
	 where r.config_id=c.id and r.seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V2'
	  and (r.canonical_content_hash<>md5(r.canonical_payload::text)
	   or not public.sanila_master_demo_fixture_content_matches(r.table_name,r.fixture_id,r.canonical_payload));
	 if content_mismatches<>0 then raise exception 'SEED_PRECOMMIT_CANONICAL_CONTENT_ASSERTION_FAILED mismatches=%',content_mismatches;end if;
	 with expected as(select unnest(public.sanila_master_demo_v2_mutable_tables()) table_name),coverage as(
	  select e.table_name,
	   bool_or(t.tgname='sanila_master_demo_mutation_insert' and pg_get_triggerdef(t.oid) like '% AFTER INSERT ON %') insert_ok,
	   bool_or(t.tgname='sanila_master_demo_mutation_update' and pg_get_triggerdef(t.oid) like '% AFTER UPDATE ON %') update_ok,
	   bool_or(t.tgname='sanila_master_demo_mutation_delete' and pg_get_triggerdef(t.oid) like '% AFTER DELETE ON %') delete_ok
	  from expected e left join pg_namespace n on n.nspname='public' left join pg_class p on p.relnamespace=n.oid and p.relname=e.table_name
	  left join pg_trigger t on t.tgrelid=p.oid and not t.tgisinternal group by e.table_name)
	 select count(*),count(*) filter(where not coalesce(insert_ok,false)),count(*) filter(where not coalesce(update_ok,false)),count(*) filter(where not coalesce(delete_ok,false))
	 into mutable_tables,insert_coverage_missing,update_coverage_missing,delete_coverage_missing from coverage;
	 if mutable_tables<>110 or insert_coverage_missing<>0 or update_coverage_missing<>0 or delete_coverage_missing<>0 then
	  raise exception 'SEED_PRECOMMIT_MUTATION_CAPTURE_ASSERTION_FAILED tables=%/110 insert_missing=% update_missing=% delete_missing=%',mutable_tables,insert_coverage_missing,update_coverage_missing,delete_coverage_missing;
	 end if;

 update public.sanila_demo_configs set seed_health='healthy',seeded_at=clock_timestamp(),last_seed_verified_at=null,
  seed_counts=jsonb_build_object('canonical_instant','2027-02-17T10:37:00Z','students',600,'households',450,'staff',72,'teachers',48,'classes',36,'timetable_slots',1260,'teaching_days',90,'attendance_records',54000,'staff_attendance_records',6480,'tasks',48,'general_incidents',24,'payroll_periods',6,'transport_runs',640,'transport_events',12080,'route_contract',195,'forecast_total_fixture_rows',127177),updated_at=clock_timestamp() where id=c.id;
end $$;

\if :{?SANILA_MASTER_DEMO_V2_OUTER_TRANSACTION}
\else
commit;
\endif
