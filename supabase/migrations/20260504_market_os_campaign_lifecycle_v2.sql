create table if not exists market_os_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft',
  stage text not null default 'strategy',
  owner text,
  city text,
  channel_mix jsonb not null default '[]'::jsonb,
  objective text,
  target_audience text,
  offer text,
  budget numeric not null default 0,
  spent numeric not null default 0,
  leads integer not null default 0,
  qualified_leads integer not null default 0,
  conversions integer not null default 0,
  revenue numeric not null default 0,
  risk_score integer not null default 0,
  readiness_score integer not null default 70,
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_os_campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references market_os_campaigns(id) on delete cascade,
  title text not null,
  owner text,
  status text not null default 'queued',
  priority text not null default 'normal',
  workstream text not null default 'General',
  due_date date,
  dependency text,
  proof_required boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market_os_campaign_approvals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references market_os_campaigns(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  requested_by text,
  approver text,
  decision_note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists market_os_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references market_os_campaigns(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_os_campaigns_stage on market_os_campaigns(stage);
create index if not exists idx_market_os_campaigns_status on market_os_campaigns(status);
create index if not exists idx_market_os_campaign_tasks_campaign on market_os_campaign_tasks(campaign_id);
create index if not exists idx_market_os_campaign_events_campaign on market_os_campaign_events(campaign_id);

insert into market_os_campaigns (title,status,stage,owner,city,channel_mix,objective,target_audience,offer,budget,spent,leads,qualified_leads,conversions,revenue,risk_score,readiness_score,metadata)
values
('Rabat Childcare Lead Capture','active','live','Marketing Lead','Rabat / Témara','["Meta","WhatsApp","Landing Page"]','Qualified leads','Mothers 25-45','Book a trusted childcare assessment',12000,5400,86,44,13,39000,18,91,'{"source":"v2_seed"}'::jsonb),
('Senior Care Trust Authority','risk','optimize','Growth Manager','Rabat / Salé','["SEO Blog","Partners Network","WhatsApp"]','Qualified leads','Adult children managing senior care','Senior care consultation with follow-up',10000,7300,41,17,4,22000,62,78,'{"source":"v2_seed"}'::jsonb)
on conflict do nothing;
