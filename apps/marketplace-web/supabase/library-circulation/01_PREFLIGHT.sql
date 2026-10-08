-- SANILA LIBRARY & CIRCULATION OS
-- PRE-FLIGHT ONLY. NO MUTATION.
-- Canonical schema truth SHA256:
-- e1715ef91ced6ebf384e4363c5d02f404851d5be8dd6d4ef301f932d9566a51e

DO $$
DECLARE
  required_table text;
  required_column text;
  required_pair text[] := ARRAY[
    'angelcare360_library_books:id',
    'angelcare360_library_books:school_id',
    'angelcare360_library_books:book_code',
    'angelcare360_library_books:title',
    'angelcare360_library_copies:id',
    'angelcare360_library_copies:school_id',
    'angelcare360_library_copies:book_id',
    'angelcare360_library_copies:copy_code',
    'angelcare360_library_copies:barcode',
    'angelcare360_library_copies:status',
    'angelcare360_library_loans:id',
    'angelcare360_library_loans:school_id',
    'angelcare360_library_loans:copy_id',
    'angelcare360_library_loans:borrower_type',
    'angelcare360_library_loans:borrower_student_id',
    'angelcare360_library_loans:borrower_staff_id',
    'angelcare360_library_loans:due_at',
    'angelcare360_library_loans:returned_at',
    'angelcare360_library_loans:status',
    'angelcare360_students:id',
    'angelcare360_staff:id',
    'angelcare360_audit_logs:id'
  ];
  pair text;
  duplicate_active bigint;
  state_mismatch bigint;
  orphan_loaned bigint;
  invalid_borrowers bigint;
  duplicate_barcodes bigint;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'angelcare360_library_books',
    'angelcare360_library_copies',
    'angelcare360_library_loans',
    'angelcare360_students',
    'angelcare360_staff',
    'angelcare360_audit_logs'
  ]
  LOOP
    IF to_regclass('public.' || required_table) IS NULL THEN
      RAISE EXCEPTION 'PRE-FLIGHT FAILED: required table public.% is missing.', required_table;
    END IF;
  END LOOP;

  FOREACH pair IN ARRAY required_pair LOOP
    required_table := split_part(pair, ':', 1);
    required_column := split_part(pair, ':', 2);
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = required_table
        AND column_name = required_column
    ) THEN
      RAISE EXCEPTION 'PRE-FLIGHT FAILED: required column public.%.% is missing.', required_table, required_column;
    END IF;
  END LOOP;

  SELECT count(*) INTO duplicate_active
  FROM (
    SELECT school_id, copy_id
    FROM public.angelcare360_library_loans
    WHERE returned_at IS NULL
      AND status IN ('open','active','overdue')
    GROUP BY school_id, copy_id
    HAVING count(*) > 1
  ) x;

  SELECT count(*) INTO state_mismatch
  FROM public.angelcare360_library_loans l
  JOIN public.angelcare360_library_copies c
    ON c.id = l.copy_id AND c.school_id = l.school_id
  WHERE l.returned_at IS NULL
    AND l.status IN ('open','active','overdue')
    AND c.status <> 'loaned';

  SELECT count(*) INTO orphan_loaned
  FROM public.angelcare360_library_copies c
  WHERE c.status = 'loaned'
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
  WHERE l.returned_at IS NULL
    AND l.status IN ('open','active','overdue')
    AND ((l.borrower_type = 'student' AND (
           l.borrower_student_id IS NULL
           OR l.borrower_staff_id IS NOT NULL
           OR NOT EXISTS (
             SELECT 1 FROM public.angelcare360_students s
             WHERE s.id = l.borrower_student_id AND s.school_id = l.school_id
           )
         ))
     OR (l.borrower_type = 'staff' AND (
           l.borrower_staff_id IS NULL
           OR l.borrower_student_id IS NOT NULL
           OR NOT EXISTS (
             SELECT 1 FROM public.angelcare360_staff s
             WHERE s.id = l.borrower_staff_id AND s.school_id = l.school_id
           )
         )));

  SELECT count(*) INTO duplicate_barcodes
  FROM (
    SELECT school_id, btrim(barcode) AS barcode
    FROM public.angelcare360_library_copies
    WHERE barcode IS NOT NULL AND btrim(barcode) <> ''
    GROUP BY school_id, btrim(barcode)
    HAVING count(*) > 1
  ) x;

  RAISE NOTICE 'Library pre-flight: duplicate active loans=%', duplicate_active;
  RAISE NOTICE 'Library pre-flight: active loan/copy state mismatches=%', state_mismatch;
  RAISE NOTICE 'Library pre-flight: loaned copies without active loan=%', orphan_loaned;
  RAISE NOTICE 'Library pre-flight: invalid borrower links=%', invalid_borrowers;
  RAISE NOTICE 'Library pre-flight: duplicate non-empty barcodes=%', duplicate_barcodes;

  IF duplicate_active > 0 OR state_mismatch > 0 OR orphan_loaned > 0 OR invalid_borrowers > 0 OR duplicate_barcodes > 0 THEN
    RAISE EXCEPTION
      'PRE-FLIGHT FAILED: production data integrity must be reconciled before migration. duplicates=%, mismatches=%, orphan_loaned=%, invalid_borrowers=%, duplicate_barcodes=%',
      duplicate_active, state_mismatch, orphan_loaned, invalid_borrowers, duplicate_barcodes;
  END IF;
END $$;

SELECT
  'PASS — SANILA Library pre-flight accepted. No mutation executed.' AS result,
  current_database() AS database_name,
  current_setting('server_version') AS postgres_version;
