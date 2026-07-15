
-- V68 Smoke Test Hotfix
-- Makes comments compatible with both created_at and updated_at ordering.

alter table public.content_command_comments
add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_content_command_comments_updated_at on public.content_command_comments;
create trigger set_content_command_comments_updated_at
before update on public.content_command_comments
for each row execute function public.set_updated_at();
