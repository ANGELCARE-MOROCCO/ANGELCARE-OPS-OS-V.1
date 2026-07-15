
-- AngelCare 360 Phase 2K - Transport, Routes, Vehicles, Drivers & Pickup/Drop-off Runtime
-- Ref: AC360-PH2K-TRANSPORT-ROUTES-VEHICLES-DRIVERS-2026-06-30
-- Scope: backend/system-only transport runtime.
-- Strict rule: no transport UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2J school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Transport runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  vehicle_code text not null,
  label text not null,
  vehicle_type text not null default 'bus',
  plate_number text,
  capacity integer not null default 0,
  seatbelt_count integer not null default 0,
  insurance_expiry date,
  inspection_expiry date,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, vehicle_code),
  check (vehicle_type in ('bus','minibus','van','car','external_partner','other')),
  check (status in ('active','maintenance','suspended','inactive','archived'))
);

create table if not exists public.ac360_school_transport_drivers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  driver_code text not null,
  full_name text not null,
  phone text,
  license_number text,
  license_expiry date,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, driver_code),
  check (status in ('active','on_leave','suspended','inactive','archived'))
);

create table if not exists public.ac360_school_transport_routes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  route_code text not null,
  label text not null,
  direction text not null default 'round_trip',
  route_type text not null default 'regular',
  default_vehicle_id uuid references public.ac360_school_transport_vehicles(id) on delete set null,
  default_driver_id uuid references public.ac360_school_transport_drivers(id) on delete set null,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, route_code),
  check (direction in ('pickup','dropoff','round_trip')),
  check (route_type in ('regular','temporary','event','emergency','external_partner')),
  check (status in ('draft','active','paused','suspended','archived'))
);

create table if not exists public.ac360_school_transport_route_stops (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  route_id uuid not null references public.ac360_school_transport_routes(id) on delete cascade,
  stop_order integer not null default 1,
  stop_label text not null,
  zone text,
  address text,
  planned_time time,
  gps_lat numeric,
  gps_lng numeric,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, route_id, stop_order),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_transport_student_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  route_id uuid not null references public.ac360_school_transport_routes(id) on delete cascade,
  stop_id uuid references public.ac360_school_transport_route_stops(id) on delete set null,
  service_direction text not null default 'round_trip',
  monthly_fee_mad numeric not null default 0,
  starts_on date not null default current_date,
  ends_on date,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, student_id, route_id, service_direction),
  check (service_direction in ('pickup','dropoff','round_trip')),
  check (status in ('active','paused','ended','archived'))
);

create table if not exists public.ac360_school_transport_route_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  route_id uuid not null references public.ac360_school_transport_routes(id) on delete cascade,
  vehicle_id uuid references public.ac360_school_transport_vehicles(id) on delete set null,
  driver_id uuid references public.ac360_school_transport_drivers(id) on delete set null,
  run_date date not null default current_date,
  run_type text not null default 'pickup',
  planned_start_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'planned',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (run_type in ('pickup','dropoff','event','emergency')),
  check (status in ('planned','started','in_progress','completed','cancelled','incident','archived'))
);

create table if not exists public.ac360_school_transport_run_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  route_run_id uuid not null references public.ac360_school_transport_route_runs(id) on delete cascade,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  stop_id uuid references public.ac360_school_transport_route_stops(id) on delete set null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  status text not null default 'recorded',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (event_type in ('student_boarded','student_absent','student_dropped','stop_reached','delay','incident','parent_notified','run_note','other')),
  check (status in ('recorded','confirmed','cancelled','archived'))
);

create table if not exists public.ac360_school_transport_safety_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  vehicle_id uuid references public.ac360_school_transport_vehicles(id) on delete set null,
  driver_id uuid references public.ac360_school_transport_drivers(id) on delete set null,
  route_run_id uuid references public.ac360_school_transport_route_runs(id) on delete set null,
  check_type text not null default 'pre_route',
  result text not null default 'passed',
  checked_at timestamptz not null default now(),
  checked_by_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (check_type in ('pre_route','post_route','vehicle','driver','incident_followup','custom')),
  check (result in ('passed','warning','failed','blocked','archived'))
);

