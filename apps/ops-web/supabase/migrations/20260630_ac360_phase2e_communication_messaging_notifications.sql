-- AngelCare 360 Phase 2E - Communication, Messaging, Templates & Parent Notification Runtime
-- Backend/system-only. No school communication UI pages are introduced in this phase.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A core school ops skeleton.

begin;

-- Compatibility safety inherited from Phase 1E/2D lineage.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Communication runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_message_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_key text not null,
  label text not null,
  template_type text not null default 'announcement',
  channel text not null default 'email',
  audience_type text not null default 'parents',
  language_code text not null default 'fr',
  subject_template text,
  body_template text not null,
  variables_schema_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  published_by uuid,
  published_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, template_key),
  check (template_type in ('announcement','payment_reminder','absence_alert','incident_notice','admissions_followup','event_invitation','daily_note','survey','emergency','custom')),
  check (channel in ('email','whatsapp','sms','push','internal','omnichannel')),
  check (audience_type in ('parents','staff','class','student','custom')),
  check (status in ('draft','published','inactive','archived'))
);

create table if not exists public.ac360_school_message_template_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  template_id uuid not null references public.ac360_school_message_templates(id) on delete cascade,
  version_number integer not null default 1,
  subject_template text,
  body_template text not null,
  variables_schema_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(template_id, version_number),
  check (status in ('active','superseded','archived'))
);

create table if not exists public.ac360_school_audience_segments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  segment_key text not null,
  label text not null,
  audience_type text not null default 'parents',
  filter_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, segment_key),
  check (audience_type in ('parents','staff','class','student','custom')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_audience_segment_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  segment_id uuid not null references public.ac360_school_audience_segments(id) on delete cascade,
  member_type text not null default 'guardian',
  member_id uuid,
  display_name text,
  contact_channel text,
  contact_value text,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, segment_id, member_type, member_id),
  check (member_type in ('guardian','student','staff','custom')),
  check (contact_channel in ('email','whatsapp','sms','push','internal') or contact_channel is null),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  recipient_type text not null default 'guardian',
  recipient_id uuid,
  channel text not null default 'whatsapp',
  is_enabled boolean not null default true,
  consent_status text not null default 'implicit',
  quiet_hours_json jsonb not null default '{}'::jsonb,
  language_code text not null default 'fr',
  updated_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, recipient_type, recipient_id, channel),
  check (recipient_type in ('guardian','staff','student','custom')),
  check (channel in ('email','whatsapp','sms','push','internal')),
  check (consent_status in ('implicit','explicit','opted_out','blocked','unknown'))
);

create table if not exists public.ac360_school_message_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_id uuid references public.ac360_school_message_templates(id) on delete set null,
  message_id uuid references public.ac360_school_messages(id) on delete set null,
  segment_id uuid references public.ac360_school_audience_segments(id) on delete set null,
  campaign_code text not null,
  campaign_type text not null default 'announcement',
  channel text not null default 'email',
  audience_type text not null default 'parents',
  title text not null,
  subject text,
  body text not null,
  status text not null default 'draft',
  scheduled_at timestamptz,
  queued_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  queued_count integer not null default 0,
  dispatched_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  read_count integer not null default 0,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, campaign_code),
  check (campaign_type in ('announcement','payment_reminder','absence_alert','incident_notice','admissions_followup','event_invitation','daily_note','survey','emergency','custom')),
  check (channel in ('email','whatsapp','sms','push','internal','omnichannel')),
  check (audience_type in ('parents','staff','class','student','custom')),
  check (status in ('draft','scheduled','queued','dispatching','sent','partially_sent','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_message_recipients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campaign_id uuid not null references public.ac360_school_message_campaigns(id) on delete cascade,
  recipient_code text not null,
  recipient_type text not null default 'guardian',
  recipient_id uuid,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  display_name text,
  channel text not null default 'email',
  contact_value text,
  preference_status text not null default 'allowed',
  status text not null default 'queued',
  queued_at timestamptz not null default now(),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  read_at timestamptz,
  last_error text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, recipient_code),
  check (recipient_type in ('guardian','student','staff','custom')),
  check (channel in ('email','whatsapp','sms','push','internal')),
  check (preference_status in ('allowed','opted_out','blocked','unknown')),
  check (status in ('queued','dispatched','delivered','failed','read','cancelled','archived'))
);

create table if not exists public.ac360_school_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campaign_id uuid references public.ac360_school_message_campaigns(id) on delete cascade,
  job_code text not null,
  channel text not null default 'email',
  provider_key text not null default 'internal_stub',
  status text not null default 'queued',
  attempted_count integer not null default 0,
  succeeded_count integer not null default 0,
  failed_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  run_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, job_code),
  check (channel in ('email','whatsapp','sms','push','internal')),
  check (status in ('queued','running','completed','partial','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_delivery_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campaign_id uuid references public.ac360_school_message_campaigns(id) on delete cascade,
  recipient_id uuid references public.ac360_school_message_recipients(id) on delete cascade,
  delivery_job_id uuid references public.ac360_school_delivery_jobs(id) on delete set null,
  event_type text not null default 'queued',
  provider_key text not null default 'internal_stub',
  provider_message_id text,
  event_payload_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  check (event_type in ('queued','dispatched','sent','delivered','failed','read','clicked','cancelled','provider_callback'))
);

create table if not exists public.ac360_school_parent_notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete cascade,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  campaign_id uuid references public.ac360_school_message_campaigns(id) on delete set null,
  recipient_id uuid references public.ac360_school_message_recipients(id) on delete set null,
  notification_code text not null,
  notification_type text not null default 'announcement',
  channel text not null default 'internal',
  title text not null,
  body text not null,
  status text not null default 'unread',
  priority text not null default 'normal',
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  acknowledged_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, notification_code),
  check (notification_type in ('announcement','payment_reminder','absence_alert','incident_notice','event_invitation','daily_note','survey','emergency','custom')),
  check (channel in ('email','whatsapp','sms','push','internal')),
  check (status in ('unread','read','acknowledged','archived')),
  check (priority in ('low','normal','high','urgent'))
);

