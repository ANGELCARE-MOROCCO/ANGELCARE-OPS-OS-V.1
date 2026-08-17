-- SANILA PAYROLL SOVEREIGN CONTROL OS — PREFLIGHT
-- READ ONLY. NO DDL. NO DATA MUTATION.
DO $$
DECLARE
  v_missing text[] := ARRAY[]::text[];
  v_critical integer := 0;
  v_detail jsonb;
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'angelcare360_payroll_periods','angelcare360_payroll_run_executions','angelcare360_payroll_employee_results',
    'angelcare360_payroll_input_revisions','angelcare360_payroll_advances_sovereign','angelcare360_payroll_payment_batches',
    'angelcare360_payroll_payment_items','angelcare360_payroll_reconciliation_sessions','angelcare360_staff'
  ] LOOP
    IF to_regclass('public.'||t) IS NULL THEN v_missing:=array_append(v_missing,t); END IF;
  END LOOP;
  IF array_length(v_missing,1) IS NOT NULL THEN RAISE EXCEPTION 'STOP: missing payroll authorities: %',v_missing; END IF;

  SELECT jsonb_build_object(
   'run_period_mismatch',(SELECT count(*) FROM public.angelcare360_payroll_run_executions r JOIN public.angelcare360_payroll_periods p ON p.id=r.payroll_period_id WHERE r.school_id<>p.school_id),
   'result_reference_mismatch',(SELECT count(*) FROM public.angelcare360_payroll_employee_results x JOIN public.angelcare360_payroll_run_executions r ON r.id=x.payroll_run_id JOIN public.angelcare360_payroll_periods p ON p.id=x.payroll_period_id JOIN public.angelcare360_staff s ON s.id=x.staff_id WHERE x.school_id<>r.school_id OR x.school_id<>p.school_id OR x.school_id<>s.school_id OR x.payroll_period_id<>r.payroll_period_id),
   'input_reference_mismatch',(SELECT count(*) FROM public.angelcare360_payroll_input_revisions i JOIN public.angelcare360_payroll_periods p ON p.id=i.payroll_period_id JOIN public.angelcare360_staff s ON s.id=i.staff_id WHERE i.school_id<>p.school_id OR i.school_id<>s.school_id),
   'payment_reference_mismatch',(SELECT count(*) FROM public.angelcare360_payroll_payment_items i JOIN public.angelcare360_payroll_payment_batches b ON b.id=i.payment_batch_id JOIN public.angelcare360_payroll_employee_results r ON r.id=i.payroll_employee_result_id JOIN public.angelcare360_staff s ON s.id=i.staff_id WHERE i.school_id<>b.school_id OR i.school_id<>r.school_id OR i.school_id<>s.school_id OR r.payroll_run_id<>b.payroll_run_id OR r.staff_id<>i.staff_id),
   'reconciliation_mismatch',(SELECT count(*) FROM public.angelcare360_payroll_reconciliation_sessions q JOIN public.angelcare360_payroll_payment_batches b ON b.id=q.payment_batch_id WHERE q.school_id<>b.school_id OR q.expected_minor<>b.total_minor),
   'finalization_mismatch',((SELECT count(*) FROM public.angelcare360_payroll_run_executions WHERE status='finalized' AND finalized_at IS NULL)+(SELECT count(*) FROM public.angelcare360_payroll_periods WHERE status='finalized' AND finalized_at IS NULL))
  ) INTO v_detail;
  v_critical := (v_detail->>'run_period_mismatch')::int+(v_detail->>'result_reference_mismatch')::int+(v_detail->>'input_reference_mismatch')::int+(v_detail->>'payment_reference_mismatch')::int+(v_detail->>'reconciliation_mismatch')::int+(v_detail->>'finalization_mismatch')::int;
  RAISE NOTICE 'SANILA Payroll preflight: %',v_detail;
  IF v_critical<>0 THEN RAISE EXCEPTION 'STOP: Payroll production truth has % critical mismatch(es). Reconcile before migration. Detail=%',v_critical,v_detail; END IF;
END $$;

SELECT 'PASS — SANILA PAYROLL PREFLIGHT' AS result;
