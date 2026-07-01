-- AngelCare 360 Phase 2L - ParentTrust, Surveys, Complaints, Appointments & Reputation Runtime
-- Ref: AC360-PH2L-PARENTTRUST-SURVEYS-COMPLAINTS-APPOINTMENTS-REPUTATION-2026-06-30
-- Scope: backend/system-only ParentTrust runtime.
-- Strict rule: no ParentTrust UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2K school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. ParentTrust runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_parenttrust_survey_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  template_key text not null,
  label text not null,
  survey_type text not null default 'satisfaction',
  audience_type text not null default 'parents',
  questions_json jsonb not null default '[]'::jsonb,
  scoring_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, template_key),
  check (survey_type in ('satisfaction','nps','complaint_followup','appointment_feedback','reputation','custom')),
  check (audience_type in ('parents','guardians','staff','mixed')),
  check (status in ('draft','published','paused','archived'))
);

create table if not exists public.ac360_school_parenttrust_surveys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_id uuid references public.ac360_school_parenttrust_survey_templates(id) on delete set null,
  survey_key text not null,
  title text not null,
  survey_type text not null default 'satisfaction',
  audience_json jsonb not null default '{}'::jsonb,
  launched_at timestamptz,
  closes_at timestamptz,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, survey_key),
  check (survey_type in ('satisfaction','nps','complaint_followup','appointment_feedback','reputation','custom')),
  check (status in ('draft','launched','closed','cancelled','archived'))
);

create table if not exists public.ac360_school_parenttrust_survey_responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  survey_id uuid not null references public.ac360_school_parenttrust_surveys(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  response_channel text not null default 'manual',
  score numeric,
  nps_score integer,
  answers_json jsonb not null default '{}'::jsonb,
  sentiment text,
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (response_channel in ('portal','email','whatsapp','sms','phone','manual','import')),
  check (sentiment is null or sentiment in ('positive','neutral','negative','critical')),
  check (status in ('submitted','reviewed','flagged','archived'))
);

create table if not exists public.ac360_school_parenttrust_complaints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  complaint_code text not null,
  category text not null default 'general',
  priority text not null default 'medium',
  title text not null,
  description text,
  source_channel text not null default 'manual',
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  due_at timestamptz,
  status text not null default 'open',
  resolution_summary text,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, complaint_code),
  check (category in ('general','communication','billing','attendance','teacher','safety','transport','quality','admissions','other')),
  check (priority in ('low','medium','high','critical')),
  check (source_channel in ('portal','whatsapp','phone','email','in_person','manual','import')),
  check (status in ('open','triaged','in_progress','waiting_parent','waiting_internal','resolved','closed','cancelled','archived'))
);

create table if not exists public.ac360_school_parenttrust_complaint_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  complaint_id uuid not null references public.ac360_school_parenttrust_complaints(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (event_type in ('opened','assigned','status_changed','parent_contacted','internal_note','resolved','reopened','closed','escalated','archived'))
);

create table if not exists public.ac360_school_parenttrust_appointment_slots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  slot_key text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 1,
  appointment_type text not null default 'parent_meeting',
  status text not null default 'open',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, slot_key),
  check (ends_at > starts_at),
  check (appointment_type in ('parent_meeting','complaint_followup','admissions','finance','teacher','director','custom')),
  check (status in ('open','full','blocked','cancelled','archived'))
);

create table if not exists public.ac360_school_parenttrust_appointments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  slot_id uuid references public.ac360_school_parenttrust_appointment_slots(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  complaint_id uuid references public.ac360_school_parenttrust_complaints(id) on delete set null,
  appointment_code text not null,
  appointment_type text not null default 'parent_meeting',
  scheduled_at timestamptz not null default now(),
  status text not null default 'scheduled',
  purpose text,
  outcome_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, appointment_code),
  check (appointment_type in ('parent_meeting','complaint_followup','admissions','finance','teacher','director','custom')),
  check (status in ('scheduled','confirmed','rescheduled','completed','no_show','cancelled','archived'))
);

