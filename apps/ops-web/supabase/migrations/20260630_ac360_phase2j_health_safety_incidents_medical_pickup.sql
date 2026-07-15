-- AngelCare 360 Phase 2J - Health, Safety, Incidents, Medical & Authorized Pickup Runtime
-- Ref: AC360-PH2J-HEALTH-SAFETY-INCIDENTS-MEDICAL-PICKUP-2026-06-30
-- Scope: backend/system-only health, safety, incident, medical and pickup runtime.
-- Strict rule: no health/safety UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2I school ops runtime.

begin;

create extension if not exists pgcrypto;

-- Compatibility safety inherited from Phase 1D/1E lineage.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Health, safety, medical, incident and authorized pickup runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_health_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  blood_type text,
  allergies text[] not null default '{}',
  medical_conditions text[] not null default '{}',
  dietary_notes text,
  emergency_notes text,
  doctor_name text,
  doctor_phone text,
  insurance_reference text,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, student_id),
  check (status in ('active','needs_review','restricted','archived'))
);

create table if not exists public.ac360_school_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  contact_name text not null,
  relationship text,
  phone text not null,
  email text,
  priority_order integer not null default 1,
  can_pickup boolean not null default false,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, student_id, contact_name, phone),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_medication_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  plan_code text not null,
  medication_name text not null,
  dosage text,
  frequency text,
  instructions text,
  starts_on date not null default current_date,
  ends_on date,
  requires_parent_authorization boolean not null default true,
  authorization_document_id uuid,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, plan_code),
  check (status in ('draft','active','paused','completed','cancelled','archived'))
);

create table if not exists public.ac360_school_medication_admin_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  medication_plan_id uuid references public.ac360_school_medication_plans(id) on delete set null,
  administered_at timestamptz not null default now(),
  administered_by_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  dosage_given text,
  status text not null default 'administered',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (status in ('scheduled','administered','missed','refused','cancelled','archived'))
);

create table if not exists public.ac360_school_authorized_pickups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  pickup_name text not null,
  relationship text,
  phone text,
  id_reference text,
  authorization_status text not null default 'authorized',
  valid_from date not null default current_date,
  valid_until date,
  photo_document_id uuid,
  notes text,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, student_id, pickup_name, phone),
  check (authorization_status in ('authorized','temporary','restricted','revoked','expired','pending_review')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_pickup_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  authorized_pickup_id uuid references public.ac360_school_authorized_pickups(id) on delete set null,
  pickup_name text,
  pickup_at timestamptz not null default now(),
  released_by_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  verification_status text not null default 'verified',
  status text not null default 'released',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (verification_status in ('verified','manual_override','failed','pending_review')),
  check (status in ('released','blocked','cancelled','archived'))
);

create table if not exists public.ac360_school_incident_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  incident_code text not null,
  incident_type text not null default 'safety',
  severity text not null default 'medium',
  occurred_at timestamptz not null default now(),
  location text,
  description text not null,
  immediate_action text,
  parent_notification_status text not null default 'pending',
  status text not null default 'open',
  reported_by_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  closed_by uuid,
  closed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, incident_code),
  check (incident_type in ('injury','illness','behavior','safety','pickup','medication','emergency','other')),
  check (severity in ('low','medium','high','critical')),
  check (parent_notification_status in ('not_required','pending','sent','acknowledged','failed')),
  check (status in ('open','under_review','parent_notified','resolved','closed','archived'))
);

create table if not exists public.ac360_school_incident_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  incident_id uuid not null references public.ac360_school_incident_reports(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  acknowledged_by_name text,
  acknowledged_at timestamptz not null default now(),
  channel text not null default 'manual',
  status text not null default 'acknowledged',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (channel in ('manual','parent_portal','whatsapp','email','sms','phone','paper')),
  check (status in ('acknowledged','disputed','cancelled','archived'))
);

create table if not exists public.ac360_school_incident_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  incident_id uuid references public.ac360_school_incident_reports(id) on delete cascade,
  event_key text not null,
  event_type text not null default 'status',
  status_from text,
  status_to text,
  severity text not null default 'info',
  message text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('info','medium','high','critical'))
);

create table if not exists public.ac360_school_safety_checklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  checklist_key text not null,
  label text not null,
  checklist_type text not null default 'daily_safety',
  frequency text not null default 'daily',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, checklist_key),
  check (checklist_type in ('daily_safety','classroom','playground','hygiene','pickup','emergency','custom')),
  check (frequency in ('daily','weekly','monthly','event','custom')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_safety_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  checklist_id uuid not null references public.ac360_school_safety_checklists(id) on delete cascade,
  item_key text not null,
  label text not null,
  required boolean not null default true,
  sort_order integer not null default 100,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(checklist_id, item_key),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_safety_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  checklist_id uuid references public.ac360_school_safety_checklists(id) on delete set null,
  checked_at timestamptz not null default now(),
  checked_by_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  status text not null default 'completed',
  score numeric not null default 100,
  findings text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (status in ('draft','completed','failed','needs_action','archived'))
);

