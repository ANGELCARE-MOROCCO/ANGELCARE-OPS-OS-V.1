-- ANGELCARE SUPPLIER COMMAND 360 R1
-- ADDITIVE ONLY. Reuses canonical ANGELCARE suppliers, supplier offers, catalog and journeys.
-- Private China/global sourcing, manual AngelCare-owned purchasing, no supplier portal.
-- No edits to public product pages, payments or ONE WORLD tables.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ac_sc_supplier_profiles (
 supplier_id uuid PRIMARY KEY REFERENCES public.angelcare_marketplace_suppliers(id) ON DELETE RESTRICT,
 country_code text NOT NULL DEFAULT 'CN' CHECK (country_code ~ '^[A-Z]{2}$'),
 city text, website text, categories text[] NOT NULL DEFAULT '{}',
 internal_owner text, incoterm text, factory_verified boolean NOT NULL DEFAULT false,
 compliance_status text NOT NULL DEFAULT 'pending' CHECK(compliance_status IN('pending','review','accepted','expired','rejected')),
 risk_level text NOT NULL DEFAULT 'unrated' CHECK(risk_level IN('unrated','low','medium','high','critical')),
 commercial_notes text NOT NULL DEFAULT '', revision integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by text NOT NULL DEFAULT 'system');
CREATE TABLE IF NOT EXISTS public.ac_sc_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),supplier_id uuid NOT NULL REFERENCES public.angelcare_marketplace_suppliers(id),
 title text NOT NULL,document_type text NOT NULL CHECK(document_type IN('business_license','certification','sample_report','contract','quality','purchase','shipping','other')),
 storage_path text NOT NULL,review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN('pending','accepted','rejected')),
 expires_on date,notes text NOT NULL DEFAULT '',created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ac_sc_docs_supplier_idx ON public.ac_sc_documents(supplier_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.ac_sc_offer_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),offer_id uuid NOT NULL REFERENCES public.angelcare_marketplace_supplier_offers(id),
 storage_path text NOT NULL,media_role text NOT NULL CHECK(media_role IN('cover','gallery','detail','packaging')),
 usage_rights_confirmed boolean NOT NULL DEFAULT false,
 review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN('pending','accepted','rejected')),
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ac_sc_offer_media_idx ON public.ac_sc_offer_media(offer_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.ac_sc_channels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),channel_key text NOT NULL UNIQUE, title text NOT NULL,
 description text NOT NULL DEFAULT '',status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','active','paused')),
 created_by text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
COMMENT ON TABLE public.ac_sc_channels IS 'AngelCare-owned internal merchandising channels; NOT supplier shops or vendor accounts';
CREATE TABLE IF NOT EXISTS public.ac_sc_assortments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),channel_id uuid NOT NULL REFERENCES public.ac_sc_channels(id),
 catalog_item_id uuid NOT NULL REFERENCES public.angelcare_marketplace_catalog_items(id),
 merchandising_status text NOT NULL DEFAULT 'draft' CHECK(merchandising_status IN('draft','review','approved','paused')),
 position integer NOT NULL DEFAULT 100,updated_by text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(channel_id,catalog_item_id));

CREATE TABLE IF NOT EXISTS public.ac_sc_import_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),supplier_id uuid NOT NULL REFERENCES public.angelcare_marketplace_suppliers(id),
 filename text NOT NULL,header_mapping jsonb NOT NULL DEFAULT '{}',status text NOT NULL DEFAULT 'staged' CHECK(status IN('staged','validated','applied','rejected')),
 row_count integer NOT NULL DEFAULT 0,error_count integer NOT NULL DEFAULT 0,
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),applied_at timestamptz);
CREATE TABLE IF NOT EXISTS public.ac_sc_import_rows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),batch_id uuid NOT NULL REFERENCES public.ac_sc_import_batches(id) ON DELETE CASCADE,
 line_no integer NOT NULL,raw jsonb NOT NULL,normal jsonb NOT NULL,
 issue text, status text NOT NULL DEFAULT 'staged' CHECK(status IN('staged','valid','invalid','applied')),
 UNIQUE(batch_id,line_no));
CREATE INDEX IF NOT EXISTS ac_sc_import_rows_batch_idx ON public.ac_sc_import_rows(batch_id,status);

