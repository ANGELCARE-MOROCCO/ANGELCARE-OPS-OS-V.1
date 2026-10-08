-- SANILA Inventory postcheck — read-only
SELECT public.angelcare360_inventory_integrity_status_v1() AS inventory_integrity;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conrelid='public.angelcare360_inventory_movements'::regclass AND contype='c' ORDER BY conname;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='angelcare360_inventory_items' AND indexname='idx_angelcare360_inventory_items_school_barcode';
SELECT count(*) AS negative_stock_rows FROM public.angelcare360_inventory_items WHERE current_stock < 0;
