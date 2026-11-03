-- ANGELCARE SUPPLIER OPS MAX R4 — append-only CJ provider inventory snapshots
-- Additive, no existing prices/orders/publication records modified.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.ac_som_cj_inventory_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid,
 selection_id uuid NOT NULL REFERENCES public.ac_som_selections(id) ON DELETE RESTRICT,
 provider text NOT NULL DEFAULT 'cj' CHECK(provider='cj'),
 provider_product_id text NOT NULL CHECK(length(btrim(provider_product_id))>0),
 variant_id text NOT NULL CHECK(length(btrim(variant_id))>0),
 variant_sku text,
 warehouse_key text NOT NULL CHECK(length(btrim(warehouse_key))>0),
 warehouse_name text NOT NULL,
 country_code char(2) CHECK(country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
 cj_managed bigint CHECK(cj_managed IS NULL OR cj_managed >= 0),
 factory_managed bigint CHECK(factory_managed IS NULL OR factory_managed >= 0),
 total_reported bigint CHECK(total_reported IS NULL OR total_reported >= 0),
 verification_code text,
 state text NOT NULL CHECK(state IN('provider_reported','provider_empty','provider_error')),
 error_code text,
 capture_id uuid NOT NULL,
 checked_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ac_som_cj_snap_state_guard CHECK(state='provider_reported' OR (cj_managed IS NULL AND factory_managed IS NULL AND total_reported IS NULL)),
 CONSTRAINT ac_som_cj_snap_warehouse_unique UNIQUE(selection_id,variant_id,capture_id,warehouse_key)
);
CREATE INDEX IF NOT EXISTS ac_som_cj_snap_tenant_time ON public.ac_som_cj_inventory_snapshots(tenant_id,checked_at DESC);
CREATE INDEX IF NOT EXISTS ac_som_cj_snap_selection_variant ON public.ac_som_cj_inventory_snapshots(selection_id,variant_id,checked_at DESC);
CREATE INDEX IF NOT EXISTS ac_som_cj_snap_capture ON public.ac_som_cj_inventory_snapshots(capture_id);
ALTER TABLE public.ac_som_cj_inventory_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ac_som_cj_inventory_snapshots FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.ac_som_cj_inventory_snapshots TO service_role;
-- Reusable filters owned by existing AngelCare actor/tenant; same atomic migration transaction.
CREATE TABLE IF NOT EXISTS public.ac_som_saved_searches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid,
 actor_id uuid NOT NULL,
 provider text NOT NULL CHECK(provider IN('cj','fulfillbot')),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 3 AND 70),
 keyword text NOT NULL DEFAULT '',
 filters jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(filters)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ac_som_saved_search_owner_idx ON public.ac_som_saved_searches(actor_id,tenant_id,updated_at DESC);
ALTER TABLE public.ac_som_saved_searches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ac_som_saved_searches FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ac_som_saved_searches TO service_role;
COMMIT;
