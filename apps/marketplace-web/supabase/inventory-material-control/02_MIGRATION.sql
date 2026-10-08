-- SANILA Inventory & Material Control OS — atomic stock authority v1
-- Self-hosted Supabase / PostgreSQL migration. Does not depend on Supabase cloud-only features.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';

-- Production currently carries two movement-type checks whose intersection blocks loss/damage.
ALTER TABLE public.angelcare360_inventory_movements
  DROP CONSTRAINT IF EXISTS angelcare360_inventory_movements_movement_type_check;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid='public.angelcare360_inventory_movements'::regclass
      AND conname='angelcare360_inventory_movements_type_check'
  ) THEN
    ALTER TABLE public.angelcare360_inventory_movements
      ADD CONSTRAINT angelcare360_inventory_movements_type_check
      CHECK (movement_type = ANY (ARRAY['in','out','adjust','transfer','entry','exit','adjustment','loss','damage']::text[]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_angelcare360_inventory_items_school_barcode
  ON public.angelcare360_inventory_items (school_id, barcode)
  WHERE barcode IS NOT NULL;

CREATE OR REPLACE FUNCTION public.angelcare360_inventory_apply_movement_v1(
  p_school_id uuid,
  p_item_id uuid,
  p_movement_code text,
  p_movement_type text,
  p_quantity numeric DEFAULT NULL,
  p_observed_stock numeric DEFAULT NULL,
  p_movement_date date DEFAULT CURRENT_DATE,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_performed_by uuid DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_metadata_json jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item public.angelcare360_inventory_items%ROWTYPE;
  v_existing public.angelcare360_inventory_movements%ROWTYPE;
  v_movement public.angelcare360_inventory_movements%ROWTYPE;
  v_type text;
  v_qty numeric;
  v_before numeric;
  v_after numeric;
  v_delta numeric;
  v_status text;
  v_metadata jsonb := coalesce(p_metadata_json,'{}'::jsonb);
  v_source text;
  v_destination text;
BEGIN
  IF p_school_id IS NULL OR p_item_id IS NULL OR nullif(btrim(p_movement_code),'') IS NULL THEN
    RAISE EXCEPTION 'inventory_required_identity_missing';
  END IF;

  SELECT * INTO v_existing FROM public.angelcare360_inventory_movements
   WHERE school_id=p_school_id AND movement_code=p_movement_code LIMIT 1;
  IF FOUND THEN
    SELECT * INTO v_item FROM public.angelcare360_inventory_items WHERE school_id=p_school_id AND id=v_existing.item_id;
    RETURN jsonb_build_object(
      'ok',true,'idempotent',true,'movement',to_jsonb(v_existing),
      'stockBefore',coalesce((v_existing.metadata_json->>'stock_before')::numeric,v_item.current_stock),
      'stockAfter',coalesce((v_existing.metadata_json->>'stock_after')::numeric,v_item.current_stock),
      'stockDelta',coalesce((v_existing.metadata_json->>'stock_delta')::numeric,0)
    );
  END IF;

  SELECT * INTO v_item FROM public.angelcare360_inventory_items
   WHERE school_id=p_school_id AND id=p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'inventory_item_not_found'; END IF;
  IF v_item.status IN ('inactive','archived') THEN RAISE EXCEPTION 'inventory_item_lifecycle_locked'; END IF;

  v_type := lower(btrim(coalesce(p_movement_type,'')));
  IF v_type='entry' THEN v_type:='in'; END IF;
  IF v_type='exit' THEN v_type:='out'; END IF;
  IF v_type='adjustment' THEN v_type:='adjust'; END IF;
  IF v_type NOT IN ('in','out','adjust','transfer','loss','damage') THEN RAISE EXCEPTION 'inventory_movement_type_invalid'; END IF;

  v_before := coalesce(v_item.current_stock,0);
  IF v_type='adjust' THEN
    IF p_observed_stock IS NULL OR p_observed_stock < 0 THEN RAISE EXCEPTION 'inventory_observed_stock_invalid'; END IF;
    v_after := p_observed_stock;
    v_delta := v_after-v_before;
    v_qty := abs(v_delta);
    IF nullif(btrim(coalesce(p_notes,'')),'') IS NULL THEN RAISE EXCEPTION 'inventory_adjustment_reason_required'; END IF;
  ELSE
    IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'inventory_quantity_invalid'; END IF;
    v_qty := p_quantity;
    IF v_type='in' THEN v_delta:=v_qty;
    ELSIF v_type IN ('out','loss','damage') THEN v_delta:=-v_qty;
    ELSE v_delta:=0; END IF;
    v_after:=v_before+v_delta;
  END IF;

  IF v_after < 0 THEN RAISE EXCEPTION 'inventory_negative_stock_blocked'; END IF;
  IF v_type IN ('loss','damage') AND nullif(btrim(coalesce(p_notes,'')),'') IS NULL THEN RAISE EXCEPTION 'inventory_exception_reason_required'; END IF;

  IF v_type='transfer' THEN
    v_source := coalesce(nullif(btrim(v_metadata->>'sourceLabel'),''),nullif(btrim(v_metadata->>'source_label'),''));
    v_destination := coalesce(nullif(btrim(v_metadata->>'destinationLabel'),''),nullif(btrim(v_metadata->>'destination_label'),''));
    IF v_source IS NULL OR v_destination IS NULL THEN RAISE EXCEPTION 'inventory_transfer_labels_required'; END IF;
    IF v_source=v_destination THEN RAISE EXCEPTION 'inventory_transfer_source_destination_same'; END IF;
  END IF;

  v_metadata := v_metadata || jsonb_build_object(
    'stock_before',v_before,'stock_after',v_after,'stock_delta',v_delta,
    'authority','angelcare360_inventory_apply_movement_v1',
    'transfer_scope',CASE WHEN v_type='transfer' THEN 'journal_only_no_location_balance' ELSE NULL END
  );

  INSERT INTO public.angelcare360_inventory_movements(
    school_id,item_id,movement_code,movement_type,quantity,movement_date,reference_type,reference_id,
    performed_by,notes,status,created_by,updated_by,metadata_json
  ) VALUES (
    p_school_id,p_item_id,p_movement_code,v_type,v_qty,coalesce(p_movement_date,CURRENT_DATE),
    nullif(btrim(coalesce(p_reference_type,'')),''),p_reference_id,p_performed_by,
    nullif(btrim(coalesce(p_notes,'')),''),'active',p_actor_user_id,p_actor_user_id,v_metadata
  ) RETURNING * INTO v_movement;

  IF v_type='damage' THEN v_status:='damaged';
  ELSIF v_type='loss' THEN v_status:='lost';
  ELSIF v_after<=0 THEN v_status:='out_of_stock';
  ELSIF v_after<=coalesce(v_item.reorder_level,0) THEN v_status:='low_stock';
  ELSE v_status:='active'; END IF;

  -- Transfer is a journal event only because production has no location-balance authority.
  IF v_type='transfer' THEN v_status:=v_item.status; END IF;

  UPDATE public.angelcare360_inventory_items SET
    current_stock=v_after,
    status=v_status,
    updated_by=p_actor_user_id,
    updated_at=now()
  WHERE school_id=p_school_id AND id=p_item_id;

  RETURN jsonb_build_object('ok',true,'idempotent',false,'movement',to_jsonb(v_movement),'stockBefore',v_before,'stockAfter',v_after,'stockDelta',v_delta);
END $$;

REVOKE ALL ON FUNCTION public.angelcare360_inventory_apply_movement_v1(uuid,uuid,text,text,numeric,numeric,date,text,uuid,uuid,uuid,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.angelcare360_inventory_apply_movement_v1(uuid,uuid,text,text,numeric,numeric,date,text,uuid,uuid,uuid,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.angelcare360_inventory_integrity_status_v1()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'ready',
      to_regprocedure('public.angelcare360_inventory_apply_movement_v1(uuid,uuid,text,text,numeric,numeric,date,text,uuid,uuid,uuid,text,jsonb)') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.angelcare360_inventory_movements'::regclass AND conname='angelcare360_inventory_movements_movement_type_check'),
    'version','inventory-material-command-v1',
    'reason',CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.angelcare360_inventory_movements'::regclass AND conname='angelcare360_inventory_movements_movement_type_check') THEN 'legacy_restrictive_movement_constraint_present' ELSE NULL END
  );
$$;
REVOKE ALL ON FUNCTION public.angelcare360_inventory_integrity_status_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.angelcare360_inventory_integrity_status_v1() TO service_role;

COMMIT;
