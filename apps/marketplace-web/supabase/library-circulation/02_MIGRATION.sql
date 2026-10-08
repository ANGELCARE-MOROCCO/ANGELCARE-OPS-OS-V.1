-- SANILA LIBRARY & CIRCULATION OS
-- SELF-HOSTED SUPABASE / POSTGRESQL ATOMIC CIRCULATION AUTHORITY
-- No new tables. No row rewrite. No RLS/policy replacement.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ac360_library_one_active_loan_per_copy
ON public.angelcare360_library_loans (school_id, copy_id)
WHERE returned_at IS NULL AND status IN ('open','active','overdue');

CREATE UNIQUE INDEX IF NOT EXISTS ux_ac360_library_copy_barcode
ON public.angelcare360_library_copies (school_id, (btrim(barcode)))
WHERE barcode IS NOT NULL AND btrim(barcode) <> '';

CREATE OR REPLACE FUNCTION public.angelcare360_library_integrity_status_v1(p_school_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  duplicate_active bigint;
  state_mismatch bigint;
  orphan_loaned bigint;
  invalid_borrowers bigint;
  duplicate_barcodes bigint;
BEGIN
  SELECT count(*) INTO duplicate_active
  FROM (
    SELECT copy_id
    FROM public.angelcare360_library_loans
    WHERE school_id = p_school_id
      AND returned_at IS NULL
      AND status IN ('open','active','overdue')
    GROUP BY copy_id
    HAVING count(*) > 1
  ) x;

  SELECT count(*) INTO state_mismatch
  FROM public.angelcare360_library_loans l
  JOIN public.angelcare360_library_copies c
    ON c.id = l.copy_id AND c.school_id = l.school_id
  WHERE l.school_id = p_school_id
    AND l.returned_at IS NULL
    AND l.status IN ('open','active','overdue')
    AND c.status <> 'loaned';

  SELECT count(*) INTO orphan_loaned
  FROM public.angelcare360_library_copies c
  WHERE c.school_id = p_school_id
    AND c.status = 'loaned'
    AND NOT EXISTS (
      SELECT 1
      FROM public.angelcare360_library_loans l
      WHERE l.school_id = c.school_id
        AND l.copy_id = c.id
        AND l.returned_at IS NULL
        AND l.status IN ('open','active','overdue')
    );

  SELECT count(*) INTO invalid_borrowers
  FROM public.angelcare360_library_loans l
  WHERE l.school_id = p_school_id
    AND l.returned_at IS NULL
    AND l.status IN ('open','active','overdue')
    AND (
      (l.borrower_type = 'student' AND (
        l.borrower_student_id IS NULL OR l.borrower_staff_id IS NOT NULL
        OR NOT EXISTS (
          SELECT 1 FROM public.angelcare360_students s
          WHERE s.id = l.borrower_student_id AND s.school_id = l.school_id
        )
      ))
      OR
      (l.borrower_type = 'staff' AND (
        l.borrower_staff_id IS NULL OR l.borrower_student_id IS NOT NULL
        OR NOT EXISTS (
          SELECT 1 FROM public.angelcare360_staff s
          WHERE s.id = l.borrower_staff_id AND s.school_id = l.school_id
        )
      ))
    );

  SELECT count(*) INTO duplicate_barcodes
  FROM (
    SELECT btrim(barcode)
    FROM public.angelcare360_library_copies
    WHERE school_id = p_school_id
      AND barcode IS NOT NULL
      AND btrim(barcode) <> ''
    GROUP BY btrim(barcode)
    HAVING count(*) > 1
  ) x;

  RETURN jsonb_build_object(
    'installed', true,
    'safeForCirculation', (
      duplicate_active = 0
      AND state_mismatch = 0
      AND orphan_loaned = 0
      AND invalid_borrowers = 0
      AND duplicate_barcodes = 0
    ),
    'duplicateActiveLoans', duplicate_active,
    'activeLoanCopyStateMismatch', state_mismatch,
    'loanedCopiesWithoutActiveLoan', orphan_loaned,
    'invalidBorrowers', invalid_borrowers,
    'barcodeDuplicates', duplicate_barcodes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.angelcare360_library_create_loan_v1(
  p_school_id uuid,
  p_copy_id uuid,
  p_borrower_type text,
  p_borrower_id uuid,
  p_due_at timestamptz,
  p_actor_user_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_copy public.angelcare360_library_copies%ROWTYPE;
  v_loan public.angelcare360_library_loans%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_due_at IS NULL OR p_due_at <= v_now THEN
    RAISE EXCEPTION 'L’échéance du prêt doit être postérieure à maintenant.';
  END IF;
  IF p_borrower_type NOT IN ('student','staff') THEN
    RAISE EXCEPTION 'Type d’emprunteur invalide.';
  END IF;

  SELECT * INTO v_copy
  FROM public.angelcare360_library_copies
  WHERE school_id = p_school_id AND id = p_copy_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Exemplaire introuvable dans cet établissement.'; END IF;
  IF v_copy.status <> 'available' THEN
    RAISE EXCEPTION 'Cet exemplaire n’est pas disponible (état actuel: %).', v_copy.status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.angelcare360_library_loans
    WHERE school_id = p_school_id
      AND copy_id = p_copy_id
      AND returned_at IS NULL
      AND status IN ('open','active','overdue')
  ) THEN
    RAISE EXCEPTION 'Cet exemplaire possède déjà un prêt actif.';
  END IF;

  IF p_borrower_type = 'student' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.angelcare360_students
      WHERE id = p_borrower_id AND school_id = p_school_id AND status = 'active'
    ) THEN RAISE EXCEPTION 'Élève emprunteur introuvable ou inactif.'; END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.angelcare360_staff
      WHERE id = p_borrower_id AND school_id = p_school_id AND status = 'active'
    ) THEN RAISE EXCEPTION 'Membre du personnel introuvable ou inactif.'; END IF;
  END IF;

  INSERT INTO public.angelcare360_library_loans (
    school_id, copy_id, borrower_type,
    borrower_student_id, borrower_staff_id,
    loaned_at, due_at, returned_at, fine_amount, status,
    created_by, updated_by, metadata_json
  ) VALUES (
    p_school_id, p_copy_id, p_borrower_type,
    CASE WHEN p_borrower_type = 'student' THEN p_borrower_id ELSE NULL END,
    CASE WHEN p_borrower_type = 'staff' THEN p_borrower_id ELSE NULL END,
    v_now, p_due_at, NULL, 0, 'open',
    p_actor_user_id, p_actor_user_id,
    jsonb_strip_nulls(jsonb_build_object(
      'loan_notes', p_notes,
      'circulation_authority', 'angelcare360_library_create_loan_v1'
    ))
  )
  RETURNING * INTO v_loan;

  UPDATE public.angelcare360_library_copies
  SET status = 'loaned', updated_by = p_actor_user_id
  WHERE id = p_copy_id AND school_id = p_school_id;

  INSERT INTO public.angelcare360_audit_logs (
    school_id, actor_user_id, actor_role, module, action,
    entity_type, entity_id, severity, before_data, after_data, metadata
  ) VALUES (
    p_school_id, p_actor_user_id, 'school_user', 'bibliotheque', 'library_loan.created_atomic',
    'library_loan', v_loan.id, 'info', '{}'::jsonb, to_jsonb(v_loan),
    jsonb_build_object('copy_id', p_copy_id, 'borrower_type', p_borrower_type, 'authority', 'angelcare360_library_create_loan_v1')
  );

  RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copyStatus', 'loaned');
