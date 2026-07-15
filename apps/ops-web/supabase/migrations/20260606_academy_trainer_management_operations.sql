create table if not exists academy_trainer_payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null,
  cohort_id bigint null,
  program_id bigint null,
  payment_reference text,
  label text not null default 'Trainer payment',
  amount_dhs numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','rejected','cancelled')),
  payment_method text,
  payment_details text,
  due_date date,
  paid_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_trainer_payments_trainer_id_idx
  on academy_trainer_payments(trainer_id);

create index if not exists academy_trainer_payments_status_idx
  on academy_trainer_payments(status);

create table if not exists academy_trainer_operational_notes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null,
  cohort_id bigint null,
  category text not null default 'admin',
  note text not null default '',
  status text not null default 'open',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_trainer_operational_notes_trainer_id_idx
  on academy_trainer_operational_notes(trainer_id);

create index if not exists academy_trainer_operational_notes_category_idx
  on academy_trainer_operational_notes(category);