create table if not exists public.ac360_school_transport_billing_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  assignment_id uuid references public.ac360_school_transport_student_assignments(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  billing_month date not null,
  amount_mad numeric not null default 0,
  invoice_id uuid references public.ac360_school_tuition_invoices(id) on delete set null,
  status text not null default 'pending',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, assignment_id, billing_month),
  check (status in ('pending','invoiced','waived','cancelled','archived'))
);

create table if not exists public.ac360_school_transport_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  vehicles_active integer not null default 0,
  drivers_active integer not null default 0,
  routes_active integer not null default 0,
  assignments_active integer not null default 0,
  open_runs integer not null default 0,
  failed_safety_checks integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_school_transport_alerts (
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
  check (severity in ('info','medium','high','critical')),
  check (status in ('open','acknowledged','resolved','dismissed','archived'))
);

create index if not exists idx_ac360_transport_vehicles_org_status on public.ac360_school_transport_vehicles(org_id,status);
create index if not exists idx_ac360_transport_drivers_org_status on public.ac360_school_transport_drivers(org_id,status);
create index if not exists idx_ac360_transport_routes_org_status on public.ac360_school_transport_routes(org_id,status);
create index if not exists idx_ac360_transport_assignments_org_student on public.ac360_school_transport_student_assignments(org_id,student_id,status);
create index if not exists idx_ac360_transport_runs_org_date on public.ac360_school_transport_route_runs(org_id,run_date,status);
create index if not exists idx_ac360_transport_alerts_org_status on public.ac360_school_transport_alerts(org_id,status);

-- -----------------------------------------------------------------------------
-- 2. Transport RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_transport_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_vehicles int; v_drivers int; v_routes int; v_assignments int; v_open_runs int; v_alerts int; v_failed_checks int;
begin
  select count(*) into v_vehicles from public.ac360_school_transport_vehicles where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='active';
  select count(*) into v_drivers from public.ac360_school_transport_drivers where org_id=p_org_id and status='active';
  select count(*) into v_routes from public.ac360_school_transport_routes where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='active';
  select count(*) into v_assignments from public.ac360_school_transport_student_assignments where org_id=p_org_id and status='active';
  select count(*) into v_open_runs from public.ac360_school_transport_route_runs where org_id=p_org_id and run_date=coalesce(p_as_of_date,current_date) and status in ('planned','started','in_progress','incident');
  select count(*) into v_failed_checks from public.ac360_school_transport_safety_checks where org_id=p_org_id and checked_at::date=coalesce(p_as_of_date,current_date) and result in ('failed','blocked');
  select count(*) into v_alerts from public.ac360_school_transport_alerts where org_id=p_org_id and status in ('open','acknowledged');
  return jsonb_build_object('ok',true,'phase','phase_2k_transport_routes_vehicles_drivers','uiBuildAllowed',false,'counts',jsonb_build_object('vehiclesActive',v_vehicles,'driversActive',v_drivers,'routesActive',v_routes,'assignmentsActive',v_assignments,'openRuns',v_open_runs,'failedSafetyChecks',v_failed_checks,'openAlerts',v_alerts));
end $$;

create or replace function public.ac360_school_upsert_transport_vehicle(
  p_org_id uuid, p_campus_id uuid default null, p_vehicle_id uuid default null, p_vehicle_code text default null,
  p_label text default null, p_vehicle_type text default 'bus', p_plate_number text default null, p_capacity integer default 0,
  p_seatbelt_count integer default 0, p_insurance_expiry date default null, p_inspection_expiry date default null,
  p_status text default 'active', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := coalesce(nullif(p_vehicle_code,''),'VEH-'||upper(substr(gen_random_uuid()::text,1,8)));
begin
  insert into public.ac360_school_transport_vehicles(id,org_id,campus_id,vehicle_code,label,vehicle_type,plate_number,capacity,seatbelt_count,insurance_expiry,inspection_expiry,status,created_by,metadata_json)
  values(coalesce(p_vehicle_id,gen_random_uuid()),p_org_id,p_campus_id,v_code,coalesce(nullif(p_label,''),v_code),coalesce(p_vehicle_type,'bus'),p_plate_number,greatest(coalesce(p_capacity,0),0),greatest(coalesce(p_seatbelt_count,0),0),p_insurance_expiry,p_inspection_expiry,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,vehicle_code) do update set campus_id=excluded.campus_id,label=excluded.label,vehicle_type=excluded.vehicle_type,plate_number=excluded.plate_number,capacity=excluded.capacity,seatbelt_count=excluded.seatbelt_count,insurance_expiry=excluded.insurance_expiry,inspection_expiry=excluded.inspection_expiry,status=excluded.status,metadata_json=public.ac360_school_transport_vehicles.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'vehicleId',v_id,'vehicleCode',v_code);
