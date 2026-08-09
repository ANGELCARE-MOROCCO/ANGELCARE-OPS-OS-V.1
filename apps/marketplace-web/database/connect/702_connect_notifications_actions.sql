create table if not exists public.connect_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  audience text not null default 'selected',
  title text not null,
  body text,
  priority text not null default 'normal',
  read boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.connect_actions (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'connect',
  source_message_id uuid,
  title text not null,
  owner_id uuid,
  status text not null default 'open',
  priority text not null default 'normal',
  due_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