CREATE TABLE IF NOT EXISTS public.ac_sc_commercials (
 offer_id uuid PRIMARY KEY REFERENCES public.angelcare_marketplace_supplier_offers(id) ON DELETE RESTRICT,
 procurement_currency text NOT NULL CHECK(procurement_currency ~ '^[A-Z]{3}$'),
 unit_cost numeric(18,6) NOT NULL CHECK(unit_cost>=0),
 freight_unit numeric(18,6) NOT NULL DEFAULT 0 CHECK(freight_unit>=0),
 duties_unit numeric(18,6) NOT NULL DEFAULT 0 CHECK(duties_unit>=0),
 other_unit numeric(18,6) NOT NULL DEFAULT 0 CHECK(other_unit>=0),
 retail_usd numeric(18,6) CHECK(retail_usd IS NULL OR retail_usd>=0),
 notes text NOT NULL DEFAULT '',verified_by text,updated_by text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.ac_sc_purchase_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text NOT NULL UNIQUE DEFAULT ('ACPO-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
 supplier_id uuid NOT NULL REFERENCES public.angelcare_marketplace_suppliers(id),currency text NOT NULL CHECK(currency~'^[A-Z]{3}$'),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','review','approved','issued','accepted','shipped','received','cancelled')),
 incoterm text,lead_days integer CHECK(lead_days IS NULL OR lead_days>=0),terms text NOT NULL DEFAULT '',
 created_by text NOT NULL,approved_by text,approved_at timestamptz,
 issued_at timestamptz,revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ac_sc_purchase_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),purchase_id uuid NOT NULL REFERENCES public.ac_sc_purchase_orders(id) ON DELETE RESTRICT,
 supplier_offer_id uuid NOT NULL REFERENCES public.angelcare_marketplace_supplier_offers(id),
 journey_id uuid REFERENCES public.angelcare_marketplace_journeys(id),
 quantity numeric(16,3) NOT NULL CHECK(quantity>0),unit_cost numeric(18,6) NOT NULL CHECK(unit_cost>=0),
 description text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ac_sc_purchase_lines_po_idx ON public.ac_sc_purchase_lines(purchase_id);

CREATE TABLE IF NOT EXISTS public.ac_sc_availability (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),supplier_offer_id uuid NOT NULL REFERENCES public.angelcare_marketplace_supplier_offers(id),
 announced_qty numeric(16,3) NOT NULL CHECK(announced_qty>=0),location text NOT NULL,
 observed_at timestamptz NOT NULL,valid_until timestamptz NOT NULL,
 status text NOT NULL CHECK(status IN('declared','verified','unavailable')),
 proof text NOT NULL DEFAULT '',verified_by text,verified_at timestamptz,operator_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(valid_until>observed_at));
CREATE INDEX IF NOT EXISTS ac_sc_availability_offer_idx ON public.ac_sc_availability(supplier_offer_id,created_at DESC);
COMMENT ON TABLE public.ac_sc_availability IS 'Supplier-declared availability ONLY; never AngelCare-owned stock nor a reservation';

