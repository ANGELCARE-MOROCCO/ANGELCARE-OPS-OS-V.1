BEGIN;

-- ANGELCARE Revenue Command OS — Trusted Operator Live Production
-- Additive/idempotent. This migration is deliberately NOT executed by the patch installer.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.revenue_os_live_activation_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_code text NOT NULL,
  table_name text NOT NULL,
  row_key text NOT NULL,
  row_payload jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(migration_code, table_name, row_key)
);
ALTER TABLE public.revenue_os_live_activation_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_live_activation_backups FROM anon, authenticated;
GRANT ALL ON public.revenue_os_live_activation_backups TO service_role;

INSERT INTO public.revenue_os_live_activation_backups(migration_code,table_name,row_key,row_payload)
SELECT 'AC-RCOS-TRUSTED-OPERATOR-LIVE-2026.08','revenue_os_installations',installation_key,to_jsonb(i)
FROM public.revenue_os_installations i WHERE installation_key='revenue-command-os'
ON CONFLICT DO NOTHING;

-- Drop legacy execution-mode check constraints so LIVE can become the single active posture.
DO $$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT n.nspname schema_name, c.relname table_name, con.conname constraint_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid=con.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname IN ('revenue_os_installations','revenue_os_objectives','revenue_os_command_schedules','revenue_os_propagation_runs')
      AND con.contype='c'
      AND pg_get_constraintdef(con.oid) ILIKE '%execution_mode%'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',item.schema_name,item.table_name,item.constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.revenue_os_installations
  ALTER COLUMN execution_mode SET DEFAULT 'live';
ALTER TABLE public.revenue_os_installations
  ADD CONSTRAINT revenue_os_installations_execution_mode_live_check CHECK(execution_mode='live');

ALTER TABLE public.revenue_os_objectives
  ALTER COLUMN execution_mode SET DEFAULT 'live';
ALTER TABLE public.revenue_os_objectives
  ADD CONSTRAINT revenue_os_objectives_execution_mode_live_check CHECK(execution_mode='live');

ALTER TABLE public.revenue_os_command_schedules
  ALTER COLUMN execution_mode SET DEFAULT 'live';
ALTER TABLE public.revenue_os_command_schedules
  ADD CONSTRAINT revenue_os_command_schedules_execution_mode_live_check CHECK(execution_mode='live');

ALTER TABLE public.revenue_os_propagation_runs
  ALTER COLUMN execution_mode SET DEFAULT 'live';
ALTER TABLE public.revenue_os_propagation_runs
  ADD CONSTRAINT revenue_os_propagation_runs_execution_mode_live_check CHECK(execution_mode='live');

ALTER TABLE public.revenue_os_execution_actions
  ADD COLUMN IF NOT EXISTS execution_actor jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_payload_hash text,
  ADD COLUMN IF NOT EXISTS operator_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS operator_confirmed_by text;

ALTER TABLE public.revenue_os_adapter_configs
  ALTER COLUMN execution_mode SET DEFAULT 'live',
  ALTER COLUMN allow_internal SET DEFAULT true,
  ALTER COLUMN allow_approved_external SET DEFAULT true;

UPDATE public.revenue_os_installations
SET execution_mode='live', contract_locked=false, external_actions_enabled=true,
    release_code='AC-RCOS-TRUSTED-OPERATOR-LIVE-PRODUCTION',
    module_version='17.0.0-trusted-operator-live',
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'currentPhase','TRUSTED_OPERATOR_LIVE',
      'trustedOperators',true,
      'approvalGates',false,
      'shadowMode',false,
      'governanceHolds',false,
      'directLiveExecution',true,
      'emailProvider','email_os',
      'directGmailAdapterEnabled',false,
      'whatsappUserControllable',true,
      'calendarEnabled',false,
      'activatedAt',to_jsonb(timezone('utc',now()))
    ), updated_at=timezone('utc',now())
WHERE installation_key='revenue-command-os';

UPDATE public.revenue_os_objectives SET execution_mode='live' WHERE execution_mode IS DISTINCT FROM 'live';
UPDATE public.revenue_os_command_schedules SET execution_mode='live' WHERE execution_mode IS DISTINCT FROM 'live';
UPDATE public.revenue_os_propagation_runs SET execution_mode='live' WHERE execution_mode IS DISTINCT FROM 'live';
UPDATE public.revenue_os_execution_actions
SET execution_mode='live', approval_required=false, approval_decision_id=null,
    payload_hash=coalesce(payload_hash,encode(digest(payload::text,'sha256'),'hex')),
    confirmed_payload_hash=coalesce(confirmed_payload_hash,payload_hash,encode(digest(payload::text,'sha256'),'hex'));
UPDATE public.revenue_os_adapter_configs
SET execution_mode='live', allow_internal=true,
    allow_approved_external=CASE WHEN adapter_code IN ('gmail','calendar') THEN false ELSE enabled END,
    updated_at=now();
UPDATE public.revenue_os_command_definitions
SET status='approved', approval_class='none', prohibited_cases='[]'::jsonb,
    cooldown_policy=jsonb_build_object('minimumIntervalMinutes',0,'operatorControlled',true),
    updated_at=now();
