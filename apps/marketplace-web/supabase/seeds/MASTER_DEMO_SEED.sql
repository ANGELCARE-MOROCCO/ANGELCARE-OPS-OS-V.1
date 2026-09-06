\set ON_ERROR_STOP on

-- SANILA_MASTER_DEMO_LIVING_SCHOOL_DIGITAL_TWIN_V1
-- SOURCE ONLY. Codex did not execute this file.
-- This script is deliberately pinned to the one existing Master Demo identity.
-- It creates no tenant, school, app user, or role.

begin;

create table if not exists public.sanila_demo_fixture_registry (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  table_name text not null check (table_name ~ '^angelcare360_[a-z0-9_]+$'),
  fixture_key text not null,
  fixture_id uuid not null,
  seed_version text not null,
  domain_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(config_id, table_name, fixture_key),
  unique(config_id, table_name, fixture_id)
);

alter table public.sanila_demo_fixture_registry enable row level security;
revoke all on public.sanila_demo_fixture_registry from public, anon, authenticated;
grant all on public.sanila_demo_fixture_registry to service_role;

create or replace function public.sanila_master_demo_domain_for_table(p_table text)
returns text language sql immutable strict as $$
  select case
    when p_table ~ '(academic|subject|lesson|assignment|exam|mark|teacher_comment|report_card)' then 'academics'
    when p_table ~ '(attendance|absence)' then 'attendance'
    when p_table ~ '(invoice|payment|receipt|discount|fee_|expense)' then 'finance'
    when p_table ~ 'payroll' then 'payroll'
    when p_table ~ 'transport' then 'transport'
    when p_table ~ 'library' then 'library'
    when p_table ~ 'inventory' then 'inventory'
    when p_table ~ '(message|conversation|announcement)' then 'communications'
    when p_table ~ 'notification' then 'notifications'
    when p_table ~ '(report|export)' then 'reports_exports'
    when p_table ~ 'document' then 'documents'
    when p_table ~ '(parent|student|staff|family|people|emergency)' then 'people'
    when p_table ~ '(class|section|term|school|governance|timetable)' then 'administration'
    when p_table ~ '(admission|area9)' then 'admissions'
    when p_table ~ '(reclamation|claim)' then 'trust_resolution'
    else 'cross_domain'
  end
$$;

-- Replace the existing schema-adaptive helper with the same behavior plus
-- ownership registration. Registration is what makes reset fixture-scoped.
create or replace function public.sanila_master_demo_upsert(
  p_config_id uuid,
  p_table text,
  p_fixture_key text,
  p_payload jsonb,
  p_required boolean default true
) returns boolean language plpgsql security definer set search_path=public as $$
declare
  v_rel regclass; v_id uuid; v_cols text; v_values text; v_updates text;
  v_missing text[]; v_sql text;
begin
  if p_table !~ '^angelcare360_[a-z0-9_]+$' then
    raise exception 'Unsafe demo seed table: %', p_table;
  end if;
  v_rel := to_regclass('public.' || p_table);
  if v_rel is null then
    if p_required then raise exception 'Required SANILA table missing: %', p_table; end if;
    return false;
  end if;
  v_id := public.sanila_master_demo_fixture_uuid(p_config_id, p_fixture_key);
  p_payload := p_payload || jsonb_build_object('id',v_id);
  select array_agg(c.column_name order by c.ordinal_position) into v_missing
  from information_schema.columns c
  where c.table_schema='public' and c.table_name=p_table and c.is_nullable='NO'
    and c.column_default is null and coalesce(c.is_generated,'NEVER')='NEVER'
    and not (p_payload ? c.column_name);
  if coalesce(array_length(v_missing,1),0)>0 then
    if p_required then
      raise exception 'Seed payload % missing columns for %: %',p_fixture_key,p_table,array_to_string(v_missing,',');
    end if;
    return false;
  end if;
  select string_agg(format('%I',c.column_name),', ' order by c.ordinal_position),
         string_agg(format('r.%I',c.column_name),', ' order by c.ordinal_position),
         string_agg(format('%I=excluded.%I',c.column_name,c.column_name),', ' order by c.ordinal_position)
  into v_cols,v_values,v_updates
  from information_schema.columns c
  where c.table_schema='public' and c.table_name=p_table and p_payload ? c.column_name
    and coalesce(c.is_generated,'NEVER')='NEVER';
  v_sql := format(
    'insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) r on conflict (id) do update set %s',
    p_table,v_cols,v_values,p_table,v_updates
  );
  execute v_sql using p_payload;
  insert into public.sanila_demo_fixture_registry(config_id,table_name,fixture_key,fixture_id,seed_version,domain_key)
  values(p_config_id,p_table,p_fixture_key,v_id,'SANILA_MASTER_DEMO_LIVING_SCHOOL_V1',public.sanila_master_demo_domain_for_table(p_table))
  on conflict(config_id,table_name,fixture_key) do update set
    fixture_id=excluded.fixture_id,seed_version=excluded.seed_version,
    domain_key=excluded.domain_key,updated_at=now();
  return true;
