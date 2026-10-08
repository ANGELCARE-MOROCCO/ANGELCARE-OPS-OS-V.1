-- SANILA MOBILITY & SAFETY COMMAND OS
-- 03_POSTCHECK.sql

DO $$
DECLARE r record; v jsonb;
BEGIN
  IF to_regprocedure('public.angelcare360_transport_integrity_status_v1(uuid)') IS NULL THEN RAISE EXCEPTION 'POSTCHECK FAILED: integrity RPC missing'; END IF;
  IF to_regprocedure('public.angelcare360_transport_assign_student_v1(uuid,uuid,uuid,uuid,text,numeric,date,date,text,uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'POSTCHECK FAILED: assignment RPC missing'; END IF;
  IF to_regprocedure('public.angelcare360_transport_record_safety_check_v1(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,text,uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'POSTCHECK FAILED: safety RPC missing'; END IF;
  IF to_regprocedure('public.angelcare360_transport_open_run_v1(uuid,uuid,uuid,uuid,date,text,timestamptz,uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'POSTCHECK FAILED: open-run RPC missing'; END IF;
  IF to_regprocedure('public.angelcare360_transport_record_run_event_v1(uuid,uuid,uuid,uuid,text,timestamptz,text,text,uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'POSTCHECK FAILED: event RPC missing'; END IF;
  IF to_regprocedure('public.angelcare360_transport_close_run_v1(uuid,uuid,text,text,uuid,jsonb)') IS NULL THEN RAISE EXCEPTION 'POSTCHECK FAILED: close-run RPC missing'; END IF;

  FOR r IN
    SELECT DISTINCT org_id FROM (
      SELECT org_id FROM public.ac360_school_transport_routes
      UNION SELECT org_id FROM public.ac360_school_transport_student_assignments
      UNION SELECT org_id FROM public.ac360_school_transport_route_runs
    ) q
  LOOP
    SELECT public.angelcare360_transport_integrity_status_v1(r.org_id) INTO v;
    IF coalesce((v->>'safeForOperations')::boolean,false) IS NOT TRUE THEN
      RAISE EXCEPTION 'POSTCHECK FAILED: Transport integrity false for org %: %',r.org_id,v;
    END IF;
  END LOOP;
END $$;

SELECT 'PASS — SANILA Mobility & Safety postcheck accepted.' AS result;
