-- ANGELCARE Revenue Command OS
-- Final Operational Depth, Synchronization & Product Closure
-- Deadlock-resistant, resumable, idempotent, trusted-operator LIVE architecture.
-- IMPORTANT: do not wrap this complete file in another BEGIN/COMMIT.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 01 · Backup the installation contract before mutation.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
CREATE TABLE IF NOT EXISTS public.revenue_os_operational_depth_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_code text NOT NULL,
  table_name text NOT NULL,
  row_key text NOT NULL,
  row_payload jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(migration_code, table_name, row_key)
);
ALTER TABLE public.revenue_os_operational_depth_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_operational_depth_backups FROM anon, authenticated;
GRANT ALL ON public.revenue_os_operational_depth_backups TO service_role;
INSERT INTO public.revenue_os_operational_depth_backups(migration_code, table_name, row_key, row_payload)
SELECT 'AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 'revenue_os_installations', installation_key, to_jsonb(i)
FROM public.revenue_os_installations i
WHERE installation_key = 'revenue-command-os'
ON CONFLICT DO NOTHING;
COMMIT;

-- 02 · Permit manually-authored programs without compiler foreign keys.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
LOCK TABLE public.revenue_os_programs IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.revenue_os_programs ALTER COLUMN compilation_run_id DROP NOT NULL;
ALTER TABLE public.revenue_os_programs ALTER COLUMN strategy_id DROP NOT NULL;
COMMIT;

-- 03 · Permit manually-authored missions without compiler foreign keys.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
LOCK TABLE public.revenue_os_missions IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.revenue_os_missions ALTER COLUMN compilation_run_id DROP NOT NULL;
ALTER TABLE public.revenue_os_missions ALTER COLUMN strategy_id DROP NOT NULL;
COMMIT;

-- 04 · Permit manually-authored tasks without compiler foreign keys.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
LOCK TABLE public.revenue_os_mission_tasks IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.revenue_os_mission_tasks ALTER COLUMN compilation_run_id DROP NOT NULL;
ALTER TABLE public.revenue_os_mission_tasks ALTER COLUMN strategy_id DROP NOT NULL;
COMMIT;

-- 05 · Canonical cross-workspace entity graph.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
CREATE TABLE IF NOT EXISTS public.revenue_os_entity_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  from_type text NOT NULL CHECK (from_type IN ('objective','strategy','program','mission','task','exception','signal','resource','command','action','outcome','doctrine')),
  from_id text NOT NULL,
  to_type text NOT NULL CHECK (to_type IN ('objective','strategy','program','mission','task','exception','signal','resource','command','action','outcome','doctrine')),
  to_id text NOT NULL,
  relation_kind text NOT NULL DEFAULT 'related',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, from_type, from_id, to_type, to_id, relation_kind)
);
CREATE INDEX IF NOT EXISTS revenue_os_entity_relations_from_idx
  ON public.revenue_os_entity_relations(tenant_id, from_type, from_id, created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_entity_relations_to_idx
  ON public.revenue_os_entity_relations(tenant_id, to_type, to_id, created_at DESC);
COMMIT;

-- 06 · Operational notes, evidence, milestones, KPIs, account links and recovery work.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
CREATE TABLE IF NOT EXISTS public.revenue_os_entity_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('objective','strategy','program','mission','task','exception')),
  entity_id text NOT NULL,
  note_kind text NOT NULL CHECK (note_kind IN ('comment','evidence','milestone','kpi','account','result','checklist','recovery','decision')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','running','completed','failed','cancelled','archived')),
  owner_id text,
  due_at timestamptz,
  value_numeric numeric,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS revenue_os_entity_notes_entity_idx
  ON public.revenue_os_entity_notes(tenant_id, entity_type, entity_id, note_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_entity_notes_due_idx
  ON public.revenue_os_entity_notes(tenant_id, status, due_at) WHERE due_at IS NOT NULL;
COMMIT;

-- 07 · Saved operational views.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
CREATE TABLE IF NOT EXISTS public.revenue_os_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  workspace_key text NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  density text NOT NULL DEFAULT 'comfortable' CHECK (density IN ('compact','comfortable')),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, workspace_key, name)
);
COMMIT;

