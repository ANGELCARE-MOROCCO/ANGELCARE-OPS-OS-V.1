create extension if not exists "pgcrypto";

create table if not exists public.carelink_dispatch_messages (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint null references public.missions(id) on delete cascade,
  caregiver_id bigint null references public.caregivers(id) on delete cascade,
  thread_key text null,
  sender_type text not null,
  sender_id text null,
  recipient_type text null,
  subject text null,
  body text not null,
  priority text not null default 'normal',
  status text not null default 'sent',
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);


create table if not exists public.carelink_notifications (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint null references public.caregivers(id) on delete cascade,
  mission_id bigint null references public.missions(id) on delete cascade,
  linked_entity_type text null,
  linked_entity_id text null,
  type text not null,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  status text not null default 'unread',
  acknowledged_at timestamptz null,
  dismissed_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);


create table if not exists public.carelink_alerts (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint null references public.caregivers(id) on delete cascade,
  mission_id bigint null references public.missions(id) on delete cascade,
  linked_entity_type text null,
  linked_entity_id text null,
  type text not null,
  title text not null,
  body text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  acknowledged_at timestamptz null,
  dismissed_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);


create table if not exists public.carelink_mission_checklist_items (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null references public.missions(id) on delete cascade,
  caregiver_id bigint null references public.caregivers(id) on delete set null,
  label text not null,
  description text null,
  category text not null default 'general',
  required boolean not null default true,
  completed boolean not null default false,
  completed_at timestamptz null,
  completed_by text null,
  notes text null,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.carelink_mission_reports (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint not null references public.missions(id) on delete cascade,
  caregiver_id bigint null references public.caregivers(id) on delete set null,
  service_type text not null,
  summary text null,
  observations text null,
  activities jsonb not null default '[]'::jsonb,
  checklist_snapshot jsonb not null default '[]'::jsonb,
  incident_flag boolean not null default false,
  recommendations text null,
  status text not null default 'draft',
  submitted_at timestamptz null,
  validation_status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.carelink_payment_disputes (
  id uuid primary key default gen_random_uuid(),
  mission_id bigint null references public.missions(id) on delete cascade,
  caregiver_id bigint not null references public.caregivers(id) on delete cascade,
  amount_claimed numeric(12,2) null,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb
);


create table if not exists public.carelink_agent_documents (
  id uuid primary key default gen_random_uuid(),
  caregiver_id bigint not null references public.caregivers(id) on delete cascade,
  document_type text not null,
  status text not null default 'pending',
  expires_at timestamptz null,
  file_url text null,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);



-- Idempotency repair for environments where these tables were partially created before this migration.
-- CREATE TABLE IF NOT EXISTS does not add missing columns to an existing table, so we add the required columns explicitly.
alter table public.carelink_dispatch_messages add column if not exists caregiver_id bigint null references public.caregivers(id) on delete cascade;
alter table public.carelink_dispatch_messages add column if not exists mission_id bigint null references public.missions(id) on delete cascade;
alter table public.carelink_dispatch_messages add column if not exists thread_key text null;
alter table public.carelink_dispatch_messages add column if not exists sender_type text not null default 'agent';
alter table public.carelink_dispatch_messages add column if not exists sender_id text null;
alter table public.carelink_dispatch_messages add column if not exists recipient_type text null;
alter table public.carelink_dispatch_messages add column if not exists subject text null;
alter table public.carelink_dispatch_messages add column if not exists body text not null default '';
alter table public.carelink_dispatch_messages add column if not exists priority text not null default 'normal';
alter table public.carelink_dispatch_messages add column if not exists status text not null default 'sent';
alter table public.carelink_dispatch_messages add column if not exists read_at timestamptz null;
alter table public.carelink_dispatch_messages add column if not exists created_at timestamptz not null default now();
alter table public.carelink_dispatch_messages add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.carelink_notifications add column if not exists caregiver_id bigint null references public.caregivers(id) on delete cascade;
alter table public.carelink_notifications add column if not exists mission_id bigint null references public.missions(id) on delete cascade;
alter table public.carelink_notifications add column if not exists linked_entity_type text null;
alter table public.carelink_notifications add column if not exists linked_entity_id text null;
alter table public.carelink_notifications add column if not exists type text not null default 'general';
alter table public.carelink_notifications add column if not exists title text not null default 'Notification';
alter table public.carelink_notifications add column if not exists body text not null default '';
alter table public.carelink_notifications add column if not exists priority text not null default 'normal';
alter table public.carelink_notifications add column if not exists status text not null default 'unread';
alter table public.carelink_notifications add column if not exists acknowledged_at timestamptz null;
alter table public.carelink_notifications add column if not exists dismissed_at timestamptz null;
alter table public.carelink_notifications add column if not exists created_at timestamptz not null default now();
alter table public.carelink_notifications add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.carelink_alerts add column if not exists caregiver_id bigint null references public.caregivers(id) on delete cascade;
alter table public.carelink_alerts add column if not exists mission_id bigint null references public.missions(id) on delete cascade;
alter table public.carelink_alerts add column if not exists linked_entity_type text null;
alter table public.carelink_alerts add column if not exists linked_entity_id text null;
alter table public.carelink_alerts add column if not exists type text not null default 'general';
alter table public.carelink_alerts add column if not exists title text not null default 'Alert';
alter table public.carelink_alerts add column if not exists body text not null default '';
alter table public.carelink_alerts add column if not exists priority text not null default 'normal';
alter table public.carelink_alerts add column if not exists status text not null default 'open';
alter table public.carelink_alerts add column if not exists acknowledged_at timestamptz null;
alter table public.carelink_alerts add column if not exists dismissed_at timestamptz null;
alter table public.carelink_alerts add column if not exists created_at timestamptz not null default now();
alter table public.carelink_alerts add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.carelink_mission_checklist_items add column if not exists caregiver_id bigint null references public.caregivers(id) on delete set null;
alter table public.carelink_mission_reports add column if not exists caregiver_id bigint null references public.caregivers(id) on delete set null;
alter table public.carelink_payment_disputes add column if not exists caregiver_id bigint;
alter table public.carelink_agent_documents add column if not exists caregiver_id bigint;


-- Repair partially-created checklist/report/payment/document tables before indexes.
alter table public.carelink_mission_checklist_items add column if not exists mission_id bigint;
alter table public.carelink_mission_checklist_items add column if not exists caregiver_id bigint;
alter table public.carelink_mission_checklist_items add column if not exists label text not null default 'Checklist item';
alter table public.carelink_mission_checklist_items add column if not exists description text null;
alter table public.carelink_mission_checklist_items add column if not exists category text not null default 'general';
alter table public.carelink_mission_checklist_items add column if not exists required boolean not null default true;
alter table public.carelink_mission_checklist_items add column if not exists completed boolean not null default false;
alter table public.carelink_mission_checklist_items add column if not exists completed_at timestamptz null;
alter table public.carelink_mission_checklist_items add column if not exists completed_by text null;
alter table public.carelink_mission_checklist_items add column if not exists notes text null;
alter table public.carelink_mission_checklist_items add column if not exists sort_order integer not null default 0;
alter table public.carelink_mission_checklist_items add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.carelink_mission_checklist_items add column if not exists created_at timestamptz not null default now();
alter table public.carelink_mission_checklist_items add column if not exists updated_at timestamptz not null default now();

alter table public.carelink_mission_reports add column if not exists mission_id bigint;
alter table public.carelink_mission_reports add column if not exists caregiver_id bigint;
alter table public.carelink_mission_reports add column if not exists service_type text not null default 'general';
alter table public.carelink_mission_reports add column if not exists summary text null;
alter table public.carelink_mission_reports add column if not exists observations text null;
alter table public.carelink_mission_reports add column if not exists activities jsonb not null default '[]'::jsonb;
alter table public.carelink_mission_reports add column if not exists checklist_snapshot jsonb not null default '[]'::jsonb;
alter table public.carelink_mission_reports add column if not exists incident_flag boolean not null default false;
alter table public.carelink_mission_reports add column if not exists recommendations text null;
alter table public.carelink_mission_reports add column if not exists status text not null default 'draft';
alter table public.carelink_mission_reports add column if not exists submitted_at timestamptz null;
alter table public.carelink_mission_reports add column if not exists validation_status text not null default 'pending';
alter table public.carelink_mission_reports add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.carelink_mission_reports add column if not exists created_at timestamptz not null default now();
alter table public.carelink_mission_reports add column if not exists updated_at timestamptz not null default now();

alter table public.carelink_payment_disputes add column if not exists mission_id bigint;
alter table public.carelink_payment_disputes add column if not exists caregiver_id bigint;
alter table public.carelink_payment_disputes add column if not exists amount_claimed numeric(12,2) null;
alter table public.carelink_payment_disputes add column if not exists reason text not null default '';
alter table public.carelink_payment_disputes add column if not exists status text not null default 'pending';
alter table public.carelink_payment_disputes add column if not exists created_at timestamptz not null default now();
alter table public.carelink_payment_disputes add column if not exists resolved_at timestamptz null;
alter table public.carelink_payment_disputes add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.carelink_agent_documents add column if not exists caregiver_id bigint;
alter table public.carelink_agent_documents add column if not exists document_type text not null default 'document';
alter table public.carelink_agent_documents add column if not exists status text not null default 'pending';
alter table public.carelink_agent_documents add column if not exists expires_at timestamptz null;
alter table public.carelink_agent_documents add column if not exists file_url text null;
alter table public.carelink_agent_documents add column if not exists review_status text not null default 'pending';
alter table public.carelink_agent_documents add column if not exists created_at timestamptz not null default now();
alter table public.carelink_agent_documents add column if not exists updated_at timestamptz not null default now();
alter table public.carelink_agent_documents add column if not exists metadata jsonb not null default '{}'::jsonb;



-- Strong idempotent repair before indexes for partially-created tables.
-- This block prevents index/policy failures when an earlier failed run created tables with missing columns.
do $$
begin
  if to_regclass('public.carelink_dispatch_messages') is not null then
    alter table public.carelink_dispatch_messages add column if not exists mission_id bigint null;
    alter table public.carelink_dispatch_messages add column if not exists caregiver_id bigint null;
    alter table public.carelink_dispatch_messages add column if not exists thread_key text null;
    alter table public.carelink_dispatch_messages add column if not exists sender_type text not null default 'agent';
    alter table public.carelink_dispatch_messages add column if not exists sender_id text null;
    alter table public.carelink_dispatch_messages add column if not exists recipient_type text null;
    alter table public.carelink_dispatch_messages add column if not exists subject text null;
    alter table public.carelink_dispatch_messages add column if not exists body text not null default '';
    alter table public.carelink_dispatch_messages add column if not exists priority text not null default 'normal';
    alter table public.carelink_dispatch_messages add column if not exists status text not null default 'sent';
    alter table public.carelink_dispatch_messages add column if not exists read_at timestamptz null;
    alter table public.carelink_dispatch_messages add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_dispatch_messages add column if not exists metadata jsonb not null default '{}'::jsonb;
  end if;

  if to_regclass('public.carelink_notifications') is not null then
    alter table public.carelink_notifications add column if not exists caregiver_id bigint null;
    alter table public.carelink_notifications add column if not exists mission_id bigint null;
    alter table public.carelink_notifications add column if not exists linked_entity_type text null;
    alter table public.carelink_notifications add column if not exists linked_entity_id text null;
    alter table public.carelink_notifications add column if not exists type text not null default 'general';
    alter table public.carelink_notifications add column if not exists title text not null default 'Notification';
    alter table public.carelink_notifications add column if not exists body text not null default '';
    alter table public.carelink_notifications add column if not exists priority text not null default 'normal';
    alter table public.carelink_notifications add column if not exists status text not null default 'unread';
    alter table public.carelink_notifications add column if not exists acknowledged_at timestamptz null;
    alter table public.carelink_notifications add column if not exists dismissed_at timestamptz null;
    alter table public.carelink_notifications add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
  end if;

  if to_regclass('public.carelink_alerts') is not null then
    alter table public.carelink_alerts add column if not exists caregiver_id bigint null;
    alter table public.carelink_alerts add column if not exists mission_id bigint null;
    alter table public.carelink_alerts add column if not exists linked_entity_type text null;
    alter table public.carelink_alerts add column if not exists linked_entity_id text null;
    alter table public.carelink_alerts add column if not exists type text not null default 'general';
    alter table public.carelink_alerts add column if not exists title text not null default 'Alert';
    alter table public.carelink_alerts add column if not exists body text not null default '';
    alter table public.carelink_alerts add column if not exists priority text not null default 'normal';
    alter table public.carelink_alerts add column if not exists status text not null default 'open';
    alter table public.carelink_alerts add column if not exists acknowledged_at timestamptz null;
    alter table public.carelink_alerts add column if not exists dismissed_at timestamptz null;
    alter table public.carelink_alerts add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_alerts add column if not exists metadata jsonb not null default '{}'::jsonb;
  end if;

  if to_regclass('public.carelink_mission_checklist_items') is not null then
    alter table public.carelink_mission_checklist_items add column if not exists mission_id bigint null;
    alter table public.carelink_mission_checklist_items add column if not exists caregiver_id bigint null;
    alter table public.carelink_mission_checklist_items add column if not exists label text not null default 'Checklist item';
    alter table public.carelink_mission_checklist_items add column if not exists description text null;
    alter table public.carelink_mission_checklist_items add column if not exists category text not null default 'general';
    alter table public.carelink_mission_checklist_items add column if not exists required boolean not null default true;
    alter table public.carelink_mission_checklist_items add column if not exists completed boolean not null default false;
    alter table public.carelink_mission_checklist_items add column if not exists completed_at timestamptz null;
    alter table public.carelink_mission_checklist_items add column if not exists completed_by text null;
    alter table public.carelink_mission_checklist_items add column if not exists notes text null;
    alter table public.carelink_mission_checklist_items add column if not exists sort_order integer not null default 0;
    alter table public.carelink_mission_checklist_items add column if not exists metadata jsonb not null default '{}'::jsonb;
    alter table public.carelink_mission_checklist_items add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_mission_checklist_items add column if not exists updated_at timestamptz not null default now();
  end if;

  if to_regclass('public.carelink_mission_reports') is not null then
    alter table public.carelink_mission_reports add column if not exists mission_id bigint null;
    alter table public.carelink_mission_reports add column if not exists caregiver_id bigint null;
    alter table public.carelink_mission_reports add column if not exists service_type text not null default 'general';
    alter table public.carelink_mission_reports add column if not exists summary text null;
    alter table public.carelink_mission_reports add column if not exists observations text null;
    alter table public.carelink_mission_reports add column if not exists activities jsonb not null default '[]'::jsonb;
    alter table public.carelink_mission_reports add column if not exists checklist_snapshot jsonb not null default '[]'::jsonb;
    alter table public.carelink_mission_reports add column if not exists incident_flag boolean not null default false;
    alter table public.carelink_mission_reports add column if not exists recommendations text null;
    alter table public.carelink_mission_reports add column if not exists status text not null default 'draft';
    alter table public.carelink_mission_reports add column if not exists submitted_at timestamptz null;
    alter table public.carelink_mission_reports add column if not exists validation_status text not null default 'pending';
    alter table public.carelink_mission_reports add column if not exists metadata jsonb not null default '{}'::jsonb;
    alter table public.carelink_mission_reports add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_mission_reports add column if not exists updated_at timestamptz not null default now();
  end if;

  if to_regclass('public.carelink_payment_disputes') is not null then
    alter table public.carelink_payment_disputes add column if not exists mission_id bigint null;
    alter table public.carelink_payment_disputes add column if not exists caregiver_id bigint null;
    alter table public.carelink_payment_disputes add column if not exists amount_claimed numeric(12,2) null;
    alter table public.carelink_payment_disputes add column if not exists reason text not null default '';
    alter table public.carelink_payment_disputes add column if not exists status text not null default 'pending';
    alter table public.carelink_payment_disputes add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_payment_disputes add column if not exists resolved_at timestamptz null;
    alter table public.carelink_payment_disputes add column if not exists metadata jsonb not null default '{}'::jsonb;
  end if;

  if to_regclass('public.carelink_agent_documents') is not null then
    alter table public.carelink_agent_documents add column if not exists caregiver_id bigint null;
    alter table public.carelink_agent_documents add column if not exists document_type text not null default 'document';
    alter table public.carelink_agent_documents add column if not exists status text not null default 'pending';
    alter table public.carelink_agent_documents add column if not exists expires_at timestamptz null;
    alter table public.carelink_agent_documents add column if not exists file_url text null;
    alter table public.carelink_agent_documents add column if not exists review_status text not null default 'pending';
    alter table public.carelink_agent_documents add column if not exists created_at timestamptz not null default now();
    alter table public.carelink_agent_documents add column if not exists updated_at timestamptz not null default now();
    alter table public.carelink_agent_documents add column if not exists metadata jsonb not null default '{}'::jsonb;
  end if;
end $$;
create index if not exists carelink_dispatch_messages_mission_idx on public.carelink_dispatch_messages (mission_id, created_at desc);
create index if not exists carelink_dispatch_messages_caregiver_idx on public.carelink_dispatch_messages (caregiver_id, created_at desc);
create index if not exists carelink_dispatch_messages_thread_idx on public.carelink_dispatch_messages (thread_key, created_at desc);
create index if not exists carelink_notifications_status_idx on public.carelink_notifications (status, created_at desc);
create index if not exists carelink_notifications_mission_idx on public.carelink_notifications (mission_id, created_at desc);
create index if not exists carelink_notifications_caregiver_idx on public.carelink_notifications (caregiver_id, created_at desc);
create index if not exists carelink_alerts_status_idx on public.carelink_alerts (status, created_at desc);
create index if not exists carelink_alerts_mission_idx on public.carelink_alerts (mission_id, created_at desc);
create index if not exists carelink_alerts_caregiver_idx on public.carelink_alerts (caregiver_id, created_at desc);
create index if not exists carelink_mission_checklist_items_mission_idx on public.carelink_mission_checklist_items (mission_id, sort_order asc, created_at asc);
create index if not exists carelink_mission_checklist_items_completed_idx on public.carelink_mission_checklist_items (mission_id, completed, required);
create unique index if not exists carelink_mission_reports_mission_unique on public.carelink_mission_reports (mission_id);
create index if not exists carelink_mission_reports_status_idx on public.carelink_mission_reports (status, submitted_at desc);
create index if not exists carelink_payment_disputes_status_idx on public.carelink_payment_disputes (status, created_at desc);
create index if not exists carelink_payment_disputes_mission_idx on public.carelink_payment_disputes (mission_id, created_at desc);
create index if not exists carelink_agent_documents_caregiver_idx on public.carelink_agent_documents (caregiver_id, created_at desc);
create index if not exists carelink_agent_documents_status_idx on public.carelink_agent_documents (status, review_status, expires_at);

alter table public.carelink_dispatch_messages enable row level security;
alter table public.carelink_notifications enable row level security;
alter table public.carelink_alerts enable row level security;
alter table public.carelink_mission_checklist_items enable row level security;
alter table public.carelink_mission_reports enable row level security;
alter table public.carelink_payment_disputes enable row level security;
alter table public.carelink_agent_documents enable row level security;

drop policy if exists authenticated_all_carelink_dispatch_messages on public.carelink_dispatch_messages;
create policy authenticated_all_carelink_dispatch_messages on public.carelink_dispatch_messages for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_notifications on public.carelink_notifications;
create policy authenticated_all_carelink_notifications on public.carelink_notifications for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_alerts on public.carelink_alerts;
create policy authenticated_all_carelink_alerts on public.carelink_alerts for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_mission_checklist_items on public.carelink_mission_checklist_items;
create policy authenticated_all_carelink_mission_checklist_items on public.carelink_mission_checklist_items for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_mission_reports on public.carelink_mission_reports;
create policy authenticated_all_carelink_mission_reports on public.carelink_mission_reports for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_payment_disputes on public.carelink_payment_disputes;
create policy authenticated_all_carelink_payment_disputes on public.carelink_payment_disputes for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_agent_documents on public.carelink_agent_documents;
create policy authenticated_all_carelink_agent_documents on public.carelink_agent_documents for all to authenticated using (true) with check (true);