END;
$$;

CREATE OR REPLACE FUNCTION public.angelcare360_library_return_loan_v1(
  p_school_id uuid,
  p_loan_id uuid,
  p_returned_at timestamptz,
  p_copy_outcome text,
  p_condition text,
  p_actor_user_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_loan public.angelcare360_library_loans%ROWTYPE;
  v_copy public.angelcare360_library_copies%ROWTYPE;
  v_before_loan jsonb;
  v_before_copy jsonb;
  v_returned timestamptz := COALESCE(p_returned_at, now());
BEGIN
  IF p_copy_outcome NOT IN ('available','damaged') THEN
    RAISE EXCEPTION 'État physique de retour invalide.';
  END IF;

  SELECT * INTO v_loan
  FROM public.angelcare360_library_loans
  WHERE school_id = p_school_id AND id = p_loan_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prêt introuvable.'; END IF;

  SELECT * INTO v_copy
  FROM public.angelcare360_library_copies
  WHERE school_id = p_school_id AND id = v_loan.copy_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exemplaire du prêt introuvable.'; END IF;

  IF v_loan.status = 'returned' AND v_loan.returned_at IS NOT NULL THEN
    RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copy', to_jsonb(v_copy), 'idempotent', true);
  END IF;
  IF v_loan.returned_at IS NOT NULL OR v_loan.status NOT IN ('open','active','overdue') THEN
    RAISE EXCEPTION 'Ce prêt ne peut pas être retourné depuis son état actuel (%).', v_loan.status;
  END IF;

  v_before_loan := to_jsonb(v_loan);
  v_before_copy := to_jsonb(v_copy);

  UPDATE public.angelcare360_library_loans
  SET status = 'returned',
      returned_at = v_returned,
      updated_by = p_actor_user_id,
      metadata_json = COALESCE(metadata_json, '{}'::jsonb)
        || jsonb_strip_nulls(jsonb_build_object('return_notes', p_notes, 'return_copy_outcome', p_copy_outcome))
  WHERE id = p_loan_id
  RETURNING * INTO v_loan;

  UPDATE public.angelcare360_library_copies
  SET status = p_copy_outcome,
      condition = COALESCE(NULLIF(btrim(p_condition), ''), condition),
      updated_by = p_actor_user_id
  WHERE id = v_copy.id
  RETURNING * INTO v_copy;

  INSERT INTO public.angelcare360_audit_logs (
    school_id, actor_user_id, actor_role, module, action,
    entity_type, entity_id, severity, before_data, after_data, metadata
  ) VALUES (
    p_school_id, p_actor_user_id, 'school_user', 'bibliotheque', 'library_loan.returned_atomic',
    'library_loan', v_loan.id, CASE WHEN p_copy_outcome = 'damaged' THEN 'warning' ELSE 'info' END,
    v_before_loan, to_jsonb(v_loan),
    jsonb_build_object('copy_before', v_before_copy, 'copy_after', to_jsonb(v_copy), 'authority', 'angelcare360_library_return_loan_v1')
  );

  RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copy', to_jsonb(v_copy));
END;
$$;

CREATE OR REPLACE FUNCTION public.angelcare360_library_mark_lost_v1(
  p_school_id uuid,
  p_loan_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_loan public.angelcare360_library_loans%ROWTYPE;
  v_copy public.angelcare360_library_copies%ROWTYPE;
  v_before_loan jsonb;
  v_before_copy jsonb;
BEGIN
  IF NULLIF(btrim(p_reason), '') IS NULL THEN RAISE EXCEPTION 'Le motif de perte est obligatoire.'; END IF;

  SELECT * INTO v_loan FROM public.angelcare360_library_loans
  WHERE school_id = p_school_id AND id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prêt introuvable.'; END IF;

  SELECT * INTO v_copy FROM public.angelcare360_library_copies
  WHERE school_id = p_school_id AND id = v_loan.copy_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exemplaire du prêt introuvable.'; END IF;

  IF v_loan.status = 'lost' AND v_copy.status = 'lost' THEN
    RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copy', to_jsonb(v_copy), 'idempotent', true);
  END IF;
  IF v_loan.returned_at IS NOT NULL OR v_loan.status NOT IN ('open','active','overdue') THEN
    RAISE EXCEPTION 'Ce prêt ne peut pas être déclaré perdu depuis son état actuel (%).', v_loan.status;
  END IF;

  v_before_loan := to_jsonb(v_loan); v_before_copy := to_jsonb(v_copy);

  UPDATE public.angelcare360_library_loans
  SET status = 'lost', returned_at = now(), updated_by = p_actor_user_id,
      metadata_json = COALESCE(metadata_json, '{}'::jsonb)
        || jsonb_build_object('lost_reason', p_reason)
  WHERE id = p_loan_id RETURNING * INTO v_loan;

  UPDATE public.angelcare360_library_copies
  SET status = 'lost', updated_by = p_actor_user_id
  WHERE id = v_copy.id RETURNING * INTO v_copy;

  INSERT INTO public.angelcare360_audit_logs (
    school_id, actor_user_id, actor_role, module, action,
    entity_type, entity_id, severity, before_data, after_data, metadata
  ) VALUES (
    p_school_id, p_actor_user_id, 'school_user', 'bibliotheque', 'library_loan.marked_lost_atomic',
    'library_loan', v_loan.id, 'warning', v_before_loan, to_jsonb(v_loan),
    jsonb_build_object('reason', p_reason, 'copy_before', v_before_copy, 'copy_after', to_jsonb(v_copy), 'authority', 'angelcare360_library_mark_lost_v1')
  );

  RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copy', to_jsonb(v_copy));
END;
$$;

CREATE OR REPLACE FUNCTION public.angelcare360_library_cancel_loan_v1(
  p_school_id uuid,
  p_loan_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_loan public.angelcare360_library_loans%ROWTYPE;
  v_copy public.angelcare360_library_copies%ROWTYPE;
  v_before_loan jsonb;
  v_before_copy jsonb;
BEGIN
  IF NULLIF(btrim(p_reason), '') IS NULL THEN RAISE EXCEPTION 'Le motif d’annulation est obligatoire.'; END IF;

  SELECT * INTO v_loan FROM public.angelcare360_library_loans
  WHERE school_id = p_school_id AND id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prêt introuvable.'; END IF;

  SELECT * INTO v_copy FROM public.angelcare360_library_copies
  WHERE school_id = p_school_id AND id = v_loan.copy_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exemplaire du prêt introuvable.'; END IF;

  IF v_loan.status = 'cancelled' THEN
    RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copy', to_jsonb(v_copy), 'idempotent', true);
  END IF;
  IF v_loan.returned_at IS NOT NULL OR v_loan.status NOT IN ('open','active','overdue') THEN
    RAISE EXCEPTION 'Ce prêt ne peut pas être annulé depuis son état actuel (%).', v_loan.status;
  END IF;

  v_before_loan := to_jsonb(v_loan); v_before_copy := to_jsonb(v_copy);

  UPDATE public.angelcare360_library_loans
  SET status = 'cancelled', updated_by = p_actor_user_id,
      metadata_json = COALESCE(metadata_json, '{}'::jsonb)
        || jsonb_build_object('cancel_reason', p_reason)
  WHERE id = p_loan_id RETURNING * INTO v_loan;

  UPDATE public.angelcare360_library_copies
  SET status = 'available', updated_by = p_actor_user_id
  WHERE id = v_copy.id RETURNING * INTO v_copy;

  INSERT INTO public.angelcare360_audit_logs (
    school_id, actor_user_id, actor_role, module, action,
    entity_type, entity_id, severity, before_data, after_data, metadata
  ) VALUES (
    p_school_id, p_actor_user_id, 'school_user', 'bibliotheque', 'library_loan.cancelled_atomic',
    'library_loan', v_loan.id, 'notice', v_before_loan, to_jsonb(v_loan),
    jsonb_build_object('reason', p_reason, 'copy_before', v_before_copy, 'copy_after', to_jsonb(v_copy), 'authority', 'angelcare360_library_cancel_loan_v1')
  );

  RETURN jsonb_build_object('loan', to_jsonb(v_loan), 'copy', to_jsonb(v_copy));
END;
$$;

REVOKE ALL ON FUNCTION public.angelcare360_library_integrity_status_v1(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_library_create_loan_v1(uuid,uuid,text,uuid,timestamptz,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_library_return_loan_v1(uuid,uuid,timestamptz,text,text,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_library_mark_lost_v1(uuid,uuid,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.angelcare360_library_cancel_loan_v1(uuid,uuid,uuid,text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.angelcare360_library_integrity_status_v1(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_library_create_loan_v1(uuid,uuid,text,uuid,timestamptz,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_library_return_loan_v1(uuid,uuid,timestamptz,text,text,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_library_mark_lost_v1(uuid,uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.angelcare360_library_cancel_loan_v1(uuid,uuid,uuid,text) TO service_role;

COMMIT;

SELECT 'PASS — SANILA Library atomic circulation authority installed.' AS result;