end $$;

create or replace function public.ac360_school_upsert_transport_driver(
  p_org_id uuid, p_staff_id uuid default null, p_driver_id uuid default null, p_driver_code text default null,
  p_full_name text default null, p_phone text default null, p_license_number text default null, p_license_expiry date default null,
  p_status text default 'active', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := coalesce(nullif(p_driver_code,''),'DRV-'||upper(substr(gen_random_uuid()::text,1,8)));
begin
  insert into public.ac360_school_transport_drivers(id,org_id,staff_id,driver_code,full_name,phone,license_number,license_expiry,status,created_by,metadata_json)
  values(coalesce(p_driver_id,gen_random_uuid()),p_org_id,p_staff_id,v_code,coalesce(nullif(p_full_name,''),'Transport Driver'),p_phone,p_license_number,p_license_expiry,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,driver_code) do update set staff_id=excluded.staff_id,full_name=excluded.full_name,phone=excluded.phone,license_number=excluded.license_number,license_expiry=excluded.license_expiry,status=excluded.status,metadata_json=public.ac360_school_transport_drivers.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'driverId',v_id,'driverCode',v_code);
end $$;

create or replace function public.ac360_school_upsert_transport_route(
  p_org_id uuid, p_campus_id uuid default null, p_route_id uuid default null, p_route_code text default null,
  p_label text default null, p_direction text default 'round_trip', p_route_type text default 'regular', p_default_vehicle_id uuid default null,
  p_default_driver_id uuid default null, p_status text default 'active', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := coalesce(nullif(p_route_code,''),'RTE-'||upper(substr(gen_random_uuid()::text,1,8)));
begin
  insert into public.ac360_school_transport_routes(id,org_id,campus_id,route_code,label,direction,route_type,default_vehicle_id,default_driver_id,status,created_by,metadata_json)
  values(coalesce(p_route_id,gen_random_uuid()),p_org_id,p_campus_id,v_code,coalesce(nullif(p_label,''),v_code),coalesce(p_direction,'round_trip'),coalesce(p_route_type,'regular'),p_default_vehicle_id,p_default_driver_id,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,route_code) do update set campus_id=excluded.campus_id,label=excluded.label,direction=excluded.direction,route_type=excluded.route_type,default_vehicle_id=excluded.default_vehicle_id,default_driver_id=excluded.default_driver_id,status=excluded.status,metadata_json=public.ac360_school_transport_routes.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'routeId',v_id,'routeCode',v_code);
end $$;

create or replace function public.ac360_school_upsert_transport_route_stop(
  p_org_id uuid, p_route_id uuid, p_stop_id uuid default null, p_stop_order integer default 1, p_stop_label text default null,
  p_zone text default null, p_address text default null, p_planned_time time default null, p_gps_lat numeric default null, p_gps_lng numeric default null,
  p_status text default 'active', p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_transport_route_stops(id,org_id,route_id,stop_order,stop_label,zone,address,planned_time,gps_lat,gps_lng,status,metadata_json)
  values(coalesce(p_stop_id,gen_random_uuid()),p_org_id,p_route_id,greatest(coalesce(p_stop_order,1),1),coalesce(nullif(p_stop_label,''),'Stop '||greatest(coalesce(p_stop_order,1),1)),p_zone,p_address,p_planned_time,p_gps_lat,p_gps_lng,coalesce(p_status,'active'),coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,route_id,stop_order) do update set stop_label=excluded.stop_label,zone=excluded.zone,address=excluded.address,planned_time=excluded.planned_time,gps_lat=excluded.gps_lat,gps_lng=excluded.gps_lng,status=excluded.status,metadata_json=public.ac360_school_transport_route_stops.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'stopId',v_id);
