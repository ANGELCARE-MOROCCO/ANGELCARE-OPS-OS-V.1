-- SANILA LIBRARY & CIRCULATION OS — POSTCHECK
DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT count(*) INTO missing_count
  FROM (VALUES
    ('angelcare360_library_integrity_status_v1'),
    ('angelcare360_library_create_loan_v1'),
    ('angelcare360_library_return_loan_v1'),
    ('angelcare360_library_mark_lost_v1'),
    ('angelcare360_library_cancel_loan_v1')
  ) AS expected(proname)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = expected.proname
  );
  IF missing_count > 0 THEN RAISE EXCEPTION 'POSTCHECK FAILED: % circulation function(s) missing.', missing_count; END IF;

  IF to_regclass('public.ux_ac360_library_one_active_loan_per_copy') IS NULL THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: active-loan unique index missing.';
  END IF;
  IF to_regclass('public.ux_ac360_library_copy_barcode') IS NULL THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: barcode unique index missing.';
  END IF;
END $$;

SELECT
  s.id AS school_id,
  s.name AS school_name,
  public.angelcare360_library_integrity_status_v1(s.id) AS library_integrity
FROM public.angelcare360_schools s
WHERE EXISTS (
  SELECT 1 FROM public.angelcare360_library_books b WHERE b.school_id = s.id
) OR EXISTS (
  SELECT 1 FROM public.angelcare360_library_copies c WHERE c.school_id = s.id
)
ORDER BY s.name;

SELECT 'PASS — SANILA Library postcheck completed. Review every returned safeForCirculation value; all must be true.' AS result;
