-- SALES EXECUTION OS V30 - PACK 2 EXECUTION CONTROL LAYER

create table if not exists public.sales_script_templates (
  id bigserial primary key,
  title text not null,
  channel text not null default 'call',
  segment text not null default 'general',
  trigger_context text not null default 'general',
  pressure_level text not null default 'medium',
  script_body text not null,
  variables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_followup_sequences (
  id bigserial primary key,
  title text not null,
  segment text not null default 'general',
  trigger_stage text not null default 'qualified',
  sequence_steps jsonb not null default '[]'::jsonb,
  escalation_rule text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_payment_promises (
  id bigserial primary key,
  lead_id bigint,
  family_id bigint,
  contract_id bigint,
  quote_id bigint,
  promised_amount numeric(12,2),
  currency text not null default 'MAD',
  payment_method text,
  promised_at timestamptz,
  proof_status text not null default 'not_requested',
  verification_status text not null default 'pending',
  activation_blocked boolean not null default true,
  recovery_action text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_discount_approvals (
  id bigserial primary key,
  lead_id bigint,
  quote_id bigint,
  requested_by uuid,
  approved_by uuid,
  original_amount numeric(12,2),
  requested_discount numeric(12,2) not null default 0,
  reason text not null,
  margin_risk text not null default 'medium',
  approval_status text not null default 'pending',
  manager_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_decision_rules (
  id bigserial primary key,
  rule_name text not null,
  rule_context text not null default 'general',
  condition_summary text not null,
  recommended_action text not null,
  escalation_required boolean not null default false,
  priority text not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_script_templates_context on public.sales_script_templates(trigger_context);
create index if not exists idx_sales_followup_sequences_stage on public.sales_followup_sequences(trigger_stage);
create index if not exists idx_sales_payment_promises_lead_id on public.sales_payment_promises(lead_id);
create index if not exists idx_sales_payment_promises_verification on public.sales_payment_promises(verification_status);
create index if not exists idx_sales_discount_approvals_status on public.sales_discount_approvals(approval_status);
create index if not exists idx_sales_decision_rules_context on public.sales_decision_rules(rule_context);

insert into public.sales_script_templates (title, channel, segment, trigger_context, pressure_level, script_body, variables) values
('Family Trust Reassurance Call','call','b2c_family','trust_objection','medium','Clarify the fear, explain selection, follow-up, replacement and operational accountability, then ask for the exact blocker remaining.','["client_name","service_need","city","start_date"]'::jsonb),
('Payment Proof WhatsApp','whatsapp','general','payment_promise','high','Bonjour, pour activer votre demande sans retard, merci de confirmer le paiement et envoyer la preuve avant l heure convenue.','["amount","deadline","payment_method"]'::jsonb),
('Decision Deadline Recap','whatsapp','general','delayed_decision','medium','Je vous récapitule l option recommandée, le prix, le délai et la prochaine action attendue afin de sécuriser votre place.','["package","price","deadline"]'::jsonb)
on conflict do nothing;

insert into public.sales_followup_sequences (title, segment, trigger_stage, sequence_steps, escalation_rule) values
('High Intent Family Close','b2c_family','offer_built','[{"step":"T+0","channel":"call","action":"Confirm decision-maker and final blocker"},{"step":"T+15min","channel":"whatsapp","action":"Send recap and payment method"},{"step":"T+2h","channel":"call","action":"Recover blocker"},{"step":"T+24h","channel":"manager","action":"Escalate if high value"}]'::jsonb,'Escalate if no response after 24h or if payment promise is missed'),
('Payment Promise Recovery','general','payment_promise','[{"step":"T+0","channel":"whatsapp","action":"Request proof"},{"step":"T+1h","channel":"call","action":"Confirm payment issue"},{"step":"T+3h","channel":"manager","action":"Decide activation block"}]'::jsonb,'Block activation if proof is not verified')
on conflict do nothing;

insert into public.sales_decision_rules (rule_name, rule_context, condition_summary, recommended_action, escalation_required, priority) values
('Payment ready high score','closing','Closing score above 70 and payment readiness above 75','Request payment proof and prepare fulfillment handoff',false,'high'),
('Trust blocker','objection','Trust score below 55 or caregiver concern present','Use trust reassurance script before quote pressure',false,'high'),
('Discount requested','deal_desk','Client asks for discount or agent proposes discount','Create discount approval request before confirming price',true,'high'),
('Won without handoff','handoff','Deal marked won without fulfillment handoff','Block completion until handoff checklist is complete',true,'critical')
on conflict do nothing;
