-- ANGELCARE Email OS — Sender Identity Control Plane
-- Centralizes the external commercial sender identity shown in recipients' inboxes.

create extension if not exists pgcrypto;

create table if not exists public.email_os_sender_identities (
  id text primary key default gen_random_uuid()::text,
  mailbox_id text not null unique,
  internal_name text not null,
  external_display_name text not null,
  from_address text not null,
  reply_to_name text,
  reply_to_address text,
  identity_mode text not null default 'corporate'
    check (identity_mode in ('corporate','department','named_operator','executive')),
  brand_prefix text,
  default_language text not null default 'fr',
  category text,
  status text not null default 'draft'
    check (status in ('draft','testing','active','suspended','retired')),
  version integer not null default 1 check (version > 0),
  is_default boolean not null default false,
  last_tested_at timestamptz,
  last_test_status text check (last_test_status is null or last_test_status in ('success','failed')),
  last_test_message_id text,
  last_test_recipient text,
  activated_at timestamptz,
  activated_by text,
  suspended_at timestamptz,
  suspended_by text,
  suspension_reason text,
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now(),
  updated_by text,
  metadata_json jsonb not null default '{}'::jsonb
);

create index if not exists idx_email_os_sender_identities_status
  on public.email_os_sender_identities(status);
create index if not exists idx_email_os_sender_identities_address
  on public.email_os_sender_identities(lower(from_address));
create index if not exists idx_email_os_sender_identities_updated
  on public.email_os_sender_identities(updated_at desc);

create table if not exists public.email_os_sender_identity_versions (
  id text primary key default gen_random_uuid()::text,
  sender_identity_id text not null references public.email_os_sender_identities(id) on delete cascade,
  mailbox_id text not null,
  version integer not null,
  internal_name text not null,
  external_display_name text not null,
  from_address text not null,
  reply_to_name text,
  reply_to_address text,
  identity_mode text not null,
  brand_prefix text,
  default_language text,
  category text,
  status text not null,
  is_default boolean not null default false,
  snapshot_reason text,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by text,
  unique(sender_identity_id, version)
);

create index if not exists idx_email_os_sender_identity_versions_identity
  on public.email_os_sender_identity_versions(sender_identity_id, version desc);
create index if not exists idx_email_os_sender_identity_versions_mailbox
  on public.email_os_sender_identity_versions(mailbox_id, created_at desc);