create table if not exists public.ac360_school_communication_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  thread_code text not null,
  thread_type text not null default 'parent_conversation',
  subject text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  opened_by uuid,
  closed_by uuid,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  last_message_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, thread_code),
  check (thread_type in ('parent_conversation','complaint','finance_followup','absence_followup','incident_followup','admissions_followup','internal_note','custom')),
  check (status in ('open','pending','resolved','closed','archived')),
  check (priority in ('low','normal','high','urgent'))
);

create table if not exists public.ac360_school_thread_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  thread_id uuid not null references public.ac360_school_communication_threads(id) on delete cascade,
  message_code text not null,
  sender_type text not null default 'staff',
  sender_id uuid,
  channel text not null default 'internal',
  body text not null,
  status text not null default 'posted',
  attachments_json jsonb not null default '[]'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, message_code),
  check (sender_type in ('staff','guardian','system','angelcare')),
  check (channel in ('email','whatsapp','sms','push','internal')),
  check (status in ('draft','posted','sent','failed','archived'))
);

create table if not exists public.ac360_school_communication_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  campaign_id uuid references public.ac360_school_message_campaigns(id) on delete set null,
  thread_id uuid references public.ac360_school_communication_threads(id) on delete set null,
  alert_key text not null,
  alert_type text not null default 'delivery_failure',
  severity text not null default 'medium',
  title text not null,
  description text,
  status text not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('delivery_failure','high_failure_rate','opt_out_spike','quiet_hours_block','unread_urgent','manual_review','provider_issue')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','resolved','dismissed','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Indexes + updated_at triggers
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_school_message_templates_org_status on public.ac360_school_message_templates(org_id, status, channel, template_type);
create index if not exists idx_ac360_school_campaigns_org_status on public.ac360_school_message_campaigns(org_id, status, channel, created_at desc);
create index if not exists idx_ac360_school_recipients_campaign_status on public.ac360_school_message_recipients(campaign_id, status, channel);
create index if not exists idx_ac360_school_delivery_events_campaign on public.ac360_school_delivery_events(campaign_id, event_type, created_at desc);
create index if not exists idx_ac360_school_parent_notifications_guardian on public.ac360_school_parent_notifications(guardian_id, status, created_at desc);
create index if not exists idx_ac360_school_threads_org_status on public.ac360_school_communication_threads(org_id, status, priority, updated_at desc);
create index if not exists idx_ac360_school_thread_messages_thread on public.ac360_school_thread_messages(thread_id, created_at desc);
create index if not exists idx_ac360_school_comm_alerts_org_status on public.ac360_school_communication_alerts(org_id, status, severity, created_at desc);

DO $$
begin
  if exists (select 1 from pg_proc where proname = 'ac360_touch_updated_at') then
    drop trigger if exists trg_ac360_school_message_templates_touch on public.ac360_school_message_templates;
    create trigger trg_ac360_school_message_templates_touch before update on public.ac360_school_message_templates for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_audience_segments_touch on public.ac360_school_audience_segments;
    create trigger trg_ac360_school_audience_segments_touch before update on public.ac360_school_audience_segments for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_notification_preferences_touch on public.ac360_school_notification_preferences;
    create trigger trg_ac360_school_notification_preferences_touch before update on public.ac360_school_notification_preferences for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_message_campaigns_touch on public.ac360_school_message_campaigns;
    create trigger trg_ac360_school_message_campaigns_touch before update on public.ac360_school_message_campaigns for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_message_recipients_touch on public.ac360_school_message_recipients;
    create trigger trg_ac360_school_message_recipients_touch before update on public.ac360_school_message_recipients for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_delivery_jobs_touch on public.ac360_school_delivery_jobs;
    create trigger trg_ac360_school_delivery_jobs_touch before update on public.ac360_school_delivery_jobs for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_parent_notifications_touch on public.ac360_school_parent_notifications;
    create trigger trg_ac360_school_parent_notifications_touch before update on public.ac360_school_parent_notifications for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_threads_touch on public.ac360_school_communication_threads;
    create trigger trg_ac360_school_threads_touch before update on public.ac360_school_communication_threads for each row execute function public.ac360_touch_updated_at();
    drop trigger if exists trg_ac360_school_comm_alerts_touch on public.ac360_school_communication_alerts;
    create trigger trg_ac360_school_comm_alerts_touch before update on public.ac360_school_communication_alerts for each row execute function public.ac360_touch_updated_at();
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_communication_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2e_communication_messaging_notifications',
    'uiBuildAllowed', false,
    'asOfDate', coalesce(p_as_of_date,current_date),
    'templates', jsonb_build_object(
      'total', coalesce((select count(*) from public.ac360_school_message_templates where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id)),0),
      'published', coalesce((select count(*) from public.ac360_school_message_templates where org_id=p_org_id and status='published' and (p_campus_id is null or campus_id=p_campus_id)),0)
    ),
    'campaigns', jsonb_build_object(
      'total', coalesce((select count(*) from public.ac360_school_message_campaigns where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id)),0),
      'queued', coalesce((select count(*) from public.ac360_school_message_campaigns where org_id=p_org_id and status in ('queued','dispatching') and (p_campus_id is null or campus_id=p_campus_id)),0),
      'sent', coalesce((select count(*) from public.ac360_school_message_campaigns where org_id=p_org_id and status in ('sent','partially_sent') and (p_campus_id is null or campus_id=p_campus_id)),0)
    ),
    'delivery', jsonb_build_object(
      'queued', coalesce((select count(*) from public.ac360_school_message_recipients r join public.ac360_school_message_campaigns c on c.id=r.campaign_id where r.org_id=p_org_id and r.status='queued' and (p_campus_id is null or c.campus_id=p_campus_id)),0),
      'dispatched', coalesce((select count(*) from public.ac360_school_message_recipients r join public.ac360_school_message_campaigns c on c.id=r.campaign_id where r.org_id=p_org_id and r.status='dispatched' and (p_campus_id is null or c.campus_id=p_campus_id)),0),
      'delivered', coalesce((select count(*) from public.ac360_school_message_recipients r join public.ac360_school_message_campaigns c on c.id=r.campaign_id where r.org_id=p_org_id and r.status='delivered' and (p_campus_id is null or c.campus_id=p_campus_id)),0),
      'failed', coalesce((select count(*) from public.ac360_school_message_recipients r join public.ac360_school_message_campaigns c on c.id=r.campaign_id where r.org_id=p_org_id and r.status='failed' and (p_campus_id is null or c.campus_id=p_campus_id)),0),
      'read', coalesce((select count(*) from public.ac360_school_message_recipients r join public.ac360_school_message_campaigns c on c.id=r.campaign_id where r.org_id=p_org_id and r.status='read' and (p_campus_id is null or c.campus_id=p_campus_id)),0)
    ),
    'notifications', jsonb_build_object(
      'unread', coalesce((select count(*) from public.ac360_school_parent_notifications where org_id=p_org_id and status='unread' and (p_campus_id is null or campus_id=p_campus_id)),0),
      'urgent', coalesce((select count(*) from public.ac360_school_parent_notifications where org_id=p_org_id and priority='urgent' and status='unread' and (p_campus_id is null or campus_id=p_campus_id)),0)
    ),
    'threads', jsonb_build_object(
      'open', coalesce((select count(*) from public.ac360_school_communication_threads where org_id=p_org_id and status in ('open','pending') and (p_campus_id is null or campus_id=p_campus_id)),0),
      'urgent', coalesce((select count(*) from public.ac360_school_communication_threads where org_id=p_org_id and priority='urgent' and status in ('open','pending') and (p_campus_id is null or campus_id=p_campus_id)),0)
    ),
    'alerts', coalesce((select count(*) from public.ac360_school_communication_alerts where org_id=p_org_id and status='open' and (p_campus_id is null or campus_id=p_campus_id)),0),
    'latestCampaigns', coalesce((select jsonb_agg(to_jsonb(x)) from (select id,campaign_code,title,channel,status,recipient_count,queued_count,dispatched_count,delivered_count,failed_count,created_at from public.ac360_school_message_campaigns where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) order by created_at desc limit 10) x), '[]'::jsonb),
    'latestAlerts', coalesce((select jsonb_agg(to_jsonb(a)) from (select id,alert_key,alert_type,severity,title,status,created_at from public.ac360_school_communication_alerts where org_id=p_org_id and status='open' and (p_campus_id is null or campus_id=p_campus_id) order by created_at desc limit 10) a), '[]'::jsonb)
  );
