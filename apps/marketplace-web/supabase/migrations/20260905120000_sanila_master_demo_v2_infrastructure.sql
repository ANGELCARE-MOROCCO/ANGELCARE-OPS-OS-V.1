begin;

-- SANILA Master Demo V2 infrastructure only. No business fixtures live here.
alter table public.sanila_demo_configs
  add column if not exists simulation_instant timestamptz,
  add column if not exists simulation_timezone text,
  add column if not exists fixture_contract_version text,
  add column if not exists baseline_sha256 text;

create table if not exists public.sanila_demo_fixture_registry (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  table_name text not null check (table_name ~ '^(angelcare360|ac360)_[a-z0-9_]+$'),
  fixture_key text not null,
  fixture_id uuid not null,
  seed_version text not null,
  domain_key text not null,
  canonical_payload jsonb not null,
  canonical_content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(config_id,table_name,fixture_key),
  unique(config_id,table_name,fixture_id)
);

-- Content authority stores the database-normalized values of every authored
-- fixture column. Identity and volatile ingestion/audit timestamps are excluded
-- from business-state equality; a missing row or changed authored value fails.
alter table public.sanila_demo_fixture_registry
  add column if not exists canonical_payload jsonb not null default '{}'::jsonb,
  add column if not exists canonical_content_hash text not null default md5('{}'::jsonb::text);

create table if not exists public.sanila_demo_mutation_journal (
  id uuid primary key default gen_random_uuid(),
  config_id uuid not null references public.sanila_demo_configs(id) on delete restrict,
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  table_name text not null check (table_name ~ '^(angelcare360|ac360)_[a-z0-9_]+$'),
  row_id uuid not null,
  mutation_kind text not null check (mutation_kind in ('insert','update','delete')),
  before_image jsonb,
  after_image jsonb,
  actor_app_user_id uuid,
  demo_grant_id uuid,
  occurred_at timestamptz not null default clock_timestamp(),
  reset_run_id uuid,
  unique(config_id,table_name,row_id,mutation_kind)
);
create index if not exists sanila_demo_mutation_journal_reset_idx
  on public.sanila_demo_mutation_journal(config_id,reset_run_id,occurred_at);

alter table public.sanila_demo_fixture_registry enable row level security;
alter table public.sanila_demo_mutation_journal enable row level security;
revoke all on public.sanila_demo_fixture_registry,public.sanila_demo_mutation_journal from public,anon,authenticated;
grant all on public.sanila_demo_fixture_registry,public.sanila_demo_mutation_journal to service_role;

create or replace function public.sanila_master_demo_domain_for_table(p_table text)
returns text language sql immutable strict set search_path=public as $$
 select case
  when p_table ~ '(academic|subject|lesson|assignment|exam|mark|report_card|grade)' then 'academics'
  when p_table ~ '(attendance|absence)' then 'attendance'
  when p_table ~ '(invoice|payment|receipt|discount|fee_|expense|finance_)' then 'finance'
  when p_table ~ 'payroll' then 'payroll'
  when p_table ~ 'transport' then 'transport'
  when p_table ~ 'library' then 'library'
  when p_table ~ 'inventory' then 'inventory'
  when p_table ~ '(message|conversation|announcement|notification)' then 'communications'
  when p_table ~ '(admission|area9)' then 'admissions'
  when p_table ~ '(reclamation|incident|safety|health)' then 'safety_trust'
  when p_table ~ '(task|maintenance|quality|direction)' then 'operations'
  when p_table ~ '(parent|student|staff|family|people)' then 'people'
  else 'administration' end
$$;

-- One immutable business-day authority is consumed by both student and staff
-- attendance. Six month anchors make the September-February span explicit;
-- the remaining 84 weekdays are deterministic and the canonical day is fixed.
create or replace function public.sanila_master_demo_representative_days()
returns table(day_index integer,business_date date)
language sql immutable strict set search_path=public as $$
 with anchors(business_date) as(values
  (date '2026-09-07'),(date '2026-10-01'),(date '2026-11-02'),
  (date '2026-12-01'),(date '2027-01-04'),(date '2027-02-17')
 ), sampled as(
  select x::date business_date from generate_series(date '2026-09-08',date '2027-02-16',interval '1 day') x
  where extract(isodow from x)<=5 and x::date not in(select business_date from anchors)
  order by md5(x::date::text) limit 84
 ), days as(select business_date from anchors union all select business_date from sampled)
 select row_number() over(order by business_date)::integer,business_date from days order by business_date
