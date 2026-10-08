-- SANILA MOBILITY & SAFETY COMMAND OS
-- 02_MIGRATION.sql
-- Adds guarded service-role-only RPCs. No tables, no RLS policy rewrite, no data rewrite.

BEGIN;

CREATE OR REPLACE FUNCTION public.angelcare360_transport_integrity_status_v1(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_stop_route integer := 0; v_assignment_org integer := 0; v_route_refs integer := 0;
  v_run_refs integer := 0; v_event_refs integer := 0; v_safety_refs integer := 0; v_over integer := 0;
BEGIN
  SELECT count(*) INTO v_stop_route
  FROM public.ac360_school_transport_student_assignments a
  JOIN public.ac360_school_transport_route_stops s ON s.id=a.stop_id
  WHERE a.org_id=p_org_id AND a.stop_id IS NOT NULL AND (s.org_id<>a.org_id OR s.route_id<>a.route_id);

  SELECT count(*) INTO v_assignment_org
  FROM public.ac360_school_transport_student_assignments a
  JOIN public.ac360_school_students st ON st.id=a.student_id
  JOIN public.ac360_school_transport_routes r ON r.id=a.route_id
  WHERE a.org_id=p_org_id AND (st.org_id<>a.org_id OR r.org_id<>a.org_id);

  SELECT count(*) INTO v_route_refs
  FROM public.ac360_school_transport_routes r
  LEFT JOIN public.ac360_school_transport_vehicles v ON v.id=r.default_vehicle_id
  LEFT JOIN public.ac360_school_transport_drivers d ON d.id=r.default_driver_id
  WHERE r.org_id=p_org_id AND (
    (r.default_vehicle_id IS NOT NULL AND (v.id IS NULL OR v.org_id<>r.org_id)) OR
    (r.default_driver_id IS NOT NULL AND (d.id IS NULL OR d.org_id<>r.org_id))
  );

  SELECT count(*) INTO v_run_refs
  FROM public.ac360_school_transport_route_runs rr
  LEFT JOIN public.ac360_school_transport_routes r ON r.id=rr.route_id
  LEFT JOIN public.ac360_school_transport_vehicles v ON v.id=rr.vehicle_id
  LEFT JOIN public.ac360_school_transport_drivers d ON d.id=rr.driver_id
  WHERE rr.org_id=p_org_id AND (
    r.id IS NULL OR r.org_id<>rr.org_id OR
    (rr.vehicle_id IS NOT NULL AND (v.id IS NULL OR v.org_id<>rr.org_id)) OR
    (rr.driver_id IS NOT NULL AND (d.id IS NULL OR d.org_id<>rr.org_id))
  );

  SELECT count(*) INTO v_event_refs
  FROM public.ac360_school_transport_run_events e
  LEFT JOIN public.ac360_school_transport_route_runs rr ON rr.id=e.route_run_id
  LEFT JOIN public.ac360_school_students st ON st.id=e.student_id
  LEFT JOIN public.ac360_school_transport_route_stops s ON s.id=e.stop_id
  WHERE e.org_id=p_org_id AND (
    rr.id IS NULL OR rr.org_id<>e.org_id OR
    (e.student_id IS NOT NULL AND (st.id IS NULL OR st.org_id<>e.org_id)) OR
    (e.stop_id IS NOT NULL AND (s.id IS NULL OR s.org_id<>e.org_id OR s.route_id<>rr.route_id))
  );

  SELECT count(*) INTO v_safety_refs
  FROM public.ac360_school_transport_safety_checks c
  LEFT JOIN public.ac360_school_transport_vehicles v ON v.id=c.vehicle_id
  LEFT JOIN public.ac360_school_transport_drivers d ON d.id=c.driver_id
  LEFT JOIN public.ac360_school_transport_route_runs rr ON rr.id=c.route_run_id
  WHERE c.org_id=p_org_id AND (
    (c.vehicle_id IS NOT NULL AND (v.id IS NULL OR v.org_id<>c.org_id)) OR
    (c.driver_id IS NOT NULL AND (d.id IS NULL OR d.org_id<>c.org_id)) OR
    (c.route_run_id IS NOT NULL AND (rr.id IS NULL OR rr.org_id<>c.org_id))
  );

  SELECT count(*) INTO v_over FROM (
    SELECT r.id FROM public.ac360_school_transport_routes r
    JOIN public.ac360_school_transport_vehicles v ON v.id=r.default_vehicle_id AND v.org_id=r.org_id
    LEFT JOIN public.ac360_school_transport_student_assignments a ON a.route_id=r.id AND a.org_id=r.org_id AND a.status='active'
    WHERE r.org_id=p_org_id AND r.status='active' AND v.capacity>0
    GROUP BY r.id,v.capacity HAVING count(a.id)>v.capacity
  ) x;

  RETURN jsonb_build_object(
    'installed',true,
    'safeForOperations',(v_stop_route+v_assignment_org+v_route_refs+v_run_refs+v_event_refs+v_safety_refs)=0,
    'assignmentStopRouteMismatch',v_stop_route,
    'assignmentCrossOrg',v_assignment_org,
    'routeReferenceCrossOrg',v_route_refs,
    'runReferenceCrossOrg',v_run_refs,
    'runEventReferenceCrossOrg',v_event_refs,
    'safetyReferenceCrossOrg',v_safety_refs,
    'overCapacityRoutes',v_over,
    'message',case when (v_stop_route+v_assignment_org+v_route_refs+v_run_refs+v_event_refs+v_safety_refs)=0 then 'Transport reference integrity accepted.' else 'Transport reference integrity requires reconciliation.' end
  );
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_transport_assign_student_v1(
  p_org_id uuid,p_student_id uuid,p_route_id uuid,p_stop_id uuid DEFAULT NULL,p_service_direction text DEFAULT 'round_trip',
  p_monthly_fee_mad numeric DEFAULT 0,p_starts_on date DEFAULT CURRENT_DATE,p_ends_on date DEFAULT NULL,p_status text DEFAULT 'active',
  p_actor_app_user_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_route record; v_stop record; v_student record; v_result jsonb;
BEGIN
  SELECT * INTO v_route FROM public.ac360_school_transport_routes WHERE id=p_route_id AND org_id=p_org_id FOR SHARE;
  IF v_route.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Route not found in organization.'); END IF;
  SELECT * INTO v_student FROM public.ac360_school_students WHERE id=p_student_id AND org_id=p_org_id FOR SHARE;
  IF v_student.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Student not found in organization.'); END IF;
  IF p_stop_id IS NOT NULL THEN
    SELECT * INTO v_stop FROM public.ac360_school_transport_route_stops WHERE id=p_stop_id AND org_id=p_org_id AND route_id=p_route_id FOR SHARE;
    IF v_stop.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Selected stop does not belong to selected route.'); END IF;
  END IF;
  IF p_ends_on IS NOT NULL AND p_ends_on<p_starts_on THEN RETURN jsonb_build_object('ok',false,'error','Assignment end date cannot precede start date.'); END IF;
  SELECT public.ac360_school_assign_transport_student(p_org_id,p_student_id,p_route_id,p_stop_id,p_service_direction,p_monthly_fee_mad,p_starts_on,p_ends_on,p_status,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) INTO v_result;
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_transport_record_safety_check_v1(
  p_org_id uuid,p_vehicle_id uuid DEFAULT NULL,p_driver_id uuid DEFAULT NULL,p_route_run_id uuid DEFAULT NULL,
  p_check_type text DEFAULT 'pre_route',p_result text DEFAULT 'passed',p_checked_at timestamptz DEFAULT now(),
  p_checked_by_staff_id uuid DEFAULT NULL,p_notes text DEFAULT NULL,p_actor_app_user_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_run record; v_result jsonb;
BEGIN
  IF p_vehicle_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ac360_school_transport_vehicles WHERE id=p_vehicle_id AND org_id=p_org_id) THEN RETURN jsonb_build_object('ok',false,'error','Vehicle does not belong to organization.'); END IF;
  IF p_driver_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ac360_school_transport_drivers WHERE id=p_driver_id AND org_id=p_org_id) THEN RETURN jsonb_build_object('ok',false,'error','Driver does not belong to organization.'); END IF;
  IF p_route_run_id IS NOT NULL THEN
    SELECT * INTO v_run FROM public.ac360_school_transport_route_runs WHERE id=p_route_run_id AND org_id=p_org_id;
    IF v_run.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Route run does not belong to organization.'); END IF;
    IF p_vehicle_id IS NOT NULL AND v_run.vehicle_id IS NOT NULL AND p_vehicle_id<>v_run.vehicle_id THEN RETURN jsonb_build_object('ok',false,'error','Safety vehicle differs from route-run vehicle.'); END IF;
    IF p_driver_id IS NOT NULL AND v_run.driver_id IS NOT NULL AND p_driver_id<>v_run.driver_id THEN RETURN jsonb_build_object('ok',false,'error','Safety driver differs from route-run driver.'); END IF;
  END IF;
  SELECT public.ac360_school_record_transport_safety_check(p_org_id,p_vehicle_id,p_driver_id,p_route_run_id,p_check_type,p_result,p_checked_at,p_checked_by_staff_id,p_notes,coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('actorAppUserId',p_actor_app_user_id)) INTO v_result;
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_transport_open_run_v1(
  p_org_id uuid,p_route_id uuid,p_vehicle_id uuid DEFAULT NULL,p_driver_id uuid DEFAULT NULL,p_run_date date DEFAULT CURRENT_DATE,
  p_run_type text DEFAULT 'pickup',p_planned_start_at timestamptz DEFAULT NULL,p_actor_app_user_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_route record; v_vehicle record; v_driver record; v_vehicle_id uuid; v_driver_id uuid; v_count integer; v_latest text; v_existing uuid; v_result jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_org_id::text || ':' || p_route_id::text || ':' || coalesce(p_run_date,current_date)::text || ':' || coalesce(p_run_type,'pickup'),0));
  SELECT * INTO v_route FROM public.ac360_school_transport_routes WHERE id=p_route_id AND org_id=p_org_id FOR SHARE;
  IF v_route.id IS NULL OR v_route.status<>'active' THEN RETURN jsonb_build_object('ok',false,'error','Active route required.'); END IF;
  v_vehicle_id:=coalesce(p_vehicle_id,v_route.default_vehicle_id); v_driver_id:=coalesce(p_driver_id,v_route.default_driver_id);
  IF v_vehicle_id IS NULL OR v_driver_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Vehicle and driver are required before departure.'); END IF;

  SELECT * INTO v_vehicle FROM public.ac360_school_transport_vehicles WHERE id=v_vehicle_id AND org_id=p_org_id FOR SHARE;
  IF v_vehicle.id IS NULL OR v_vehicle.status<>'active' THEN RETURN jsonb_build_object('ok',false,'error','Active vehicle required.'); END IF;
  SELECT * INTO v_driver FROM public.ac360_school_transport_drivers WHERE id=v_driver_id AND org_id=p_org_id FOR SHARE;
  IF v_driver.id IS NULL OR v_driver.status<>'active' THEN RETURN jsonb_build_object('ok',false,'error','Active driver required.'); END IF;

  IF v_vehicle.insurance_expiry IS NOT NULL AND v_vehicle.insurance_expiry<coalesce(p_run_date,current_date) THEN RETURN jsonb_build_object('ok',false,'error','Vehicle insurance is expired for run date.'); END IF;
  IF v_vehicle.inspection_expiry IS NOT NULL AND v_vehicle.inspection_expiry<coalesce(p_run_date,current_date) THEN RETURN jsonb_build_object('ok',false,'error','Vehicle inspection is expired for run date.'); END IF;
  IF v_driver.license_expiry IS NOT NULL AND v_driver.license_expiry<coalesce(p_run_date,current_date) THEN RETURN jsonb_build_object('ok',false,'error','Driver license is expired for run date.'); END IF;

  SELECT count(*) INTO v_count FROM public.ac360_school_transport_student_assignments
  WHERE org_id=p_org_id AND route_id=p_route_id AND status='active'
    AND starts_on<=coalesce(p_run_date,current_date) AND (ends_on IS NULL OR ends_on>=coalesce(p_run_date,current_date))
    AND (service_direction=p_run_type OR service_direction='round_trip' OR p_run_type IN ('event','emergency'));
  IF v_vehicle.capacity>0 AND v_count>v_vehicle.capacity THEN RETURN jsonb_build_object('ok',false,'error','Active student assignments exceed vehicle capacity.','assignedStudents',v_count,'vehicleCapacity',v_vehicle.capacity); END IF;
  IF v_vehicle.seatbelt_count>0 AND v_count>v_vehicle.seatbelt_count THEN RETURN jsonb_build_object('ok',false,'error','Active student assignments exceed recorded seatbelt count.','assignedStudents',v_count,'seatbeltCount',v_vehicle.seatbelt_count); END IF;

  SELECT result INTO v_latest FROM public.ac360_school_transport_safety_checks
  WHERE org_id=p_org_id AND vehicle_id=v_vehicle_id AND driver_id=v_driver_id AND check_type='pre_route'
    AND checked_at::date=coalesce(p_run_date,current_date)
  ORDER BY checked_at DESC LIMIT 1;
  IF v_latest IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Pre-route safety check required before opening a run.'); END IF;
  IF v_latest IN ('failed','blocked') THEN RETURN jsonb_build_object('ok',false,'error','Latest pre-route safety check blocks departure.','safetyResult',v_latest); END IF;

  SELECT id INTO v_existing FROM public.ac360_school_transport_route_runs
  WHERE org_id=p_org_id AND route_id=p_route_id AND run_date=coalesce(p_run_date,current_date) AND run_type=p_run_type
    AND status IN ('planned','started','in_progress','incident')
  ORDER BY created_at DESC LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('ok',true,'routeRunId',v_existing,'status','existing','idempotent',true); END IF;

  SELECT public.ac360_school_open_transport_route_run(p_org_id,p_route_id,v_vehicle_id,v_driver_id,p_run_date,p_run_type,p_planned_start_at,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) INTO v_result;
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_transport_record_run_event_v1(
  p_org_id uuid,p_route_run_id uuid,p_student_id uuid DEFAULT NULL,p_stop_id uuid DEFAULT NULL,p_event_type text DEFAULT 'run_note',
  p_occurred_at timestamptz DEFAULT now(),p_status text DEFAULT 'recorded',p_notes text DEFAULT NULL,p_actor_app_user_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_run record; v_assignment record; v_result jsonb;
BEGIN
  SELECT * INTO v_run FROM public.ac360_school_transport_route_runs WHERE id=p_route_run_id AND org_id=p_org_id FOR SHARE;
  IF v_run.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Route run not found in organization.'); END IF;
  IF v_run.status IN ('completed','cancelled','archived') THEN RETURN jsonb_build_object('ok',false,'error','Route run is already closed.'); END IF;

  IF p_stop_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ac360_school_transport_route_stops WHERE id=p_stop_id AND org_id=p_org_id AND route_id=v_run.route_id) THEN
    RETURN jsonb_build_object('ok',false,'error','Stop does not belong to route run.');
  END IF;

  IF p_student_id IS NOT NULL THEN
    SELECT * INTO v_assignment FROM public.ac360_school_transport_student_assignments
    WHERE org_id=p_org_id AND student_id=p_student_id AND route_id=v_run.route_id AND status='active'
      AND starts_on<=v_run.run_date AND (ends_on IS NULL OR ends_on>=v_run.run_date)
      AND (service_direction=v_run.run_type OR service_direction='round_trip' OR v_run.run_type IN ('event','emergency'))
    ORDER BY created_at DESC LIMIT 1;
    IF v_assignment.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Student is not actively assigned to this route/run direction.'); END IF;
    IF p_stop_id IS NOT NULL AND v_assignment.stop_id IS NOT NULL AND p_event_type IN ('student_boarded','student_dropped') AND v_assignment.stop_id<>p_stop_id THEN
      RETURN jsonb_build_object('ok',false,'error','Student event stop differs from active transport assignment.');
    END IF;
  END IF;

  SELECT public.ac360_school_record_transport_run_event(p_org_id,p_route_run_id,p_student_id,p_stop_id,p_event_type,p_occurred_at,p_status,p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) INTO v_result;
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_transport_close_run_v1(
  p_org_id uuid,p_route_run_id uuid,p_status text DEFAULT 'completed',p_notes text DEFAULT NULL,p_actor_app_user_id uuid DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_run record; v_result jsonb;
BEGIN
  SELECT * INTO v_run FROM public.ac360_school_transport_route_runs WHERE id=p_route_run_id AND org_id=p_org_id FOR UPDATE;
  IF v_run.id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Route run not found in organization.'); END IF;
  IF v_run.status IN ('completed','cancelled','archived') THEN RETURN jsonb_build_object('ok',true,'routeRunId',v_run.id,'status',v_run.status,'idempotent',true); END IF;
  IF p_status NOT IN ('completed','cancelled','incident') THEN RETURN jsonb_build_object('ok',false,'error','Unsupported route-run closing state.'); END IF;
  SELECT public.ac360_school_close_transport_route_run(p_org_id,p_route_run_id,p_status,p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) INTO v_result;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.angelcare360_transport_integrity_status_v1(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_transport_assign_student_v1(uuid,uuid,uuid,uuid,text,numeric,date,date,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_transport_record_safety_check_v1(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_transport_open_run_v1(uuid,uuid,uuid,uuid,date,text,timestamptz,uuid,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_transport_record_run_event_v1(uuid,uuid,uuid,uuid,text,timestamptz,text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_transport_close_run_v1(uuid,uuid,text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.angelcare360_transport_integrity_status_v1(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_transport_assign_student_v1(uuid,uuid,uuid,uuid,text,numeric,date,date,text,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_transport_record_safety_check_v1(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,text,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_transport_open_run_v1(uuid,uuid,uuid,uuid,date,text,timestamptz,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_transport_record_run_event_v1(uuid,uuid,uuid,uuid,text,timestamptz,text,text,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_transport_close_run_v1(uuid,uuid,text,text,uuid,jsonb) TO service_role;

COMMIT;
