-- SANILA LIBRARY & CIRCULATION OS — CONTROLLED DATABASE ROLLBACK
-- This removes only objects introduced by this package. Existing Library tables/data/RLS stay intact.

BEGIN;

DROP FUNCTION IF EXISTS public.angelcare360_library_cancel_loan_v1(uuid,uuid,uuid,text);
DROP FUNCTION IF EXISTS public.angelcare360_library_mark_lost_v1(uuid,uuid,uuid,text);
DROP FUNCTION IF EXISTS public.angelcare360_library_return_loan_v1(uuid,uuid,timestamptz,text,text,uuid,text);
DROP FUNCTION IF EXISTS public.angelcare360_library_create_loan_v1(uuid,uuid,text,uuid,timestamptz,uuid,text);
DROP FUNCTION IF EXISTS public.angelcare360_library_integrity_status_v1(uuid);

DROP INDEX IF EXISTS public.ux_ac360_library_copy_barcode;
DROP INDEX IF EXISTS public.ux_ac360_library_one_active_loan_per_copy;

COMMIT;

SELECT 'ROLLBACK COMPLETE — only SANILA Library circulation RPCs/indexes were removed.' AS result;
