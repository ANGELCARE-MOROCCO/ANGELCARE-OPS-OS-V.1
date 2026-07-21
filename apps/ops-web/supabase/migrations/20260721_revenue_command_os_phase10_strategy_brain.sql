BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_objectives (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_objectives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_objectives FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_objectives TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_objective_constraints (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_objective_constraints ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_objective_constraints FROM anon, authenticated;
GRANT ALL ON public.revenue_os_objective_constraints TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_context_snapshots (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_context_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_context_snapshots FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_context_snapshots TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_assembly_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_assembly_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_assembly_runs FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_assembly_runs TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_command_candidates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_command_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_command_candidates FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_command_candidates TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_command_selections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_command_selections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_command_selections FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_command_selections TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategies FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategies TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_versions FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_versions TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_components (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_components ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_components FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_components TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_scenarios (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_scenarios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_scenarios FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_scenarios TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_assumptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_assumptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_assumptions FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_assumptions TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_risks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_risks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_risks FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_risks TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_fallbacks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_fallbacks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_fallbacks FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_fallbacks TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_stop_conditions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_stop_conditions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_stop_conditions FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_stop_conditions TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_evidence_links (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_evidence_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_evidence_links FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_evidence_links TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_resource_requirements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_resource_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_resource_requirements FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_resource_requirements TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_capacity_requirements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_capacity_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_capacity_requirements FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_capacity_requirements TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_predictions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_predictions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_predictions FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_predictions TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_comparisons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_comparisons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_comparisons FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_comparisons TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_comparison_scores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_comparison_scores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_comparison_scores FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_comparison_scores TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_combinations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_combinations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_combinations FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_combinations TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_combination_lineage (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_combination_lineage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_combination_lineage FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_combination_lineage TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_tool_traces (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_tool_traces ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_tool_traces FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_tool_traces TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_model_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_model_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_model_runs FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_model_runs TO service_role;
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, objective_id uuid, strategy_id uuid, status text NOT NULL DEFAULT 'draft', payload jsonb NOT NULL DEFAULT '{}'::jsonb, version integer NOT NULL DEFAULT 1, source_hash text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.revenue_os_strategy_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_strategy_audit_events FROM anon, authenticated;
GRANT ALL ON public.revenue_os_strategy_audit_events TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS revenue_os_strategy_objective_tenant_hash_uq ON public.revenue_os_strategy_objectives(tenant_id,source_hash) WHERE source_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS revenue_os_strategies_objective_idx ON public.revenue_os_strategies(tenant_id,objective_id,status);
CREATE INDEX IF NOT EXISTS revenue_os_strategy_audit_idx ON public.revenue_os_strategy_audit_events(tenant_id,strategy_id,created_at DESC);
INSERT INTO public.revenue_os_installations (
  installation_key,
  contract_version,
  release_code,
  module_version,
  environment,
  execution_mode,
  contract_locked,
  external_actions_enabled,
  metadata
) VALUES (
  'revenue-command-os',
  'AC-REVENUE-OS-CANONICAL-2026.07',
  'AC-REVENUE-OS-MZ10-STRATEGY-BRAIN',
  '10.0.0-phase10',
  'production',
  'shadow',
  true,
  false,
  jsonb_build_object(
    'currentPhase','MZ10',
    'strategyBrain',true,
    'minimumCompetingStrategies',5,
    'commandLibrary',3000,
    'externalActions',false
  )
) ON CONFLICT (installation_key) DO UPDATE SET
  contract_version = excluded.contract_version,
  release_code = excluded.release_code,
  module_version = excluded.module_version,
  environment = excluded.environment,
  execution_mode = 'shadow',
  contract_locked = true,
  external_actions_enabled = false,
  metadata = public.revenue_os_installations.metadata || excluded.metadata,
  updated_at = timezone('utc', now());
COMMIT;
