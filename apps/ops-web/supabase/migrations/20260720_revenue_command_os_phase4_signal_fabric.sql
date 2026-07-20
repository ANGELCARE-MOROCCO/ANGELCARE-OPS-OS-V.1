-- ANGELCARE Revenue Command OS — Mega ZIP 4
-- Live Revenue Signal Fabric
-- Cumulative over MZ01 Foundation, MZ02 Digital Twin and MZ03 Doctrine & Memory

begin;
create extension if not exists pgcrypto;

create or replace function public.revenue_os_signal_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=timezone('utc',now()); return new; end $$;

create or replace function public.revenue_os_signal_prevent_raw_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Revenue OS raw signal events are append-only'; end $$;

create table if not exists public.revenue_os_signal_sources (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, source_kind text not null,
 adapter_key text not null, description text not null default '', business_unit_codes jsonb not null default '[]'::jsonb,
 source_tables jsonb not null default '[]'::jsonb, supported_event_types jsonb not null default '[]'::jsonb,
 status text not null default 'unconfigured' check(status in ('healthy','degraded','stale','offline','paused','unconfigured')),
 polling_minutes integer not null default 15 check(polling_minutes between 1 and 10080), stale_after_minutes integer not null default 60,
 last_observed_at timestamptz, last_successful_scan_at timestamptz, last_cursor text, record_count_24h integer not null default 0,
 error_count_24h integer not null default 0, contains_sensitive_data boolean not null default false,
 minimum_permission text not null default 'revenue_os.signals.manage', enabled boolean not null default true,
 configuration jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_os_signal_source_cursors (
 id uuid primary key default gen_random_uuid(), source_code text not null references public.revenue_os_signal_sources(code) on update cascade on delete cascade,
 cursor_key text not null, cursor_value text, watermark_at timestamptz, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()), unique(source_code,cursor_key)
);

create table if not exists public.revenue_os_signal_raw_events (
 id uuid primary key default gen_random_uuid(), event_id text not null unique, source_code text not null references public.revenue_os_signal_sources(code) on update cascade,
 source_record_id text, event_type text not null, occurred_at timestamptz not null, received_at timestamptz not null default timezone('utc',now()),
 deduplication_key text not null, payload_hash text not null, payload jsonb not null default '{}'::jsonb,
 processing_status text not null default 'received' check(processing_status in ('received','normalized','duplicate','rejected','failed')),
 duplicate_of_event_id text, normalized_signal_id uuid, rejection_reason text, redacted_fields jsonb not null default '[]'::jsonb,
 correlation_id text, created_at timestamptz not null default timezone('utc',now())
);
create index if not exists revenue_os_signal_raw_events_source_idx on public.revenue_os_signal_raw_events(source_code,occurred_at desc);
create index if not exists revenue_os_signal_raw_events_dedup_idx on public.revenue_os_signal_raw_events(deduplication_key);
create index if not exists revenue_os_signal_raw_events_status_idx on public.revenue_os_signal_raw_events(processing_status,received_at desc);

drop trigger if exists revenue_os_signal_raw_events_no_update on public.revenue_os_signal_raw_events;
create trigger revenue_os_signal_raw_events_no_update before delete on public.revenue_os_signal_raw_events for each row execute function public.revenue_os_signal_prevent_raw_mutation();

create table if not exists public.revenue_os_signals (
 id uuid primary key default gen_random_uuid(), code text not null unique, raw_event_id uuid references public.revenue_os_signal_raw_events(id) on delete set null,
 source_code text not null references public.revenue_os_signal_sources(code) on update cascade, category text not null, signal_type text not null,
 title text not null, summary text not null default '', business_unit_code text, market_code text, territory_code text, offer_code text, segment_code text,
 severity text not null default 'medium' check(severity in ('critical','high','medium','low','info')),
 confidence text not null default 'unknown' check(confidence in ('confirmed','high','medium','low','unknown')),
 priority_score integer not null default 0 check(priority_score between 0 and 100), urgency_score integer not null default 0 check(urgency_score between 0 and 100),
 opportunity_score integer not null default 0 check(opportunity_score between 0 and 100), risk_score integer not null default 0 check(risk_score between 0 and 100),
 status text not null default 'new' check(status in ('new','triaged','acknowledged','context-ready','monitoring','resolved','dismissed','blocked')),
 occurred_at timestamptz not null, detected_at timestamptz not null default timezone('utc',now()), expires_at timestamptz, owner_role text,
 entities jsonb not null default '[]'::jsonb, evidence jsonb not null default '[]'::jsonb, recommended_command_families jsonb not null default '[]'::jsonb,
 recommended_next_actions jsonb not null default '[]'::jsonb, blocking_reasons jsonb not null default '[]'::jsonb, metadata jsonb not null default '{}'::jsonb,
 acknowledged_by uuid, acknowledged_at timestamptz, resolved_at timestamptz,
 created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);
