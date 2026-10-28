BEGIN;

CREATE OR REPLACE FUNCTION public.ac_owc_activate_batch(
  p_batch uuid,
  p_actor text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_author text;
  v_count integer;
BEGIN
  IF p_actor IS NULL OR btrim(p_actor) = '' THEN
    RAISE EXCEPTION 'Approver identity required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(812734201);

  SELECT created_by INTO v_author
  FROM public.ac_owc_rate_batches
  WHERE id = p_batch
    AND status = 'staged'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rate batch not staged';
  END IF;

  IF v_author = p_actor THEN
    RAISE EXCEPTION 'Independent approver required'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ac_owc_rates
    WHERE batch_id = p_batch AND currency = 'USD'
  ) THEN
    RAISE EXCEPTION 'USD identity rate is immutable';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.ac_owc_rates
  WHERE batch_id = p_batch
    AND status = 'staged';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No staged rates';
  END IF;

  UPDATE public.ac_owc_rates
  SET status = 'superseded'
  WHERE status = 'active'
    AND currency IN (
      SELECT currency
      FROM public.ac_owc_rates
      WHERE batch_id = p_batch
    );

  UPDATE public.ac_owc_rates
  SET status = 'active'
  WHERE batch_id = p_batch AND status = 'staged';

  UPDATE public.ac_owc_rate_batches
  SET status = 'active',
      approved_by = p_actor,
      approved_at = now()
  WHERE id = p_batch;

  INSERT INTO public.ac_owc_audit (
    actor_id, action, entity, entity_id, after_value
  )
  VALUES (
    p_actor, 'rates.activate', 'rate_batch',
    p_batch::text,
    jsonb_build_object('rate_count', v_count)
  );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION
  public.ac_owc_activate_batch(uuid, text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.ac_owc_activate_batch(uuid, text)
TO service_role;

COMMIT;
