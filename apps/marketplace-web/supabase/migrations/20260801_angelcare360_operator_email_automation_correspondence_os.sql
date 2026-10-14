begin;

-- Fail fast before any object is created. This prevents a partially understood
-- install when the cumulative Commercial / Customer / Tenant baseline is absent.
do $angelcare_email_preflight$
declare
  missing_relations text[];
begin
  select array_agg(required_relation)
  into missing_relations
  from (
    values
      ('public.angelcare360_operator_clients'),
      ('public.angelcare360_operator_tenants'),
      ('public.angelcare360_operator_growth_contacts'),
      ('public.angelcare360_operator_growth_institutions')
  ) as required(required_relation)
  where to_regclass(required_relation) is null;

  if missing_relations is not null then
    raise exception
      'Email Automation OS prerequisites are missing: %',
      array_to_string(missing_relations, ', ');
  end if;
end
$angelcare_email_preflight$;

-- AngelCare 360 Operator — Email Automation, Customer Correspondence & Inbox Intelligence OS
-- Additive only. Email OS remains the authoritative transport and mailbox layer.

create table if not exists public.angelcare360_operator_email_templates (
  id uuid primary key default gen_random_uuid(),
  template_code text not null unique,
  name text not null,
  purpose text not null default 'general_correspondence',
  language text not null default 'fr',
  status text not null default 'draft',
  mailbox_key text,
  subject_template text not null,
  html_template text,
  text_template text not null,
  variable_schema jsonb not null default '{}'::jsonb,
  approval_required boolean not null default false,
  version_number integer not null default 1,
  effective_from timestamptz,
  effective_to timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','review','active','retired','archived'))
);

create table if not exists public.angelcare360_operator_email_automation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  name text not null,
  description text,
  status text not null default 'draft',
  trigger_event text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '{"action":"queue_email"}'::jsonb,
  recipient_policy jsonb not null default '{}'::jsonb,
  mailbox_key text,
  template_id uuid references public.angelcare360_operator_email_templates(id) on delete set null,
  approval_policy jsonb not null default '{}'::jsonb,
  suppression_policy jsonb not null default '{"respect_global":true}'::jsonb,
  frequency_policy jsonb not null default '{"max_per_week":2}'::jsonb,
  quiet_hours jsonb not null default '{"start":"19:00","end":"08:00"}'::jsonb,
  effective_from timestamptz,
  effective_to timestamptz,
  version_number integer not null default 1,
  last_evaluated_at timestamptz,
  last_executed_at timestamptz,
  execution_count integer not null default 0,
  failure_count integer not null default 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','paused','retired','archived'))
);

