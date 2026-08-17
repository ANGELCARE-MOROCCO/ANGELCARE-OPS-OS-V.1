-- SANILA Inventory SQL rollback.
-- Refuses to restore the old narrow constraint if extended movement facts now exist.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.angelcare360_inventory_movements WHERE movement_type IN ('loss','damage','entry','exit','adjustment')) THEN
    RAISE EXCEPTION 'ROLLBACK REFUSED: extended movement rows exist; restoring the old narrow check would invalidate production facts.';
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.angelcare360_inventory_integrity_status_v1();
DROP FUNCTION IF EXISTS public.angelcare360_inventory_apply_movement_v1(uuid,uuid,text,text,numeric,numeric,date,text,uuid,uuid,uuid,text,jsonb);
DROP INDEX IF EXISTS public.idx_angelcare360_inventory_items_school_barcode;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.angelcare360_inventory_movements'::regclass AND conname='angelcare360_inventory_movements_movement_type_check') THEN
    ALTER TABLE public.angelcare360_inventory_movements ADD CONSTRAINT angelcare360_inventory_movements_movement_type_check CHECK (movement_type = ANY (ARRAY['in','out','adjust','transfer']::text[]));
  END IF;
END $$;
COMMIT;
