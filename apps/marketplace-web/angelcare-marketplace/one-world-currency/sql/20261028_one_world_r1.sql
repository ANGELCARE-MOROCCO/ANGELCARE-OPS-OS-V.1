
BEGIN;
CREATE TABLE IF NOT EXISTS public.ac_owc_configuration (
 id integer PRIMARY KEY DEFAULT 1 CHECK (id=1),
 base_currency text NOT NULL DEFAULT 'USD' CHECK(base_currency='USD'),
 mode text NOT NULL DEFAULT 'shadow' CHECK(mode IN('shadow','live')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.ac_owc_configuration(id) VALUES(1) ON CONFLICT DO NOTHING;


CREATE TABLE IF NOT EXISTS public.ac_owc_countries (
 code text PRIMARY KEY CHECK(code ~ '^[A-Z]{2}$'),
 name text NOT NULL,
 region text NOT NULL,
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 uplift_bp integer NOT NULL DEFAULT 0 CHECK(uplift_bp > -10000 AND uplift_bp < 100000),
 enabled boolean NOT NULL DEFAULT true,
 updated_by text,
 updated_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.ac_owc_rate_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source text NOT NULL CHECK(source IN('manual','frankfurter','csv')),
 status text NOT NULL DEFAULT 'staged' CHECK(status IN('staged','active','superseded','rejected')),
 label text NOT NULL,
 created_by text NOT NULL,
 approved_by text,
 approved_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.ac_owc_rates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 batch_id uuid NOT NULL REFERENCES public.ac_owc_rate_batches(id),
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 rate numeric(30,12) NOT NULL CHECK(rate>0),
 observed_on date NOT NULL,
 source text NOT NULL,
 status text NOT NULL DEFAULT 'staged' CHECK(status IN('staged','active','superseded','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(batch_id,currency)
);
CREATE UNIQUE INDEX IF NOT EXISTS ac_owc_one_active_rate
 ON public.ac_owc_rates(currency) WHERE status='active';


CREATE TABLE IF NOT EXISTS public.ac_owc_margin_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 scope text NOT NULL CHECK(scope IN('global','region','country')),
 scope_key text NOT NULL,
 uplift_bp integer NOT NULL CHECK(uplift_bp > -10000 AND uplift_bp < 100000),
 enabled boolean NOT NULL DEFAULT true,
 created_by text NOT NULL,
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(scope,scope_key)
);


CREATE TABLE IF NOT EXISTS public.ac_owc_simulations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 operator_id text NOT NULL,
 country_code text NOT NULL,
 base_usd text NOT NULL,
 display_currency text NOT NULL,
 rate text NOT NULL,
 uplift_bp integer NOT NULL,
 result_minor text NOT NULL,
 rate_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.ac_owc_audit (
 id bigserial PRIMARY KEY,
 actor_id text NOT NULL,
 action text NOT NULL,
 entity text NOT NULL,
 entity_id text,
 before_value jsonb,
 after_value jsonb,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ac_owc_audit_created_idx
 ON public.ac_owc_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS ac_owc_simulations_created_idx
 ON public.ac_owc_simulations(created_at DESC);


-- All reads/writes are server-only through existing Marketplace admin authentication.
ALTER TABLE public.ac_owc_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_owc_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_owc_rate_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_owc_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_owc_margin_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_owc_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_owc_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE
 public.ac_owc_configuration,public.ac_owc_countries,
 public.ac_owc_rate_batches,public.ac_owc_rates,
 public.ac_owc_margin_rules,public.ac_owc_simulations,
 public.ac_owc_audit FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE
 public.ac_owc_configuration,public.ac_owc_countries,
 public.ac_owc_rate_batches,public.ac_owc_rates,
 public.ac_owc_margin_rules,public.ac_owc_simulations,
 public.ac_owc_audit TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.ac_owc_audit_id_seq TO service_role;


-- Activate an approved/staged rate batch atomically; preserve the rate history.
CREATE OR REPLACE FUNCTION public.ac_owc_activate_batch(p_batch uuid,p_actor text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public AS $$
DECLARE n integer;
BEGIN
 PERFORM pg_advisory_xact_lock(812734201);
 IF NOT EXISTS(SELECT 1 FROM ac_owc_rate_batches WHERE id=p_batch AND status='staged') THEN
  RAISE EXCEPTION 'Rate batch not staged';
 END IF;
 SELECT count(*) INTO n FROM ac_owc_rates WHERE batch_id=p_batch AND status='staged';
 IF n=0 THEN RAISE EXCEPTION 'No staged rates'; END IF;
 UPDATE ac_owc_rates SET status='superseded'
 WHERE status='active' AND currency IN (SELECT currency FROM ac_owc_rates WHERE batch_id=p_batch);
 UPDATE ac_owc_rates SET status='active' WHERE batch_id=p_batch AND status='staged';
 UPDATE ac_owc_rate_batches SET status='active',approved_by=p_actor,approved_at=now() WHERE id=p_batch;
 INSERT INTO ac_owc_audit(actor_id,action,entity,entity_id,after_value)
 VALUES(p_actor,'rates.activate','rate_batch',p_batch::text,jsonb_build_object('rate_count',n));
 RETURN n;
END;$$;
REVOKE ALL ON FUNCTION public.ac_owc_activate_batch(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ac_owc_activate_batch(uuid,text) TO service_role;


-- USD always has an exact active identity rate, not an externally sourced approximation.
INSERT INTO public.ac_owc_rate_batches(id,source,status,label,created_by,approved_by,approved_at)
 VALUES('00000000-0000-4000-8000-000000000001','manual','active','USD identity','system','system',now())
 ON CONFLICT DO NOTHING;
INSERT INTO public.ac_owc_rates(batch_id,currency,rate,observed_on,source,status)
 VALUES('00000000-0000-4000-8000-000000000001','USD',1,current_date,'identity','active')
 ON CONFLICT DO NOTHING;
COMMIT;
