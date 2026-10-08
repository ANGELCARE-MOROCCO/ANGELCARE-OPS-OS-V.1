-- SANILA PAYROLL SOVEREIGN CONTROL OS — GUARDED MIGRATION
-- Adds service-role-only transactional authorities. No table creation, no RLS/policy rewrite, no data rewrite.
BEGIN;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_integrity_status_v1(p_school_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a int;b int;c int;d int;e int;f int;total int;
BEGIN
 SELECT count(*) INTO a FROM angelcare360_payroll_run_executions r JOIN angelcare360_payroll_periods p ON p.id=r.payroll_period_id WHERE r.school_id=p_school_id AND r.school_id<>p.school_id;
 SELECT count(*) INTO b FROM angelcare360_payroll_employee_results x JOIN angelcare360_payroll_run_executions r ON r.id=x.payroll_run_id JOIN angelcare360_payroll_periods p ON p.id=x.payroll_period_id JOIN angelcare360_staff s ON s.id=x.staff_id WHERE x.school_id=p_school_id AND (x.school_id<>r.school_id OR x.school_id<>p.school_id OR x.school_id<>s.school_id OR x.payroll_period_id<>r.payroll_period_id);
 SELECT count(*) INTO c FROM angelcare360_payroll_input_revisions i JOIN angelcare360_payroll_periods p ON p.id=i.payroll_period_id JOIN angelcare360_staff s ON s.id=i.staff_id WHERE i.school_id=p_school_id AND (i.school_id<>p.school_id OR i.school_id<>s.school_id);
 SELECT count(*) INTO d FROM angelcare360_payroll_payment_items i JOIN angelcare360_payroll_payment_batches q ON q.id=i.payment_batch_id JOIN angelcare360_payroll_employee_results r ON r.id=i.payroll_employee_result_id JOIN angelcare360_staff s ON s.id=i.staff_id WHERE i.school_id=p_school_id AND (i.school_id<>q.school_id OR i.school_id<>r.school_id OR i.school_id<>s.school_id OR r.payroll_run_id<>q.payroll_run_id OR r.staff_id<>i.staff_id);
 SELECT count(*) INTO e FROM angelcare360_payroll_reconciliation_sessions x JOIN angelcare360_payroll_payment_batches q ON q.id=x.payment_batch_id WHERE x.school_id=p_school_id AND (x.school_id<>q.school_id OR x.expected_minor<>q.total_minor);
 SELECT (SELECT count(*) FROM angelcare360_payroll_run_executions WHERE school_id=p_school_id AND status='finalized' AND finalized_at IS NULL)+(SELECT count(*) FROM angelcare360_payroll_periods WHERE school_id=p_school_id AND status='finalized' AND finalized_at IS NULL) INTO f;
 total:=a+b+c+d+e+f;
 RETURN jsonb_build_object('safeForOperations',total=0,'criticalCount',total,'runPeriodMismatch',a,'resultReferenceMismatch',b,'inputReferenceMismatch',c,'paymentReferenceMismatch',d,'reconciliationMismatch',e,'finalizationMismatch',f,'message',CASE WHEN total=0 THEN 'Payroll integrity ready' ELSE 'Payroll integrity blockers detected' END);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_submit_input_v1(p_school_id uuid,p_period_id uuid,p_staff_id uuid,p_component_code text,p_input_type text,p_amount_minor bigint,p_quantity numeric,p_source_type text,p_evidence jsonb,p_idempotency_key text,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;v_period text;
BEGIN
 IF coalesce(trim(p_component_code),'')='' OR coalesce(trim(p_input_type),'')='' OR coalesce(trim(p_idempotency_key),'')='' THEN RAISE EXCEPTION 'Component, input type and idempotency key are required';END IF;
 SELECT status INTO v_period FROM angelcare360_payroll_periods WHERE id=p_period_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Payroll period not found in school';END IF;
 IF v_period IN('finalized','payment_processing','paid','reconciled','closed','cancelled','archived') THEN RAISE EXCEPTION 'Payroll period does not accept new inputs';END IF;
 PERFORM 1 FROM angelcare360_staff WHERE id=p_staff_id AND school_id=p_school_id;IF NOT FOUND THEN RAISE EXCEPTION 'Staff does not belong to school';END IF;
 INSERT INTO angelcare360_payroll_input_revisions(school_id,payroll_period_id,staff_id,component_code,input_type,amount_minor,quantity,currency,source_type,evidence_json,status,idempotency_key,created_by,updated_by)
 VALUES(p_school_id,p_period_id,p_staff_id,trim(p_component_code),trim(p_input_type),p_amount_minor,coalesce(p_quantity,1),'MAD',coalesce(nullif(trim(p_source_type),''),'manual'),coalesce(p_evidence,'{}'::jsonb),'submitted',trim(p_idempotency_key),p_actor_app_user_id,p_actor_app_user_id)
 ON CONFLICT(school_id,idempotency_key) DO UPDATE SET updated_at=now() RETURNING id INTO v_id;
 RETURN jsonb_build_object('ok',true,'inputId',v_id);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_approve_input_v1(p_school_id uuid,p_input_id uuid,p_decision text,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;
BEGIN
 IF p_decision NOT IN('approved','rejected') THEN RAISE EXCEPTION 'Decision must be approved or rejected';END IF;
 SELECT status INTO v_status FROM angelcare360_payroll_input_revisions WHERE id=p_input_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Payroll input not found';END IF;
 IF v_status NOT IN('submitted','review') THEN RAISE EXCEPTION 'Payroll input cannot be decided from current state %',v_status;END IF;
 UPDATE angelcare360_payroll_input_revisions SET status=p_decision,approved_by=CASE WHEN p_decision='approved' THEN p_actor_app_user_id ELSE approved_by END,approved_at=CASE WHEN p_decision='approved' THEN now() ELSE approved_at END,updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_input_id;
 RETURN jsonb_build_object('ok',true,'inputId',p_input_id,'status',p_decision);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_create_advance_v1(p_school_id uuid,p_staff_id uuid,p_advance_code text,p_principal_minor bigint,p_installment_minor bigint,p_installment_count integer,p_recovery_start_period_id uuid DEFAULT NULL,p_reason text DEFAULT NULL,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;
BEGIN
 IF p_principal_minor<=0 OR p_installment_minor<=0 OR p_installment_count<=0 THEN RAISE EXCEPTION 'Advance values must be positive';END IF;
 PERFORM 1 FROM angelcare360_staff WHERE id=p_staff_id AND school_id=p_school_id;IF NOT FOUND THEN RAISE EXCEPTION 'Staff does not belong to school';END IF;
 IF p_recovery_start_period_id IS NOT NULL THEN PERFORM 1 FROM angelcare360_payroll_periods WHERE id=p_recovery_start_period_id AND school_id=p_school_id;IF NOT FOUND THEN RAISE EXCEPTION 'Recovery period does not belong to school';END IF;END IF;
 IF EXISTS(SELECT 1 FROM angelcare360_payroll_advances_sovereign WHERE school_id=p_school_id AND advance_code=p_advance_code AND status NOT IN('cancelled','archived')) THEN RAISE EXCEPTION 'Active advance code already exists';END IF;
 INSERT INTO angelcare360_payroll_advances_sovereign(school_id,staff_id,advance_code,principal_minor,recovered_minor,remaining_minor,installment_minor,installment_count,recovery_start_period_id,status,reason,created_by,updated_by)
 VALUES(p_school_id,p_staff_id,p_advance_code,p_principal_minor,0,p_principal_minor,p_installment_minor,p_installment_count,p_recovery_start_period_id,'requested',p_reason,p_actor_app_user_id,p_actor_app_user_id) RETURNING id INTO v_id;
 RETURN jsonb_build_object('ok',true,'advanceId',v_id);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_transition_advance_v1(p_school_id uuid,p_advance_id uuid,p_target_status text,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;
BEGIN
 SELECT status INTO v_status FROM angelcare360_payroll_advances_sovereign WHERE id=p_advance_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Advance not found';END IF;
 IF NOT((v_status='requested' AND p_target_status IN('approved','cancelled')) OR(v_status='approved' AND p_target_status IN('disbursed','cancelled')) OR(v_status='disbursed' AND p_target_status IN('recovering','settled'))) THEN RAISE EXCEPTION 'Invalid advance transition % -> %',v_status,p_target_status;END IF;
 UPDATE angelcare360_payroll_advances_sovereign SET status=p_target_status,approved_by=CASE WHEN p_target_status='approved' THEN p_actor_app_user_id ELSE approved_by END,approved_at=CASE WHEN p_target_status='approved' THEN now() ELSE approved_at END,disbursed_by=CASE WHEN p_target_status='disbursed' THEN p_actor_app_user_id ELSE disbursed_by END,disbursed_at=CASE WHEN p_target_status='disbursed' THEN now() ELSE disbursed_at END,updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_advance_id;
 RETURN jsonb_build_object('ok',true,'advanceId',p_advance_id,'status',p_target_status);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_transition_run_v1(p_school_id uuid,p_run_id uuid,p_target_status text,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;v_period uuid;v_results int;v_unapproved int;
BEGIN
 SELECT status,payroll_period_id INTO v_status,v_period FROM angelcare360_payroll_run_executions WHERE id=p_run_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Payroll run not found';END IF;
 SELECT count(*) INTO v_results FROM angelcare360_payroll_employee_results WHERE payroll_run_id=p_run_id AND school_id=p_school_id;
 IF v_results=0 THEN RAISE EXCEPTION 'Payroll run has no employee results';END IF;
 SELECT count(*) INTO v_unapproved FROM angelcare360_payroll_input_revisions WHERE payroll_period_id=v_period AND school_id=p_school_id AND status NOT IN('approved','rejected','archived');
 IF p_target_status='validated' THEN IF v_status NOT IN('calculated','review') THEN RAISE EXCEPTION 'Run must be calculated/review before validation';END IF;IF v_unapproved>0 THEN RAISE EXCEPTION 'Unresolved payroll inputs block validation: %',v_unapproved;END IF;UPDATE angelcare360_payroll_run_executions SET status='validated',validated_by=p_actor_app_user_id,validated_at=now(),updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_run_id;
 ELSIF p_target_status='approved' THEN IF v_status<>'validated' THEN RAISE EXCEPTION 'Run must be validated before approval';END IF;UPDATE angelcare360_payroll_run_executions SET status='approved',approved_by=p_actor_app_user_id,approved_at=now(),updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_run_id;
 ELSIF p_target_status='finalized' THEN IF v_status<>'approved' THEN RAISE EXCEPTION 'Run must be approved before finalization';END IF;UPDATE angelcare360_payroll_run_executions SET status='finalized',finalized_by=p_actor_app_user_id,finalized_at=now(),updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_run_id;UPDATE angelcare360_payroll_employee_results SET status='finalized',finalized_at=coalesce(finalized_at,now()),updated_by=p_actor_app_user_id,updated_at=now() WHERE payroll_run_id=p_run_id AND school_id=p_school_id;UPDATE angelcare360_payroll_periods SET status='finalized',finalized_at=now(),finalized_by=p_actor_app_user_id,updated_by=p_actor_app_user_id,updated_at=now() WHERE id=v_period AND school_id=p_school_id AND status NOT IN('paid','reconciled','closed');
 ELSE RAISE EXCEPTION 'Unsupported payroll run target status';END IF;
 RETURN jsonb_build_object('ok',true,'runId',p_run_id,'status',p_target_status);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_create_payment_batch_v1(p_school_id uuid,p_run_id uuid,p_batch_code text,p_payment_method text,p_payment_date date,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;v_batch uuid;v_total bigint;v_count int;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('sanila-payroll-batch:'||p_school_id::text||':'||p_run_id::text,0));
 SELECT status INTO v_status FROM angelcare360_payroll_run_executions WHERE id=p_run_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Payroll run not found';END IF;IF v_status<>'finalized' THEN RAISE EXCEPTION 'Payroll run must be finalized before payment batch';END IF;
 IF EXISTS(SELECT 1 FROM angelcare360_payroll_payment_batches WHERE school_id=p_school_id AND payroll_run_id=p_run_id AND status NOT IN('cancelled','archived','reconciled')) THEN RAISE EXCEPTION 'An active payment batch already exists for this run';END IF;
 SELECT coalesce(sum(net_payable_minor),0),count(*) INTO v_total,v_count FROM angelcare360_payroll_employee_results WHERE payroll_run_id=p_run_id AND school_id=p_school_id AND status='finalized';IF v_count=0 THEN RAISE EXCEPTION 'No finalized employee results';END IF;
 INSERT INTO angelcare360_payroll_payment_batches(school_id,payroll_run_id,batch_code,payment_method,currency,payment_date,total_minor,status,created_by,updated_by) VALUES(p_school_id,p_run_id,p_batch_code,coalesce(nullif(trim(p_payment_method),''),'manual'),'MAD',p_payment_date,v_total,'draft',p_actor_app_user_id,p_actor_app_user_id) RETURNING id INTO v_batch;
 INSERT INTO angelcare360_payroll_payment_items(school_id,payment_batch_id,payroll_employee_result_id,staff_id,amount_minor,status,created_by,updated_by) SELECT p_school_id,v_batch,id,staff_id,net_payable_minor,'pending',p_actor_app_user_id,p_actor_app_user_id FROM angelcare360_payroll_employee_results WHERE payroll_run_id=p_run_id AND school_id=p_school_id AND status='finalized';
 RETURN jsonb_build_object('ok',true,'batchId',v_batch,'totalMinor',v_total,'itemCount',v_count,'bankTransferExecuted',false);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_transition_payment_item_v1(p_school_id uuid,p_payment_item_id uuid,p_target_status text,p_provider_reference text DEFAULT NULL,p_failure_reason text DEFAULT NULL,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_status text;
BEGIN
 SELECT status INTO v_status FROM angelcare360_payroll_payment_items WHERE id=p_payment_item_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Payment item not found';END IF;IF v_status<>'pending' OR p_target_status NOT IN('paid','failed') THEN RAISE EXCEPTION 'Only pending payment items may transition to paid or failed';END IF;
 UPDATE angelcare360_payroll_payment_items SET status=p_target_status,provider_reference=CASE WHEN p_target_status='paid' THEN nullif(trim(p_provider_reference),'') ELSE provider_reference END,paid_at=CASE WHEN p_target_status='paid' THEN now() ELSE paid_at END,failure_reason=CASE WHEN p_target_status='failed' THEN coalesce(nullif(trim(p_failure_reason),''),'Échec confirmé') ELSE NULL END,updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_payment_item_id;
 RETURN jsonb_build_object('ok',true,'paymentItemId',p_payment_item_id,'status',p_target_status);
END $$;

CREATE OR REPLACE FUNCTION public.angelcare360_payroll_reconcile_batch_v1(p_school_id uuid,p_payment_batch_id uuid,p_actor_app_user_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_expected bigint;v_paid bigint;v_pending int;v_failed int;v_rec uuid;
BEGIN
 SELECT total_minor INTO v_expected FROM angelcare360_payroll_payment_batches WHERE id=p_payment_batch_id AND school_id=p_school_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Payment batch not found';END IF;
 SELECT coalesce(sum(amount_minor) FILTER(WHERE status='paid'),0),count(*) FILTER(WHERE status='pending'),count(*) FILTER(WHERE status='failed') INTO v_paid,v_pending,v_failed FROM angelcare360_payroll_payment_items WHERE payment_batch_id=p_payment_batch_id AND school_id=p_school_id;
 INSERT INTO angelcare360_payroll_reconciliation_sessions(school_id,payment_batch_id,status,expected_minor,paid_minor,failed_count,pending_count,resolved_by,resolved_at,created_by,updated_by) VALUES(p_school_id,p_payment_batch_id,CASE WHEN v_pending=0 AND v_failed=0 AND v_paid=v_expected THEN 'reconciled' ELSE 'exception' END,v_expected,v_paid,v_failed,v_pending,CASE WHEN v_pending=0 AND v_failed=0 AND v_paid=v_expected THEN p_actor_app_user_id ELSE NULL END,CASE WHEN v_pending=0 AND v_failed=0 AND v_paid=v_expected THEN now() ELSE NULL END,p_actor_app_user_id,p_actor_app_user_id) RETURNING id INTO v_rec;
 IF v_pending<>0 OR v_failed<>0 OR v_paid<>v_expected THEN RAISE EXCEPTION 'Batch cannot reconcile: expected %, paid %, pending %, failed %',v_expected,v_paid,v_pending,v_failed;END IF;
 UPDATE angelcare360_payroll_payment_batches SET status='reconciled',reconciled_at=now(),updated_by=p_actor_app_user_id,updated_at=now() WHERE id=p_payment_batch_id;
 UPDATE angelcare360_payroll_run_executions SET status='paid',updated_by=p_actor_app_user_id,updated_at=now() WHERE id=(SELECT payroll_run_id FROM angelcare360_payroll_payment_batches WHERE id=p_payment_batch_id);
 UPDATE angelcare360_payroll_periods SET status='reconciled',updated_by=p_actor_app_user_id,updated_at=now() WHERE id=(SELECT payroll_period_id FROM angelcare360_payroll_run_executions WHERE id=(SELECT payroll_run_id FROM angelcare360_payroll_payment_batches WHERE id=p_payment_batch_id));
 RETURN jsonb_build_object('ok',true,'reconciliationId',v_rec,'status','reconciled');
END $$;

REVOKE ALL ON FUNCTION public.angelcare360_payroll_integrity_status_v1(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_submit_input_v1(uuid,uuid,uuid,text,text,bigint,numeric,text,jsonb,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_approve_input_v1(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_create_advance_v1(uuid,uuid,text,bigint,bigint,integer,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_transition_advance_v1(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_transition_run_v1(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_create_payment_batch_v1(uuid,uuid,text,text,date,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_transition_payment_item_v1(uuid,uuid,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_payroll_reconcile_batch_v1(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_integrity_status_v1(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_submit_input_v1(uuid,uuid,uuid,text,text,bigint,numeric,text,jsonb,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_approve_input_v1(uuid,uuid,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_create_advance_v1(uuid,uuid,text,bigint,bigint,integer,uuid,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_transition_advance_v1(uuid,uuid,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_transition_run_v1(uuid,uuid,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_create_payment_batch_v1(uuid,uuid,text,text,date,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_transition_payment_item_v1(uuid,uuid,text,text,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_payroll_reconcile_batch_v1(uuid,uuid,uuid) TO service_role;
COMMIT;
