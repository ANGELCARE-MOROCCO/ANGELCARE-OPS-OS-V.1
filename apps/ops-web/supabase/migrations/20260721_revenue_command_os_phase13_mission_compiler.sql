BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code IN ('AC-REVENUE-OS-MZ12-STRATEGY-STUDIO','AC-REVENUE-OS-MZ13-MISSION-COMPILER') AND execution_mode='shadow' AND external_actions_enabled=false) THEN
    RAISE EXCEPTION 'MZ13 requires verified MZ12 Strategy Studio in Shadow mode';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_runs(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, objective_id uuid NOT NULL, strategy_id uuid NOT NULL, strategy_version text NOT NULL,
 approval_request_id uuid NOT NULL, approval_decision_id uuid NOT NULL, council_run_id uuid, compiler_version text NOT NULL,
 scope text NOT NULL, status text NOT NULL, idempotency_key text NOT NULL, source_hash text NOT NULL, output_hash text,
 requested_by text NOT NULL, previous_run_id uuid REFERENCES public.revenue_os_compilation_runs(id), external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
 payload jsonb NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_blueprints(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, approval_decision_id uuid NOT NULL, status text NOT NULL, output_hash text NOT NULL,
 ready_for_mz14 boolean NOT NULL DEFAULT false, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(compilation_run_id)
);

CREATE TABLE IF NOT EXISTS public.revenue_os_revenue_plays(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_programs(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_campaigns(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_campaign_waves(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_account_plans(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_missions(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_mission_tasks(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_task_steps(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compiled_scripts(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_evidence_requirements(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compiled_deadlines(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compiled_capacity_requirements(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid, capacity_type text, feasible boolean,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compiled_owners(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid, owner_id text, owner_role text, assignment_status text,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_assignment_eligibility(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_dependencies(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, from_object_id uuid, to_object_id uuid, dependency_kind text,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_approval_gates(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid, gate_type text, approval_class text, gate_status text,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_kpis(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_retry_rules(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_rescue_routes(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_stop_conditions(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_escalations(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, object_id uuid,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_conflicts(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, code text NOT NULL, status text NOT NULL, conflict_type text, severity text, blocking boolean NOT NULL DEFAULT false, object_ids uuid[], resolved_by text, resolved_at timestamptz,
 external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,code)
);

CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_versions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id) ON DELETE CASCADE,
 strategy_id uuid NOT NULL, strategy_version text NOT NULL, compiler_version text NOT NULL, output_hash text NOT NULL, status text NOT NULL,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,compilation_run_id,output_hash)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_deltas(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, from_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id), to_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id),
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,from_run_id,to_run_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_rollbacks(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id), target_run_id uuid REFERENCES public.revenue_os_compilation_runs(id),
 actor_id text NOT NULL, reason text NOT NULL, status text NOT NULL DEFAULT 'completed', external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_compilation_audit_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id), strategy_id uuid NOT NULL,
 action text NOT NULL, actor_id text NOT NULL, idempotency_key text, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_propagation_packages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id), strategy_id uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('prepared_shadow','superseded','cancelled')), idempotency_key text NOT NULL, external_actions integer NOT NULL DEFAULT 0 CHECK(external_actions=0),
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);

CREATE INDEX IF NOT EXISTS revenue_os_compilation_run_strategy_idx ON public.revenue_os_compilation_runs(tenant_id,strategy_id,strategy_version,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_compilation_run_status_idx ON public.revenue_os_compilation_runs(tenant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_compilation_blueprint_ready_idx ON public.revenue_os_compilation_blueprints(tenant_id,ready_for_mz14,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_compilation_dependency_idx ON public.revenue_os_compilation_dependencies(tenant_id,compilation_run_id,from_object_id,to_object_id);
CREATE INDEX IF NOT EXISTS revenue_os_compilation_conflict_idx ON public.revenue_os_compilation_conflicts(tenant_id,compilation_run_id,blocking,status);
CREATE INDEX IF NOT EXISTS revenue_os_compiled_owner_idx ON public.revenue_os_compiled_owners(tenant_id,compilation_run_id,owner_id,assignment_status);
CREATE INDEX IF NOT EXISTS revenue_os_compilation_gate_idx ON public.revenue_os_compilation_approval_gates(tenant_id,compilation_run_id,gate_status);
CREATE INDEX IF NOT EXISTS revenue_os_propagation_package_idx ON public.revenue_os_propagation_packages(tenant_id,status,created_at DESC);

CREATE OR REPLACE FUNCTION public.revenue_os_mz13_immutable_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'MZ13 immutable compiler record cannot be modified or deleted'; END $$;
DROP TRIGGER IF EXISTS revenue_os_compilation_versions_immutable ON public.revenue_os_compilation_versions;
CREATE TRIGGER revenue_os_compilation_versions_immutable BEFORE UPDATE OR DELETE ON public.revenue_os_compilation_versions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_mz13_immutable_guard();
DROP TRIGGER IF EXISTS revenue_os_compilation_audit_immutable ON public.revenue_os_compilation_audit_events;
CREATE TRIGGER revenue_os_compilation_audit_immutable BEFORE UPDATE OR DELETE ON public.revenue_os_compilation_audit_events FOR EACH ROW EXECUTE FUNCTION public.revenue_os_mz13_immutable_guard();

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['revenue_os_compilation_runs','revenue_os_compilation_blueprints','revenue_os_revenue_plays','revenue_os_programs','revenue_os_campaigns','revenue_os_campaign_waves','revenue_os_account_plans','revenue_os_missions','revenue_os_mission_tasks','revenue_os_task_steps','revenue_os_compiled_scripts','revenue_os_evidence_requirements','revenue_os_compiled_deadlines','revenue_os_compiled_capacity_requirements','revenue_os_compiled_owners','revenue_os_assignment_eligibility','revenue_os_compilation_dependencies','revenue_os_compilation_approval_gates','revenue_os_compilation_kpis','revenue_os_compilation_retry_rules','revenue_os_compilation_rescue_routes','revenue_os_compilation_stop_conditions','revenue_os_compilation_escalations','revenue_os_compilation_conflicts','revenue_os_compilation_versions','revenue_os_compilation_deltas','revenue_os_compilation_rollbacks','revenue_os_compilation_audit_events','revenue_os_propagation_packages'] LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
   EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',t);
 END LOOP;
END $$;


INSERT INTO public.revenue_os_permission_registry(permission_key,label,description,risk_class,phase_introduced,active) VALUES
('revenue_os.mission_compiler.view','Revenue OS — Mission Compiler','Consulter les compilations et packages opérationnels MZ13.','controlled',13,true),
('revenue_os.mission_compiler.compile','Revenue OS — Compiler une stratégie','Compiler une stratégie approuvée en travail opérationnel complet.','restricted',13,true),
('revenue_os.mission_compiler.recompile','Revenue OS — Recompiler','Exécuter recompilation complète ou partielle avec delta.','restricted',13,true),
('revenue_os.mission_compiler.resolve','Revenue OS — Résoudre compilation','Résoudre conflits, propriétaires et contraintes de compilation.','restricted',13,true),
('revenue_os.mission_compiler.rollback','Revenue OS — Rollback compilation','Restaurer une version de compilation antérieure.','restricted',13,true),
('revenue_os.mission_compiler.prepare_propagation','Revenue OS — Préparer MZ14','Préparer un package Shadow sans action externe.','restricted',13,true)
ON CONFLICT(permission_key) DO UPDATE SET label=excluded.label,description=excluded.description,risk_class=excluded.risk_class,phase_introduced=excluded.phase_introduced,active=true,updated_at=now();

INSERT INTO public.revenue_os_workspaces(workspace_key,label,short_label,description,href,icon,display_order,permission_key,maturity_status,accent,contract_scope,active) VALUES
('mission-compiler','Strategy-to-Mission Compiler','Compiler MZ13','Compilation déterministe des stratégies approuvées en programmes, campagnes, waves, missions, tâches, preuves, KPIs et contrôles.','/revenue-command-os/mission-compiler','GitBranch',62,'revenue_os.mission_compiler.view','ready','cyan','["Revenue Plays","Programmes","Campagnes","Waves","Plans de comptes","Missions","Tâches","Dépendances","KPIs","Rollback"]',true)
ON CONFLICT(workspace_key) DO UPDATE SET label=excluded.label,short_label=excluded.short_label,description=excluded.description,href=excluded.href,icon=excluded.icon,display_order=excluded.display_order,permission_key=excluded.permission_key,maturity_status=excluded.maturity_status,accent=excluded.accent,contract_scope=excluded.contract_scope,active=true,updated_at=now();

UPDATE public.revenue_os_installations SET release_code='AC-REVENUE-OS-MZ13-MISSION-COMPILER',module_version='13.0.0',execution_mode='shadow',contract_locked=true,external_actions_enabled=false,
 metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('currentPhase','MZ13','missionCompiler',true,'deterministicCompilation',true,'externalActions',0,'propagationEnabled',false,'nextPhase','MZ14'),updated_at=now()
WHERE installation_key='revenue-command-os';

DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('revenue_os_compilation_runs','revenue_os_compilation_blueprints','revenue_os_revenue_plays','revenue_os_programs','revenue_os_campaigns','revenue_os_campaign_waves','revenue_os_account_plans','revenue_os_missions','revenue_os_mission_tasks','revenue_os_task_steps','revenue_os_compiled_scripts','revenue_os_evidence_requirements','revenue_os_compiled_deadlines','revenue_os_compiled_capacity_requirements','revenue_os_compiled_owners','revenue_os_assignment_eligibility','revenue_os_compilation_dependencies','revenue_os_compilation_approval_gates','revenue_os_compilation_kpis','revenue_os_compilation_retry_rules','revenue_os_compilation_rescue_routes','revenue_os_compilation_stop_conditions','revenue_os_compilation_escalations','revenue_os_compilation_conflicts','revenue_os_compilation_versions','revenue_os_compilation_deltas','revenue_os_compilation_rollbacks','revenue_os_compilation_audit_events','revenue_os_propagation_packages'))<>29 THEN RAISE EXCEPTION 'MZ13 requires 29 compiler tables'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code='AC-REVENUE-OS-MZ13-MISSION-COMPILER' AND execution_mode='shadow' AND external_actions_enabled=false) THEN RAISE EXCEPTION 'MZ13 installation registry assertion failed'; END IF;
 IF EXISTS(SELECT 1 FROM public.revenue_os_propagation_packages WHERE external_actions<>0) THEN RAISE EXCEPTION 'MZ13 external action violation'; END IF;
END $$;
COMMIT;