create table if not exists public.ac360_school_health_safety_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  snapshot_date date not null default current_date,
  active_health_profiles integer not null default 0,
  active_medication_plans integer not null default 0,
  authorized_pickups integer not null default 0,
  open_incidents integer not null default 0,
  critical_incidents integer not null default 0,
  safety_checks_today integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, campus_id, snapshot_date)
);

create table if not exists public.ac360_school_health_safety_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  incident_id uuid references public.ac360_school_incident_reports(id) on delete set null,
  alert_key text not null,
  alert_type text not null,
  severity text not null default 'medium',
  title text not null,
  message text,
  status text not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','in_review','resolved','archived'))
);

-- Indexes
create index if not exists idx_ac360_health_profiles_org_student on public.ac360_school_health_profiles(org_id, student_id, status);
create index if not exists idx_ac360_emergency_contacts_student on public.ac360_school_emergency_contacts(org_id, student_id, status);
create index if not exists idx_ac360_medication_plans_student on public.ac360_school_medication_plans(org_id, student_id, status);
create index if not exists idx_ac360_med_admin_student on public.ac360_school_medication_admin_events(org_id, student_id, administered_at desc);
create index if not exists idx_ac360_authorized_pickups_student on public.ac360_school_authorized_pickups(org_id, student_id, status, authorization_status);
create index if not exists idx_ac360_pickup_events_student on public.ac360_school_pickup_events(org_id, student_id, pickup_at desc);
create index if not exists idx_ac360_incident_reports_org_status on public.ac360_school_incident_reports(org_id, status, severity, occurred_at desc);
create index if not exists idx_ac360_safety_checks_org_date on public.ac360_school_safety_checks(org_id, checked_at desc, status);
create index if not exists idx_ac360_health_safety_alerts_open on public.ac360_school_health_safety_alerts(org_id, status, severity);

-- Updated_at triggers
do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_health_profiles','ac360_school_emergency_contacts','ac360_school_medication_plans','ac360_school_authorized_pickups',
    'ac360_school_incident_reports','ac360_school_safety_checklists','ac360_school_safety_checklist_items','ac360_school_health_safety_alerts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- RLS service-role policies
do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_health_profiles','ac360_school_emergency_contacts','ac360_school_medication_plans','ac360_school_medication_admin_events',
    'ac360_school_authorized_pickups','ac360_school_pickup_events','ac360_school_incident_reports','ac360_school_incident_acknowledgements',
    'ac360_school_incident_events','ac360_school_safety_checklists','ac360_school_safety_checklist_items','ac360_school_safety_checks',
    'ac360_school_health_safety_snapshots','ac360_school_health_safety_alerts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_health_safety_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_students integer:=0; v_profiles integer:=0; v_missing integer:=0; v_med integer:=0; v_pickups integer:=0; v_open integer:=0; v_critical integer:=0; v_checks integer:=0; v_alerts integer:=0;
begin
  select count(*) into v_students from public.ac360_school_students where org_id=p_org_id and enrollment_status in ('enrolled','active') and status='active' and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_profiles from public.ac360_school_health_profiles hp join public.ac360_school_students s on s.id=hp.student_id where hp.org_id=p_org_id and hp.status in ('active','needs_review','restricted') and (p_campus_id is null or s.campus_id=p_campus_id);
  v_missing := greatest(v_students - v_profiles,0);
  select count(*) into v_med from public.ac360_school_medication_plans mp join public.ac360_school_students s on s.id=mp.student_id where mp.org_id=p_org_id and mp.status='active' and (mp.ends_on is null or mp.ends_on>=p_as_of_date) and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_pickups from public.ac360_school_authorized_pickups ap join public.ac360_school_students s on s.id=ap.student_id where ap.org_id=p_org_id and ap.status='active' and ap.authorization_status in ('authorized','temporary') and (ap.valid_until is null or ap.valid_until>=p_as_of_date) and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_open from public.ac360_school_incident_reports where org_id=p_org_id and status in ('open','under_review','parent_notified') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_critical from public.ac360_school_incident_reports where org_id=p_org_id and status in ('open','under_review','parent_notified') and severity in ('high','critical') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_checks from public.ac360_school_safety_checks where org_id=p_org_id and checked_at::date=p_as_of_date and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_alerts from public.ac360_school_health_safety_alerts where org_id=p_org_id and status in ('open','in_review') and (p_campus_id is null or campus_id=p_campus_id);
  return jsonb_build_object('ok',true,'phase','phase_2j_health_safety_incidents_medical_pickup','uiBuildAllowed',false,'asOfDate',p_as_of_date,'students',v_students,'activeHealthProfiles',v_profiles,'missingHealthProfiles',v_missing,'activeMedicationPlans',v_med,'authorizedPickups',v_pickups,'openIncidents',v_open,'criticalIncidents',v_critical,'safetyChecksToday',v_checks,'openAlerts',v_alerts);
