-- AngelCare 360 Operator — Tenants & Product Workspace Finalization
-- Additive lifecycle/version governance over the installed Product Kernel.

begin;

alter table public.angelcare360_operator_product_modules
  add column if not exists supersedes_id uuid references public.angelcare360_operator_product_modules(id) on delete set null,
  add column if not exists owner_role text,
  add column if not exists lifecycle_note text,
  add column if not exists published_at timestamptz,
  add column if not exists deprecated_at timestamptz,
  add column if not exists retired_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

alter table public.angelcare360_operator_product_features
  add column if not exists version text not null default '1.0.0',
  add column if not exists supersedes_id uuid references public.angelcare360_operator_product_features(id) on delete set null,
  add column if not exists owner_role text,
  add column if not exists lifecycle_note text,
  add column if not exists published_at timestamptz,
  add column if not exists deprecated_at timestamptz,
  add column if not exists retired_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

alter table public.angelcare360_operator_product_addons
  add column if not exists version text not null default '1.0.0',
  add column if not exists supersedes_id uuid references public.angelcare360_operator_product_addons(id) on delete set null,
  add column if not exists owner_role text,
  add column if not exists lifecycle_note text,
  add column if not exists published_at timestamptz,
  add column if not exists deprecated_at timestamptz,
  add column if not exists retired_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

alter table public.angelcare360_operator_product_meters
  add column if not exists version text not null default '1.0.0',
  add column if not exists supersedes_id uuid references public.angelcare360_operator_product_meters(id) on delete set null,
  add column if not exists owner_role text,
  add column if not exists lifecycle_note text,
  add column if not exists published_at timestamptz,
  add column if not exists deprecated_at timestamptz,
  add column if not exists retired_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

alter table public.angelcare360_operator_package_versions
  add column if not exists supersedes_id uuid references public.angelcare360_operator_package_versions(id) on delete set null,
  add column if not exists owner_role text,
  add column if not exists lifecycle_note text,
  add column if not exists deprecated_at timestamptz,
  add column if not exists retired_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

alter table public.angelcare360_operator_price_books
  add column if not exists supersedes_id uuid references public.angelcare360_operator_price_books(id) on delete set null,
  add column if not exists version_code text not null default '1.0',
  add column if not exists owner_role text,
  add column if not exists lifecycle_note text,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid,
  add column if not exists retired_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

-- Replace single-key uniqueness with version-aware uniqueness.
alter table public.angelcare360_operator_product_modules
  drop constraint if exists angelcare360_operator_product_modules_module_key_key;
alter table public.angelcare360_operator_product_features
  drop constraint if exists angelcare360_operator_product_features_feature_key_key;
alter table public.angelcare360_operator_product_addons
  drop constraint if exists angelcare360_operator_product_addons_addon_code_key;
alter table public.angelcare360_operator_product_meters
  drop constraint if exists angelcare360_operator_product_meters_meter_key_key;
alter table public.angelcare360_operator_price_books
  drop constraint if exists angelcare360_operator_price_books_price_book_code_key;

create unique index if not exists ac360_product_modules_key_version_uidx
  on public.angelcare360_operator_product_modules(module_key, version);
create unique index if not exists ac360_product_features_key_version_uidx
  on public.angelcare360_operator_product_features(feature_key, version);
create unique index if not exists ac360_product_addons_code_version_uidx
  on public.angelcare360_operator_product_addons(addon_code, version);
create unique index if not exists ac360_product_meters_key_version_uidx
  on public.angelcare360_operator_product_meters(meter_key, version);
create unique index if not exists ac360_price_books_code_version_uidx
  on public.angelcare360_operator_price_books(price_book_code, version_code);

-- Expand governed lifecycle values.
alter table public.angelcare360_operator_product_modules
  drop constraint if exists angelcare360_operator_product_modules_status_check;
alter table public.angelcare360_operator_product_modules
  add constraint angelcare360_operator_product_modules_status_check
  check (status in ('draft','review','published','suspended','deprecated','retired','archived'));

alter table public.angelcare360_operator_product_features
  drop constraint if exists angelcare360_operator_product_features_status_check;
alter table public.angelcare360_operator_product_features
  add constraint angelcare360_operator_product_features_status_check
  check (status in ('draft','review','published','suspended','deprecated','retired','archived'));

alter table public.angelcare360_operator_product_addons
  drop constraint if exists angelcare360_operator_product_addons_status_check;
alter table public.angelcare360_operator_product_addons
  add constraint angelcare360_operator_product_addons_status_check
  check (status in ('draft','review','published','suspended','deprecated','retired','archived'));

alter table public.angelcare360_operator_product_meters
  drop constraint if exists angelcare360_operator_product_meters_status_check;
alter table public.angelcare360_operator_product_meters
  add constraint angelcare360_operator_product_meters_status_check
  check (status in ('draft','review','published','suspended','deprecated','retired','archived'));

alter table public.angelcare360_operator_package_versions
  drop constraint if exists angelcare360_operator_package_versions_status_check;
alter table public.angelcare360_operator_package_versions
  add constraint angelcare360_operator_package_versions_status_check
  check (status in ('draft','scanned','commercial_review','operational_review','approved','published','suspended','deprecated','retired','archived'));

alter table public.angelcare360_operator_price_books
  drop constraint if exists angelcare360_operator_price_books_status_check;
alter table public.angelcare360_operator_price_books
  add constraint angelcare360_operator_price_books_status_check
  check (status in ('draft','approved','scheduled','active','expired','retired','archived'));

update public.angelcare360_operator_product_modules
set published_at = coalesce(published_at, created_at)
where status = 'published';

update public.angelcare360_operator_product_features
set published_at = coalesce(published_at, created_at)
where status = 'published';

update public.angelcare360_operator_product_addons
set published_at = coalesce(published_at, created_at)
where status = 'published';

update public.angelcare360_operator_product_meters
set published_at = coalesce(published_at, created_at)
where status = 'published';

commit;
