create table if not exists email_os_core_comments (
  id text primary key,
  thread_id text,
  author text,
  body text not null,
  mentions text[],
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_notifications (
  id text primary key,
  category text not null,
  title text not null,
  body text,
  status text not null default 'unread',
  actor text,
  created_at timestamptz not null default now()
);

alter table email_os_core_comments disable row level security;
alter table email_os_core_notifications disable row level security;

create index if not exists email_os_core_comments_thread_idx on email_os_core_comments(thread_id);
create index if not exists email_os_core_notifications_status_idx on email_os_core_notifications(status);