end $$;

create or replace function public.ac360_school_upsert_health_profile(
  p_org_id uuid,
  p_student_id uuid,
  p_blood_type text default null,
  p_allergies text[] default '{}',
  p_medical_conditions text[] default '{}',
  p_dietary_notes text default null,
  p_emergency_notes text default null,
  p_doctor_name text default null,
  p_doctor_phone text default null,
  p_insurance_reference text default null,
  p_status text default 'active',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_student_id is null then return jsonb_build_object('ok',false,'error','studentId is required.'); end if;
  insert into public.ac360_school_health_profiles(org_id,student_id,blood_type,allergies,medical_conditions,dietary_notes,emergency_notes,doctor_name,doctor_phone,insurance_reference,status,created_by,metadata_json)
  values(p_org_id,p_student_id,p_blood_type,coalesce(p_allergies,'{}'),coalesce(p_medical_conditions,'{}'),p_dietary_notes,p_emergency_notes,p_doctor_name,p_doctor_phone,p_insurance_reference,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,student_id) do update set blood_type=excluded.blood_type,allergies=excluded.allergies,medical_conditions=excluded.medical_conditions,dietary_notes=excluded.dietary_notes,emergency_notes=excluded.emergency_notes,doctor_name=excluded.doctor_name,doctor_phone=excluded.doctor_phone,insurance_reference=excluded.insurance_reference,status=excluded.status,metadata_json=public.ac360_school_health_profiles.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'healthProfileId',v_id);
end $$;

create or replace function public.ac360_school_upsert_emergency_contact(
  p_org_id uuid,
  p_student_id uuid,
  p_guardian_id uuid default null,
  p_contact_name text default null,
  p_relationship text default null,
  p_phone text default null,
  p_email text default null,
  p_priority_order integer default 1,
  p_can_pickup boolean default false,
  p_status text default 'active',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_student_id is null or nullif(trim(coalesce(p_contact_name,'')),'') is null or nullif(trim(coalesce(p_phone,'')),'') is null then return jsonb_build_object('ok',false,'error','studentId, contactName and phone are required.'); end if;
  insert into public.ac360_school_emergency_contacts(org_id,student_id,guardian_id,contact_name,relationship,phone,email,priority_order,can_pickup,status,created_by,metadata_json)
  values(p_org_id,p_student_id,p_guardian_id,trim(p_contact_name),p_relationship,trim(p_phone),p_email,greatest(coalesce(p_priority_order,1),1),coalesce(p_can_pickup,false),coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,student_id,contact_name,phone) do update set guardian_id=excluded.guardian_id,relationship=excluded.relationship,email=excluded.email,priority_order=excluded.priority_order,can_pickup=excluded.can_pickup,status=excluded.status,metadata_json=public.ac360_school_emergency_contacts.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'emergencyContactId',v_id);
end $$;

