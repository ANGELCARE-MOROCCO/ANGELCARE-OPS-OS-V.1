-- ANGELCARE Supplier Ops MAX R3 completion: optional governed CJ SANDBOX order bridge.
-- Additive only. No automatic purchases, no live payments, no customer data migrations.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ac_som_cj_order_bridges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 purchase_id uuid NOT NULL UNIQUE REFERENCES public.ac_sc_purchase_orders(id) ON DELETE RESTRICT,
 order_number text NOT NULL UNIQUE CHECK (length(order_number) BETWEEN 8 AND 50),
 mode text NOT NULL DEFAULT 'sandbox' CHECK (mode='sandbox'),
 status text NOT NULL DEFAULT 'prepared' CHECK(status IN('prepared','submitting','submitted','ambiguous','reconciled','cancelled')),
 request_sha256 text NOT NULL CHECK(request_sha256 ~ '^[a-f0-9]{64}$'),
 consent_evidence_sha256 text NOT NULL CHECK(consent_evidence_sha256 ~ '^[a-f0-9]{64}$'),
 consent_attested_at timestamptz NOT NULL,
 shipping_address_id uuid NOT NULL REFERENCES public.angelcare_marketplace_customer_addresses(id) ON DELETE RESTRICT,
 shipping_country_code text NOT NULL CHECK(shipping_country_code ~ '^[A-Z]{2}$'),
 shipping_province text NOT NULL CHECK(length(btrim(shipping_province)) > 0),
 from_country_code text NOT NULL CHECK(from_country_code ~ '^[A-Z]{2}$'),
 logistics_name text NOT NULL CHECK(length(btrim(logistics_name)) > 0),
 variant_map jsonb NOT NULL CHECK(jsonb_typeof(variant_map)='object'),
 cj_order_id text,
 provider_status text,
 provider_tracking text,
 provider_carrier text,
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 1),
 approved_by text NOT NULL,
 created_by text NOT NULL,
 submitted_at timestamptz,
 last_checked_at timestamptz,
 error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((status IN('submitted','reconciled')) = (cj_order_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ac_som_cj_bridge_state_idx ON public.ac_som_cj_order_bridges(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS public.ac_som_cj_order_events (
 id bigserial PRIMARY KEY,
 bridge_id uuid NOT NULL REFERENCES public.ac_som_cj_order_bridges(id) ON DELETE RESTRICT,
 actor_id text NOT NULL,
 action text NOT NULL,
 request_sha256 text NOT NULL CHECK(request_sha256 ~ '^[a-f0-9]{64}$'),
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ac_som_cj_events_latest_idx ON public.ac_som_cj_order_events(bridge_id,created_at DESC);

-- Atomically reserve the one permitted CJ submission attempt for a purchase order.
-- After a timeout or uncertain response, reconciliation is mandatory: NEVER auto-resubmit.
CREATE OR REPLACE FUNCTION public.ac_som_claim_cj_sandbox_order(p_bridge uuid,p_request_sha256 text,p_actor text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_id uuid;
BEGIN
 IF p_actor IS NULL OR length(btrim(p_actor))<2 THEN RAISE EXCEPTION 'Actor required'; END IF;
 UPDATE public.ac_som_cj_order_bridges
 SET status='submitting',attempt_count=1,updated_at=now(),error_code=NULL
 WHERE id=p_bridge AND mode='sandbox' AND status='prepared' AND attempt_count=0 AND request_sha256=p_request_sha256
 RETURNING id INTO v_id;
 IF v_id IS NULL THEN RAISE EXCEPTION 'CJ order not claimable: already submitted, ambiguous or request changed'; END IF;
 INSERT INTO public.ac_som_cj_order_events(bridge_id,actor_id,action,request_sha256,details)
 VALUES(v_id,p_actor,'cj.sandbox_submission_claimed',p_request_sha256,'{"mode":"sandbox","payment":"never"}'::jsonb);
 RETURN v_id;
END $$;

ALTER TABLE public.ac_som_cj_order_bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_som_cj_order_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ac_som_cj_order_bridges,public.ac_som_cj_order_events FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ac_som_cj_order_bridges,public.ac_som_cj_order_events TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.ac_som_cj_order_events_id_seq TO service_role;
REVOKE ALL ON FUNCTION public.ac_som_claim_cj_sandbox_order(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ac_som_claim_cj_sandbox_order(uuid,text,text) TO service_role;
-- This additional view is deliberately created after the bridge transaction.
-- The original public discovery projection only exposes an item's primary category.
-- Multi-category storefronts must use canonical assignments without product duplication.
CREATE OR REPLACE VIEW public.angelcare_marketplace_catalog_discovery_memberships_v
WITH (security_invoker = true)
AS SELECT DISTINCT v.*, c.category_key AS assigned_category_key
FROM public.angelcare_marketplace_catalog_discovery_v AS v
JOIN public.angelcare_marketplace_catalog_item_categories AS a ON a.catalog_item_id=v.id
JOIN public.angelcare_marketplace_catalog_categories AS c ON c.id=a.category_id
WHERE v.status='published' AND c.status='published' AND c.locale='fr';
GRANT SELECT ON public.angelcare_marketplace_catalog_discovery_memberships_v TO service_role;

COMMIT;
