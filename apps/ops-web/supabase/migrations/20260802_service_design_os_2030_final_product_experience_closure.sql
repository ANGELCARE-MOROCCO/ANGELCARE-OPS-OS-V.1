BEGIN;
SET LOCAL lock_timeout = '5min';
SET LOCAL statement_timeout = '0';
SELECT pg_advisory_xact_lock(84746008);
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF to_regclass('public.hsd_service_categories') IS NULL THEN
    RAISE EXCEPTION 'HomeService Service Design category baseline is missing.';
  END IF;
  IF to_regclass('public.hsd_factory_scenarios') IS NULL AND to_regclass('public.hsd_planning_scenarios') IS NULL THEN
    RAISE EXCEPTION 'Service Design scenario baseline is missing.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.hsd_px_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS public.hsd_px_workbench_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  workspace_key text NOT NULL, source_type text NOT NULL, source_id text, title text NOT NULL DEFAULT 'Workbench Service Design',
  state jsonb NOT NULL DEFAULT '{}'::jsonb, revision integer NOT NULL DEFAULT 1 CHECK (revision > 0), is_dirty boolean NOT NULL DEFAULT false,
  last_opened_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id,user_id,workspace_key)
);
CREATE TABLE IF NOT EXISTS public.hsd_px_timeline_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  draft_id uuid NOT NULL REFERENCES public.hsd_px_workbench_drafts(id) ON DELETE CASCADE, source_day_id text, service_date date,
  label text NOT NULL DEFAULT '', start_minute integer NOT NULL DEFAULT 480 CHECK(start_minute BETWEEN 0 AND 1439),
  end_minute integer NOT NULL DEFAULT 960 CHECK(end_minute BETWEEN 1 AND 1440 AND end_minute > start_minute), sort_order integer NOT NULL DEFAULT 100,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.hsd_px_timeline_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  day_id uuid NOT NULL REFERENCES public.hsd_px_timeline_days(id) ON DELETE CASCADE, source_activity_id text, source_code text,
  block_type text NOT NULL DEFAULT 'activity', label text NOT NULL, objective text NOT NULL DEFAULT '',
  start_minute integer NOT NULL CHECK(start_minute BETWEEN 0 AND 1439), duration_minutes integer NOT NULL DEFAULT 30 CHECK(duration_minutes BETWEEN 5 AND 1440),
  locked boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 100, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.hsd_px_scenario_compositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  request_id text, title text NOT NULL, source_scenario_ids text[] NOT NULL DEFAULT '{}', composition jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.hsd_px_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  entity_type text NOT NULL, entity_id text NOT NULL, label text NOT NULL, href text NOT NULL DEFAULT '', metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 100, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,user_id,entity_type,entity_id)
);
CREATE TABLE IF NOT EXISTS public.hsd_px_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  name text NOT NULL, scope text NOT NULL, filters jsonb NOT NULL DEFAULT '{}'::jsonb, presentation jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,user_id,scope,name)
);
CREATE TABLE IF NOT EXISTS public.hsd_px_recent_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  entity_type text NOT NULL, entity_id text NOT NULL, label text NOT NULL, href text NOT NULL DEFAULT '', metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_opened_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,user_id,entity_type,entity_id)
);
CREATE TABLE IF NOT EXISTS public.hsd_px_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  entity_type text NOT NULL, entity_id text NOT NULL, anchor jsonb NOT NULL DEFAULT '{}'::jsonb, body text NOT NULL,
  resolved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.hsd_px_document_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  source_type text NOT NULL, source_id text, template_id text NOT NULL, document_reference text NOT NULL, title text NOT NULL,
  file_name text NOT NULL, checksum_sha256 text, settings jsonb NOT NULL DEFAULT '{}'::jsonb, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.hsd_px_operation_history (
  id bigserial PRIMARY KEY, tenant_id text NOT NULL DEFAULT 'angelcare-main', user_id text NOT NULL,
  draft_id uuid NOT NULL REFERENCES public.hsd_px_workbench_drafts(id) ON DELETE CASCADE, action text NOT NULL, snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hsd_px_drafts_user ON public.hsd_px_workbench_drafts(tenant_id,user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hsd_px_days_draft ON public.hsd_px_timeline_days(draft_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_hsd_px_blocks_day ON public.hsd_px_timeline_blocks(day_id,start_minute);
CREATE INDEX IF NOT EXISTS idx_hsd_px_favorites_user ON public.hsd_px_favorites(tenant_id,user_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_hsd_px_views_user ON public.hsd_px_saved_views(tenant_id,user_id,scope,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hsd_px_recent_user ON public.hsd_px_recent_items(tenant_id,user_id,last_opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_hsd_px_documents_user ON public.hsd_px_document_registry(tenant_id,user_id,generated_at DESC);

DROP TRIGGER IF EXISTS trg_hsd_px_workbench_updated ON public.hsd_px_workbench_drafts;
CREATE TRIGGER trg_hsd_px_workbench_updated BEFORE UPDATE ON public.hsd_px_workbench_drafts FOR EACH ROW EXECUTE FUNCTION public.hsd_px_touch_updated_at();
DROP TRIGGER IF EXISTS trg_hsd_px_days_updated ON public.hsd_px_timeline_days;
CREATE TRIGGER trg_hsd_px_days_updated BEFORE UPDATE ON public.hsd_px_timeline_days FOR EACH ROW EXECUTE FUNCTION public.hsd_px_touch_updated_at();
DROP TRIGGER IF EXISTS trg_hsd_px_blocks_updated ON public.hsd_px_timeline_blocks;
CREATE TRIGGER trg_hsd_px_blocks_updated BEFORE UPDATE ON public.hsd_px_timeline_blocks FOR EACH ROW EXECUTE FUNCTION public.hsd_px_touch_updated_at();
DROP TRIGGER IF EXISTS trg_hsd_px_compositions_updated ON public.hsd_px_scenario_compositions;
CREATE TRIGGER trg_hsd_px_compositions_updated BEFORE UPDATE ON public.hsd_px_scenario_compositions FOR EACH ROW EXECUTE FUNCTION public.hsd_px_touch_updated_at();
DROP TRIGGER IF EXISTS trg_hsd_px_views_updated ON public.hsd_px_saved_views;
CREATE TRIGGER trg_hsd_px_views_updated BEFORE UPDATE ON public.hsd_px_saved_views FOR EACH ROW EXECUTE FUNCTION public.hsd_px_touch_updated_at();
DROP TRIGGER IF EXISTS trg_hsd_px_annotations_updated ON public.hsd_px_annotations;
CREATE TRIGGER trg_hsd_px_annotations_updated BEFORE UPDATE ON public.hsd_px_annotations FOR EACH ROW EXECUTE FUNCTION public.hsd_px_touch_updated_at();

ALTER TABLE public.hsd_px_workbench_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_timeline_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_timeline_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_scenario_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_recent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_document_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsd_px_operation_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.hsd_px_workbench_drafts, public.hsd_px_timeline_days, public.hsd_px_timeline_blocks,
 public.hsd_px_scenario_compositions, public.hsd_px_favorites, public.hsd_px_saved_views, public.hsd_px_recent_items,
 public.hsd_px_annotations, public.hsd_px_document_registry, public.hsd_px_operation_history FROM anon, authenticated;
GRANT ALL ON public.hsd_px_workbench_drafts, public.hsd_px_timeline_days, public.hsd_px_timeline_blocks,
 public.hsd_px_scenario_compositions, public.hsd_px_favorites, public.hsd_px_saved_views, public.hsd_px_recent_items,
 public.hsd_px_annotations, public.hsd_px_document_registry, public.hsd_px_operation_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.hsd_px_operation_history_id_seq TO service_role;

COMMIT;