end $$;

create or replace function public.ac360_school_upsert_message_template(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_template_key text default null,
  p_label text default null,
  p_template_type text default 'announcement',
  p_channel text default 'email',
  p_audience_type text default 'parents',
  p_language_code text default 'fr',
  p_subject_template text default null,
  p_body_template text default null,
  p_status text default 'draft',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template public.ac360_school_message_templates%rowtype;
  v_version_number integer;
  v_key text := coalesce(nullif(trim(p_template_key),''), 'TPL-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,8));
begin
  if nullif(trim(coalesce(p_body_template,'')),'') is null then
    raise exception 'body template is required';
  end if;

  insert into public.ac360_school_message_templates(org_id,campus_id,template_key,label,template_type,channel,audience_type,language_code,subject_template,body_template,status,created_by,published_by,published_at,metadata_json)
  values (p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),v_key),coalesce(p_template_type,'announcement'),coalesce(p_channel,'email'),coalesce(p_audience_type,'parents'),coalesce(p_language_code,'fr'),p_subject_template,p_body_template,coalesce(p_status,'draft'),p_actor_app_user_id,case when p_status='published' then p_actor_app_user_id else null end,case when p_status='published' then now() else null end,coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, template_key) do update set
    campus_id=excluded.campus_id,
    label=excluded.label,
    template_type=excluded.template_type,
    channel=excluded.channel,
    audience_type=excluded.audience_type,
    language_code=excluded.language_code,
    subject_template=excluded.subject_template,
    body_template=excluded.body_template,
    status=excluded.status,
    published_by=case when excluded.status='published' then excluded.published_by else public.ac360_school_message_templates.published_by end,
    published_at=case when excluded.status='published' then now() else public.ac360_school_message_templates.published_at end,
    metadata_json=public.ac360_school_message_templates.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_template;

  select coalesce(max(version_number),0)+1 into v_version_number from public.ac360_school_message_template_versions where template_id=v_template.id;
  insert into public.ac360_school_message_template_versions(org_id,template_id,version_number,subject_template,body_template,variables_schema_json,created_by,metadata_json)
  values (p_org_id,v_template.id,v_version_number,p_subject_template,p_body_template,coalesce(p_metadata->'variables_schema','{}'::jsonb),p_actor_app_user_id,jsonb_build_object('source','template_upsert','template_status',p_status));

  return jsonb_build_object('ok', true, 'template', to_jsonb(v_template), 'versionNumber', v_version_number);
end $$;

