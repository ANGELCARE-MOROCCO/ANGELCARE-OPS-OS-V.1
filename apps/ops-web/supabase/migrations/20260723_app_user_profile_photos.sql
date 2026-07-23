begin;

alter table public.app_users
  add column if not exists profile_photo_path text;

comment on column public.app_users.profile_photo_path is
  'Private Supabase Storage object path for the staff identity portrait displayed in SANILA OS.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'staff-profile-photos',
  'staff-profile-photos',
  false,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

commit;