create table if not exists public.angelcare360_operator_email_automation_rule_versions (
  id uuid primary key default gen_random_uuid(),
  automation_rule_id uuid not null references public.angelcare360_operator_email_automation_rules(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (automation_rule_id, version_number)
);

create table if not exists public.angelcare360_operator_email_journeys (
  id uuid primary key default gen_random_uuid(),
  journey_code text not null unique,
  name text not null,
  purpose text not null,
  status text not null default 'draft',
  steps jsonb not null default '[]'::jsonb,
  entry_conditions jsonb not null default '{}'::jsonb,
  exit_conditions jsonb not null default '{}'::jsonb,
  suppression_policy jsonb not null default '{}'::jsonb,
  version_number integer not null default 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','active','paused','retired','archived'))
);

create table if not exists public.angelcare360_operator_email_messages (
  id uuid primary key default gen_random_uuid(),
  message_reference text not null unique,
  direction text not null,
  thread_key text,
  mailbox_key text,
  mailbox_email text,
  provider_message_id text,
  in_reply_to text,
  subject text not null,
  body_text text,
  body_html text,
  sender_email text not null default '',
  sender_name text,
  recipient_emails jsonb not null default '[]'::jsonb,
  cc_emails jsonb not null default '[]'::jsonb,
  bcc_emails jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  delivery_state text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  failure_reason text,
  automation_rule_id uuid references public.angelcare360_operator_email_automation_rules(id) on delete set null,
  template_id uuid references public.angelcare360_operator_email_templates(id) on delete set null,
  client_id uuid references public.angelcare360_operator_clients(id) on delete set null,
  contact_id uuid references public.angelcare360_operator_growth_contacts(id) on delete set null,
  institution_id uuid references public.angelcare360_operator_growth_institutions(id) on delete set null,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  owner_id uuid,
  assigned_team text,
  classification text,
  confidence text,
  requires_response boolean not null default false,
  response_due_at timestamptz,
  scheduled_at timestamptz,
  sent_at timestamptz,
  received_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  resolved_at timestamptz,
  attachments jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (direction in ('outbound','inbound')),
  check (status in ('draft','scheduled','awaiting_approval','approved','queued','bridge_processing','smtp_accepted','sent','received','assigned','waiting_internal','waiting_customer','replied','snoozed','resolved','failed','retry_scheduled','permanently_failed','cancelled','archived'))
);

create table if not exists public.angelcare360_operator_email_automation_executions (
  id uuid primary key default gen_random_uuid(),
  automation_rule_id uuid references public.angelcare360_operator_email_automation_rules(id) on delete set null,
  message_id uuid references public.angelcare360_operator_email_messages(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  client_id uuid references public.angelcare360_operator_clients(id) on delete set null,
  status text not null default 'evaluating',
  outcome jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  check (status in ('evaluating','queued','completed','skipped','failed','cancelled'))
);

create table if not exists public.angelcare360_operator_email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.angelcare360_operator_email_messages(id) on delete cascade,
  event_type text not null,
  provider text not null default 'email-os',
  provider_event_id text,
  occurred_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.angelcare360_operator_email_relationship_links (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.angelcare360_operator_email_messages(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  relationship_type text not null default 'context',
  confidence text not null default 'confirmed',
  source text not null default 'system',
  linked_by uuid,
  linked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (message_id, entity_type, entity_id, relationship_type)
);

create table if not exists public.angelcare360_operator_email_inbound_matches (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null unique references public.angelcare360_operator_email_messages(id) on delete cascade,
  sender_email text not null,
  client_id uuid references public.angelcare360_operator_clients(id) on delete set null,
  contact_id uuid references public.angelcare360_operator_growth_contacts(id) on delete set null,
  institution_id uuid references public.angelcare360_operator_growth_institutions(id) on delete set null,
  tenant_id uuid references public.angelcare360_operator_tenants(id) on delete set null,
  confidence text not null default 'unmatched',
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'unmatched',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (confidence in ('confirmed','high','suggested','ambiguous','unmatched')),
  check (status in ('matched','suggested','ambiguous','unmatched','rejected'))
);

create table if not exists public.angelcare360_operator_email_thread_assignments (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null unique,
  owner_id uuid,
  team_key text,
  state text not null default 'unassigned',
  priority text not null default 'normal',
  sla_due_at timestamptz,
  snoozed_until timestamptz,
  assigned_by uuid,
  assigned_at timestamptz,
  last_activity_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state in ('unassigned','assigned','waiting_customer','waiting_internal','snoozed','resolved','closed'))
);

create table if not exists public.angelcare360_operator_email_approvals (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.angelcare360_operator_email_messages(id) on delete cascade,
  automation_rule_id uuid references public.angelcare360_operator_email_automation_rules(id) on delete set null,
  status text not null default 'requested',
  approval_type text not null default 'email_send',
  requested_by uuid,
  approver_id uuid,
  reason text,
  risk_summary text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('requested','pending','approved','rejected','cancelled','expired'))
);

create table if not exists public.angelcare360_operator_email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  scope text not null default 'global',
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  reason text not null,
  status text not null default 'active',
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scope in ('global','client','automation','mailbox')),
  check (status in ('active','expired','revoked')),
  unique (email, scope, client_id)
);

create table if not exists public.angelcare360_operator_email_business_commitments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.angelcare360_operator_email_messages(id) on delete set null,
  thread_key text,
  client_id uuid references public.angelcare360_operator_clients(id) on delete cascade,
  title text not null,
  commitment_type text not null default 'follow_up',
  owner_id uuid,
  customer_owner text,
  status text not null default 'open',
  due_at timestamptz,
  completed_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('open','in_progress','waiting_customer','completed','cancelled','overdue'))
);