create table if not exists public.email_os_sender_identity_audit (
  id text primary key default gen_random_uuid()::text,
  sender_identity_id text references public.email_os_sender_identities(id) on delete set null,
  mailbox_id text,
  actor_user_id text,
  actor_name text,
  actor_ip text,
  action text not null,
  result text not null default 'ok',
  reason text,
  previous_json jsonb,
  next_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_os_sender_identity_audit_created
  on public.email_os_sender_identity_audit(created_at desc);
create index if not exists idx_email_os_sender_identity_audit_identity
  on public.email_os_sender_identity_audit(sender_identity_id, created_at desc);
create index if not exists idx_email_os_sender_identity_audit_mailbox
  on public.email_os_sender_identity_audit(mailbox_id, created_at desc);

-- Mailbox-level fallback values remain useful when no active governed identity exists.
alter table if exists public.email_os_core_mailboxes
  add column if not exists sender_display_name text,
  add column if not exists reply_to_name text,
  add column if not exists reply_to_address text;

-- Persist the exact sender identity used by sent and queued messages.
alter table if exists public.email_os_core_outbox
  add column if not exists sender_identity_id text,
  add column if not exists sender_identity_version integer,
  add column if not exists resolved_from_name text,
  add column if not exists resolved_reply_to_name text,
  add column if not exists resolved_reply_to_address text;

alter table if exists public.email_os_core_queue
  add column if not exists sender_identity_id text,
  add column if not exists sender_identity_version integer,
  add column if not exists freeze_sender_identity boolean not null default false;

alter table if exists public.email_os_core_drafts
  add column if not exists sender_identity_id text,
  add column if not exists sender_identity_version integer,
  add column if not exists freeze_sender_identity boolean not null default false;

-- Service-role APIs exclusively govern these administrative tables.
alter table public.email_os_sender_identities enable row level security;
alter table public.email_os_sender_identity_versions enable row level security;
alter table public.email_os_sender_identity_audit enable row level security;

-- Initial brand-standard identities for every existing Email OS mailbox.
insert into public.email_os_sender_identities (
  mailbox_id,
  internal_name,
  external_display_name,
  from_address,
  reply_to_name,
  reply_to_address,
  identity_mode,
  brand_prefix,
  category,
  status,
  version,
  is_default,
  last_test_status,
  activated_at,
  activated_by,
  created_by,
  updated_by,
  metadata_json
)
select
  m.id::text,
  coalesce(nullif(trim(m.name), ''), split_part(m.address, '@', 1)),
  case
    when lower(m.address) like 'supports@%' or lower(m.address) like 'support@%' then 'ANGELCARE Support Client'
    when lower(m.address) like 'ops@%' then 'ANGELCARE Operations'
    when lower(m.address) like 'academy@%' then 'ANGELCARE Academy'
    when lower(m.address) like 'partenaires@%' or lower(m.address) like 'partners@%' then 'ANGELCARE Partenariats'
    when lower(m.address) like 'rh@%' then 'ANGELCARE Ressources Humaines'
    when lower(m.address) like 'b2b@%' then 'ANGELCARE Business Partnerships'
    when lower(m.address) like 'it.support@%' then 'ANGELCARE IT Support'
    when lower(m.address) like 'montessori@%' then 'ANGELCARE Montessori'
    when lower(m.address) like 'homeservice@%' or lower(m.address) like 'home.service@%' then 'ANGELCARE Home Service'
    when lower(m.address) like 'events@%' then 'ANGELCARE Événements'
    when lower(m.address) like 'excursions@%' then 'ANGELCARE Excursions'
    when lower(m.address) like 'commercial@%' then 'ANGELCARE Commercial'
    else 'ANGELCARE ' || coalesce(nullif(trim(m.name), ''), initcap(replace(split_part(m.address, '@', 1), '.', ' ')))
  end,
  lower(trim(m.address)),
  case
    when lower(m.address) like 'supports@%' or lower(m.address) like 'support@%' then 'Équipe Support ANGELCARE'
    when lower(m.address) like 'ops@%' then 'Équipe Opérations ANGELCARE'
    when lower(m.address) like 'academy@%' then 'Équipe ANGELCARE Academy'
    else 'Équipe ANGELCARE'
  end,
  lower(trim(m.address)),
  'corporate',
  'ANGELCARE',
  coalesce(nullif(trim(m.name), ''), 'Email OS'),
  'active',
  1,
  true,
  null,
  now(),
  'migration:20260719',
  'migration:20260719',
  'migration:20260719',
  jsonb_build_object('seeded', true, 'source', 'email_os_core_mailboxes')
from public.email_os_core_mailboxes m
where nullif(trim(m.address), '') is not null
on conflict (mailbox_id) do nothing;

insert into public.email_os_sender_identity_versions (
  sender_identity_id,
  mailbox_id,
  version,
  internal_name,
  external_display_name,
  from_address,
  reply_to_name,
  reply_to_address,
  identity_mode,
  brand_prefix,
  default_language,
  category,
  status,
  is_default,
  snapshot_reason,
  snapshot_json,
  created_by
)
select
  i.id,
  i.mailbox_id,
  i.version,
  i.internal_name,
  i.external_display_name,
  i.from_address,
  i.reply_to_name,
  i.reply_to_address,
  i.identity_mode,
  i.brand_prefix,
  i.default_language,
  i.category,
  i.status,
  i.is_default,
  'Initial sender identity control-plane seed',
  to_jsonb(i),
  coalesce(i.created_by, 'migration:20260719')
from public.email_os_sender_identities i
on conflict (sender_identity_id, version) do nothing;

-- Keep mailbox fallback headers aligned with the seeded active identity.
update public.email_os_core_mailboxes m
set
  sender_display_name = coalesce(nullif(m.sender_display_name, ''), i.external_display_name),
  reply_to_name = coalesce(nullif(m.reply_to_name, ''), i.reply_to_name),
  reply_to_address = coalesce(nullif(m.reply_to_address, ''), i.reply_to_address),
  updated_at = now()
from public.email_os_sender_identities i
where i.mailbox_id = m.id::text
  and i.status = 'active';

-- Register the sender-identity governance permissions when the Email OS role registry exists.
do $$
begin
  if to_regclass('public.email_os_core_role_permissions') is not null then
    insert into public.email_os_core_role_permissions (id, role_key, permission_key, permission_scope)
    select gen_random_uuid()::text, role_key, permission_key, 'global'
    from (values
      ('admin','email_os.sender_identity.view'),
      ('admin','email_os.sender_identity.manage'),
      ('admin','email_os.sender_identity.test'),
      ('admin','email_os.sender_identity.activate'),
      ('admin','email_os.sender_identity.rollback'),
      ('admin','email_os.sender_identity.bulk_manage'),
      ('super_admin','email_os.sender_identity.view'),
      ('super_admin','email_os.sender_identity.manage'),
      ('super_admin','email_os.sender_identity.test'),
      ('super_admin','email_os.sender_identity.activate'),
      ('super_admin','email_os.sender_identity.rollback'),
      ('super_admin','email_os.sender_identity.bulk_manage'),
      ('ceo','email_os.sender_identity.view'),
      ('ceo','email_os.sender_identity.manage'),
      ('ceo','email_os.sender_identity.test'),
      ('ceo','email_os.sender_identity.activate'),
      ('ceo','email_os.sender_identity.rollback'),
      ('ceo','email_os.sender_identity.bulk_manage')
    ) as permission_seed(role_key, permission_key)
    where not exists (
      select 1
      from public.email_os_core_role_permissions existing
      where existing.role_key = permission_seed.role_key
        and existing.permission_key = permission_seed.permission_key
        and existing.permission_scope = 'global'
    );
  end if;
end $$;
