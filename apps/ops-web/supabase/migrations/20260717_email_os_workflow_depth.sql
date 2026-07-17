create extension if not exists pgcrypto;

create table if not exists public.email_os_message_workflow (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  source_table text not null,
  thread_id text,
  subject text,
  sender_name text,
  sender_email text,
  recipient_email text,
  status text not null default 'new' check (status in ('new', 'triaged', 'assigned', 'in_progress', 'waiting_client', 'waiting_internal', 'resolved', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent', 'vip')),
  category text not null default 'other' check (category in ('parent_client', 'b2b', 'partnership', 'recruitment', 'finance_payment', 'complaint', 'supplier', 'internal', 'other')),
  owner_user_id text,
  assigned_by text,
  assigned_at timestamptz,
  read_at timestamptz,
  archived_at timestamptz,
  resolved_at timestamptz,
  reopened_count integer not null default 0,
  first_response_due_at timestamptz,
  waiting_since_at timestamptz,
  last_operator_action_at timestamptz,
  last_action text,
  last_action_at timestamptz,
  linked_entity_type text,
  linked_entity_id text,
  linked_entity_label text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_os_message_workflow_message_unique
  on public.email_os_message_workflow (mailbox_id, message_id, source_table);

create index if not exists email_os_message_workflow_mailbox_status_idx
  on public.email_os_message_workflow (mailbox_id, status, updated_at desc);

create index if not exists email_os_message_workflow_priority_idx
  on public.email_os_message_workflow (priority, first_response_due_at);

create index if not exists email_os_message_workflow_category_idx
  on public.email_os_message_workflow (category, updated_at desc);

create table if not exists public.email_os_message_notes (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  thread_id text,
  body text not null,
  author_user_id text,
  author_name text,
  visibility text not null default 'internal' check (visibility in ('internal', 'private')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_os_message_notes_message_idx
  on public.email_os_message_notes (mailbox_id, message_id, created_at desc);

create table if not exists public.email_os_message_tasks (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  thread_id text,
  title text not null,
  description text,
  owner_user_id text,
  due_at timestamptz,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent', 'vip')),
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists email_os_message_tasks_message_idx
  on public.email_os_message_tasks (mailbox_id, message_id, status, due_at);

create table if not exists public.email_os_message_assignments (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  thread_id text,
  owner_user_id text,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_os_message_assignments_message_idx
  on public.email_os_message_assignments (mailbox_id, message_id, assigned_at desc);

create table if not exists public.email_os_message_entity_links (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  thread_id text,
  entity_type text not null,
  entity_id text not null,
  entity_label text,
  created_by text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_os_message_entity_links_message_idx
  on public.email_os_message_entity_links (mailbox_id, message_id, entity_type, created_at desc);

create table if not exists public.email_os_message_audit_events (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  message_id text not null,
  external_id text,
  thread_id text,
  action text not null,
  actor_user_id text,
  severity text not null default 'info',
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_os_message_audit_events_message_idx
  on public.email_os_message_audit_events (mailbox_id, message_id, created_at desc);

create table if not exists public.email_os_response_templates (
  id text primary key,
  mailbox_id text,
  name text not null,
  category text not null default 'other',
  subject_template text not null default '',
  body_template text not null default '',
  language text not null default 'fr',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by text,
  variables jsonb not null default '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_os_response_templates_mailbox_idx
  on public.email_os_response_templates (mailbox_id, status, updated_at desc);

alter table public.email_os_message_workflow disable row level security;
alter table public.email_os_message_notes disable row level security;
alter table public.email_os_message_tasks disable row level security;
alter table public.email_os_message_assignments disable row level security;
alter table public.email_os_message_entity_links disable row level security;
alter table public.email_os_message_audit_events disable row level security;
alter table public.email_os_response_templates disable row level security;

insert into public.email_os_response_templates (id, mailbox_id, name, category, subject_template, body_template, language, status, created_by, variables)
values
  ('template-partnership-first-response', null, 'Partnership first response', 'partnership', 'Re: {{service}} - Partnership request', 'Bonjour {{first_name}},\n\nMerci pour votre message et votre intérêt pour AngelCare.\n\n{{operator}} a bien reçu votre demande concernant {{service}}. Nous revenons vers vous avec les prochaines étapes opérationnelles.\n\nCordialement,\n{{mailbox}}', 'fr', 'active', 'system', '["first_name","service","operator","mailbox"]'::jsonb),
  ('template-b2b-quote-follow-up', null, 'B2B quote follow-up', 'b2b', 'Re: Devis {{service}}', 'Bonjour {{first_name}},\n\nNous faisons suite à votre demande de devis pour {{service}}.\n\n{{operator}} reste disponible pour préciser le périmètre, les délais et les modalités de déploiement.\n\nCordialement,\nAngelCare B2B', 'fr', 'active', 'system', '["first_name","service","operator"]'::jsonb),
  ('template-candidate-recruitment-response', null, 'Candidate/recruitment response', 'recruitment', 'Re: Candidature {{service}}', 'Bonjour {{first_name}},\n\nMerci pour votre candidature et pour votre intérêt pour AngelCare.\n\nNous examinons votre dossier et reviendrons vers vous dès que possible avec les prochaines étapes.\n\nCordialement,\n{{mailbox}}', 'fr', 'active', 'system', '["first_name","mailbox","operator"]'::jsonb),
  ('template-parent-client-response', null, 'Parent/client response', 'parent_client', 'Re: Votre demande', 'Bonjour {{first_name}},\n\nMerci pour votre message. Nous avons bien pris en compte votre demande concernant {{service}}.\n\n{{operator}} vous répondra avec les informations utiles dans les meilleurs délais.\n\nCordialement,\nAngelCare', 'fr', 'active', 'system', '["first_name","service","operator"]'::jsonb),
  ('template-complaint-acknowledgement', null, 'Complaint acknowledgement', 'complaint', 'Re: Réclamation {{service}}', 'Bonjour {{first_name}},\n\nNous accusons réception de votre réclamation concernant {{service}}.\n\nVotre demande est désormais prise en charge par l’équipe {{mailbox}}. Nous reviendrons vers vous avec un suivi précis.\n\nCordialement,\n{{operator}}', 'fr', 'active', 'system', '["first_name","service","mailbox","operator"]'::jsonb),
  ('template-payment-invoice-follow-up', null, 'Payment/invoice follow-up', 'finance_payment', 'Re: Paiement / facture', 'Bonjour {{first_name}},\n\nNous faisons suite à votre demande liée à {{service}}.\n\nMerci de nous transmettre les éléments manquants afin que nous puissions finaliser le traitement.\n\nCordialement,\n{{mailbox}}', 'fr', 'active', 'system', '["first_name","service","mailbox"]'::jsonb),
  ('template-supplier-request', null, 'Supplier request', 'supplier', 'Re: Demande fournisseur', 'Bonjour {{first_name}},\n\nMerci pour votre message. Nous examinons les informations relatives à {{service}} et revenons vers vous avec la suite à donner.\n\nCordialement,\n{{operator}}', 'fr', 'active', 'system', '["first_name","service","operator"]'::jsonb),
  ('template-meeting-scheduling', null, 'Meeting scheduling', 'internal', 'Re: Planification de réunion', 'Bonjour {{first_name}},\n\nMerci pour votre disponibilité. Nous proposons de planifier un échange au sujet de {{service}}.\n\nMerci de nous partager vos créneaux.\n\nCordialement,\n{{mailbox}}', 'fr', 'active', 'system', '["first_name","service","mailbox"]'::jsonb),
  ('template-missing-information', null, 'Missing information request', 'other', 'Re: Informations complémentaires requises', 'Bonjour {{first_name}},\n\nPour avancer sur {{service}}, il nous manque encore quelques informations.\n\nMerci de nous transmettre les éléments suivants dès que possible.\n\nCordialement,\n{{operator}}', 'fr', 'active', 'system', '["first_name","service","operator"]'::jsonb),
  ('template-escalation-acknowledgement', null, 'Escalation acknowledgement', 'internal', 'Re: Escalade {{service}}', 'Bonjour {{first_name}},\n\nVotre demande a été escaladée et est désormais suivie de près.\n\nNous assurons un retour opérationnel dès que possible.\n\nCordialement,\nAngelCare', 'fr', 'active', 'system', '["first_name","service"]'::jsonb)
on conflict (id) do update set
  mailbox_id = excluded.mailbox_id,
  name = excluded.name,
  category = excluded.category,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  language = excluded.language,
  status = excluded.status,
  created_by = excluded.created_by,
  variables = excluded.variables,
  updated_at = now();