create or replace function public.ac360_school_upsert_medication_plan(
  p_org_id uuid,
  p_student_id uuid,
  p_medication_plan_id uuid default null,
  p_medication_name text default null,
  p_dosage text default null,
  p_frequency text default null,
  p_instructions text default null,
  p_starts_on date default current_date,
  p_ends_on date default null,
  p_requires_parent_authorization boolean default true,
  p_status text default 'active',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := 'MED-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6);
begin
  if p_student_id is null or nullif(trim(coalesce(p_medication_name,'')),'') is null then return jsonb_build_object('ok',false,'error','studentId and medicationName are required.'); end if;
  if p_medication_plan_id is not null then
    update public.ac360_school_medication_plans set medication_name=trim(p_medication_name),dosage=p_dosage,frequency=p_frequency,instructions=p_instructions,starts_on=coalesce(p_starts_on,starts_on),ends_on=p_ends_on,requires_parent_authorization=coalesce(p_requires_parent_authorization,requires_parent_authorization),status=coalesce(p_status,status),metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_medication_plan_id and org_id=p_org_id returning id into v_id;
  end if;
  if v_id is null then
    insert into public.ac360_school_medication_plans(org_id,student_id,plan_code,medication_name,dosage,frequency,instructions,starts_on,ends_on,requires_parent_authorization,status,created_by,metadata_json)
    values(p_org_id,p_student_id,v_code,trim(p_medication_name),p_dosage,p_frequency,p_instructions,coalesce(p_starts_on,current_date),p_ends_on,coalesce(p_requires_parent_authorization,true),coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  end if;
  return jsonb_build_object('ok',true,'medicationPlanId',v_id);
end $$;

create or replace function public.ac360_school_record_medication_admin(
  p_org_id uuid,
  p_medication_plan_id uuid default null,
  p_student_id uuid default null,
  p_administered_at timestamptz default now(),
  p_administered_by_staff_id uuid default null,
  p_dosage_given text default null,
  p_status text default 'administered',
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_student uuid;
begin
  if p_medication_plan_id is not null then select student_id into v_student from public.ac360_school_medication_plans where id=p_medication_plan_id and org_id=p_org_id; end if;
  v_student := coalesce(v_student,p_student_id);
  if v_student is null then return jsonb_build_object('ok',false,'error','studentId or medicationPlanId is required.'); end if;
  insert into public.ac360_school_medication_admin_events(org_id,student_id,medication_plan_id,administered_at,administered_by_staff_id,dosage_given,status,notes,metadata_json)
  values(p_org_id,v_student,p_medication_plan_id,coalesce(p_administered_at,now()),p_administered_by_staff_id,p_dosage_given,coalesce(p_status,'administered'),p_notes,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'medicationAdminEventId',v_id);
end $$;

create or replace function public.ac360_school_upsert_authorized_pickup(
  p_org_id uuid,
  p_student_id uuid,
  p_guardian_id uuid default null,
  p_pickup_name text default null,
  p_relationship text default null,
  p_phone text default null,
  p_id_reference text default null,
  p_authorization_status text default 'authorized',
  p_valid_from date default current_date,
  p_valid_until date default null,
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_student_id is null or nullif(trim(coalesce(p_pickup_name,'')),'') is null then return jsonb_build_object('ok',false,'error','studentId and pickupName are required.'); end if;
  insert into public.ac360_school_authorized_pickups(org_id,student_id,guardian_id,pickup_name,relationship,phone,id_reference,authorization_status,valid_from,valid_until,notes,created_by,metadata_json)
  values(p_org_id,p_student_id,p_guardian_id,trim(p_pickup_name),p_relationship,p_phone,p_id_reference,coalesce(p_authorization_status,'authorized'),coalesce(p_valid_from,current_date),p_valid_until,p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,student_id,pickup_name,phone) do update set guardian_id=excluded.guardian_id,relationship=excluded.relationship,id_reference=excluded.id_reference,authorization_status=excluded.authorization_status,valid_from=excluded.valid_from,valid_until=excluded.valid_until,notes=excluded.notes,status='active',metadata_json=public.ac360_school_authorized_pickups.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'authorizedPickupId',v_id);
end $$;

create or replace function public.ac360_school_record_pickup(
  p_org_id uuid,
  p_student_id uuid,
  p_authorized_pickup_id uuid default null,
  p_pickup_name text default null,
  p_pickup_at timestamptz default now(),
  p_released_by_staff_id uuid default null,
  p_verification_status text default 'verified',
  p_status text default 'released',
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_auth public.ac360_school_authorized_pickups%rowtype;
begin
  if p_student_id is null then return jsonb_build_object('ok',false,'error','studentId is required.'); end if;
  if p_authorized_pickup_id is not null then
    select * into v_auth from public.ac360_school_authorized_pickups where id=p_authorized_pickup_id and org_id=p_org_id;
    if v_auth.id is null then return jsonb_build_object('ok',false,'error','Authorized pickup not found.'); end if;
    if v_auth.authorization_status not in ('authorized','temporary') or v_auth.status <> 'active' or (v_auth.valid_until is not null and v_auth.valid_until < current_date) then
      insert into public.ac360_school_health_safety_alerts(org_id,student_id,alert_key,alert_type,severity,title,message,metadata_json)
      values(p_org_id,p_student_id,'pickup-blocked-' || substr(gen_random_uuid()::text,1,8),'pickup_blocked','high','Pickup blocked','Attempted pickup with inactive or invalid authorization.',coalesce(p_metadata,'{}'::jsonb));
      p_verification_status := 'failed'; p_status := 'blocked';
    end if;
  end if;
  insert into public.ac360_school_pickup_events(org_id,student_id,authorized_pickup_id,pickup_name,pickup_at,released_by_staff_id,verification_status,status,notes,metadata_json)
  values(p_org_id,p_student_id,p_authorized_pickup_id,coalesce(p_pickup_name,v_auth.pickup_name),coalesce(p_pickup_at,now()),p_released_by_staff_id,coalesce(p_verification_status,'verified'),coalesce(p_status,'released'),p_notes,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'pickupEventId',v_id,'status',coalesce(p_status,'released'),'verificationStatus',coalesce(p_verification_status,'verified'));
end $$;

create or replace function public.ac360_school_report_incident(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_student_id uuid default null,
  p_class_id uuid default null,
  p_incident_type text default 'safety',
  p_severity text default 'medium',
  p_occurred_at timestamptz default now(),
  p_location text default null,
  p_description text default null,
  p_immediate_action text default null,
  p_reported_by_staff_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := 'INC-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6);
begin
  if nullif(trim(coalesce(p_description,'')),'') is null then return jsonb_build_object('ok',false,'error','description is required.'); end if;
  insert into public.ac360_school_incident_reports(org_id,campus_id,student_id,class_id,incident_code,incident_type,severity,occurred_at,location,description,immediate_action,reported_by_staff_id,metadata_json)
  values(p_org_id,p_campus_id,p_student_id,p_class_id,v_code,coalesce(p_incident_type,'safety'),coalesce(p_severity,'medium'),coalesce(p_occurred_at,now()),p_location,trim(p_description),p_immediate_action,p_reported_by_staff_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_incident_events(org_id,incident_id,event_key,event_type,status_to,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,v_id,'incident.reported','create','open',case when p_severity in ('high','critical') then p_severity else 'medium' end,'Incident reported.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  if coalesce(p_severity,'medium') in ('high','critical') then
    insert into public.ac360_school_health_safety_alerts(org_id,campus_id,student_id,incident_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,p_student_id,v_id,'incident-' || v_code,'incident_escalation',coalesce(p_severity,'high'),'High priority incident',trim(p_description),jsonb_build_object('incidentCode',v_code))
    on conflict(org_id,alert_key) do update set status='open',updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'incidentId',v_id,'incidentCode',v_code);
end $$;

create or replace function public.ac360_school_update_incident_status(
  p_org_id uuid,
  p_incident_id uuid,
  p_status text,
  p_parent_notification_status text default null,
  p_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_old text; v_new text; v_row public.ac360_school_incident_reports%rowtype;
begin
  select status into v_old from public.ac360_school_incident_reports where id=p_incident_id and org_id=p_org_id;
  update public.ac360_school_incident_reports set status=coalesce(p_status,status), parent_notification_status=coalesce(p_parent_notification_status,parent_notification_status), closed_by=case when coalesce(p_status,status) in ('closed','resolved') then p_actor_app_user_id else closed_by end, closed_at=case when coalesce(p_status,status) in ('closed','resolved') then now() else closed_at end, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_incident_id and org_id=p_org_id returning * into v_row;
  if v_row.id is null then return jsonb_build_object('ok',false,'error','Incident not found.'); end if;
  v_new := v_row.status;
  insert into public.ac360_school_incident_events(org_id,incident_id,event_key,event_type,status_from,status_to,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_incident_id,'incident.status.update','status',v_old,v_new,'info',coalesce(p_note,'Incident status updated.'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'incidentId',p_incident_id,'status',v_new);
end $$;

create or replace function public.ac360_school_acknowledge_incident(
  p_org_id uuid,
  p_incident_id uuid,
  p_guardian_id uuid default null,
  p_acknowledged_by_name text default null,
  p_channel text default 'manual',
  p_status text default 'acknowledged',
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_incident_id is null then return jsonb_build_object('ok',false,'error','incidentId is required.'); end if;
  insert into public.ac360_school_incident_acknowledgements(org_id,incident_id,guardian_id,acknowledged_by_name,channel,status,notes,metadata_json)
  values(p_org_id,p_incident_id,p_guardian_id,p_acknowledged_by_name,coalesce(p_channel,'manual'),coalesce(p_status,'acknowledged'),p_notes,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  update public.ac360_school_incident_reports set parent_notification_status='acknowledged', status=case when status='open' then 'parent_notified' else status end, updated_at=now() where id=p_incident_id and org_id=p_org_id;
  insert into public.ac360_school_incident_events(org_id,incident_id,event_key,event_type,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_incident_id,'incident.acknowledged','acknowledgement','info','Incident acknowledgement recorded.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'acknowledgementId',v_id);
end $$;

create or replace function public.ac360_school_upsert_safety_checklist(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_checklist_key text default null,
  p_label text default null,
  p_checklist_type text default 'daily_safety',
  p_frequency text default 'daily',
  p_items jsonb default '[]'::jsonb,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text := coalesce(nullif(trim(p_checklist_key),''),'safety-' || substr(gen_random_uuid()::text,1,8)); item jsonb; i int:=0;
begin
  insert into public.ac360_school_safety_checklists(org_id,campus_id,checklist_key,label,checklist_type,frequency,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),'Safety checklist'),coalesce(p_checklist_type,'daily_safety'),coalesce(p_frequency,'daily'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,checklist_key) do update set campus_id=excluded.campus_id,label=excluded.label,checklist_type=excluded.checklist_type,frequency=excluded.frequency,metadata_json=public.ac360_school_safety_checklists.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  if jsonb_typeof(coalesce(p_items,'[]'::jsonb)) = 'array' then
    for item in select * from jsonb_array_elements(p_items) loop
      i := i + 1;
      insert into public.ac360_school_safety_checklist_items(org_id,checklist_id,item_key,label,required,sort_order,metadata_json)
      values(p_org_id,v_id,coalesce(item->>'itemKey',item->>'item_key','item-'||i),coalesce(item->>'label','Checklist item '||i),coalesce((item->>'required')::boolean,true),coalesce((item->>'sortOrder')::integer,i*10),coalesce(item->'metadata','{}'::jsonb))
      on conflict(checklist_id,item_key) do update set label=excluded.label,required=excluded.required,sort_order=excluded.sort_order,metadata_json=public.ac360_school_safety_checklist_items.metadata_json || excluded.metadata_json,updated_at=now();
    end loop;
  end if;
  return jsonb_build_object('ok',true,'checklistId',v_id);
end $$;

create or replace function public.ac360_school_record_safety_check(
  p_org_id uuid,
  p_checklist_id uuid default null,
  p_campus_id uuid default null,
  p_class_id uuid default null,
  p_checked_by_staff_id uuid default null,
  p_status text default 'completed',
  p_score numeric default 100,
  p_findings text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_safety_checks(org_id,campus_id,class_id,checklist_id,checked_by_staff_id,status,score,findings,metadata_json)
  values(p_org_id,p_campus_id,p_class_id,p_checklist_id,p_checked_by_staff_id,coalesce(p_status,'completed'),least(100,greatest(coalesce(p_score,100),0)),p_findings,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  if coalesce(p_status,'completed') in ('failed','needs_action') or coalesce(p_score,100) < 70 then
    insert into public.ac360_school_health_safety_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'safety-check-' || v_id::text,'safety_check_failed','high','Safety check requires action',coalesce(p_findings,'Safety check failed or score below threshold.'),jsonb_build_object('safetyCheckId',v_id,'score',p_score));
  end if;
  return jsonb_build_object('ok',true,'safetyCheckId',v_id);
end $$;

create or replace function public.ac360_school_reconcile_health_safety(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_students integer:=0; v_profiles integer:=0; v_missing integer:=0; v_med integer:=0; v_pickups integer:=0; v_open integer:=0; v_critical integer:=0; v_checks integer:=0;
begin
  select count(*) into v_students from public.ac360_school_students where org_id=p_org_id and enrollment_status in ('enrolled','active') and status='active' and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_profiles from public.ac360_school_health_profiles hp join public.ac360_school_students s on s.id=hp.student_id where hp.org_id=p_org_id and hp.status in ('active','needs_review','restricted') and (p_campus_id is null or s.campus_id=p_campus_id);
  v_missing := greatest(v_students - v_profiles,0);
  select count(*) into v_med from public.ac360_school_medication_plans mp join public.ac360_school_students s on s.id=mp.student_id where mp.org_id=p_org_id and mp.status='active' and (mp.ends_on is null or mp.ends_on>=current_date) and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_pickups from public.ac360_school_authorized_pickups ap join public.ac360_school_students s on s.id=ap.student_id where ap.org_id=p_org_id and ap.status='active' and ap.authorization_status in ('authorized','temporary') and (ap.valid_until is null or ap.valid_until>=current_date) and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_open from public.ac360_school_incident_reports where org_id=p_org_id and status in ('open','under_review','parent_notified') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_critical from public.ac360_school_incident_reports where org_id=p_org_id and status in ('open','under_review','parent_notified') and severity in ('high','critical') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_checks from public.ac360_school_safety_checks where org_id=p_org_id and checked_at::date=current_date and (p_campus_id is null or campus_id=p_campus_id);

  insert into public.ac360_school_health_safety_snapshots(org_id,campus_id,snapshot_date,active_health_profiles,active_medication_plans,authorized_pickups,open_incidents,critical_incidents,safety_checks_today,metadata_json)
  values(p_org_id,p_campus_id,current_date,v_profiles,v_med,v_pickups,v_open,v_critical,v_checks,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,campus_id,snapshot_date) do update set active_health_profiles=excluded.active_health_profiles,active_medication_plans=excluded.active_medication_plans,authorized_pickups=excluded.authorized_pickups,open_incidents=excluded.open_incidents,critical_incidents=excluded.critical_incidents,safety_checks_today=excluded.safety_checks_today,metadata_json=public.ac360_school_health_safety_snapshots.metadata_json || excluded.metadata_json;

  if v_missing > 0 then
    insert into public.ac360_school_health_safety_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'missing-health-profiles-' || coalesce(p_campus_id::text,'all'),'missing_health_profile','high','Missing health profiles',v_missing || ' active student(s) have no health profile.',jsonb_build_object('missingHealthProfiles',v_missing))
    on conflict(org_id,alert_key) do update set status='open',severity=excluded.severity,title=excluded.title,message=excluded.message,metadata_json=public.ac360_school_health_safety_alerts.metadata_json || excluded.metadata_json,updated_at=now();
  end if;

  if v_critical > 0 then
    insert into public.ac360_school_health_safety_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'critical-incidents-' || coalesce(p_campus_id::text,'all'),'critical_incident','critical','Critical incidents open',v_critical || ' high/critical incident(s) require review.',jsonb_build_object('criticalIncidents',v_critical))
    on conflict(org_id,alert_key) do update set status='open',severity=excluded.severity,title=excluded.title,message=excluded.message,metadata_json=public.ac360_school_health_safety_alerts.metadata_json || excluded.metadata_json,updated_at=now();
  end if;

  return jsonb_build_object('ok',true,'activeHealthProfiles',v_profiles,'missingHealthProfiles',v_missing,'activeMedicationPlans',v_med,'authorizedPickups',v_pickups,'openIncidents',v_open,'criticalIncidents',v_critical,'safetyChecksToday',v_checks);
end $$;

create or replace function public.ac360_school_resolve_health_safety_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.ac360_school_health_safety_alerts set status='resolved',resolved_by=p_actor_app_user_id,resolved_at=now(),metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('resolutionNote',p_resolution_note),updated_at=now() where id=p_alert_id and org_id=p_org_id returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','Alert not found.'); end if;
  return jsonb_build_object('ok',true,'alertId',v_id,'status','resolved');
end $$;

-- -----------------------------------------------------------------------------
-- 3. Feature registry, actions, wiring and module coverage
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('health_safety','school_operations','safety','Health & Safety','Medical profiles, incidents, emergency contacts, medication, safety checks and authorized pickup controls.','access',false,true,false,null,0,'{"phase":"phase_2j","growthMenu":"health_safety"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json) values
('health_safety','Health, Safety & Authorized Pickup','safety','Medical records, incidents, medication administration, safety checklists and authorized pickup controls.','monthly',690,0,'institution','{"included":"health_safety_runtime"}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2j","recommendedFor":"premium schools and regulated childcare operations"}'::jsonb)
on conflict(addon_key) do update set label=excluded.label,family=excluded.family,description=excluded.description,billing_model=excluded.billing_model,monthly_price_mad=excluded.monthly_price_mad,setup_price_mad=excluded.setup_price_mad,included_allowance_json=excluded.included_allowance_json,cancellable=excluded.cancellable,data_preservation_policy=excluded.data_preservation_policy,status=excluded.status,metadata_json=public.ac360_addons.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.health.profile.upsert','health_safety','AC360-ENG-48','Upsert health profile','Create or update a student medical/health profile.','health_safety.profile.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.health.emergency_contact.upsert','health_safety','AC360-ENG-48','Upsert emergency contact','Create or update a student emergency contact.','health_safety.emergency_contact.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.health.medication_plan.upsert','health_safety','AC360-ENG-48','Upsert medication plan','Create or update a medication plan.','health_safety.medication_plan.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.health.medication_admin.record','health_safety','AC360-ENG-48','Record medication administration','Record one medication administration event.','health_safety.medication_admin.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.authorized_pickup.upsert','health_safety','AC360-ENG-48','Upsert authorized pickup','Create or update authorized pickup person.','health_safety.authorized_pickup.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.pickup.record','health_safety','AC360-ENG-48','Record pickup event','Record child release/pickup event.','health_safety.pickup.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.incident.report','health_safety','AC360-ENG-48','Report incident','Open a health/safety incident report.','health_safety.incident.report',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.incident.status.update','health_safety','AC360-ENG-48','Update incident status','Update incident status, parent notification or closure.','health_safety.incident.status.update',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.incident.acknowledge','health_safety','AC360-ENG-48','Record incident acknowledgement','Record parent/guardian acknowledgement for incident.','health_safety.incident.acknowledge',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.checklist.upsert','health_safety','AC360-ENG-48','Upsert safety checklist','Create or update safety checklist and items.','health_safety.checklist.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.check.record','health_safety','AC360-ENG-48','Record safety check','Record one safety checklist execution.','health_safety.check.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.reconcile','health_safety','AC360-ENG-48','Reconcile health/safety runtime','Refresh health/safety snapshots and alerts.','health_safety.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb),
('school.safety.alert.resolve','health_safety','AC360-ENG-48','Resolve safety alert','Resolve one health/safety alert.','health_safety.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2j","suggested_addon_key":"health_safety"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_health_safety.health_profile.upsert','/api/ac360/school-health-safety/health-profiles/upsert','POST','school.health.profile.upsert','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_health_profiles','strict','fixed_1','request_or_generated',null,null,'active','Upserts student health profile under AC360 health/safety guard.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.emergency_contact.upsert','/api/ac360/school-health-safety/emergency-contacts/upsert','POST','school.health.emergency_contact.upsert','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_emergency_contacts','strict','fixed_1','request_or_generated',null,null,'active','Upserts emergency contact under AC360 health/safety guard.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.medication_plan.upsert','/api/ac360/school-health-safety/medication-plans/upsert','POST','school.health.medication_plan.upsert','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_medication_plans','strict','fixed_1','request_or_generated',null,null,'active','Upserts medication plan.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.medication_admin.record','/api/ac360/school-health-safety/medication-admin/record','POST','school.health.medication_admin.record','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_medication_admin_events','strict','fixed_1','request_or_generated',null,null,'active','Records medication administration.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.authorized_pickup.upsert','/api/ac360/school-health-safety/authorized-pickups/upsert','POST','school.safety.authorized_pickup.upsert','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_authorized_pickups','strict','fixed_1','request_or_generated',null,null,'active','Upserts authorized pickup.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.pickup.record','/api/ac360/school-health-safety/pickups/record','POST','school.safety.pickup.record','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_pickup_events','strict','fixed_1','request_or_generated',null,null,'active','Records pickup/release event.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.incident.report','/api/ac360/school-health-safety/incidents/report','POST','school.safety.incident.report','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_incident_reports','strict','fixed_1','request_or_generated',null,null,'active','Reports health/safety incident.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.incident.status','/api/ac360/school-health-safety/incidents/status','POST','school.safety.incident.status.update','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_incident_reports','strict','fixed_1','request_or_generated',null,null,'active','Updates incident status.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.incident.acknowledge','/api/ac360/school-health-safety/incidents/acknowledge','POST','school.safety.incident.acknowledge','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_incident_acknowledgements','strict','fixed_1','request_or_generated',null,null,'active','Records incident acknowledgement.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.checklist.upsert','/api/ac360/school-health-safety/safety-checklists/upsert','POST','school.safety.checklist.upsert','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_safety_checklists','strict','fixed_1','request_or_generated',null,null,'active','Upserts safety checklist.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.check.record','/api/ac360/school-health-safety/safety-checks/record','POST','school.safety.check.record','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_safety_checks','strict','fixed_1','request_or_generated',null,null,'active','Records safety check.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.reconcile','/api/ac360/school-health-safety/reconcile','POST','school.safety.reconcile','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_health_safety_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles health/safety runtime.','{"phase":"phase_2j"}'::jsonb),
('ac360.school_health_safety.alert.resolve','/api/ac360/school-health-safety/alerts/resolve','POST','school.safety.alert.resolve','health_safety','AC360-ENG-48','angelcare_360_school_health_safety','ac360_school_health_safety_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves health/safety alert.','{"phase":"phase_2j"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values('health_safety_incidents_medical_pickup','AC360-ENG-48','health_safety','Health, Safety, Incidents, Medical & Authorized Pickup Runtime','phase_2j_health_safety_incidents_medical_pickup','guarded',array['ac360_school_health_profiles','ac360_school_emergency_contacts','ac360_school_medication_plans','ac360_school_medication_admin_events','ac360_school_authorized_pickups','ac360_school_pickup_events','ac360_school_incident_reports','ac360_school_incident_acknowledgements','ac360_school_safety_checklists','ac360_school_safety_checks','ac360_school_health_safety_alerts'],array['school.health.profile.upsert','school.health.emergency_contact.upsert','school.health.medication_plan.upsert','school.health.medication_admin.record','school.safety.authorized_pickup.upsert','school.safety.pickup.record','school.safety.incident.report','school.safety.incident.status.update','school.safety.incident.acknowledge','school.safety.checklist.upsert','school.safety.check.record','school.safety.reconcile','school.safety.alert.resolve'],'{"phase":"phase_2j","uiBuildAllowed":false,"archiveNotDelete":true,"growthMenu":"health_safety"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2j.health_safety.no_ui_before_backend_gate','No health/safety UI before backend gate','School Operations System','phase2j.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,200,'active','phase_2j_health_safety'),
('phase2j.health_safety.guard_every_action','Every health/safety action is guarded','School Operations System','school_health_safety.action.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,201,'active','phase_2j_health_safety'),
('phase2j.health_safety.archive_not_delete','Safety records preserve trace and avoid delete','School Operations System','school_health_safety.record.lifecycle','{"delete_strategy":"disabled"}'::jsonb,'{"archive_not_delete":true,"preserve_events":true}'::jsonb,202,'active','phase_2j_health_safety'),
('phase2j.health_safety.recommend_module','Recommend Health Safety when incidents or missing profiles appear','School Operations System','school_health_safety.risk_detected','{"missing_health_profile_threshold":1,"critical_incident_threshold":1}'::jsonb,'{"recommend_addon":"health_safety","create_growth_menu_prompt":true}'::jsonb,203,'active','phase_2j_health_safety')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

commit;
