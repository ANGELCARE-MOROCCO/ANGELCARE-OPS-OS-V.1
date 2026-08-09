-- ANGELCARE Desktop Mega ZIP 4
-- Universal business-context bridge and accountable human-operated WhatsApp workflows.
-- This schema stores ANGELCARE business context, prepared drafts and operator-declared outcomes.
-- It does not store or scrape WhatsApp conversation content, cookies, contacts, QR secrets or delivery/read states.

create extension if not exists pgcrypto;

create table if not exists public.whatsapp_context_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null,
  context_type text not null,
  entity_id text not null,
  entity_name text not null,
  phone_number_raw text,
  phone_number_e164 text,
  phone_status text not null default 'missing' check (phone_status in ('validated','needs_confirmation','incomplete','unsupported','missing')),
  module_label text not null,
  source_route text not null,
  communication_purpose text not null,
  current_stage text,
  assigned_user_id uuid,
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  preferred_language text not null default 'fr',
  expected_outcome text,
  prepared_message text,
  adapter_id text,
  source_table text,
  source_snapshot jsonb not null default '{}'::jsonb,
  variables jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','ready','opened','awaiting_outcome','completed','cancelled')),
  opened_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_prepared_messages (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  message_mode text not null default 'corporate',
  language text not null default 'fr',
  source_type text not null default 'context_default' check (source_type in ('record','approved_template','module_default','workspace_default','context_default','manual')),
  template_id uuid,
  body text not null,
  variables_snapshot jsonb not null default '{}'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_message_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  module text not null default 'universal',
  context_types jsonb not null default '[]'::jsonb,
  purpose text,
  language text not null default 'fr',
  message_mode text not null default 'corporate',
  body text not null,
  approval_status text not null default 'approved' check (approval_status in ('draft','review','approved','retired')),
  active boolean not null default true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_message_snippets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  category text not null,
  module text not null default 'universal',
  context_types jsonb not null default '[]'::jsonb,
  language text not null default 'fr',
  body text not null,
  approval_status text not null default 'approved' check (approval_status in ('draft','review','approved','retired')),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_contact_attempts (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  device_id uuid references public.whatsapp_desktop_devices(id) on delete set null,
  normalized_phone text not null,
  purpose text not null,
  prepared_message_snapshot text,
  opened_at timestamptz not null default now(),
  declared_sent_at timestamptz,
  outcome_status text,
  outcome_recorded_at timestamptz,
  outcome_note text,
  next_action_at timestamptz,
  related_task_id text,
  evidence_reference text,
  status text not null default 'opened' check (status in ('opened','awaiting_outcome','completed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_contact_outcomes (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.whatsapp_contact_attempts(id) on delete cascade,
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  outcome_status text not null,
  outcome_note text,
  next_action_at timestamptz,
  business_stage_update text,
  evidence_reference text,
  declared_by_operator boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_notes (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  visibility text not null default 'workspace' check (visibility in ('private','workspace','department','management')),
  body text not null,
  edit_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_tasks (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  contact_attempt_id uuid references public.whatsapp_contact_attempts(id) on delete set null,
  created_by uuid not null,
  owner_user_id uuid,
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  due_at timestamptz,
  expected_outcome text,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled','overdue')),
  mirror_table text,
  mirror_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_appointments (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  created_by uuid not null,
  title text not null,
  purpose text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  meeting_type text not null default 'phone' check (meeting_type in ('phone','google_meet','physical','whatsapp','other')),
  attendees jsonb not null default '[]'::jsonb,
  reminder_minutes integer not null default 60,
  status text not null default 'scheduled' check (status in ('scheduled','confirmed','completed','cancelled','no_show')),
  mirror_table text,
  mirror_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_documents (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  label text not null,
  category text not null default 'document',
  filename text,
  secure_url text not null,
  expires_at timestamptz,
  source text not null default 'adapter',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_handoffs (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  from_workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  to_workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  from_user_id uuid not null,
  assigned_user_id uuid,
  reason text not null,
  summary text not null,
  urgency text not null default 'normal' check (urgency in ('low','normal','high','critical')),
  expected_next_action text,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','accepted','completed','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_escalations (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  requested_by uuid not null,
  assigned_to uuid,
  escalation_type text not null,
  reason text not null,
  requested_decision text,
  urgency text not null default 'high' check (urgency in ('normal','high','critical')),
  status text not null default 'open' check (status in ('open','acknowledged','resolved','rejected','cancelled')),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_context_events (
  id bigint generated by default as identity primary key,
  context_id uuid not null references public.whatsapp_context_sessions(id) on delete cascade,
  workspace_id uuid not null references public.whatsapp_desktop_workspaces(id) on delete cascade,
  user_id uuid not null,
  event_type text not null,
  title text not null,
  detail text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_context_sessions_entity_idx on public.whatsapp_context_sessions(context_type, entity_id, created_at desc);
create index if not exists whatsapp_context_sessions_workspace_idx on public.whatsapp_context_sessions(workspace_id, status, updated_at desc);
create index if not exists whatsapp_context_attempts_context_idx on public.whatsapp_contact_attempts(context_id, opened_at desc);
create index if not exists whatsapp_context_attempts_outcome_idx on public.whatsapp_contact_attempts(workspace_id, outcome_status, opened_at desc);
create index if not exists whatsapp_context_events_context_idx on public.whatsapp_context_events(context_id, created_at desc);
create index if not exists whatsapp_context_tasks_due_idx on public.whatsapp_context_tasks(workspace_id, status, due_at);

create or replace trigger whatsapp_context_sessions_touch before update on public.whatsapp_context_sessions for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_prepared_messages_touch before update on public.whatsapp_prepared_messages for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_contact_attempts_touch before update on public.whatsapp_contact_attempts for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_context_notes_touch before update on public.whatsapp_context_notes for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_context_tasks_touch before update on public.whatsapp_context_tasks for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_context_appointments_touch before update on public.whatsapp_context_appointments for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_context_handoffs_touch before update on public.whatsapp_context_handoffs for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_context_escalations_touch before update on public.whatsapp_context_escalations for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_message_templates_touch before update on public.whatsapp_message_templates for each row execute function public.whatsapp_desktop_touch_updated_at();
create or replace trigger whatsapp_message_snippets_touch before update on public.whatsapp_message_snippets for each row execute function public.whatsapp_desktop_touch_updated_at();

alter table public.whatsapp_context_sessions enable row level security;
alter table public.whatsapp_prepared_messages enable row level security;
alter table public.whatsapp_message_templates enable row level security;
alter table public.whatsapp_message_snippets enable row level security;
alter table public.whatsapp_contact_attempts enable row level security;
alter table public.whatsapp_contact_outcomes enable row level security;
alter table public.whatsapp_context_notes enable row level security;
alter table public.whatsapp_context_tasks enable row level security;
alter table public.whatsapp_context_appointments enable row level security;
alter table public.whatsapp_context_documents enable row level security;
alter table public.whatsapp_context_handoffs enable row level security;
alter table public.whatsapp_context_escalations enable row level security;
alter table public.whatsapp_context_events enable row level security;

insert into public.whatsapp_message_snippets (code,label,category,body,sort_order) values
('SALUTATION_CORPORATE','Salutation corporate','salutation','Bonjour {{contact_first_name}},',10),
('AVAILABILITY_REQUEST','Demande de disponibilité','meeting','Seriez-vous disponible pour un échange court afin de convenir des prochaines étapes ?',20),
('APPOINTMENT_CONFIRM','Confirmation de rendez-vous','meeting','Nous vous confirmons notre rendez-vous le {{suggested_date}}. Merci de nous confirmer votre disponibilité.',30),
('DOCUMENT_TRANSMISSION','Transmission de document','document','Vous trouverez les éléments convenus. Merci de nous confirmer leur bonne réception.',40),
('FOLLOWUP_SOFT','Relance douce','followup','Je me permets de revenir vers vous afin de savoir si vous avez pu prendre connaissance de notre précédent message.',50),
('FOLLOWUP_DIRECT','Relance directe','followup','Nous avons besoin de votre confirmation afin de finaliser la prochaine étape dans les meilleurs délais.',60),
('PAYMENT_REQUEST','Demande de paiement','payment','Merci de nous confirmer la date prévue de règlement afin que nous puissions mettre à jour votre dossier.',70),
('THANK_YOU','Remerciement','closing','Merci pour votre retour et votre confiance. Notre équipe reste à votre disposition.',80)
on conflict (code) do update set label=excluded.label, category=excluded.category, body=excluded.body, sort_order=excluded.sort_order, active=true;

insert into public.whatsapp_message_templates (code,name,module,context_types,purpose,language,message_mode,body) values
('B2B_MEETING_REQUEST','B2B · Demande de rendez-vous','b2b','["b2b_prospect","b2b_partner","commercial_opportunity"]'::jsonb,'meeting_request','fr','commercial_direct','Bonjour {{contact_first_name}},\n\nJe vous contacte au nom d’ANGELCARE concernant {{entity_name}}. Seriez-vous disponible pour un échange de 15 minutes afin de convenir des prochaines étapes ?\n\nBien cordialement,\n{{operator_name}}\nANGELCARE'),
('ACADEMY_SESSION_CONFIRM','Academy · Confirmation de session','academy','["academy_learner","academy_partner","training_session"]'::jsonb,'session_confirmation','fr','training_academy','Bonjour {{contact_first_name}},\n\nNous vous confirmons les informations relatives à {{entity_name}}. Merci de nous confirmer votre disponibilité et la bonne réception des éléments transmis.\n\nANGELCARE Academy'),
('SUPPORT_PROGRESS','Support · Point d’avancement','support','["support_case","customer","parent"]'::jsonb,'support_update','fr','customer_care','Bonjour {{contact_first_name}},\n\nLe Support Client ANGELCARE revient vers vous concernant {{entity_name}}. Nous souhaitons vous informer de l’avancement et confirmer avec vous la prochaine étape.\n\nCordialement,\n{{operator_name}}'),
('PAYMENT_FOLLOWUP','Finance · Relance de règlement','finance','["invoice","payment_followup","quotation"]'::jsonb,'payment_followup','fr','payment_followup','Bonjour {{contact_first_name}},\n\nNous revenons vers vous concernant {{entity_name}}. Merci de nous confirmer la bonne réception ainsi que la date prévue pour la prochaine étape financière.\n\nCordialement,\n{{operator_name}}\nANGELCARE')
on conflict (code) do update set name=excluded.name,module=excluded.module,context_types=excluded.context_types,purpose=excluded.purpose,body=excluded.body,active=true;
