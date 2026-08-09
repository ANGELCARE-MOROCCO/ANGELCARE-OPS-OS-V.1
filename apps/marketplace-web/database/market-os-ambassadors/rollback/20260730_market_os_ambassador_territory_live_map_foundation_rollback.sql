begin;

-- Explicit rollback for the Ambassador Territory Live Map geographic foundation.
-- Run only when the frontend patch has already been rolled back and the normalized
-- geographic data is no longer required.

drop trigger if exists market_os_ambassador_sync_territory_geography_trigger
  on public.market_os_ambassador_territories;

drop function if exists public.market_os_ambassador_sync_territory_geography();
drop function if exists public.market_os_ambassador_safe_double(text);

drop index if exists public.market_os_ambassador_territories_city_region_map_idx;
drop index if exists public.market_os_ambassador_territories_center_map_idx;
drop index if exists public.market_os_ambassador_territories_geometry_geojson_gin_idx;

alter table public.market_os_ambassador_territories
  drop constraint if exists market_os_ambassador_territories_latitude_check,
  drop constraint if exists market_os_ambassador_territories_longitude_check,
  drop constraint if exists market_os_ambassador_territories_radius_check,
  drop constraint if exists market_os_ambassador_territories_geometry_type_check,
  drop column if exists center_latitude,
  drop column if exists center_longitude,
  drop column if exists radius_meters,
  drop column if exists geometry_type,
  drop column if exists geometry_geojson,
  drop column if exists area_square_km,
  drop column if exists osm_object_type,
  drop column if exists osm_object_id,
  drop column if exists osm_display_name,
  drop column if exists geography_updated_at;

commit;
