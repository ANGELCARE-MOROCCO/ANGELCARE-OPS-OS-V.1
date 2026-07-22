BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_studio_sessions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, strategy_id uuid NOT NULL,
  strategy_version text NOT NULL CHECK(length(strategy_version)>0), actor_id text NOT NULL, status text NOT NULL DEFAULT 'under_review',
  current_workspace text NOT NULL DEFAULT 'executive_overview', idempotency_key text NOT NULL,
  external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_executive_reviews(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, action text NOT NULL, previous_status text NOT NULL, new_status text NOT NULL,
  idempotency_key text NOT NULL, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_approval_requests(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  approval_class text NOT NULL, status text NOT NULL, requested_by text NOT NULL, idempotency_key text NOT NULL,
  expires_at timestamptz, ready_for_mz13 boolean NOT NULL DEFAULT false,
  external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_approval_requirements(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, request_id uuid NOT NULL REFERENCES public.revenue_os_approval_requests(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL, strategy_version text NOT NULL, approval_class text NOT NULL, status text NOT NULL,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_approval_decisions(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, request_id uuid, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text, decision text NOT NULL, status text NOT NULL DEFAULT 'final', external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_approval_conditions(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, request_id uuid NOT NULL REFERENCES public.revenue_os_approval_requests(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL, strategy_version text NOT NULL, condition_type text NOT NULL, status text NOT NULL,
  machine_readable boolean NOT NULL DEFAULT true CHECK(machine_readable=true), payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_amendments(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  source_version text NOT NULL, resulting_version text NOT NULL, actor_id text NOT NULL, status text NOT NULL,
  external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_reanalysis_requests(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_evidence_requests(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_objective_change_requests(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, objective_id uuid NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_constraint_changes(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_approval_class_changes(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, approval_class text NOT NULL, status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_studio_combinations(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  source_strategy_ids uuid[] NOT NULL CHECK(cardinality(source_strategy_ids)>=1), resulting_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_executive_memos(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  memo_version text NOT NULL, status text NOT NULL, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,strategy_id,strategy_version,memo_version)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_memo_versions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, memo_id uuid NOT NULL REFERENCES public.revenue_os_executive_memos(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL, strategy_version text NOT NULL, version text NOT NULL, payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(memo_id,version)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_archives(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL DEFAULT 'archived', external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_reopenings(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  actor_id text NOT NULL, status text NOT NULL DEFAULT 'reopened', external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_strategy_studio_audit_events(
  id uuid PRIMARY KEY, tenant_id text NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
  action text NOT NULL, actor_id text NOT NULL, idempotency_key text, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);

CREATE INDEX IF NOT EXISTS revenue_os_studio_strategy_idx ON public.revenue_os_executive_reviews(tenant_id,strategy_id,strategy_version,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_approval_queue_idx ON public.revenue_os_approval_requests(tenant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_approval_decision_idx ON public.revenue_os_approval_decisions(tenant_id,strategy_id,strategy_version,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_condition_status_idx ON public.revenue_os_approval_conditions(tenant_id,request_id,status);
CREATE INDEX IF NOT EXISTS revenue_os_memo_strategy_idx ON public.revenue_os_executive_memos(tenant_id,strategy_id,strategy_version,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_studio_audit_idx ON public.revenue_os_strategy_studio_audit_events(tenant_id,strategy_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.revenue_os_mz12_immutable_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'MZ12 immutable executive record cannot be modified or deleted'; END $$;
DROP TRIGGER IF EXISTS revenue_os_approval_decisions_immutable ON public.revenue_os_approval_decisions;
CREATE TRIGGER revenue_os_approval_decisions_immutable BEFORE UPDATE OR DELETE ON public.revenue_os_approval_decisions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_mz12_immutable_guard();
DROP TRIGGER IF EXISTS revenue_os_memo_versions_immutable ON public.revenue_os_memo_versions;
CREATE TRIGGER revenue_os_memo_versions_immutable BEFORE UPDATE OR DELETE ON public.revenue_os_memo_versions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_mz12_immutable_guard();

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'revenue_os_strategy_studio_sessions','revenue_os_executive_reviews','revenue_os_approval_requests',
    'revenue_os_approval_requirements','revenue_os_approval_decisions','revenue_os_approval_conditions',
    'revenue_os_strategy_amendments','revenue_os_reanalysis_requests','revenue_os_evidence_requests',
    'revenue_os_objective_change_requests','revenue_os_constraint_changes','revenue_os_approval_class_changes',
    'revenue_os_strategy_studio_combinations','revenue_os_executive_memos','revenue_os_memo_versions',
    'revenue_os_strategy_archives','revenue_os_strategy_reopenings','revenue_os_strategy_studio_audit_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;

INSERT INTO public.revenue_os_permission_registry(permission_key,label,description,risk_class,phase_introduced) VALUES
('revenue_os.validation_council.view','Revenue OS — Conseil MZ11','Consulter et opérer le Conseil de validation stratégique.','restricted',11),
('revenue_os.strategy_studio.view','Revenue OS — Strategy Studio','Consulter le dossier exécutif de stratégie.','controlled',12),
('revenue_os.strategy_studio.approve','Revenue OS — Approbation stratégique','Prendre une décision exécutive sur une version immuable.','restricted',12)
ON CONFLICT(permission_key) DO UPDATE SET label=excluded.label,description=excluded.description,risk_class=excluded.risk_class,active=true,updated_at=now();
UPDATE public.revenue_os_workspaces SET active=false,updated_at=now() WHERE workspace_key='strategies';
INSERT INTO public.revenue_os_workspaces(workspace_key,label,short_label,description,href,icon,display_order,permission_key,maturity_status,accent,contract_scope,active) VALUES
('strategy-engine','Strategy Brain','Stratégies','Assemblage Gemini de stratégies concurrentes, scénarios, hypothèses, risques et versions.','/revenue-command-os/strategy-engine','Workflow',50,'revenue_os.strategy.manage','ready','violet','["Objectifs","Contexte","Commandes","Alternatives","Scénarios","Versioning"]',true),
('validation-council','Conseil de validation','Conseil MZ11','Dix spécialistes indépendants valident, attaquent, corrigent et classent chaque stratégie.','/revenue-command-os/validation-council','ShieldCheck',55,'revenue_os.validation_council.view','ready','amber','["Preuves","Marché","Offre","Conversion","Capacité","Marge","Red Team","Audit"]',true),
('strategy-studio','Strategy Studio','Studio MZ12','Workspace exécutif de compréhension, simulation, décision, approbation et note de décision.','/revenue-command-os/strategy-studio','BadgeCheck',58,'revenue_os.strategy_studio.view','ready','green','["Comparaison","Preuves","Red Team","Simulations","Approbations","Versions","Mémo"]',true)
ON CONFLICT(workspace_key) DO UPDATE SET label=excluded.label,short_label=excluded.short_label,description=excluded.description,href=excluded.href,icon=excluded.icon,display_order=excluded.display_order,permission_key=excluded.permission_key,maturity_status=excluded.maturity_status,accent=excluded.accent,contract_scope=excluded.contract_scope,active=true,updated_at=now();

UPDATE public.revenue_os_installations
SET release_code='AC-REVENUE-OS-MZ12-STRATEGY-STUDIO',module_version='12.0.0',execution_mode='shadow',contract_locked=true,
external_actions_enabled=false,metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
  'currentPhase','MZ12','strategyStudio',true,'mandatoryWorkspaces',14,'implementedWorkspaces',16,
  'mandatoryActions',12,'humanApprovalOnly',true,'externalActions',0,'nextPhase','MZ13'
),updated_at=now()
WHERE installation_key='revenue-command-os';

DO $$ BEGIN
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN (
    'revenue_os_strategy_studio_sessions','revenue_os_executive_reviews','revenue_os_approval_requests','revenue_os_approval_requirements',
    'revenue_os_approval_decisions','revenue_os_approval_conditions','revenue_os_strategy_amendments','revenue_os_reanalysis_requests',
    'revenue_os_evidence_requests','revenue_os_objective_change_requests','revenue_os_constraint_changes','revenue_os_approval_class_changes',
    'revenue_os_strategy_studio_combinations','revenue_os_executive_memos','revenue_os_memo_versions','revenue_os_strategy_archives',
    'revenue_os_strategy_reopenings','revenue_os_strategy_studio_audit_events'))<>18 THEN RAISE EXCEPTION 'MZ12 requires 18 strategy studio tables'; END IF;
  IF (SELECT count(*) FROM public.revenue_os_council_agents WHERE status='active')<>10 THEN RAISE EXCEPTION 'MZ11 prerequisite requires 10 active agents'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code='AC-REVENUE-OS-MZ12-STRATEGY-STUDIO' AND execution_mode='shadow' AND external_actions_enabled=false) THEN RAISE EXCEPTION 'MZ12 installation registry assertion failed'; END IF;
END $$;
COMMIT;