create table if not exists public.angelcare360_operator_email_tracking_links (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.angelcare360_operator_email_messages(id) on delete cascade,
  token_hash text not null unique,
  target_url text not null,
  link_type text not null default 'cta',
  click_count integer not null default 0,
  first_clicked_at timestamptz,
  last_clicked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_messages_client on public.angelcare360_operator_email_messages(client_id, created_at desc);
create index if not exists idx_email_messages_thread on public.angelcare360_operator_email_messages(thread_key, created_at);
create index if not exists idx_email_messages_queue on public.angelcare360_operator_email_messages(status, scheduled_at, next_retry_at);
create index if not exists idx_email_messages_inbound on public.angelcare360_operator_email_messages(direction, received_at desc);
create index if not exists idx_email_messages_provider on public.angelcare360_operator_email_messages(provider_message_id) where provider_message_id is not null;
create index if not exists idx_email_rules_trigger on public.angelcare360_operator_email_automation_rules(trigger_event, status);
create index if not exists idx_email_executions_rule on public.angelcare360_operator_email_automation_executions(automation_rule_id, created_at desc);
create index if not exists idx_email_delivery_message on public.angelcare360_operator_email_delivery_events(message_id, occurred_at desc);
create index if not exists idx_email_match_sender on public.angelcare360_operator_email_inbound_matches(lower(sender_email), status);
create index if not exists idx_email_approval_queue on public.angelcare360_operator_email_approvals(status, requested_at);
create index if not exists idx_email_commitment_client on public.angelcare360_operator_email_business_commitments(client_id, status, due_at);

alter table public.angelcare360_operator_email_templates enable row level security;
alter table public.angelcare360_operator_email_automation_rules enable row level security;
alter table public.angelcare360_operator_email_automation_rule_versions enable row level security;
alter table public.angelcare360_operator_email_journeys enable row level security;
alter table public.angelcare360_operator_email_messages enable row level security;
alter table public.angelcare360_operator_email_automation_executions enable row level security;
alter table public.angelcare360_operator_email_delivery_events enable row level security;
alter table public.angelcare360_operator_email_relationship_links enable row level security;
alter table public.angelcare360_operator_email_inbound_matches enable row level security;
alter table public.angelcare360_operator_email_thread_assignments enable row level security;
alter table public.angelcare360_operator_email_approvals enable row level security;
alter table public.angelcare360_operator_email_suppressions enable row level security;
alter table public.angelcare360_operator_email_business_commitments enable row level security;
alter table public.angelcare360_operator_email_tracking_links enable row level security;

revoke all on public.angelcare360_operator_email_templates from anon, authenticated;
revoke all on public.angelcare360_operator_email_automation_rules from anon, authenticated;
revoke all on public.angelcare360_operator_email_automation_rule_versions from anon, authenticated;
revoke all on public.angelcare360_operator_email_journeys from anon, authenticated;
revoke all on public.angelcare360_operator_email_messages from anon, authenticated;
revoke all on public.angelcare360_operator_email_automation_executions from anon, authenticated;
revoke all on public.angelcare360_operator_email_delivery_events from anon, authenticated;
revoke all on public.angelcare360_operator_email_relationship_links from anon, authenticated;
revoke all on public.angelcare360_operator_email_inbound_matches from anon, authenticated;
revoke all on public.angelcare360_operator_email_thread_assignments from anon, authenticated;
revoke all on public.angelcare360_operator_email_approvals from anon, authenticated;
revoke all on public.angelcare360_operator_email_suppressions from anon, authenticated;
revoke all on public.angelcare360_operator_email_business_commitments from anon, authenticated;
revoke all on public.angelcare360_operator_email_tracking_links from anon, authenticated;

grant all on public.angelcare360_operator_email_templates to service_role;
grant all on public.angelcare360_operator_email_automation_rules to service_role;
grant all on public.angelcare360_operator_email_automation_rule_versions to service_role;
grant all on public.angelcare360_operator_email_journeys to service_role;
grant all on public.angelcare360_operator_email_messages to service_role;
grant all on public.angelcare360_operator_email_automation_executions to service_role;
grant all on public.angelcare360_operator_email_delivery_events to service_role;
grant all on public.angelcare360_operator_email_relationship_links to service_role;
grant all on public.angelcare360_operator_email_inbound_matches to service_role;
grant all on public.angelcare360_operator_email_thread_assignments to service_role;
grant all on public.angelcare360_operator_email_approvals to service_role;
grant all on public.angelcare360_operator_email_suppressions to service_role;
grant all on public.angelcare360_operator_email_business_commitments to service_role;
grant all on public.angelcare360_operator_email_tracking_links to service_role;

insert into public.angelcare360_operator_email_templates
(template_code,name,purpose,language,status,mailbox_key,subject_template,text_template,variable_schema,approval_required,version_number)
values
('TPL-TENANT-INVITE-FR','Invitation administrateur tenant','tenant_access','fr','active','B2B','Activation de votre accès AngelCare 360 — {{client.display_name}}','Bonjour,\n\nAngelCare vous invite à activer votre accès administrateur sécurisé pour {{client.display_name}}.\n\n{{event.activation_url}}\n\nCe lien est personnel, à usage unique et expire automatiquement.','{"required":["client.display_name","event.activation_url"]}'::jsonb,false,1),
('TPL-TICKET-ACK-FR','Accusé de réception support','support','fr','active','SUPPORTS','Votre demande AngelCare est enregistrée — {{event.reference}}','Bonjour,\n\nVotre demande {{event.reference}} a été reçue et qualifiée. Notre équipe vous communiquera la prochaine étape.','{"required":["event.reference"]}'::jsonb,false,1),
('TPL-COMPLAINT-ACK-FR','Accusé de réception réclamation','complaint','fr','active','SUPPORTS','Réclamation enregistrée — {{event.reference}}','Bonjour,\n\nVotre réclamation {{event.reference}} est enregistrée. Elle fait l’objet d’une revue prioritaire et traçable.','{"required":["event.reference"]}'::jsonb,true,1),
('TPL-INVOICE-DUE-FR','Rappel échéance facture','finance','fr','active','B2B','Échéance à venir — {{event.invoice_number}}','Bonjour,\n\nLa facture {{event.invoice_number}} arrive à échéance le {{event.due_date}}. Solde: {{event.amount}} Dh.','{"required":["event.invoice_number","event.due_date","event.amount"]}'::jsonb,false,1),
('TPL-RENEWAL-FR','Préparation renouvellement','renewal','fr','active','COMMERCIAL','Préparation de votre renouvellement AngelCare 360','Bonjour,\n\nNous préparons avec vous la prochaine étape de votre partenariat AngelCare 360 et souhaitons planifier une revue de valeur.','{}'::jsonb,true,1)
on conflict (template_code) do nothing;

insert into public.angelcare360_operator_email_automation_rules
(rule_code,name,description,status,trigger_event,conditions,actions,recipient_policy,mailbox_key,template_id,approval_policy,suppression_policy,frequency_policy,quiet_hours,version_number)
select 'AUT-TENANT-INVITE-REMINDER','Reminder activation tenant','Relance après invitation non ouverte.','draft','tenant.admin.invitation_expiring','{}'::jsonb,'{"action":"queue_email","delay_minutes":1440,"classification":"tenant_access_request"}'::jsonb,'{"role_types":["tenant_owner","school_admin"]}'::jsonb,'B2B',id,'{"required":false}'::jsonb,'{"respect_global":true}'::jsonb,'{"max_per_week":2}'::jsonb,'{"start":"19:00","end":"08:00"}'::jsonb,1 from public.angelcare360_operator_email_templates where template_code='TPL-TENANT-INVITE-FR'
on conflict (rule_code) do nothing;

insert into public.angelcare360_operator_email_automation_rules
(rule_code,name,description,status,trigger_event,conditions,actions,recipient_policy,mailbox_key,template_id,approval_policy,suppression_policy,frequency_policy,quiet_hours,version_number)
select 'AUT-TICKET-ACK','Accusé de réception ticket','Confirmation automatique à la création d’un ticket.','draft','ticket.created','{}'::jsonb,'{"action":"queue_email","classification":"support_request","requires_response":false}'::jsonb,'{"role_types":["support_contact","school_admin"]}'::jsonb,'SUPPORTS',id,'{"required":false}'::jsonb,'{"respect_global":true}'::jsonb,'{"max_per_week":10}'::jsonb,'{}'::jsonb,1 from public.angelcare360_operator_email_templates where template_code='TPL-TICKET-ACK-FR'
on conflict (rule_code) do nothing;

commit;

select table_name, 'READY' as migration_status
from information_schema.tables
where table_schema='public' and table_name like 'angelcare360_operator_email_%'
order by table_name;