end $$;

create or replace function public.sanila_seed_master_demo_living_school_v1()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  c public.sanila_demo_configs%rowtype;
  y uuid; term1 uuid; class_id uuid; section_id uuid; student_id uuid;
  parent_id uuid; staff_id uuid; subject_id uuid; report_id uuid;
  i integer; j integer; baseline jsonb; verified jsonb;
begin
  select * into c from public.sanila_demo_configs
  where id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid for update;
  if not found
    or c.operator_tenant_id<>'85a655be-a92b-4b82-8e60-130f4e7c8e2f'::uuid
    or c.school_id<>'8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
    or c.school_admin_app_user_id<>'25d16e25-2dd7-4c19-afb9-800609b3ba8a'::uuid
    or c.classification<>'master_demo' or not c.active
    or c.billing_mode<>'non_billable' or c.safety_status<>'enforced' then
    raise exception 'REFUSED: exact existing Master Demo identity/safety chain does not match';
  end if;
  if not exists (
    select 1 from public.angelcare360_operator_tenants t
    where t.id=c.operator_tenant_id and t.school_id=c.school_id
      and t.tenant_slug='sanila-master-demo' and t.status='active'
  ) then raise exception 'REFUSED: exact active tenant linkage is missing'; end if;
  if not exists (
    select 1 from public.angelcare360_schools s
    where s.id=c.school_id and s.school_code='SANILA-MASTER-DEMO'
      and s.name='SANILA INTERNATIONAL SCHOOL — DEMO' and s.status='active'
      and s.metadata_json->>'sanila_master_demo'='true'
  ) then raise exception 'REFUSED: exact existing school identity is missing'; end if;
  if not exists (
    select 1 from public.app_users u join public.angelcare360_user_roles ur on ur.app_user_id=u.id
    where u.id=c.school_admin_app_user_id and u.status='active'
      and ur.school_id=c.school_id and ur.status='active'
  ) then raise exception 'REFUSED: exact active School Admin linkage is missing'; end if;
  if not pg_try_advisory_xact_lock(hashtextextended('sanila-living-school-seed:'||c.id::text,0)) then
    raise exception 'Master Demo seed/reset is already running';
  end if;

  -- The proven repository-native baseline owns the high-volume coherent graph.
  -- Because the helper above registers every upsert, rerunning it adopts only
  -- its deterministic fixture IDs; it does not claim arbitrary tenant rows.
  baseline := public.sanila_seed_master_demo(c.id);
  if not coalesce((baseline->>'ok')::boolean,false) then
    raise exception 'Baseline seed failed: %',baseline;
  end if;

  y:=public.sanila_master_demo_fixture_uuid(c.id,'academic-year:2026-2027');
  term1:=public.sanila_master_demo_fixture_uuid(c.id,'term:1');

  -- Fixed narrative clock: Monday 2027-02-01, middle of term 2.
  update public.angelcare360_terms set status=case when id=term1 then 'closed' else case when id=public.sanila_master_demo_fixture_uuid(c.id,'term:2') then 'active' else 'planned' end end,
    updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (term1,public.sanila_master_demo_fixture_uuid(c.id,'term:2'),public.sanila_master_demo_fixture_uuid(c.id,'term:3'));
  update public.angelcare360_lessons set lesson_date=date '2027-01-25'+((right(lesson_code,3)::int-1)%5),topic='Séquence de mi-année — consolidation',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_lessons');
  update public.angelcare360_assignments set due_on='2027-02-05',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_assignments');
  update public.angelcare360_exams set scheduled_on='2027-01-22',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_exams');
  update public.angelcare360_marks set recorded_at='2027-01-25T16:00:00Z',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_marks');
  for j in 1..10 loop
    update public.angelcare360_attendance_sessions
    set session_date=date '2027-01-18'+(j-1),updated_at='2027-02-01T08:00:00Z'
    where school_id=c.school_id and id in (
      select fixture_id from public.sanila_demo_fixture_registry
      where config_id=c.id and table_name='angelcare360_attendance_sessions'
        and fixture_key like 'attendance-session:'||j||':%'
    );
  end loop;
  update public.angelcare360_attendance_records r
  set check_in_at=case when r.attendance_status='absent' then null else s.session_date+case when r.attendance_status='late' then time '08:17' else time '07:55' end end,
      updated_at='2027-02-01T08:00:00Z'
  from public.angelcare360_attendance_sessions s
  where r.school_id=c.school_id and r.attendance_session_id=s.id
    and r.id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_attendance_records');
  update public.angelcare360_invoices set invoice_date='2027-01-04',due_date='2027-01-08',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_invoices');
  update public.angelcare360_payments set payment_date='2027-01-06',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_payments');
  update public.angelcare360_messages set sent_at='2027-01-28T08:00:00Z',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_messages');
  update public.angelcare360_payroll_periods set period_code='DEMO-PAYROLL-2027-01',label='Paie janvier 2027',starts_on='2027-01-01',ends_on='2027-01-31',payment_date='2027-01-29',updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id=public.sanila_master_demo_fixture_uuid(c.id,'payroll-period:sep');
  update public.angelcare360_payroll_records set paid_at=case when payment_status='paid' then '2027-01-29T12:00:00Z'::timestamptz else null end,updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_payroll_records');
  update public.angelcare360_library_loans set loaned_at='2027-01-18T10:00:00Z',due_at=case when status='overdue' then '2027-01-25T17:00:00Z'::timestamptz else '2027-02-08T17:00:00Z'::timestamptz end,updated_at='2027-02-01T08:00:00Z'
  where school_id=c.school_id and id in (select fixture_id from public.sanila_demo_fixture_registry where config_id=c.id and table_name='angelcare360_library_loans');

  -- People, safeguarding and evidence.
  for i in 1..60 loop
    student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i);
    parent_id:=public.sanila_master_demo_fixture_uuid(c.id,'parent:'||i);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_emergency_contacts','emergency-contact:'||i,
      jsonb_build_object('school_id',c.school_id,'contactable_type','student','contactable_id',student_id,'contact_name','Responsable Démo '||i,'relationship_type','guardian','phone','+2120003'||lpad(i::text,5,'0'),'email','emergency.'||lpad(i::text,3,'0')||'@sanila-demo.invalid','priority',1,'status','active','metadata_json',jsonb_build_object('demo',true)));
    if i<=24 then
      perform public.sanila_master_demo_upsert(c.id,'angelcare360_documents','document:'||i,
        jsonb_build_object('school_id',c.school_id,'document_code','DEMO-DOC-'||lpad(i::text,3,'0'),'documentable_type','student','documentable_id',student_id,'category','admission','title','Pièce fictive contrôlée '||i,'file_name','demo-document-'||i||'.pdf','file_path','master-demo/nonexistent/demo-document-'||i||'.pdf','storage_provider','supabase','mime_type','application/pdf','file_size_bytes',0,'visibility','restricted','status','active','metadata_json',jsonb_build_object('demo',true,'placeholder_only',true,'external_download',false)));
    end if;
  end loop;

  -- Calendar and timetable: five operational days x 36 classes.
  for i in 1..5 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_school_day_rules','school-day-rule:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'day_of_week',i,'is_operational',true,'starts_at','08:00','ends_at','16:30','status','active'));
  end loop;
  for i in 1..8 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_school_calendar_events','calendar-event:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'event_code','DEMO-CAL-'||lpad(i::text,2,'0'),'title',(array['Conseil de classe','Réunion parents','Atelier sciences','Sortie culturelle','Contrôle continu','Formation équipe','Journée sportive','Clôture trimestre'])[i],'description','Événement fictif du scénario mi-année','event_type',case when i in (2,6) then 'meeting' else 'school_event' end,'starts_on',(date '2027-02-03'+i*3)::text,'ends_on',(date '2027-02-03'+i*3)::text,'all_day',i not in (1,2,6),'audience','all','status','published','metadata_json',jsonb_build_object('demo',true)));
  end loop;
  for i in 1..36 loop for j in 1..5 loop
    class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||i);
    section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||i);
    subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((i+j-2)%12)));
    staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i+j-2)%48)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_timetable_slots','timetable-slot:'||i||':'||j,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'class_id',class_id,'section_id',section_id,'subject_id',subject_id,'staff_id',staff_id,'day_of_week',j,'start_time','09:00','end_time','10:00','room','Salle '||lpad(i::text,2,'0'),'slot_type','regular','status','active','metadata_json',jsonb_build_object('demo',true)));
  end loop; end loop;

  -- Attendance exceptions anchored to deterministic January records.
  for i in 1..20 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_attendance_justifications','attendance-justification:'||i,
      jsonb_build_object('school_id',c.school_id,'attendance_record_id',public.sanila_master_demo_fixture_uuid(c.id,'attendance:'||(1+((i-1)%10))||':'||i),'justification_code','DEMO-JUST-'||lpad(i::text,3,'0'),'reason_category',case when i%3=0 then 'medical' else 'family' end,'description','Justification fictive de mi-année','submitted_at','2027-01-29T09:00:00Z','decision',case when i<=12 then 'accepted' when i<=16 then 'rejected' else 'pending' end,'decision_reason',case when i<=16 then 'Décision fictive documentée' else null end,'reviewed_at',case when i<=16 then '2027-01-30T11:00:00Z' else null end,'status','active','metadata_json',jsonb_build_object('demo',true)));
  end loop;

  -- Academic execution and report cards.
  for i in 1..36 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_exam_sessions','exam-session:'||i,
      jsonb_build_object('school_id',c.school_id,'exam_id',public.sanila_master_demo_fixture_uuid(c.id,'exam:'||i),'session_code','DEMO-EXS-'||lpad(i::text,3,'0'),'room','Salle '||lpad(i::text,2,'0'),'starts_at','2027-01-22T09:00:00Z','ends_at','2027-01-22T10:00:00Z','invigilator_staff_id',public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i-1)%48))),'status','closed','metadata_json',jsonb_build_object('demo',true)));
  end loop;
  for i in 1..600 loop
    student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i);
    class_id:=public.sanila_master_demo_fixture_uuid(c.id,'class:'||(1+((i-1)%36)));
    section_id:=public.sanila_master_demo_fixture_uuid(c.id,'section:'||(1+((i-1)%36)));
    subject_id:=public.sanila_master_demo_fixture_uuid(c.id,'subject:'||(1+((((1+((i-1)%36))-1)/3)%12)));
    staff_id:=public.sanila_master_demo_fixture_uuid(c.id,'staff:'||(7+((i-1)%48)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_assignment_submissions','assignment-submission:'||i,
      jsonb_build_object('school_id',c.school_id,'assignment_id',public.sanila_master_demo_fixture_uuid(c.id,'assignment:'||(1+((i-1)%36))),'student_id',student_id,'submitted_at','2027-01-29T17:00:00Z','score',10+(i%11),'feedback','Retour pédagogique fictif','status',case when i%17=0 then 'late' else 'graded' end,'metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_teacher_comments','teacher-comment:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'class_id',class_id,'section_id',section_id,'term_id',term1,'staff_id',staff_id,'comment_type','appreciation','comment_text',case when i%13=0 then 'Participation à renforcer au deuxième trimestre.' else 'Progression régulière et travail sérieux.' end,'rating',3+(i%3),'status','active','metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_cards','report-card:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'class_id',class_id,'section_id',section_id,'term_id',term1,'report_card_code','DEMO-BUL-'||lpad(i::text,4,'0'),'generated_on','2027-01-29','overall_average',10+(i%91)::numeric/10,'rank_position',1+((i-1)%22),'attendance_summary','Présence consolidée au trimestre 1','status',case when i<=520 then 'published' else 'reviewed' end,'metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_card_lines','report-card-line:'||i,
      jsonb_build_object('school_id',c.school_id,'report_card_id',public.sanila_master_demo_fixture_uuid(c.id,'report-card:'||i),'subject_id',subject_id,'teacher_comment_id',public.sanila_master_demo_fixture_uuid(c.id,'teacher-comment:'||i),'mark_average',10+(i%91)::numeric/10,'coefficient',2,'letter_grade',case when i%4=0 then 'A' else 'B' end,'remarks','Ligne de bulletin fictive','status','active','metadata_json',jsonb_build_object('demo',true)));
  end loop;

  -- Finance operations: assignments, reminders and expenses.
  for i in 1..600 loop
    student_id:=public.sanila_master_demo_fixture_uuid(c.id,'student:'||i);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_student_fee_assignments','student-fee-assignment:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'student_id',student_id,'fee_structure_id',public.sanila_master_demo_fixture_uuid(c.id,'fee-structure:1'),'assigned_on','2026-09-01','status','active','class_id',public.sanila_master_demo_fixture_uuid(c.id,'class:'||(1+((i-1)%36))),'section_id',public.sanila_master_demo_fixture_uuid(c.id,'section:'||(1+((i-1)%36))),'metadata_json',jsonb_build_object('demo',true)));
    if i<=60 then
      perform public.sanila_master_demo_upsert(c.id,'angelcare360_payment_reminders','payment-reminder:'||i,
        jsonb_build_object('school_id',c.school_id,'invoice_id',public.sanila_master_demo_fixture_uuid(c.id,'invoice:'||i),'student_id',student_id,'reminder_code','DEMO-REL-'||lpad(i::text,3,'0'),'reminder_type','balance_due','scheduled_for','2027-02-02T09:00:00Z','channel','email','status','blocked','notes','Canal externe bloqué — simulation Master Demo','metadata_json',jsonb_build_object('demo',true,'external_delivery','blocked')));
    end if;
  end loop;
  for i in 1..24 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_expenses','expense:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'expense_code','DEMO-DEP-'||lpad(i::text,3,'0'),'expense_date',(date '2027-01-05'+i)::text,'category',(array['pédagogie','transport','entretien','administration'])[1+((i-1)%4)],'vendor_name','Fournisseur fictif '||(1+((i-1)%6)),'amount',350+(i*75),'currency','MAD','payment_method','bank_transfer','status',case when i<=18 then 'paid' else 'submitted' end,'notes','Dépense fictive de mi-année','metadata_json',jsonb_build_object('demo',true)));
  end loop;

  -- Internal-only communications. No adapter dispatch is performed.
  for i in 1..8 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_message_templates','message-template:'||i,
      jsonb_build_object('school_id',c.school_id,'template_code','DEMO-TPL-'||lpad(i::text,2,'0'),'channel','in_app','name','Modèle interne Démo '||i,'content','Contenu fictif interne {{student_name}}','audience_type',case when i%2=0 then 'parents' else 'staff' end,'status','active','metadata_json',jsonb_build_object('demo',true,'external_delivery',false)));
  end loop;
  for i in 1..12 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_announcements','announcement:'||i,
      jsonb_build_object('school_id',c.school_id,'academic_year_id',y,'announcement_code','DEMO-ANN-'||lpad(i::text,2,'0'),'title','Annonce interne fictive '||i,'body','Information de démonstration, sans destinataire externe.','audience','all','published_at','2027-01-28T08:00:00Z','expires_at','2027-02-28T23:59:59Z','status','published_internal','metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_conversations','conversation:'||i,
      jsonb_build_object('school_id',c.school_id,'conversation_code','DEMO-CONV-'||lpad(i::text,2,'0'),'subject','Conversation interne Démo '||i,'conversation_type','internal','status',case when i=12 then 'archived' else 'open' end,'last_message_at','2027-01-29T15:00:00Z','metadata_json',jsonb_build_object('demo',true)));
    for j in 1..2 loop
      perform public.sanila_master_demo_upsert(c.id,'angelcare360_conversation_participants','conversation-participant:'||i||':'||j,
        jsonb_build_object('school_id',c.school_id,'conversation_id',public.sanila_master_demo_fixture_uuid(c.id,'conversation:'||i),'participant_parent_id',public.sanila_master_demo_fixture_uuid(c.id,'parent:'||((i-1)*2+j)),'participant_role','parent','read_at',case when j=1 then '2027-01-29T16:00:00Z' else null end,'status','active','metadata_json',jsonb_build_object('demo',true)));
    end loop;
  end loop;

  -- Reports, documents and exports remain records only; file/provider effects are blocked.
  for i in 1..4 loop
    report_id:=public.sanila_master_demo_fixture_uuid(c.id,'report:'||i);
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_templates','report-template:'||i,
      jsonb_build_object('school_id',c.school_id,'report_id',report_id,'template_code','DEMO-RPT-TPL-'||i,'label','Modèle rapport Démo '||i,'module_key','rapports','report_family',(array['attendance','finance','academics','operations'])[i],'output_format',case when i=2 then 'xlsx' else 'pdf_a4' end,'description','Modèle fictif sans génération externe','config_json',jsonb_build_object('demo',true),'status','active','metadata_json',jsonb_build_object('demo',true)));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_exports','report-export:'||i,
      jsonb_build_object('school_id',c.school_id,'report_id',report_id,'export_code','DEMO-EXP-'||i,'export_format',case when i=2 then 'xlsx' else 'pdf' end,'requested_at','2027-01-30T10:00:00Z','status','cancelled','metadata_json',jsonb_build_object('demo',true,'external_generation','blocked')));
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_export_files','export-file:'||i,
      jsonb_build_object('school_id',c.school_id,'report_export_id',public.sanila_master_demo_fixture_uuid(c.id,'report-export:'||i),'export_code','DEMO-EXP-'||i,'file_code','DEMO-FILE-'||i,'file_name','demo-export-'||i||case when i=2 then '.xlsx' else '.pdf' end,'file_path','master-demo/nonexistent/demo-export-'||i,'storage_provider','supabase','file_size_bytes',0,'export_format',case when i=2 then 'xlsx' else 'pdf_a4' end,'status','blocked_not_configured','metadata_json',jsonb_build_object('demo',true,'placeholder_only',true)));
  end loop;
  for i in 1..8 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_report_requests','report-request:'||i,
      jsonb_build_object('school_id',c.school_id,'report_id',public.sanila_master_demo_fixture_uuid(c.id,'report:'||(1+((i-1)%4))),'report_template_id',public.sanila_master_demo_fixture_uuid(c.id,'report-template:'||(1+((i-1)%4))),'request_code','DEMO-RREQ-'||lpad(i::text,2,'0'),'report_code','DEMO-RPT-'||(1+((i-1)%4)),'report_family',(array['attendance','finance','academics','operations'])[1+((i-1)%4)],'module_key','rapports','date_from','2027-01-01','date_to','2027-01-31','filters_json',jsonb_build_object('demo',true),'status','processing_locked','requested_at','2027-01-30T09:00:00Z','error_message','Génération externe désactivée en Master Demo','metadata_json',jsonb_build_object('demo',true)));
  end loop;
  for i in 1..6 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_document_templates','document-template:'||i,
      jsonb_build_object('school_id',c.school_id,'template_code','DEMO-DOC-TPL-'||i,'label',(array['Certificat scolarité','Attestation présence','Reçu','Bulletin','Autorisation sortie','Fiche élève'])[i],'document_type','school_document','output_format','pdf_a4','description','Modèle fictif du Master Demo','retention_days',365,'config_json',jsonb_build_object('demo',true),'status','ready','metadata_json',jsonb_build_object('demo',true)));
  end loop;

  -- Family360 projection: 450 households and every student membership.
  for i in 1..450 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_area11_families','family:'||i,
      jsonb_build_object('school_id',c.school_id,'family_code','DEMO-FAM-'||lpad(i::text,4,'0'),'display_name','Famille Démo '||lpad(i::text,4,'0'),'verification_state',case when i%23=0 then 'pending' else 'verified' end,'status','active','metadata_json',jsonb_build_object('demo',true)));
  end loop;
  for i in 1..600 loop
    perform public.sanila_master_demo_upsert(c.id,'angelcare360_area11_family_memberships','family-membership-student:'||i,
      jsonb_build_object('school_id',c.school_id,'family_id',public.sanila_master_demo_fixture_uuid(c.id,'family:'||(1+((i-1)%450))),'member_type','student','student_id',public.sanila_master_demo_fixture_uuid(c.id,'student:'||i),'role_label','Élève','effective_from','2026-09-01T00:00:00Z','status','active'));
  end loop;

  if (select count(*) from public.sanila_demo_fixture_registry where config_id=c.id)<>17714 then
    raise exception 'Seed registry count mismatch: got %, expected 17714',
      (select count(*) from public.sanila_demo_fixture_registry where config_id=c.id);
  end if;

  update public.sanila_demo_configs set
    seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V1',
    seed_health='healthy',seeded_at=now(),verified_at=now(),last_seed_verified_at=now(),
    seed_counts=coalesce(seed_counts,'{}'::jsonb)||jsonb_build_object(
      'scenario_anchor','2027-02-01','registered_fixtures',(select count(*) from public.sanila_demo_fixture_registry where config_id=c.id),
      'command_center_routes',195,'forecast_total_fixture_rows',17714
    ),updated_at=now()
  where id=c.id;
  verified:=public.sanila_verify_master_demo(c.id);
  -- The legacy verifier expects its original seed label; restore the V1 label
  -- after structural verification and retain its result in the event record.
  update public.sanila_demo_configs set seed_version='SANILA_MASTER_DEMO_LIVING_SCHOOL_V1',seed_health=case when coalesce((verified->>'ok')::boolean,false) or (verified->'failures') <@ '["SEED_VERSION_MISMATCH"]'::jsonb then 'healthy' else 'degraded' end,
    seed_counts=coalesce(seed_counts,'{}'::jsonb)||jsonb_build_object('scenario_anchor','2027-02-01','registered_fixtures',(select count(*) from public.sanila_demo_fixture_registry where config_id=c.id),'command_center_routes',195,'forecast_total_fixture_rows',17714),updated_at=now() where id=c.id;
  insert into public.sanila_demo_access_events(config_id,event_type,severity,metadata)
  values(c.id,'living_school_v1_seed_completed','notice',jsonb_build_object('scenario_anchor','2027-02-01','forecast_total_fixture_rows',17714,'legacy_verification',verified));
  return jsonb_build_object('ok',true,'config_id',c.id,'school_id',c.school_id,'seed_version','SANILA_MASTER_DEMO_LIVING_SCHOOL_V1','scenario_anchor','2027-02-01','registered_fixtures',(select count(*) from public.sanila_demo_fixture_registry where config_id=c.id),'legacy_verification',verified);
end $$;

revoke all on function public.sanila_seed_master_demo_living_school_v1() from public,anon,authenticated;
grant execute on function public.sanila_seed_master_demo_living_school_v1() to service_role;

-- Applying this file installs/updates the project-native seed authority only.
-- Human execution after review:
-- select public.sanila_seed_master_demo_living_school_v1();

commit;
