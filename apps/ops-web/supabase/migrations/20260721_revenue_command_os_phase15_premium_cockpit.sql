-- ANGELCARE Revenue Command OS — MZ15 Premium Revenue Command Cockpit
-- Cumulative over MZ01–MZ14. Additive, idempotent, service-side controlled.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.revenue_os_installations
    WHERE installation_key='revenue-command-os'
      AND release_code IN ('AC-REVENUE-OS-MZ14-PROPAGATION-AUTOPILOT','AC-REVENUE-OS-MZ15-PREMIUM-COCKPIT')
      AND contract_locked=true
  ) THEN
    RAISE EXCEPTION 'MZ15 requires the sealed MZ14 Revenue Execution Autopilot baseline';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL,
  role_view text NOT NULL CHECK(role_view IN ('executive','commercial','operations','finance','agent')),
  owner_id text NOT NULL,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, user_id text NOT NULL,
  default_role_view text NOT NULL DEFAULT 'executive' CHECK(default_role_view IN ('executive','commercial','operations','finance','agent')),
  refresh_seconds integer NOT NULL DEFAULT 30 CHECK(refresh_seconds BETWEEN 10 AND 300),
  density text NOT NULL DEFAULT 'comfortable' CHECK(density IN ('compact','comfortable','executive')),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, role_view text NOT NULL,
  source_hash text NOT NULL, generated_at timestamptz NOT NULL, payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_executive_briefs (
  id uuid PRIMARY KEY, tenant_id text NOT NULL, version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'generated' CHECK(status IN ('generated','reviewed','exported','superseded','archived')),
  provider text NOT NULL DEFAULT 'deterministic' CHECK(provider IN ('deterministic','gemini-assisted')),
  source_hash text NOT NULL, generated_by text NOT NULL, payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_executive_brief_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, brief_id uuid NOT NULL REFERENCES public.revenue_os_executive_briefs(id) ON DELETE CASCADE,
  version integer NOT NULL, source_hash text NOT NULL, payload jsonb NOT NULL, created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(brief_id,version)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_exceptions (
  id uuid PRIMARY KEY, tenant_id text NOT NULL, exception_code text NOT NULL, exception_type text NOT NULL,
  priority text NOT NULL CHECK(priority IN ('P0','P1','P2','P3','P4')),
  severity text NOT NULL CHECK(severity IN ('critical','high','medium','low','info')),
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','assigned','in_progress','resolved','dismissed')),
  revenue_at_risk numeric NOT NULL DEFAULT 0, owner_id text, due_at timestamptz,
  source_zone text NOT NULL, source_record_id text, acknowledged_at timestamptz, resolved_at timestamptz,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,exception_code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_interventions (
  id uuid PRIMARY KEY, tenant_id text NOT NULL, exception_id uuid NOT NULL REFERENCES public.revenue_os_cockpit_exceptions(id) ON DELETE CASCADE,
  status text NOT NULL CHECK(status IN ('open','acknowledged','assigned','in_progress','resolved','dismissed')),
  action_type text NOT NULL, assigned_to text, assigned_role text, deadline timestamptz,
  source_zone text NOT NULL, source_object_id text, created_by text NOT NULL, idempotency_key text NOT NULL,
  payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_intervention_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  intervention_id uuid NOT NULL REFERENCES public.revenue_os_cockpit_interventions(id) ON DELETE CASCADE,
  action_type text NOT NULL, status text NOT NULL DEFAULT 'prepared', delegated_service text,
  source_object_id text, result_reference text, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, alert_type text NOT NULL,
  severity text NOT NULL, status text NOT NULL DEFAULT 'open', source_zone text NOT NULL, source_object_id text,
  title text NOT NULL, message text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), acknowledged_at timestamptz, resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  exception_id uuid NOT NULL REFERENCES public.revenue_os_cockpit_exceptions(id) ON DELETE CASCADE,
  actor_id text NOT NULL, note text, idempotency_key text NOT NULL, acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, owner_id text NOT NULL, name text NOT NULL,
  zone_key text, filters jsonb NOT NULL DEFAULT '{}'::jsonb, is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, role_view text NOT NULL,
  name text NOT NULL, layout jsonb NOT NULL DEFAULT '{}'::jsonb, active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,role_view,name,version)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_watchlists (
  id uuid PRIMARY KEY, tenant_id text NOT NULL, name text NOT NULL, object_types text[] NOT NULL DEFAULT '{}',
  object_ids text[] NOT NULL DEFAULT '{}', filters jsonb NOT NULL DEFAULT '{}'::jsonb, created_by text NOT NULL,
  idempotency_key text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_digest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, digest_type text NOT NULL,
  role_view text NOT NULL, status text NOT NULL DEFAULT 'queued', source_hash text,
  scheduled_at timestamptz, started_at timestamptz, completed_at timestamptz, requested_by text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_cockpit_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, actor_id text NOT NULL,
  action text NOT NULL, source_zone text, source_object_id text, idempotency_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revenue_os_cockpit_snapshots_tenant_generated_idx ON public.revenue_os_cockpit_snapshots(tenant_id,generated_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_cockpit_exceptions_priority_idx ON public.revenue_os_cockpit_exceptions(tenant_id,status,priority,severity,updated_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_cockpit_exceptions_source_idx ON public.revenue_os_cockpit_exceptions(tenant_id,source_zone,source_record_id);
CREATE INDEX IF NOT EXISTS revenue_os_cockpit_interventions_status_idx ON public.revenue_os_cockpit_interventions(tenant_id,status,deadline);
CREATE INDEX IF NOT EXISTS revenue_os_cockpit_alerts_status_idx ON public.revenue_os_cockpit_alerts(tenant_id,status,severity,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_cockpit_audit_tenant_idx ON public.revenue_os_cockpit_audit_events(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_cockpit_watchlists_gin ON public.revenue_os_cockpit_watchlists USING gin(object_ids);

DROP TRIGGER IF EXISTS revenue_os_cockpit_views_touch ON public.revenue_os_cockpit_views;
CREATE TRIGGER revenue_os_cockpit_views_touch BEFORE UPDATE ON public.revenue_os_cockpit_views FOR EACH ROW EXECUTE FUNCTION public.revenue_os_touch_updated_at();
DROP TRIGGER IF EXISTS revenue_os_cockpit_preferences_touch ON public.revenue_os_cockpit_preferences;
CREATE TRIGGER revenue_os_cockpit_preferences_touch BEFORE UPDATE ON public.revenue_os_cockpit_preferences FOR EACH ROW EXECUTE FUNCTION public.revenue_os_touch_updated_at();
DROP TRIGGER IF EXISTS revenue_os_cockpit_exceptions_touch ON public.revenue_os_cockpit_exceptions;
CREATE TRIGGER revenue_os_cockpit_exceptions_touch BEFORE UPDATE ON public.revenue_os_cockpit_exceptions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_touch_updated_at();
DROP TRIGGER IF EXISTS revenue_os_cockpit_interventions_touch ON public.revenue_os_cockpit_interventions;
CREATE TRIGGER revenue_os_cockpit_interventions_touch BEFORE UPDATE ON public.revenue_os_cockpit_interventions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_touch_updated_at();

CREATE OR REPLACE VIEW public.revenue_os_cockpit_execution_summary AS
SELECT tenant_id,
 count(*) FILTER (WHERE status IN ('draft','validated')) AS prepared,
 count(*) FILTER (WHERE status='awaiting_approval') AS awaiting_approval,
 count(*) FILTER (WHERE status IN ('queued','leased','executing')) AS in_flight,
 count(*) FILTER (WHERE status='succeeded') AS succeeded,
 count(*) FILTER (WHERE status='failed') AS failed,
 count(*) FILTER (WHERE status='dead_letter') AS dead_letters,
 count(*) FILTER (WHERE status='succeeded' AND external_action=true) AS external_actions_executed,
 max(updated_at) AS last_updated_at
FROM public.revenue_os_execution_actions GROUP BY tenant_id;

CREATE OR REPLACE VIEW public.revenue_os_cockpit_program_summary AS
SELECT tenant_id, status, count(*) AS program_count, max(updated_at) AS last_updated_at
FROM public.revenue_os_programs GROUP BY tenant_id,status;

CREATE OR REPLACE VIEW public.revenue_os_cockpit_approval_summary AS
SELECT tenant_id, status, count(*) AS approval_count, min(expires_at) AS next_expiry, max(updated_at) AS last_updated_at
FROM public.revenue_os_approval_requests GROUP BY tenant_id,status;

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'revenue_os_cockpit_views','revenue_os_cockpit_preferences','revenue_os_cockpit_snapshots','revenue_os_executive_briefs',
    'revenue_os_executive_brief_versions','revenue_os_cockpit_exceptions','revenue_os_cockpit_interventions',
    'revenue_os_cockpit_intervention_actions','revenue_os_cockpit_alerts','revenue_os_cockpit_acknowledgements',
    'revenue_os_cockpit_saved_filters','revenue_os_cockpit_layouts','revenue_os_cockpit_watchlists',
    'revenue_os_cockpit_digest_runs','revenue_os_cockpit_audit_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',table_name);
  END LOOP;
END $$;
REVOKE ALL ON public.revenue_os_cockpit_execution_summary FROM anon,authenticated;
REVOKE ALL ON public.revenue_os_cockpit_program_summary FROM anon,authenticated;
REVOKE ALL ON public.revenue_os_cockpit_approval_summary FROM anon,authenticated;
GRANT SELECT ON public.revenue_os_cockpit_execution_summary,public.revenue_os_cockpit_program_summary,public.revenue_os_cockpit_approval_summary TO service_role;

INSERT INTO public.revenue_os_permission_registry(permission_key,label,description,risk_class,phase_introduced,active) VALUES
('revenue_os.cockpit.view','Revenue OS — Voir cockpit','Accéder au cockpit stratégique unifié et à ses read models.','controlled',15,true),
('revenue_os.cockpit.executive_view','Revenue OS — Vue Direction','Accéder à la vue exécutive, aux risques, objectifs et décisions.','restricted',15,true),
('revenue_os.cockpit.commercial_view','Revenue OS — Vue Commerciale','Accéder aux campagnes, waves, comptes et conversion.','controlled',15,true),
('revenue_os.cockpit.operations_view','Revenue OS — Vue Opérations','Accéder aux capacités, handoffs, missions et risques opérationnels.','controlled',15,true),
('revenue_os.cockpit.finance_view','Revenue OS — Vue Finance','Accéder aux marges, paiements, exposition et validations financières.','restricted',15,true),
('revenue_os.cockpit.export','Revenue OS — Exporter brief','Exporter les briefs exécutifs gouvernés et traçables.','controlled',15,true),
('revenue_os.cockpit.intervene','Revenue OS — Intervenir','Accuser réception et créer des interventions gouvernées.','restricted',15,true),
('revenue_os.cockpit.assign_intervention','Revenue OS — Affecter intervention','Affecter une exception à un acteur ou rôle autorisé.','restricted',15,true),
('revenue_os.cockpit.resolve_exception','Revenue OS — Résoudre exception','Résoudre une exception avec raison et preuves.','restricted',15,true),
('revenue_os.cockpit.manage_views','Revenue OS — Gérer vues','Gérer vues, filtres, layouts et watchlists du cockpit.','controlled',15,true),
('revenue_os.cockpit.admin','Revenue OS — Administrer cockpit','Administrer le cockpit, ses read models et sa gouvernance.','restricted',15,true)
ON CONFLICT(permission_key) DO UPDATE SET label=excluded.label,description=excluded.description,risk_class=excluded.risk_class,phase_introduced=excluded.phase_introduced,active=true,updated_at=now();

INSERT INTO public.revenue_os_feature_flags(flag_key,label,description,enabled,locked,environment,risk_class,phase_introduced,config) VALUES
('revenue_os.premium_cockpit','Premium Revenue Command Cockpit','Active le cockpit stratégique MZ15.',true,true,'all','controlled',15,'{"zones":13,"roleAdaptive":true}'::jsonb),
('revenue_os.cockpit_executive_brief','Revenue Situation Brief','Active le brief exécutif traçable.',true,false,'all','controlled',15,'{"provider":"deterministic","geminiOptional":true}'::jsonb),
('revenue_os.cockpit_interventions','Interventions cockpit','Active les exceptions, acknowledgements et interventions.',true,false,'all','restricted',15,'{"delegateToGovernedServices":true}'::jsonb)
ON CONFLICT(flag_key) DO UPDATE SET label=excluded.label,description=excluded.description,enabled=excluded.enabled,locked=excluded.locked,environment=excluded.environment,risk_class=excluded.risk_class,phase_introduced=excluded.phase_introduced,config=excluded.config,updated_at=now();

INSERT INTO public.revenue_os_workspaces(workspace_key,label,short_label,description,href,icon,display_order,permission_key,maturity_status,accent,contract_scope,active) VALUES
('strategic-view','Revenue Command Cockpit','Cockpit MZ15','Système stratégique final unifiant objectifs, signaux, stratégie, Conseil, programmes, runs, waves, compilation, exécution, exceptions, expériences, mémoire et gouvernance.','/revenue-command-os/cockpit','Command',10,'revenue_os.cockpit.view','ready','navy','["Revenue Objective Command","Live Signals","Strategy Assembly","Validation Council","Active Programs","Command Runs","Campaign Waves","Mission Compiler","Execution Progress","Revenue Exceptions","Experiments","Learning Memory","Approvals"]'::jsonb,true)
ON CONFLICT(workspace_key) DO UPDATE SET label=excluded.label,short_label=excluded.short_label,description=excluded.description,href=excluded.href,icon=excluded.icon,display_order=excluded.display_order,permission_key=excluded.permission_key,maturity_status=excluded.maturity_status,accent=excluded.accent,contract_scope=excluded.contract_scope,active=true,updated_at=now();

UPDATE public.revenue_os_installations SET
 release_code='AC-REVENUE-OS-MZ15-PREMIUM-COCKPIT', module_version='15.0.0', execution_mode='approval-gated', contract_locked=true, external_actions_enabled=false,
 metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
  'currentPhase','MZ15','premiumCockpit',true,'coreZones',13,'roleAdaptive',true,'executiveBrief',true,
  'exceptionInterventionEngine',true,'crossPhaseLineage',true,'externalActionBypass',false,'nextPhase','MZ16'
 ), updated_at=now()
WHERE installation_key='revenue-command-os';

DO $$
DECLARE cockpit_table_count integer; rls_count integer;
BEGIN
 SELECT count(*) INTO cockpit_table_count FROM information_schema.tables
 WHERE table_schema='public' AND table_name IN (
  'revenue_os_cockpit_views','revenue_os_cockpit_preferences','revenue_os_cockpit_snapshots','revenue_os_executive_briefs',
  'revenue_os_executive_brief_versions','revenue_os_cockpit_exceptions','revenue_os_cockpit_interventions',
  'revenue_os_cockpit_intervention_actions','revenue_os_cockpit_alerts','revenue_os_cockpit_acknowledgements',
  'revenue_os_cockpit_saved_filters','revenue_os_cockpit_layouts','revenue_os_cockpit_watchlists',
  'revenue_os_cockpit_digest_runs','revenue_os_cockpit_audit_events'
 );
 IF cockpit_table_count<>15 THEN RAISE EXCEPTION 'MZ15 requires 15 cockpit governance tables; found %',cockpit_table_count; END IF;
 SELECT count(*) INTO rls_count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relrowsecurity=true AND c.relname LIKE 'revenue_os_cockpit_%';
 IF rls_count<12 THEN RAISE EXCEPTION 'MZ15 cockpit RLS assertion failed; found %',rls_count; END IF;
 IF (SELECT count(*) FROM public.revenue_os_permission_registry WHERE phase_introduced=15 AND active=true)<11 THEN RAISE EXCEPTION 'MZ15 permission registry incomplete'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_workspaces WHERE workspace_key='strategic-view' AND href='/revenue-command-os/cockpit' AND active=true) THEN RAISE EXCEPTION 'MZ15 cockpit workspace missing'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code='AC-REVENUE-OS-MZ15-PREMIUM-COCKPIT' AND execution_mode='approval-gated' AND external_actions_enabled=false) THEN RAISE EXCEPTION 'MZ15 installation registry assertion failed'; END IF;
END $$;
COMMIT;