$$;

-- Exact registry ledger used by the seed's pre-COMMIT assertion. Keeping this
-- as data (rather than a handwritten count query) makes every required family
-- independently checkable while preserving the 127,177-row design.
create or replace function public.sanila_master_demo_v2_expected_fixture_counts()
returns jsonb language sql immutable strict set search_path=public as $$
 select '{"angelcare360_school_settings":1,"angelcare360_academic_years":1,"angelcare360_terms":3,"angelcare360_governance_sites":1,"angelcare360_classes":36,"angelcare360_sections":36,"angelcare360_school_day_rules":5,"angelcare360_school_calendar_events":30,"angelcare360_timetable_slots":1260,"angelcare360_subjects":12,"angelcare360_staff":72,"angelcare360_staff_contracts":72,"angelcare360_parents":450,"angelcare360_students":600,"angelcare360_student_parent_links":600,"angelcare360_class_enrollments":600,"angelcare360_emergency_contacts":60,"angelcare360_area11_families":450,"angelcare360_area11_family_memberships":600,"angelcare360_admission_applications":60,"angelcare360_class_subjects":288,"angelcare360_teacher_assignments":288,"angelcare360_lessons":3492,"angelcare360_assignments":1188,"angelcare360_assignment_submissions":2400,"angelcare360_exams":612,"angelcare360_exam_sessions":612,"angelcare360_marks":9600,"angelcare360_teacher_comments":600,"angelcare360_report_cards":600,"angelcare360_report_card_lines":4800,"angelcare360_attendance_sessions":3240,"angelcare360_attendance_records":54000,"angelcare360_attendance_justifications":200,"angelcare360_fee_structures":3,"angelcare360_fee_items":4,"angelcare360_student_fee_assignments":600,"angelcare360_invoices":3600,"angelcare360_invoice_lines":3600,"angelcare360_payments":3095,"angelcare360_receipts":3095,"angelcare360_discounts":60,"angelcare360_payment_reminders":60,"angelcare360_expenses":84,"angelcare360_payroll_periods":6,"angelcare360_payroll_records":432,"angelcare360_payroll_items":1224,"angelcare360_transport_vehicles":8,"angelcare360_transport_routes":8,"angelcare360_transport_stops":40,"angelcare360_transport_assignments":300,"angelcare360_library_books":120,"angelcare360_library_copies":120,"angelcare360_library_loans":360,"angelcare360_inventory_categories":4,"angelcare360_inventory_items":40,"angelcare360_inventory_movements":360,"angelcare360_messages":60,"angelcare360_message_recipients":40,"angelcare360_message_templates":8,"angelcare360_announcements":30,"angelcare360_conversations":12,"angelcare360_conversation_participants":24,"angelcare360_notifications":20,"angelcare360_reclamations":20,"angelcare360_reports":4,"angelcare360_report_templates":4,"angelcare360_report_requests":8,"angelcare360_report_exports":4,"angelcare360_export_files":4,"angelcare360_documents":24,"angelcare360_document_templates":6,"angelcare360_audit_logs":12,"angelcare360_admission_leads":60,"angelcare360_admission_status_history":240,"angelcare360_payroll_advances_sovereign":12,"angelcare360_payroll_run_executions":5,"angelcare360_payroll_employee_results":360,"angelcare360_payroll_payment_batches":4,"angelcare360_payroll_payment_items":288,"angelcare360_payroll_reconciliation_sessions":4,"angelcare360_payroll_input_revisions":72,"ac360_school_students":600,"ac360_school_staff_profiles":72,"ac360_school_transport_vehicles":8,"ac360_school_transport_drivers":8,"ac360_school_transport_routes":8,"ac360_school_transport_route_stops":48,"ac360_school_transport_student_assignments":300,"ac360_school_transport_route_runs":640,"ac360_school_transport_run_events":12080,"ac360_school_transport_safety_checks":640,"ac360_school_transport_alerts":32,"ac360_school_attendance_records":6480,"ac360_school_attendance_events":360,"ac360_school_leave_policies":3,"ac360_school_leave_requests":18,"ac360_school_task_boards":5,"ac360_school_tasks":48,"ac360_school_task_checklist_items":96,"ac360_school_task_status_transitions":48,"ac360_school_task_comments":24,"ac360_school_recurring_task_rules":6,"ac360_school_incident_reports":24,"ac360_school_incident_events":72,"ac360_school_incident_acknowledgements":12,"ac360_school_health_safety_alerts":12,"ac360_school_health_safety_snapshots":6,"ac360_school_safety_checklists":4,"ac360_school_safety_checklist_items":16,"ac360_school_safety_checks":90}'::jsonb