create index if not exists revenue_os_signals_priority_idx on public.revenue_os_signals(status,severity,priority_score desc);
create index if not exists revenue_os_signals_source_idx on public.revenue_os_signals(source_code,detected_at desc);
create index if not exists revenue_os_signals_category_idx on public.revenue_os_signals(category,detected_at desc);
create index if not exists revenue_os_signals_entities_gin on public.revenue_os_signals using gin(entities);

alter table public.revenue_os_signal_raw_events drop constraint if exists revenue_os_signal_raw_events_normalized_signal_id_fkey;
alter table public.revenue_os_signal_raw_events add constraint revenue_os_signal_raw_events_normalized_signal_id_fkey foreign key(normalized_signal_id) references public.revenue_os_signals(id) on delete set null;

create table if not exists public.revenue_os_signal_entities (
 id uuid primary key default gen_random_uuid(), signal_id uuid not null references public.revenue_os_signals(id) on delete cascade,
 entity_type text not null, entity_id text, entity_code text, label text not null default '', relationship text not null default 'related',
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc',now())
);
create index if not exists revenue_os_signal_entities_lookup_idx on public.revenue_os_signal_entities(entity_type,entity_id,entity_code);

create table if not exists public.revenue_os_signal_evidence (
 id uuid primary key default gen_random_uuid(), signal_id uuid not null references public.revenue_os_signals(id) on delete cascade,
 source_code text not null, label text not null, value text not null default '', observed_at timestamptz not null,
 authority text not null default 'primary', confidence text not null default 'medium', metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_os_signal_rules (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, source_codes jsonb not null default '[]'::jsonb,
 event_types jsonb not null default '[]'::jsonb, category text not null, signal_type text not null, condition_expression text not null default '',
 severity_logic text not null default '', confidence_logic text not null default '', score_logic text not null default '',
 recommended_command_families jsonb not null default '[]'::jsonb, expiry_minutes integer not null default 1440,
 cooldown_minutes integer not null default 60, enabled boolean not null default true, version text not null default '1.0',
 created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_os_signal_scheduled_scans (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, source_code text not null references public.revenue_os_signal_sources(code) on update cascade,
 schedule_expression text not null, timezone text not null default 'Africa/Casablanca', scan_mode text not null default 'incremental',
 lookback_minutes integer not null default 60, maximum_records integer not null default 100, status text not null default 'active',
 last_run_at timestamptz, next_run_at timestamptz, last_outcome text, last_created_signals integer not null default 0,
 consecutive_failures integer not null default 0, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_os_signal_scan_runs (
 id uuid primary key default gen_random_uuid(), code text not null unique, source_code text not null references public.revenue_os_signal_sources(code) on update cascade,
 status text not null default 'running', started_at timestamptz not null default timezone('utc',now()), completed_at timestamptz,
 records_observed integer not null default 0, signals_created integer not null default 0, duplicates integer not null default 0,
 failed_records integer not null default 0, latency_ms integer, error_message text, cursor_before text, cursor_after text,
 requested_by uuid, requested_by_label text, metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_signal_source_health (
 id uuid primary key default gen_random_uuid(), source_code text not null references public.revenue_os_signal_sources(code) on update cascade,
 status text not null, checked_at timestamptz not null default timezone('utc',now()), latency_ms integer, freshness_minutes integer,
 records_observed integer not null default 0, normalized_signals integer not null default 0, duplicate_events integer not null default 0,
 failed_events integer not null default 0, last_error text, diagnostic text not null default '', metadata jsonb not null default '{}'::jsonb
);
create index if not exists revenue_os_signal_source_health_idx on public.revenue_os_signal_source_health(source_code,checked_at desc);

create table if not exists public.revenue_os_signal_deduplication_log (
 id uuid primary key default gen_random_uuid(), deduplication_key text not null, source_code text not null, first_event_id text not null,
 duplicate_event_id text not null, detected_at timestamptz not null default timezone('utc',now()), reason text not null default '', metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_signal_context_snapshots (
 id uuid primary key default gen_random_uuid(), code text not null unique, signal_code text not null references public.revenue_os_signals(code) on update cascade,
 purpose text not null, audience_role text not null, visibility_profile text not null, status text not null default 'building',
 generated_at timestamptz not null default timezone('utc',now()), expires_at timestamptz not null, facts jsonb not null default '[]'::jsonb,
 hypotheses jsonb not null default '[]'::jsonb, constraints jsonb not null default '[]'::jsonb, opportunities jsonb not null default '[]'::jsonb,
 risks jsonb not null default '[]'::jsonb, sources jsonb not null default '[]'::jsonb, redacted_fields jsonb not null default '[]'::jsonb,
 completeness_score integer not null default 0, freshness_score integer not null default 0, created_by uuid, created_by_label text,
 created_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_os_signal_context_sources (
 id uuid primary key default gen_random_uuid(), context_code text not null references public.revenue_os_signal_context_snapshots(code) on update cascade on delete cascade,
 source_type text not null, source_code text not null, label text not null, authority text not null, freshness text not null,
 retrieved_at timestamptz not null, redactions jsonb not null default '[]'::jsonb, metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_signal_subscriptions (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, subscriber_type text not null, subscriber_key text not null,
 categories jsonb not null default '[]'::jsonb, severities jsonb not null default '[]'::jsonb, business_unit_codes jsonb not null default '[]'::jsonb,
 territory_codes jsonb not null default '[]'::jsonb, delivery_mode text not null default 'in-app', cooldown_minutes integer not null default 30,
 active boolean not null default true, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists public.revenue_os_signal_subscription_deliveries (
 id uuid primary key default gen_random_uuid(), subscription_code text not null references public.revenue_os_signal_subscriptions(code) on update cascade,
 signal_code text not null references public.revenue_os_signals(code) on update cascade, delivery_mode text not null, status text not null default 'pending',
 delivered_at timestamptz, blocked_reason text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc',now()),
 unique(subscription_code,signal_code,delivery_mode)
);

create table if not exists public.revenue_os_signal_access_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid, actor_label text not null default '', actor_role text not null default '',
 resource_type text not null, resource_code text not null, visibility_profile text not null, purpose text not null default '',
 fields_redacted jsonb not null default '[]'::jsonb, outcome text not null default 'allowed', accessed_at timestamptz not null default timezone('utc',now()), metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_signal_stale_checks (
 id uuid primary key default gen_random_uuid(), resource_type text not null, resource_code text not null, threshold_minutes integer not null,
 observed_freshness_minutes integer, status text not null, checked_at timestamptz not null default timezone('utc',now()), recommended_action text not null default ''
);

create table if not exists public.revenue_os_signal_webhook_receipts (
 id uuid primary key default gen_random_uuid(), receipt_id text not null unique, source_code text not null, signature_valid boolean not null default false,
 body_hash text not null, status text not null default 'received', rejection_reason text, received_at timestamptz not null default timezone('utc',now()), metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_os_signal_validation_issues (
 id uuid primary key default gen_random_uuid(), code text not null, resource_type text not null, resource_code text not null, category text not null,
 severity text not null, title text not null, detail text not null, recommended_action text not null, status text not null default 'open',
 detected_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()), unique(code,resource_code)
);

create table if not exists public.revenue_os_signal_snapshots (
 id uuid primary key default gen_random_uuid(), snapshot_code text not null unique, release_code text not null, readiness_score integer not null,
 snapshot jsonb not null default '{}'::jsonb, status text not null, created_by uuid, created_by_label text,
 created_at timestamptz not null default timezone('utc',now())
);

-- Updated-at triggers
DO $$ declare t text; begin foreach t in array array['revenue_os_signal_sources','revenue_os_signal_source_cursors','revenue_os_signals','revenue_os_signal_rules','revenue_os_signal_scheduled_scans','revenue_os_signal_subscriptions','revenue_os_signal_validation_issues'] loop execute format('drop trigger if exists %I_touch on public.%I',t,t); execute format('create trigger %I_touch before update on public.%I for each row execute function public.revenue_os_signal_touch_updated_at()',t,t); end loop; end $$;

-- RLS + server-only access
DO $$ declare t text; begin foreach t in array array[
 'revenue_os_signal_sources','revenue_os_signal_source_cursors','revenue_os_signal_raw_events','revenue_os_signals','revenue_os_signal_entities','revenue_os_signal_evidence','revenue_os_signal_rules','revenue_os_signal_scheduled_scans','revenue_os_signal_scan_runs','revenue_os_signal_source_health','revenue_os_signal_deduplication_log','revenue_os_signal_context_snapshots','revenue_os_signal_context_sources','revenue_os_signal_subscriptions','revenue_os_signal_subscription_deliveries','revenue_os_signal_access_logs','revenue_os_signal_stale_checks','revenue_os_signal_webhook_receipts','revenue_os_signal_validation_issues','revenue_os_signal_snapshots'
 ] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from anon, authenticated',t); execute format('grant all on table public.%I to service_role',t); end loop; end $$;

insert into public.revenue_os_signal_sources(code,name,source_kind,adapter_key,description,business_unit_codes,source_tables,supported_event_types,status,polling_minutes,stale_after_minutes,last_observed_at,last_successful_scan_at,last_cursor,record_count_24h,error_count_24h,contains_sensitive_data,minimum_permission,enabled) values
('SRC-B2B-PROSPECTS','Prospects B2B','crm','b2b-prospects','Source gouvernée Prospects B2B pour observation Revenue OS en mode Shadow.','["ACADEMY", "FLASHCARDS", "CORPORATES"]'::jsonb,'["b2b_prospects"]'::jsonb,'["prospect.observed", "prospect.updated"]'::jsonb,'healthy',15,60,'2026-07-20T06:07:00.000Z','2026-07-20T06:05:00.000Z','cursor-001',128,0,false,'revenue_os.signals.manage',true),
('SRC-B2B-CONTACTS','Contacts & décideurs B2B','crm','b2b-contacts','Source gouvernée Contacts & décideurs B2B pour observation Revenue OS en mode Shadow.','["ACADEMY", "FLASHCARDS", "CORPORATES"]'::jsonb,'["b2b_contacts"]'::jsonb,'["contact.observed", "decision-maker.identified"]'::jsonb,'healthy',30,120,'2026-07-20T05:14:00.000Z','2026-07-20T05:10:00.000Z','cursor-002',76,0,true,'revenue_os.signals.manage',true),
('SRC-B2B-MEETINGS','Réunions B2B','calendar','b2b-meetings','Source gouvernée Réunions B2B pour observation Revenue OS en mode Shadow.','["ACADEMY", "CORPORATES"]'::jsonb,'["b2b_meetings"]'::jsonb,'["meeting.observed", "meeting.completed"]'::jsonb,'healthy',15,60,'2026-07-20T04:21:00.000Z','2026-07-20T04:15:00.000Z','cursor-003',18,0,true,'revenue_os.signals.manage',true),
('SRC-B2B-PROPOSALS','Propositions B2B','crm','b2b-proposals','Source gouvernée Propositions B2B pour observation Revenue OS en mode Shadow.','["ACADEMY", "CORPORATES"]'::jsonb,'["b2b_proposals"]'::jsonb,'["proposal.observed", "proposal.sent", "proposal.accepted"]'::jsonb,'healthy',15,60,'2026-07-20T03:28:00.000Z','2026-07-20T07:20:00.000Z','cursor-004',24,1,true,'revenue_os.signals.manage',true),
('SRC-BROWSER-OPPORTUNITIES','Opportunités extension navigateur','browser-extension','browser-opportunities','Source gouvernée Opportunités extension navigateur pour observation Revenue OS en mode Shadow.','["ACADEMY", "FLASHCARDS", "CORPORATES"]'::jsonb,'["browser_extension_b2b_opportunities"]'::jsonb,'["opportunity.observed", "opportunity.updated"]'::jsonb,'healthy',10,45,'2026-07-20T07:35:00.000Z','2026-07-20T06:25:00.000Z','cursor-005',94,0,false,'revenue_os.signals.manage',true),
('SRC-REVENUE-PROSPECTS','Pipeline Revenue historique','crm','revenue-prospects','Source gouvernée Pipeline Revenue historique pour observation Revenue OS en mode Shadow.','["ACADEMY", "HOME_SERVICE", "CORPORATES"]'::jsonb,'["revenue_prospects"]'::jsonb,'["revenue.prospect.observed"]'::jsonb,'degraded',30,180,'2026-07-20T06:42:00.000Z','2026-07-20T05:30:00.000Z','cursor-006',46,3,true,'revenue_os.signals.manage',true),
('SRC-REVENUE-APPOINTMENTS','Rendez-vous Revenue','calendar','revenue-appointments','Source gouvernée Rendez-vous Revenue pour observation Revenue OS en mode Shadow.','["ACADEMY", "CORPORATES"]'::jsonb,'["revenue_appointments"]'::jsonb,'["appointment.observed"]'::jsonb,'healthy',15,90,'2026-07-20T05:49:00.000Z','2026-07-20T04:35:00.000Z','cursor-007',14,0,true,'revenue_os.signals.manage',true),
('SRC-REVENUE-PARTNERSHIPS','Partenariats actifs','crm','revenue-partnerships','Source gouvernée Partenariats actifs pour observation Revenue OS en mode Shadow.','["ACADEMY", "FLASHCARDS", "HOSPITALITY"]'::jsonb,'["revenue_partnerships"]'::jsonb,'["partnership.observed", "renewal.window"]'::jsonb,'healthy',60,360,'2026-07-20T04:56:00.000Z','2026-07-20T07:40:00.000Z','cursor-008',20,0,true,'revenue_os.signals.manage',true),
('SRC-EMAIL-INBOX','Email OS — Inbox','email','email-inbox','Source gouvernée Email OS — Inbox pour observation Revenue OS en mode Shadow.','["ACADEMY", "FLASHCARDS", "CORPORATES", "HOME_SERVICE"]'::jsonb,'["email_os_core_inbox"]'::jsonb,'["email.received"]'::jsonb,'healthy',5,30,'2026-07-20T03:03:00.000Z','2026-07-20T06:45:00.000Z','cursor-009',183,2,true,'revenue_os.signals.manage',true),
('SRC-EMAIL-OUTBOX','Email OS — Outbox','email','email-outbox','Source gouvernée Email OS — Outbox pour observation Revenue OS en mode Shadow.','["ACADEMY", "FLASHCARDS", "CORPORATES"]'::jsonb,'["email_os_core_outbox"]'::jsonb,'["email.outbound", "email.failed"]'::jsonb,'healthy',5,30,'2026-07-20T07:10:00.000Z','2026-07-20T05:50:00.000Z','cursor-010',142,4,true,'revenue_os.signals.manage',true),
('SRC-TRAINING-SESSIONS','Sessions TrainingHub','academy','training-sessions','Source gouvernée Sessions TrainingHub pour observation Revenue OS en mode Shadow.','["ACADEMY"]'::jsonb,'["trn_sessions"]'::jsonb,'["training.session.observed", "training.capacity.changed"]'::jsonb,'healthy',30,120,'2026-07-20T06:17:00.000Z','2026-07-20T04:55:00.000Z','cursor-011',37,0,true,'revenue_os.signals.manage',true),
('SRC-ACADEMY-TRAINERS','Capacité formateurs Academy','academy','academy-trainers','Source gouvernée Capacité formateurs Academy pour observation Revenue OS en mode Shadow.','["ACADEMY"]'::jsonb,'["academy_trainers", "academy_trainer_assignments"]'::jsonb,'["trainer.capacity.observed"]'::jsonb,'degraded',30,120,'2026-07-20T05:24:00.000Z','2026-07-20T07:00:00.000Z','cursor-012',21,2,true,'revenue_os.signals.manage',true),
('SRC-FINANCE-INVOICES','Factures & échéances','finance','invoices','Source gouvernée Factures & échéances pour observation Revenue OS en mode Shadow.','["ACADEMY", "CORPORATES", "HOME_SERVICE"]'::jsonb,'["angelcare360_invoices"]'::jsonb,'["invoice.observed", "invoice.overdue"]'::jsonb,'stale',60,180,'2026-07-20T04:31:00.000Z','2026-07-20T06:05:00.000Z','cursor-013',39,1,true,'revenue_os.signals.audit',true),
('SRC-FINANCE-PAYMENTS','Paiements reçus','finance','payments','Source gouvernée Paiements reçus pour observation Revenue OS en mode Shadow.','["ACADEMY", "CORPORATES", "HOME_SERVICE"]'::jsonb,'["angelcare360_payments"]'::jsonb,'["payment.observed", "payment.received"]'::jsonb,'healthy',60,180,'2026-07-20T03:38:00.000Z','2026-07-20T05:10:00.000Z','cursor-014',31,0,true,'revenue_os.signals.audit',true),
('SRC-CUSTOMER-CLAIMS','Réclamations & risque client','operations','complaints','Source gouvernée Réclamations & risque client pour observation Revenue OS en mode Shadow.','["HOME_SERVICE", "KINDERGARTEN", "CORPORATES"]'::jsonb,'["angelcare360_reclamations"]'::jsonb,'["complaint.observed", "customer.risk"]'::jsonb,'healthy',30,90,'2026-07-20T07:45:00.000Z','2026-07-20T04:15:00.000Z','cursor-015',12,0,true,'revenue_os.signals.audit',true)
on conflict(code) do update set name=excluded.name,source_kind=excluded.source_kind,adapter_key=excluded.adapter_key,description=excluded.description,business_unit_codes=excluded.business_unit_codes,source_tables=excluded.source_tables,supported_event_types=excluded.supported_event_types,polling_minutes=excluded.polling_minutes,stale_after_minutes=excluded.stale_after_minutes,contains_sensitive_data=excluded.contains_sensitive_data,minimum_permission=excluded.minimum_permission,enabled=excluded.enabled,updated_at=timezone('utc',now());

insert into public.revenue_os_signal_rules(code,name,source_codes,event_types,category,signal_type,condition_expression,severity_logic,confidence_logic,score_logic,recommended_command_families,expiry_minutes,cooldown_minutes,enabled,version) values
('SIG-RULE-001','Intention forte reçue','["SRC-EMAIL-INBOX"]'::jsonb,'["email.received"]'::jsonb,'account-intent','account.high-intent','Les données de la source satisfont le pattern gouverné « Intention forte reçue ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["qualification", "meeting-generation"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-002','Proposition sans suite','["SRC-B2B-PROPOSALS"]'::jsonb,'["proposal.observed"]'::jsonb,'proposal','proposal.follow-up-window','Les données de la source satisfont le pattern gouverné « Proposition sans suite ».','Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["proposal-progression", "closing"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-003','Rendez-vous imminent','["SRC-B2B-MEETINGS", "SRC-REVENUE-APPOINTMENTS"]'::jsonb,'["meeting.observed", "appointment.observed"]'::jsonb,'meeting','meeting.readiness','Les données de la source satisfont le pattern gouverné « Rendez-vous imminent ».','Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["meeting-diagnostic"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-004','Facture en retard','["SRC-FINANCE-INVOICES"]'::jsonb,'["invoice.overdue", "invoice.observed"]'::jsonb,'payment','payment.overdue','Les données de la source satisfont le pattern gouverné « Facture en retard ».','Sévérité par défaut critical, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["revenue-rescue", "collections"]'::jsonb,360,60,true,'1.0'),
('SIG-RULE-005','Risque client déclaré','["SRC-CUSTOMER-CLAIMS"]'::jsonb,'["complaint.observed", "customer.risk"]'::jsonb,'customer-risk','customer.risk','Les données de la source satisfont le pattern gouverné « Risque client déclaré ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["customer-rescue", "retention"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-006','Capacité Academy contrainte','["SRC-ACADEMY-TRAINERS", "SRC-TRAINING-SESSIONS"]'::jsonb,'["trainer.capacity.observed", "training.capacity.changed"]'::jsonb,'capacity','capacity.constraint','Les données de la source satisfont le pattern gouverné « Capacité Academy contrainte ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["capacity-protection"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-007','Nouveau prospect à potentiel','["SRC-B2B-PROSPECTS", "SRC-BROWSER-OPPORTUNITIES"]'::jsonb,'["prospect.observed", "opportunity.observed"]'::jsonb,'market-opportunity','account.discovery','Les données de la source satisfont le pattern gouverné « Nouveau prospect à potentiel ».','Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["account-discovery", "segmentation"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-008','Fenêtre de renouvellement','["SRC-REVENUE-PARTNERSHIPS"]'::jsonb,'["renewal.window", "partnership.observed"]'::jsonb,'renewal','renewal.window','Les données de la source satisfont le pattern gouverné « Fenêtre de renouvellement ».','Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["renewal", "upsell"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-009','Email sortant en échec','["SRC-EMAIL-OUTBOX"]'::jsonb,'["email.failed"]'::jsonb,'execution','outreach.delivery-failure','Les données de la source satisfont le pattern gouverné « Email sortant en échec ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["channel-recovery"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-010','Décideur identifié','["SRC-B2B-CONTACTS"]'::jsonb,'["decision-maker.identified", "contact.observed"]'::jsonb,'account-intent','decision-maker.identified','Les données de la source satisfont le pattern gouverné « Décideur identifié ».','Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["account-plan", "qualification"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-011','Paiement reçu','["SRC-FINANCE-PAYMENTS"]'::jsonb,'["payment.received", "payment.observed"]'::jsonb,'payment','payment.confirmed','Les données de la source satisfont le pattern gouverné « Paiement reçu ».','Sévérité par défaut info, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["delivery-handoff", "expansion"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-012','Session sous-remplie','["SRC-TRAINING-SESSIONS"]'::jsonb,'["training.session.observed"]'::jsonb,'capacity','academy.capacity-underused','Les données de la source satisfont le pattern gouverné « Session sous-remplie ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["capacity-monetization", "campaign-activation"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-013','Partenariat inactif','["SRC-REVENUE-PARTNERSHIPS"]'::jsonb,'["partnership.observed"]'::jsonb,'renewal','partner.reactivation','Les données de la source satisfont le pattern gouverné « Partenariat inactif ».','Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["partner-reactivation"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-014','Donnée source périmée','[]'::jsonb,'["source.stale"]'::jsonb,'data-quality','source.stale','Les données de la source satisfont le pattern gouverné « Donnée source périmée ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["data-recovery"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-015','Doublon événement','[]'::jsonb,'["event.duplicate"]'::jsonb,'data-quality','event.duplicate','Les données de la source satisfont le pattern gouverné « Doublon événement ».','Sévérité par défaut low, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["data-quality"]'::jsonb,1440,60,true,'1.0'),
('SIG-RULE-016','Créneau commercial saisonnier','[]'::jsonb,'["seasonal.window"]'::jsonb,'seasonality','seasonal.window','Les données de la source satisfont le pattern gouverné « Créneau commercial saisonnier ».','Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.','Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.','35% urgence + 35% opportunité + 30% risque.','["seasonal-activation", "territory-capture"]'::jsonb,1440,60,true,'1.0')
on conflict(code) do update set name=excluded.name,source_codes=excluded.source_codes,event_types=excluded.event_types,category=excluded.category,signal_type=excluded.signal_type,condition_expression=excluded.condition_expression,severity_logic=excluded.severity_logic,confidence_logic=excluded.confidence_logic,score_logic=excluded.score_logic,recommended_command_families=excluded.recommended_command_families,expiry_minutes=excluded.expiry_minutes,cooldown_minutes=excluded.cooldown_minutes,enabled=excluded.enabled,version=excluded.version,updated_at=timezone('utc',now());

insert into public.revenue_os_signal_scheduled_scans(code,name,source_code,schedule_expression,timezone,scan_mode,lookback_minutes,maximum_records,status,last_run_at,next_run_at,last_outcome,last_created_signals,consecutive_failures) values
('SCAN-SRC-B2B-PROSPECTS','Scan incrémental · Prospects B2B','SRC-B2B-PROSPECTS','*/15 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T06:05:00.000Z','2026-07-20T08:15:00.000Z','success',12,0),
('SCAN-SRC-B2B-CONTACTS','Scan incrémental · Contacts & décideurs B2B','SRC-B2B-CONTACTS','*/30 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T05:10:00.000Z','2026-07-20T08:15:00.000Z','success',7,0),
('SCAN-SRC-B2B-MEETINGS','Scan incrémental · Réunions B2B','SRC-B2B-MEETINGS','*/15 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T04:15:00.000Z','2026-07-20T08:15:00.000Z','success',1,0),
('SCAN-SRC-B2B-PROPOSALS','Scan incrémental · Propositions B2B','SRC-B2B-PROPOSALS','*/15 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T07:20:00.000Z','2026-07-20T08:15:00.000Z','success',2,1),
('SCAN-SRC-BROWSER-OPPORTUNITIES','Scan incrémental · Opportunités extension navigateur','SRC-BROWSER-OPPORTUNITIES','*/10 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T06:25:00.000Z','2026-07-20T08:15:00.000Z','success',9,0),
('SCAN-SRC-REVENUE-PROSPECTS','Scan incrémental · Pipeline Revenue historique','SRC-REVENUE-PROSPECTS','*/30 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T05:30:00.000Z','2026-07-20T08:15:00.000Z','partial',4,3),
('SCAN-SRC-REVENUE-APPOINTMENTS','Scan incrémental · Rendez-vous Revenue','SRC-REVENUE-APPOINTMENTS','*/15 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T04:35:00.000Z','2026-07-20T08:15:00.000Z','success',1,0),
('SCAN-SRC-REVENUE-PARTNERSHIPS','Scan incrémental · Partenariats actifs','SRC-REVENUE-PARTNERSHIPS','*/60 * * * *','Africa/Casablanca','incremental',120,100,'active','2026-07-20T07:40:00.000Z','2026-07-20T08:15:00.000Z','success',2,0),
('SCAN-SRC-EMAIL-INBOX','Scan incrémental · Email OS — Inbox','SRC-EMAIL-INBOX','*/5 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T06:45:00.000Z','2026-07-20T08:15:00.000Z','success',18,2),
('SCAN-SRC-EMAIL-OUTBOX','Scan incrémental · Email OS — Outbox','SRC-EMAIL-OUTBOX','*/5 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T05:50:00.000Z','2026-07-20T08:15:00.000Z','success',14,4),
('SCAN-SRC-TRAINING-SESSIONS','Scan incrémental · Sessions TrainingHub','SRC-TRAINING-SESSIONS','*/30 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T04:55:00.000Z','2026-07-20T08:15:00.000Z','success',3,0),
('SCAN-SRC-ACADEMY-TRAINERS','Scan incrémental · Capacité formateurs Academy','SRC-ACADEMY-TRAINERS','*/30 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T07:00:00.000Z','2026-07-20T08:15:00.000Z','partial',2,2),
('SCAN-SRC-FINANCE-INVOICES','Scan incrémental · Factures & échéances','SRC-FINANCE-INVOICES','*/60 * * * *','Africa/Casablanca','incremental',120,100,'active','2026-07-20T06:05:00.000Z','2026-07-20T08:15:00.000Z','success',3,1),
('SCAN-SRC-FINANCE-PAYMENTS','Scan incrémental · Paiements reçus','SRC-FINANCE-PAYMENTS','*/60 * * * *','Africa/Casablanca','incremental',120,100,'active','2026-07-20T05:10:00.000Z','2026-07-20T08:15:00.000Z','success',3,0),
('SCAN-SRC-CUSTOMER-CLAIMS','Scan incrémental · Réclamations & risque client','SRC-CUSTOMER-CLAIMS','*/30 * * * *','Africa/Casablanca','incremental',60,100,'active','2026-07-20T04:15:00.000Z','2026-07-20T08:15:00.000Z','success',1,0)
on conflict(code) do update set name=excluded.name,schedule_expression=excluded.schedule_expression,timezone=excluded.timezone,scan_mode=excluded.scan_mode,lookback_minutes=excluded.lookback_minutes,maximum_records=excluded.maximum_records,status=excluded.status,updated_at=timezone('utc',now());

insert into public.revenue_os_signal_subscriptions(code,name,subscriber_type,subscriber_key,categories,severities,business_unit_codes,territory_codes,delivery_mode,cooldown_minutes,active) values
('SUB-EXEC-CRITICAL','Alertes critiques Direction Revenue','role','Direction Revenue','["payment", "customer-risk", "capacity", "pipeline-risk"]'::jsonb,'["critical", "high"]'::jsonb,'[]'::jsonb,'[]'::jsonb,'approval-queue',15,true),
('SUB-ACADEMY-INTENT','Intentions Academy','workspace','Academy Commercial','["account-intent", "meeting", "proposal", "market-opportunity"]'::jsonb,'["critical", "high", "medium"]'::jsonb,'["ACADEMY"]'::jsonb,'["RABAT", "CASABLANCA", "KENITRA"]'::jsonb,'mission-proposal',30,true),
('SUB-FINANCE-RECOVERY','Récupération revenu','role','Finance & Collections','["payment"]'::jsonb,'["critical", "high"]'::jsonb,'[]'::jsonb,'[]'::jsonb,'in-app',10,true),
('SUB-WEEKLY-DIGEST','Digest hebdomadaire opportunités','workspace','Vue stratégique','["market-opportunity", "renewal", "referral", "seasonality"]'::jsonb,'["high", "medium", "low", "info"]'::jsonb,'[]'::jsonb,'[]'::jsonb,'digest',10080,true)
on conflict(code) do update set name=excluded.name,categories=excluded.categories,severities=excluded.severities,business_unit_codes=excluded.business_unit_codes,territory_codes=excluded.territory_codes,delivery_mode=excluded.delivery_mode,cooldown_minutes=excluded.cooldown_minutes,active=excluded.active,updated_at=timezone('utc',now());

insert into public.revenue_os_permission_registry(permission_key,label,description,risk_class,phase_introduced,active) values
 ('revenue_os.signals.manage','Gérer le Signal Fabric','Lecture, scans, classification, snapshots et statuts des signaux revenus.','controlled',4,true),
 ('revenue_os.signals.ingest','Ingérer les signaux revenus','Autorise l’ingestion interne ou via webhook gouverné.','controlled',4,true),
 ('revenue_os.signals.audit','Auditer les signaux revenus','Accès aux sources sensibles, redactions et journaux de consultation.','restricted',4,true)
on conflict(permission_key) do update set label=excluded.label,description=excluded.description,risk_class=excluded.risk_class,active=excluded.active,updated_at=timezone('utc',now());

insert into public.revenue_os_feature_flags(flag_key,label,description,enabled,locked,environment,risk_class,phase_introduced) values
 ('revenue_os.signal_fabric','Live Revenue Signal Fabric','Sources, normalisation, déduplication, classification, contexte et validation.',true,true,'all','controlled',4),
 ('revenue_os.signal_ingestion','Ingestion des signaux', 'Ingestion interne gouvernée sans action externe.',true,false,'all','controlled',4),
 ('revenue_os.signal_scheduled_scans','Scans revenus programmés','Scans incrémentaux idempotents des sources allow-listées.',true,false,'all','controlled',4)
on conflict(flag_key) do update set label=excluded.label,description=excluded.description,enabled=excluded.enabled,locked=excluded.locked,environment=excluded.environment,risk_class=excluded.risk_class,updated_at=timezone('utc',now());

update public.revenue_os_workspaces set maturity_status='ready',permission_key='revenue_os.signals.manage',description='Tissu live des signaux revenus, sources, scans, classification, contexte, fraîcheur et accès.' where workspace_key='signals';

insert into public.revenue_os_installations(installation_key,release_code,contract_version,module_version,execution_mode,environment,contract_locked,external_actions_enabled,metadata)
values('revenue-command-os','AC-REVENUE-OS-MZ04-SIGNAL-FABRIC','AC-REVENUE-OS-CANONICAL-2026.07','4.0.0-phase4','shadow','production',true,false,jsonb_build_object('cumulativeOver',jsonb_build_array('MZ01','MZ02','MZ03'),'externalActions',false,'signalSources',15,'signalRules',16,'sourceSecretsStored',false))
on conflict(installation_key) do update set release_code=excluded.release_code,contract_version=excluded.contract_version,module_version=excluded.module_version,execution_mode='shadow',contract_locked=true,external_actions_enabled=false,metadata=excluded.metadata,updated_at=timezone('utc',now());

insert into public.revenue_os_audit_events(event_id,action,actor_label,actor_type,resource_type,outcome,summary,metadata)
values('REVOS-MZ04-INSTALL-'||replace(gen_random_uuid()::text,'-',''),'signal.fabric.installed','Revenue OS Migration','migration','signal_fabric','success','Mega ZIP 4 Signal Fabric installé en Shadow observation.',jsonb_build_object('releaseCode','AC-REVENUE-OS-MZ04-SIGNAL-FABRIC','externalActions',false,'sourceSecretsStored',false));

commit;