create or replace function public.ac360_school_render_message_template(
  p_org_id uuid,
  p_template_key text,
  p_variables jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template record;
  v_subject text;
  v_body text;
  v_key text;
  v_value text;
begin
  select * into v_template from public.ac360_school_message_templates
  where org_id=p_org_id and template_key=p_template_key and status in ('published','draft')
  order by case when status='published' then 0 else 1 end, updated_at desc
  limit 1;
  if not found then raise exception 'message template not found'; end if;

  v_subject := coalesce(v_template.subject_template,'');
  v_body := coalesce(v_template.body_template,'');
  for v_key, v_value in select key, value from jsonb_each_text(coalesce(p_variables,'{}'::jsonb)) loop
    v_subject := replace(replace(v_subject, '{{' || v_key || '}}', v_value), '[' || v_key || ']', v_value);
    v_body := replace(replace(v_body, '{{' || v_key || '}}', v_value), '[' || v_key || ']', v_value);
  end loop;

  return jsonb_build_object('ok', true, 'templateId', v_template.id, 'subject', nullif(v_subject,''), 'body', v_body, 'channel', v_template.channel, 'audienceType', v_template.audience_type);
end $$;

create or replace function public.ac360_school_create_message_campaign(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_template_key text default null,
  p_campaign_code text default null,
  p_campaign_type text default 'announcement',
  p_channel text default 'email',
  p_audience_type text default 'parents',
  p_title text default null,
  p_subject text default null,
  p_body text default null,
  p_variables jsonb default '{}'::jsonb,
  p_scheduled_at timestamptz default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.ac360_school_message_campaigns%rowtype;
  v_template public.ac360_school_message_templates%rowtype;
  v_render jsonb;
  v_code text := coalesce(nullif(trim(p_campaign_code),''), 'CMP-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,8));
  v_message public.ac360_school_messages%rowtype;
  v_subject text := p_subject;
  v_body text := p_body;
  v_title text := coalesce(nullif(trim(p_title),''), 'Campagne communication');
begin
  if p_template_key is not null then
    select * into v_template from public.ac360_school_message_templates where org_id=p_org_id and template_key=p_template_key and status in ('published','draft') order by updated_at desc limit 1;
    if found then
      v_render := public.ac360_school_render_message_template(p_org_id, p_template_key, p_variables);
      v_subject := coalesce(v_subject, v_render->>'subject');
      v_body := coalesce(v_body, v_render->>'body');
      p_channel := coalesce(nullif(p_channel,''), v_template.channel);
      p_audience_type := coalesce(nullif(p_audience_type,''), v_template.audience_type);
      p_campaign_type := coalesce(nullif(p_campaign_type,''), v_template.template_type);
    end if;
  end if;

  if nullif(trim(coalesce(v_body,'')),'') is null then
    raise exception 'campaign body is required';
  end if;

  insert into public.ac360_school_messages(org_id,campus_id,message_code,channel,audience_type,subject,body,status,recipient_count,scheduled_at,created_by,metadata_json)
  values (p_org_id,p_campus_id,'MSG-' || v_code,case when p_channel='omnichannel' then 'internal' else p_channel end,coalesce(p_audience_type,'parents'),v_subject,v_body,case when p_scheduled_at is null then 'draft' else 'scheduled' end,0,p_scheduled_at,p_actor_app_user_id,jsonb_build_object('source','phase_2e_campaign','campaign_code',v_code) || coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, message_code) do update set
    subject=excluded.subject, body=excluded.body, status=excluded.status, scheduled_at=excluded.scheduled_at, metadata_json=public.ac360_school_messages.metadata_json || excluded.metadata_json, updated_at=now()
  returning * into v_message;

  insert into public.ac360_school_message_campaigns(org_id,campus_id,template_id,message_id,campaign_code,campaign_type,channel,audience_type,title,subject,body,status,scheduled_at,created_by,metadata_json)
  values (p_org_id,p_campus_id,case when v_template.id is null then null else v_template.id end,v_message.id,v_code,coalesce(p_campaign_type,'announcement'),coalesce(p_channel,'email'),coalesce(p_audience_type,'parents'),v_title,v_subject,v_body,case when p_scheduled_at is null then 'draft' else 'scheduled' end,p_scheduled_at,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('uiBuildAllowed',false,'phase','phase_2e'))
  on conflict (org_id, campaign_code) do update set
    campus_id=excluded.campus_id,
    template_id=excluded.template_id,
    message_id=excluded.message_id,
    campaign_type=excluded.campaign_type,
    channel=excluded.channel,
    audience_type=excluded.audience_type,
    title=excluded.title,
    subject=excluded.subject,
    body=excluded.body,
    scheduled_at=excluded.scheduled_at,
    metadata_json=public.ac360_school_message_campaigns.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_campaign;

  return jsonb_build_object('ok', true, 'campaign', to_jsonb(v_campaign), 'message', to_jsonb(v_message));
end $$;

create or replace function public.ac360_school_enqueue_campaign_recipients(
  p_org_id uuid,
  p_campaign_id uuid,
  p_recipients jsonb default '[]'::jsonb,
  p_class_id uuid default null,
  p_student_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.ac360_school_message_campaigns%rowtype;
  v_count integer := 0;
  v_item jsonb;
  v_channel text;
  v_contact text;
  v_pref text;
begin
  select * into v_campaign from public.ac360_school_message_campaigns where id=p_campaign_id and org_id=p_org_id;
  if not found then raise exception 'campaign not found'; end if;
  v_channel := case when v_campaign.channel='omnichannel' then 'internal' else v_campaign.channel end;

  if jsonb_typeof(coalesce(p_recipients,'[]'::jsonb)) = 'array' and jsonb_array_length(coalesce(p_recipients,'[]'::jsonb)) > 0 then
    for v_item in select * from jsonb_array_elements(p_recipients) loop
      v_contact := coalesce(v_item->>'contactValue', v_item->>'contact_value', v_item->>'email', v_item->>'whatsapp', v_item->>'phone');
      insert into public.ac360_school_message_recipients(org_id,campaign_id,recipient_code,recipient_type,recipient_id,student_id,guardian_id,staff_id,class_id,display_name,channel,contact_value,preference_status,metadata_json)
      values (p_org_id,p_campaign_id,'REC-' || substr(gen_random_uuid()::text,1,12),coalesce(v_item->>'recipientType',v_item->>'recipient_type','custom'),nullif(coalesce(v_item->>'recipientId',v_item->>'recipient_id'),'')::uuid,nullif(coalesce(v_item->>'studentId',v_item->>'student_id'),'')::uuid,nullif(coalesce(v_item->>'guardianId',v_item->>'guardian_id'),'')::uuid,nullif(coalesce(v_item->>'staffId',v_item->>'staff_id'),'')::uuid,p_class_id,coalesce(v_item->>'displayName',v_item->>'display_name'),v_channel,v_contact,'allowed',coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('source','manual_recipients'))
      on conflict (org_id, recipient_code) do nothing;
      v_count := v_count + 1;
    end loop;
  elsif v_campaign.audience_type in ('parents','student','class') then
    for v_item in
      select jsonb_build_object('guardian_id',g.id,'student_id',sg.student_id,'display_name',g.full_name,'contact',case when v_channel='email' then g.email when v_channel='sms' then g.phone when v_channel='whatsapp' then coalesce(g.whatsapp,g.phone) else null end,'pref',coalesce(np.consent_status,'implicit'))
      from public.ac360_school_guardians g
      left join public.ac360_school_student_guardians sg on sg.guardian_id=g.id and sg.status='active'
      left join public.ac360_school_class_enrollments ce on ce.student_id=sg.student_id and ce.status='active'
      left join public.ac360_school_notification_preferences np on np.org_id=p_org_id and np.recipient_type='guardian' and np.recipient_id=g.id and np.channel=v_channel
      where g.org_id=p_org_id and g.status='active'
        and (p_student_id is null or sg.student_id=p_student_id)
        and (p_class_id is null or ce.class_id=p_class_id)
        and coalesce(np.is_enabled,true)=true
        and coalesce(np.consent_status,'implicit') <> 'opted_out'
    loop
      insert into public.ac360_school_message_recipients(org_id,campaign_id,recipient_code,recipient_type,recipient_id,student_id,guardian_id,class_id,display_name,channel,contact_value,preference_status,metadata_json)
      values (p_org_id,p_campaign_id,'REC-' || substr(gen_random_uuid()::text,1,12),'guardian',(v_item->>'guardian_id')::uuid,(v_item->>'student_id')::uuid,(v_item->>'guardian_id')::uuid,p_class_id,v_item->>'display_name',v_channel,v_item->>'contact','allowed',coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('source','auto_parent_audience'));
      v_count := v_count + 1;
    end loop;
  elsif v_campaign.audience_type='staff' then
    for v_item in
      select jsonb_build_object('staff_id',s.id,'display_name',s.full_name,'contact',case when v_channel='email' then s.email when v_channel in ('sms','whatsapp') then s.phone else null end)
      from public.ac360_school_staff_profiles s
      where s.org_id=p_org_id and s.status='active'
    loop
      insert into public.ac360_school_message_recipients(org_id,campaign_id,recipient_code,recipient_type,recipient_id,staff_id,display_name,channel,contact_value,preference_status,metadata_json)
      values (p_org_id,p_campaign_id,'REC-' || substr(gen_random_uuid()::text,1,12),'staff',(v_item->>'staff_id')::uuid,(v_item->>'staff_id')::uuid,v_item->>'display_name',v_channel,v_item->>'contact','allowed',coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('source','auto_staff_audience'));
      v_count := v_count + 1;
    end loop;
  end if;

  update public.ac360_school_message_campaigns
  set recipient_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=p_campaign_id),
      queued_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=p_campaign_id and status='queued'),
      status='queued', queued_at=now(), updated_at=now()
  where id=p_campaign_id and org_id=p_org_id
  returning * into v_campaign;

  update public.ac360_school_messages
  set recipient_count=v_campaign.recipient_count, status='scheduled', updated_at=now()
  where id=v_campaign.message_id and org_id=p_org_id;

  return jsonb_build_object('ok', true, 'campaign', to_jsonb(v_campaign), 'enqueuedCount', v_count);
end $$;

create or replace function public.ac360_school_dispatch_campaign_batch(
  p_org_id uuid,
  p_campaign_id uuid,
  p_limit integer default 100,
  p_provider_key text default 'internal_stub',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.ac360_school_message_campaigns%rowtype;
  v_job public.ac360_school_delivery_jobs%rowtype;
  v_rec record;
  v_attempted integer := 0;
  v_succeeded integer := 0;
  v_failed integer := 0;
  v_channel text;
begin
  select * into v_campaign from public.ac360_school_message_campaigns where id=p_campaign_id and org_id=p_org_id;
  if not found then raise exception 'campaign not found'; end if;
  v_channel := case when v_campaign.channel='omnichannel' then 'internal' else v_campaign.channel end;

  insert into public.ac360_school_delivery_jobs(org_id,campaign_id,job_code,channel,provider_key,status,started_at,run_by,metadata_json)
  values (p_org_id,p_campaign_id,'JOB-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,8),v_channel,coalesce(p_provider_key,'internal_stub'),'running',now(),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning * into v_job;

  for v_rec in
    select * from public.ac360_school_message_recipients
    where org_id=p_org_id and campaign_id=p_campaign_id and status='queued'
    order by created_at asc
    limit greatest(1, least(coalesce(p_limit,100), 1000))
  loop
    v_attempted := v_attempted + 1;
    update public.ac360_school_message_recipients
      set status='dispatched', dispatched_at=now(), updated_at=now()
    where id=v_rec.id;

    insert into public.ac360_school_delivery_events(org_id,campaign_id,recipient_id,delivery_job_id,event_type,provider_key,event_payload_json)
    values (p_org_id,p_campaign_id,v_rec.id,v_job.id,'dispatched',coalesce(p_provider_key,'internal_stub'),jsonb_build_object('stub',true,'phase','phase_2e'));

    if v_rec.guardian_id is not null then
      insert into public.ac360_school_parent_notifications(org_id,campus_id,guardian_id,student_id,campaign_id,recipient_id,notification_code,notification_type,channel,title,body,priority,metadata_json)
      values (p_org_id,v_campaign.campus_id,v_rec.guardian_id,v_rec.student_id,p_campaign_id,v_rec.id,'NOTIF-' || substr(gen_random_uuid()::text,1,12),v_campaign.campaign_type,v_channel,v_campaign.title,v_campaign.body,case when v_campaign.campaign_type='emergency' then 'urgent' else 'normal' end,jsonb_build_object('source','campaign_dispatch','campaign_code',v_campaign.campaign_code));
    end if;
    v_succeeded := v_succeeded + 1;
  end loop;

  update public.ac360_school_delivery_jobs
  set status=case when v_failed > 0 and v_succeeded > 0 then 'partial' when v_failed > 0 then 'failed' else 'completed' end,
      attempted_count=v_attempted, succeeded_count=v_succeeded, failed_count=v_failed, completed_at=now(), updated_at=now()
  where id=v_job.id
  returning * into v_job;

  update public.ac360_school_message_campaigns
  set status=case when (select count(*) from public.ac360_school_message_recipients where campaign_id=p_campaign_id and status='queued') > 0 then 'partially_sent' else 'sent' end,
      dispatched_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=p_campaign_id and status in ('dispatched','delivered','read')),
      queued_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=p_campaign_id and status='queued'),
      sent_at=coalesce(sent_at, now()), updated_at=now()
  where id=p_campaign_id
  returning * into v_campaign;

  update public.ac360_school_messages
    set status='sent', sent_at=coalesce(sent_at, now()), updated_at=now()
  where id=v_campaign.message_id and org_id=p_org_id;

  return jsonb_build_object('ok', true, 'job', to_jsonb(v_job), 'campaign', to_jsonb(v_campaign), 'attemptedCount', v_attempted, 'dispatchedCount', v_succeeded);
end $$;

create or replace function public.ac360_school_record_delivery_event(
  p_org_id uuid,
  p_recipient_id uuid,
  p_event_type text,
  p_provider_key text default 'internal_stub',
  p_provider_message_id text default null,
  p_error_message text default null,
  p_event_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec public.ac360_school_message_recipients%rowtype;
  v_campaign public.ac360_school_message_campaigns%rowtype;
begin
  select * into v_rec from public.ac360_school_message_recipients where id=p_recipient_id and org_id=p_org_id;
  if not found then raise exception 'recipient not found'; end if;
  select * into v_campaign from public.ac360_school_message_campaigns where id=v_rec.campaign_id and org_id=p_org_id;

  insert into public.ac360_school_delivery_events(org_id,campaign_id,recipient_id,event_type,provider_key,provider_message_id,error_message,event_payload_json)
  values (p_org_id,v_rec.campaign_id,p_recipient_id,coalesce(p_event_type,'provider_callback'),coalesce(p_provider_key,'internal_stub'),p_provider_message_id,p_error_message,coalesce(p_event_payload,'{}'::jsonb));

  if p_event_type in ('delivered','sent') then
    update public.ac360_school_message_recipients set status='delivered', delivered_at=coalesce(delivered_at,now()), updated_at=now() where id=p_recipient_id returning * into v_rec;
  elsif p_event_type='read' then
    update public.ac360_school_message_recipients set status='read', read_at=coalesce(read_at,now()), updated_at=now() where id=p_recipient_id returning * into v_rec;
    update public.ac360_school_parent_notifications set status='read', read_at=coalesce(read_at,now()), updated_at=now() where recipient_id=p_recipient_id and org_id=p_org_id;
  elsif p_event_type='failed' then
    update public.ac360_school_message_recipients set status='failed', failed_at=now(), last_error=p_error_message, updated_at=now() where id=p_recipient_id returning * into v_rec;
    insert into public.ac360_school_communication_alerts(org_id,campus_id,campaign_id,alert_key,alert_type,severity,title,description,metadata_json)
    values (p_org_id,v_campaign.campus_id,v_campaign.id,'delivery-failed-' || p_recipient_id::text,'delivery_failure','medium','Message delivery failed',coalesce(p_error_message,'Provider returned failure.'),jsonb_build_object('recipient_id',p_recipient_id,'campaign_id',v_campaign.id))
    on conflict (org_id, alert_key) do update set status='open', description=excluded.description, updated_at=now();
  end if;

  update public.ac360_school_message_campaigns
  set delivered_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=v_rec.campaign_id and status in ('delivered','read')),
      failed_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=v_rec.campaign_id and status='failed'),
      read_count=(select count(*) from public.ac360_school_message_recipients where campaign_id=v_rec.campaign_id and status='read'),
      updated_at=now()
  where id=v_rec.campaign_id
  returning * into v_campaign;

  return jsonb_build_object('ok', true, 'recipient', to_jsonb(v_rec), 'campaign', to_jsonb(v_campaign));
end $$;

create or replace function public.ac360_school_update_notification_preference(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_recipient_type text default 'guardian',
  p_recipient_id uuid default null,
  p_channel text default 'whatsapp',
  p_is_enabled boolean default true,
  p_consent_status text default 'explicit',
  p_language_code text default 'fr',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref public.ac360_school_notification_preferences%rowtype;
begin
  insert into public.ac360_school_notification_preferences(org_id,campus_id,recipient_type,recipient_id,channel,is_enabled,consent_status,language_code,updated_by,metadata_json)
  values (p_org_id,p_campus_id,coalesce(p_recipient_type,'guardian'),p_recipient_id,coalesce(p_channel,'whatsapp'),coalesce(p_is_enabled,true),coalesce(p_consent_status,'explicit'),coalesce(p_language_code,'fr'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, recipient_type, recipient_id, channel) do update set
    campus_id=excluded.campus_id,
    is_enabled=excluded.is_enabled,
    consent_status=excluded.consent_status,
    language_code=excluded.language_code,
    updated_by=excluded.updated_by,
    metadata_json=public.ac360_school_notification_preferences.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_pref;
  return jsonb_build_object('ok', true, 'preference', to_jsonb(v_pref));
end $$;

create or replace function public.ac360_school_open_communication_thread(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_thread_type text default 'parent_conversation',
  p_subject text default null,
  p_guardian_id uuid default null,
  p_student_id uuid default null,
  p_assigned_staff_id uuid default null,
  p_priority text default 'normal',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.ac360_school_communication_threads%rowtype;
begin
  insert into public.ac360_school_communication_threads(org_id,campus_id,thread_code,thread_type,subject,guardian_id,student_id,assigned_staff_id,priority,opened_by,metadata_json)
  values (p_org_id,p_campus_id,'THR-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,8),coalesce(p_thread_type,'parent_conversation'),coalesce(nullif(trim(p_subject),''),'Conversation parent'),p_guardian_id,p_student_id,p_assigned_staff_id,coalesce(p_priority,'normal'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning * into v_thread;
  return jsonb_build_object('ok', true, 'thread', to_jsonb(v_thread));
end $$;

create or replace function public.ac360_school_post_thread_message(
  p_org_id uuid,
  p_thread_id uuid,
  p_sender_type text default 'staff',
  p_sender_id uuid default null,
  p_channel text default 'internal',
  p_body text default null,
  p_attachments jsonb default '[]'::jsonb,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message public.ac360_school_thread_messages%rowtype;
  v_thread public.ac360_school_communication_threads%rowtype;
begin
  if nullif(trim(coalesce(p_body,'')),'') is null then raise exception 'thread message body is required'; end if;
  select * into v_thread from public.ac360_school_communication_threads where id=p_thread_id and org_id=p_org_id;
  if not found then raise exception 'thread not found'; end if;
  insert into public.ac360_school_thread_messages(org_id,thread_id,message_code,sender_type,sender_id,channel,body,attachments_json,metadata_json)
  values (p_org_id,p_thread_id,'THMSG-' || substr(gen_random_uuid()::text,1,12),coalesce(p_sender_type,'staff'),p_sender_id,coalesce(p_channel,'internal'),p_body,coalesce(p_attachments,'[]'::jsonb),coalesce(p_metadata,'{}'::jsonb))
  returning * into v_message;
  update public.ac360_school_communication_threads set last_message_at=now(), updated_at=now(), status=case when status='closed' then 'open' else status end where id=p_thread_id returning * into v_thread;
  return jsonb_build_object('ok', true, 'thread', to_jsonb(v_thread), 'message', to_jsonb(v_message));
end $$;

create or replace function public.ac360_school_mark_parent_notification_read(
  p_org_id uuid,
  p_notification_id uuid,
  p_acknowledge boolean default false,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification public.ac360_school_parent_notifications%rowtype;
begin
  update public.ac360_school_parent_notifications
  set status=case when coalesce(p_acknowledge,false) then 'acknowledged' else 'read' end,
      read_at=coalesce(read_at,now()),
      acknowledged_at=case when coalesce(p_acknowledge,false) then now() else acknowledged_at end,
      metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb),
      updated_at=now()
  where id=p_notification_id and org_id=p_org_id
  returning * into v_notification;
  if not found then raise exception 'notification not found'; end if;
  return jsonb_build_object('ok', true, 'notification', to_jsonb(v_notification));
end $$;

create or replace function public.ac360_school_resolve_communication_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alert public.ac360_school_communication_alerts%rowtype;
begin
  update public.ac360_school_communication_alerts
  set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), resolution_note=p_resolution_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where id=p_alert_id and org_id=p_org_id
  returning * into v_alert;
  if not found then raise exception 'communication alert not found'; end if;
  return jsonb_build_object('ok', true, 'alert', to_jsonb(v_alert));
end $$;

-- -----------------------------------------------------------------------------
-- 4. Action registry and wiring seeds
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('school.communication.template.upsert','communication_basic','AC360-ENG-46','Upsert message template','Create or update school/parent message template with version history.','communication.template.write',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.template.render','communication_basic','AC360-ENG-46','Render message template','Render message template with variables before campaign or notification.','communication.template.render','automation_credit',1,'require_topup','{"access_type":"read","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.campaign.create','communication_basic','AC360-ENG-46','Create message campaign','Create parent/staff/class communication campaign.','communication.campaign.create',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.campaign.enqueue','communication_basic','AC360-ENG-46','Enqueue campaign recipients','Build guarded campaign recipient queue from parents, class, student, staff or custom list.','communication.campaign.enqueue','automation_credit',1,'require_topup','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.email.dispatch','communication_basic','AC360-ENG-46','Dispatch email batch','Dispatch queued email recipients and meter email usage.','communication.email.dispatch','email_message',1,'require_topup','{"access_type":"send","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.whatsapp.dispatch','communication_whatsapp','AC360-ENG-46','Dispatch WhatsApp batch','Dispatch queued WhatsApp recipients and meter WhatsApp usage.','communication.whatsapp.dispatch','whatsapp_message',3,'require_topup','{"access_type":"send","phase":"phase_2e_communication_runtime","suggested_addon_key":"communication_omnichannel"}'::jsonb),
('school.communication.sms.dispatch','communication_sms','AC360-ENG-46','Dispatch SMS batch','Dispatch queued SMS recipients and meter SMS usage.','communication.sms.dispatch','sms_message',5,'require_topup','{"access_type":"send","phase":"phase_2e_communication_runtime","suggested_addon_key":"communication_omnichannel"}'::jsonb),
('school.communication.push.dispatch','communication_basic','AC360-ENG-46','Dispatch push/internal notification batch','Dispatch queued push/internal notification recipients.','communication.push.dispatch','automation_credit',1,'require_topup','{"access_type":"send","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.delivery.record','communication_basic','AC360-ENG-46','Record delivery event','Record provider delivery, read or failure event.','communication.delivery.record',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.preference.update','communication_basic','AC360-ENG-46','Update notification preference','Update parent/staff notification channel preference and consent.','communication.preference.update',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.thread.open','communication_basic','AC360-ENG-46','Open communication thread','Open parent/staff communication thread.','communication.thread.open',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.thread.reply','communication_basic','AC360-ENG-46','Post thread reply','Post a message into a communication thread.','communication.thread.reply','automation_credit',1,'require_topup','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.notification.mark_read','communication_basic','AC360-ENG-46','Mark parent notification read','Mark parent notification read/acknowledged without deleting the record.','communication.notification.mark_read',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb),
('school.communication.alert.resolve','communication_basic','AC360-ENG-46','Resolve communication alert','Resolve delivery/communication alert while preserving event history.','communication.alert.resolve',null,0,'block','{"access_type":"write","phase":"phase_2e_communication_runtime"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table,
  enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.school_communication.template.upsert','/api/ac360/school-communication/templates/upsert','POST','school.communication.template.upsert','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_message_templates','strict','fixed_1','request_or_generated',null,null,'active','Upserts communication template under AC360 guard.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.template.render','/api/ac360/school-communication/templates/render','POST','school.communication.template.render','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_message_templates','strict','fixed_1','request_or_generated',null,null,'active','Renders template and meters automation credits.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.campaign.create','/api/ac360/school-communication/campaigns/create','POST','school.communication.campaign.create','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_message_campaigns','strict','fixed_1','request_or_generated',null,null,'active','Creates message campaign under communication entitlement.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.campaign.enqueue','/api/ac360/school-communication/campaigns/enqueue','POST','school.communication.campaign.enqueue','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_message_recipients','strict','recipient_count','request_or_generated',null,null,'active','Enqueues campaign recipients and meters automation.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.email.dispatch','/api/ac360/school-communication/campaigns/dispatch','POST','school.communication.email.dispatch','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_delivery_jobs','strict','recipient_count','request_or_generated',null,'school.message.send','active','Dispatches email campaign batch.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.whatsapp.dispatch','/api/ac360/school-communication/campaigns/dispatch','POST','school.communication.whatsapp.dispatch','communication_whatsapp','AC360-ENG-46','angelcare_360_school_communication','ac360_school_delivery_jobs','strict','recipient_count','request_or_generated',null,'school.communication.email.dispatch','active','Dispatches WhatsApp campaign batch.','{"phase":"phase_2e","uiBuildAllowed":false,"suggested_addon_key":"communication_omnichannel"}'::jsonb),
('ac360.school_communication.sms.dispatch','/api/ac360/school-communication/campaigns/dispatch','POST','school.communication.sms.dispatch','communication_sms','AC360-ENG-46','angelcare_360_school_communication','ac360_school_delivery_jobs','strict','recipient_count','request_or_generated',null,'school.communication.email.dispatch','active','Dispatches SMS campaign batch.','{"phase":"phase_2e","uiBuildAllowed":false,"suggested_addon_key":"communication_omnichannel"}'::jsonb),
('ac360.school_communication.push.dispatch','/api/ac360/school-communication/campaigns/dispatch','POST','school.communication.push.dispatch','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_delivery_jobs','strict','recipient_count','request_or_generated',null,'school.communication.email.dispatch','active','Dispatches push/internal notification batch.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.delivery.record','/api/ac360/school-communication/delivery/record','POST','school.communication.delivery.record','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_delivery_events','strict','fixed_1','request_or_generated',null,null,'active','Records delivery callback/event.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.preference.update','/api/ac360/school-communication/preferences/update','POST','school.communication.preference.update','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_notification_preferences','strict','fixed_1','request_or_generated',null,null,'active','Updates notification preference and consent.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.thread.open','/api/ac360/school-communication/threads/open','POST','school.communication.thread.open','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_communication_threads','strict','fixed_1','request_or_generated',null,null,'active','Opens communication thread.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.thread.reply','/api/ac360/school-communication/threads/reply','POST','school.communication.thread.reply','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_thread_messages','strict','fixed_1','request_or_generated',null,null,'active','Posts reply to communication thread.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb),
('ac360.school_communication.notification.mark_read','/api/ac360/school-communication/notifications/mark-read','POST','school.communication.notification.mark_read','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_parent_notifications','strict','fixed_1','request_or_generated',null,null,'active','Marks notification read/acknowledged.','{"phase":"phase_2e","uiBuildAllowed":false,"archiveNotDelete":true}'::jsonb),
('ac360.school_communication.alert.resolve','/api/ac360/school-communication/alerts/resolve','POST','school.communication.alert.resolve','communication_basic','AC360-ENG-46','angelcare_360_school_communication','ac360_school_communication_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves communication alert.','{"phase":"phase_2e","uiBuildAllowed":false}'::jsonb)
on conflict (wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  fallback_action_key=excluded.fallback_action_key,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values
('communication_messaging_notifications','AC360-ENG-46','communication_basic','Communication, Messaging, Templates & Parent Notification Runtime','phase_2e_communication_messaging_notifications','guarded',array['ac360_school_message_templates','ac360_school_message_template_versions','ac360_school_audience_segments','ac360_school_audience_segment_members','ac360_school_notification_preferences','ac360_school_message_campaigns','ac360_school_message_recipients','ac360_school_delivery_jobs','ac360_school_delivery_events','ac360_school_parent_notifications','ac360_school_communication_threads','ac360_school_thread_messages','ac360_school_communication_alerts'],array['school.communication.template.upsert','school.communication.template.render','school.communication.campaign.create','school.communication.campaign.enqueue','school.communication.email.dispatch','school.communication.whatsapp.dispatch','school.communication.sms.dispatch','school.communication.push.dispatch','school.communication.delivery.record','school.communication.preference.update','school.communication.thread.open','school.communication.thread.reply','school.communication.notification.mark_read','school.communication.alert.resolve'],'{"phase":"phase_2e","uiBuildAllowed":false,"archiveNotDelete":true,"communication_omnichannel_addon_recommended":true}'::jsonb)
on conflict (module_key) do update set
  engine_code=excluded.engine_code,
  feature_key=excluded.feature_key,
  label=excluded.label,
  phase=excluded.phase,
  status=excluded.status,
  data_tables=excluded.data_tables,
  guarded_actions=excluded.guarded_actions,
  metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, status, phase, sort_order) values
('school_comm_whatsapp_usage_recommend_omnichannel','High WhatsApp communication recommends Communication Power','School Communication','communication.usage.high','{"whatsapp_message_gt":500}'::jsonb,'{"recommend_addon":"communication_omnichannel","create_alert":true}'::jsonb,'active','phase_2e_communication_messaging_notifications',250),
('school_comm_failed_delivery_create_alert','Failed delivery creates communication alert','School Communication','communication.delivery.failed','{"failed_count_gt":0}'::jsonb,'{"create_communication_alert":true,"severity":"medium"}'::jsonb,'active','phase_2e_communication_messaging_notifications',251),
('school_comm_emergency_requires_fast_dispatch','Emergency campaign triggers urgent notification priority','School Communication','communication.emergency.created','{"campaign_type":"emergency"}'::jsonb,'{"priority":"urgent","dispatch_fast":true}'::jsonb,'active','phase_2e_communication_messaging_notifications',252)
on conflict (rule_key) do update set
  label=excluded.label,
  system_group=excluded.system_group,
  trigger_event=excluded.trigger_event,
  condition_json=excluded.condition_json,
  action_json=excluded.action_json,
  status=excluded.status,
  phase=excluded.phase,
  sort_order=excluded.sort_order,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 5. RLS service-role policies for backend API control
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_message_templates','ac360_school_message_template_versions','ac360_school_audience_segments','ac360_school_audience_segment_members',
    'ac360_school_notification_preferences','ac360_school_message_campaigns','ac360_school_message_recipients','ac360_school_delivery_jobs',
    'ac360_school_delivery_events','ac360_school_parent_notifications','ac360_school_communication_threads','ac360_school_thread_messages',
    'ac360_school_communication_alerts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

commit;