$$;

-- Database-execution baseline contract. pg_proc.prosrc is the stored function
-- body, not pg_get_functiondef output, so this byte fingerprint is unaffected
-- by deparser formatting. Signature/security/search_path are checked as well.
create or replace function public.sanila_master_demo_baseline_contract()
returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'valid',count(*)=1 and bool_and(md5(p.prosrc)='da7c7e857add261d4711f33c6a3723f7')
   and bool_and(p.prosecdef) and bool_and(p.prorettype='jsonb'::regtype)
   and bool_and(coalesce(p.proconfig,'{}'::text[])@>array['search_path=public']),
  'source_sha256','3a76db0f0e5e2fdb4f0ee6f18263fe0eb58f90aafbcf99c12e3ab79b796fbc9a',
  'function_body_md5',max(md5(p.prosrc)),'expected_function_body_md5','da7c7e857add261d4711f33c6a3723f7'
 ) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='sanila_seed_master_demo'
  and p.proargtypes='2950'::oidvector and p.pronargs=1
$$;

-- Schema-adaptive deterministic upsert. The seed supplies only data; this
-- reviewed helper owns schema inspection and registry writes.
create or replace function public.sanila_master_demo_upsert(
  p_config_id uuid,p_table text,p_fixture_key text,p_payload jsonb,p_required boolean default true
) returns boolean language plpgsql security definer set search_path=public as $$
declare v_rel regclass;v_id uuid;v_cols text;v_values text;v_updates text;v_missing text[];v_sql text;v_actual jsonb;v_canonical jsonb;
begin
 if p_table !~ '^(angelcare360|ac360)_[a-z0-9_]+$' then raise exception 'Unsafe demo fixture table: %',p_table;end if;
 v_rel:=to_regclass('public.'||p_table);
 if v_rel is null then if p_required then raise exception 'Required SANILA table missing: %',p_table;end if;return false;end if;
 v_id:=public.sanila_master_demo_fixture_uuid(p_config_id,p_fixture_key);
 p_payload:=p_payload||jsonb_build_object('id',v_id);
 select array_agg(c.column_name order by c.ordinal_position) into v_missing
 from information_schema.columns c where c.table_schema='public' and c.table_name=p_table
  and c.is_nullable='NO' and c.column_default is null and coalesce(c.is_generated,'NEVER')='NEVER'
  and not(p_payload?c.column_name);
 if coalesce(array_length(v_missing,1),0)>0 then
  if p_required then raise exception 'Fixture % missing required % columns: %',p_fixture_key,p_table,array_to_string(v_missing,',');end if;
  return false;
 end if;
 select string_agg(format('%I',c.column_name),', ' order by c.ordinal_position),
        string_agg(format('r.%I',c.column_name),', ' order by c.ordinal_position),
        string_agg(format('%I=excluded.%I',c.column_name,c.column_name),', ' order by c.ordinal_position)
 into v_cols,v_values,v_updates from information_schema.columns c
 where c.table_schema='public' and c.table_name=p_table and p_payload?c.column_name and coalesce(c.is_generated,'NEVER')='NEVER';
 perform set_config('sanila.demo_fixture_write','on',true);
 v_sql:=format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1) r on conflict(id) do update set %s',p_table,v_cols,v_values,p_table,v_updates);
 execute v_sql using p_payload;
 execute format('select to_jsonb(x) from public.%I x where id=$1',p_table) into strict v_actual using v_id;
 select coalesce(jsonb_object_agg(k,v_actual->k order by k),'{}'::jsonb) into v_canonical
 from jsonb_object_keys(p_payload) k
 where k not in('id','created_at','updated_at','created_by','updated_by','inserted_at','ingested_at','audit_created_at','audit_updated_at');
 insert into public.sanila_demo_fixture_registry(config_id,table_name,fixture_key,fixture_id,seed_version,domain_key,canonical_payload,canonical_content_hash)
 values(p_config_id,p_table,p_fixture_key,v_id,'SANILA_MASTER_DEMO_LIVING_SCHOOL_V2',public.sanila_master_demo_domain_for_table(p_table),v_canonical,md5(v_canonical::text))
 on conflict(config_id,table_name,fixture_key) do update set fixture_id=excluded.fixture_id,seed_version=excluded.seed_version,domain_key=excluded.domain_key,
  canonical_payload=excluded.canonical_payload,canonical_content_hash=excluded.canonical_content_hash,updated_at=now();
 return true;
