-- AngelCare Email-OS: inbound identity, duplicate prevention and anti-resurrection registry
-- This migration stores no email body or attachment content in the suppression registry.

create extension if not exists pgcrypto;

alter table if exists public.email_os_core_inbox
  add column if not exists ingest_key text;

create table if not exists public.email_os_inbound_suppressions (
  id uuid primary key default gen_random_uuid(),
  mailbox_id text not null,
  identity_key text not null,
  ingest_key text not null,
  provider_uid text,
  message_id text,
  fingerprint text,
  source_message_id text,
  reason text not null default 'permanent_delete',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  released_at timestamptz
);

create unique index if not exists email_os_inbound_suppressions_identity_unique
  on public.email_os_inbound_suppressions (mailbox_id, identity_key);

create index if not exists email_os_inbound_suppressions_ingest_idx
  on public.email_os_inbound_suppressions (mailbox_id, ingest_key)
  where released_at is null;

alter table public.email_os_inbound_suppressions disable row level security;

-- Normalize current rows around RFC Message-ID first, then POP3 identity.
update public.email_os_core_inbox
set ingest_key = case
  when nullif(trim(both '<>' from coalesce(raw->>'messageId', raw->>'message_id', '')), '') is not null
    then 'mid:' || lower(trim(both '<>' from coalesce(raw->>'messageId', raw->>'message_id')))
  when nullif(coalesce(raw->>'externalId', raw->>'providerUid', raw->>'provider_uid', ''), '') is not null
    then 'pop3:' || lower(mailbox_id) || ':' || lower(coalesce(raw->>'externalId', raw->>'providerUid', raw->>'provider_uid'))
  when nullif(provider_uid, '') is not null
    then case
      when lower(provider_uid) ~ '^(mid|pop3|fp):' then lower(provider_uid)
      else 'raw:' || lower(mailbox_id) || ':' || lower(provider_uid)
    end
  else 'legacy:' || lower(mailbox_id) || ':' || id::text
end
where ingest_key is null or ingest_key = '';

-- Preserve one operational row per mailbox/message identity.
create temporary table email_os_inbound_duplicate_map on commit drop as
with ranked as (
  select
    id,
    mailbox_id,
    ingest_key,
    first_value(id) over (
      partition by mailbox_id, ingest_key
      order by
        case lower(coalesce(status, ''))
          when 'read' then 0
          when 'archived' then 1
          when 'trash' then 2
          when 'trashed' then 2
          when 'spam' then 3
          else 4
        end,
        updated_at desc nulls last,
        created_at asc nulls last,
        id
    ) as survivor_id,
    row_number() over (
      partition by mailbox_id, ingest_key
      order by
        case lower(coalesce(status, ''))
          when 'read' then 0
          when 'archived' then 1
          when 'trash' then 2
          when 'trashed' then 2
          when 'spam' then 3
          else 4
        end,
        updated_at desc nulls last,
        created_at asc nulls last,
        id
    ) as row_number
  from public.email_os_core_inbox
  where ingest_key is not null
)
select id as duplicate_id, survivor_id, mailbox_id
from ranked
where row_number > 1;

-- Move operational evidence to the survivor before deleting duplicate source rows.
update public.email_os_message_notes n
set message_id = m.survivor_id
from email_os_inbound_duplicate_map m
where n.mailbox_id = m.mailbox_id and n.message_id = m.duplicate_id;

update public.email_os_message_tasks t
set message_id = m.survivor_id
from email_os_inbound_duplicate_map m
where t.mailbox_id = m.mailbox_id and t.message_id = m.duplicate_id;

update public.email_os_message_assignments a
set message_id = m.survivor_id
from email_os_inbound_duplicate_map m
where a.mailbox_id = m.mailbox_id and a.message_id = m.duplicate_id;

update public.email_os_message_entity_links l
set message_id = m.survivor_id
from email_os_inbound_duplicate_map m
where l.mailbox_id = m.mailbox_id and l.message_id = m.duplicate_id;

update public.email_os_message_audit_events e
set message_id = m.survivor_id
from email_os_inbound_duplicate_map m
where e.mailbox_id = m.mailbox_id and e.message_id = m.duplicate_id;

delete from public.email_os_message_workflow duplicate_workflow
using email_os_inbound_duplicate_map m
where duplicate_workflow.mailbox_id = m.mailbox_id
  and duplicate_workflow.message_id = m.duplicate_id
  and exists (
    select 1
    from public.email_os_message_workflow survivor_workflow
    where survivor_workflow.mailbox_id = m.mailbox_id
      and survivor_workflow.message_id = m.survivor_id
      and survivor_workflow.source_table = duplicate_workflow.source_table
  );

update public.email_os_message_workflow w
set message_id = m.survivor_id,
    updated_at = now()
from email_os_inbound_duplicate_map m
where w.mailbox_id = m.mailbox_id and w.message_id = m.duplicate_id;

delete from public.email_os_core_inbox i
using email_os_inbound_duplicate_map m
where i.mailbox_id = m.mailbox_id and i.id = m.duplicate_id;

create unique index if not exists email_os_core_inbox_ingest_unique
  on public.email_os_core_inbox (mailbox_id, ingest_key)
  where ingest_key is not null;