end $$;

create or replace function public.ac360_school_assign_transport_student(
  p_org_id uuid, p_student_id uuid, p_route_id uuid, p_stop_id uuid default null, p_service_direction text default 'round_trip',
  p_monthly_fee_mad numeric default 0, p_starts_on date default current_date, p_ends_on date default null, p_status text default 'active',
  p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_transport_student_assignments(org_id,student_id,route_id,stop_id,service_direction,monthly_fee_mad,starts_on,ends_on,status,created_by,metadata_json)
  values(p_org_id,p_student_id,p_route_id,p_stop_id,coalesce(p_service_direction,'round_trip'),coalesce(p_monthly_fee_mad,0),coalesce(p_starts_on,current_date),p_ends_on,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,student_id,route_id,service_direction) do update set stop_id=excluded.stop_id,monthly_fee_mad=excluded.monthly_fee_mad,starts_on=excluded.starts_on,ends_on=excluded.ends_on,status=excluded.status,metadata_json=public.ac360_school_transport_student_assignments.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'assignmentId',v_id);
end $$;

create or replace function public.ac360_school_open_transport_route_run(
  p_org_id uuid, p_route_id uuid, p_vehicle_id uuid default null, p_driver_id uuid default null, p_run_date date default current_date,
  p_run_type text default 'pickup', p_planned_start_at timestamptz default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_vehicle uuid; v_driver uuid;
begin
  select default_vehicle_id, default_driver_id into v_vehicle, v_driver from public.ac360_school_transport_routes where id=p_route_id and org_id=p_org_id;
  insert into public.ac360_school_transport_route_runs(org_id,route_id,vehicle_id,driver_id,run_date,run_type,planned_start_at,started_at,status,created_by,metadata_json)
  values(p_org_id,p_route_id,coalesce(p_vehicle_id,v_vehicle),coalesce(p_driver_id,v_driver),coalesce(p_run_date,current_date),coalesce(p_run_type,'pickup'),p_planned_start_at,now(),'started',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return jsonb_build_object('ok',true,'routeRunId',v_id,'status','started');
end $$;

create or replace function public.ac360_school_record_transport_run_event(
  p_org_id uuid, p_route_run_id uuid, p_student_id uuid default null, p_stop_id uuid default null, p_event_type text default 'run_note',
  p_occurred_at timestamptz default now(), p_status text default 'recorded', p_notes text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_transport_run_events(org_id,route_run_id,student_id,stop_id,event_type,occurred_at,status,notes,created_by,metadata_json)
  values(p_org_id,p_route_run_id,p_student_id,p_stop_id,coalesce(p_event_type,'run_note'),coalesce(p_occurred_at,now()),coalesce(p_status,'recorded'),p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return jsonb_build_object('ok',true,'eventId',v_id);
end $$;

create or replace function public.ac360_school_close_transport_route_run(
  p_org_id uuid, p_route_run_id uuid, p_status text default 'completed', p_notes text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.ac360_school_transport_route_runs set status=coalesce(p_status,'completed'),ended_at=now(),notes=coalesce(p_notes,notes),metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb),updated_at=now()
  where id=p_route_run_id and org_id=p_org_id returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','Route run not found.'); end if;
  return jsonb_build_object('ok',true,'routeRunId',v_id,'status',coalesce(p_status,'completed'));
end $$;

create or replace function public.ac360_school_record_transport_safety_check(
  p_org_id uuid, p_vehicle_id uuid default null, p_driver_id uuid default null, p_route_run_id uuid default null,
  p_check_type text default 'pre_route', p_result text default 'passed', p_checked_at timestamptz default now(),
  p_checked_by_staff_id uuid default null, p_notes text default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_transport_safety_checks(org_id,vehicle_id,driver_id,route_run_id,check_type,result,checked_at,checked_by_staff_id,notes,metadata_json)
  values(p_org_id,p_vehicle_id,p_driver_id,p_route_run_id,coalesce(p_check_type,'pre_route'),coalesce(p_result,'passed'),coalesce(p_checked_at,now()),p_checked_by_staff_id,p_notes,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  if coalesce(p_result,'passed') in ('failed','blocked') then
    insert into public.ac360_school_transport_alerts(org_id,alert_key,severity,entity_type,entity_id,title,message,metadata_json)
    values(p_org_id,'transport.safety_check_failed','high','safety_check',v_id,'Transport safety check failed','A transport safety check failed or blocked a route.',jsonb_build_object('safetyCheckId',v_id));
  end if;
  return jsonb_build_object('ok',true,'safetyCheckId',v_id);
end $$;

create or replace function public.ac360_school_reconcile_transport_billing(
  p_org_id uuid, p_billing_month date default date_trunc('month', current_date)::date, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  insert into public.ac360_school_transport_billing_records(org_id,assignment_id,student_id,billing_month,amount_mad,status,metadata_json)
  select p_org_id, a.id, a.student_id, date_trunc('month',coalesce(p_billing_month,current_date))::date, coalesce(a.monthly_fee_mad,0), 'pending', coalesce(p_metadata,'{}'::jsonb)
  from public.ac360_school_transport_student_assignments a
  where a.org_id=p_org_id and a.status='active' and coalesce(a.monthly_fee_mad,0) > 0
  on conflict(org_id,assignment_id,billing_month) do update set amount_mad=excluded.amount_mad,metadata_json=public.ac360_school_transport_billing_records.metadata_json || excluded.metadata_json,updated_at=now();
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok',true,'billingMonth',date_trunc('month',coalesce(p_billing_month,current_date))::date,'recordsTouched',v_count);
end $$;

create or replace function public.ac360_school_reconcile_transport_runtime(
  p_org_id uuid, p_as_of_date date default current_date, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_vehicles int; v_drivers int; v_routes int; v_assignments int; v_open_runs int; v_failed int; v_snapshot uuid;
begin
  select count(*) into v_vehicles from public.ac360_school_transport_vehicles where org_id=p_org_id and status='active';
  select count(*) into v_drivers from public.ac360_school_transport_drivers where org_id=p_org_id and status='active';
  select count(*) into v_routes from public.ac360_school_transport_routes where org_id=p_org_id and status='active';
  select count(*) into v_assignments from public.ac360_school_transport_student_assignments where org_id=p_org_id and status='active';
  select count(*) into v_open_runs from public.ac360_school_transport_route_runs where org_id=p_org_id and run_date=coalesce(p_as_of_date,current_date) and status in ('planned','started','in_progress','incident');
  select count(*) into v_failed from public.ac360_school_transport_safety_checks where org_id=p_org_id and checked_at::date=coalesce(p_as_of_date,current_date) and result in ('failed','blocked');
  insert into public.ac360_school_transport_snapshots(org_id,snapshot_date,vehicles_active,drivers_active,routes_active,assignments_active,open_runs,failed_safety_checks,metadata_json)
  values(p_org_id,coalesce(p_as_of_date,current_date),v_vehicles,v_drivers,v_routes,v_assignments,v_open_runs,v_failed,coalesce(p_metadata,'{}'::jsonb)) returning id into v_snapshot;
  if v_routes > 0 and v_drivers = 0 then
    insert into public.ac360_school_transport_alerts(org_id,alert_key,severity,entity_type,title,message,metadata_json) values(p_org_id,'transport.no_active_driver','high','driver','No active transport driver','At least one active route exists but no active driver is registered.',jsonb_build_object('snapshotId',v_snapshot));
  end if;
  return jsonb_build_object('ok',true,'snapshotId',v_snapshot,'counts',jsonb_build_object('vehiclesActive',v_vehicles,'driversActive',v_drivers,'routesActive',v_routes,'assignmentsActive',v_assignments,'openRuns',v_open_runs,'failedSafetyChecks',v_failed));
end $$;

create or replace function public.ac360_school_resolve_transport_alert(
  p_org_id uuid, p_alert_id uuid, p_resolution_note text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.ac360_school_transport_alerts set status='resolved',resolved_by=p_actor_app_user_id,resolved_at=now(),metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('resolutionNote',p_resolution_note),updated_at=now()
  where id=p_alert_id and org_id=p_org_id returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','Transport alert not found.'); end if;
  return jsonb_build_object('ok',true,'alertId',v_id,'status','resolved');
end $$;

-- -----------------------------------------------------------------------------
-- 3. Feature registry, actions, wiring, module coverage and rules
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('transport_module','school_operations','transport','Transport Module','Routes, vehicles, drivers, student assignments, route runs, safety checks and pickup/drop-off alerts.','access',false,true,false,null,0,'{"phase":"phase_2k","growthMenu":"transport_module"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json) values
('transport_module','Transport, Routes & Pickup/Drop-off','transport','Vehicles, drivers, routes, route stops, student assignments, route runs, safety checks, parent-alert-ready events and transport billing reconciliation.','monthly',690,0,'institution','{"included":"transport_runtime","routes":"standard","vehicles":"standard"}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2k","recommendedFor":"schools with transport service or external driver operations"}'::jsonb)
on conflict(addon_key) do update set label=excluded.label,family=excluded.family,description=excluded.description,billing_model=excluded.billing_model,monthly_price_mad=excluded.monthly_price_mad,setup_price_mad=excluded.setup_price_mad,included_allowance_json=excluded.included_allowance_json,cancellable=excluded.cancellable,data_preservation_policy=excluded.data_preservation_policy,status=excluded.status,metadata_json=public.ac360_addons.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.transport.vehicle.upsert','transport_module','AC360-ENG-52','Upsert transport vehicle','Create or update school transport vehicle.','transport.vehicle.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.driver.upsert','transport_module','AC360-ENG-52','Upsert transport driver','Create or update transport driver profile.','transport.driver.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.route.upsert','transport_module','AC360-ENG-52','Upsert transport route','Create or update transport route.','transport.route.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.route_stop.upsert','transport_module','AC360-ENG-52','Upsert route stop','Create or update route stop.','transport.route_stop.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.student.assign','transport_module','AC360-ENG-52','Assign student to transport','Assign student to route/stop transport service.','transport.student.assign',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.route_run.open','transport_module','AC360-ENG-52','Open route run','Start a daily pickup/drop-off route run.','transport.route_run.open',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.route_run.event.record','transport_module','AC360-ENG-52','Record route event','Record boarding, drop-off, delay, incident or stop event.','transport.route_run.event.record','automation',1,'require_upgrade','{"access_type":"usage","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.route_run.close','transport_module','AC360-ENG-52','Close route run','Complete or cancel route run.','transport.route_run.close',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.safety_check.record','transport_module','AC360-ENG-52','Record transport safety check','Record driver/vehicle/pre-route safety check.','transport.safety_check.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.billing.reconcile','transport_module','AC360-ENG-52','Reconcile transport billing','Generate/reconcile monthly transport billing records.','transport.billing.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.reconcile','transport_module','AC360-ENG-52','Reconcile transport runtime','Refresh transport snapshots and alerts.','transport.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb),
('school.transport.alert.resolve','transport_module','AC360-ENG-52','Resolve transport alert','Resolve transport operational alert.','transport.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2k_transport","suggested_addon_key":"transport_module"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_transport.vehicle.upsert','/api/ac360/school-transport/vehicles/upsert','POST','school.transport.vehicle.upsert','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_vehicles','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Upserts transport vehicle under AC360 transport guard.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.driver.upsert','/api/ac360/school-transport/drivers/upsert','POST','school.transport.driver.upsert','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_drivers','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Upserts transport driver under AC360 transport guard.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.route.upsert','/api/ac360/school-transport/routes/upsert','POST','school.transport.route.upsert','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_routes','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Upserts transport route under AC360 transport guard.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.route_stop.upsert','/api/ac360/school-transport/route-stops/upsert','POST','school.transport.route_stop.upsert','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_route_stops','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Upserts transport route stop.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.student.assign','/api/ac360/school-transport/students/assign','POST','school.transport.student.assign','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_student_assignments','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Assigns student to transport route.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.route_run.open','/api/ac360/school-transport/route-runs/open','POST','school.transport.route_run.open','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_route_runs','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Opens transport route run.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.route_run.event','/api/ac360/school-transport/route-runs/events/record','POST','school.transport.route_run.event.record','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_run_events','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Records transport route event.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.route_run.close','/api/ac360/school-transport/route-runs/close','POST','school.transport.route_run.close','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_route_runs','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Closes transport route run.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.safety_check.record','/api/ac360/school-transport/safety-checks/record','POST','school.transport.safety_check.record','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_safety_checks','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Records transport safety check.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.billing.reconcile','/api/ac360/school-transport/billing/reconcile','POST','school.transport.billing.reconcile','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_billing_records','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Reconciles transport billing records.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.reconcile','/api/ac360/school-transport/reconcile','POST','school.transport.reconcile','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_snapshots','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Reconciles transport runtime.','{"phase":"phase_2k"}'::jsonb),
('ac360.school_transport.alert.resolve','/api/ac360/school-transport/alerts/resolve','POST','school.transport.alert.resolve','transport_module','AC360-ENG-52','angelcare_360_school_transport','ac360_school_transport_alerts','strict','fixed_1','request_or_generated',null,'transport.route_create','active','Resolves transport alert.','{"phase":"phase_2k"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values('transport_routes_vehicles_drivers','AC360-ENG-52','transport_module','Transport, Routes, Vehicles, Drivers & Pickup/Drop-off Runtime','phase_2k_transport_routes_vehicles_drivers','guarded',array['ac360_school_transport_vehicles','ac360_school_transport_drivers','ac360_school_transport_routes','ac360_school_transport_route_stops','ac360_school_transport_student_assignments','ac360_school_transport_route_runs','ac360_school_transport_run_events','ac360_school_transport_safety_checks','ac360_school_transport_billing_records','ac360_school_transport_alerts'],array['school.transport.vehicle.upsert','school.transport.driver.upsert','school.transport.route.upsert','school.transport.route_stop.upsert','school.transport.student.assign','school.transport.route_run.open','school.transport.route_run.event.record','school.transport.route_run.close','school.transport.safety_check.record','school.transport.billing.reconcile','school.transport.reconcile','school.transport.alert.resolve'],'{"phase":"phase_2k","uiBuildAllowed":false,"archiveNotDelete":true,"growthMenu":"transport_module"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2k.transport.no_ui_before_backend_gate','No transport UI before backend gate','School Operations System','phase2k.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,220,'active','phase_2k_transport'),
('phase2k.transport.guard_every_action','Every transport action is guarded','School Operations System','school_transport.action.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,221,'active','phase_2k_transport'),
('phase2k.transport.safety_failed_alert','Failed safety checks create alerts','School Operations System','school_transport.safety_check.failed','{"result":["failed","blocked"]}'::jsonb,'{"create_alert":true,"severity":"high"}'::jsonb,222,'active','phase_2k_transport'),
('phase2k.transport.billing_reconcile','Transport assignments can generate monthly billing records','School Operations System','school_transport.billing.monthly','{"active_assignments":true}'::jsonb,'{"create_billing_records":true,"finance_bridge_ready":true}'::jsonb,223,'active','phase_2k_transport')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

-- RLS lockdown: service role/runtime only until UI build is explicitly authorized.
alter table public.ac360_school_transport_vehicles enable row level security;
alter table public.ac360_school_transport_drivers enable row level security;
alter table public.ac360_school_transport_routes enable row level security;
alter table public.ac360_school_transport_route_stops enable row level security;
alter table public.ac360_school_transport_student_assignments enable row level security;
alter table public.ac360_school_transport_route_runs enable row level security;
alter table public.ac360_school_transport_run_events enable row level security;
alter table public.ac360_school_transport_safety_checks enable row level security;
alter table public.ac360_school_transport_billing_records enable row level security;
alter table public.ac360_school_transport_snapshots enable row level security;
alter table public.ac360_school_transport_alerts enable row level security;

commit;