end $$;

create or replace function public.sanila_master_demo_fixture_content_matches(p_table text,p_fixture_id uuid,p_expected jsonb)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare v_actual jsonb;v_projected jsonb;
begin
 if p_table !~ '^(angelcare360|ac360)_[a-z0-9_]+$' then raise exception 'Unsafe demo fixture table: %',p_table;end if;
 if to_regclass('public.'||p_table) is null then return false;end if;
 execute format('select to_jsonb(x) from public.%I x where id=$1',p_table) into v_actual using p_fixture_id;
 if v_actual is null then return false;end if;
 select coalesce(jsonb_object_agg(k,v_actual->k order by k),'{}'::jsonb) into v_projected from jsonb_object_keys(p_expected) k;
 return v_projected=p_expected and md5(v_projected::text)=md5(p_expected::text);
end $$;

-- Mutation ownership is table-allowlisted and server-derived from the row's
-- school/org scope. No client is allowed to assert is_demo.
create or replace function public.sanila_capture_master_demo_mutation()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_row jsonb;v_before jsonb;v_after jsonb;v_school uuid;v_config uuid;v_id uuid;v_kind text;
begin
 if current_setting('sanila.demo_fixture_write',true)='on' or current_setting('sanila.demo_reset_write',true)='on' then
  if tg_op='DELETE' then return old;else return new;end if;
 end if;
 v_before:=case when tg_op in('UPDATE','DELETE') then to_jsonb(old) end;
 v_after:=case when tg_op in('INSERT','UPDATE') then to_jsonb(new) end;
 v_row:=coalesce(v_after,v_before);v_id:=(v_row->>'id')::uuid;
 -- UPDATE can move a row into or out of Demo scope, so derive authority from
 -- the event-valid NEW and OLD images independently. The exact server-owned
 -- config remains the only accepted authority.
 if (v_after->>'school_id')::uuid='8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
  or (v_before->>'school_id')::uuid='8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid then
  v_school:='8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid;
 elsif public.sanila_is_master_demo_org((v_after->>'org_id')::uuid)
  or public.sanila_is_master_demo_org((v_before->>'org_id')::uuid) then
  v_school:='8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid;
 end if;
 select id into v_config from public.sanila_demo_configs
 where id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid and school_id=v_school
  and active and classification='master_demo' and billing_mode='non_billable' and safety_status='enforced';
 if v_config is null then if tg_op='DELETE' then return old;else return new;end if;end if;
 v_kind:=lower(tg_op);
 insert into public.sanila_demo_mutation_journal(config_id,school_id,table_name,row_id,mutation_kind,before_image,after_image,actor_app_user_id,demo_grant_id)
 values(v_config,v_school,tg_table_name,v_id,v_kind,v_before,v_after,auth.uid(),nullif(current_setting('sanila.demo_grant_id',true),'')::uuid)
 on conflict(config_id,table_name,row_id,mutation_kind) do update set
  before_image=coalesce(public.sanila_demo_mutation_journal.before_image,excluded.before_image),after_image=excluded.after_image,occurred_at=clock_timestamp();
 if tg_op='DELETE' then return old;else return new;end if;
