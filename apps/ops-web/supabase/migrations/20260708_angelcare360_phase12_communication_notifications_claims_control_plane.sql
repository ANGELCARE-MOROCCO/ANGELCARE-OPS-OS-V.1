-- Phase 12: communication, notifications, claims control plane
-- Additive only. No destructive rewrite of existing AngelCare 360 tables.

create table if not exists public.angelcare360_conversations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  conversation_code text not null,
  subject text not null,
  conversation_type text not null default 'internal',
  status text not null default 'open',
  last_message_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, conversation_code),
  check (status in ('open', 'archived', 'locked'))
);

create table if not exists public.angelcare360_conversation_participants (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  conversation_id uuid not null references public.angelcare360_conversations(id) on delete cascade,
  participant_app_user_id uuid references public.app_users(id) on delete set null,
  participant_student_id uuid references public.angelcare360_students(id) on delete set null,
  participant_parent_id uuid references public.angelcare360_parents(id) on delete set null,
  participant_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  participant_role text,
  read_at timestamptz,
  status text not null default 'active',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'archived'))
);

create table if not exists public.angelcare360_message_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  template_code text not null,
  channel text not null default 'in_app',
  name text not null,
  content text not null,
  audience_type text not null default 'all',
  status text not null default 'draft',
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id, template_code),
  check (status in ('draft', 'active', 'archived', 'external_locked'))
);

alter table public.angelcare360_messages
  add column if not exists conversation_id uuid references public.angelcare360_conversations(id) on delete set null;

alter table public.angelcare360_notifications
  add column if not exists recipient_student_id uuid references public.angelcare360_students(id) on delete set null,
  add column if not exists recipient_parent_id uuid references public.angelcare360_parents(id) on delete set null,
  add column if not exists recipient_staff_id uuid references public.angelcare360_staff(id) on delete set null;

alter table public.angelcare360_reclamations
  add column if not exists assigned_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  add column if not exists category text,
  add column if not exists submitted_by_parent_id uuid references public.angelcare360_parents(id) on delete set null,
  add column if not exists submitted_by_student_id uuid references public.angelcare360_students(id) on delete set null,
  add column if not exists submitted_by_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  add column if not exists resolution_summary text,
  add column if not exists internal_notes_json jsonb not null default '[]'::jsonb,
  add column if not exists status_history_json jsonb not null default '[]'::jsonb,
  add column if not exists closed_at timestamptz,
  add column if not exists assigned_at timestamptz;

alter table public.angelcare360_messages
  drop constraint if exists angelcare360_messages_status_check;
alter table public.angelcare360_messages
  add constraint angelcare360_messages_status_check
  check (status in ('draft', 'sent', 'sent_internal', 'read', 'archived', 'external_locked'));

alter table public.angelcare360_message_recipients
  drop constraint if exists angelcare360_message_recipients_delivery_status_check;
alter table public.angelcare360_message_recipients
  add constraint angelcare360_message_recipients_delivery_status_check
  check (delivery_status in ('pending', 'sent', 'sent_internal', 'delivered', 'delivered_internal', 'read', 'failed', 'blocked_external'));

alter table public.angelcare360_notifications
  drop constraint if exists angelcare360_notifications_status_check;
alter table public.angelcare360_notifications
  add constraint angelcare360_notifications_status_check
  check (status in ('scheduled', 'pending', 'sent', 'delivered', 'delivered_internal', 'read', 'failed', 'blocked_external', 'archived'));

alter table public.angelcare360_announcements
  drop constraint if exists angelcare360_announcements_status_check;
alter table public.angelcare360_announcements
  add constraint angelcare360_announcements_status_check
  check (status in ('draft', 'published', 'published_internal', 'archived', 'external_locked'));

alter table public.angelcare360_reclamations
  drop constraint if exists angelcare360_reclamations_priority_check;
alter table public.angelcare360_reclamations
  add constraint angelcare360_reclamations_priority_check
  check (priority in ('low', 'normal', 'medium', 'high', 'urgent', 'critical'));

alter table public.angelcare360_reclamations
  drop constraint if exists angelcare360_reclamations_status_check;
alter table public.angelcare360_reclamations
  add constraint angelcare360_reclamations_status_check
  check (status in ('new', 'open', 'in_review', 'in_progress', 'assigned', 'waiting_parent', 'waiting_internal', 'resolved', 'closed', 'archived'));

create index if not exists idx_angelcare360_conversations_school_status on public.angelcare360_conversations(school_id, status, last_message_at desc);
create index if not exists idx_angelcare360_conversation_participants_conversation on public.angelcare360_conversation_participants(conversation_id, status);
create index if not exists idx_angelcare360_message_templates_school_status on public.angelcare360_message_templates(school_id, status, channel);
create index if not exists idx_angelcare360_messages_conversation on public.angelcare360_messages(conversation_id, created_at desc);
create index if not exists idx_angelcare360_notifications_school_status_created on public.angelcare360_notifications(school_id, status, created_at desc);
create index if not exists idx_angelcare360_reclamations_school_status_priority on public.angelcare360_reclamations(school_id, status, priority, updated_at desc);
create index if not exists idx_angelcare360_reclamations_assigned_staff on public.angelcare360_reclamations(assigned_staff_id, status);

do $$
declare
  t text;
begin
  foreach t in array array[
    'angelcare360_conversations',
    'angelcare360_conversation_participants',
    'angelcare360_message_templates',
    'angelcare360_messages',
    'angelcare360_message_recipients',
    'angelcare360_notifications',
    'angelcare360_announcements',
    'angelcare360_reclamations'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.angelcare360_touch_updated_at()', t, t);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'angelcare360_conversations',
    'angelcare360_conversation_participants',
    'angelcare360_message_templates',
    'angelcare360_messages',
    'angelcare360_message_recipients',
    'angelcare360_notifications',
    'angelcare360_announcements',
    'angelcare360_reclamations'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'angelcare360_service_role_all', t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'angelcare360_service_role_all', t);
  end loop;
end $$;
