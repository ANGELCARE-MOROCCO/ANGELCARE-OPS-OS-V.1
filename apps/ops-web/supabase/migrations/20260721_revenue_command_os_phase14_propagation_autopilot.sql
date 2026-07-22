BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code='AC-REVENUE-OS-MZ13-MISSION-COMPILER') THEN
   RAISE EXCEPTION 'MZ14 requires the verified MZ13 Mission Compiler installation';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='revenue_os_propagation_packages') THEN
   RAISE EXCEPTION 'MZ14 requires MZ13 propagation packages';
 END IF;
END $$;

ALTER TABLE public.revenue_os_propagation_packages
  ADD COLUMN IF NOT EXISTS strategy_version text,
  ADD COLUMN IF NOT EXISTS approval_decision_id uuid,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by text,
  ADD COLUMN IF NOT EXISTS source_hash text,
  ADD COLUMN IF NOT EXISTS action_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.revenue_os_propagation_packages DROP CONSTRAINT IF EXISTS revenue_os_propagation_packages_status_check;
ALTER TABLE public.revenue_os_propagation_packages ADD CONSTRAINT revenue_os_propagation_packages_status_check CHECK(status IN ('prepared_shadow','ready','activated','superseded','cancelled'));

CREATE TABLE IF NOT EXISTS public.revenue_os_propagation_runs(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, package_id uuid NOT NULL REFERENCES public.revenue_os_propagation_packages(id), compilation_run_id uuid NOT NULL REFERENCES public.revenue_os_compilation_runs(id),
 status text NOT NULL CHECK(status IN ('draft','validating','prepared','partially_ready','ready','activating','active','paused','completed','failed','cancelled','rolled_back','blocked')),
 execution_mode text NOT NULL CHECK(execution_mode IN ('shadow','internal_only','approval_required','limited_autopilot','suspended','emergency_stop')),
 idempotency_key text NOT NULL, requested_by text NOT NULL, source_hash text NOT NULL,
 prepared_actions integer NOT NULL DEFAULT 0, queued_actions integer NOT NULL DEFAULT 0, succeeded_actions integer NOT NULL DEFAULT 0, failed_actions integer NOT NULL DEFAULT 0,
 external_actions_executed integer NOT NULL DEFAULT 0 CHECK(external_actions_executed>=0), started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, paused_at timestamptz, cancelled_at timestamptz, last_error text,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_adapter_registry(
 adapter_code text PRIMARY KEY, label text NOT NULL, transport text NOT NULL, status text NOT NULL DEFAULT 'configured', mandatory boolean NOT NULL DEFAULT true,
 supported_actions text[] NOT NULL DEFAULT '{}', external_capable boolean NOT NULL DEFAULT false, reversible_default text NOT NULL DEFAULT 'reversible', metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_adapter_configs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, adapter_code text NOT NULL REFERENCES public.revenue_os_adapter_registry(adapter_code), enabled boolean NOT NULL DEFAULT false,
 execution_mode text NOT NULL DEFAULT 'approval_required', allow_internal boolean NOT NULL DEFAULT true, allow_approved_external boolean NOT NULL DEFAULT false, endpoint_url text, rpc_name text,
 credential_refs text[] NOT NULL DEFAULT '{}', timeout_ms integer NOT NULL DEFAULT 60000, maximum_attempts integer NOT NULL DEFAULT 5, config jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,adapter_code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_adapter_health(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, adapter_code text NOT NULL REFERENCES public.revenue_os_adapter_registry(adapter_code), status text NOT NULL,
 checked_at timestamptz NOT NULL, last_success_at timestamptz, last_failure_at timestamptz, failure_rate numeric NOT NULL DEFAULT 0, consecutive_failures integer NOT NULL DEFAULT 0,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,adapter_code)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_actions(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, propagation_run_id uuid NOT NULL REFERENCES public.revenue_os_propagation_runs(id) ON DELETE CASCADE, package_id uuid NOT NULL REFERENCES public.revenue_os_propagation_packages(id),
 adapter_code text NOT NULL REFERENCES public.revenue_os_adapter_registry(adapter_code), action_type text NOT NULL, status text NOT NULL, priority integer NOT NULL DEFAULT 50,
 scheduled_at timestamptz, idempotency_key text NOT NULL, execution_mode text NOT NULL, external_action boolean NOT NULL DEFAULT false, approval_required boolean NOT NULL DEFAULT false,
 approval_decision_id uuid, attempt_count integer NOT NULL DEFAULT 0, generation integer NOT NULL DEFAULT 1, external_reference text, last_error text, payload_hash text,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_action_attempts(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, attempt_number integer NOT NULL,
 status text NOT NULL, started_at timestamptz NOT NULL, completed_at timestamptz, latency_ms integer, error_code text, error_message text, response_hash text, provider_request_id text,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(action_id,attempt_number)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_outbox(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, idempotency_key text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','leased','completed','failed','cancelled')), available_at timestamptz NOT NULL DEFAULT now(), lease_owner text, lease_expires_at timestamptz,
 attempt_count integer NOT NULL DEFAULT 0, last_error text, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_inbox(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, adapter_code text NOT NULL, provider_event_id text NOT NULL, event_type text NOT NULL, payload_hash text NOT NULL,
 status text NOT NULL DEFAULT 'received', action_id uuid REFERENCES public.revenue_os_execution_actions(id), payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,adapter_code,provider_event_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_idempotency(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, idempotency_key text NOT NULL, scope text NOT NULL, action_id uuid REFERENCES public.revenue_os_execution_actions(id),
 payload_hash text, status text NOT NULL DEFAULT 'reserved', result_reference text, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,scope,idempotency_key)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_approvals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, decision_id uuid NOT NULL,
 approval_class text NOT NULL, actor_id text NOT NULL, decision text NOT NULL CHECK(decision IN ('approved','rejected','revoked')), reason text NOT NULL, valid_until timestamptz, payload_hash text NOT NULL,
 conditions jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,decision_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_results(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, adapter_code text NOT NULL,
 status text NOT NULL, external_reference text, external_action boolean NOT NULL DEFAULT false, reversible text NOT NULL DEFAULT 'reversible', payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_external_references(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, adapter_code text NOT NULL,
 external_reference text NOT NULL, external_type text, external_status text, last_synced_at timestamptz, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,adapter_code,external_reference)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_failures(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, adapter_code text NOT NULL,
 error_code text, error_message text NOT NULL, retryable boolean NOT NULL DEFAULT false, attempt_number integer NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_dead_letters(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), adapter_code text NOT NULL,
 reason text NOT NULL, attempts integer NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','retrying','resolved','discarded')), payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_retries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE, attempt_number integer NOT NULL,
 available_at timestamptz NOT NULL, reason text NOT NULL, status text NOT NULL DEFAULT 'scheduled', payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(action_id,attempt_number)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_compensations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), adapter_code text NOT NULL,
 actor_id text NOT NULL, reason text NOT NULL, status text NOT NULL, compensation_type text, external_reference text, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_rollbacks(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, propagation_run_id uuid REFERENCES public.revenue_os_propagation_runs(id), action_id uuid REFERENCES public.revenue_os_execution_actions(id),
 actor_id text NOT NULL, reason text NOT NULL, status text NOT NULL, target_state jsonb, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_webhook_events(
 id uuid PRIMARY KEY, tenant_id text NOT NULL, adapter_code text NOT NULL, provider_event_id text NOT NULL, event_type text NOT NULL, external_reference text, action_id uuid REFERENCES public.revenue_os_execution_actions(id),
 payload_hash text NOT NULL, signature_valid boolean NOT NULL, replayed boolean NOT NULL DEFAULT false, status text NOT NULL, received_at timestamptz NOT NULL, processed_at timestamptz,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,adapter_code,provider_event_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_execution_state_transitions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id) ON DELETE CASCADE,
 from_status text, to_status text NOT NULL, actor_id text, reason text, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.revenue_os_campaign_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_campaign_id uuid, target_campaign_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_wave_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_wave_id uuid, target_wave_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_account_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_account_plan_id uuid, target_account_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_task_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_task_id uuid, target_task_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_meeting_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_mission_id uuid, target_meeting_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_proposal_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_task_id uuid, target_proposal_id text,
 margin_validated boolean NOT NULL DEFAULT false, approval_validated boolean NOT NULL DEFAULT false, status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_payment_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_task_id uuid, target_followup_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_delivery_handoffs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_task_id uuid, target_handoff_id text,
 capacity_validated boolean NOT NULL DEFAULT false, billing_dependency_satisfied boolean NOT NULL DEFAULT false, status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_renewal_propagations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, action_id uuid NOT NULL REFERENCES public.revenue_os_execution_actions(id), source_task_id uuid, target_renewal_id text,
 status text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,action_id)
);
CREATE TABLE IF NOT EXISTS public.revenue_os_propagation_audit_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, propagation_run_id uuid REFERENCES public.revenue_os_propagation_runs(id), execution_action_id uuid REFERENCES public.revenue_os_execution_actions(id),
 actor_id text NOT NULL, action text NOT NULL, idempotency_key text, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,idempotency_key)
);

CREATE INDEX IF NOT EXISTS revenue_os_propagation_runs_status_idx ON public.revenue_os_propagation_runs(tenant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_execution_actions_queue_idx ON public.revenue_os_execution_actions(tenant_id,status,scheduled_at,priority DESC);
CREATE INDEX IF NOT EXISTS revenue_os_execution_actions_source_idx ON public.revenue_os_execution_actions(tenant_id,propagation_run_id,adapter_code,action_type);
CREATE INDEX IF NOT EXISTS revenue_os_execution_outbox_lease_idx ON public.revenue_os_execution_outbox(status,available_at,lease_expires_at);
CREATE INDEX IF NOT EXISTS revenue_os_execution_webhook_external_idx ON public.revenue_os_execution_webhook_events(tenant_id,adapter_code,external_reference,received_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_dead_letters_status_idx ON public.revenue_os_execution_dead_letters(tenant_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_os_adapter_health_status_idx ON public.revenue_os_adapter_health(tenant_id,status,checked_at DESC);

CREATE OR REPLACE FUNCTION public.revenue_os_mz14_external_execution_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE installation record; adapter record;
BEGIN
 IF NEW.external_action=true AND NEW.status IN ('queued','leased','executing','succeeded') THEN
   SELECT * INTO installation FROM public.revenue_os_installations WHERE installation_key='revenue-command-os';
   IF installation.external_actions_enabled IS DISTINCT FROM true THEN RAISE EXCEPTION 'External Revenue OS actions are disabled at installation level'; END IF;
   IF NEW.approval_required=true AND NEW.approval_decision_id IS NULL THEN RAISE EXCEPTION 'External action requires approval decision'; END IF;
   SELECT * INTO adapter FROM public.revenue_os_adapter_configs WHERE tenant_id=NEW.tenant_id AND adapter_code=NEW.adapter_code;
   IF adapter IS NULL OR adapter.enabled IS DISTINCT FROM true OR adapter.allow_approved_external IS DISTINCT FROM true THEN RAISE EXCEPTION 'Adapter is not enabled for approved external actions'; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS revenue_os_execution_actions_external_guard ON public.revenue_os_execution_actions;
CREATE TRIGGER revenue_os_execution_actions_external_guard BEFORE INSERT OR UPDATE ON public.revenue_os_execution_actions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_mz14_external_execution_guard();

CREATE OR REPLACE FUNCTION public.revenue_os_mz14_state_transition_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
   INSERT INTO public.revenue_os_execution_state_transitions(tenant_id,action_id,from_status,to_status,reason,payload) VALUES(NEW.tenant_id,NEW.id,OLD.status,NEW.status,NEW.last_error,jsonb_build_object('attemptCount',NEW.attempt_count,'externalReference',NEW.external_reference));
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS revenue_os_execution_actions_state_audit ON public.revenue_os_execution_actions;
CREATE TRIGGER revenue_os_execution_actions_state_audit AFTER UPDATE ON public.revenue_os_execution_actions FOR EACH ROW EXECUTE FUNCTION public.revenue_os_mz14_state_transition_audit();

CREATE OR REPLACE FUNCTION public.revenue_os_enqueue_execution_action(p_action_id uuid,p_tenant_id text,p_idempotency_key text,p_available_at timestamptz DEFAULT now()) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE outbox_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_execution_actions WHERE id=p_action_id AND tenant_id=p_tenant_id) THEN RAISE EXCEPTION 'Execution action not found'; END IF;
 INSERT INTO public.revenue_os_execution_idempotency(tenant_id,idempotency_key,scope,action_id,status) VALUES(p_tenant_id,p_idempotency_key,'execution_outbox',p_action_id,'reserved') ON CONFLICT(tenant_id,scope,idempotency_key) DO NOTHING;
 INSERT INTO public.revenue_os_execution_outbox(tenant_id,action_id,idempotency_key,status,available_at) VALUES(p_tenant_id,p_action_id,p_idempotency_key,'pending',p_available_at)
 ON CONFLICT(tenant_id,idempotency_key) DO UPDATE SET available_at=LEAST(public.revenue_os_execution_outbox.available_at,excluded.available_at),updated_at=now() RETURNING id INTO outbox_id;
 UPDATE public.revenue_os_execution_actions SET status='queued',updated_at=now() WHERE id=p_action_id AND tenant_id=p_tenant_id AND status IN ('validated','approved','retry_scheduled','queued');
 RETURN outbox_id;
END $$;

CREATE OR REPLACE FUNCTION public.revenue_os_lease_execution_outbox(p_worker_id text,p_limit integer DEFAULT 10,p_lease_seconds integer DEFAULT 90)
RETURNS TABLE(id uuid,tenant_id text,action_id uuid,attempt_count integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 RETURN QUERY
 WITH candidates AS (
   SELECT o.id FROM public.revenue_os_execution_outbox o
   WHERE o.status IN ('pending','failed') AND o.available_at<=now() AND (o.lease_expires_at IS NULL OR o.lease_expires_at<now())
   ORDER BY o.available_at,o.created_at FOR UPDATE SKIP LOCKED LIMIT GREATEST(1,LEAST(p_limit,100))
 ), leased AS (
   UPDATE public.revenue_os_execution_outbox o SET status='leased',lease_owner=p_worker_id,lease_expires_at=now()+make_interval(secs=>p_lease_seconds),attempt_count=o.attempt_count+1,updated_at=now()
   FROM candidates c WHERE o.id=c.id RETURNING o.id,o.tenant_id,o.action_id,o.attempt_count
 ) SELECT leased.id,leased.tenant_id,leased.action_id,leased.attempt_count FROM leased;
END $$;

INSERT INTO public.revenue_os_adapter_registry(adapter_code,label,transport,status,mandatory,supported_actions,external_capable,reversible_default,metadata) VALUES
('b2b_partnerships','B2B Partnerships','internal_api','configured',true,ARRAY['create_campaign','create_account_wave','assign_account','update_stage','launch_rescue_mission'],false,'reversible','{}'),
('traininghub_commercial','TrainingHub Commercial','internal_api','configured',true,ARRAY['create_campaign','assign_account','draft_proposal','create_delivery_handoff','initiate_renewal'],false,'reversible','{}'),
('email_os','Email OS','internal_api','configured',true,ARRAY['prepare_email','prepare_message','schedule_followup'],false,'reversible','{}'),
('gmail','Gmail','google_api','configured',true,ARRAY['prepare_email','send_email'],true,'compensatable','{}'),
('whatsapp','WhatsApp','whatsapp_cloud','configured',true,ARRAY['prepare_message','send_whatsapp'],true,'compensatable','{}'),
('calendar','Calendar','google_api','configured',true,ARRAY['propose_meeting','create_calendar_event','schedule_followup'],true,'cancellable','{}'),
('opportunities','Opportunities','internal_api','configured',true,ARRAY['update_stage','launch_rescue_mission','initiate_renewal'],false,'reversible','{}'),
('account_plans','Account Plans','internal_api','configured',true,ARRAY['assign_account','schedule_followup'],false,'reversible','{}'),
('campaigns','Campaigns','internal_api','configured',true,ARRAY['create_campaign','create_account_wave'],false,'reversible','{}'),
('meetings','Meetings','internal_api','configured',true,ARRAY['propose_meeting','prepare_meeting_brief','schedule_followup'],false,'reversible','{}'),
('proposals','Proposals','internal_api','configured',true,ARRAY['draft_proposal','request_approval','send_proposal'],true,'compensatable','{}'),
('payments','Payments','internal_api','configured',true,ARRAY['create_payment_followup','schedule_followup'],false,'reversible','{}'),
('trainer_planning','Trainer Planning','internal_api','configured',true,ARRAY['create_delivery_handoff','request_approval'],false,'reversible','{}'),
('academy_delivery','Academy Delivery','internal_api','configured',true,ARRAY['create_delivery_handoff','schedule_followup'],false,'reversible','{}'),
('reporting','Reporting','internal_api','configured',true,ARRAY['create_campaign','create_account_wave','assign_account','schedule_followup','update_stage'],false,'reversible','{}'),
('internal_tasks','Internal Tasks','internal_api','configured',true,ARRAY['assign_account','schedule_followup','request_approval','launch_rescue_mission'],false,'reversible','{}')
ON CONFLICT(adapter_code) DO UPDATE SET label=excluded.label,transport=excluded.transport,status=excluded.status,mandatory=true,supported_actions=excluded.supported_actions,external_capable=excluded.external_capable,reversible_default=excluded.reversible_default,updated_at=now();

INSERT INTO public.revenue_os_permission_registry(permission_key,label,description,risk_class,phase_introduced,active) VALUES
('revenue_os.execution.view','Revenue OS — Execution Autopilot','Consulter packages, actions, adaptateurs et états MZ14.','controlled',14,true),
('revenue_os.execution.prepare','Revenue OS — Préparer propagation','Transformer un package MZ13 en actions gouvernées.','restricted',14,true),
('revenue_os.execution.activate','Revenue OS — Activer propagation','Activer les actions internes et files approuvées.','restricted',14,true),
('revenue_os.execution.approve','Revenue OS — Approuver action','Approuver ou rejeter une action sensible ou externe.','restricted',14,true),
('revenue_os.execution.operate','Revenue OS — Opérer exécution','Relancer, suspendre et synchroniser les actions.','restricted',14,true),
('revenue_os.execution.rollback','Revenue OS — Rollback et compensation','Annuler ou compenser une action propagée.','restricted',14,true),
('revenue_os.execution.admin','Revenue OS — Administrer adaptateurs','Configurer, tester et suspendre les adaptateurs.','restricted',14,true)
ON CONFLICT(permission_key) DO UPDATE SET label=excluded.label,description=excluded.description,risk_class=excluded.risk_class,phase_introduced=excluded.phase_introduced,active=true,updated_at=now();

INSERT INTO public.revenue_os_workspaces(workspace_key,label,short_label,description,href,icon,display_order,permission_key,maturity_status,accent,contract_scope,active) VALUES
('execution-autopilot','SaaS Propagation & Revenue Execution Autopilot','Exécution MZ14','Propagation contrôlée des packages MZ13 vers les modules AngelCare avec approbation, idempotence, outbox, webhooks, retry, rollback et compensation.','/revenue-command-os/execution-autopilot','Workflow',64,'revenue_os.execution.view','ready','green','["Propagation","Adaptateurs","Campagnes","Emails","WhatsApp","Calendar","Propositions","Paiements","Webhooks","Rollback"]',true)
ON CONFLICT(workspace_key) DO UPDATE SET label=excluded.label,short_label=excluded.short_label,description=excluded.description,href=excluded.href,icon=excluded.icon,display_order=excluded.display_order,permission_key=excluded.permission_key,maturity_status=excluded.maturity_status,accent=excluded.accent,contract_scope=excluded.contract_scope,active=true,updated_at=now();

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['revenue_os_propagation_packages','revenue_os_propagation_runs','revenue_os_adapter_registry','revenue_os_adapter_configs','revenue_os_adapter_health','revenue_os_execution_actions','revenue_os_execution_action_attempts','revenue_os_execution_outbox','revenue_os_execution_inbox','revenue_os_execution_idempotency','revenue_os_execution_approvals','revenue_os_execution_results','revenue_os_external_references','revenue_os_execution_failures','revenue_os_execution_dead_letters','revenue_os_execution_retries','revenue_os_execution_compensations','revenue_os_execution_rollbacks','revenue_os_execution_webhook_events','revenue_os_execution_state_transitions','revenue_os_campaign_propagations','revenue_os_wave_propagations','revenue_os_account_propagations','revenue_os_task_propagations','revenue_os_meeting_propagations','revenue_os_proposal_propagations','revenue_os_payment_propagations','revenue_os_delivery_handoffs','revenue_os_renewal_propagations','revenue_os_propagation_audit_events'] LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
   EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',t);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.revenue_os_enqueue_execution_action(uuid,text,text,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.revenue_os_lease_execution_outbox(text,integer,integer) TO service_role;

UPDATE public.revenue_os_installations SET release_code='AC-REVENUE-OS-MZ14-PROPAGATION-AUTOPILOT',module_version='14.0.0',execution_mode='approval-gated',contract_locked=true,external_actions_enabled=false,
 metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('currentPhase','MZ14','propagationAutopilot',true,'executionMode','approval_required','internalActionsEnabled',true,'approvedExternalActionsEnabled',false,'mandatoryAdapters',16,'mandatoryActions',15,'transactionalOutbox',true,'webhookInbox',true,'nextPhase','MZ15'),updated_at=now()
WHERE installation_key='revenue-command-os';

DO $$ BEGIN
 IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('revenue_os_propagation_packages','revenue_os_propagation_runs','revenue_os_adapter_registry','revenue_os_adapter_configs','revenue_os_adapter_health','revenue_os_execution_actions','revenue_os_execution_action_attempts','revenue_os_execution_outbox','revenue_os_execution_inbox','revenue_os_execution_idempotency','revenue_os_execution_approvals','revenue_os_execution_results','revenue_os_external_references','revenue_os_execution_failures','revenue_os_execution_dead_letters','revenue_os_execution_retries','revenue_os_execution_compensations','revenue_os_execution_rollbacks','revenue_os_execution_webhook_events','revenue_os_execution_state_transitions','revenue_os_campaign_propagations','revenue_os_wave_propagations','revenue_os_account_propagations','revenue_os_task_propagations','revenue_os_meeting_propagations','revenue_os_proposal_propagations','revenue_os_payment_propagations','revenue_os_delivery_handoffs','revenue_os_renewal_propagations','revenue_os_propagation_audit_events'))<>30 THEN RAISE EXCEPTION 'MZ14 requires 30 propagation and execution tables including the MZ13 package table'; END IF;
 IF (SELECT count(*) FROM public.revenue_os_adapter_registry WHERE mandatory=true)<>16 THEN RAISE EXCEPTION 'MZ14 requires 16 mandatory adapters'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.revenue_os_installations WHERE installation_key='revenue-command-os' AND release_code='AC-REVENUE-OS-MZ14-PROPAGATION-AUTOPILOT' AND execution_mode='approval-gated' AND external_actions_enabled=false) THEN RAISE EXCEPTION 'MZ14 installation registry assertion failed'; END IF;
END $$;
COMMIT;
