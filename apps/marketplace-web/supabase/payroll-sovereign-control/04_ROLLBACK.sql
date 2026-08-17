-- SANILA PAYROLL SOVEREIGN CONTROL OS — CONTROLLED SQL ROLLBACK
BEGIN;
DROP FUNCTION IF EXISTS public.angelcare360_payroll_reconcile_batch_v1(uuid,uuid,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_transition_payment_item_v1(uuid,uuid,text,text,text,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_create_payment_batch_v1(uuid,uuid,text,text,date,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_transition_run_v1(uuid,uuid,text,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_transition_advance_v1(uuid,uuid,text,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_create_advance_v1(uuid,uuid,text,bigint,bigint,integer,uuid,text,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_approve_input_v1(uuid,uuid,text,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_submit_input_v1(uuid,uuid,uuid,text,text,bigint,numeric,text,jsonb,text,uuid);
DROP FUNCTION IF EXISTS public.angelcare360_payroll_integrity_status_v1(uuid);
COMMIT;
