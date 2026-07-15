create table if not exists email_os_core_compose_attachments (
  id text primary key,
  draft_id text,
  outbox_id text,
  filename text not null,
  size_bytes integer default 0,
  mime_type text,
  status text default 'attached',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table if exists email_os_core_outbox
add column if not exists cc_email text,
add column if not exists bcc_email text,
add column if not exists priority text default 'normal',
add column if not exists template_key text,
add column if not exists diagnostics jsonb default '{}';

alter table if exists email_os_core_saved_drafts
add column if not exists cc_email text,
add column if not exists bcc_email text,
add column if not exists priority text default 'normal',
add column if not exists template_key text,
add column if not exists diagnostics jsonb default '{}';
