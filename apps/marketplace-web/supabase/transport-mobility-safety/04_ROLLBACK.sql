-- SANILA MOBILITY & SAFETY COMMAND OS
-- 04_ROLLBACK.sql
-- Removes only package-owned RPCs. It does not touch Transport data or existing AC360 functions.

BEGIN;
DROP FUNCTION IF EXISTS public.angelcare360_transport_close_run_v1(uuid,uuid,text,text,uuid,jsonb);
DROP FUNCTION IF EXISTS public.angelcare360_transport_record_run_event_v1(uuid,uuid,uuid,uuid,text,timestamptz,text,text,uuid,jsonb);
DROP FUNCTION IF EXISTS public.angelcare360_transport_open_run_v1(uuid,uuid,uuid,uuid,date,text,timestamptz,uuid,jsonb);
DROP FUNCTION IF EXISTS public.angelcare360_transport_record_safety_check_v1(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,text,uuid,jsonb);
DROP FUNCTION IF EXISTS public.angelcare360_transport_assign_student_v1(uuid,uuid,uuid,uuid,text,numeric,date,date,text,uuid,jsonb);
DROP FUNCTION IF EXISTS public.angelcare360_transport_integrity_status_v1(uuid);
COMMIT;