UPDATE public.revenue_os_command_tool_permissions
SET allowed=true, approval_class='none', reason='Trusted operator live execution';
UPDATE public.revenue_os_command_eligibility_rules SET hard_block=false;
UPDATE public.revenue_os_command_graph_nodes SET approval_interrupt=false;
UPDATE public.revenue_os_propagation_packages SET status='ready' WHERE status='prepared_shadow';

-- AI Provider Control remains the technical provider/router/usage ledger, but Revenue OS
-- is never quota-blocked, approval-blocked, forced into cache reuse, or schedule-deferred.
UPDATE public.ai_provider_quota_policies
SET enabled=false, hard_limit=false, updated_at=now(),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('revenueTrustedOperatorLive',true,'blockingDisabled',true)
WHERE scope_key IN ('revenue_os','revenue-command-os') OR scope_key LIKE 'revenue_os:%';
UPDATE public.ai_provider_command_policies
SET ai_mode='ai_required', manual_allowed=true, scheduled_allowed=true, minimum_interval_seconds=0,
    max_runs_per_day=2147483647, max_runs_per_week=2147483647, max_runs_per_month=2147483647,
    max_input_tokens_per_run=2147483647, max_output_tokens_per_run=2147483647,
    max_cost_usd_per_run=999999, max_cost_usd_per_day=999999, max_cost_usd_per_week=999999,
    max_retries=5, force_refresh_allowed=true,
    allowed_trigger_types=ARRAY['manual','scheduled','retry','forced_refresh','system','health_test']::text[],
    enabled=true, approval_class='none', cooldown_after_failure_seconds=0, consecutive_failure_suspend_threshold=2147483647, updated_at=now(),
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('revenueTrustedOperatorLive',true,'blockingDisabled',true)
WHERE module_key IN ('revenue_os','revenue-command-os');
UPDATE public.ai_provider_command_schedules
SET enabled=true, status='active', approval_required=false, max_runs_per_day=NULL, max_runs_per_week=NULL, updated_at=now()
WHERE module_key IN ('revenue_os','revenue-command-os');

-- Every external effect is derived from action_type. Caller-supplied booleans cannot disguise it.
CREATE OR REPLACE FUNCTION public.revenue_os_live_action_integrity_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE adapter record;
BEGIN
  NEW.execution_mode := 'live';
  NEW.approval_required := false;
  NEW.approval_decision_id := null;
  NEW.external_action := NEW.action_type IN (
    'send_email','email.send','send_whatsapp','whatsapp.send','create_calendar_event',
    'calendar.create','send_proposal','proposal.send','send_payment_followup',
    'payment.followup','campaign.launch','campaign.send','external_webhook'
  ) OR NEW.external_action=true;
  NEW.payload_hash := encode(digest(NEW.payload::text,'sha256'),'hex');
  IF NEW.confirmed_payload_hash IS NOT NULL AND NEW.confirmed_payload_hash<>NEW.payload_hash THEN
    RAISE EXCEPTION 'EXECUTION_PAYLOAD_CHANGED';
  END IF;
  IF NEW.external_action AND NEW.status IN ('queued','leased','executing','succeeded') THEN
    SELECT * INTO adapter FROM public.revenue_os_adapter_configs
    WHERE tenant_id=NEW.tenant_id AND adapter_code=NEW.adapter_code;
    IF adapter IS NOT NULL AND adapter.enabled IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'CHANNEL_OR_ADAPTER_DISABLED:%',NEW.adapter_code;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS revenue_os_execution_actions_external_guard ON public.revenue_os_execution_actions;
DROP TRIGGER IF EXISTS revenue_os_execution_actions_live_integrity_guard ON public.revenue_os_execution_actions;
CREATE TRIGGER revenue_os_execution_actions_live_integrity_guard
BEFORE INSERT OR UPDATE ON public.revenue_os_execution_actions
FOR EACH ROW EXECUTE FUNCTION public.revenue_os_live_action_integrity_guard();

CREATE TABLE IF NOT EXISTS public.revenue_os_operational_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'high' CHECK(severity IN ('critical','high','medium','low')),
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','running','paused','resolved','closed','cancelled','archived')),
  owner_id text,
  due_at timestamptz,
  source_type text NOT NULL DEFAULT 'manual',
  source_id text,
  revenue_impact_dh numeric NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,code)
);
CREATE INDEX IF NOT EXISTS revenue_os_operational_exceptions_status_idx
  ON public.revenue_os_operational_exceptions(tenant_id,status,severity,updated_at DESC);
ALTER TABLE public.revenue_os_operational_exceptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.revenue_os_operational_exceptions FROM anon, authenticated;
GRANT ALL ON public.revenue_os_operational_exceptions TO service_role;

-- Channel posture is stored tenant-by-tenant in revenue_os_adapter_configs.
-- Preserve Email OS, direct Gmail/Calendar disabled, and the current WhatsApp enabled value.
UPDATE public.revenue_os_adapter_configs
SET enabled=true, execution_mode='live', allow_internal=true, allow_approved_external=true, updated_at=now()
WHERE adapter_code='email_os';
UPDATE public.revenue_os_adapter_configs
SET enabled=false, execution_mode='live', allow_internal=true, allow_approved_external=false, updated_at=now()
WHERE adapter_code IN ('gmail','calendar');
UPDATE public.revenue_os_adapter_configs
SET execution_mode='live', allow_internal=true, allow_approved_external=enabled, updated_at=now()
WHERE adapter_code='whatsapp';

COMMIT;