create table if not exists public.ac360_school_parenttrust_reputation_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  request_key text not null,
  request_type text not null default 'testimonial',
  channel text not null default 'whatsapp',
  target_url text,
  sent_at timestamptz,
  responded_at timestamptz,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, request_key),
  check (request_type in ('testimonial','review','referral','case_study','custom')),
  check (channel in ('whatsapp','email','sms','portal','phone','manual')),
  check (status in ('draft','queued','sent','responded','declined','cancelled','archived'))
);

create table if not exists public.ac360_school_parenttrust_testimonials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  reputation_request_id uuid references public.ac360_school_parenttrust_reputation_requests(id) on delete set null,
  testimonial_type text not null default 'text',
  rating integer,
  quote text,
  permission_to_publish boolean not null default false,
  published_at timestamptz,
  status text not null default 'collected',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (testimonial_type in ('text','audio','video','review','referral','case_study','custom')),
  check (rating is null or (rating between 1 and 5)),
  check (status in ('collected','approved','published','rejected','archived'))
);

create table if not exists public.ac360_school_parenttrust_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  surveys_launched integer not null default 0,
  responses_total integer not null default 0,
  average_score numeric not null default 0,
  nps_average numeric not null default 0,
  complaints_open integer not null default 0,
  complaints_critical integer not null default 0,
  appointments_upcoming integer not null default 0,
  testimonials_collected integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_school_parenttrust_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  severity text not null default 'medium',
  entity_type text,
  entity_id uuid,
  title text not null,
  message text,
  status text not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','acknowledged','resolved','dismissed','archived'))
);

create index if not exists idx_ac360_parenttrust_templates_org on public.ac360_school_parenttrust_survey_templates(org_id);
create index if not exists idx_ac360_parenttrust_surveys_org_status on public.ac360_school_parenttrust_surveys(org_id,status);
create index if not exists idx_ac360_parenttrust_responses_org_survey on public.ac360_school_parenttrust_survey_responses(org_id,survey_id);
create index if not exists idx_ac360_parenttrust_complaints_org_status on public.ac360_school_parenttrust_complaints(org_id,status,priority);
create index if not exists idx_ac360_parenttrust_appointments_org_status on public.ac360_school_parenttrust_appointments(org_id,status,scheduled_at);
create index if not exists idx_ac360_parenttrust_alerts_org_status on public.ac360_school_parenttrust_alerts(org_id,status,severity);