end $$;

create or replace function public.sanila_is_master_demo_org(p_org_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(
  select 1 from public.sanila_demo_configs c join public.ac360_organizations o
   on o.id=p_org_id and (o.id=c.school_id or o.metadata_json->>'angelcare360_school_id'=c.school_id::text)
  where c.id='5c56dcb1-2a38-4ee0-aa6f-8c45f57bc86a'::uuid
   and c.school_id='8bc47614-f16c-41c0-8d37-22fe78b08cad'::uuid
   and c.active and c.classification='master_demo' and c.billing_mode='non_billable' and c.safety_status='enforced'
 )
$$;

create or replace function public.sanila_master_demo_v2_mutable_tables()
returns text[] language sql immutable strict set search_path=public as $$
select array[
 'angelcare360_school_settings','angelcare360_academic_years','angelcare360_terms','angelcare360_governance_sites','angelcare360_classes','angelcare360_sections','angelcare360_school_calendar_events','angelcare360_timetable_slots','angelcare360_subjects',
 'angelcare360_staff','angelcare360_staff_contracts','angelcare360_parents','angelcare360_students','angelcare360_student_parent_links','angelcare360_class_enrollments','angelcare360_emergency_contacts',
 'angelcare360_admission_leads','angelcare360_admission_applications','angelcare360_admission_interviews','angelcare360_admission_document_submissions','angelcare360_admission_status_history',
 'angelcare360_class_subjects','angelcare360_teacher_assignments','angelcare360_lessons','angelcare360_assignments','angelcare360_assignment_submissions','angelcare360_exams','angelcare360_exam_sessions','angelcare360_marks','angelcare360_teacher_comments','angelcare360_report_cards','angelcare360_report_card_lines',
 'angelcare360_attendance_sessions','angelcare360_attendance_records','angelcare360_attendance_justifications','angelcare360_attendance_status_history',
 'angelcare360_fee_structures','angelcare360_fee_items','angelcare360_student_fee_assignments','angelcare360_invoices','angelcare360_invoice_lines','angelcare360_payments','angelcare360_receipts','angelcare360_discounts','angelcare360_payment_reminders','angelcare360_expenses',
 'angelcare360_payroll_periods','angelcare360_payroll_records','angelcare360_payroll_items','angelcare360_payroll_input_revisions','angelcare360_payroll_advances_sovereign','angelcare360_payroll_run_executions','angelcare360_payroll_employee_results','angelcare360_payroll_payment_batches','angelcare360_payroll_payment_items','angelcare360_payroll_reconciliation_sessions',
 'angelcare360_transport_vehicles','angelcare360_transport_routes','angelcare360_transport_stops','angelcare360_transport_assignments','angelcare360_library_books','angelcare360_library_copies','angelcare360_library_loans','angelcare360_inventory_categories','angelcare360_inventory_items','angelcare360_inventory_movements',
 'angelcare360_messages','angelcare360_message_recipients','angelcare360_message_templates','angelcare360_announcements','angelcare360_conversations','angelcare360_conversation_participants','angelcare360_notifications','angelcare360_reclamations','angelcare360_report_templates','angelcare360_report_requests','angelcare360_report_exports','angelcare360_export_files','angelcare360_documents','angelcare360_document_templates','angelcare360_audit_logs',
 'ac360_school_students','ac360_school_staff_profiles','ac360_school_transport_vehicles','ac360_school_transport_drivers','ac360_school_transport_routes','ac360_school_transport_route_stops','ac360_school_transport_student_assignments','ac360_school_transport_route_runs','ac360_school_transport_run_events','ac360_school_transport_safety_checks','ac360_school_transport_alerts',
 'ac360_school_attendance_records','ac360_school_attendance_events','ac360_school_leave_policies','ac360_school_leave_requests','ac360_school_task_boards','ac360_school_tasks','ac360_school_task_checklist_items','ac360_school_task_comments','ac360_school_task_status_transitions','ac360_school_recurring_task_rules',
 'ac360_school_incident_reports','ac360_school_incident_events','ac360_school_incident_acknowledgements','ac360_school_health_safety_alerts','ac360_school_health_safety_snapshots','ac360_school_safety_checklists','ac360_school_safety_checklist_items','ac360_school_safety_checks'
]
$$;

do $$
declare t text;has_school boolean;has_org boolean;mutable_tables text[]:=public.sanila_master_demo_v2_mutable_tables();
begin
 foreach t in array mutable_tables loop
  if to_regclass('public.'||t) is null then raise exception 'MUTATION_CAPTURE_TABLE_MISSING: %',t;end if;
   execute format('drop trigger if exists sanila_master_demo_mutation_capture on public.%I',t);
   execute format('drop trigger if exists sanila_master_demo_mutation_insert on public.%I',t);
   execute format('drop trigger if exists sanila_master_demo_mutation_update on public.%I',t);
   execute format('drop trigger if exists sanila_master_demo_mutation_delete on public.%I',t);
   select exists(select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='school_id'),
          exists(select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='org_id') into has_school,has_org;
   if has_school then
    execute format('create trigger sanila_master_demo_mutation_insert after insert on public.%I for each row when (new.school_id=''%s''::uuid) execute function public.sanila_capture_master_demo_mutation()',t,'8bc47614-f16c-41c0-8d37-22fe78b08cad');
    execute format('create trigger sanila_master_demo_mutation_update after update on public.%I for each row when (old.school_id=''%s''::uuid or new.school_id=''%s''::uuid) execute function public.sanila_capture_master_demo_mutation()',t,'8bc47614-f16c-41c0-8d37-22fe78b08cad','8bc47614-f16c-41c0-8d37-22fe78b08cad');
    execute format('create trigger sanila_master_demo_mutation_delete after delete on public.%I for each row when (old.school_id=''%s''::uuid) execute function public.sanila_capture_master_demo_mutation()',t,'8bc47614-f16c-41c0-8d37-22fe78b08cad');
   elsif has_org then
    execute format('create trigger sanila_master_demo_mutation_insert after insert on public.%I for each row when (public.sanila_is_master_demo_org(new.org_id)) execute function public.sanila_capture_master_demo_mutation()',t);
    execute format('create trigger sanila_master_demo_mutation_update after update on public.%I for each row when (public.sanila_is_master_demo_org(old.org_id) or public.sanila_is_master_demo_org(new.org_id)) execute function public.sanila_capture_master_demo_mutation()',t);
    execute format('create trigger sanila_master_demo_mutation_delete after delete on public.%I for each row when (public.sanila_is_master_demo_org(old.org_id)) execute function public.sanila_capture_master_demo_mutation()',t);
   else
    raise exception 'MUTATION_CAPTURE_SCOPE_COLUMN_MISSING: %',t;
   end if;
 end loop;
end $$;

revoke all on function public.sanila_master_demo_upsert(uuid,text,text,jsonb,boolean),public.sanila_master_demo_fixture_content_matches(text,uuid,jsonb),public.sanila_capture_master_demo_mutation(),public.sanila_is_master_demo_org(uuid),public.sanila_master_demo_baseline_contract(),public.sanila_master_demo_v2_expected_fixture_counts(),public.sanila_master_demo_v2_mutable_tables(),public.sanila_master_demo_representative_days() from public,anon,authenticated;
grant execute on function public.sanila_master_demo_upsert(uuid,text,text,jsonb,boolean) to service_role;
grant execute on function public.sanila_master_demo_fixture_content_matches(text,uuid,jsonb),public.sanila_master_demo_baseline_contract(),public.sanila_master_demo_v2_expected_fixture_counts(),public.sanila_master_demo_v2_mutable_tables(),public.sanila_master_demo_representative_days() to service_role;

comment on table public.sanila_demo_mutation_journal is 'V2 reset ownership journal; populated only from server-derived Master Demo row scope.';
commit;
