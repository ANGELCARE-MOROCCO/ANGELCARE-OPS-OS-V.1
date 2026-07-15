-- ANGELCARE PROSPECTS REAL ACTION ENGINE V1
create extension if not exists pgcrypto;

create table if not exists public.prospect_contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  full_name text not null default 'N/A',
  role text not null default 'Contact',
  influence_level text not null default 'medium',
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_tasks (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'open',
  owner text not null default 'BD Officer',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_appointments (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  title text not null,
  appointment_at timestamptz not null,
  owner text not null default 'BD Officer',
  status text not null default 'scheduled',
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_documents (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  title text not null,
  file_url text,
  document_type text not null default 'profile',
  status text not null default 'active',
  created_by text not null default 'AngelCare',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospect_comments (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  author text not null default 'AngelCare',
  channel text not null default 'internal',
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  action text not null,
  note text,
  actor text not null default 'AngelCare',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.prospect_pipeline_history (
  id uuid primary key default gen_random_uuid(),
  prospect_id text not null,
  from_stage text,
  to_stage text not null,
  actor text not null default 'AngelCare',
  created_at timestamptz not null default now()
);

create table if not exists public.prospect_notifications (
  id uuid primary key default gen_random_uuid(),
  prospect_id text,
  title text not null,
  body text,
  status text not null default 'unread',
  severity text not null default 'info',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_prospect_tasks_touch on public.prospect_tasks;
create trigger trg_prospect_tasks_touch before update on public.prospect_tasks for each row execute function public.touch_updated_at();

drop trigger if exists trg_prospect_appointments_touch on public.prospect_appointments;
create trigger trg_prospect_appointments_touch before update on public.prospect_appointments for each row execute function public.touch_updated_at();

drop trigger if exists trg_prospect_documents_touch on public.prospect_documents;
create trigger trg_prospect_documents_touch before update on public.prospect_documents for each row execute function public.touch_updated_at();

drop trigger if exists trg_prospect_contacts_touch on public.prospect_contacts;
create trigger trg_prospect_contacts_touch before update on public.prospect_contacts for each row execute function public.touch_updated_at();

alter table public.prospect_contacts enable row level security;
alter table public.prospect_tasks enable row level security;
alter table public.prospect_appointments enable row level security;
alter table public.prospect_documents enable row level security;
alter table public.prospect_comments enable row level security;
alter table public.prospect_activities enable row level security;
alter table public.prospect_pipeline_history enable row level security;
alter table public.prospect_notifications enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'prospect_contacts','prospect_tasks','prospect_appointments','prospect_documents',
    'prospect_comments','prospect_activities','prospect_pipeline_history','prospect_notifications'
  ] loop
    execute format('drop policy if exists authenticated_all_%s on public.%I', t, t);
    execute format('create policy authenticated_all_%s on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

create or replace function public.prospect_create_activity(
  p_prospect_id text,
  p_action text,
  p_note text default null,
  p_actor text default 'AngelCare',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  insert into public.prospect_activities(prospect_id, action, note, actor, metadata)
  values (p_prospect_id, p_action, p_note, p_actor, coalesce(p_metadata, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.prospect_escalation_sweep()
returns integer language plpgsql security definer as $$
declare inserted_count integer;
begin
  insert into public.prospect_notifications(prospect_id, title, body, severity)
  select t.prospect_id,
         'Overdue prospect task',
         'Task "' || t.title || '" is overdue and needs action.',
         'warning'
  from public.prospect_tasks t
  where t.status = 'open'
    and t.due_date is not null
    and t.due_date < current_date
    and not exists (
      select 1 from public.prospect_notifications n
      where n.prospect_id = t.prospect_id
        and n.title = 'Overdue prospect task'
        and n.body like '%' || t.title || '%'
        and n.created_at > now() - interval '2 days'
    );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end $$;