-- -----------------------------------------------------------------------------
-- 2. RPC runtime
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_parenttrust_dashboard(
  p_org_id uuid,
  p_as_of_date date default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_open_complaints integer := 0;
  v_critical integer := 0;
  v_surveys integer := 0;
  v_responses integer := 0;
  v_avg numeric := 0;
  v_nps numeric := 0;
  v_upcoming integer := 0;
  v_testimonials integer := 0;
  v_alerts integer := 0;
begin
  select count(*) into v_open_complaints from public.ac360_school_parenttrust_complaints where org_id=p_org_id and status in ('open','triaged','in_progress','waiting_parent','waiting_internal');
  select count(*) into v_critical from public.ac360_school_parenttrust_complaints where org_id=p_org_id and priority='critical' and status not in ('resolved','closed','cancelled','archived');
  select count(*) into v_surveys from public.ac360_school_parenttrust_surveys where org_id=p_org_id and status='launched';
  select count(*), coalesce(avg(score),0), coalesce(avg(nps_score),0) into v_responses, v_avg, v_nps from public.ac360_school_parenttrust_survey_responses where org_id=p_org_id and submitted_at::date <= coalesce(p_as_of_date,current_date);
  select count(*) into v_upcoming from public.ac360_school_parenttrust_appointments where org_id=p_org_id and status in ('scheduled','confirmed','rescheduled') and scheduled_at >= now();
  select count(*) into v_testimonials from public.ac360_school_parenttrust_testimonials where org_id=p_org_id and status in ('collected','approved','published');
  select count(*) into v_alerts from public.ac360_school_parenttrust_alerts where org_id=p_org_id and status='open';
  return jsonb_build_object('ok',true,'phase','phase_2l_parenttrust','uiBuildAllowed',false,'counts',jsonb_build_object('openComplaints',v_open_complaints,'criticalComplaints',v_critical,'launchedSurveys',v_surveys,'responses',v_responses,'averageScore',v_avg,'npsAverage',v_nps,'upcomingAppointments',v_upcoming,'testimonialsCollected',v_testimonials,'openAlerts',v_alerts));
end $$;

create or replace function public.ac360_school_upsert_parenttrust_survey_template(
  p_org_id uuid, p_template_id uuid default null, p_template_key text default null, p_label text default null, p_survey_type text default 'satisfaction', p_audience_type text default 'parents', p_questions_json jsonb default '[]'::jsonb, p_scoring_json jsonb default '{}'::jsonb, p_status text default 'draft', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(nullif(p_template_key,''),'pt-template-' || substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_parenttrust_survey_templates(id,org_id,template_key,label,survey_type,audience_type,questions_json,scoring_json,status,created_by,metadata_json)
  values(coalesce(p_template_id,gen_random_uuid()),p_org_id,v_key,coalesce(nullif(p_label,''),v_key),coalesce(p_survey_type,'satisfaction'),coalesce(p_audience_type,'parents'),coalesce(p_questions_json,'[]'::jsonb),coalesce(p_scoring_json,'{}'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,template_key) do update set label=excluded.label,survey_type=excluded.survey_type,audience_type=excluded.audience_type,questions_json=excluded.questions_json,scoring_json=excluded.scoring_json,status=excluded.status,metadata_json=public.ac360_school_parenttrust_survey_templates.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'templateId',v_id,'templateKey',v_key);
end $$;

create or replace function public.ac360_school_launch_parenttrust_survey(
  p_org_id uuid, p_campus_id uuid default null, p_template_id uuid default null, p_survey_key text default null, p_title text default null, p_survey_type text default 'satisfaction', p_audience_json jsonb default '{}'::jsonb, p_closes_at timestamptz default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(nullif(p_survey_key,''),'pt-survey-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_school_parenttrust_surveys(org_id,campus_id,template_id,survey_key,title,survey_type,audience_json,launched_at,closes_at,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,p_template_id,v_key,coalesce(nullif(p_title,''),'ParentTrust Survey'),coalesce(p_survey_type,'satisfaction'),coalesce(p_audience_json,'{}'::jsonb),now(),p_closes_at,'launched',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'surveyId',v_id,'surveyKey',v_key,'status','launched');
end $$;

create or replace function public.ac360_school_record_parenttrust_survey_response(
  p_org_id uuid, p_survey_id uuid, p_guardian_id uuid default null, p_student_id uuid default null, p_response_channel text default 'manual', p_score numeric default null, p_nps_score integer default null, p_answers_json jsonb default '{}'::jsonb, p_sentiment text default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_severity text;
begin
  insert into public.ac360_school_parenttrust_survey_responses(org_id,survey_id,guardian_id,student_id,response_channel,score,nps_score,answers_json,sentiment,metadata_json)
  values(p_org_id,p_survey_id,p_guardian_id,p_student_id,coalesce(p_response_channel,'manual'),p_score,p_nps_score,coalesce(p_answers_json,'{}'::jsonb),p_sentiment,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  if coalesce(p_score,5) <= 2 or coalesce(p_nps_score,10) <= 3 or p_sentiment in ('negative','critical') then
    v_severity := case when p_sentiment='critical' or coalesce(p_score,5) <= 1 then 'critical' else 'high' end;
    insert into public.ac360_school_parenttrust_alerts(org_id,alert_key,severity,entity_type,entity_id,title,message,metadata_json)
    values(p_org_id,'parenttrust.low_satisfaction',v_severity,'survey_response',v_id,'Low parent satisfaction detected','A ParentTrust response requires follow-up.',jsonb_build_object('score',p_score,'npsScore',p_nps_score,'sentiment',p_sentiment));
  end if;
  return jsonb_build_object('ok',true,'responseId',v_id);
end $$;

create or replace function public.ac360_school_open_parenttrust_complaint(
  p_org_id uuid, p_campus_id uuid default null, p_guardian_id uuid default null, p_student_id uuid default null, p_category text default 'general', p_priority text default 'medium', p_title text default null, p_description text default null, p_source_channel text default 'manual', p_assigned_staff_id uuid default null, p_due_at timestamptz default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  v_code := 'PTC-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_school_parenttrust_complaints(org_id,campus_id,guardian_id,student_id,complaint_code,category,priority,title,description,source_channel,assigned_staff_id,due_at,created_by,metadata_json)
  values(p_org_id,p_campus_id,p_guardian_id,p_student_id,v_code,coalesce(p_category,'general'),coalesce(p_priority,'medium'),coalesce(nullif(p_title,''),'ParentTrust complaint'),p_description,coalesce(p_source_channel,'manual'),p_assigned_staff_id,p_due_at,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_parenttrust_complaint_events(org_id,complaint_id,event_type,to_status,note,actor_app_user_id,metadata_json) values(p_org_id,v_id,'opened','open','Complaint opened.',p_actor_app_user_id,'{}'::jsonb);
  if p_priority in ('high','critical') then
    insert into public.ac360_school_parenttrust_alerts(org_id,alert_key,severity,entity_type,entity_id,title,message,metadata_json) values(p_org_id,'parenttrust.high_priority_complaint',p_priority,'complaint',v_id,'High priority parent complaint','A high/critical ParentTrust complaint requires management attention.',jsonb_build_object('complaintCode',v_code));
  end if;
  return jsonb_build_object('ok',true,'complaintId',v_id,'complaintCode',v_code,'status','open');
end $$;

create or replace function public.ac360_school_update_parenttrust_complaint_status(
  p_org_id uuid, p_complaint_id uuid, p_status text, p_note text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_old text; v_id uuid;
begin
  select status into v_old from public.ac360_school_parenttrust_complaints where id=p_complaint_id and org_id=p_org_id;
  if v_old is null then return jsonb_build_object('ok',false,'error','ParentTrust complaint not found.'); end if;
  update public.ac360_school_parenttrust_complaints set status=p_status,resolution_summary=case when p_status in ('resolved','closed') then coalesce(p_note,resolution_summary) else resolution_summary end,resolved_at=case when p_status in ('resolved','closed') then now() else resolved_at end,metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_complaint_id returning id into v_id;
  insert into public.ac360_school_parenttrust_complaint_events(org_id,complaint_id,event_type,from_status,to_status,note,actor_app_user_id,metadata_json) values(p_org_id,p_complaint_id,'status_changed',v_old,p_status,p_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'complaintId',v_id,'fromStatus',v_old,'toStatus',p_status);
end $$;

create or replace function public.ac360_school_upsert_parenttrust_appointment_slot(
  p_org_id uuid, p_slot_id uuid default null, p_campus_id uuid default null, p_staff_id uuid default null, p_slot_key text default null, p_starts_at timestamptz default null, p_ends_at timestamptz default null, p_capacity integer default 1, p_appointment_type text default 'parent_meeting', p_status text default 'open', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text; v_start timestamptz; v_end timestamptz;
begin
  v_key := coalesce(nullif(p_slot_key,''),'pt-slot-' || substr(gen_random_uuid()::text,1,8));
  v_start := coalesce(p_starts_at, now() + interval '1 day');
  v_end := coalesce(p_ends_at, v_start + interval '30 minutes');
  insert into public.ac360_school_parenttrust_appointment_slots(id,org_id,campus_id,staff_id,slot_key,starts_at,ends_at,capacity,appointment_type,status,created_by,metadata_json)
  values(coalesce(p_slot_id,gen_random_uuid()),p_org_id,p_campus_id,p_staff_id,v_key,v_start,v_end,greatest(1,coalesce(p_capacity,1)),coalesce(p_appointment_type,'parent_meeting'),coalesce(p_status,'open'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,slot_key) do update set campus_id=excluded.campus_id,staff_id=excluded.staff_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,capacity=excluded.capacity,appointment_type=excluded.appointment_type,status=excluded.status,metadata_json=public.ac360_school_parenttrust_appointment_slots.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'slotId',v_id,'slotKey',v_key);
end $$;

create or replace function public.ac360_school_book_parenttrust_appointment(
  p_org_id uuid, p_slot_id uuid default null, p_campus_id uuid default null, p_guardian_id uuid default null, p_student_id uuid default null, p_complaint_id uuid default null, p_appointment_type text default 'parent_meeting', p_scheduled_at timestamptz default null, p_purpose text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text; v_scheduled timestamptz;
begin
  v_code := 'PTA-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(gen_random_uuid()::text,1,4));
  select starts_at into v_scheduled from public.ac360_school_parenttrust_appointment_slots where id=p_slot_id and org_id=p_org_id;
  v_scheduled := coalesce(v_scheduled,p_scheduled_at,now()+interval '1 day');
  insert into public.ac360_school_parenttrust_appointments(org_id,campus_id,slot_id,guardian_id,student_id,complaint_id,appointment_code,appointment_type,scheduled_at,purpose,created_by,metadata_json)
  values(p_org_id,p_campus_id,p_slot_id,p_guardian_id,p_student_id,p_complaint_id,v_code,coalesce(p_appointment_type,'parent_meeting'),v_scheduled,p_purpose,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'appointmentId',v_id,'appointmentCode',v_code,'status','scheduled');
end $$;

create or replace function public.ac360_school_update_parenttrust_appointment_status(
  p_org_id uuid, p_appointment_id uuid, p_status text, p_outcome_note text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.ac360_school_parenttrust_appointments set status=p_status,outcome_note=coalesce(p_outcome_note,outcome_note),metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_appointment_id and org_id=p_org_id returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','ParentTrust appointment not found.'); end if;
  return jsonb_build_object('ok',true,'appointmentId',v_id,'status',p_status);
end $$;

create or replace function public.ac360_school_create_parenttrust_reputation_request(
  p_org_id uuid, p_guardian_id uuid default null, p_student_id uuid default null, p_request_type text default 'testimonial', p_channel text default 'whatsapp', p_target_url text default null, p_status text default 'queued', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text;
begin
  v_key := 'PTR-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || upper(substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_school_parenttrust_reputation_requests(org_id,guardian_id,student_id,request_key,request_type,channel,target_url,sent_at,status,created_by,metadata_json)
  values(p_org_id,p_guardian_id,p_student_id,v_key,coalesce(p_request_type,'testimonial'),coalesce(p_channel,'whatsapp'),p_target_url,case when p_status in ('queued','sent') then now() else null end,coalesce(p_status,'queued'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'reputationRequestId',v_id,'requestKey',v_key,'status',p_status);
end $$;

create or replace function public.ac360_school_record_parenttrust_testimonial(
  p_org_id uuid, p_guardian_id uuid default null, p_student_id uuid default null, p_reputation_request_id uuid default null, p_testimonial_type text default 'text', p_rating integer default null, p_quote text default null, p_permission_to_publish boolean default false, p_status text default 'collected', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_parenttrust_testimonials(org_id,guardian_id,student_id,reputation_request_id,testimonial_type,rating,quote,permission_to_publish,status,created_by,metadata_json)
  values(p_org_id,p_guardian_id,p_student_id,p_reputation_request_id,coalesce(p_testimonial_type,'text'),p_rating,p_quote,coalesce(p_permission_to_publish,false),coalesce(p_status,'collected'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  if p_reputation_request_id is not null then update public.ac360_school_parenttrust_reputation_requests set status='responded',responded_at=now(),updated_at=now() where id=p_reputation_request_id and org_id=p_org_id; end if;
  return jsonb_build_object('ok',true,'testimonialId',v_id,'status',p_status);
end $$;

create or replace function public.ac360_school_reconcile_parenttrust_runtime(
  p_org_id uuid, p_as_of_date date default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_surveys integer:=0; v_responses integer:=0; v_avg numeric:=0; v_nps numeric:=0; v_open integer:=0; v_critical integer:=0; v_appts integer:=0; v_testimonials integer:=0; v_snapshot uuid;
begin
  select count(*) into v_surveys from public.ac360_school_parenttrust_surveys where org_id=p_org_id and status='launched';
  select count(*), coalesce(avg(score),0), coalesce(avg(nps_score),0) into v_responses, v_avg, v_nps from public.ac360_school_parenttrust_survey_responses where org_id=p_org_id;
  select count(*) into v_open from public.ac360_school_parenttrust_complaints where org_id=p_org_id and status in ('open','triaged','in_progress','waiting_parent','waiting_internal');
  select count(*) into v_critical from public.ac360_school_parenttrust_complaints where org_id=p_org_id and priority='critical' and status not in ('resolved','closed','cancelled','archived');
  select count(*) into v_appts from public.ac360_school_parenttrust_appointments where org_id=p_org_id and status in ('scheduled','confirmed','rescheduled') and scheduled_at >= now();
  select count(*) into v_testimonials from public.ac360_school_parenttrust_testimonials where org_id=p_org_id and status in ('collected','approved','published');
  insert into public.ac360_school_parenttrust_snapshots(org_id,snapshot_date,surveys_launched,responses_total,average_score,nps_average,complaints_open,complaints_critical,appointments_upcoming,testimonials_collected,metadata_json)
  values(p_org_id,coalesce(p_as_of_date,current_date),v_surveys,v_responses,v_avg,v_nps,v_open,v_critical,v_appts,v_testimonials,coalesce(p_metadata,'{}'::jsonb)) returning id into v_snapshot;
  if v_critical > 0 then
    insert into public.ac360_school_parenttrust_alerts(org_id,alert_key,severity,entity_type,title,message,metadata_json) values(p_org_id,'parenttrust.critical_complaints_open','critical','complaint','Critical ParentTrust complaints open','One or more critical parent complaints require immediate action.',jsonb_build_object('snapshotId',v_snapshot,'criticalComplaints',v_critical));
  end if;
  return jsonb_build_object('ok',true,'snapshotId',v_snapshot,'counts',jsonb_build_object('surveysLaunched',v_surveys,'responsesTotal',v_responses,'averageScore',v_avg,'npsAverage',v_nps,'complaintsOpen',v_open,'complaintsCritical',v_critical,'appointmentsUpcoming',v_appts,'testimonialsCollected',v_testimonials));
end $$;

create or replace function public.ac360_school_resolve_parenttrust_alert(
  p_org_id uuid, p_alert_id uuid, p_resolution_note text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.ac360_school_parenttrust_alerts set status='resolved',resolved_by=p_actor_app_user_id,resolved_at=now(),metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('resolutionNote',p_resolution_note),updated_at=now() where id=p_alert_id and org_id=p_org_id returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','ParentTrust alert not found.'); end if;
  return jsonb_build_object('ok',true,'alertId',v_id,'status','resolved');
end $$;

-- -----------------------------------------------------------------------------
-- 3. Feature registry, actions, wiring, module coverage and rules
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('parenttrust_module','school_operations','parenttrust','ParentTrust Module','Surveys, complaints, parent appointments, satisfaction, testimonials and reputation runtime.','access',false,true,false,null,0,'{"phase":"phase_2l","growthMenu":"parenttrust_module"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json) values
('parenttrust_module','ParentTrust, Surveys & Reputation','parenttrust','Parent satisfaction surveys, complaints, appointments, testimonials, reputation requests, snapshots and alerts.','monthly',900,0,'institution','{"included":"parenttrust_runtime","surveys":"standard","complaints":"standard","appointments":"standard"}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2l","recommendedFor":"schools wanting parent retention, complaint control and reputation growth"}'::jsonb)
on conflict(addon_key) do update set label=excluded.label,family=excluded.family,description=excluded.description,billing_model=excluded.billing_model,monthly_price_mad=excluded.monthly_price_mad,setup_price_mad=excluded.setup_price_mad,included_allowance_json=excluded.included_allowance_json,cancellable=excluded.cancellable,data_preservation_policy=excluded.data_preservation_policy,status=excluded.status,metadata_json=public.ac360_addons.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.parenttrust.survey_template.upsert','parenttrust_module','AC360-ENG-52','Upsert ParentTrust survey template','Create or update a ParentTrust survey template.','parenttrust.survey_template.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.survey.launch','parenttrust_module','AC360-ENG-52','Launch ParentTrust survey','Launch a parent satisfaction/NPS survey.','parenttrust.survey.launch','automation',2,'require_upgrade','{"access_type":"usage","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.survey.response.record','parenttrust_module','AC360-ENG-52','Record survey response','Record ParentTrust survey response.','parenttrust.survey.response.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.complaint.open','parenttrust_module','AC360-ENG-52','Open parent complaint','Open a ParentTrust complaint case.','parenttrust.complaint.open',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.complaint.status.update','parenttrust_module','AC360-ENG-52','Update complaint status','Update a ParentTrust complaint status.','parenttrust.complaint.status.update',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.appointment_slot.upsert','parenttrust_module','AC360-ENG-52','Upsert appointment slot','Create or update parent appointment slot.','parenttrust.appointment_slot.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.appointment.book','parenttrust_module','AC360-ENG-52','Book parent appointment','Book a parent appointment.','parenttrust.appointment.book','automation',1,'require_upgrade','{"access_type":"usage","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.appointment.status.update','parenttrust_module','AC360-ENG-52','Update appointment status','Update parent appointment status/outcome.','parenttrust.appointment.status.update',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.reputation_request.create','parenttrust_module','AC360-ENG-52','Create reputation request','Create testimonial/review/referral request.','parenttrust.reputation_request.create','automation',2,'require_upgrade','{"access_type":"usage","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.testimonial.record','parenttrust_module','AC360-ENG-52','Record testimonial','Record parent testimonial or review.','parenttrust.testimonial.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.reconcile','parenttrust_module','AC360-ENG-52','Reconcile ParentTrust runtime','Refresh ParentTrust snapshots and alerts.','parenttrust.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb),
('school.parenttrust.alert.resolve','parenttrust_module','AC360-ENG-52','Resolve ParentTrust alert','Resolve ParentTrust alert.','parenttrust.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2l_parenttrust","suggested_addon_key":"parenttrust_module"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_parenttrust.survey_template.upsert','/api/ac360/school-parenttrust/survey-templates/upsert','POST','school.parenttrust.survey_template.upsert','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_survey_templates','strict','fixed_1','request_or_generated',null,null,'active','Upserts ParentTrust survey template.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.survey.launch','/api/ac360/school-parenttrust/surveys/launch','POST','school.parenttrust.survey.launch','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_surveys','strict','fixed_1','request_or_generated',null,null,'active','Launches ParentTrust survey.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.survey.response','/api/ac360/school-parenttrust/surveys/responses/record','POST','school.parenttrust.survey.response.record','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_survey_responses','strict','fixed_1','request_or_generated',null,null,'active','Records ParentTrust survey response.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.complaint.open','/api/ac360/school-parenttrust/complaints/open','POST','school.parenttrust.complaint.open','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_complaints','strict','fixed_1','request_or_generated',null,null,'active','Opens ParentTrust complaint.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.complaint.status','/api/ac360/school-parenttrust/complaints/status','POST','school.parenttrust.complaint.status.update','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_complaints','strict','fixed_1','request_or_generated',null,null,'active','Updates ParentTrust complaint status.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.appointment_slot.upsert','/api/ac360/school-parenttrust/appointment-slots/upsert','POST','school.parenttrust.appointment_slot.upsert','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_appointment_slots','strict','fixed_1','request_or_generated',null,null,'active','Upserts parent appointment slot.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.appointment.book','/api/ac360/school-parenttrust/appointments/book','POST','school.parenttrust.appointment.book','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_appointments','strict','fixed_1','request_or_generated',null,null,'active','Books parent appointment.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.appointment.status','/api/ac360/school-parenttrust/appointments/status','POST','school.parenttrust.appointment.status.update','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_appointments','strict','fixed_1','request_or_generated',null,null,'active','Updates parent appointment status.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.reputation_request.create','/api/ac360/school-parenttrust/reputation-requests/create','POST','school.parenttrust.reputation_request.create','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_reputation_requests','strict','fixed_1','request_or_generated',null,null,'active','Creates reputation/testimonial request.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.testimonial.record','/api/ac360/school-parenttrust/testimonials/record','POST','school.parenttrust.testimonial.record','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_testimonials','strict','fixed_1','request_or_generated',null,null,'active','Records parent testimonial.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.reconcile','/api/ac360/school-parenttrust/reconcile','POST','school.parenttrust.reconcile','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles ParentTrust runtime.','{"phase":"phase_2l"}'::jsonb),
('ac360.school_parenttrust.alert.resolve','/api/ac360/school-parenttrust/alerts/resolve','POST','school.parenttrust.alert.resolve','parenttrust_module','AC360-ENG-52','angelcare_360_parenttrust','ac360_school_parenttrust_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves ParentTrust alert.','{"phase":"phase_2l"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values('parenttrust_surveys_complaints_appointments_reputation','AC360-ENG-52','parenttrust_module','ParentTrust, Surveys, Complaints, Appointments & Reputation Runtime','phase_2l_parenttrust_surveys_complaints_appointments_reputation','guarded',array['ac360_school_parenttrust_survey_templates','ac360_school_parenttrust_surveys','ac360_school_parenttrust_survey_responses','ac360_school_parenttrust_complaints','ac360_school_parenttrust_appointments','ac360_school_parenttrust_reputation_requests','ac360_school_parenttrust_testimonials','ac360_school_parenttrust_alerts'],array['school.parenttrust.survey_template.upsert','school.parenttrust.survey.launch','school.parenttrust.survey.response.record','school.parenttrust.complaint.open','school.parenttrust.complaint.status.update','school.parenttrust.appointment_slot.upsert','school.parenttrust.appointment.book','school.parenttrust.appointment.status.update','school.parenttrust.reputation_request.create','school.parenttrust.testimonial.record','school.parenttrust.reconcile','school.parenttrust.alert.resolve'],'{"phase":"phase_2l","uiBuildAllowed":false,"archiveNotDelete":true,"growthMenu":"parenttrust_module"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2l.parenttrust.no_ui_before_backend_gate','No ParentTrust UI before backend gate','School Operations System','phase2l.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,240,'active','phase_2l_parenttrust'),
('phase2l.parenttrust.guard_every_action','Every ParentTrust action is guarded','School Operations System','school_parenttrust.action.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,241,'active','phase_2l_parenttrust'),
('phase2l.parenttrust.critical_complaints_alert','Critical complaints create management alerts','School Operations System','school_parenttrust.complaint.critical','{"priority":"critical"}'::jsonb,'{"create_alert":true,"severity":"critical"}'::jsonb,242,'active','phase_2l_parenttrust'),
('phase2l.parenttrust.low_satisfaction_alert','Low satisfaction creates follow-up alerts','School Operations System','school_parenttrust.survey_response.low_score','{"score_lte":2}'::jsonb,'{"create_alert":true,"followup_required":true}'::jsonb,243,'active','phase_2l_parenttrust')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

-- RLS lockdown: service role/runtime only until UI build is explicitly authorized.
alter table public.ac360_school_parenttrust_survey_templates enable row level security;
alter table public.ac360_school_parenttrust_surveys enable row level security;
alter table public.ac360_school_parenttrust_survey_responses enable row level security;
alter table public.ac360_school_parenttrust_complaints enable row level security;
alter table public.ac360_school_parenttrust_complaint_events enable row level security;
alter table public.ac360_school_parenttrust_appointment_slots enable row level security;
alter table public.ac360_school_parenttrust_appointments enable row level security;
alter table public.ac360_school_parenttrust_reputation_requests enable row level security;
alter table public.ac360_school_parenttrust_testimonials enable row level security;
alter table public.ac360_school_parenttrust_snapshots enable row level security;
alter table public.ac360_school_parenttrust_alerts enable row level security;

commit;
