create table if not exists public.capital_command_trainings (
  id bigserial primary key,
  reference_number text unique not null,
  training_title text not null default '',
  category text not null default 'capital_operations',
  status text not null default 'draft',
  audience text not null default 'finance_team',
  estimated_minutes integer not null default 15,
  owner text null,
  summary text null,
  html_content text null,
  currency text null default 'Dhs',
  data jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_capital_command_trainings_status on public.capital_command_trainings(status);
create index if not exists idx_capital_command_trainings_category on public.capital_command_trainings(category);
create index if not exists idx_capital_command_trainings_reference on public.capital_command_trainings(reference_number);
