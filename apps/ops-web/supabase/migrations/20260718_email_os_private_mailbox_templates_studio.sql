-- AngelCare Email-OS — Private Mailbox Templates Studio
-- Additive, mailbox-isolated, versioned and fully auditable template library.

create extension if not exists pgcrypto;

begin;

create table if not exists public.email_os_mailbox_templates (
  id text primary key,
  mailbox_id text not null,
  template_code text not null,
  name text not null,
  description text,
  category text not null default 'other',
  language text not null default 'fr',
  status text not null default 'draft',
  tags jsonb not null default '[]'::jsonb,
  default_priority text not null default 'normal',
  default_cc text,
  default_bcc text,
  tracking_enabled boolean not null default true,
  signature_mode text not null default 'mailbox',
  current_version integer not null default 1,
  current_version_id text,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  last_used_by_user_id text,
  created_by_user_id text,
  updated_by_user_id text,
  published_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint email_os_mailbox_templates_status_check check (status in ('draft','published','archived')),
  constraint email_os_mailbox_templates_priority_check check (default_priority in ('low','normal','high','urgent','vip')),
  constraint email_os_mailbox_templates_signature_check check (signature_mode in ('mailbox','operator','department','none'))
);

create unique index if not exists email_os_mailbox_templates_code_unique
  on public.email_os_mailbox_templates (mailbox_id, lower(template_code));
create index if not exists email_os_mailbox_templates_mailbox_status_idx
  on public.email_os_mailbox_templates (mailbox_id, status, updated_at desc);
create index if not exists email_os_mailbox_templates_mailbox_category_idx
  on public.email_os_mailbox_templates (mailbox_id, category, language);

create table if not exists public.email_os_template_versions (
  id text primary key,
  template_id text not null,
  mailbox_id text not null,
  version_number integer not null,
  subject_template text,
  body_text text not null default '',
  body_html text,
  variables jsonb not null default '[]'::jsonb,
  content_hash text not null,
  change_summary text,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  constraint email_os_template_versions_number_check check (version_number > 0)
);

create unique index if not exists email_os_template_versions_unique
  on public.email_os_template_versions (template_id, version_number);
create index if not exists email_os_template_versions_mailbox_idx
  on public.email_os_template_versions (mailbox_id, template_id, version_number desc);

create table if not exists public.email_os_template_import_jobs (
  id text primary key,
  mailbox_id text not null,
  file_name text,
  strategy text not null,
  status text not null default 'processing',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  created_rows integer not null default 0,
  updated_rows integer not null default 0,
  skipped_rows integer not null default 0,
  invalid_rows integer not null default 0,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint email_os_template_import_jobs_strategy_check check (strategy in ('create_new','skip_duplicates','update_matching_codes','create_duplicates')),
  constraint email_os_template_import_jobs_status_check check (status in ('processing','completed','failed'))
);

create index if not exists email_os_template_import_jobs_mailbox_idx
  on public.email_os_template_import_jobs (mailbox_id, created_at desc);

create table if not exists public.email_os_template_import_rows (
  id text primary key,
  job_id text not null,
  mailbox_id text not null,
  row_number integer not null,
  template_code text,
  template_name text,
  row_status text not null,
  row_action text,
  template_id text,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint email_os_template_import_rows_status_check check (row_status in ('ready','warning','duplicate','invalid','created','updated','skipped'))
);

create index if not exists email_os_template_import_rows_job_idx
  on public.email_os_template_import_rows (job_id, row_number);

create table if not exists public.email_os_template_usage_events (
  id text primary key,
  mailbox_id text not null,
  template_id text not null,
  version_number integer,
  action text not null,
  message_id text,
  outbox_id text,
  actor_user_id text,
  created_at timestamptz not null default now(),
  constraint email_os_template_usage_action_check check (action in ('previewed','inserted','sent','duplicated','restored'))
);

create index if not exists email_os_template_usage_events_template_idx
  on public.email_os_template_usage_events (mailbox_id, template_id, created_at desc);

create table if not exists public.email_os_template_audit_events (
  id text primary key,
  mailbox_id text not null,
  template_id text,
  template_name_snapshot text,
  event_type text not null,
  actor_user_id text,
  actor_name_snapshot text,
  version_number integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_os_template_audit_events_template_idx
  on public.email_os_template_audit_events (mailbox_id, template_id, created_at desc);
create index if not exists email_os_template_audit_events_mailbox_idx
  on public.email_os_template_audit_events (mailbox_id, created_at desc);

alter table public.email_os_mailbox_templates disable row level security;
alter table public.email_os_template_versions disable row level security;
alter table public.email_os_template_import_jobs disable row level security;
alter table public.email_os_template_import_rows disable row level security;
alter table public.email_os_template_usage_events disable row level security;
alter table public.email_os_template_audit_events disable row level security;

-- Best-effort migration of legacy mailbox-scoped response templates.
do $$
begin
  if to_regclass('public.email_os_response_templates') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'email_os_response_templates' and column_name = 'mailbox_id'
     ) then
    insert into public.email_os_mailbox_templates (
      id, mailbox_id, template_code, name, category, language, status,
      current_version, created_by_user_id, updated_by_user_id,
      created_at, updated_at, archived_at
    )
    select
      id::text,
      mailbox_id::text,
      upper(regexp_replace(coalesce(nullif(name,''), id::text), '[^a-zA-Z0-9]+', '_', 'g')),
      coalesce(nullif(name,''), 'Imported legacy template'),
      coalesce(nullif(category,''), 'other'),
      coalesce(nullif(language,''), 'fr'),
      case when lower(coalesce(status,'')) = 'archived' then 'archived' else 'published' end,
      1,
      nullif(created_by::text,''),
      nullif(created_by::text,''),
      coalesce(created_at, now()),
      coalesce(updated_at, created_at, now()),
      archived_at
    from public.email_os_response_templates
    where mailbox_id is not null and nullif(mailbox_id::text,'') is not null
    on conflict do nothing;

    insert into public.email_os_template_versions (
      id, template_id, mailbox_id, version_number, subject_template, body_text,
      body_html, variables, content_hash, change_summary, created_by_user_id, created_at
    )
    select
      gen_random_uuid()::text,
      legacy.id::text,
      legacy.mailbox_id::text,
      1,
      coalesce(legacy.subject_template,''),
      coalesce(legacy.body_template,''),
      null,
      coalesce(legacy.variables, '[]'::jsonb),
      encode(digest(coalesce(legacy.subject_template,'') || '|' || coalesce(legacy.body_template,''), 'sha256'), 'hex'),
      'Migrated from legacy response templates',
      nullif(legacy.created_by::text,''),
      coalesce(legacy.created_at, now())
    from public.email_os_response_templates legacy
    where legacy.mailbox_id is not null
      and exists (select 1 from public.email_os_mailbox_templates t where t.id = legacy.id::text)
      and not exists (select 1 from public.email_os_template_versions v where v.template_id = legacy.id::text and v.version_number = 1);

    update public.email_os_mailbox_templates t
    set current_version_id = v.id
    from public.email_os_template_versions v
    where v.template_id = t.id and v.version_number = 1 and t.current_version_id is null;
  end if;
exception when others then
  raise notice 'Legacy template backfill skipped: %', sqlerrm;
end
$$;

commit;
