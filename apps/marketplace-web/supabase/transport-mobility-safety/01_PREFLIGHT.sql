-- SANILA MOBILITY & SAFETY COMMAND OS
-- 01_PREFLIGHT.sql
-- READ-ONLY. No mutation / DDL.

DO $$
DECLARE
  missing text[] := ARRAY[]::text[];
  assignment_stop_route_mismatch integer := 0;
  assignment_cross_org integer := 0;
  route_reference_cross_org integer := 0;
  run_reference_cross_org integer := 0;
  run_event_reference_cross_org integer := 0;
  safety_reference_cross_org integer := 0;
  over_capacity_routes integer := 0;
BEGIN
  IF to_regclass('public.ac360_school_transport_routes') IS NULL THEN missing := array_append(missing,'ac360_school_transport_routes'); END IF;
  IF to_regclass('public.ac360_school_transport_route_stops') IS NULL THEN missing := array_append(missing,'ac360_school_transport_route_stops'); END IF;
  IF to_regclass('public.ac360_school_transport_vehicles') IS NULL THEN missing := array_append(missing,'ac360_school_transport_vehicles'); END IF;
  IF to_regclass('public.ac360_school_transport_drivers') IS NULL THEN missing := array_append(missing,'ac360_school_transport_drivers'); END IF;
  IF to_regclass('public.ac360_school_transport_student_assignments') IS NULL THEN missing := array_append(missing,'ac360_school_transport_student_assignments'); END IF;
  IF to_regclass('public.ac360_school_transport_route_runs') IS NULL THEN missing := array_append(missing,'ac360_school_transport_route_runs'); END IF;
  IF to_regclass('public.ac360_school_transport_run_events') IS NULL THEN missing := array_append(missing,'ac360_school_transport_run_events'); END IF;
  IF to_regclass('public.ac360_school_transport_safety_checks') IS NULL THEN missing := array_append(missing,'ac360_school_transport_safety_checks'); END IF;
  IF to_regclass('public.ac360_school_transport_alerts') IS NULL THEN missing := array_append(missing,'ac360_school_transport_alerts'); END IF;
  IF to_regclass('public.ac360_school_students') IS NULL THEN missing := array_append(missing,'ac360_school_students'); END IF;

  IF to_regprocedure('public.ac360_school_assign_transport_student(uuid,uuid,uuid,uuid,text,numeric,date,date,text,uuid,jsonb)') IS NULL THEN missing := array_append(missing,'ac360_school_assign_transport_student'); END IF;
  IF to_regprocedure('public.ac360_school_open_transport_route_run(uuid,uuid,uuid,uuid,date,text,timestamptz,uuid,jsonb)') IS NULL THEN missing := array_append(missing,'ac360_school_open_transport_route_run'); END IF;
  IF to_regprocedure('public.ac360_school_close_transport_route_run(uuid,uuid,text,text,uuid,jsonb)') IS NULL THEN missing := array_append(missing,'ac360_school_close_transport_route_run'); END IF;
  IF to_regprocedure('public.ac360_school_record_transport_run_event(uuid,uuid,uuid,uuid,text,timestamptz,text,text,uuid,jsonb)') IS NULL THEN missing := array_append(missing,'ac360_school_record_transport_run_event'); END IF;
  IF to_regprocedure('public.ac360_school_record_transport_safety_check(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,text,jsonb)') IS NULL THEN missing := array_append(missing,'ac360_school_record_transport_safety_check'); END IF;

  IF cardinality(missing) > 0 THEN
    RAISE EXCEPTION 'PRE-FLIGHT FAILED: required production Transport authorities missing: %', array_to_string(missing, ', ');
  END IF;

  SELECT count(*) INTO assignment_stop_route_mismatch
  FROM public.ac360_school_transport_student_assignments a
  JOIN public.ac360_school_transport_route_stops s ON s.id=a.stop_id
  WHERE a.stop_id IS NOT NULL
    AND (s.org_id<>a.org_id OR s.route_id<>a.route_id);

  SELECT count(*) INTO assignment_cross_org
  FROM public.ac360_school_transport_student_assignments a
  JOIN public.ac360_school_students st ON st.id=a.student_id
  JOIN public.ac360_school_transport_routes r ON r.id=a.route_id
  WHERE st.org_id<>a.org_id OR r.org_id<>a.org_id;

  SELECT count(*) INTO route_reference_cross_org
  FROM public.ac360_school_transport_routes r
  LEFT JOIN public.ac360_school_transport_vehicles v ON v.id=r.default_vehicle_id
  LEFT JOIN public.ac360_school_transport_drivers d ON d.id=r.default_driver_id
  WHERE (r.default_vehicle_id IS NOT NULL AND (v.id IS NULL OR v.org_id<>r.org_id))
     OR (r.default_driver_id IS NOT NULL AND (d.id IS NULL OR d.org_id<>r.org_id));

  SELECT count(*) INTO run_reference_cross_org
  FROM public.ac360_school_transport_route_runs rr
  LEFT JOIN public.ac360_school_transport_routes r ON r.id=rr.route_id
  LEFT JOIN public.ac360_school_transport_vehicles v ON v.id=rr.vehicle_id
  LEFT JOIN public.ac360_school_transport_drivers d ON d.id=rr.driver_id
  WHERE r.id IS NULL OR r.org_id<>rr.org_id
     OR (rr.vehicle_id IS NOT NULL AND (v.id IS NULL OR v.org_id<>rr.org_id))
     OR (rr.driver_id IS NOT NULL AND (d.id IS NULL OR d.org_id<>rr.org_id));

  SELECT count(*) INTO run_event_reference_cross_org
  FROM public.ac360_school_transport_run_events e
  LEFT JOIN public.ac360_school_transport_route_runs rr ON rr.id=e.route_run_id
  LEFT JOIN public.ac360_school_students st ON st.id=e.student_id
  LEFT JOIN public.ac360_school_transport_route_stops s ON s.id=e.stop_id
  WHERE rr.id IS NULL OR rr.org_id<>e.org_id
     OR (e.student_id IS NOT NULL AND (st.id IS NULL OR st.org_id<>e.org_id))
     OR (e.stop_id IS NOT NULL AND (s.id IS NULL OR s.org_id<>e.org_id OR s.route_id<>rr.route_id));

  SELECT count(*) INTO safety_reference_cross_org
  FROM public.ac360_school_transport_safety_checks c
  LEFT JOIN public.ac360_school_transport_vehicles v ON v.id=c.vehicle_id
  LEFT JOIN public.ac360_school_transport_drivers d ON d.id=c.driver_id
  LEFT JOIN public.ac360_school_transport_route_runs rr ON rr.id=c.route_run_id
  WHERE (c.vehicle_id IS NOT NULL AND (v.id IS NULL OR v.org_id<>c.org_id))
     OR (c.driver_id IS NOT NULL AND (d.id IS NULL OR d.org_id<>c.org_id))
     OR (c.route_run_id IS NOT NULL AND (rr.id IS NULL OR rr.org_id<>c.org_id));

  SELECT count(*) INTO over_capacity_routes
  FROM (
    SELECT r.id
    FROM public.ac360_school_transport_routes r
    JOIN public.ac360_school_transport_vehicles v ON v.id=r.default_vehicle_id AND v.org_id=r.org_id
    LEFT JOIN public.ac360_school_transport_student_assignments a ON a.route_id=r.id AND a.org_id=r.org_id AND a.status='active'
    WHERE r.status='active' AND v.capacity>0
    GROUP BY r.id,v.capacity
    HAVING count(a.id)>v.capacity
  ) x;

  RAISE NOTICE 'Transport pre-flight: assignment_stop_route_mismatch=%',assignment_stop_route_mismatch;
  RAISE NOTICE 'Transport pre-flight: assignment_cross_org=%',assignment_cross_org;
  RAISE NOTICE 'Transport pre-flight: route_reference_cross_org=%',route_reference_cross_org;
  RAISE NOTICE 'Transport pre-flight: run_reference_cross_org=%',run_reference_cross_org;
  RAISE NOTICE 'Transport pre-flight: run_event_reference_cross_org=%',run_event_reference_cross_org;
  RAISE NOTICE 'Transport pre-flight: safety_reference_cross_org=%',safety_reference_cross_org;
  RAISE NOTICE 'Transport pre-flight: over_capacity_routes=% (operational warning; not schema failure)',over_capacity_routes;

  IF assignment_stop_route_mismatch>0 OR assignment_cross_org>0 OR route_reference_cross_org>0
     OR run_reference_cross_org>0 OR run_event_reference_cross_org>0 OR safety_reference_cross_org>0 THEN
    RAISE EXCEPTION
      'PRE-FLIGHT FAILED: production Transport references must be reconciled before migration. stop_route=%, assignment_org=%, route_refs=%, run_refs=%, event_refs=%, safety_refs=%',
      assignment_stop_route_mismatch,assignment_cross_org,route_reference_cross_org,run_reference_cross_org,run_event_reference_cross_org,safety_reference_cross_org;
  END IF;
END $$;

SELECT
  'PASS — SANILA Mobility & Safety pre-flight accepted. No mutation executed.' AS result,
  current_database() AS database_name,
  current_setting('server_version') AS postgres_version;