-- 08 · Revenue outcomes and attribution evidence.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
CREATE TABLE IF NOT EXISTS public.revenue_os_outcome_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('objective','strategy','program','mission','task','exception')),
  entity_id text NOT NULL,
  outcome_type text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft','observed','confirmed','disputed','archived')),
  revenue_value_dh numeric NOT NULL DEFAULT 0,
  margin_value_dh numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 1 CHECK (confidence >= 0 AND confidence <= 1),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_by text,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS revenue_os_outcome_records_entity_idx
  ON public.revenue_os_outcome_records(tenant_id, entity_type, entity_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_outcome_records_value_idx
  ON public.revenue_os_outcome_records(tenant_id, status, revenue_value_dh DESC, observed_at DESC);
COMMIT;

-- 09 · Service-only access; application access remains server-mediated and tenant-filtered.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
DO $$
DECLARE item text;
BEGIN
  FOREACH item IN ARRAY ARRAY[
    'revenue_os_entity_relations',
    'revenue_os_entity_notes',
    'revenue_os_saved_views',
    'revenue_os_outcome_records'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', item);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', item);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', item);
  END LOOP;
END $$;
COMMIT;

-- 10 · Activate the final product contract.
BEGIN;
SET LOCAL lock_timeout = '20s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(hashtextextended('AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE', 0));
UPDATE public.revenue_os_installations
SET
  release_code = 'AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE',
  module_version = '18.0.0-operational-depth',
  execution_mode = 'live',
  contract_locked = false,
  external_actions_enabled = true,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'currentPhase', 'FINAL_OPERATIONAL_DEPTH',
    'operationalDepth', true,
    'entityGraph', true,
    'workspaceSynchronization', true,
    'programPortfolio', true,
    'missionTaskBoard', true,
    'exceptionRecovery', true,
    'serverActionCenter', true,
    'commandScheduleStudio', true,
    'aiResourceOperations', true,
    'publicationDesk', true,
    'approvalGates', false,
    'shadowMode', false,
    'governanceHolds', false,
    'closedAt', to_jsonb(timezone('utc', now()))
  ),
  updated_at = timezone('utc', now())
WHERE installation_key = 'revenue-command-os';
COMMIT;

-- 11 · Final assertions.
DO $$
BEGIN
  IF to_regclass('public.revenue_os_entity_relations') IS NULL THEN RAISE EXCEPTION 'ENTITY_RELATIONS_MISSING'; END IF;
  IF to_regclass('public.revenue_os_entity_notes') IS NULL THEN RAISE EXCEPTION 'ENTITY_NOTES_MISSING'; END IF;
  IF to_regclass('public.revenue_os_saved_views') IS NULL THEN RAISE EXCEPTION 'SAVED_VIEWS_MISSING'; END IF;
  IF to_regclass('public.revenue_os_outcome_records') IS NULL THEN RAISE EXCEPTION 'OUTCOME_RECORDS_MISSING'; END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('revenue_os_programs','revenue_os_missions','revenue_os_mission_tasks')
      AND column_name IN ('compilation_run_id','strategy_id')
      AND is_nullable = 'NO'
  ) THEN RAISE EXCEPTION 'MANUAL_OPERATIONAL_ENTITY_COLUMNS_STILL_BLOCKED'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.revenue_os_installations
    WHERE installation_key = 'revenue-command-os'
      AND release_code = 'AC-RCOS-FINAL-OPERATIONAL-DEPTH-CLOSURE'
      AND module_version = '18.0.0-operational-depth'
      AND execution_mode = 'live'
      AND contract_locked = false
      AND external_actions_enabled = true
  ) THEN RAISE EXCEPTION 'OPERATIONAL_DEPTH_INSTALLATION_NOT_ACTIVE'; END IF;
END $$;

SELECT 'OPERATIONAL_DEPTH_DATABASE_APPLIED' AS result, timezone('utc', now()) AS applied_at;
