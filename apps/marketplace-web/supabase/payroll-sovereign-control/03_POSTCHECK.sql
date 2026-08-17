-- SANILA PAYROLL SOVEREIGN CONTROL OS — POSTCHECK
DO $$
DECLARE f text;v int;school record;j jsonb;
BEGIN
 FOREACH f IN ARRAY ARRAY['angelcare360_payroll_integrity_status_v1','angelcare360_payroll_submit_input_v1','angelcare360_payroll_approve_input_v1','angelcare360_payroll_create_advance_v1','angelcare360_payroll_transition_advance_v1','angelcare360_payroll_transition_run_v1','angelcare360_payroll_create_payment_batch_v1','angelcare360_payroll_transition_payment_item_v1','angelcare360_payroll_reconcile_batch_v1'] LOOP
  SELECT count(*) INTO v FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=f;IF v=0 THEN RAISE EXCEPTION 'POSTCHECK: missing function %',f;END IF;
 END LOOP;
 FOR school IN SELECT id FROM public.angelcare360_schools LOOP j:=public.angelcare360_payroll_integrity_status_v1(school.id);IF NOT coalesce((j->>'safeForOperations')::boolean,false) THEN RAISE EXCEPTION 'POSTCHECK: integrity failed school %: %',school.id,j;END IF;END LOOP;
END $$;
SELECT 'PASS — SANILA PAYROLL POSTCHECK' AS result;