CREATE TABLE IF NOT EXISTS public.ac_sc_shipments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text NOT NULL UNIQUE DEFAULT ('ACSH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 purchase_id uuid NOT NULL REFERENCES public.ac_sc_purchase_orders(id),
 journey_id uuid REFERENCES public.angelcare_marketplace_journeys(id),
 carrier text,tracking_number text,origin text,destination text,
 status text NOT NULL DEFAULT 'preparing' CHECK(status IN('preparing','dispatched','in_transit','delivered','exception')),
 departure_at timestamptz,expected_at timestamptz,delivered_at timestamptz,
 proof text NOT NULL DEFAULT '',created_by text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ac_sc_shipment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),shipment_id uuid NOT NULL REFERENCES public.ac_sc_shipments(id),
 event_status text NOT NULL,notes text NOT NULL DEFAULT '',operator_id text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ac_sc_ship_events_idx ON public.ac_sc_shipment_events(shipment_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.ac_sc_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),supplier_id uuid REFERENCES public.angelcare_marketplace_suppliers(id),
 title text NOT NULL,priority text NOT NULL DEFAULT 'medium' CHECK(priority IN('low','medium','high','critical')),
 due_on date,status text NOT NULL DEFAULT 'open' CHECK(status IN('open','doing','done','cancelled')),
 owner text NOT NULL DEFAULT '',created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ac_sc_audit (
 id bigserial PRIMARY KEY,request_key text NOT NULL UNIQUE,
 actor_id text NOT NULL,action text NOT NULL,entity text NOT NULL,
 entity_id text,reason text,after_value jsonb NOT NULL DEFAULT '{}',result jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS ac_sc_audit_latest ON public.ac_sc_audit(created_at DESC);

DO $$DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY[
 'ac_sc_supplier_profiles','ac_sc_documents','ac_sc_offer_media','ac_sc_channels','ac_sc_assortments',
 'ac_sc_import_batches','ac_sc_import_rows','ac_sc_commercials',
 'ac_sc_purchase_orders','ac_sc_purchase_lines','ac_sc_availability',
 'ac_sc_shipments','ac_sc_shipment_events','ac_sc_tasks','ac_sc_audit'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END$$;
GRANT USAGE,SELECT ON SEQUENCE public.ac_sc_audit_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.ac_sc_command(
 p_actor text,p_action text,p_payload jsonb,p_key text,p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE v_id uuid;v_aux uuid;v_ref text;v_status text;v_owner text;v_currency text;v_supplier uuid;
 v_record record;v_result jsonb:='{}';v_count integer:=0;v_errors integer:=0;v_item jsonb;
BEGIN
 IF p_actor IS NULL OR length(btrim(p_actor))<2 THEN RAISE EXCEPTION 'Actor required';END IF;
 IF p_key IS NULL OR length(btrim(p_key))<10 THEN RAISE EXCEPTION 'Idempotency key required';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key,29));
 SELECT result INTO v_result FROM public.ac_sc_audit WHERE request_key=p_key;
 IF FOUND THEN RETURN v_result; END IF;
 IF p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' THEN RAISE EXCEPTION 'Object payload required';END IF;

 CASE p_action
 WHEN 'supplier.create' THEN
  IF length(btrim(coalesce(p_payload->>'code','')))<2 OR length(btrim(coalesce(p_payload->>'name','')))<2 OR length(btrim(coalesce(p_payload->>'legalName','')))<2 THEN RAISE EXCEPTION 'Supplier code/name required';END IF;
  INSERT INTO public.angelcare_marketplace_suppliers(supplier_code,legal_name,display_name,status,primary_contact,payment_terms)
  VALUES(upper(btrim(p_payload->>'code')),btrim(p_payload->>'legalName'),btrim(p_payload->>'name'),'prospect',
  jsonb_build_object('email',coalesce(p_payload->>'email',''),'name',coalesce(p_payload->>'contact','')),
  coalesce(p_payload->>'terms','')) RETURNING id INTO v_id;
  INSERT INTO public.ac_sc_supplier_profiles(supplier_id,country_code,city,internal_owner,updated_by)
  VALUES(v_id,coalesce(nullif(p_payload->>'country',''),'CN'),p_payload->>'city',p_payload->>'owner',p_actor);
  v_result:=jsonb_build_object('id',v_id);
 WHEN 'supplier.update' THEN
  v_id:=(p_payload->>'id')::uuid;
  IF p_payload ? 'revision' AND EXISTS(SELECT 1 FROM public.ac_sc_supplier_profiles WHERE supplier_id=v_id AND revision<>(p_payload->>'revision')::integer) THEN RAISE EXCEPTION 'Stale supplier revision - refresh first';END IF;
  UPDATE public.angelcare_marketplace_suppliers SET
    display_name=coalesce(nullif(p_payload->>'name',''),display_name),
    legal_name=coalesce(nullif(p_payload->>'legalName',''),legal_name),
    primary_contact=CASE WHEN p_payload ? 'email' THEN jsonb_build_object('email',p_payload->>'email','name',coalesce(p_payload->>'contact','')) ELSE primary_contact END,
    payment_terms=coalesce(p_payload->>'terms',payment_terms),updated_at=now()
  WHERE id=v_id RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Supplier not found';END IF;
  INSERT INTO public.ac_sc_supplier_profiles(supplier_id,country_code,city,internal_owner,incoterm,commercial_notes,updated_by)
  VALUES(v_id,coalesce(nullif(p_payload->>'country',''),'CN'),p_payload->>'city',p_payload->>'owner',p_payload->>'incoterm',coalesce(p_payload->>'notes',''),p_actor)
  ON CONFLICT(supplier_id) DO UPDATE SET country_code=excluded.country_code,city=excluded.city,
   internal_owner=excluded.internal_owner,incoterm=excluded.incoterm,commercial_notes=excluded.commercial_notes,
   revision=public.ac_sc_supplier_profiles.revision+1,updated_by=p_actor,updated_at=now();
  v_result:=jsonb_build_object('id',v_id);
 WHEN 'supplier.transition' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('prospect','qualification','approved','active','suspended','archived') THEN RAISE EXCEPTION 'Invalid status';END IF;
  SELECT status INTO v_owner FROM public.angelcare_marketplace_suppliers WHERE id=v_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Supplier not found'; END IF;
  IF v_status='active' AND NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_suppliers WHERE id=v_id AND quality_status IN('approved','conditional'))
   THEN RAISE EXCEPTION 'Quality clearance required for active supplier';END IF;
  IF v_owner='archived' AND v_status<>'archived' THEN RAISE EXCEPTION 'Archived supplier is immutable';END IF;
  UPDATE public.angelcare_marketplace_suppliers SET status=v_status,updated_at=now() WHERE id=v_id;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'supplier.quality' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('unreviewed','pending','approved','conditional','rejected','expired') THEN RAISE EXCEPTION 'Invalid quality status';END IF;
  IF v_status IN('approved','conditional') AND NOT EXISTS(SELECT 1 FROM public.ac_sc_documents WHERE supplier_id=v_id AND review_status='accepted') THEN RAISE EXCEPTION 'One accepted supplier evidence document required';END IF;
  UPDATE public.angelcare_marketplace_suppliers SET quality_status=v_status,updated_at=now() WHERE id=v_id RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Supplier not found';END IF;
  v_result:=jsonb_build_object('id',v_id,'quality',v_status);
 WHEN 'supplier.assess' THEN
  v_id:=(p_payload->>'id')::uuid;
  IF (p_payload->>'risk') NOT IN('unrated','low','medium','high','critical') THEN RAISE EXCEPTION 'Invalid risk level';END IF;
  IF (p_payload->>'compliance') NOT IN('pending','review','accepted','expired','rejected') THEN RAISE EXCEPTION 'Invalid compliance status';END IF;
  IF (p_payload->>'compliance')='accepted' AND NOT EXISTS(SELECT 1 FROM public.ac_sc_documents WHERE supplier_id=v_id AND review_status='accepted') THEN RAISE EXCEPTION 'Accepted evidence required for compliance clearance';END IF;
  UPDATE public.ac_sc_supplier_profiles SET risk_level=p_payload->>'risk',compliance_status=p_payload->>'compliance',factory_verified=coalesce((p_payload->>'factoryVerified')::boolean,false),revision=revision+1,updated_by=p_actor,updated_at=now() WHERE supplier_id=v_id RETURNING supplier_id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Supplier profile missing';END IF;
  v_result:=jsonb_build_object('id',v_id);
 WHEN 'supplier.document' THEN
  v_id:=(p_payload->>'supplierId')::uuid;
  IF length(coalesce(p_payload->>'title',''))<3 OR length(coalesce(p_payload->>'storagePath',''))<3 OR left(coalesce(p_payload->>'storagePath',''),length(v_id::text)+1)<>v_id::text||'/' THEN RAISE EXCEPTION 'Document title and supplier-owned private storage path required';END IF;
  INSERT INTO public.ac_sc_documents(supplier_id,title,document_type,storage_path,expires_on,notes,created_by)
  VALUES(v_id,p_payload->>'title',p_payload->>'type',p_payload->>'storagePath',nullif(p_payload->>'expires','')::date,coalesce(p_payload->>'notes',''),p_actor) RETURNING id INTO v_aux;
  v_result:=jsonb_build_object('id',v_aux);
 WHEN 'media.attach' THEN
  v_id:=(p_payload->>'offerId')::uuid;
  SELECT supplier_id INTO v_supplier FROM public.angelcare_marketplace_supplier_offers WHERE id=v_id;
  IF NOT FOUND OR left(coalesce(p_payload->>'storagePath',''),length(v_supplier::text)+1)<>v_supplier::text||'/' THEN RAISE EXCEPTION 'Offer and supplier-owned private storage path required';END IF;
  IF p_payload->>'role' NOT IN('cover','gallery','detail','packaging') THEN RAISE EXCEPTION 'Invalid media role';END IF;
  IF coalesce((p_payload->>'rightsConfirmed')::boolean,false) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Commercial usage rights must be confirmed';END IF;
  INSERT INTO public.ac_sc_offer_media(offer_id,storage_path,media_role,usage_rights_confirmed,created_by)
  VALUES(v_id,p_payload->>'storagePath',p_payload->>'role',true,p_actor) RETURNING id INTO v_aux;
  v_result:=jsonb_build_object('id',v_aux);
 WHEN 'media.review' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('accepted','rejected') THEN RAISE EXCEPTION 'Invalid media status';END IF;
  UPDATE public.ac_sc_offer_media SET review_status=v_status WHERE id=v_id AND review_status='pending' RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Media not pending';END IF;
  v_result:=jsonb_build_object('id',v_id);
 WHEN 'document.review' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('accepted','rejected') THEN RAISE EXCEPTION 'Invalid evidence decision';END IF;
  UPDATE public.ac_sc_documents SET review_status=v_status WHERE id=v_id AND review_status='pending' RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Document not found';END IF;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'channel.transition' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('draft','active','paused') THEN RAISE EXCEPTION 'Invalid channel status';END IF;
  UPDATE public.ac_sc_channels SET status=v_status,updated_at=now() WHERE id=v_id RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Channel not found';END IF;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'channel.save' THEN
  v_ref:=lower(btrim(p_payload->>'key'));
  IF v_ref !~ '^[a-z0-9][a-z0-9_-]{2,59}$' THEN RAISE EXCEPTION 'Invalid channel key';END IF;
  IF length(btrim(coalesce(p_payload->>'title','')))<3 THEN RAISE EXCEPTION 'Channel title required';END IF;
  INSERT INTO public.ac_sc_channels(channel_key,title,description,status,created_by)
  VALUES(v_ref,p_payload->>'title',coalesce(p_payload->>'description',''),'draft',p_actor)
  ON CONFLICT(channel_key) DO UPDATE SET title=excluded.title,description=excluded.description,updated_at=now()
  RETURNING id INTO v_id;
  v_result:=jsonb_build_object('id',v_id);
 WHEN 'channel.assort' THEN
  v_id:=(p_payload->>'channelId')::uuid;v_aux:=(p_payload->>'catalogId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_catalog_items WHERE id=v_aux AND kind IN('product','kit')) THEN RAISE EXCEPTION 'A real product/kit catalog item is required';END IF;
  INSERT INTO public.ac_sc_assortments(channel_id,catalog_item_id,merchandising_status,position,updated_by)
  VALUES(v_id,v_aux,'draft',coalesce((p_payload->>'position')::integer,100),p_actor)
  ON CONFLICT(channel_id,catalog_item_id) DO UPDATE SET position=excluded.position,updated_by=p_actor,updated_at=now();
  v_result:=jsonb_build_object('channelId',v_id,'catalogId',v_aux);
 WHEN 'channel.assort.status' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('draft','review','approved','paused') THEN RAISE EXCEPTION 'Invalid assortment status';END IF;
  UPDATE public.ac_sc_assortments SET merchandising_status=v_status,updated_at=now(),updated_by=p_actor WHERE id=v_id RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Assortment not found';END IF;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'offer.save' THEN
  v_supplier:=(p_payload->>'supplierId')::uuid;v_aux:=(p_payload->>'catalogId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_suppliers WHERE id=v_supplier AND status NOT IN('suspended','archived')) THEN RAISE EXCEPTION 'Supplier unavailable';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_catalog_items WHERE id=v_aux AND kind IN('product','kit')) THEN RAISE EXCEPTION 'Canonical product/kit must exist';END IF;
  IF length(btrim(coalesce(p_payload->>'sku','')))<2 THEN RAISE EXCEPTION 'Supplier SKU required';END IF;
  IF coalesce(p_payload->>'unitCost','') !~ '^\d+(\.\d+)?$' OR coalesce(p_payload->>'moq','') !~ '^\d+(\.\d+)?$' THEN RAISE EXCEPTION 'Documented cost and MOQ required';END IF;
  v_currency:=upper(coalesce(nullif(p_payload->>'currency',''),'USD'));
  IF v_currency !~ '^[A-Z]{3}$' THEN RAISE EXCEPTION 'Currency ISO invalid';END IF;
  INSERT INTO public.angelcare_marketplace_supplier_offers(supplier_id,catalog_item_id,supplier_sku,unit_cost,currency_label,minimum_order,lead_time_days,status)
  VALUES(v_supplier,v_aux,p_payload->>'sku',(p_payload->>'unitCost')::numeric,v_currency,
  coalesce((p_payload->>'moq')::numeric,1),nullif(p_payload->>'leadDays','')::integer,'draft')
  ON CONFLICT(supplier_id,catalog_item_id,supplier_sku) DO UPDATE
    SET unit_cost=excluded.unit_cost,currency_label=excluded.currency_label,minimum_order=excluded.minimum_order,
      lead_time_days=excluded.lead_time_days,updated_at=now()
  RETURNING id INTO v_id;
  v_result:=jsonb_build_object('id',v_id);
 WHEN 'offer.status' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('draft','review','approved','active','suspended','archived') THEN RAISE EXCEPTION 'Invalid offer status';END IF;
  IF v_status IN('approved','active') AND NOT EXISTS(
    SELECT 1 FROM public.angelcare_marketplace_supplier_offers o JOIN public.angelcare_marketplace_suppliers s ON s.id=o.supplier_id
    WHERE o.id=v_id AND s.status IN('approved','active') AND s.quality_status IN('approved','conditional'))
    THEN RAISE EXCEPTION 'Supplier must pass qualification to approve offer'; END IF;
  SELECT status INTO v_ref FROM public.angelcare_marketplace_supplier_offers WHERE id=v_id FOR UPDATE;
  IF NOT ((v_ref='draft' AND v_status='review') OR (v_ref='review' AND v_status IN('approved','draft')) OR (v_ref='approved' AND v_status IN('active','suspended')) OR (v_ref='active' AND v_status='suspended') OR (v_ref='suspended' AND v_status='review')) THEN RAISE EXCEPTION 'Forbidden offer status transition % -> %',v_ref,v_status;END IF;
  UPDATE public.angelcare_marketplace_supplier_offers SET status=v_status,updated_at=now() WHERE id=v_id RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Offer not found';END IF;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'commercial.save' THEN
  v_id:=(p_payload->>'offerId')::uuid;
  SELECT currency_label INTO v_currency FROM public.angelcare_marketplace_supplier_offers WHERE id=v_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Offer missing';END IF;
  INSERT INTO public.ac_sc_commercials(offer_id,procurement_currency,unit_cost,freight_unit,duties_unit,other_unit,retail_usd,notes,updated_by)
  VALUES(v_id,v_currency,(p_payload->>'unitCost')::numeric,coalesce((p_payload->>'freight')::numeric,0),
  coalesce((p_payload->>'duties')::numeric,0),coalesce((p_payload->>'other')::numeric,0),
  nullif(p_payload->>'retailUsd','')::numeric,coalesce(p_payload->>'notes',''),p_actor)
  ON CONFLICT(offer_id) DO UPDATE SET unit_cost=excluded.unit_cost,freight_unit=excluded.freight_unit,
    duties_unit=excluded.duties_unit,other_unit=excluded.other_unit,retail_usd=excluded.retail_usd,
    notes=excluded.notes,updated_by=p_actor,updated_at=now() RETURNING offer_id INTO v_aux;
  v_result:=jsonb_build_object('offerId',v_aux);
 WHEN 'import.stage' THEN
  v_supplier:=(p_payload->>'supplierId')::uuid;
  IF jsonb_typeof(p_payload->'rows')<>'array' OR jsonb_array_length(p_payload->'rows') NOT BETWEEN 1 AND 250 THEN RAISE EXCEPTION 'Import requires 1-250 rows';END IF;
  INSERT INTO public.ac_sc_import_batches(supplier_id,filename,header_mapping,row_count,created_by)
  VALUES(v_supplier,left(coalesce(p_payload->>'filename','operator.csv'),160),coalesce(p_payload->'mapping','{}'::jsonb),jsonb_array_length(p_payload->'rows'),p_actor)
  RETURNING id INTO v_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_payload->'rows') LOOP
   v_count:=v_count+1;
   INSERT INTO public.ac_sc_import_rows(batch_id,line_no,raw,normal,status,issue)
   VALUES(v_id,v_count,v_item,v_item,
    CASE WHEN coalesce(v_item->>'sku','')<>'' AND coalesce(v_item->>'catalogId','')~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND coalesce(v_item->>'cost','')~'^\d+(\.\d+)?$' AND upper(coalesce(v_item->>'currency','USD'))~'^[A-Z]{3}$' AND coalesce(nullif(v_item->>'moq',''),'1')~'^\d+(\.\d+)?$' THEN 'valid' ELSE 'invalid' END,
    CASE WHEN coalesce(v_item->>'sku','')<>'' AND coalesce(v_item->>'catalogId','')~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND coalesce(v_item->>'cost','')~'^\d+(\.\d+)?$' AND upper(coalesce(v_item->>'currency','USD'))~'^[A-Z]{3}$' AND coalesce(nullif(v_item->>'moq',''),'1')~'^\d+(\.\d+)?$' THEN NULL ELSE 'SKU, catalogue ID or cost missing/invalid' END);
  END LOOP;
  UPDATE public.ac_sc_import_batches SET status='validated',error_count=(SELECT count(*) FROM public.ac_sc_import_rows WHERE batch_id=v_id AND status='invalid') WHERE id=v_id;
  v_result:=jsonb_build_object('id',v_id,'rows',v_count);
 WHEN 'import.apply' THEN
  v_id:=(p_payload->>'batchId')::uuid;
  SELECT supplier_id INTO v_supplier FROM public.ac_sc_import_batches WHERE id=v_id AND status='validated' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch not validated or already applied';END IF;
  IF EXISTS(SELECT 1 FROM public.ac_sc_import_rows WHERE batch_id=v_id AND status='invalid') THEN RAISE EXCEPTION 'Correct invalid rows before applying';END IF;
  FOR v_record IN SELECT * FROM public.ac_sc_import_rows WHERE batch_id=v_id ORDER BY line_no LOOP
    v_count:=v_count+1;
   IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_catalog_items WHERE id=(v_record.normal->>'catalogId')::uuid AND kind IN('product','kit')) THEN RAISE EXCEPTION 'Unknown/non-product catalog item on line %',v_record.line_no;END IF;
   INSERT INTO public.angelcare_marketplace_supplier_offers(supplier_id,catalog_item_id,supplier_sku,unit_cost,currency_label,minimum_order,status)
   VALUES(v_supplier,(v_record.normal->>'catalogId')::uuid,v_record.normal->>'sku',(v_record.normal->>'cost')::numeric,upper(coalesce(v_record.normal->>'currency','USD')),coalesce((v_record.normal->>'moq')::numeric,1),'draft')
   ON CONFLICT(supplier_id,catalog_item_id,supplier_sku) DO UPDATE SET unit_cost=excluded.unit_cost,currency_label=excluded.currency_label,minimum_order=excluded.minimum_order,updated_at=now();
  END LOOP;
  UPDATE public.ac_sc_import_rows SET status='applied' WHERE batch_id=v_id;
  UPDATE public.ac_sc_import_batches SET status='applied',applied_at=now() WHERE id=v_id;
  v_result:=jsonb_build_object('id',v_id,'rows',v_count);
 WHEN 'purchase.create' THEN
  v_supplier:=(p_payload->>'supplierId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_suppliers WHERE id=v_supplier AND status IN('approved','active')) THEN RAISE EXCEPTION 'Approved supplier required';END IF;
  v_currency:=upper(coalesce(p_payload->>'currency','USD'));
  INSERT INTO public.ac_sc_purchase_orders(supplier_id,currency,terms,incoterm,created_by)
  VALUES(v_supplier,v_currency,coalesce(p_payload->>'terms',''),p_payload->>'incoterm',p_actor) RETURNING id,reference INTO v_id,v_ref;
  v_result:=jsonb_build_object('id',v_id,'reference',v_ref);
 WHEN 'purchase.line' THEN
  v_id:=(p_payload->>'purchaseId')::uuid;v_aux:=(p_payload->>'offerId')::uuid;
  SELECT supplier_id,currency,status INTO v_supplier,v_currency,v_status FROM public.ac_sc_purchase_orders WHERE id=v_id FOR UPDATE;
  IF NOT FOUND OR v_status<>'draft' THEN RAISE EXCEPTION 'Only draft POs can add lines';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.angelcare_marketplace_supplier_offers WHERE id=v_aux AND supplier_id=v_supplier AND status IN('approved','active') AND currency_label=v_currency) THEN RAISE EXCEPTION 'Offer must be approved, same supplier and currency';END IF;
  IF nullif(p_payload->>'journeyId','') IS NOT NULL AND NOT EXISTS(
   SELECT 1 FROM public.angelcare_marketplace_payment_intents pi
   WHERE pi.canonical_object_id::text=p_payload->>'journeyId'
    AND coalesce(pi.captured_amount,0)>coalesce(pi.refunded_amount,0))
   THEN RAISE EXCEPTION 'Linked customer journey has no positive net capture evidence';END IF;
  INSERT INTO public.ac_sc_purchase_lines(purchase_id,supplier_offer_id,journey_id,quantity,unit_cost,description)
  VALUES(v_id,v_aux,nullif(p_payload->>'journeyId','')::uuid,(p_payload->>'quantity')::numeric,(p_payload->>'unitCost')::numeric,coalesce(p_payload->>'description',''))
  RETURNING id INTO v_aux;
  UPDATE public.ac_sc_purchase_orders SET revision=revision+1,updated_at=now() WHERE id=v_id;
  v_result:=jsonb_build_object('id',v_aux,'purchaseId',v_id);
 WHEN 'purchase.transition' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  SELECT status,created_by INTO v_ref,v_owner FROM public.ac_sc_purchase_orders WHERE id=v_id FOR UPDATE;
  IF p_payload ? 'revision' AND EXISTS(SELECT 1 FROM public.ac_sc_purchase_orders WHERE id=v_id AND revision<>(p_payload->>'revision')::integer) THEN RAISE EXCEPTION 'Stale purchase revision - refresh first'; END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase not found';END IF;
  IF NOT ((v_ref='draft' AND v_status IN('review','cancelled')) OR
    (v_ref='review' AND v_status IN('approved','draft','cancelled')) OR
    (v_ref='approved' AND v_status IN('issued','cancelled')) OR
    (v_ref='issued' AND v_status IN('accepted','cancelled')) OR
    (v_ref='accepted' AND v_status IN('shipped','cancelled')) OR
    (v_ref='shipped' AND v_status='received')) THEN RAISE EXCEPTION 'Forbidden PO status transition % -> %',v_ref,v_status;END IF;
  IF v_status IN('review','approved','issued') AND NOT EXISTS(SELECT 1 FROM public.ac_sc_purchase_lines WHERE purchase_id=v_id) THEN RAISE EXCEPTION 'Purchase has no line';END IF;
  IF v_status='approved' AND v_owner=p_actor THEN RAISE EXCEPTION 'Independent approver required';END IF;
  UPDATE public.ac_sc_purchase_orders SET status=v_status,revision=revision+1,updated_at=now(),
    approved_by=CASE WHEN v_status='approved' THEN p_actor ELSE approved_by END,
    approved_at=CASE WHEN v_status='approved' THEN now() ELSE approved_at END,
    issued_at=CASE WHEN v_status='issued' THEN now() ELSE issued_at END WHERE id=v_id;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'availability.record' THEN
  v_id:=(p_payload->>'offerId')::uuid;
  IF p_payload->>'status'='verified' THEN RAISE EXCEPTION 'Supplier cannot self-verify stock; use separate compliance approval';END IF;
  INSERT INTO public.ac_sc_availability(supplier_offer_id,announced_qty,location,observed_at,valid_until,status,proof,operator_id)
  VALUES(v_id,(p_payload->>'quantity')::numeric,p_payload->>'location',
   coalesce(nullif(p_payload->>'observedAt','')::timestamptz,now()),(p_payload->>'expiresAt')::timestamptz,
   coalesce(nullif(p_payload->>'status',''),'declared'),coalesce(p_payload->>'proof',''),p_actor) RETURNING id INTO v_aux;
  v_result:=jsonb_build_object('id',v_aux);
 WHEN 'availability.verify' THEN
  v_id:=(p_payload->>'id')::uuid;
  SELECT operator_id,status INTO v_owner,v_status FROM public.ac_sc_availability WHERE id=v_id FOR UPDATE;
  IF NOT FOUND OR v_status<>'declared' THEN RAISE EXCEPTION 'Declared availability required';END IF;
  IF v_owner=p_actor THEN RAISE EXCEPTION 'Independent availability verifier required'; END IF;
  IF length(btrim(coalesce(p_payload->>'proof','')))<4 THEN RAISE EXCEPTION 'Verification proof reference required';END IF;
  UPDATE public.ac_sc_availability SET status='verified',proof=p_payload->>'proof',verified_by=p_actor,verified_at=now() WHERE id=v_id;
  v_result:=jsonb_build_object('id',v_id,'status','verified');
 WHEN 'shipment.create' THEN
  v_id:=(p_payload->>'purchaseId')::uuid;
  IF NOT EXISTS(SELECT 1 FROM public.ac_sc_purchase_orders WHERE id=v_id AND status IN('issued','accepted','shipped')) THEN RAISE EXCEPTION 'Purchase order must be issued';END IF;
  INSERT INTO public.ac_sc_shipments(purchase_id,journey_id,carrier,tracking_number,origin,destination,expected_at,created_by)
  VALUES(v_id,nullif(p_payload->>'journeyId','')::uuid,p_payload->>'carrier',p_payload->>'tracking',p_payload->>'origin',p_payload->>'destination',nullif(p_payload->>'expected','')::timestamptz,p_actor)
  RETURNING id,reference INTO v_aux,v_ref;
  INSERT INTO public.ac_sc_shipment_events(shipment_id,event_status,notes,operator_id) VALUES(v_aux,'preparing','Created',p_actor);
  v_result:=jsonb_build_object('id',v_aux,'reference',v_ref);
 WHEN 'shipment.transition' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  SELECT status INTO v_ref FROM public.ac_sc_shipments WHERE id=v_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found';END IF;
  IF v_status='delivered' AND length(btrim(coalesce(p_payload->>'proof','')))<4 THEN RAISE EXCEPTION 'Delivery proof required';END IF;
  IF NOT ((v_ref='preparing' AND v_status IN('dispatched','exception')) OR
    (v_ref='dispatched' AND v_status IN('in_transit','exception')) OR
    (v_ref='in_transit' AND v_status IN('delivered','exception')) OR
    (v_ref='exception' AND v_status IN('preparing','in_transit'))) THEN RAISE EXCEPTION 'Shipment transition denied';END IF;
  UPDATE public.ac_sc_shipments SET status=v_status,carrier=coalesce(p_payload->>'carrier',carrier),
    tracking_number=coalesce(p_payload->>'tracking',tracking_number),
    proof=coalesce(nullif(p_payload->>'proof',''),proof),
    delivered_at=CASE WHEN v_status='delivered' THEN now() ELSE delivered_at END,updated_at=now() WHERE id=v_id;
  INSERT INTO public.ac_sc_shipment_events(shipment_id,event_status,notes,operator_id) VALUES(v_id,v_status,coalesce(p_reason,''),p_actor);
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 WHEN 'task.create' THEN
  INSERT INTO public.ac_sc_tasks(supplier_id,title,priority,due_on,owner,created_by)
  VALUES(nullif(p_payload->>'supplierId','')::uuid,p_payload->>'title',coalesce(nullif(p_payload->>'priority',''),'medium'),nullif(p_payload->>'due','')::date,coalesce(p_payload->>'owner',''),p_actor)
  RETURNING id INTO v_id;v_result:=jsonb_build_object('id',v_id);
 WHEN 'task.transition' THEN
  v_id:=(p_payload->>'id')::uuid;v_status:=p_payload->>'status';
  IF v_status NOT IN('open','doing','done','cancelled') THEN RAISE EXCEPTION 'Invalid task status';END IF;
  UPDATE public.ac_sc_tasks SET status=v_status WHERE id=v_id RETURNING id INTO v_aux;
  IF v_aux IS NULL THEN RAISE EXCEPTION 'Task missing';END IF;
  v_result:=jsonb_build_object('id',v_id,'status',v_status);
 ELSE RAISE EXCEPTION 'Unknown command %',p_action;
 END CASE;
 INSERT INTO public.ac_sc_audit(request_key,actor_id,action,entity,entity_id,reason,after_value,result)
 VALUES(p_key,p_actor,p_action,split_part(p_action,'.',1),coalesce(v_result->>'id',v_result->>'offerId'),p_reason,p_payload,v_result);
 RETURN v_result;
END;$$;
REVOKE ALL ON FUNCTION public.ac_sc_command(text,text,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ac_sc_command(text,text,jsonb,text,text) TO service_role;
-- Private evidence bucket; service-only uploads and signed reads through authorized API.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('ac-sc360-private-evidence','ac-sc360-private-evidence',false,8388608,ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT(id) DO NOTHING;
COMMIT;
