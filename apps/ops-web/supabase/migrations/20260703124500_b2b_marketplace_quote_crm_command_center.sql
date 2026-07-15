-- ============================================================
-- ANGELCARE B2B MARKETPLACE CRM / QUOTE REQUESTS COMMAND CENTER
-- Production synced commercial fulfillment layer
-- ============================================================

alter table public.b2b_marketplace_quote_requests add column if not exists priority text not null default 'normal';
alter table public.b2b_marketplace_quote_requests add column if not exists request_type text not null default 'quote_cart';
alter table public.b2b_marketplace_quote_requests add column if not exists assigned_to uuid;
alter table public.b2b_marketplace_quote_requests add column if not exists assigned_name text;
alter table public.b2b_marketplace_quote_requests add column if not exists next_action text;
alter table public.b2b_marketplace_quote_requests add column if not exists follow_up_at timestamptz;
alter table public.b2b_marketplace_quote_requests add column if not exists source_page text;
alter table public.b2b_marketplace_quote_requests add column if not exists origin_url text;
alter table public.b2b_marketplace_quote_requests add column if not exists archived_at timestamptz;
alter table public.b2b_marketplace_quote_requests add column if not exists lost_reason text;
alter table public.b2b_marketplace_quote_requests add column if not exists internal_summary text;
alter table public.b2b_marketplace_quote_requests add column if not exists last_contacted_at timestamptz;

alter table public.b2b_marketplace_quote_lines add column if not exists source_page text;
alter table public.b2b_marketplace_quote_lines add column if not exists item_slug text;
alter table public.b2b_marketplace_quote_lines add column if not exists item_payload jsonb not null default '{}'::jsonb;

create table if not exists public.b2b_marketplace_quote_notes (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  note text not null,
  note_type text not null default 'internal',
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_status_history (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid,
  changed_by_name text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_assignments (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  assigned_to uuid,
  assigned_to_name text,
  assigned_by uuid,
  assigned_by_name text,
  priority text not null default 'normal',
  next_action text,
  follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_activity_logs (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  activity_type text not null default 'manual',
  title text not null,
  description text,
  actor_user_id uuid,
  actor_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_followups (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  follow_up_at timestamptz not null,
  channel text not null default 'phone',
  objective text,
  status text not null default 'planned',
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.b2b_marketplace_quote_documents (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  document_type text not null default 'summary',
  title text not null,
  file_url text,
  status text not null default 'draft',
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_marketplace_quote_proposals (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.b2b_marketplace_quote_requests(id) on delete cascade,
  proposal_reference text unique not null,
  status text not null default 'draft',
  total_mad numeric(12,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz
);

create index if not exists b2b_marketplace_quote_requests_priority_idx on public.b2b_marketplace_quote_requests(priority);
create index if not exists b2b_marketplace_quote_requests_request_type_idx on public.b2b_marketplace_quote_requests(request_type);
create index if not exists b2b_marketplace_quote_requests_city_idx on public.b2b_marketplace_quote_requests(city);
create index if not exists b2b_marketplace_quote_requests_created_idx on public.b2b_marketplace_quote_requests(created_at desc);
create index if not exists b2b_marketplace_quote_lines_request_idx on public.b2b_marketplace_quote_lines(quote_request_id);
create index if not exists b2b_marketplace_quote_notes_request_idx on public.b2b_marketplace_quote_notes(quote_request_id);
create index if not exists b2b_marketplace_quote_status_history_request_idx on public.b2b_marketplace_quote_status_history(quote_request_id);
create index if not exists b2b_marketplace_quote_activity_logs_request_idx on public.b2b_marketplace_quote_activity_logs(quote_request_id);

alter table public.b2b_marketplace_quote_notes enable row level security;
alter table public.b2b_marketplace_quote_status_history enable row level security;
alter table public.b2b_marketplace_quote_assignments enable row level security;
alter table public.b2b_marketplace_quote_activity_logs enable row level security;
alter table public.b2b_marketplace_quote_followups enable row level security;
alter table public.b2b_marketplace_quote_documents enable row level security;
alter table public.b2b_marketplace_quote_proposals enable row level security;

-- Public cannot read CRM records; all admin access is through the Next.js server using service role.
-- Service role bypasses RLS; keep these tables protected from anonymous frontend reads.
