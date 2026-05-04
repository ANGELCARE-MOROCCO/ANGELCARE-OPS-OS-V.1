-- HR V2 Human Execution Engine
-- Manual-first production layer: bulk jobs, workflow chains, action comments, roster templates, form submissions.
create extension if not exists pgcrypto;

create table if not exists public.hr_bulk_operations (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null,
  target_user_ids uuid[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  executed_by uuid,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_workflow_chains (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  workflow_type text not null,
  status text not null default 'active',
  steps jsonb not null default '[]'::jsonb,
  owner_user_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_workflow_events (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid,
  user_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_action_comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  user_id uuid,
  comment text not null,
  visibility text not null default 'internal',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_roster_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  department text,
  duty_type text default 'standard',
  template jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  target_user_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.hr_workflow_chains(title, workflow_type, steps)
values
('Leave approval to replacement workflow','leave_to_replacement','[{"step":"Review leave request"},{"step":"Check roster impact"},{"step":"Assign replacement"},{"step":"Notify staff"}]'::jsonb),
('Document expiry compliance workflow','document_compliance','[{"step":"Detect expiry"},{"step":"Request renewal"},{"step":"Verify document"},{"step":"Close compliance item"}]'::jsonb),
('Incident corrective action workflow','incident_corrective','[{"step":"Classify incident"},{"step":"Assign supervisor"},{"step":"Record corrective action"},{"step":"Close with learning note"}]'::jsonb),
('Training to placement workflow','training_to_placement','[{"step":"Complete training"},{"step":"Validate certification"},{"step":"Assign placement"},{"step":"Monitor first mission"}]'::jsonb)
on conflict do nothing;

insert into public.hr_roster_templates(name, department, duty_type, template)
values
('Office Standard Week','Core Office Staff','standard','{"days":["Mon","Tue","Wed","Thu","Fri"],"start":"10:00","end":"18:00"}'::jsonb),
('Care Operations Coverage','Care Operations','field','{"coverage":"monthly","shift_blocks":["morning","afternoon","night"],"requires_backup":true}'::jsonb),
('Sales Office Week','Revenue / Sales','standard','{"days":["Mon","Tue","Wed","Thu","Fri"],"start":"10:00","end":"18:00","targets":true}'::jsonb)
on conflict(name) do update set template=excluded.template, updated_at=now();
