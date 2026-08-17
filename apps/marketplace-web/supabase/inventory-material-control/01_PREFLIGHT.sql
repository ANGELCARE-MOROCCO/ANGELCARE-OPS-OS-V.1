-- SANILA Inventory & Material Control OS — self-hosted production preflight
-- READ-ONLY. Run before 02_MIGRATION.sql.
DO $$
DECLARE missing text[] := ARRAY[]::text[];
BEGIN
  IF to_regclass('public.angelcare360_inventory_categories') IS NULL THEN missing := array_append(missing,'public.angelcare360_inventory_categories'); END IF;
  IF to_regclass('public.angelcare360_inventory_items') IS NULL THEN missing := array_append(missing,'public.angelcare360_inventory_items'); END IF;
  IF to_regclass('public.angelcare360_inventory_movements') IS NULL THEN missing := array_append(missing,'public.angelcare360_inventory_movements'); END IF;
  IF to_regclass('public.angelcare360_staff') IS NULL THEN missing := array_append(missing,'public.angelcare360_staff'); END IF;
  IF array_length(missing,1) IS NOT NULL THEN RAISE EXCEPTION 'SANILA inventory preflight missing tables: %', array_to_string(missing,', '); END IF;
END $$;

DO $$
DECLARE missing text[] := ARRAY[]::text[]; c text;
BEGIN
  FOREACH c IN ARRAY ARRAY['school_id','category_id','item_code','label','unit_of_measure','barcode','current_stock','reorder_level','purchase_price','status','responsible_staff_id','metadata_json'] LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='angelcare360_inventory_items' AND column_name=c) THEN missing := array_append(missing,'items.'||c); END IF;
  END LOOP;
  FOREACH c IN ARRAY ARRAY['school_id','item_id','movement_code','movement_type','quantity','movement_date','reference_type','reference_id','performed_by','notes','status','metadata_json'] LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='angelcare360_inventory_movements' AND column_name=c) THEN missing := array_append(missing,'movements.'||c); END IF;
  END LOOP;
  IF array_length(missing,1) IS NOT NULL THEN RAISE EXCEPTION 'SANILA inventory preflight missing columns: %', array_to_string(missing,', '); END IF;
END $$;

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid='public.angelcare360_inventory_movements'::regclass AND contype='c' AND conname ILIKE '%movement%type%'
ORDER BY conname;

SELECT
  count(*) FILTER (WHERE current_stock < 0) AS negative_stock_rows,
  count(*) FILTER (WHERE reorder_level < 0) AS negative_threshold_rows,
  count(*) FILTER (WHERE purchase_price < 0) AS negative_purchase_price_rows
FROM public.angelcare360_inventory_items;
